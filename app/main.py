import modal
from io import BytesIO
from pathlib import Path

from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from PIL import Image, UnidentifiedImageError

from app.services import predict_image

# Modal Setup (New API)
modal_app = modal.App("vehicle-damage-api")
modal_image = (
    modal.Image.debian_slim()
    .pip_install("fastapi", "uvicorn", "python-multipart", "pillow", "ultralytics")
    .add_local_dir("frontend", remote_path="/frontend")
)

REMOTE_FRONTEND_DIR = Path("/frontend")
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
async def predict(file: UploadFile = File(...)):
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
        contents = await file.read()
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

web_app.mount(
    "/",
    StaticFiles(
        directory="/frontend",
        html=True,
        check_dir=False,
    ),
    name="frontend",
)

# Modal Serverless Deployment Wrapper (Updated API without 'mounts')
@modal_app.function(
    image=modal_image,
)
@modal.asgi_app()
def serve():
    return web_app