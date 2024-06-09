const uploadInput = document.getElementById('upload');
const dropArea = document.getElementById('drop-area');
const img = document.getElementById('image');
const imageUrlInput = document.getElementById('image-url');
const loadUrlButton = document.getElementById('load-url');
const cropButton = document.getElementById('crop-btn');
const canvas = document.getElementById('canvas');

let cropArea = null;
let isCropping = false;
let startX, startY;

uploadInput.addEventListener('change', handleFileSelect);
dropArea.addEventListener('dragover', handleDragOver);
dropArea.addEventListener('drop', handleDrop);
dropArea.addEventListener('click', () => uploadInput.click());
loadUrlButton.addEventListener('click', handleImageUrl);
cropButton.addEventListener('click', initiateCrop);

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
        loadImage(URL.createObjectURL(file));
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
        loadImage(URL.createObjectURL(file));
    }
}

function handleImageUrl() {
    const url = imageUrlInput.value;
    if (url) {
        loadImage(url);
    }
}

function loadImage(src) {
    img.src = src;
    img.onload = () => {
        img.style.display = 'block';
        if (cropArea) {
            cropArea.remove();
            cropArea = null;
        }
    };
}

function applyFilters() {
    const brightness = document.getElementById('brightness').value;
    const contrast = document.getElementById('contrast').value;
    const saturation = document.getElementById('saturation').value;

    img.style.filter = `
        brightness(${parseInt(brightness) + 100}%)
        contrast(${parseInt(contrast) + 100}%)
        saturate(${parseInt(saturation) + 100}%)
    `;
}

function updateLabel(control) {
    const value = document.getElementById(control).value;
    document.getElementById(`${control}-label`).textContent = `${value}%`;
}

function initiateCrop() {
    if (cropArea) {
        cropArea.remove();
        cropArea = null;
    }

    cropArea = document.createElement('div');
    cropArea.classList.add('crop-area');
    dropArea.appendChild(cropArea);

    isCropping = true;

    dropArea.addEventListener('mousedown', startCrop);
    dropArea.addEventListener('mousemove', moveCrop);
    dropArea.addEventListener('mouseup', endCrop);
}

function startCrop(event) {
    if (!isCropping) return;

    startX = event.offsetX;
    startY = event.offsetY;

    cropArea.style.left = `${startX}px`;
    cropArea.style.top = `${startY}px`;
    cropArea.style.width = '0';
    cropArea.style.height = '0';
    cropArea.style.display = 'block';
}

function moveCrop(event) {
    if (!isCropping) return;

    const currentX = event.offsetX;
    const currentY = event.offsetY;

    const width = currentX - startX;
    const height = currentY - startY;

    cropArea.style.width = `${Math.abs(width)}px`;
    cropArea.style.height = `${Math.abs(height)}px`;

    if (width < 0) {
        cropArea.style.left = `${currentX}px`;
    }

    if (height < 0) {
        cropArea.style.top = `${currentY}px`;
    }
}

function endCrop(event) {
    if (!isCropping) return;

    isCropping = false;

    const cropRect = cropArea.getBoundingClientRect();
    const imgRect = img.getBoundingClientRect();

    const cropX = cropRect.left - imgRect.left;
    const cropY = cropRect.top - imgRect.top;
    const cropWidth = cropRect.width;
    const cropHeight = cropRect.height;

    cropImage(cropX, cropY, cropWidth, cropHeight);
    cropArea.remove();
    cropArea = null;
}

function cropImage(x, y, width, height) {
    const context = canvas.getContext('2d');
    const imageObj = new Image();

    imageObj.onload = function() {
        canvas.width = width;
        canvas.height = height;

        context.drawImage(imageObj, x, y, width, height, 0, 0, canvas.width, canvas.height);
        img.src = canvas.toDataURL();
    };
    imageObj.src = img.src;
}
