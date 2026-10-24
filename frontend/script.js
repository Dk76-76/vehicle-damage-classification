const API_URL = "https://dk76-76--vehicle-damage-api-serve.us-east.modal.run";

/* =========================
   ELEMENTS
========================= */

const imageInput = document.getElementById("imageInput");
const uploadArea = document.getElementById("uploadArea");

const emptyState = document.getElementById("emptyState");
const previewSection = document.getElementById("previewSection");
const loadingSection = document.getElementById("loadingSection");
const resultSection = document.getElementById("resultSection");

const imagePreview = document.getElementById("imagePreview");
const sidebarPreview = document.getElementById("sidebarPreview");

const selectedImageCard = document.getElementById(
    "selectedImageCard"
);

const sidebarFileName = document.getElementById(
    "sidebarFileName"
);

const sidebarFileSize = document.getElementById(
    "sidebarFileSize"
);

const previewFileName = document.getElementById(
    "previewFileName"
);

const previewFileSize = document.getElementById(
    "previewFileSize"
);

const detectButton = document.getElementById(
    "detectButton"
);

const resultCanvas = document.getElementById(
    "resultCanvas"
);

const originalButton = document.getElementById(
    "originalButton"
);

const detectedButton = document.getElementById(
    "detectedButton"
);

const downloadButton = document.getElementById(
    "downloadButton"
);

const newScanButton = document.getElementById(
    "headerNewScanButton"
);

const sidebarChangeButton = document.getElementById(
    "sidebarChangeButton"
);

const previewChangeButton = document.getElementById(
    "previewChangeButton"
);

const errorMessage = document.getElementById(
    "errorMessage"
);

const resultsList = document.getElementById(
    "resultsList"
);

const detectionCount = document.getElementById(
    "detectionCount"
);

const statsGrid = document.getElementById(
    "statsGrid"
);

const resultTitle = document.getElementById(
    "resultTitle"
);

const analysisDate = document.getElementById(
    "analysisDate"
);


/* =========================
   STATE
========================= */

let selectedFile = null;
let originalImage = null;
let detections = [];

let showDetections = true;


/* =========================
   FILE HANDLING
========================= */

imageInput.addEventListener(
    "change",
    handleFileSelection
);


function handleFileSelection(event) {

    const file = event.target.files[0];

    if (!file) {
        return;
    }

    processFile(file);
}


function processFile(file) {

    hideError();

    const allowedTypes = [
        "image/jpeg",
        "image/png",
        "image/webp"
    ];

    if (!allowedTypes.includes(file.type)) {

        showError(
            "Please upload a JPG, PNG, or WEBP image."
        );

        return;
    }


    const maxSize = 10 * 1024 * 1024;

    if (file.size > maxSize) {

        showError(
            "Image size must be less than 10MB."
        );

        return;
    }


    selectedFile = file;


    const imageURL = URL.createObjectURL(file);


    imagePreview.src = imageURL;
    sidebarPreview.src = imageURL;


    const fileSize = formatFileSize(file.size);


    sidebarFileName.textContent = file.name;
    sidebarFileSize.textContent = fileSize;

    previewFileName.textContent = file.name;
    previewFileSize.textContent = fileSize;


    selectedImageCard.classList.remove(
        "hidden"
    );

    emptyState.classList.add(
        "hidden"
    );

    resultSection.classList.add(
        "hidden"
    );

    loadingSection.classList.add(
        "hidden"
    );

    previewSection.classList.remove(
        "hidden"
    );
}


/* =========================
   DRAG & DROP
========================= */

uploadArea.addEventListener(
    "dragover",
    (event) => {

        event.preventDefault();

        uploadArea.classList.add(
            "dragover"
        );
    }
);


uploadArea.addEventListener(
    "dragleave",
    () => {

        uploadArea.classList.remove(
            "dragover"
        );
    }
);


uploadArea.addEventListener(
    "drop",
    (event) => {

        event.preventDefault();

        uploadArea.classList.remove(
            "dragover"
        );

        const file = event.dataTransfer.files[0];

        if (file) {
            processFile(file);
        }
    }
);


/* =========================
   CHANGE IMAGE
========================= */

sidebarChangeButton.addEventListener(
    "click",
    () => imageInput.click()
);

previewChangeButton.addEventListener(
    "click",
    () => imageInput.click()
);


/* =========================
   ANALYZE
========================= */

detectButton.addEventListener(
    "click",
    analyzeImage
);


async function analyzeImage() {

    if (!selectedFile) {

        showError(
            "Please select an image first."
        );

        return;
    }


    hideError();

    previewSection.classList.add(
        "hidden"
    );

    loadingSection.classList.remove(
        "hidden"
    );


    const formData = new FormData();

    formData.append(
        "file",
        selectedFile
    );


    try {

        const response = await fetch(
            `${API_URL}/predict`,
            {
                method: "POST",
                body: formData
            }
        );


        /*
         * IMPORTANT:
         * Do not directly call response.json().
         * If FastAPI returns HTML/plain text during
         * an internal error, response.json() causes:
         *
         * Unexpected token 'I'
         */

        const responseText =
            await response.text();


        let data;

        try {

            data = responseText
                ? JSON.parse(responseText)
                : {};

        } catch {

            throw new Error(
                responseText ||
                `Server returned HTTP ${response.status}`
            );
        }


        if (!response.ok) {

            const detail =
                data.detail ||
                data.message ||
                `Server error (${response.status})`;

            throw new Error(detail);
        }


        /*
         * Support both:
         *
         * { detections: [...] }
         *
         * and
         *
         * { result: [...] }
         */

        detections =
            Array.isArray(data.detections)
                ? data.detections
                : Array.isArray(data.result)
                    ? data.result
                    : [];


        await prepareOriginalImage();


        loadingSection.classList.add(
            "hidden"
        );

        resultSection.classList.remove(
            "hidden"
        );


        renderResults();

    } catch (error) {

        loadingSection.classList.add(
            "hidden"
        );

        previewSection.classList.remove(
            "hidden"
        );

        showError(
            error.message ||
            "Unable to analyze the image."
        );
    }
}


/* =========================
   ORIGINAL IMAGE
========================= */

function prepareOriginalImage() {

    return new Promise(
        (resolve, reject) => {

            const image = new Image();

            image.onload = () => {

                originalImage = image;

                resolve();

            };

            image.onerror = () => {

                reject(
                    new Error(
                        "Unable to load selected image."
                    )
                );

            };

            image.src =
                URL.createObjectURL(selectedFile);
        }
    );
}


/* =========================
   RESULTS
========================= */

function renderResults() {

    resultTitle.textContent =
        `${detections.length} Damage Detection${
            detections.length === 1 ? "" : "s"
        } Found`;


    detectionCount.textContent =
        detections.length;


    analysisDate.textContent =
        getCurrentDateTime();


    renderStats();

    renderTable();

    drawCanvas(
        showDetections
    );
}


/* =========================
   STATS
========================= */

function renderStats() {

    const total =
        detections.length;


    if (!total) {

        statsGrid.innerHTML = `
            <div class="stat-card">
                <div class="stat-label">
                    Total Detections
                </div>

                <div class="stat-value">
                    0
                </div>

                <div class="stat-subtitle">
                    No visible damage detected
                </div>

                <div class="stat-icon">
                    ⊙
                </div>
            </div>

            <div class="stat-card stat-green">
                <div class="stat-label">
                    Highest Confidence
                </div>

                <div class="stat-value">
                    —
                </div>

                <div class="stat-subtitle">
                    No predictions
                </div>

                <div class="stat-icon">
                    ↗
                </div>
            </div>

            <div class="stat-card stat-green">
                <div class="stat-label">
                    High Confidence
                </div>

                <div class="stat-value">
                    0
                </div>

                <div class="stat-subtitle">
                    (≥ 70%)
                </div>

                <div class="stat-icon">
                    ✓
                </div>
            </div>

            <div class="stat-card stat-purple">
                <div class="stat-label">
                    Avg Confidence
                </div>

                <div class="stat-value">
                    —
                </div>

                <div class="stat-subtitle">
                    Across detections
                </div>

                <div class="stat-icon">
                    ◎
                </div>
            </div>
        `;

        return;
    }


    const confidences =
        detections.map(
            item => getConfidence(item)
        );


    const highest =
        Math.max(...confidences);


    const average =
        confidences.reduce(
            (sum, value) => sum + value,
            0
        ) / confidences.length;


    const highestDetection =
        detections[
            confidences.indexOf(highest)
        ];


    const highConfidenceCount =
        confidences.filter(
            value => value >= 0.70
        ).length;


    statsGrid.innerHTML = `

        <div class="stat-card">

            <div class="stat-label">
                Total Detections
            </div>

            <div class="stat-value">
                ${total}
            </div>

            <div class="stat-subtitle">
                damage areas found
            </div>

            <div class="stat-icon">
                ⊙
            </div>

        </div>


        <div class="stat-card stat-green">

            <div class="stat-label">
                Highest Confidence
            </div>

            <div class="stat-value">
                ${formatPercent(highest)}
            </div>

            <div class="stat-subtitle">
                ${formatDamageName(
                    highestDetection.damage
                )}
            </div>

            <div class="stat-icon">
                ↗
            </div>

        </div>


        <div class="stat-card stat-green">

            <div class="stat-label">
                High Confidence
            </div>

            <div class="stat-value">
                ${highConfidenceCount}
            </div>

            <div class="stat-subtitle">
                (≥ 70%)
            </div>

            <div class="stat-icon">
                ✓
            </div>

        </div>


        <div class="stat-card stat-purple">

            <div class="stat-label">
                Avg Confidence
            </div>

            <div class="stat-value">
                ${formatPercent(average)}
            </div>

            <div class="stat-subtitle">
                across all detections
            </div>

            <div class="stat-icon">
                ◎
            </div>

        </div>
    `;
}


/* =========================
   TABLE
========================= */

function renderTable() {

    if (!detections.length) {

        resultsList.innerHTML = `
            <tr>
                <td
                    colspan="5"
                    style="text-align:center;padding:30px;color:#68758a;"
                >
                    No visible damage detected.
                </td>
            </tr>
        `;

        return;
    }


    resultsList.innerHTML =
        detections.map(
            (detection, index) => {

                const confidence =
                    getConfidence(
                        detection
                    );


                const level =
                    getConfidenceLevel(
                        confidence
                    );


                const bbox =
                    getBoundingBox(
                        detection
                    );


                return `
                    <tr>

                        <td>
                            ${index + 1}
                        </td>


                        <td>

                            <div class="damage-name">

                                <span class="damage-icon">
                                    ⚒
                                </span>

                                ${formatDamageName(
                                    detection.damage ||
                                    detection.class_name ||
                                    detection.class ||
                                    "Unknown"
                                )}

                            </div>

                        </td>


                        <td class="confidence-cell">

                            <div class="confidence-row">

                                <div class="confidence-bar">

                                    <div
                                        class="confidence-fill ${
                                            confidence < 0.70
                                                ? "medium"
                                                : ""
                                        }"
                                        style="width:${
                                            Math.max(
                                                0,
                                                Math.min(
                                                    100,
                                                    confidence * 100
                                                )
                                            )
                                        }%"
                                    ></div>

                                </div>

                                <strong>
                                    ${formatPercent(
                                        confidence
                                    )}
                                </strong>

                            </div>

                        </td>


                        <td>
                            ${formatBoundingBox(
                                bbox
                            )}
                        </td>


                        <td>

                            <span
                                class="level ${
                                    level.className
                                }"
                            >
                                ${level.label}
                            </span>

                        </td>

                    </tr>
                `;
            }
        ).join("");
}


/* =========================
   CANVAS
========================= */

function drawCanvas(
    drawDetections = true
) {

    if (!originalImage) {
        return;
    }


    const canvas =
        resultCanvas;

    const ctx =
        canvas.getContext("2d");


    const width =
        originalImage.naturalWidth ||
        originalImage.width;


    const height =
        originalImage.naturalHeight ||
        originalImage.height;


    canvas.width = width;
    canvas.height = height;


    ctx.clearRect(
        0,
        0,
        width,
        height
    );


    ctx.drawImage(
        originalImage,
        0,
        0,
        width,
        height
    );


    if (!drawDetections) {
        return;
    }


    detections.forEach(
        (detection, index) => {

            const bbox =
                getBoundingBox(
                    detection
                );


            if (!bbox || bbox.length !== 4) {
                return;
            }


            const [
                x1,
                y1,
                x2,
                y2
            ] = bbox;


            const boxWidth =
                x2 - x1;


            const boxHeight =
                y2 - y1;


            const confidence =
                getConfidence(
                    detection
                );


            const damage =
                formatDamageName(
                    detection.damage ||
                    detection.class_name ||
                    detection.class ||
                    "Unknown"
                );


            /*
             * Green bounding box
             */

            ctx.strokeStyle =
                "#20c755";

            ctx.lineWidth =
                Math.max(
                    3,
                    width / 450
                );

            ctx.strokeRect(
                x1,
                y1,
                boxWidth,
                boxHeight
            );


            /*
             * Label
             */

            const label =
                `${index + 1}. ${damage} - ${formatPercent(confidence)}`;


            ctx.font =
                `bold ${Math.max(
                    14,
                    width / 85
                )}px Arial`;


            const textMetrics =
                ctx.measureText(label);


            const labelWidth =
                textMetrics.width + 14;


            const labelHeight =
                Math.max(
                    24,
                    width / 45
                );


            const labelY =
                Math.max(
                    labelHeight,
                    y1
                );


            ctx.fillStyle =
                "#20c755";


            ctx.fillRect(
                x1,
                labelY - labelHeight,
                labelWidth,
                labelHeight
            );


            ctx.fillStyle =
                "#ffffff";


            ctx.fillText(
                label,
                x1 + 7,
                labelY - labelHeight / 3
            );

        }
    );
}


/* =========================
   ORIGINAL / DETECTIONS
========================= */

originalButton.addEventListener(
    "click",
    () => {

        showDetections = false;

        originalButton.classList.add(
            "active"
        );

        detectedButton.classList.remove(
            "active"
        );

        drawCanvas(false);
    }
);


detectedButton.addEventListener(
    "click",
    () => {

        showDetections = true;

        detectedButton.classList.add(
            "active"
        );

        originalButton.classList.remove(
            "active"
        );

        drawCanvas(true);
    }
);


/* =========================
   DOWNLOAD
========================= */

downloadButton.addEventListener(
    "click",
    () => {

        if (!resultCanvas.width) {
            return;
        }


        const link =
            document.createElement("a");


        link.download =
            "vehicle-damage-analysis.png";


        link.href =
            resultCanvas.toDataURL(
                "image/png"
            );


        link.click();
    }
);


/* =========================
   NEW SCAN
========================= */

newScanButton.addEventListener(
    "click",
    resetApplication
);


function resetApplication() {

    selectedFile = null;
    originalImage = null;
    detections = [];

    imageInput.value = "";


    selectedImageCard.classList.add(
        "hidden"
    );

    previewSection.classList.add(
        "hidden"
    );

    loadingSection.classList.add(
        "hidden"
    );

    resultSection.classList.add(
        "hidden"
    );

    emptyState.classList.remove(
        "hidden"
    );

    hideError();
}


/* =========================
   HELPERS
========================= */

function getConfidence(
    detection
) {

    let value =
        Number(
            detection.confidence ??
            detection.conf ??
            0
        );


    /*
     * Supports both:
     *
     * 0.895
     * 89.5
     */

    if (value > 1) {
        value = value / 100;
    }


    return Math.max(
        0,
        Math.min(
            1,
            value
        )
    );
}


function getBoundingBox(
    detection
) {

    const bbox =
        detection.bbox ??
        detection.box ??
        detection.bounding_box;


    if (
        Array.isArray(bbox) &&
        bbox.length === 4
    ) {

        return bbox.map(
            Number
        );
    }


    return [
        0,
        0,
        0,
        0
    ];
}


function formatPercent(
    value
) {

    return `${(
        value * 100
    ).toFixed(1)}%`;
}


function formatDamageName(
    value
) {

    if (!value) {
        return "Unknown";
    }


    return String(value)
        .replaceAll("_", " ")
        .replace(
            /\b\w/g,
            char => char.toUpperCase()
        );
}


function formatBoundingBox(
    bbox
) {

    if (!bbox || bbox.length !== 4) {
        return "—";
    }


    return bbox
        .map(
            value =>
                Number(value).toFixed(2)
        )
        .join(", ");
}


function getConfidenceLevel(
    confidence
) {

    if (confidence >= 0.70) {

        return {
            label: "High",
            className: "high"
        };
    }


    if (confidence >= 0.50) {

        return {
            label: "Medium",
            className: "medium"
        };
    }


    return {
        label: "Low",
        className: "low"
    };
}


function formatFileSize(
    bytes
) {

    if (bytes < 1024) {
        return `${bytes} B`;
    }


    if (bytes < 1024 * 1024) {
        return `${(
            bytes / 1024
        ).toFixed(1)} KB`;
    }


    return `${(
        bytes / (1024 * 1024)
    ).toFixed(2)} MB`;
}


function getCurrentDateTime() {

    return new Intl.DateTimeFormat(
        "en-US",
        {
            month: "short",
            day: "2-digit",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit"
        }
    ).format(
        new Date()
    );
}


function showError(
    message
) {

    errorMessage.textContent =
        message;

    errorMessage.classList.remove(
        "hidden"
    );
}


function hideError() {

    errorMessage.classList.add(
        "hidden"
    );

    errorMessage.textContent = "";
}