package main

import (
	"bytes"
	"encoding/json"
	"errors"
	"fmt"
	"image"
	"io"
	"log"
	"mime/multipart"
	"net/http"

	_ "image/jpeg"
	_ "image/png"

	"github.com/nfnt/resize"
)

func classifyWasteWithIBMCloud(fileHeader *multipart.FileHeader) (*ClassificationResult, error) {
	log.Println("=== Начало классификации ===")

	// 1. Открываем файл
	file, err := fileHeader.Open()
	if err != nil {
		return nil, fmt.Errorf("ошибка открытия файла: %w", err)
	}
	defer file.Close()

	// 2. Декодируем изображение
	img, _, err := image.Decode(file)
	if err != nil {
		return nil, fmt.Errorf("ошибка декодирования изображения: %w", err)
	}
	log.Println("[OK] Изображение загружено")

	// 3. Ресайзим до 224x224 (подтвердите размер для вашей модели)
	resizedImg := resize.Resize(224, 224, img, resize.Lanczos3)
	log.Println("[OK] Изображение ресайзнуто до 224x224")

	// 4. Преобразуем изображение в числовой тензор
	bounds := resizedImg.Bounds()
	width, height := bounds.Max.X, bounds.Max.Y
	channels := 3 // RGB
	tensor := make([][][]float32, height)
	for y := 0; y < height; y++ {
		tensor[y] = make([][]float32, width)
		for x := 0; x < width; x++ {
			tensor[y][x] = make([]float32, channels)
			r, g, b, _ := resizedImg.At(x, y).RGBA()
			// Нормализация до [0, 1]
			tensor[y][x][0] = float32(r>>8) / 255.0
			tensor[y][x][1] = float32(g>>8) / 255.0
			tensor[y][x][2] = float32(b>>8) / 255.0
		}
	}
	log.Println("[OK] Изображение преобразовано в тензор")

	// 5. Формируем payload в формате IBM API
	payload := map[string]interface{}{
		"input_data": []map[string]interface{}{
			{
				"fields": []string{"input_1"}, // имя входа модели
				"values": []interface{}{
					tensor, // теперь без лишнего уровня
				},
			},
		},
	}

	jsonPayload, err := json.Marshal(payload)
	if err != nil {
		return nil, fmt.Errorf("ошибка сериализации JSON: %w", err)
	}
	log.Printf("[DEBUG] Payload размер: %d байт\n", len(jsonPayload))

	// 6. Получаем токен IBM
	token, err := getIBMCloudToken()
	if err != nil {
		return nil, fmt.Errorf("ошибка получения токена: %w", err)
	}
	log.Println("[OK] Токен IBM получен")

	// 7. Отправляем запрос
	deploymentURL := "https://ca-tor.ml.cloud.ibm.com/ml/v4/deployments/58ba1bdd-7339-4d5c-b893-e4fb5cb33657/predictions?version=2021-05-01"
	req, err := http.NewRequest("POST", deploymentURL, bytes.NewBuffer(jsonPayload))
	if err != nil {
		return nil, fmt.Errorf("ошибка формирования запроса: %w", err)
	}
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Authorization", "Bearer "+token)

	log.Println("[INFO] Отправляем запрос к IBM API...")
	client := &http.Client{}
	resp, err := client.Do(req)
	if err != nil {
		return nil, fmt.Errorf("ошибка при запросе к IBM API: %w", err)
	}
	defer resp.Body.Close()

	log.Printf("[INFO] Статус ответа IBM: %s\n", resp.Status)

	// Читаем тело ответа
	rawBody, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, fmt.Errorf("ошибка чтения ответа: %w", err)
	}
	log.Println("=== RAW Response IBM ===")
	log.Println(string(rawBody))

	var result map[string]interface{}
	if err := json.Unmarshal(rawBody, &result); err != nil {
		return nil, fmt.Errorf("ошибка парсинга JSON ответа: %w", err)
	}

	return parseClassificationResult(result)
}

func getIBMCloudToken() (string, error) {
	apiKey := "5ufiWnVln-Y6ZtjowVINBwZDFHEUWrCFn9BiP-qOFF4p"
	if apiKey == "" {
		return "", errors.New("IBM API key not set")
	}

	data := "grant_type=urn:ibm:params:oauth:grant-type:apikey&apikey=" + apiKey
	req, err := http.NewRequest("POST", "https://iam.cloud.ibm.com/identity/token", bytes.NewBufferString(data))
	if err != nil {
		return "", err
	}

	req.Header.Set("Content-Type", "application/x-www-form-urlencoded")
	req.Header.Set("Accept", "application/json")

	client := &http.Client{}
	resp, err := client.Do(req)
	if err != nil {
		return "", err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return "", fmt.Errorf("failed to get IBM Cloud token, status: %s", resp.Status)
	}

	var tokenResp struct {
		AccessToken string `json:"access_token"`
	}
	if err := json.NewDecoder(resp.Body).Decode(&tokenResp); err != nil {
		return "", err
	}

	if tokenResp.AccessToken == "" {
		return "", errors.New("empty access token from IBM Cloud")
	}

	return tokenResp.AccessToken, nil
}

func parseClassificationResult(result map[string]interface{}) (*ClassificationResult, error) {
	preds, ok := result["predictions"].([]interface{})
	if !ok || len(preds) == 0 {
		return nil, errors.New("нет predictions в ответе")
	}

	predMap, ok := preds[0].(map[string]interface{})
	if !ok {
		return nil, errors.New("формат predictions некорректен")
	}

	// Проверяем, есть ли fields
	fields, _ := predMap["fields"].([]interface{})
	values, ok := predMap["values"].([]interface{})
	if !ok || len(values) == 0 {
		return nil, errors.New("нет values в predictions")
	}

	firstRow, ok := values[0].([]interface{})
	if !ok || len(firstRow) == 0 {
		return nil, errors.New("формат values некорректен")
	}

	// Вариант 1: fields содержит "class" и "confidence"
	if len(fields) > 0 {
		fieldMap := make(map[string]interface{})
		for i, f := range fields {
			if i < len(firstRow) {
				fieldMap[fmt.Sprintf("%v", f)] = firstRow[i]
			}
		}
		category := fmt.Sprintf("%v", fieldMap["class"])
		conf, _ := fieldMap["confidence"].(float64)
		return &ClassificationResult{
			Category:   category,
			Confidence: conf,
		}, nil
	}

	// Вариант 2: просто массив вероятностей
	probs := make([]float64, len(firstRow))
	for i, v := range firstRow {
		if f, ok := v.(float64); ok {
			probs[i] = f
		}
	}

	maxIdx := 0
	for i := 1; i < len(probs); i++ {
		if probs[i] > probs[maxIdx] {
			maxIdx = i
		}
	}

	// Мапим к известным классам
	classNames := []string{"cardboard", "glass", "metal", "paper", "plastic", "trash"}
	category := "unknown"
	if maxIdx < len(classNames) {
		category = classNames[maxIdx]
	}

	return &ClassificationResult{
		Category:   category,
		Confidence: probs[maxIdx],
	}, nil
}
