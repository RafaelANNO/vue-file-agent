"use strict";
exports.__esModule = true;
var drop_handler_1 = require("./drop-handler");
var ImageOrientation;
(function (ImageOrientation) {
    ImageOrientation[ImageOrientation["NORMAL"] = 1] = "NORMAL";
    ImageOrientation[ImageOrientation["UPSIDE_DOWN"] = 6] = "UPSIDE_DOWN";
})(ImageOrientation || (ImageOrientation = {}));
var Utils = /** @class */ (function () {
    function Utils() {
    }
    Utils.prototype.arrayMove = function (arr, previousIndex, newIndex) {
        // https://github.com/Jexordexan/vue-slicksort/blob/master/src/utils.js
        var array = arr.slice(0);
        if (newIndex >= array.length) {
            var k = newIndex - array.length;
            while (k-- + 1) {
                array.push(undefined);
            }
        }
        array.splice(newIndex, 0, array.splice(previousIndex, 1)[0]);
        return array;
    };
    Utils.prototype.getAverageColor = function (arr) {
        var bytesPerPixel = 4;
        var arrLength = arr.length;
        if (arrLength < bytesPerPixel) {
            return;
        }
        var step = 5;
        var len = arrLength - (arrLength % bytesPerPixel);
        var preparedStep = (step || 1) * bytesPerPixel;
        var redTotal = 0;
        var greenTotal = 0;
        var blueTotal = 0;
        var alphaTotal = 0;
        var count = 0;
        for (var i = 0; i < len; i += preparedStep) {
            var alpha = arr[i + 3];
            var red = arr[i] * alpha;
            var green = arr[i + 1] * alpha;
            var blue = arr[i + 2] * alpha;
            redTotal += red;
            greenTotal += green;
            blueTotal += blue;
            alphaTotal += alpha;
            count++;
        }
        return alphaTotal
            ? [
                Math.round(redTotal / alphaTotal),
                Math.round(greenTotal / alphaTotal),
                Math.round(blueTotal / alphaTotal),
                Math.round(alphaTotal / count),
            ]
            : [0, 0, 0, 0];
    };
    Utils.prototype.createVideoThumbnail = function (video, canvas, thumbnailSize, calculateAverageColor, withCredentials) {
        var _this = this;
        if (withCredentials) {
        }
        video.setAttribute('crossOrigin', withCredentials ? 'use-credentials' : 'anonymous'); // fix cross origin issue
        return new Promise(function (resolve, reject) {
            var loadedmetadata = false;
            var loadeddata = false;
            var tryGetThumbnail = function () {
                if (!(loadedmetadata && loadeddata)) {
                    return;
                }
                var context = canvas.getContext('2d');
                context.drawImage(video, 0, 0, canvas.width, canvas.height);
                var color;
                if (calculateAverageColor) {
                    var imageData = context.getImageData(0, 0, canvas.width, canvas.height);
                    color = _this.getAverageColor(imageData.data);
                }
                var url = canvas.toDataURL();
                resolve({
                    url: url,
                    color: color,
                    width: video.videoWidth,
                    height: video.videoHeight
                });
            };
            // Load metadata of the video to get video duration and dimensions
            video.addEventListener('loadedmetadata', function () {
                // var video_duration = video.duration;
                canvas.width = thumbnailSize;
                canvas.height = (canvas.width / video.videoWidth) * video.videoHeight;
                video.currentTime = 1; // video time
                loadedmetadata = true;
                tryGetThumbnail();
            });
            video.addEventListener('loadeddata', function () {
                loadeddata = true;
                tryGetThumbnail();
            });
        });
    };
    Utils.prototype.getDataURL = function (file) {
        return new Promise(function (resolve, reject) {
            var reader = new FileReader();
            reader.onload = function (event) {
                if (!(event.target && event.target.result)) {
                    return resolve('');
                }
                resolve(event.target.result);
            };
            reader.readAsDataURL(file);
        });
    };
    Utils.prototype.getImageOrientationFromArrayBuffer = function (buffer) {
        // -2: not jpeg
        // -1: not defined
        var view = new DataView(buffer);
        if (view.getUint16(0, false) !== 0xffd8) {
            return -2;
        }
        var length = view.byteLength;
        var offset = 2;
        while (offset < length) {
            if (view.getUint16(offset + 2, false) <= 8) {
                return -1;
            }
            var marker = view.getUint16(offset, false);
            offset += 2;
            if (marker === 0xffe1) {
                if (view.getUint32((offset += 2), false) !== 0x45786966) {
                    return -1;
                }
                var little = view.getUint16((offset += 6), false) === 0x4949;
                offset += view.getUint32(offset + 4, little);
                var tags = view.getUint16(offset, little);
                offset += 2;
                for (var i = 0; i < tags; i++) {
                    if (view.getUint16(offset + i * 12, little) === 0x0112) {
                        return view.getUint16(offset + i * 12 + 8, little);
                    }
                }
                // tslint:disable-next-line
            }
            else if ((marker & 0xff00) !== 0xff00) {
                break;
            }
            else {
                offset += view.getUint16(offset, false);
            }
        }
        return -1;
    };
    Utils.prototype.getImageOrientation = function (file) {
        var _this = this;
        return new Promise(function (resolve, reject) {
            var reader = new FileReader();
            if (!reader.readAsArrayBuffer) {
                return resolve(-3);
            }
            reader.onload = function (event) {
                if (!(event.target && event.target.result)) {
                    return resolve(-3);
                }
                resolve(_this.getImageOrientationFromArrayBuffer(event.target.result));
            };
            // https://stackoverflow.com/questions/3248946/what-is-the-maximum-size-of-jpeg-metadata
            // https://twitter.com/jaffathecake/status/1085443592678752256
            // reader.readAsArrayBuffer(file);
            reader.readAsArrayBuffer(file.slice(0, 65536));
        });
    };
    Utils.prototype.rotateCanvas = function (srcOrientation, canvas, ctx, width, height) {
        // set proper canvas dimensions before transform & export
        if (4 < srcOrientation && srcOrientation < 9) {
            canvas.width = height;
            canvas.height = width;
        }
        else {
            canvas.width = width;
            canvas.height = height;
        }
        // transform context before drawing image
        switch (srcOrientation) {
            case 2:
                ctx.transform(-1, 0, 0, 1, width, 0);
                break;
            case 3:
                ctx.transform(-1, 0, 0, -1, width, height);
                break;
            case 4:
                ctx.transform(1, 0, 0, -1, 0, height);
                break;
            case 5:
                ctx.transform(0, 1, 1, 0, 0, 0);
                break;
            case 6:
                ctx.transform(0, 1, -1, 0, height, 0);
                break;
            case 7:
                ctx.transform(0, -1, -1, 0, height, width);
                break;
            case 8:
                ctx.transform(0, -1, 1, 0, 0, width);
                break;
            default:
                break;
        }
    };
    Utils.prototype.getImageResized = function (image, widthLimit, heightLimit, orientation, calculateAverageColor) {
        var width = image.width;
        var height = image.height;
        var thumbnailSize = widthLimit;
        if (widthLimit && heightLimit) {
            width = widthLimit;
            height = heightLimit;
        }
        else {
            if (width > height) {
                if (width > thumbnailSize) {
                    height *= thumbnailSize / width;
                    width = thumbnailSize;
                }
            }
            else {
                if (height > thumbnailSize) {
                    width *= thumbnailSize / height;
                    height = thumbnailSize;
                }
            }
        }
        width = Math.floor(width);
        height = Math.floor(height);
        var canvas = document.createElement('canvas');
        var context = canvas.getContext('2d');
        if (!context) {
            return null;
        }
        canvas.width = width;
        canvas.height = height;
        if (orientation !== undefined) {
            this.rotateCanvas(orientation, canvas, context, width, height);
        }
        context.drawImage(image, 0, 0, width, height);
        var avgColor = null;
        try {
            var rgba = void 0;
            if (calculateAverageColor) {
                var imageData = context.getImageData(0, 0, width, height);
                rgba = this.getAverageColor(imageData.data);
            }
            if (rgba) {
                avgColor = rgba;
            }
        }
        catch (e) {
            /* security error, img on diff domain */
        }
        return {
            image: image,
            url: canvas.toDataURL('image/png'),
            color: avgColor
        };
    };
    Utils.prototype.resizeImageUrl = function (image, url, thumbnailSize, calculateAverageColor) {
        var _this = this;
        return new Promise(function (resolve, reject) {
            image.onload = function () {
                if (!calculateAverageColor) {
                    resolve({
                        image: image,
                        url: url,
                        color: undefined
                    });
                    return;
                }
                var resized = _this.getImageResized(image, thumbnailSize, undefined, undefined, calculateAverageColor);
                if (resized) {
                    resized.url = url;
                }
                resolve(resized);
            };
            image.onerror = function () {
                reject('Image loading failed: ' + url);
            };
            image.src = url;
        });
    };
    Utils.prototype.resizeImageFile = function (image, file, thumbnailSize, calculateAverageColor) {
        var _this = this;
        return new Promise(function (resolve, reject) {
            if (file.type.indexOf('image') === -1) {
                reject(new Error('Not an image'));
                return;
            }
            var createObjectURL = (window.URL || window.webkitURL || {}).createObjectURL;
            var revokeObjectURL = (window.URL || window.webkitURL || {}).revokeObjectURL;
            var shouldRevoke = false;
            var orientationPromise = _this.getImageOrientation(file);
            image.onload = function () {
                orientationPromise.then(function (orientation) {
                    var resized = _this.getImageResized(image, thumbnailSize, undefined, orientation, calculateAverageColor);
                    if (shouldRevoke) {
                        revokeObjectURL(image.src);
                    }
                    resolve(resized);
                });
            };
            if (!(file instanceof File)) {
                return reject('Invalid file object. Use url or a valid instance of File class');
            }
            if (createObjectURL && revokeObjectURL) {
                shouldRevoke = true;
                image.src = createObjectURL(file);
                return;
            }
            _this.getDataURL(file).then(function (dataUrl) {
                image.src = dataUrl;
            });
        });
    };
    Utils.prototype.resizeImage = function (thumbnailSize, file, url, calculateAverageColor, withCredentials) {
        var image = new Image();
        image.setAttribute('crossOrigin', withCredentials ? 'use-credentials' : 'anonymous');
        return url
            ? this.resizeImageUrl(image, url, thumbnailSize, calculateAverageColor)
            : this.resizeImageFile(image, file, thumbnailSize, calculateAverageColor);
    };
    Utils.prototype.getSizeFormatted = function (bytes) {
        var sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
        if (bytes === 0) {
            return '0 B';
        }
        var i = Math.floor(Math.log(bytes) / Math.log(1024));
        i = parseInt('' + i, 10);
        return Math.round(bytes / Math.pow(1024, i)) + ' ' + sizes[i];
    };
    Utils.prototype.getSizeParsed = function (size) {
        size = ('' + size).toUpperCase();
        var matches = size.match(/([\d|.]+?)\s*?([A-Z]+)/);
        var sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
        if (!matches) {
            return parseFloat(size);
        }
        var i = sizes.indexOf(matches[2]);
        if (i === -1) {
            return parseFloat(size);
        }
        return parseFloat(matches[1]) * Math.pow(1024, i);
    };
    Utils.prototype.getColorForText = function (text) {
        var getHashCode = function (value) {
            var hash = 0;
            if (value.length === 0) {
                return hash;
            }
            for (var i = 0; i < value.length; i++) {
                // tslint:disable-next-line
                hash = value.charCodeAt(i) + ((hash << 5) - hash);
                // tslint:disable-next-line
                hash = hash & hash; // Convert to 32bit integer
            }
            return hash;
        };
        var intToHSL = function (value) {
            var h = value % 360;
            var s = value % 100;
            var l = 50;
            return 'hsl(' + h + ',' + s + '%,' + l + '%, 0.75)';
        };
        return intToHSL(getHashCode(text.toLowerCase()));
    };
    Utils.prototype.validateType = function (file, accept) {
        // https://developer.mozilla.org/en-US/docs/Web/HTML/Element/input/file#accept
        // https://gitlab.com/meno/dropzone/blob/master/src/dropzone.js#L2511
        if (!accept) {
            return true;
        } // If there are no accepted mime types, it's OK
        var acceptedFiles = accept.split(',');
        var mimeType = file.type;
        var baseMimeType = mimeType.replace(/\/.*$/, '');
        for (var _i = 0, acceptedFiles_1 = acceptedFiles; _i < acceptedFiles_1.length; _i++) {
            var validType = acceptedFiles_1[_i];
            validType = validType.trim();
            if (validType.charAt(0) === '.') {
                // extension
                if (file.name.toLowerCase().indexOf(validType.toLowerCase(), file.name.length - validType.length) !== -1) {
                    return true;
                }
            }
            else if (/\/\*$/.test(validType)) {
                // This is something like a image/* mime type
                if (baseMimeType === validType.replace(/\/.*$/, '')) {
                    return true;
                }
            }
            else {
                if (mimeType === validType) {
                    return true;
                }
            }
        }
        return false;
    };
    Utils.prototype.validateSize = function (file, maxSize) {
        if (!maxSize) {
            return true;
        }
        var bytes = this.getSizeParsed(maxSize);
        return file.size <= bytes;
    };
    Utils.prototype.getFilesFromDroppedItems = function (dataTransfer) {
        return drop_handler_1.getFilesFromDroppedItems(dataTransfer);
    };
    return Utils;
}());
exports["default"] = new Utils();
