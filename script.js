document.addEventListener('DOMContentLoaded', function() {
    const uploadInput = document.getElementById('upload');
    const imageUrlInput = document.getElementById('image-url');
    const loadUrlButton = document.getElementById('load-url');
    const cropButton = document.getElementById('crop-btn');
    const canvas = new fabric.Canvas('canvas');

    let imgInstance;

    uploadInput.addEventListener('change', handleFileSelect);
    loadUrlButton.addEventListener('click', handleImageUrl);
    cropButton.addEventListener('click', handleCrop);

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
            canvas.setWidth(oImg.width);
            canvas.setHeight(oImg.height);
            canvas.add(oImg);
            canvas.renderAll();
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

    function handleCrop() {
        if (!imgInstance) return;

        const activeObject = canvas.getActiveObject();

        if (activeObject && activeObject.type === 'rect') {
            const cropRect = activeObject.getBoundingRect();
            const cropped = new fabric.Image(imgInstance.getElement(), {
                left: cropRect.left,
                top: cropRect.top,
                width: cropRect.width,
                height: cropRect.height,
                clipPath: new fabric.Rect({
                    left: cropRect.left,
                    top: cropRect.top,
                    width: cropRect.width,
                    height: cropRect.height
                })
            });

            canvas.clear();
            canvas.setWidth(cropRect.width);
            canvas.setHeight(cropRect.height);
            canvas.add(cropped);
            canvas.renderAll();
        } else {
            const rect = new fabric.Rect({
                left: 100,
                top: 100,
                width: 200,
                height: 100,
                fill: 'rgba(0,0,0,0.3)',
                selectable: true
            });
            canvas.add(rect);
        }
    }
});
