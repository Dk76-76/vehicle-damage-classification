from pathlib import Path

from PIL import Image
from ultralytics import YOLO


PROJECT_ROOT = Path(__file__).resolve().parents[1]
MODEL_PATH = PROJECT_ROOT / "models" / "vehicle_damage_yolo11n.pt"
MODAL_MODEL_PATH = Path("/root/models/vehicle_damage_yolo11n.pt")


CLASS_NAMES = {
    0: "dent",
    1: "scratch",
    2: "crack",
    3: "glass shatter",
    4: "lamp broken",
    5: "tire flat",
}


_model = None


def get_model() -> YOLO:
    """Load the trained YOLO model once and reuse it."""

    global _model

    if _model is None:
        if MODEL_PATH.exists():
            target_path = MODEL_PATH
        elif MODAL_MODEL_PATH.exists():
            target_path = MODAL_MODEL_PATH
        else:
            raise FileNotFoundError(
                f"Model file not found at {MODEL_PATH} or {MODAL_MODEL_PATH}"
            )

        _model = YOLO(str(target_path))

    return _model


def predict_image(image: Image.Image) -> dict:
    """Run vehicle damage detection on an image."""

    model = get_model()

    results = model.predict(
        source=image,
        imgsz=640,
        conf=0.25,
        verbose=False,
    )

    detections = []

    for result in results:

        if result.boxes is None:
            continue

        for box in result.boxes:

            class_id = int(box.cls[0])
            confidence = float(box.conf[0])

            x1, y1, x2, y2 = box.xyxy[0].tolist()

            detections.append(
                {
                    "damage": CLASS_NAMES.get(
                        class_id,
                        "unknown",
                    ),
                    "confidence": round(confidence, 4),
                    "bbox": [
                        round(x1, 2),
                        round(y1, 2),
                        round(x2, 2),
                        round(y2, 2),
                    ],
                }
            )

    return {
        "detections": detections,
        "count": len(detections),
    }