"use strict";
exports.__esModule = true;
var icons_1 = require("./icons");
var utils_1 = require("./utils");
var FileRecord = /** @class */ (function () {
    function FileRecord(data, options) {
        this.urlValue = null;
        this.urlResized = null;
        this.image = {};
        this.isPlayingAv = false;
        this.oldFileName = null;
        this.oldCustomName = null;
        this.upload = { data: null, error: false };
        this.urlValue = null;
        this.urlResized = null;
        this.lastKnownSrc = null;
        this.image = {};
        this.isPlayingAv = false;
        this.oldFileName = null;
        this.oldCustomName = null;
        this.raw = data;
        this.file = data.file instanceof File ? data.file : this.createDummyFile(data);
        this.progressInternal = !isNaN(data.progress) ? data.progress : 0;
        // this.width = FileRecord.defaultWidth;
        // this.height = FileRecord.defaultHeight;
        this.thumbnailSize = options.thumbnailSize || 360;
        this.read = !!options.read;
        this.dimensions = data.dimensions || { width: 0, height: 0 };
        this.dimensions.width = this.dimensions.width || 0;
        this.dimensions.height = this.dimensions.height || 0;
        this.error = data.error || false;
        this.options = options;
        this.maxSize = options.maxSize;
        this.accept = options.accept;
        this.id = Math.random() + ':' + new Date().getTime();
        this.videoThumbnail = data.videoThumbnail;
        this.imageColor = data.imageColor;
        this.customName = data.customName;
        this.calculateAverageColor = options.averageColor !== undefined ? options.averageColor : true;
        this.validate();
    }
    FileRecord.getFromRaw = function (rawFileRecord, options, isSync) {
        if (isSync === void 0) { isSync = false; }
        var fileRecord = new FileRecord(rawFileRecord, options);
        var promise = fileRecord.setUrl(rawFileRecord.url);
        rawFileRecord.progress = fileRecord.progress.bind(fileRecord); // convert it as a function
        rawFileRecord.src = fileRecord.src.bind(fileRecord);
        rawFileRecord.name = fileRecord.name.bind(fileRecord); // convert it as a function
        if (isSync) {
            return fileRecord;
        }
        return promise;
    };
    FileRecord.fromRaw = function (rawFileRecord, options) {
        return FileRecord.getFromRaw(rawFileRecord, options, false);
    };
    FileRecord.fromRawSync = function (rawFileRecord, options) {
        return FileRecord.getFromRaw(rawFileRecord, options, true);
    };
    FileRecord.fromRawArray = function (rawFileRecords, options) {
        var promises = [];
        for (var _i = 0, rawFileRecords_1 = rawFileRecords; _i < rawFileRecords_1.length; _i++) {
            var rawFileRecord = rawFileRecords_1[_i];
            promises.push(FileRecord.fromRaw(rawFileRecord, options));
        }
        return Promise.all(promises);
    };
    FileRecord.toRawArray = function (fileRecords) {
        var rawFileRecords = [];
        for (var _i = 0, fileRecords_1 = fileRecords; _i < fileRecords_1.length; _i++) {
            var fileRecord = fileRecords_1[_i];
            rawFileRecords.push(fileRecord.toRaw());
        }
        return rawFileRecords;
    };
    FileRecord.readFile = function (fileRecord) {
        return new Promise(function (resolve, reject) {
            if (!fileRecord.read) {
                fileRecord.setUrl(null).then(function () {
                    resolve(fileRecord);
                }, function (err) {
                    // ignore error
                    resolve(fileRecord);
                });
                return;
            }
            utils_1["default"].getDataURL(fileRecord.file).then(function (dataUrl) {
                fileRecord.setUrl(dataUrl).then(function () {
                    resolve(fileRecord);
                }, reject);
            }, reject);
        });
    };
    FileRecord.readFiles = function (fileRecords) {
        var promises = [];
        for (var _i = 0, fileRecords_2 = fileRecords; _i < fileRecords_2.length; _i++) {
            var fileRecord = fileRecords_2[_i];
            promises.push(FileRecord.readFile(fileRecord));
        }
        return Promise.all(promises);
    };
    // populate(data, options = {}) {}
    FileRecord.prototype.createDummyFile = function (data) {
        var file = {};
        file.lastModified = data.lastModified;
        var d = new Date();
        if (file.lastModified) {
            d.setTime(file.lastModified);
        }
        file.lastModifiedDate = d;
        file.name = typeof data.name === 'function' ? data.name() : data.name;
        file.size = data.size;
        file.type = data.type;
        return file;
    };
    FileRecord.prototype.hasProgress = function () {
        return !isNaN(this.progressInternal); // && this._progress <= 100;
    };
    FileRecord.prototype.progress = function (value) {
        if (value !== undefined) {
            this.progressInternal = value;
            return;
        }
        return this.progressInternal || 0;
    };
    FileRecord.prototype.url = function (value) {
        if (value !== undefined) {
            return this.setUrl(value);
        }
        return this.urlValue || undefined;
    };
    FileRecord.prototype.src = function () {
        if (this.isImage()) {
            return this.urlResized || this.urlValue || this.file.url;
        }
        if (this.isPlayableVideo()) {
            return this.videoThumbnail || '';
        }
        return '';
    };
    FileRecord.prototype.size = function () {
        if (!this.file) {
            return '';
        }
        return utils_1["default"].getSizeFormatted(this.file.size);
    };
    FileRecord.prototype.ext = function () {
        if (this.file && this.file.name.indexOf('.') !== -1) {
            return this.file.name.split('.').pop();
        }
        return '?';
        // return this.file.type.split('/').shift();
    };
    FileRecord.prototype.name = function (withoutExt) {
        var ext = this.ext();
        if (this.customName) {
            return this.customName + (withoutExt ? '' : ext !== '?' ? '.' + ext : '');
        }
        var name = this.file && this.file.name;
        if (withoutExt) {
            if (ext !== '?') {
                return name.substr(0, name.length - (ext.length + 1));
            }
        }
        return name;
    };
    FileRecord.prototype.isDarkColor = function () {
        if (this.imageColor) {
            var rgb = this.imageColor;
            var darkPoint = 20;
            return rgb[0] <= darkPoint && rgb[1] <= darkPoint && rgb[2] <= darkPoint;
        }
        return false;
    };
    FileRecord.prototype.color = function () {
        if (this.imageColor) {
            var rgb = this.imageColor;
            return 'rgb(' + rgb[0] + ', ' + rgb[1] + ', ' + rgb[2] + ')';
        }
        if (this.isImage()) {
            return 'transparent';
        }
        var ext = this.ext();
        var svgIcon = this.icon();
        // var svgIcon = getIconFromExt(ext);
        if (svgIcon.color) {
            return svgIcon.color;
        }
        return utils_1["default"].getColorForText(ext);
    };
    FileRecord.prototype.isImage = function () {
        return this.file && !!this.file.type.match(/image((?!vnd).)*$/i);
    };
    FileRecord.prototype.isVideo = function () {
        return this.file && this.file.type.indexOf('video') !== -1;
    };
    FileRecord.prototype.isPlayableVideo = function () {
        return this.icon().category === 'video-playable';
    };
    FileRecord.prototype.isAudio = function () {
        return this.file && this.file.type.indexOf('audio') !== -1;
    };
    FileRecord.prototype.isPlayableAudio = function () {
        return this.icon().category === 'audio-playable';
    };
    FileRecord.prototype.isText = function () {
        return this.file && this.file.type.indexOf('text') !== -1;
    };
    FileRecord.prototype.setUrl = function (url) {
        var _this = this;
        this.urlValue = url;
        return new Promise(function (resolve, reject) {
            if (_this.isImage()) {
                _this.resizeImage().then(function () {
                    resolve(_this);
                }, function (err) {
                    resolve(_this);
                });
                return;
            }
            resolve(_this);
        });
    };
    FileRecord.prototype.imageResized = function (resized) {
        if (!resized) {
            return;
        }
        this.urlResized = resized.url;
        this.image = resized.image;
        if (resized.image && resized.image.width && resized.image.height) {
            this.dimensions.width = resized.image.width;
            this.dimensions.height = resized.image.height;
        }
        this.lastKnownSrc = this.urlResized;
        this.imageColor = resized.color;
    };
    FileRecord.prototype.resizeImage = function () {
        var _this = this;
        return new Promise(function (resolve, reject) {
            utils_1["default"]
                .resizeImage(_this.thumbnailSize, _this.file, _this.urlValue, _this.calculateAverageColor)
                .then(function (resized) {
                _this.imageResized(resized);
                resolve(_this);
            })["catch"](reject);
        });
    };
    FileRecord.prototype.icon = function () {
        var ext = this.ext();
        var svgIcon = icons_1.getIconFromExt(ext);
        return svgIcon;
    };
    FileRecord.prototype.getErrorMessage = function (errorText) {
        var error = this.error;
        if (!error) {
            return '';
        }
        errorText = errorText || {};
        errorText = {
            common: errorText.common || 'Invalid file.',
            type: errorText.type || 'Invalid file type.',
            size: errorText.size || 'Files should not exceed ' + this.maxSize + ' in size'
        };
        if (error.type) {
            return errorText.type;
        }
        else if (error.size) {
            return errorText.size;
        }
        else if (error.upload) {
            return this.upload.error ? this.upload.error : error.upload;
        }
        return errorText.common;
    };
    FileRecord.prototype.toRaw = function () {
        var _this = this;
        var raw = this.raw || {};
        // raw.url = this.urlValue;
        raw.url = this.url.bind(this);
        raw.urlResized = this.urlResized;
        raw.src = this.src.bind(this);
        raw.name = this.name.bind(this);
        raw.lastModified = this.file.lastModified;
        raw.sizeText = this.size();
        raw.size = this.file.size;
        raw.type = this.file.type;
        raw.ext = this.ext();
        raw.color = this.color();
        raw.file = this.file;
        raw.progress = this.progress.bind(this); // pass it as a function
        raw.upload = this.upload;
        if (!('error' in raw)) {
            Object.defineProperty(raw, 'error', {
                get: function () {
                    return _this.error;
                }
            });
        }
        raw.dimensions = this.dimensions;
        return raw;
    };
    FileRecord.prototype.validate = function () {
        var validType = utils_1["default"].validateType(this.file, this.accept);
        var validSize = utils_1["default"].validateSize(this.file, this.maxSize);
        if (!validType || !validSize) {
            this.error = {
                type: !validType,
                size: !validSize
            };
        }
        else {
            this.error = false;
        }
    };
    return FileRecord;
}());
exports["default"] = FileRecord;
