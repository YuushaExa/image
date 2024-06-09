const uploadInput = document.getElementById('upload');
const dropArea = document.getElementById('drop-area');
const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
let originalImage = null;

uploadInput.addEventListener('change', handleFileSelect);
dropArea.addEventListener('dragover', handleDragOver);
dropArea.addEventListener('drop', handleDrop);
dropArea.addEventListener('click', () => uploadInput.click());
document.addEventListener('paste', handlePaste);

const controls = ['brightness', 'contrast', 'saturation'];
controls.forEach(control => {
    document.getElementById(control).addEventListener('input', applyFilters);
});

function handleFileSelect(event) {
    const file = event.target.files[0];
    if (file) {
        loadImage(file);
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
        loadImage(file);
    }
}

function handlePaste(event) {
    const items = (event.clipboardData || event.originalEvent.clipboardData).items;
    for (const item of items) {
        if (item.kind === 'file' && item.type.startsWith('image/')) {
            const file = item.getAsFile();
            if (file) {
                loadImage(file);
            }
        }
    }
}

function loadImage(file) {
    const reader = new FileReader();
    reader.onload = function(e) {
        const img = new Image();
        img.onload = function() {
            canvas.width = img.width;
            canvas.height = img.height;
            ctx.drawImage(img, 0, 0);
            originalImage = ctx.getImageData(0, 0, img.width, img.height);
            canvas.style.display = 'block';
        };
        img.src = e.target.result;
    };
    reader.readAsDataURL(file);
}

function applyFilters() {
    if (!originalImage) return;

    const brightness = parseInt(document.getElementById('brightness').value);
    const contrast = parseInt(document.getElementById('contrast').value);
    const saturation = parseInt(document.getElementById('saturation').value);

    ctx.putImageData(originalImage, 0, 0);
    let imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

    const data = imageData.data;
    for (let i = 0; i < data.length; i += 4) {
        let r = data[i];
        let g = data[i + 1];
        let b = data[i + 2];

        // Apply brightness
        r = r + brightness;
        g = g + brightness;
        b = b + brightness;

        // Apply contrast
        r = ((r - 128) * contrast / 100) + 128;
        g = ((g - 128) * contrast / 100) + 128;
        b = ((b - 128) * contrast / 100) + 128;

        // Apply saturation
        const avg = (r + g + b) / 3;
        r = avg + (r - avg) * (saturation / 100);
        g = avg + (g - avg) * (saturation / 100);
        b = avg + (b - avg) * (saturation / 100);

        data[i] = r;
        data[i + 1] = g;
        data[i + 2] = b;
    }

    ctx.putImageData(imageData, 0, 0);
}
