import os
import glob
import shutil
import random

# Source: your Dataset 1
source_path = r"E:\VIRIS\Backend\Dataset 1"
# Target Project structure
helmet_target = r"E:\VIRIS\datasets\helmet"
plate_target = r"E:\VIRIS\datasets\license_plate"

def create_folders(base):
    for sub in ["images", "labels"]:
        for split in ["train", "val", "test"]:
            p = os.path.join(base, sub, split)
            if not os.path.exists(p): os.makedirs(p)

create_folders(helmet_target)
create_folders(plate_target)

# Collect all files
source_images = glob.glob(os.path.join(source_path, "train/images/*.jpg")) + \
                glob.glob(os.path.join(source_path, "valid/images/*.jpg"))
random.shuffle(source_images)

# Split indices
n = len(source_images)
i_train = int(n * 0.7)
i_val = int(n * 0.9)

print(f"Total source images: {n}")

def get_split(idx):
    if idx < i_train: return "train"
    if idx < i_val: return "val"
    return "test"

for i, img_path in enumerate(source_images):
    split = get_split(i)
    basename = os.path.basename(img_path)
    label_basename = os.path.splitext(basename)[0] + ".txt"
    
    # Locate label file (tried train and valid dirs)
    lb_path = img_path.replace("images", "labels").replace(".jpg", ".txt")
    if not os.path.exists(lb_path): continue

    with open(lb_path, "r") as f:
        lines = f.readlines()

    h_lines = [] # 0=helmet, 1=no_helmet
    p_lines = [] # 0=license_plate (re-mapped from 4)

    for line in lines:
        parts = line.split()
        if not parts: continue
        cls = int(parts[0])
        
        # Filter for Helmet
        if cls in [0, 1]:
            h_lines.append(line)
        
        # Filter for Plate
        if cls == 4:
            p_lines.append(f"0 {' '.join(parts[1:])}\n")

    # Copy images and write labels if boxes exist
    if h_lines:
        shutil.copy2(img_path, os.path.join(helmet_target, "images", split, basename))
        with open(os.path.join(helmet_target, "labels", split, label_basename), "w") as f:
            f.writelines(h_lines)
            
    if p_lines:
        shutil.copy2(img_path, os.path.join(plate_target, "images", split, basename))
        with open(os.path.join(plate_target, "labels", split, label_basename), "w") as f:
            f.writelines(p_lines)

print("--- Step 3 & 4 Done: Filtered and Split Datasets ---")
print(f"Helmet Samples (Images): {len(os.listdir(os.path.join(helmet_target, 'images/train')))}")
print(f"Plate Samples (Images): {len(os.listdir(os.path.join(plate_target, 'images/train')))}")
