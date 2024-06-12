document.addEventListener('DOMContentLoaded', function() {
    const uploadInput = document.getElementById('upload');
    const dropArea = document.getElementById('drop-area');
    const imageUrlInput = document.getElementById('image-url');
    const loadUrlButton = document.getElementById('load-url');
    const cropButton = document.getElementById('crop-btn');
    const canvasElement = document.getElementById('canvas');
    const canvas = new fabric.Canvas('canvas', { selection: true });
    const imageWidthInput = document.getElementById('image-width');
    const imageHeightInput = document.getElementById('image-height');
    const canvasWidthInput = document.getElementById('canvas-width');
    const canvasHeightInput = document.getElementById('canvas-height');
    const objectInfo = document.getElementById('objectInfo');
    const angleInput = document.getElementById('angleInput');
    const toggleInfo = document.getElementById('toggleInfo');

    let imgInstance;
    let isCropping = false;
    let cropRect;

    function initEventListeners() {
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
        canvas.on('selection:created', e => updateObjectInfo(e.selected[0]));
        canvas.on('selection:updated', e => updateObjectInfo(e.selected[0]));
        canvas.on('selection:cleared', () => objectInfo.innerHTML = 'Select an object to see its size, angle, and position');
        canvas.on('object:modified', e => updateObjectInfo(e.target));
        canvas.on('object:scaling', e => updateObjectInfo(e.target));
        canvas.on('object:moving', e => updateObjectInfo(e.target));
        canvas.on('object:rotating', e => updateObjectInfo(e.target));
        angleInput.addEventListener('input', updateObjectAngle);
        toggleInfo.addEventListener('change', toggleObjectInfo);
    }

    function handleFileSelect(event) {
        const file = event.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = e => loadImage(e.target.result);
            reader.readAsDataURL(file);
        }
    }

    function handleDragOver(event) {
        event.preventDefault();
        dropArea.classList.add('dragover');
    }

    function handleDrop(event) {
        event.preventDefault();
        dropArea.classList.remove('dragover');
        const file = event.dataTransfer.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = e => loadImage(e.target.result);
            reader.readAsDataURL(file);
        }
    }

    function handleImageUrl() {
        const url = imageUrlInput.value;
        if (url) loadImage(url);
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
        if (brightness !== 0) imgInstance.filters.push(new fabric.Image.filters.Brightness({ brightness: brightness / 100 }));
        if (contrast !== 0) imgInstance.filters.push(new fabric.Image.filters.Contrast({ contrast: contrast / 100 }));
        if (saturation !== 0) imgInstance.filters.push(new fabric.Image.filters.Saturation({ saturation: saturation / 100 }));
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
            imgInstance.set({ scaleX: width / imgInstance.width, scaleY: height / imgInstance.height });
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
                selectable: true,
                evented: false
            });
            canvas.add(cropRect);
            canvas.bringToFront(cropRect);
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
        if (toggleInfo.checked && object) {
            const width = object.getScaledWidth();
            const height = object.getScaledHeight();
            const angle = object.angle;
            const left = object.left;
            const top = object.top;
            objectInfo.innerHTML = `Width: ${width.toFixed(2)} px, Height: ${height.toFixed(2)} px, Angle: ${angle.toFixed(2)}°, Position: (${left.toFixed(2)}, ${top.toFixed(2)})`;
            angleInput.value = angle.toFixed(2);
        } else {
            objectInfo.innerHTML = 'Select an object to see its size, angle, and position';
        }
    }

    function updateObjectAngle() {
        const activeObject = canvas.getActiveObject();
        if (activeObject && angleInput.value !== '') {
            activeObject.set('angle', parseFloat(angleInput.value)).setCoords();
            canvas.renderAll();
            updateObjectInfo(activeObject);
        }
    }

    function toggleObjectInfo() {
        const activeObject = canvas.getActiveObject();
        if (activeObject) {
            updateObjectInfo(activeObject);
        } else {
            objectInfo.innerHTML = 'Select an object to see its size, angle, and position';
        }
    }

    initEventListeners();
    canvas.setWidth(800); // Set initial canvas width
    canvas.setHeight(600); // Set initial canvas height
});
</script>
