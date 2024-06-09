const uploadInput = document.getElementById('upload');
const imageUrlInput = document.getElementById('image-url');
const loadUrlButton = document.getElementById('load-url');
const cropButton = document.getElementById('crop-btn');

const brightnessInput = document.getElementById('brightness');
const contrastInput = document.getElementById('contrast');
const saturationInput = document.getElementById('saturation');

const stage = new Konva.Stage({
    container: 'stage-container',
    width: 600,
    height: 400,
});

const layer = new Konva.Layer();
stage.add(layer);

let imageNode;
let imageObj = new Image();

uploadInput.addEventListener('change', handleFileSelect);
loadUrlButton.addEventListener('click', handleImageUrl);
cropButton.addEventListener('click', initiateCrop);

brightnessInput.addEventListener('input', updateFilters);
contrastInput.addEventListener('input', updateFilters);
saturationInput.addEventListener('input', updateFilters);

function handleFileSelect(event) {
    const file = event.target.files[0];
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
    imageObj.src = src;
    imageObj.onload = () => {
        if (imageNode) {
            imageNode.destroy();
        }

        imageNode = new Konva.Image({
            image: imageObj,
            x: 0,
            y: 0,
            draggable: true,
        });

        layer.add(imageNode);
        layer.draw();
    };
}

function updateFilters() {
    const brightness = parseInt(brightnessInput.value);
    const contrast = parseInt(contrastInput.value);
    const saturation = parseInt(saturationInput.value);

    imageNode.cache();
    imageNode.filters([
        Konva.Filters.Brighten,
        Konva.Filters.Contrast,
        Konva.Filters.HSL,
    ]);

    imageNode.brightness(brightness / 100);
    imageNode.contrast(contrast / 100);
    imageNode.saturation(saturation / 100);
    layer.draw();
}

function initiateCrop() {
    if (!imageNode) return;

    const cropRect = new Konva.Rect({
        x: 50,
        y: 50,
        width: 200,
        height: 100,
        stroke: 'black',
        dash: [10, 5],
        draggable: true,
        dragBoundFunc: function(pos) {
            const newX = Math.max(0, Math.min(pos.x, stage.width() - cropRect.width()));
            const newY = Math.max(0, Math.min(pos.y, stage.height() - cropRect.height()));
            return {
                x: newX,
                y: newY,
            };
        },
    });

    layer.add(cropRect);
    layer.draw();

    cropButton.textContent = 'Apply Crop';
    cropButton.removeEventListener('click', initiateCrop);
    cropButton.addEventListener('click', () => applyCrop(cropRect));
}

function applyCrop(cropRect) {
    const cropX = cropRect.x();
    const cropY = cropRect.y();
    const cropWidth = cropRect.width();
    const cropHeight = cropRect.height();

    const croppedCanvas = document.createElement('canvas');
    croppedCanvas.width = cropWidth;
    croppedCanvas.height = cropHeight;

    const croppedCtx = croppedCanvas.getContext('2d');
    croppedCtx.drawImage(
        imageObj,
        cropX,
        cropY,
        cropWidth,
        cropHeight,
        0,
        0,
        cropWidth,
        cropHeight
    );

    imageObj.src = croppedCanvas.toDataURL();
    imageObj.onload = () => {
        imageNode.image(imageObj);
        imageNode.size({
            width: cropWidth,
            height: cropHeight,
        });
        imageNode.position({
            x: 0,
            y: 0,
        });

        cropRect.destroy();
        layer.draw();

        cropButton.textContent = 'Crop';
        cropButton.removeEventListener('click', applyCrop);
        cropButton.addEventListener('click', initiateCrop);
    };
}
