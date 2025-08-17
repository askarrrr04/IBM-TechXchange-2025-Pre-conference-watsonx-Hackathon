import tensorflow as tf
import numpy as np
from tensorflow.keras.preprocessing import image

model = tf.keras.models.load_model("efficientnet_trash_finetuned_final.h5")

class_names = ['cardboard', 'glass', 'metal', 'paper', 'plastic', 'trash']

def predict_image(img_path):
    img = image.load_img(img_path, target_size=(224, 224))
    img_array = image.img_to_array(img) / 255.0
    img_array = np.expand_dims(img_array, axis=0)

    preds = model.predict(img_array)
    pred_class = class_names[np.argmax(preds)]
    confidence = np.max(preds) * 100

    print(f"Изображение: {img_path}")
    print(f"Предсказанный класс: {pred_class} ({confidence:.2f}% уверенности)\n")

# Тестируем
predict_image(r"C:\Users\askar\trash_dataset\train\glass\glass85.jpg")
