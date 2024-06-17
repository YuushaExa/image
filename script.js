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
    const objectInfo = document.getElementById('objectInfo');
    const horizontalRuler = document.getElementById('horizontal-ruler');
    const verticalRuler = document.getElementById('vertical-ruler');
    const ctx = canvasElement.getContext('2d');
    const healToolButton = document.getElementById('healToolButton');
    const cursorTypeInput = document.getElementById('cursorType');
    const cursorSizeInput = document.getElementById('cursorSize');
    const blendingIntensityInput = document.getElementById('blendingIntensity');
    const searchRadiusInput = document.getElementById('searchRadius');
    const affectedAreaInput = document.getElementById('affectedArea');
    const featheringInput = document.getElementById('feathering');
    const cursor = document.getElementById('cursor');

    let imgInstance, imgData;
    let isCropping = false;
    let cropRect;
    let usingHealTool = false;
    let cursorSize = parseInt(cursorSizeInput.value, 10);
    let blendingIntensity = parseFloat(blendingIntensityInput.value);
    let searchRadius = parseInt(searchRadiusInput.value, 10);
    let affectedArea = parseFloat(affectedAreaInput.value);
    let feathering = parseFloat(featheringInput.value);
    let isMouseDown = false;
    let canvasData = null;
    let cursorType = cursorTypeInput.value;

    cursor.style.width = cursor.style.height = `${cursorSize}px`; // Set initial cursor size

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
    healToolButton.addEventListener('click', () => {
        usingHealTool = !usingHealTool;
        cursor.style.display = usingHealTool ? 'block' : 'none';
        if (usingHealTool) {
            cursor.style.width = cursor.style.height = `${cursorSize}px`; // Ensure cursor size is updated when tool is activated
        }
    });
    cursorTypeInput.addEventListener('change', () => {
        cursorType = cursorTypeInput.value;
        if (cursorType === 'basic') {
            cursor.style.display = usingHealTool ? 'block' : 'none';
        }
    });
    cursorSizeInput.addEventListener('input', () => {
        cursorSize = parseInt(cursorSizeInput.value, 10);
        cursor.style.width = cursor.style.height = `${cursorSize}px`;
    });
    blendingIntensityInput.addEventListener('input', () => {
        blendingIntensity = parseFloat(blendingIntensityInput.value);
    });
    searchRadiusInput.addEventListener('input', () => {
        searchRadius = parseInt(searchRadiusInput.value, 10);
    });
    affectedAreaInput.addEventListener('input', () => {
        affectedArea = parseFloat(affectedAreaInput.value);
    });
    featheringInput.addEventListener('input', () => {
        feathering = parseFloat(featheringInput.value);
    });
    canvas.on('mouse:move', handleMouseMove);
    canvas.on('mouse:down', handleMouseDown);
    canvas.on('mouse:up', handleMouseUp);

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
                const croppedCanvas = document.createElement('canvas');
                const croppedCtx = croppedCanvas.getContext('2d');
                croppedCanvas.width = width;
                croppedCanvas.height = height;
                croppedCtx.drawImage(croppedImg, 0, 0, width, height);
                canvas.remove(imgInstance);
                loadImage(croppedCanvas.toDataURL());
                canvas.remove(cropRect);
                isCropping = false;
                cropButton.textContent = 'Crop';
            };
        }
    }

    function handleMouseMove(event) {
        const pointer = canvas.getPointer(event.e);
        const x = pointer.x - cursorSize / 2;
        const y = pointer.y - cursorSize / 2;
        cursor.style.left = `${x}px`;
        cursor.style.top = `${y}px`;
        if (usingHealTool && isMouseDown) {
            applyHealTool(pointer);
        }
    }

    function handleMouseDown(event) {
        if (usingHealTool) {
            isMouseDown = true;
            const pointer = canvas.getPointer(event.e);
            applyHealTool(pointer);
        }
    }

    function handleMouseUp() {
        if (usingHealTool) {
            isMouseDown = false;
        }
    }

    function applyHealTool(pointer) {
        if (!imgInstance) return;
        const x = pointer.x;
        const y = pointer.y;
        const radius = cursorSize / 2;
        ctx.save();
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, 2 * Math.PI, false);
        ctx.clip();
        ctx.drawImage(imgInstance.getElement(), 0, 0);
        ctx.restore();
        canvas.renderAll();
    }

    canvas.on('object:selected', function(e) {
        if (e.target === cropRect) {
            const rect = e.target;
            rect.on('scaling', function() {
                rect.set({
                    width: rect.width * rect.scaleX,
                    height: rect.height * rect.scaleY,
                    scaleX: 1,
                    scaleY: 1
                });
            });
        }
    });
});
