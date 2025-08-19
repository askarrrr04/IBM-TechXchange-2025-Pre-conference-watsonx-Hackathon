# ♻️ Trash Classification AI – IBM TechXchange 2025 Hackathon

This project was developed for the **IBM TechXchange 2025 Pre-conference Watsonx Hackathon**.  
It focuses on building an **AI-powered trash classification system** using **EfficientNet** and **MobileNet** models, integrated with a **Go backend** and IBM Cloud services.

---

## 📂 Repository Structure

├── Dataset/ # Training and validation datasets
├── efficientnet_trash_savedmodel/ # Saved TensorFlow model (EfficientNet)
├── templates/ # UI templates (if used in web app)
├── api.py # Python API for inference
├── api2.py # Alternative Python API version
├── split_dataset.py # Script to split raw dataset into train/val
├── requirements.txt # Python dependencies
├── *.h5 (Keras models) # Different versions of trained models
├── *.onnx # ONNX export of EfficientNet
├── go.mod / go.sum # Go project dependencies
├── main.go # Go backend entrypoint
├── handlers.go / models.go / ibm_client.go # Go application logic
├── *.docx # Documentation files

markdown
Копировать
Редактировать

---

## 🚀 Features
- **Deep Learning Models**:
  - `EfficientNetB0` (fine-tuned on trash dataset)
  - `MobileNetV2` (lightweight alternative)
- **Multiple Export Formats**:
  - `.h5` (Keras)
  - `.onnx` (for cross-platform inference)
  - TensorFlow `SavedModel`
- **Go Backend**:
  - Written in Go (`main.go`, `handlers.go`)
  - Uses IBM Watsonx/Cloud integration
- **Python APIs** (`api.py`, `api2.py`) for running inference.

---https://www.youtube.com/watch?v=rdguKTRwYmk

## ⚙️ Installation

### Python
```bash
# Clone repo
git clone https://github.com/askarrrr04/IBM-TechXchange-2025-Pre-conference-watsonx-Hackathon.git
cd IBM-TechXchange-2025-Pre-conference-watsonx-Hackathon

# Install dependencies
pip install -r requirements.txt

# Run API
python api.py
Go
bash
Копировать
Редактировать
cd IBM-TechXchange-2025-Pre-conference-watsonx-Hackathon

# Build Go service
go mod tidy
go run main.go
 Training
If you want to retrain the models:

bash
Копировать
Редактировать
python split_dataset.py   # prepare train/val datasets
python ai.py              # train EfficientNet
Models will be saved as .h5 or in efficientnet_trash_savedmodel/.

 Results
EfficientNetB0 reaches high accuracy on the trash dataset.

MobileNetV2 is smaller and optimized for mobile/edge deployment.

Models are exported for flexible usage (TensorFlow, ONNX).

Team
Developed by askarrrr04 and team for IBM TechXchange 2025 Hackathon.

The project demonstrates how AI + Go + IBM Cloud can be combined to solve real-world sustainability challenges.
