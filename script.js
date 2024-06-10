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
                fill: 'rgba(0,0,0,0.3)',
                selectable: true
            });
            canvas.add(cropRect);
            isCropping = true;
            cropButton.textContent = 'Confirm Crop';
        } else {
            const cropData = cropRect.getBoundingRect();

            const scaleX = imgInstance.scaleX || 1;
            const scaleY = imgInstance.scaleY || 1;

            const left = (cropData.left - imgInstance.left) / scaleX;
            const top = (cropData.top - imgInstance.top) / scaleY;
            const width = cropData.width / scaleX;
            const height = cropData.height / scaleY;

            const croppedImg = new Image();
            croppedImg.src = imgInstance.toDataURL({
                left: left,
                top: top,
                width: width,
                height: height
            });

            croppedImg.onload = function() {
                const croppedInstance = new fabric.Image(croppedImg, {
                    left: imgInstance.left,
                    top: imgInstance.top,
                    scaleX: imgInstance.scaleX,
                    scaleY: imgInstance.scaleY
                });
                canvas.clear();
                canvas.add(croppedInstance);
                canvas.centerObject(croppedInstance);
                canvas.renderAll();
                imgInstance = croppedInstance;
                updateImageSizeInputs();
            };

            isCropping = false;
            cropButton.textContent = 'Crop';
            canvas.remove(cropRect);
        }
    }

    function handleMouseWheel(opt) {
        const delta = opt.e.deltaY;
        zoomLevel = zoomLevel + delta / 200;
        if (zoomLevel > 20) zoomLevel = 20;
        if (zoomLevel < 1) zoomLevel = 1;
        canvas.setZoom(zoomLevel);
        opt.e.preventDefault();
        opt.e.stopPropagation();
        drawGrid();
    }

    function drawGrid() {
        const gridSize = 50;
        const ctx = canvas.getContext();

        for (let i = 0; i < (canvas.getWidth() / gridSize); i++) {
            ctx.beginPath();
            ctx.moveTo(i * gridSize, 0);
            ctx.lineTo(i * gridSize, canvas.getHeight());
            ctx.strokeStyle = '#ccc';
            ctx.stroke();
        }

        for (let i = 0; i < (canvas.getHeight() / gridSize); i++) {
            ctx.beginPath();
            ctx.moveTo(0, i * gridSize);
            ctx.lineTo(canvas.getWidth(), i * gridSize);
            ctx.strokeStyle = '#ccc';
            ctx.stroke();
        }
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
        // Draw horizontal ruler
        const hRuler = document.createElement('canvas');
        hRuler.id = 'h-ruler';
        hRuler.width = canvas.getWidth();
        hRuler.height = 20;
        const hCtx = hRuler.getContext('2d');
        document.body.appendChild(hRuler);

        for (let i = 0; i < canvas.getWidth(); i += 10) {
            hCtx.beginPath();
            hCtx.moveTo(i, 0);
            hCtx.lineTo(i, i % 50 === 0 ? 20 : 10);
            hCtx.strokeStyle = '#000';
            hCtx.stroke();
        }

        // Draw vertical ruler
        const vRuler = document.createElement('canvas');
        vRuler.id = 'v-ruler';
        vRuler.width = 20;
        vRuler.height = canvas.getHeight();
        const vCtx = vRuler.getContext('2d');
        document.body.appendChild(vRuler);

        for (let i = 0; i < canvas.getHeight(); i += 10) {
            vCtx.beginPath();
            vCtx.moveTo(0, i);
            vCtx.lineTo(i % 50 === 0 ? 20 : 10, i);
            vCtx.strokeStyle = '#000';
            vCtx.stroke();
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
        canvas.renderAll();
    }

    function showObjectInfo(e) {
        const obj = e.target;
        const info = document.createElement('div');
        info.id = 'object-info';
        info.style.position = 'absolute';
        info.style.left = `${obj.left}px`;
        info.style.top = `${obj.top + obj.height * obj.scaleY}px`;
        info.style.backgroundColor = 'white';
        info.style.border = '1px solid black';
        info.style.padding = '5px';
        info.innerHTML = `
            <p>Width: ${convertUnits(obj.width * obj.scaleX)}</p>
            <p>Height: ${convertUnits(obj.height * obj.scaleY)}</p>
            <p>Angle: ${obj.angle.toFixed(2)}°</p>
            <p>Left: ${convertUnits(obj.left)}</p>
            <p>Top: ${convertUnits(obj.top)}</p>
        `;
        document.body.appendChild(info);
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
