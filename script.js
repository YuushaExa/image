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

    let imgInstance;
    let isCropping = false;
    let cropRect;
    let zoomLevel = 1;

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

    function drawGrid() {
        const gridSize = 50;
        const width = canvas.getWidth();
        const height = canvas.getHeight();
        const verticalLines = Math.ceil(width / gridSize);
        const horizontalLines = Math.ceil(height / gridSize);

        canvas.clearContext(canvas.contextTop);
        for (let i = 0; i < verticalLines; i++) {
            const x = i * gridSize;
            drawGridLine(x, 0, x, height, 'vertical');
        }

        for (let i = 0; i < horizontalLines; i++) {
            const y = i * gridSize;
            drawGridLine(0, y, width, y, 'horizontal');
        }

        if (imgInstance) {
            canvas.add(imgInstance);
        }
    }

    function drawGridLine(x1, y1, x2, y2, className) {
        const line = document.createElement('div');
        line.classList.add('grid-line', className);
        line.style.left = `${x1}px`;
        line.style.top = `${y1}px`;
        document.querySelector('.main-content').appendChild(line);
    }

    function handleMouseWheel(opt) {
        const delta = opt.e.deltaY;
        const pointer = canvas.getPointer(opt.e);
        let zoom = canvas.getZoom();
        zoom = zoom - delta / 200;
        if (zoom > 20) zoom = 20;
        if (zoom < 0.01) zoom = 0.01;
        canvas.zoomToPoint({ x: opt.e.offsetX, y: opt.e.offsetY }, zoom);
        opt.e.preventDefault();
        opt.e.stopPropagation();
        const vpt = canvas.viewportTransform;
        if (zoom < 1) {
            vpt[4] = 20 - zoom * 20;
            vpt[5] = 20 - zoom * 20;
        } else {
            if (vpt[4] >= 0) {
                vpt[4] = 0;
            } else if (vpt[4] < canvas.getWidth() - canvas.getWidth() * zoom) {
                vpt[4] = canvas.getWidth() - canvas.getWidth() * zoom;
            }
            if (vpt[5] >= 0) {
                vpt[5] = 0;
            } else if (vpt[5] < canvas.getHeight() - canvas.getHeight() * zoom) {
                vpt[5] = canvas.getHeight() - canvas.getHeight() * zoom;
            }
        }
    }


    const grid = 20; // Adjust the grid size as needed
    const inset = 10; // Adjust the inset value as needed

    // Add vertical and horizontal grid lines with labels
    for (var i = 0; i < (600 / grid); i++) {
        // Vertical grid lines with labels
        canvas.add(new fabric.Text(String(i * 5), {
            left: inset + i * grid,
            top: 0,
            fontSize: 14,
            selectable: false
        }));

        // Horizontal grid lines with labels
        canvas.add(new fabric.Text(String(i * 5), {
            left: 0,
            top: inset + i * grid,
            fontSize: 14,
            textAlign: 'right',
            selectable: false
        }));
    }
    
});
