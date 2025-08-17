import requests


API_KEY = "kKSQiWIB7PeE24EnCNaI9v5kLHtbQXstutobqC7CscuD"
DEPLOYMENT_URL = "https://eu-de.ml.cloud.ibm.com/ml/v4/deployments/trai/predictions?version=2021-05-01"


token_response = requests.post(
    'https://iam.cloud.ibm.com/identity/token',
    data={"apikey": API_KEY, "grant_type": 'urn:ibm:params:oauth:grant-type:apikey'}
)
mltoken = token_response.json()["access_token"]
headers = {'Content-Type': 'application/json', 'Authorization': 'Bearer ' + mltoken}


class_names = ['cardboard', 'glass', 'metal', 'paper', 'plastic', 'trash']


image_path = "C:/Users/askar/trash_dataset/val/glass/glass4.jpg"


from PIL import Image
import numpy as np

img = Image.open(image_path).resize((224, 224))
img_array = np.array(img) / 255.0  
img_array = img_array.tolist()      
payload_scoring = {
    "input_data": [
        {"fields": ["image"], "values": [img_array]}
    ]
}


response = requests.post(DEPLOYMENT_URL, json=payload_scoring, headers=headers)
result = response.json()


pred_values = result['predictions'][0]['values'][0]


pred_index = np.argmax(pred_values)
pred_class = class_names[pred_index]
pred_confidence = pred_values[pred_index]

print(f"Модель считает, что это: {pred_class} с вероятностью {pred_confidence:.2f}")
