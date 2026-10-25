import modal
from io import BytesIO
from pathlib import Path

from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from PIL import Image, UnidentifiedImageError

from app.services import predict_image

# Modal Setup (Complete with Linux libs and Folder Mounts)
modal_app = modal.App("vehicle-damage-api")

modal_image = (
    modal.Image.debian_slim(python_version="3.11")
    .apt_install("libgl1", "libglib2.0-0")  # YOLO/OpenCV ke liye zaroori Linux libraries
    .pip_install(
        "fastapi",
        "uvicorn",
        "python-multipart",
        "pillow",
        "ultralytics",
    )
    .add_local_dir("frontend", remote_path="/root/frontend")
    .add_local_dir("models", remote_path="/root/models")
    .add_local_dir("app", remote_path="/root/app")
)

REMOTE_FRONTEND_DIR = Path("/root/frontend")
FAVICON_PATH = REMOTE_FRONTEND_DIR / "favicon.svg"

web_app = FastAPI(
    title="Vehicle Damage Classification API",
    description="YOLO11n based vehicle damage detection API.",
    version="1.0.0",
)

web_app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

@web_app.get("/favicon.ico", include_in_schema=False)
def favicon():
    """Serve favicon for browsers requesting favicon.ico."""
    if not FAVICON_PATH.exists():
        raise HTTPException(
            status_code=404,
            detail="Favicon not found.",
        )
    return FileResponse(
        FAVICON_PATH,
        media_type="image/svg+xml",
    )

@web_app.get("/health")
def health_check():
    """Health check endpoint."""
    return {
        "status": "healthy",
    }

@web_app.post("/predict")
def predict(file: UploadFile = File(...)):
    """Receive an image and return vehicle damage detections."""
    if not file.content_type:
        raise HTTPException(
            status_code=400,
            detail="File type could not be determined.",
        )

    if not file.content_type.startswith("image/"):
        raise HTTPException(
            status_code=400,
            detail="Please upload a valid image file.",
        )

    try:
        contents = file.file.read()
        if not contents:
            raise HTTPException(
                status_code=400,
                detail="The uploaded image is empty.",
            )
        image = Image.open(BytesIO(contents)).convert("RGB")

    except UnidentifiedImageError:
        raise HTTPException(
            status_code=400,
            detail="The uploaded file is not a valid image.",
        )
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(
            status_code=400,
            detail=f"Unable to process the uploaded image: {exc}",
        )

    try:
        result = predict_image(image)
    except FileNotFoundError as exc:
        raise HTTPException(
            status_code=500,
            detail=str(exc),
        )
    except Exception as exc:
        raise HTTPException(
            status_code=500,
            detail=f"Model prediction failed: {exc}",
        )

    return {
        "filename": file.filename,
        "detections": result["detections"],
        "count": result["count"],
    }

if REMOTE_FRONTEND_DIR.exists():
    web_app.mount(
        "/",
        StaticFiles(
            directory=str(REMOTE_FRONTEND_DIR),
            html=True,
            check_dir=False,
        ),
        name="frontend",
    )

# Modal Serverless Deployment Wrapper with T4 GPU
@modal_app.function(
    image=modal_image,
    gpu="T4",       # <-- 16GB VRAM NVIDIA T4 GPU
    timeout=300,
)
@modal.asgi_app()
def serve():
    from app.services import get_model
    get_model()
    return web_app