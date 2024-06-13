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

        const healButton = document.getElementById('healButton');

  const ctx = canvas.getContext('2d');
    let img = new Image();
      let imgInstance, imgData;
    let healingMode = false;
    let brushStrokes = [];

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

    //crop

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

    // obj info
    
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

    // Listen for object selection
    canvas.on('selection:created', function(e) {
        const selectedObject = e.selected[0];
        updateObjectInfo(selectedObject);
    });

    // Listen for object selection updates
    canvas.on('selection:updated', function(e) {
        const selectedObject = e.selected[0];
        updateObjectInfo(selectedObject);
    });

    // Clear information display when object is deselected
    canvas.on('selection:cleared', function() {
        objectInfo.innerHTML = 'Select an object to see its size, angle, and position';
    });

    // Listen for object modifications
    canvas.on('object:modified', function(e) {
        const modifiedObject = e.target;
        updateObjectInfo(modifiedObject);
    });

    // Listen for object transformations
    canvas.on('object:scaling', function(e) {
        const scalingObject = e.target;
        updateObjectInfo(scalingObject);
    });

    canvas.on('object:moving', function(e) {
        const movingObject = e.target;
        updateObjectInfo(movingObject);
    });

    canvas.on('object:rotating', function(e) {
        const rotatingObject = e.target;
        updateObjectInfo(rotatingObject);
    });

  angleInput.addEventListener('input', function() {
        const activeObject = canvas.getActiveObject();
        if (activeObject && angleInput.value !== '') {
            activeObject.set('angle', parseFloat(angleInput.value)).setCoords();
            canvas.renderAll();
            updateObjectInfo(activeObject);
        }
    });

    // Toggle info display
    toggleInfo.addEventListener('change', function() {
        const activeObject = canvas.getActiveObject();
        if (activeObject) {
            updateObjectInfo(activeObject);
        } else {
            objectInfo.innerHTML = 'Select an object to see its size, angle, and position';
        }   
    });

 // ruler

      const horizontalRuler = document.getElementById('horizontal-ruler');
    const verticalRuler = document.getElementById('vertical-ruler');

    function drawRulers() {
        drawHorizontalRuler();
        drawVerticalRuler();
    }

    function drawHorizontalRuler() {
        horizontalRuler.innerHTML = '';
        const canvasWidth = canvas.getWidth();
        for (let i = 0; i <= canvasWidth; i += 10) {
            const marker = document.createElement('div');
            marker.style.position = 'absolute';
            marker.style.left = `${i}px`;
            marker.style.width = '1px';
            marker.style.height = i % 50 === 0 ? '15px' : '10px';
            marker.style.background = 'black';
            horizontalRuler.appendChild(marker);

            if (i % 50 === 0) {
                const number = document.createElement('span');
                number.style.position = 'absolute';
                number.style.left = `${i + 2}px`;
                number.style.top = '2px';
                number.style.fontSize = '10px';
                number.innerText = i;
                horizontalRuler.appendChild(number);
            }
        }
    }

    function drawVerticalRuler() {
        verticalRuler.innerHTML = '';
        const canvasHeight = canvas.getHeight();
        for (let i = 0; i <= canvasHeight; i += 10) {
            const marker = document.createElement('div');
            marker.style.position = 'absolute';
            marker.style.top = `${i}px`;
            marker.style.width = i % 50 === 0 ? '15px' : '10px';
            marker.style.height = '1px';
            marker.style.background = 'black';
            verticalRuler.appendChild(marker);

            if (i % 50 === 0) {
                const number = document.createElement('span');
                number.style.position = 'absolute';
                number.style.top = `${i + 2}px`;
                number.style.left = '2px';
                number.style.fontSize = '10px';
                number.innerText = i;
                verticalRuler.appendChild(number);
            }
        }
    }

    function updateCanvasSize() {
        const canvasElement = canvas.getElement();
        const width = window.innerWidth - 100; // Adjust for ruler size
        const height = window.innerHeight - 100; // Adjust for ruler size
        canvasElement.width = width;
        canvasElement.height = height;
        canvas.setWidth(width);
        canvas.setHeight(height);
        drawRulers();
    }

    window.addEventListener('resize', updateCanvasSize);

    updateCanvasSize();

    // healing

 healButton.addEventListener('click', function() {
        healingMode = !healingMode;
        canvas.isDrawingMode = false; // Ensure Fabric.js drawing mode is off
        healButton.textContent = healingMode ? 'Cancel Healing' : 'Spot Healing Brush';

        if (!healingMode && brushStrokes.length > 0) {
            applyHealing();
        }
    });

    // Custom Brush for Capturing Strokes
    const brush = new fabric.CircleBrush(canvas);
    brush.width = 10;
    canvas.freeDrawingBrush = brush;

    // Capture Brush Strokes
    canvas.on('mouse:down', function(o) {
        if (healingMode) {
            canvas.isDrawingMode = true;
        }
    });

    canvas.on('path:created', function(event) {
        if (healingMode) {
            const path = event.path;
            const points = path.path;

            points.forEach(point => {
                const [x, y] = point.slice(1);
                brushStrokes.push({ x, y });
            });

            canvas.remove(path); // Remove the temporary drawing
            canvas.isDrawingMode = false;
        }
    });

    // Apply Healing using OpenCV.js
    function applyHealing() {
        const canvasWidth = canvas.getWidth();
        const canvasHeight = canvas.getHeight();
        imgData = ctx.getImageData(0, 0, canvasWidth, canvasHeight);

        cv.onRuntimeInitialized = () => {
            const src = cv.matFromImageData(imgData);
            const dst = new cv.Mat();
            const mask = new cv.Mat.zeros(src.rows, src.cols, cv.CV_8UC1);

            brushStrokes.forEach(point => {
                cv.circle(mask, new cv.Point(point.x, point.y), 10, new cv.Scalar(255, 255, 255), -1);
            });

            cv.inpaint(src, mask, dst, 3, cv.INPAINT_TELEA);

            let resultImageData = new ImageData(
                new Uint8ClampedArray(dst.data),
                dst.cols,
                dst.rows
            );
            ctx.putImageData(resultImageData, 0, 0);

            src.delete();
            dst.delete();
            mask.delete();
            brushStrokes = [];
        };
    }

});
