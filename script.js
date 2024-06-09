const uploadInput = document.getElementById('upload');
const dropArea = document.getElementById('drop-area');
const img = document.getElementById('image');

uploadInput.addEventListener('change', handleFileSelect);
dropArea.addEventListener('dragover', handleDragOver);
dropArea.addEventListener('drop', handleDrop);
dropArea.addEventListener('click', () => uploadInput.click());
document.addEventListener('paste', handlePaste);

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
    const imageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp']; // Add more extensions as needed
    
    for (const item of items) {
        const file = item.getAsFile();
        
        if (file) {
            const fileType = file.type.toLowerCase();
            const fileExtension = fileType.split('/').pop();
            
            if (imageExtensions.includes(fileExtension)) {
                loadImage(file);
            }
        }
    }
}

function loadImage(file) {
    const reader = new FileReader();
    reader.onload = function(e) {
        img.src = e.target.result;
        img.style.display = 'block';
    };
    reader.readAsDataURL(file);
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
