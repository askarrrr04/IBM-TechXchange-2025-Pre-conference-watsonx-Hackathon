import os
import shutil
import random

# Путь к исходной папке с категориями
source_dir = r"C:\Users\askar\trash_dataset\Garbage classification\Garbage classification"
# Папка куда положим train/val
base_output_dir = r"C:\Users\askar\trash_dataset"

train_dir = os.path.join(base_output_dir, "train")
val_dir = os.path.join(base_output_dir, "val")

# Создаём папки train и val
os.makedirs(train_dir, exist_ok=True)
os.makedirs(val_dir, exist_ok=True)

# Проходим по категориям (glass, metal, etc.)
for category in os.listdir(source_dir):
    category_path = os.path.join(source_dir, category)
    if not os.path.isdir(category_path):
        continue

    # Создаём папки категории в train и val
    os.makedirs(os.path.join(train_dir, category), exist_ok=True)
    os.makedirs(os.path.join(val_dir, category), exist_ok=True)

    # Получаем список всех файлов
    files = os.listdir(category_path)
    random.shuffle(files)  # Перемешиваем

    # 80% в train, 20% в val
    split_index = int(len(files) * 0.8)
    train_files = files[:split_index]
    val_files = files[split_index:]

    # Копируем файлы
    for f in train_files:
        shutil.copy(os.path.join(category_path, f), os.path.join(train_dir, category, f))
    for f in val_files:
        shutil.copy(os.path.join(category_path, f), os.path.join(val_dir, category, f))

print("✅ Разделение завершено!")
