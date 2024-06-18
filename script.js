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


const allObjects = fabricRef.current.getObjects();

    allObjects.forEach((object) => {
      object.selectable = false
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
    const healToolButton = document.getElementById('healToolButton');
    const cursorTypeInput = document.getElementById('cursorType');
    const cursorSizeInput = document.getElementById('cursorSize');
    const blendingIntensityInput = document.getElementById('blendingIntensity');
    const searchRadiusInput = document.getElementById('searchRadius');
    const affectedAreaInput = document.getElementById('affectedArea');
    const featheringInput = document.getElementById('feathering');
    const cursor = document.getElementById('cursor');

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
    healToolButton.addEventListener('click', () => {
        usingHealTool = !usingHealTool;
        canvas.selection = false;
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

    function handleMouseMove(options) {
        if (usingHealTool) {
            const pointer = canvas.getPointer(options.e);
            const x = pointer.x;
            const y = pointer.y;
            cursor.style.left = `${pointer.x - cursorSize / 2}px`;
            cursor.style.top = `${pointer.y - cursorSize / 2}px`;
            if (isMouseDown && cursorType === 'continuous') {
                inpaintSpot(x, y);
            }
        }
    }
    function handleMouseDown(options) {
        if (usingHealTool) {
            isMouseDown = true;
            const pointer = canvas.getPointer(options.e);
            const x = pointer.x;
            const y = pointer.y;
            if (cursorType === 'basic') {
                inpaintSpot(x, y);
            }
        }
    }
    function handleMouseUp() {
        if (usingHealTool) {
            isMouseDown = false;
        }
    }
    function inpaintSpot(x, y) {
        const radius = cursorSize / 2;
        const imageData = canvas.contextContainer.getImageData(x - radius, y - radius, radius * 2, radius * 2);
        const data = imageData.data;
        const patchSize = radius * 2;
        const similarPatch = findBestPatch(x, y, patchSize);
        if (similarPatch) {
            advancedBlendPatches(data, similarPatch.data, radius, blendingIntensity, affectedArea);
            canvas.contextContainer.putImageData(imageData, x - radius, y - radius);
            canvas.renderAll();
        }
    }
    function findBestPatch(x, y, size) {
        let bestPatch = null;
        let bestScore = Infinity;
        for (let dx = -searchRadius; dx <= searchRadius; dx++) {
            for (let dy = -searchRadius; dy <= searchRadius; dy++) {
                if (x + dx < 0 || y + dy < 0 || x + dx + size >= canvas.width || y + dy + size >= canvas.height) {
                    continue;
                }
                const patchData = extractPatchData(x + dx, y + dy, size);
                const score = computePatchScore(patchData);
                if (score < bestScore) {
                    bestScore = score;
                    bestPatch = { x: x + dx, y: y + dy, data: patchData };
                }
            }
        }
        return bestPatch;
    }
    function extractPatchData(x, y, size) {
        const startX = Math.max(0, x);
        const startY = Math.max(0, y);
        const endX = Math.min(canvas.width, x + size);
        const endY = Math.min(canvas.height, y + size);
        return canvas.contextContainer.getImageData(startX, startY, endX - startX, endY - startY).data;
    }
    function computePatchScore(data) {
        let r = 0, g = 0, b = 0, count = data.length / 4;
        for (let i = 0; i < data.length; i += 4) {
            r += data[i];
            g += data[i + 1];
            b += data[i + 2];
        }
        r /= count;
        g /= count;
        b /= count;
        let score = 0;
        for (let i = 0; i < data.length; i += 4) {
            score += Math.abs(data[i] - r) + Math.abs(data[i + 1] - g) + Math.abs(data[i + 2] - b);
        }
        return score;
    }
    function advancedBlendPatches(sourceData, targetData, radius, intensity, affectedArea) {
        const length = sourceData.length;
        const sigma = radius / 3;
        const gauss = (d) => Math.exp(-(d * d) / (2 * sigma * sigma));
        const affectRadius = radius * affectedArea;
        for (let i = 0; i < length; i += 4) {
            const dx = (i / 4) % (radius * 2) - radius;
            const dy = Math.floor((i / 4) / (radius * 2)) - radius;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < affectRadius) {
                const weight = gauss(dist) * intensity;
                sourceData[i] = weight * targetData[i] + (1 - weight) * sourceData[i];
                sourceData[i + 1] = weight * targetData[i + 1] + (1 - weight) * sourceData[i + 1];
                sourceData[i + 2] = weight * targetData[i + 2] + (1 - weight) * sourceData[i + 2];
            }
        }
    }
    function contentAwareFill(sourceData, targetData, radius, intensity) {
        const length = sourceData.length;
        const size = Math.sqrt(length / 4);
        for (let i = 0; i < length; i += 4) {
            const dx = (i / 4) % (radius * 2) - radius;
            const dy = Math.floor((i / 4) / (radius * 2)) - radius;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < radius) {
                const index = (dy + radius) * (radius * 2) + (dx + radius);
                const sourceIndex = 4 * index;
                const targetIndex = 4 * index;
                const weight = Math.exp(-dist * dist / (2 * radius * radius)) * intensity;
                sourceData[sourceIndex] = weight * targetData[targetIndex] + (1 - weight) * sourceData[sourceIndex];
                sourceData[sourceIndex + 1] = weight * targetData[targetIndex + 1] + (1 - weight) * sourceData[sourceIndex + 1];
                sourceData[sourceIndex + 2] = weight * targetData[targetIndex + 2] + (1 - weight) * sourceData[sourceIndex + 2];
            }
        }
    } 
        });
