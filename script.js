const uploadInput = document.getElementById('upload');
const dropArea = document.getElementById('drop-area');
const img = document.getElementById('image');
const imageUrlInput = document.getElementById('image-url');
const loadUrlButton = document.getElementById('load-url');
const cropButton = document.getElementById('crop-btn');

let cropper;

uploadInput.addEventListener('change', handleFileSelect);
dropArea.addEventListener('dragover', handleDragOver);
dropArea.addEventListener('drop', handleDrop);
dropArea.addEventListener('click', () => uploadInput.click());
loadUrlButton.addEventListener('click', handleImageUrl);
cropButton.addEventListener('click', cropImage);

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
        if (cropper) {
            cropper.destroy();
        }
        cropper = new Cropper(img, {
            aspectRatio: NaN,
            viewMode: 1
        });
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

function cropImage() {
    if (cropper) {
        const canvas = cropper.getCroppedCanvas();
        img.src = canvas.toDataURL();
        cropper.destroy();
        cropper = null;
    }
}
