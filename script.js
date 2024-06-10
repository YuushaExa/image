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
    const infoText = document.getElementById('info-text');

    let imgInstance;
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
    canvas.on('mouse:wheel', handleMouseWheel);
    canvas.on('object:selected', displayObjectInfo);
    canvas.on('selection:cleared', clearObjectInfo);

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

    function handleMouseWheel(event) {
        const delta = event.e.deltaY;
        const zoom = canvas.getZoom();
        canvas.setZoom(zoom - delta / 400);
        event.e.preventDefault();
        event.e.stopPropagation();
    }

    function handleCrop() {
        if (!isCropping) {
            cropButton.textContent = 'Apply Crop';
            isCropping = true;
            cropRect = new fabric.Rect({
                left: 100,
                top: 100,
                width: 200,
                height: 200,
                fill: 'rgba(0,0,0,0.3)',
                selectable: false,
                evented: false
            });
            canvas.add(cropRect);
            canvas.setActiveObject(cropRect);
            canvas.renderAll();
            canvas.on('object:moving', updateCropInfo);
            canvas.on('object:scaling', updateCropInfo);
            canvas.on('object:rotating', updateCropInfo);
        } else {
            cropButton.textContent = 'Crop';
            isCropping = false;
            const rect = cropRect.getBoundingRect();
            const croppedImg = new fabric.Image(imgInstance.getElement(), {
                left: -rect.left,
                top: -rect.top,
                scaleX: imgInstance.scaleX,
                scaleY: imgInstance.scaleY,
                clipPath: new fabric.Rect({
                    width: rect.width,
                    height: rect.height,
                    left: 0,
                    top: 0
                })
            });
            canvas.clear();
            canvas.setWidth(rect.width);
            canvas.setHeight(rect.height);
            canvas.add(croppedImg);
            canvas.centerObject(croppedImg);
            canvas.renderAll();
            cropRect = null;
            canvas.off('object:moving', updateCropInfo);
            canvas.off('object:scaling', updateCropInfo);
            canvas.off('object:rotating', updateCropInfo);
        }
    }

    function displayObjectInfo(event) {
        const obj = event.target;
        if (obj.type === 'image') {
            const size = `Size: ${Math.round(obj.getScaledWidth())} x ${Math.round(obj.getScaledHeight())}`;
            const rotation = `Rotation: ${Math.round(obj.angle)}°`;
            infoText.textContent = `${size}, ${rotation}`;
        }
    }

    function clearObjectInfo() {
        infoText.textContent = '';
    }

    function updateCropInfo(event) {
        const rect = event.target;
        const size = `Size: ${Math.round(rect.getScaledWidth())} x ${Math.round(rect.getScaledHeight())}`;
        const position = `Position: ${Math.round(rect.left)}, ${Math.round(rect.top)}`;
        infoText.textContent = `${size}, ${position}`;
    }
});
