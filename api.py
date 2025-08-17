






import requests
import base64
from PIL import Image
import io
import json

# ---------- Настройки ----------
API_KEY = "kKSQiWIB7PeE24EnCNaI9v5kLHtbQXstutobqC7CscuD"  # вставь свой API ключ
DEPLOYMENT_URL = "https://eu-de.ml.cloud.ibm.com/ml/v4/deployments/trai/predictions?version=2021-05-01"

# Классы модели (совпадает с train_generator.class_indices)
class_indices = {
    'cardboard': 0,
    'glass': 1,
    'metal': 2,
    'paper': 3,
    'plastic': 4,
    'trash': 5
}

# ---------- Получение IAM токена ----------
token_response = requests.post(
    'https://iam.cloud.ibm.com/identity/token',
    data={
        "apikey": API_KEY,
        "grant_type": 'urn:ibm:params:oauth:grant-type:apikey'
    }
)
mltoken = token_response.json()["access_token"]
headers = {'Content-Type': 'application/json', 'Authorization': 'Bearer ' + mltoken}

# ---------- Загрузка и подготовка изображения ----------
image_path = r"C:\Users\askar\trash_dataset\val\glass\glass4.jpg"
  # путь к изображению
img = Image.open(image_path).resize((224, 224))
img_array = list(img.getdata())  # перевод в список пикселей
img_array = [[pixel[:3] if len(pixel) > 3 else pixel for pixel in img_array]]  # RGB

# ---------- Формирование запроса ----------
payload_scoring = {
    "input_data": [
        {
            "fields": ["R", "G", "B"],  # можно оставить пустым, главное values
            "values": img_array
        }
    ]
}

# ---------- Отправка запроса ----------
response_scoring = requests.post(DEPLOYMENT_URL, json=payload_scoring, headers=headers)

# ---------- Разбор ответа ----------
result = response_scoring.json()
pred_values = result['predictions'][0]['values'][0]
pred_class_idx = pred_values.index(max(pred_values))
for name, idx in class_indices.items():
    if idx == pred_class_idx:
        print(f"Предсказанный класс: {name} с вероятностью {pred_values[pred_class_idx]:.2f}")
