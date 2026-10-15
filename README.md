<div align="center">

# 🚗 Vehicle Damage AI — Automated Vehicle Inspection System

**An End-to-End Computer Vision Platform Powered by Ultralytics YOLO11n and FastAPI for Real-Time Vehicle Damage Localization, Confidence Telemetry, and Annotated Image Exports.**

[![FastAPI](https://img.shields.io/badge/FastAPI-0.141.1-009688?style=for-the-badge&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com/)
[![YOLO11n](https://img.shields.io/badge/Ultralytics-YOLO11n_(8.4.124)-111F68?style=for-the-badge&logo=yolo&logoColor=white)](https://docs.ultralytics.com/)
[![Python](https://img.shields.io/badge/Python-3.11_%7C_3.13-3776AB?style=for-the-badge&logo=python&logoColor=white)](https://www.python.org/)
[![Docker](https://img.shields.io/badge/Docker-Ready-2496ED?style=for-the-badge&logo=docker&logoColor=white)](https://www.docker.com/)
[![uv](https://img.shields.io/badge/uv-Package_Manager-DE5FE9?style=for-the-badge&logo=astral&logoColor=white)](https://docs.astral.sh/uv/)
[![Live Demo](https://img.shields.io/badge/Live_Demo-Render-46E3B7?style=for-the-badge&logo=render&logoColor=black)](https://vehicle-damage-classification.onrender.com)

[Live Demo](https://vehicle-damage-classification.onrender.com) • [Key Features](#-key-features) • [System Workflow](#-system-workflow) • [Tech Stack](#-tech-stack) • [Installation & Docker](#-getting-started--deployment) • [API Reference](#-api-reference)

</div>

---

## 📖 Overview

**Vehicle Damage AI** is an AI-powered visual inspection web application designed to detect, localize, and classify exterior vehicle damage from uploaded photographs[cite: 51, 57]. Built with **Ultralytics YOLO11n** on a **FastAPI** backend and paired with a custom responsive inspection dashboard, the system automates insurance claim assessments and automotive quality checks[cite: 51, 52, 53, 57].

Users can drag-and-drop vehicle images (`JPG`, `PNG`, `WEBP` up to `10MB`), run instant object detection inference, toggle between original and annotated bounding-box views on an interactive HTML5 `<canvas>`, inspect granular bounding-box coordinates (`x1, y1, x2, y2`), and download high-resolution annotated inspection reports.

---

## ✨ Key Features

### 🧠 Computer Vision & Backend Engineering
* **YOLO11n Object Detection Engine:** Powered by `ultralytics==8.4.124` and PyTorch (`torch==2.13.0`) to localize multiple damage regions simultaneously with sub-second inference[cite: 51, 57, 58, 59].
* **Cloud-Optimized Headless Containerization:** Custom `Dockerfile` (`python:3.11-slim`) pre-configured with essential system graphics libraries (`libgl1`, `libglib2.0-0`, `libxcb1`, `libxext6`) and forced `opencv-python-headless` installation to eliminate GUI dependency crashes on cloud platforms like Render and Railway.
* **Resilient Response Parsing:** Frontend client gracefully handles both `{ "detections": [...] }` and `{ "result": [...] }` payload schemas, normalized or percentage confidence scores (`0.895` or `89.5`), and non-JSON server error states.

### 🖥️ Interactive Inspection Dashboard
* **Drag-and-Drop Upload & Live Preview:** Validates file MIME types (`image/jpeg`, `image/png`, `image/webp`) and file size limits (`<= 10MB`) with dual sidebar and main-stage image previews[cite: 51, 52].
* **Dynamic HTML5 Canvas Bounding-Box Renderer:** Automatically scales stroke width and typography relative to image resolution, drawing high-contrast green bounding boxes (`#20c755`) with indexed damage class and confidence tags[cite: 51, 52].
* **Original vs. Detections View Toggle:** Instant one-click switching between the raw vehicle photograph (`◉ Original`) and the AI-annotated overlay (`⊙ Detections`) without re-running inference[cite: 51, 52].
* **Executive Telemetry Cards:** Automatically computes and displays 4 key inspection metrics:
  * **Total Detections:** Count of localized damage areas[cite: 52].
  * **Highest Confidence:** Peak confidence score and corresponding damage class[cite: 52].
  * **High Confidence Count:** Number of detections scoring `>= 70%`[cite: 52].
  * **Average Confidence:** Mean confidence across all detected regions[cite: 52].
* **Granular Detection Table & Severity Badges:** Lists every individual prediction with formatted damage names, visual progress bars, exact bounding-box coordinates (`x1, y1, x2, y2`), and automated confidence tier badges (`High >= 70%`, `Medium 50–69%`, `Low < 50%`)[cite: 51, 52].
* **One-Click Annotated PNG Export:** Exports the full-resolution rendered HTML5 canvas directly to the user's device as `vehicle-damage-analysis.png`[cite: 51, 52].

---

## 🔄 System Workflow

```text
[User Uploads Vehicle Image (JPG / PNG / WEBP <= 10MB)]
                          │
                          ▼
┌──────────────────────────────────────────────────────────┐
│ 1. Client Validation & Preview (script.js)               │
│    • Verifies MIME type & 10MB size limit                │
│    • Renders Sidebar & Main Stage Previews               │
└──────────────────────────────────────────────────────────┘
                          │
                          ▼  POST /predict (FormData)
┌──────────────────────────────────────────────────────────┐
│ 2. FastAPI + YOLO11n Inference Engine                    │
│    • Processes image via Pillow & OpenCV Headless        │
│    • Runs Ultralytics YOLO11n object detection           │
│    • Returns class labels, confidence & [x1, y1, x2, y2] │
└──────────────────────────────────────────────────────────┘
                          │
                          ▼
┌──────────────────────────────────────────────────────────┐
│ 3. Canvas Rendering & Telemetry Dashboard                │
│    • Draws scaled bounding boxes & labels on <canvas>    │
│    • Populates 4 KPI Stat Cards & Detection Details Table│
│    • Enables Original/Detected toggle & PNG Download     │
└──────────────────────────────────────────────────────────┘
