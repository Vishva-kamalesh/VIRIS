from ultralytics import YOLO

def train_plate():
    # Load pretrained YOLOv8n
    model = YOLO('yolov8n.pt')
    
    # Train
    model.train(
        data='plate.yaml',
        epochs=50,
        imgsz=640,
        project='E:/VIRIS/models',
        name='plate_model',
        patience=10
    )

if __name__ == '__main__':
    train_plate()
