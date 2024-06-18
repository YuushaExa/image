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
    let imgInstance, imgData;

    let isCropping = false;
    let cropRect;
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

    function updateObjectInfo(object) {
        if (toggleInfo.checked) {
            const width = object.getScaledWidth();
            const height = object.getScaledHeight();
            const angle = object.angle;
            const left = object.left;
            const top = object.top;
            objectInfo.innerHTML = `Width: ${width.toFixed(2)} px, Height: ${height.toFixed(2)} px, Angle: ${angle.toFixed(2)}°, Position: (${left.toFixed(2)}, ${top.toFixed(2)})`;
            angleInput.value = angle.toFixed(2);
        } else {
            objectInfo.innerHTML = '';
        }
    }

    canvas.on('selection:created', function(e) {
        const selectedObject = e.selected[0];
        updateObjectInfo(selectedObject);
    });

    canvas.on('selection:updated', function(e) {
        const selectedObject = e.selected[0];
        updateObjectInfo(selectedObject);
    });

    canvas.on('selection:cleared', function() {
        objectInfo.innerHTML = 'Select an object to see its size, angle, and position';
    });

    canvas.on('object:modified', function(e) {
        const modifiedObject = e.target;
        updateObjectInfo(modifiedObject);
    });

    function drawRulers() {
        const width = window.innerWidth;
        const height = window.innerHeight;
        horizontalRuler.style.width = `${width}px`;
        verticalRuler.style.height = `${height}px`;
    }

    function createRuler(size, length) {
        const ruler = document.createElement('div');
        ruler.style.display = 'flex';
        ruler.style.flexDirection = 'column';
        ruler.style.width = `${length}px`;
        for (let i = 0; i <= length; i += size) {
            const tick = document.createElement('div');
            tick.style.height = '10px';
            tick.style.width = '1px';
            tick.style.background = 'black';
            if (i % (size * 10) === 0) {
                tick.style.height = '20px';
            }
            ruler.appendChild(tick);
        }
        return ruler;
    }

    const horizontalRulerElement = createRuler(10, window.innerWidth);
    horizontalRuler.appendChild(horizontalRulerElement);
    const verticalRulerElement = createRuler(10, window.innerHeight);
    verticalRuler.appendChild(verticalRulerElement);

    window.addEventListener('resize', function() {
        horizontalRuler.innerHTML = '';
        verticalRuler.innerHTML = '';
        const horizontalRulerElement = createRuler(10, window.innerWidth);
        horizontalRuler.appendChild(horizontalRulerElement);
        const verticalRulerElement = createRuler(10, window.innerHeight);
        verticalRuler.appendChild(verticalRulerElement);
    });

    const healToolButton = document.getElementById('healToolButton');
    const cursorTypeInput = document.getElementById('cursorType');
    const cursorSizeInput = document.getElementById('cursorSize');
    const blendingIntensityInput = document.getElementById('blendingIntensity');
    const searchRadiusInput = document.getElementById('searchRadius');
    const affectedAreaInput = document.getElementById('affectedArea');
    const featheringInput = document.getElementById('feathering');
    const cursorDiv = document.getElementById('cursor');

    let isHealing = false;

    healToolButton.addEventListener('click', function() {
        isHealing = !isHealing;
        canvas.defaultCursor = isHealing ? 'crosshair' : 'default';
        if (isHealing) {
            healToolButton.classList.add('active');
            cursorDiv.style.display = 'block';
        } else {
            healToolButton.classList.remove('active');
            cursorDiv.style.display = 'none';
        }
    });

    canvasElement.addEventListener('mousemove', function(event) {
        if (!isHealing) return;
        const rect = canvasElement.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;
        const size = parseInt(cursorSizeInput.value, 10);
        cursorDiv.style.left = `${x - size / 2}px`;
        cursorDiv.style.top = `${y - size / 2}px`;
        cursorDiv.style.width = `${size}px`;
        cursorDiv.style.height = `${size}px`;
    });

    canvasElement.addEventListener('click', function(event) {
        if (!isHealing) return;
        const rect = canvasElement.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;
        const size = parseInt(cursorSizeInput.value, 10);
        const blendingIntensity = parseFloat(blendingIntensityInput.value);
        const searchRadius = parseInt(searchRadiusInput.value, 10);
        const affectedArea = parseFloat(affectedAreaInput.value);
        const feathering = parseFloat(featheringInput.value);
        inpaintSpot(x, y, size, blendingIntensity, searchRadius, affectedArea, feathering);
    });

    function inpaintSpot(x, y, size, blendingIntensity, searchRadius, affectedArea, feathering) {
        if (!imgInstance) return;
        const imageData = ctx.getImageData(0, 0, canvasElement.width, canvasElement.height);
        const { width, height, data } = imageData;

        const centerX = Math.round(x);
        const centerY = Math.round(y);
        const radius = Math.round(size / 2);

        for (let dx = -radius; dx <= radius; dx++) {
            for (let dy = -radius; dy <= radius; dy++) {
                const distance = Math.sqrt(dx * dx + dy * dy);
                if (distance > radius) continue;

                const pixelX = centerX + dx;
                const pixelY = centerY + dy;

                if (pixelX < 0 || pixelX >= width || pixelY < 0 || pixelY >= height) continue;

                const offset = (pixelY * width + pixelX) * 4;
                data[offset] = 255;
                data[offset + 1] = 255;
                data[offset + 2] = 255;
                data[offset + 3] = 255;
            }
        }

        ctx.putImageData(imageData, 0, 0);
        const img = new Image();
        img.onload = function() {
            const newImageInstance = new fabric.Image(img);
            newImageInstance.set({
                left: imgInstance.left,
                top: imgInstance.top,
                scaleX: imgInstance.scaleX,
                scaleY: imgInstance.scaleY
            });
            canvas.clear();
            canvas.add(newImageInstance);
            canvas.renderAll();
            imgInstance = newImageInstance;
        };
        img.src = canvasElement.toDataURL();
    }
});
