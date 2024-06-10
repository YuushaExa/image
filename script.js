document.addEventListener('DOMContentLoaded', function() {
    const uploadInput = document.getElementById('upload');
    const dropArea = document.getElementById('drop-area');
    const imageUrlInput = document.getElementById('image-url');
    const loadUrlButton = document.getElementById('load-url');
    const cropButton = document.getElementById('crop-btn');
    const canvasElement = document.getElementById('canvas');
    const canvas = new fabric.Canvas('canvas');
    const imageWidthInput = document.getElementById('image-width');
    const imageHeightInput = document.getElementById('image-height');
    const canvasWidthInput = document.getElementById('canvas-width');
    const canvasHeightInput = document.getElementById('canvas-height');
    const unitSelect = document.getElementById('unit-select');
    const rulerToggle = document.getElementById('ruler-toggle');
    const objectInfo = document.getElementById('object-info');

    let imgInstance;
    let isCropping = false;
    let cropRect;
    let zoomLevel = 1;
    let rulerEnabled = true;
    let currentUnit = 'px';

    uploadInput.addEventListener('change', handleFileSelect);
    dropArea.addEventListener('dragover', handleDragOver);
    dropArea.addEventListener('drop', handleDrop);
    dropArea.addEventListener('click', () => uploadInput.click());
    loadUrlButton.addEventListener('click', handleImageUrl);
    cropButton.addEventListener('click', handleCrop);
    canvasWidthInput.addEventListener('input', updateCanvasSize);
    canvasHeightInput.addEventListener('input', updateCanvasSize);
    imageWidthInput.addEventListener('input', updateImageSize);
    imageHeightInput.addEventListener('input', updateImageSize);
    canvas.on('mouse:wheel', handleMouseWheel);
    canvas.on('object:selected', showObjectInfo);
    canvas.on('selection:cleared', hideObjectInfo);
    unitSelect.addEventListener('change', updateUnit);
    rulerToggle.addEventListener('change', toggleRuler);

    const controls = ['brightness', 'contrast', 'saturation'];
    controls.forEach(control => {
        const input = document.getElementById(control);
        input.addEventListener('input', () => {
            applyFilters();
            updateLabel(control);
        });
    });

    function handleFileSelect(event) {
        const file = event.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = function(e) {
                loadImage(e.target.result);
            };
            reader.readAsDataURL(file);
        }
    }

    function handleDragOver(event) {
        event.preventDefault();
        event.stopPropagation();
        dropArea.classList.add('dragover');
    }

    function handleDrop(event) {
        event.preventDefault();
        event.stopPropagation();
        dropArea.classList.remove('dragover');
        const file = event.dataTransfer.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = function(e) {
                loadImage(e.target.result);
            };
            reader.readAsDataURL(file);
        }
    }

    function handleImageUrl() {
        const url = imageUrlInput.value;
        if (url) {
            loadImage(url);
        }
    }

    function loadImage(src) {
        fabric.Image.fromURL(src, function(oImg) {
            canvas.clear();
            imgInstance = oImg;
            canvas.setWidth(canvasWidthInput.value || oImg.width);
            canvas.setHeight(canvasHeightInput.value || oImg.height);
            canvas.add(oImg);
            canvas.centerObject(oImg);
            canvas.renderAll();
            updateImageSizeInputs();
            updateCanvasSizeInputs();
            drawGrid();
            drawRulers();
        });
    }

    function applyFilters() {
        if (!imgInstance) return;

        const brightness = parseInt(document.getElementById('brightness').value, 10);
        const contrast = parseInt(document.getElementById('contrast').value, 10);
        const saturation = parseInt(document.getElementById('saturation').value, 10);

        imgInstance.filters = [];

        if (brightness !== 0) {
            imgInstance.filters.push(new fabric.Image.filters.Brightness({
                brightness: brightness / 100
            }));
        }

        if (contrast !== 0) {
            imgInstance.filters.push(new fabric.Image.filters.Contrast({
                contrast: contrast / 100
            }));
        }

        if (saturation !== 0) {
            imgInstance.filters.push(new fabric.Image.filters.Saturation({
                saturation: saturation / 100
            }));
        }

        imgInstance.applyFilters();
        canvas.renderAll();
    }

    function updateLabel(control) {
        const value = document.getElementById(control).value;
        document.getElementById(`${control}-label`).textContent = `${value}%`;
    }

    function updateCanvasSize() {
        const width = parseInt(canvasWidthInput.value, 10);
        const height = parseInt(canvasHeightInput.value, 10);
        if (!isNaN(width) && !isNaN(height)) {
            canvas.setWidth(width);
            canvas.setHeight(height);
            canvas.renderAll();
            drawGrid();
            drawRulers();
        }
    }

    function updateImageSize() {
        const width = parseInt(imageWidthInput.value, 10);
        const height = parseInt(imageHeightInput.value, 10);
        if (!isNaN(width) && !isNaN(height) && imgInstance) {
            imgInstance.set({
                scaleX: width / imgInstance.width,
                scaleY: height / imgInstance.height
            });
            canvas.renderAll();
        }
    }

    function updateImageSizeInputs() {
        if (imgInstance) {
            imageWidthInput.value = Math.round(imgInstance.getScaledWidth());
            imageHeightInput.value = Math.round(imgInstance.getScaledHeight());
        }
    }

    function updateCanvasSizeInputs() {
        canvasWidthInput.value = canvas.getWidth();
        canvasHeightInput.value = canvas.getHeight();
    }

    function handleCrop() {
        if (!imgInstance) return;

        if (!isCropping) {
            const centerX = canvas.width / 2;
            const centerY = canvas.height / 2;
            const cropWidth = canvas.width / 2;
            const cropHeight = canvas.height / 2;

            cropRect = new fabric.Rect({
                left: centerX - cropWidth / 2,
                top: centerY - cropHeight / 2,
                width: cropWidth,
                height: cropHeight,
                fill: 'rgba(255, 255, 255, 0.5)',
                selectable: false,
                evented: false
            });

            canvas.add(cropRect);
            canvas.setActiveObject(cropRect);
            isCropping = true;
        } else {
            const rect = canvas.getActiveObject();
            const cropped = new fabric.Image(imgInstance.getElement(), {
                left: 0,
                top: 0,
                scaleX: imgInstance.scaleX,
                scaleY: imgInstance.scaleY,
                clipPath: new fabric.Rect({
                    left: rect.left / imgInstance.scaleX,
                    top: rect.top / imgInstance.scaleY,
                    width: rect.width / imgInstance.scaleX,
                    height: rect.height / imgInstance.scaleY
                })
            });

            canvas.clear();
            canvas.add(cropped);
            canvas.centerObject(cropped);
            canvas.renderAll();
            imgInstance = cropped;
            isCropping = false;
        }
    }

    function handleMouseWheel(opt) {
        const delta = opt.e.deltaY;
        zoomLevel = zoomLevel + delta / 200;
        if (zoomLevel > 3) zoomLevel = 3;
        if (zoomLevel < 0.2) zoomLevel = 0.2;
        canvas.setZoom(zoomLevel);
        opt.e.preventDefault();
        opt.e.stopPropagation();
    }

    function drawGrid() {
        const gridSize = 50;
        const ctx = canvas.getContext('2d');
        const width = canvas.getWidth();
        const height = canvas.getHeight();
        ctx.beginPath();

        for (let i = 0; i <= width; i += gridSize) {
            ctx.moveTo(i, 0);
            ctx.lineTo(i, height);
        }

        for (let i = 0; i <= height; i += gridSize) {
            ctx.moveTo(0, i);
            ctx.lineTo(width, i);
        }

        ctx.strokeStyle = '#e0e0e0';
        ctx.stroke();
    }

    function toggleRuler() {
        rulerEnabled = !rulerEnabled;
        if (rulerEnabled) {
            drawRulers();
        } else {
            clearRulers();
        }
    }

    function drawRulers() {
        clearRulers();

        // Draw horizontal ruler
        const hRuler = document.createElement('canvas');
        hRuler.id = 'h-ruler';
        hRuler.width = canvas.getWidth();
        hRuler.height = 20;
        hRuler.style.position = 'absolute';
        hRuler.style.top = '0';
        hRuler.style.left = '20px';
        const hCtx = hRuler.getContext('2d');
        document.body.appendChild(hRuler);

        for (let i = 0; i < canvas.getWidth(); i += 10) {
            hCtx.beginPath();
            hCtx.moveTo(i, 0);
            hCtx.lineTo(i, i % 50 === 0 ? 20 : 10);
            hCtx.strokeStyle = '#000';
            hCtx.stroke();
            if (i % 50 === 0) {
                hCtx.fillText(convertUnits(i), i + 2, 10);
            }
        }

        // Draw vertical ruler
        const vRuler = document.createElement('canvas');
        vRuler.id = 'v-ruler';
        vRuler.width = 20;
        vRuler.height = canvas.getHeight();
        vRuler.style.position = 'absolute';
        vRuler.style.top = '20px';
        vRuler.style.left = '0';
        const vCtx = vRuler.getContext('2d');
        document.body.appendChild(vRuler);

        for (let i = 0; i < canvas.getHeight(); i += 10) {
            vCtx.beginPath();
            vCtx.moveTo(0, i);
            vCtx.lineTo(i % 50 === 0 ? 20 : 10, i);
            vCtx.strokeStyle = '#000';
            vCtx.stroke();
            if (i % 50 === 0) {
                vCtx.fillText(convertUnits(i), 2, i + 10);
            }
        }
    }

    function clearRulers() {
        const hRuler = document.getElementById('h-ruler');
        const vRuler = document.getElementById('v-ruler');
        if (hRuler) hRuler.remove();
        if (vRuler) vRuler.remove();
    }

    function updateUnit() {
        currentUnit = unitSelect.value;
        drawRulers();
        canvas.renderAll();
    }

    function showObjectInfo(e) {
        const obj = e.target;
        objectInfo.style.display = 'block';
        objectInfo.style.left = `${obj.left + obj.width * obj.scaleX + 10}px`;
        objectInfo.style.top = `${obj.top}px`;
        objectInfo.innerHTML = `
            <p>Width: ${convertUnits(obj.width * obj.scaleX)}</p>
            <p>Height: ${convertUnits(obj.height * obj.scaleY)}</p>
            <p>Angle: ${obj.angle.toFixed(2)}°</p>
            <p>Left: ${convertUnits(obj.left)}</p>
            <p>Top: ${convertUnits(obj.top)}</p>
        `;
    }

    function hideObjectInfo() {
        objectInfo.style.display = 'none';
    }

    function convertUnits(value) {
        switch (currentUnit) {
            case 'px':
                return `${value.toFixed(2)} px`;
            case 'mm':
                return `${(value / 3.7795275591).toFixed(2)} mm`;
            case 'cm':
                return `${(value / 37.795275591).toFixed(2)} cm`;
            default:
                return `${value.toFixed(2)} px`;
        }
    }
});
