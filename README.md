# Vehicle Damage Classification AI

A simple and professional vehicle damage detection system built with **YOLO11n**, **FastAPI**, and a lightweight HTML/CSS/JavaScript frontend.

The application allows a user to upload a vehicle image and automatically detects visible damage using the trained YOLO model. Detected areas are displayed with bounding boxes along with damage type and confidence score.

## Features

- Vehicle damage detection using YOLO11n
- Image upload from the browser
- Visual damage bounding boxes
- Damage class and confidence score
- Original image and detection view
- FastAPI backend
- Clean frontend UI
- Health-check endpoint
- Favicon support
- Ready for Railway deployment

## Detected Damage Classes

The current model supports:

- Dent
- Scratch
- Crack
- Glass Shatter
- Lamp Broken
- Tire Flat

## Project Structure

```text
vehicle-damage-classification/
│
├── app/
│   ├── main.py
│   └── services.py
│
├── frontend/
│   ├── index.html
│   ├── style.css
│   ├── script.js
│   └── favicon.svg
│
├── models/
│   └── vehicle_damage_yolo11n.pt
│
├── .gitignore
├── .python-version
├── pyproject.toml
├── requirements.txt
├── uv.lock
└── README.md
```

## Tech Stack

- Python
- YOLO11n
- Ultralytics
- FastAPI
- Uvicorn
- Pillow
- HTML
- CSS
- JavaScript
- Railway

## Run Locally

Create and activate the project environment, then install dependencies.

Using `uv`:

```bash
uv sync
```

Start the FastAPI application:

```bash
uv run uvicorn app.main:app --reload
```

Open the application in your browser:

```text
http://127.0.0.1:8000
```

## API Endpoints

### Health Check

```text
GET /health
```

Example response:

```json
{
  "status": "healthy"
}
```

### Prediction

```text
POST /predict
```

Upload an image using the `file` form field.

Example response:

```json
{
  "filename": "vehicle.jpg",
  "detections": [
    {
      "damage": "lamp broken",
      "confidence": 0.895,
      "bbox": [338.93, 316.82, 1687.13, 1153.54]
    }
  ],
  "count": 1
}
```

## How It Works

```text
User uploads vehicle image
          ↓
Frontend sends image to FastAPI
          ↓
FastAPI validates and reads image
          ↓
YOLO11n performs damage detection
          ↓
Detected classes + confidence + bounding boxes
          ↓
Frontend visualizes the results
```

## Model

The application uses a trained YOLO11n model stored in:

```text
models/vehicle_damage_yolo11n.pt
```

The model is loaded once and reused for subsequent predictions to avoid unnecessary model reloads.

## Deployment

The project is structured for deployment on **Railway**.

The production application can be started with:

```bash
uvicorn app.main:app --host 0.0.0.0 --port $PORT
```

Railway provides the `$PORT` environment variable at runtime.

## Project Goal

This project was built as a practical computer vision application demonstrating:

- Object detection
- Model inference
- REST API development
- Frontend and backend integration
- Image processing
- Deployment-ready project structure

## Author

**Devendar Kumavat**

GitHub: https://github.com/Dk76-76

## License

This project is intended for educational and portfolio purposes.
