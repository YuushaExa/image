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


    let imgInstance;
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

 // Ruler

var rectangle = new fabric.Rect({
  fill: 'transparent',
  stroke: 'black',
  strokeWidth: 2,
  top: 60,
  left: 60,
  width: 600,
  height: 300,
  selectable: false
});
var pins = [];
var outerCircle = new fabric.Circle({
  radius: 7.5,
  fill: 'transparent',
  stroke: 'black',
  strokeWidth: 2
});
pins.push(outerCircle);
var innerCircle = new fabric.Circle({
  radius: 5,
  fill: 'transparent',
  stroke: 'black',
  strokeWidth: 2,
  top: 2.5,
  left: 2.5
});
pins.push(innerCircle);
var pinTopLeft = new fabric.Group(pins, {
  top: 67.5,
  left: 67.5,
  selectable: false
});
var pinTopRight = new fabric.Group(pins, {
  top: 67.5,
  left: rectangle.width + rectangle.left - 22.5,
  selectable: false
});
var pinBottomLeft = new fabric.Group(pins, {
  top: rectangle.height + rectangle.top - 22.5,
  left: 67.5,
  selectable: false
});
var pinBottomRight = new fabric.Group(pins, {
  top: rectangle.height + rectangle.top - 22.5,
  left: rectangle.width + rectangle.left - 22.5,
  selectable: false
});
var textSample = new fabric.Text('GORAN', {
  top: 170,
  left: 220,
  scaleX: 2,
  scaleY: 2
});
canvas.add(rectangle, pinTopLeft, pinTopRight, pinBottomLeft, pinBottomRight, textSample);
canvas.setActiveObject(textSample);
/* ZOOM FUNCTIONS */
$('#zoomIn').click(function() {
  rectangle.set({
    width: rectangle.width * 1.1,
    height: rectangle.height * 1.1
  });
  rectangle.setCoords();
  textSample.set({
    top: 60 + (textSample.top - 60) * 1.1,
    left: 60 + (textSample.left - 60) * 1.1,
    scaleX: textSample.scaleX * 1.1,
    scaleY: textSample.scaleY * 1.1
  });
  textSample.setCoords();
  setPins();
  addLeftRuler();
  addTopRuler();
  resizeCanvas();
});
$('#zoomOut').click(function() {
  rectangle.set({
    width: rectangle.width / 1.1,
    height: rectangle.height / 1.1
  });
  rectangle.setCoords();
  textSample.set({
    top: 60 + (textSample.top - 60) / 1.1,
    left: 60 + (textSample.left - 60) / 1.1,
    scaleX: textSample.scaleX / 1.1,
    scaleY: textSample.scaleY / 1.1
  })
  textSample.setCoords();
  setPins();
  addLeftRuler();
  addTopRuler();
  resizeCanvas();
});

var topRuler;
var addTopRuler = function() {
  canvas.remove(topRuler);
  var ruler = [];
  var rect = new fabric.Rect({
    fill: 'white',
    stroke: 'black',
    strokeWidth: 2,
    width: 2100,
    height: 40,
  });
  ruler.push(rect);
  var line = new fabric.Line(
    [60, 0, 60, 30], {
      strokeWidth: 2,
      stroke: 'black'
    }
  );
  ruler.push(line);
  var number = new fabric.Text('0', {
    scaleX: 0.5,
    scaleY: 0.5,
    top: 18,
    left: 68
  });
  ruler.push(number);
  canvas.add(line);
  var markerSpacing = rectangle.height / 24;
  for (var i = 0; i < 144; i++) {
    var newLine = line.clone();
    newLine.set({
      x1: 60 + (markerSpacing * (i + 1)),
      y1: 0,
      x2: 60 + (markerSpacing * (i + 1)),
      y2: 15,
      strokeWidth: 1,
      stroke: 'black'
    });
    if (((i + 1) % 6) == 0) {
      if (((i + 1) % 12) == 0) {
        newLine.set({
          y2: 30,
          strokeWidth: 2
        });
        var number = new fabric.Text(((i + 1) / 12).toString(), {
          scaleX: 0.5,
          scaleY: 0.5,
          top: 18,
          left: 68 + (markerSpacing * (i + 1))
        });
        ruler.push(number);
      } else {
        newLine.set({
          y2: 20,
          strokeWidth: 2
        });
      }
    }
    ruler.push(newLine);
  }
  topRuler = new fabric.Group(ruler, {
    top: $('.workspace').scrollTop(),
    selectable: false
  });
  canvas.add(topRuler);
  canvas.renderAll();
}
addTopRuler();

var leftRuler;
var addLeftRuler = function() {
  canvas.remove(leftRuler);
  var ruler = [];
  var rect = new fabric.Rect({
    fill: 'white',
    stroke: 'black',
    strokeWidth: 2,
    width: 40,
    height: 800,
  });
  ruler.push(rect);
  var line = new fabric.Line(
    [0, 20, 30, 20], {
      strokeWidth: 2,
      stroke: 'black'
    }
  );
  ruler.push(line);
  var number = new fabric.Text('0', {
    scaleX: 0.5,
    scaleY: 0.5,
    top: 25,
    left: 23
  });
  ruler.push(number);
  canvas.add(line);
  var markerSpacing = rectangle.height / 24;
  for (var i = 0; i < 60; i++) {
    var newLine = line.clone();
    newLine.set({
      x1: 0,
      x2: 15,
      y1: 20 + (markerSpacing * (i + 1)),
      y2: 20 + (markerSpacing * (i + 1)),
      strokeWidth: 1,
      stroke: 'black'
    });
    if (((i + 1) % 6) == 0) {
      if (((i + 1) % 12) == 0) {
        newLine.set({
          x2: 30,
          strokeWidth: 2
        });
        var number = new fabric.Text(((i + 1) / 12).toString(), {
          scaleX: 0.5,
          scaleY: 0.5,
          top: 25 + (markerSpacing * (i + 1)),
          left: 23
        });
        ruler.push(number);
      } else {
        newLine.set({
          x2: 20 / canvas.getZoom(),
          strokeWidth: 2 / canvas.getZoom()
        });
      }
    }
    ruler.push(newLine);
  }
  leftRuler = new fabric.Group(ruler, {
    top: 40,
    left: $('.workspace').scrollLeft(),
    selectable: false
  });
  canvas.add(leftRuler);
  canvas.renderAll();
}
addLeftRuler();

var setPins = function() {
  pinTopRight.set({
    left: rectangle.width + rectangle.left - 22.5
  });
  pinBottomLeft.set({
    top: rectangle.height + rectangle.top - 22.5
  });
  pinBottomRight.set({
    top: rectangle.height + rectangle.top - 22.5,
    left: rectangle.width + rectangle.left - 22.5
  });
}

$('.workspace').scroll(function() {
  leftRuler.set({
    left: $('.workspace').scrollLeft()
  });
  topRuler.set({
    top: $('.workspace').scrollTop()
  });
  canvas.renderAll();
});

var panningOn = false;
$('#toggle').click(function() {
  $('.workspace').removeClass('dragscroll');
  panningOn = !panningOn;
  textSample.selectable = !panningOn;
  canvas.selection = !panningOn;
  canvas.defaultCursor = 'default';
  $('#toggle').html('Turn Panning ON');
  if (panningOn) {
    $('.workspace').addClass('dragscroll');
    $('#toggle').html('Turn Panning OFF');
    canvas.defaultCursor = 'move';
  }
  dragscroll.reset();
});

window.addEventListener('resize', resizeCanvas, false);

function resizeCanvas() {
  if (rectangle.width + 80 > $('.workspace').width()) {
    $('.workspace').css('overflow-x', 'scroll');
    canvas.setWidth(rectangle.width + 80);
  } else {
    $('.workspace').css('overflow-x', 'hidden');
    canvas.setWidth($('.workspace').width() - 20);
  }
  if (rectangle.height + 80 > $('.workspace').height()) {
    $('.workspace').css('overflow-y', 'scroll');
    canvas.setHeight(rectangle.height + 80);
  } else {
    $('.workspace').css('overflow-y', 'hidden');
    canvas.setHeight($('.workspace').height() - 20);
  }
  canvas.renderAll();
}

resizeCanvas();

// **** Code from here to the end comes from, https://github.com/asvd/dragscroll ****
(function(root, factory) {
  if (typeof define === 'function' && define.amd) {
    define(['exports'], factory);
  } else if (typeof exports !== 'undefined') {
    factory(exports);
  } else {
    factory((root.dragscroll = {}));
  }
}(this, function(exports) {
  var _window = window;
  var _document = document;
  var mousemove = 'mousemove';
  var mouseup = 'mouseup';
  var mousedown = 'mousedown';
  var EventListener = 'EventListener';
  var addEventListener = 'add' + EventListener;
  var removeEventListener = 'remove' + EventListener;
  var newScrollX, newScrollY;
  var dragged = [];
  var reset = function(i, el) {
    for (i = 0; i < dragged.length;) {
      el = dragged[i++];
      el = el.container || el;
      el[removeEventListener](mousedown, el.md, 0);
      _window[removeEventListener](mouseup, el.mu, 0);
      _window[removeEventListener](mousemove, el.mm, 0);
    }

    // cloning into array since HTMLCollection is updated dynamically
    dragged = [].slice.call(_document.getElementsByClassName('dragscroll'));
    for (i = 0; i < dragged.length;) {
      (function(el, lastClientX, lastClientY, pushed, scroller, cont) {
        (cont = el.container || el)[addEventListener](
          mousedown,
          cont.md = function(e) {
            if (!el.hasAttribute('nochilddrag') ||
              _document.elementFromPoint(
                e.pageX, e.pageY
              ) == cont
            ) {
              pushed = 1;
              lastClientX = e.clientX;
              lastClientY = e.clientY;

              e.preventDefault();
            }
          }, 0
        );
        _window[addEventListener](
          mouseup, cont.mu = function() {
            pushed = 0;
          }, 0
        );
        _window[addEventListener](
          mousemove,
          cont.mm = function(e) {
            if (pushed) {
              (scroller = el.scroller || el).scrollLeft -=
                newScrollX = (-lastClientX + (lastClientX = e.clientX));
              scroller.scrollTop -=
                newScrollY = (-lastClientY + (lastClientY = e.clientY));
              if (el == _document.body) {
                (scroller = _document.documentElement).scrollLeft -= newScrollX;
                scroller.scrollTop -= newScrollY;
              }
            }
          }, 0
        );
      })(dragged[i++]);
    }
  }
  if (_document.readyState == 'complete') {
    reset();
  } else {
    _window[addEventListener]('load', reset, 0);
  }
  exports.reset = reset;
}));

});
