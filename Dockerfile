# ML models ke liye Python 3.11 sabse stable hota hai
FROM python:3.11-slim

WORKDIR /app

# 1. OS ki saari zaroori graphics/UI libraries install karo
RUN apt-get update && apt-get install -y \
    libgl1 \
    libglib2.0-0 \
    libxcb1 \
    libxext6 \
    && rm -rf /var/lib/apt/lists/*

# 2. Requirements copy karke install karo
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# 3. Ultralytics ki zid khatam karo (Force Headless OpenCV)
# Pehle existing opencv hatao, fir strictly headless daalo
RUN pip uninstall -y opencv-python opencv-python-headless && \
    pip install --no-cache-dir opencv-python-headless

# 4. Apna project code container mein copy karo
COPY . .

# 5. Uvicorn se app start karo (Railway ka port use karke)
CMD sh -c "uvicorn app.main:app --host 0.0.0.0 --port $PORT"