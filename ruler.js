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
