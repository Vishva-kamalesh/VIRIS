from ultralytics import YOLO

def train_helmet():
    # Load pretrained YOLOv8n
    model = YOLO('yolov8n.pt')
    
    # Train
    model.train(
        data='helmet.yaml',
        epochs=50,
        imgsz=640,
        project='E:/VIRIS/models',
        name='helmet_model',
        patience=10 # Early stopping
    )

if __name__ == '__main__':
    train_helmet()
