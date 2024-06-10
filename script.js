document.addEventListener('DOMContentLoaded', function() {
    const uploadInput = document.getElementById('upload');
    const dropArea = document.getElementById('drop-area');
    const img = document.getElementById('image');
    const imageUrlInput = document.getElementById('image-url');
    const loadUrlButton = document.getElementById('load-url');
    const cropButton = document.getElementById('crop-btn');
    const canvas = document.getElementById('myCanvas');
    const ctx = canvas.getContext('2d');

    let cropArea = null;
    let startX, startY, isDragging = false;
    let cropStarted = false;

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
        if (!cropStarted) {
            // Start cropping
            if (cropArea) {
                cropArea.remove();
            }

            cropArea = document.createElement('div');
            cropArea.classList.add('crop-area');
            dropArea.appendChild(cropArea);

            dropArea.addEventListener('mousedown', startCrop);
            dropArea.addEventListener('mousemove', moveCrop);
            dropArea.addEventListener('mouseup', endCrop);

            cropButton.textContent = 'Confirm Crop';
            cropStarted = true;
        } else {
            // Confirm crop
            if (!cropArea) return;

            const cropRect = cropArea.getBoundingClientRect();
            const imgRect = img.getBoundingClientRect();

            const cropX = cropRect.left - imgRect.left;
            const cropY = cropRect.top - imgRect.top;
            const cropWidth = cropRect.width;
            const cropHeight = cropRect.height;

            cropImage(cropX, cropY, cropWidth, cropHeight);
            cropArea.remove();
            cropArea = null;
            cropButton.textContent = 'Crop';
            cropStarted = false;
        }
    }

    function startCrop(event) {
        if (!cropArea) return;

        startX = event.offsetX;
        startY = event.offsetY;
        isDragging = true;

        cropArea.style.left = `${startX}px`;
        cropArea.style.top = `${startY}px`;
        cropArea.style.width = '0';
        cropArea.style.height = '0';
        cropArea.style.display = 'block';
    }

    function moveCrop(event) {
        if (!isDragging || !cropArea) return;

        const currentX = event.offsetX;
        const currentY = event.offsetY;

        const width = currentX - startX;
        const height = currentY - startY;

        cropArea.style.width = `${width}px`;
        cropArea.style.height = `${height}px`;
    }

    function endCrop() {
        if (!cropArea) return;

        isDragging = false;
    }

    function cropImage(x, y, width, height) {
        const imgWidth = img.naturalWidth;
        const imgHeight = img.naturalHeight;
        const imgX = (imgWidth / img.clientWidth) * x;
        const imgY = (imgHeight / img.clientHeight) * y;
        const imgWidthScaled = (imgWidth / img.clientWidth) * width;
        const imgHeightScaled = (imgHeight / img.clientHeight) * height;

        canvas.width = width;
        canvas.height = height;

        ctx.drawImage(img, imgX, imgY, imgWidthScaled, imgHeightScaled, 0, 0, width, height);
        img.src = canvas.toDataURL();
    }
});
