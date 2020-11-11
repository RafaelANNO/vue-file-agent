"use strict";
var __spreadArrays = (this && this.__spreadArrays) || function () {
    for (var s = 0, i = 0, il = arguments.length; i < il; i++) s += arguments[i].length;
    for (var r = Array(s), k = 0, i = 0; i < il; i++)
        for (var a = arguments[i], j = 0, jl = a.length; j < jl; j++, k++)
            r[k] = a[j];
    return r;
};
exports.__esModule = true;
var utils_1 = require("../lib/utils");
var vue_file_icon_vue_1 = require("./vue-file-icon.vue");
var vue_file_preview_vue_1 = require("./vue-file-preview.vue");
var vue_file_list_vue_1 = require("./vue-file-list.vue");
var vue_file_list_item_vue_1 = require("./vue-file-list-item.vue");
var file_record_1 = require("../lib/file-record");
var upload_helper_1 = require("../lib/upload-helper");
var vue_1 = require("vue");
var plugins_1 = require("../lib/plugins");
// tslint:disable-next-line
var dragCounter = 0;
exports["default"] = vue_1["default"].extend({
    props: [
        'accept',
        'auto',
        'averageColor',
        'capture',
        'compact',
        'deletable',
        'disabled',
        'editable',
        'errorText',
        'helpText',
        'linkable',
        'maxFiles',
        'maxSize',
        'meta',
        'multiple',
        'progress',
        'read',
        'readonly',
        'resumable',
        'sortable',
        'theme',
        'thumbnailSize',
        'uploadConfig',
        'uploadHeaders',
        'uploadUrl',
        'uploadWithCredentials',
        'value',
    ],
    components: {
        VueFileIcon: vue_file_icon_vue_1["default"],
        VueFilePreview: vue_file_preview_vue_1["default"],
        VueFileList: vue_file_list_vue_1["default"],
        VueFileListItem: vue_file_list_item_vue_1["default"]
    },
    directives: {
        // https://github.com/Jexordexan/vue-slicksort/blob/master/src/HandleDirective.js
        vfaSortableHandle: {
            bind: function (el) {
                el.sortableHandle = true;
            }
        }
    },
    data: function () {
        return {
            fileRecords: [],
            rawFileRecords: [],
            isDragging: false,
            isSorting: false,
            isSortingActive: false,
            transitionDuration: 300,
            overallProgress: 0,
            uniqueId: '',
            sortTimeout: 0
        };
    },
    computed: {
        withCredentials: function () {
            return this.uploadWithCredentials;
        },
        canAddMore: function () {
            if (!this.hasMultiple) {
                return this.fileRecords.length === 0;
            }
            if (!this.maxFiles) {
                return true;
            }
            return this.fileRecords.length < this.maxFiles;
        },
        helpTextComputed: function () {
            if (this.helpText) {
                return this.helpText;
            }
            return 'Choose ' + (this.hasMultiple ? 'files' : 'file') + ' or drag & drop here';
        },
        isDeletable: function () {
            if (typeof this.deletable === 'string') {
                return this.deletable !== 'false';
            }
            return !!this.deletable;
        },
        isSortable: function () {
            return !!this.sortable;
        },
        hasMultiple: function () {
            if (typeof this.multiple === 'string') {
                return this.multiple !== 'false';
            }
            if (this.multiple === undefined) {
                return Array.isArray(this.value);
            }
            return !!this.multiple;
        },
        shouldRead: function () {
            if (typeof this.read === 'string') {
                return this.read === 'true';
            }
            return !!this.read;
        }
    },
    methods: {
        createThumbnail: function (fileRecord, video) {
            var _this = this;
            return new Promise(function (resolve, reject) {
                var canvas = document.createElement('canvas');
                utils_1["default"]
                    .createVideoThumbnail(video, canvas, fileRecord.thumbnailSize, _this.averageColor !== false, _this.withCredentials)
                    .then(function (thumbnail) {
                    fileRecord.imageColor = thumbnail.color;
                    fileRecord.videoThumbnail = thumbnail.url;
                    fileRecord.dimensions.width = thumbnail.width;
                    fileRecord.dimensions.height = thumbnail.height;
                    resolve();
                }, reject);
            });
        },
        initVideo: function (fileRecord) {
            if (!fileRecord.isPlayableVideo()) {
                return;
            }
            var createObjectURL = (window.URL || window.webkitURL || {}).createObjectURL;
            var revokeObjectURL = (window.URL || window.webkitURL || {}).revokeObjectURL;
            var video = document.createElement('video');
            video.src = createObjectURL(fileRecord.file);
            this.createThumbnail(fileRecord, video).then(function () {
                revokeObjectURL(video.src);
            });
            video.load();
        },
        getFileRecordOrRawInstance: function (fileRecordOrRaw, raw) {
            var i;
            if (fileRecordOrRaw instanceof file_record_1["default"]) {
                i = this.fileRecords.indexOf(fileRecordOrRaw);
            }
            else {
                i = this.rawFileRecords.indexOf(fileRecordOrRaw);
            }
            if (i === -1) {
                return fileRecordOrRaw;
            }
            return raw ? this.rawFileRecords[i] : this.fileRecords[i];
        },
        getFileRecordRawInstance: function (fileRecordOrRaw) {
            return this.getFileRecordOrRawInstance(fileRecordOrRaw, true);
        },
        getFileRecordInstance: function (fileRecordOrRaw) {
            return this.getFileRecordOrRawInstance(fileRecordOrRaw, false);
        },
        prepareConfigureFn: function (configureXhr) {
            var withCredentials = this.uploadWithCredentials;
            if (withCredentials !== true && withCredentials !== false) {
                return configureXhr;
            }
            return function (request) {
                request.withCredentials = withCredentials;
                if (typeof configureXhr === 'function') {
                    configureXhr(request);
                }
            };
        },
        upload: function (url, headers, fileRecordsOrRaw, createFormData, configureXhr) {
            var _this = this;
            var validFileRecords = [];
            var validFilesRawData = [];
            for (var _i = 0, fileRecordsOrRaw_1 = fileRecordsOrRaw; _i < fileRecordsOrRaw_1.length; _i++) {
                var fileRecordOrRaw = fileRecordsOrRaw_1[_i];
                var fileRecord = this.getFileRecordInstance(fileRecordOrRaw);
                if (!fileRecord.error) {
                    validFileRecords.push(fileRecord);
                    validFilesRawData.push(this.getFileRecordRawInstance(fileRecord));
                }
            }
            if (this.resumable) {
                return upload_helper_1["default"].tusUpload(plugins_1["default"].tus, url, headers, validFileRecords, function (overallProgress) {
                    _this.overallProgress = overallProgress;
                }, this.resumable === true ? undefined : this.resumable, this.uploadWithCredentials);
            }
            return new Promise(function (resolve, reject) {
                upload_helper_1["default"]
                    .upload(url, headers, validFileRecords, createFormData, function (overallProgress) {
                    _this.overallProgress = overallProgress;
                }, _this.prepareConfigureFn(configureXhr))
                    .then(function (res) {
                    for (var i = 0; i < res.length; i++) {
                        res[i].fileRecord = validFilesRawData[i];
                    }
                    _this.$emit('upload', res);
                    resolve(res);
                }, function (err) {
                    for (var i = 0; i < err.length; i++) {
                        err[i].fileRecord = validFilesRawData[i];
                    }
                    _this.$emit('upload:error', err);
                    reject(err);
                });
            });
        },
        deleteUpload: function (url, headers, fileRecordOrRaw, uploadData, configureXhr) {
            var _this = this;
            if (this.fileRecords.length < 1) {
                this.overallProgress = 0;
            }
            var fileRecord = this.getFileRecordInstance(fileRecordOrRaw);
            var rawFileRecord = this.getFileRecordRawInstance(fileRecordOrRaw);
            if (this.resumable) {
                return upload_helper_1["default"].tusDeleteUpload(plugins_1["default"].tus, url, headers, fileRecord);
            }
            return new Promise(function (resolve, reject) {
                upload_helper_1["default"]
                    .deleteUpload(url, headers, fileRecord, uploadData, _this.prepareConfigureFn(configureXhr))
                    .then(function (res) {
                    res.fileRecord = rawFileRecord;
                    _this.$emit('upload:delete', res);
                    resolve(res);
                }, function (err) {
                    err.fileRecord = rawFileRecord;
                    _this.$emit('upload:delete:error', err);
                    reject(err);
                });
            });
        },
        updateUpload: function (url, headers, fileRecord, uploadData, configureXhr) {
            var _this = this;
            fileRecord = this.getFileRecordInstance(fileRecord);
            var rawFileRecord = this.getFileRecordRawInstance(fileRecord);
            return new Promise(function (resolve, reject) {
                upload_helper_1["default"]
                    .updateUpload(url, headers, fileRecord, uploadData, _this.prepareConfigureFn(configureXhr))
                    .then(function (res) {
                    res.fileRecords = rawFileRecord;
                    _this.$emit('upload:update', res);
                    resolve(res);
                }, function (err) {
                    err.fileRecords = rawFileRecord;
                    _this.$emit('upload:update:error', err);
                    reject(err);
                });
            });
        },
        autoUpload: function (fileRecords) {
            if (!this.uploadUrl || this.auto === false) {
                return Promise.resolve(false);
            }
            return this.upload(this.uploadUrl, this.uploadHeaders, fileRecords, this.uploadConfig);
        },
        autoDeleteUpload: function (fileRecord) {
            if (!this.uploadUrl || this.auto === false) {
                return Promise.resolve(false);
            }
            return this.deleteUpload(this.uploadUrl, this.uploadHeaders, fileRecord, this.uploadConfig);
        },
        autoUpdateUpload: function (fileRecord) {
            if (!this.uploadUrl || this.auto === false) {
                return Promise.resolve(false);
            }
            return this.updateUpload(this.uploadUrl, this.uploadHeaders, fileRecord, this.uploadConfig);
        },
        equalFiles: function (file1, file2) {
            return (true &&
                file1.name === file2.name &&
                file1.size === file2.size &&
                file1.type === file2.type &&
                // file1.lastModifiedDate.getTime() === file2.lastModifiedDate.getTime() &&
                file1.lastModified === file2.lastModified);
        },
        isFileAddedAlready: function (file) {
            for (var _i = 0, _a = this.fileRecords; _i < _a.length; _i++) {
                var fileRecord = _a[_i];
                if (this.equalFiles(file, fileRecord.file)) {
                    return true;
                }
            }
            return false;
        },
        handleFiles: function (files) {
            var _a;
            var _this = this;
            if (this.disabled === true || this.readonly === true) {
                return;
            }
            if (this.hasMultiple && !this.canAddMore) {
                return;
            }
            var fileRecords = [];
            var filesFiltered = [];
            // tslint:disable-next-line
            for (var i = 0; i < files.length; i++) {
                if (this.hasMultiple && this.isFileAddedAlready(files[i])) {
                    continue;
                }
                filesFiltered.push(files[i]);
            }
            files = filesFiltered;
            if (this.hasMultiple && this.maxFiles && files.length > this.maxFiles - this.fileRecords.length) {
                files = files.slice(0, this.maxFiles - this.fileRecords.length);
            }
            for (var _i = 0, files_1 = files; _i < files_1.length; _i++) {
                var file = files_1[_i];
                fileRecords.push(new file_record_1["default"]({
                    file: file
                }, {
                    read: this.shouldRead,
                    maxSize: this.maxSize,
                    accept: this.accept,
                    thumbnailSize: this.thumbnailSize,
                    averageColor: this.averageColor,
                    withCredentials: this.withCredentials
                }));
            }
            for (var _b = 0, fileRecords_1 = fileRecords; _b < fileRecords_1.length; _b++) {
                var fileRecord = fileRecords_1[_b];
                if (fileRecord.file.size <= 20 * 1024 * 1024) {
                    // <= 20MB
                    this.initVideo(fileRecord);
                }
            }
            if (this.hasMultiple) {
                // splice: for list transitions to work properly
                (_a = this.fileRecords).splice.apply(_a, __spreadArrays([this.fileRecords.length, 0], fileRecords));
            }
            else {
                this.fileRecords = fileRecords;
            }
            file_record_1["default"].readFiles(fileRecords).then(function (fileRecordsNew) {
                var allFileRecordsRaw = file_record_1["default"].toRawArray(_this.fileRecords);
                _this.rawFileRecords = allFileRecordsRaw;
                _this.$emit('input', Array.isArray(_this.value) ? allFileRecordsRaw : allFileRecordsRaw[0]);
                _this.$emit('select', file_record_1["default"].toRawArray(fileRecordsNew));
            });
            this.autoUpload(fileRecords);
        },
        filesChanged: function (event) {
            var files = event.target.files;
            this.$emit('change', event);
            if (!files[0]) {
                return;
            }
            if (!this.hasMultiple) {
                files = [files[0]];
            }
            this.handleFiles(files);
            if (this.$refs.fileInput) {
                this.$refs.fileInput.value = null; // do not use ''
                // because chrome won't fire change event for same file
            }
        },
        drop: function (event) {
            var _this = this;
            event.stopPropagation();
            event.preventDefault();
            dragCounter = 0;
            this.isDragging = false;
            if (this.disabled === true || this.readonly === true) {
                return;
            }
            if (!event.dataTransfer) {
                return;
            }
            utils_1["default"].getFilesFromDroppedItems(event.dataTransfer).then(function (files) {
                _this.$emit('drop', event);
                if (!files || !files[0]) {
                    return;
                }
                if (!_this.hasMultiple) {
                    files = [files[0]];
                }
                _this.handleFiles(files);
            });
        },
        dragEnter: function (event) {
            if (!event.dataTransfer) {
                return;
            }
            this.isDragging = true;
            event.stopPropagation();
            event.preventDefault();
            dragCounter++;
            event.dataTransfer.dropEffect = 'copy'; // Explicitly show this is a copy.
        },
        dragOver: function (event) {
            if (!event.dataTransfer) {
                return;
            }
            this.isDragging = true;
            event.stopPropagation();
            event.preventDefault();
            event.dataTransfer.dropEffect = 'copy'; // Explicitly show this is a copy.
        },
        dragLeave: function (event) {
            if (!event.dataTransfer) {
                return;
            }
            dragCounter--;
            if (dragCounter === 0) {
                this.isDragging = false;
            }
        },
        removeFileRecord: function (fileRecordOrRaw) {
            var rawFileRecord = this.getFileRecordRawInstance(fileRecordOrRaw);
            this.$emit('beforedelete', rawFileRecord);
            if (!this.uploadUrl || this.auto === false) {
                return;
            }
            this.deleteFileRecord(fileRecordOrRaw);
        },
        deleteFileRecord: function (fileRecordOrRaw) {
            var _this = this;
            var i;
            if (fileRecordOrRaw instanceof file_record_1["default"]) {
                i = this.fileRecords.indexOf(fileRecordOrRaw);
            }
            else {
                i = this.rawFileRecords.indexOf(fileRecordOrRaw);
            }
            var fileRecord = this.fileRecords[i];
            var rawFileRecord = this.rawFileRecords[i];
            this.$emit('input', this.rawFileRecords);
            this.$emit('delete', rawFileRecord);
            fileRecord = this.fileRecords.splice(i, 1)[0];
            rawFileRecord = this.rawFileRecords.splice(i, 1)[0];
            this.autoDeleteUpload(fileRecord).then(function (res) {
                /* no op */
            }, function (err) {
                _this.fileRecords.splice(i, 1, fileRecord);
                _this.rawFileRecords.splice(i, 1, rawFileRecord);
            });
        },
        filenameChanged: function (fileRecord) {
            this.$emit('rename', file_record_1["default"].toRawArray([fileRecord])[0]);
            this.autoUpdateUpload(fileRecord).then(function (res) {
                /* no op */
            }, function (err) {
                fileRecord.customName = fileRecord.oldCustomName;
            });
        },
        checkValue: function () {
            var _this = this;
            var rawFileRecords = this.value || [];
            rawFileRecords = Array.isArray(rawFileRecords) ? rawFileRecords : [rawFileRecords];
            var fdPromises = [];
            var rawFileRecordsNew = [];
            for (var i = 0; i < rawFileRecords.length; i++) {
                var existingIndex = this.rawFileRecords.indexOf(rawFileRecords[i]);
                if (existingIndex !== -1) {
                    fdPromises.push(Promise.resolve(this.fileRecords[existingIndex]));
                    rawFileRecordsNew[i] = this.rawFileRecords[existingIndex];
                }
                else {
                    fdPromises.push(file_record_1["default"].fromRaw(rawFileRecords[i], {
                        read: this.shouldRead,
                        maxSize: this.maxSize,
                        accept: this.accept,
                        thumbnailSize: this.thumbnailSize,
                        averageColor: this.averageColor,
                        withCredentials: this.withCredentials
                    }));
                    rawFileRecordsNew.push(rawFileRecords[i]);
                }
            }
            this.rawFileRecords = rawFileRecordsNew;
            Promise.all(fdPromises).then(function (fileRecords) {
                _this.fileRecords = fileRecords;
            });
        },
        sortStart: function () {
            if (this.sortTimeout) {
                clearTimeout(this.sortTimeout);
            }
            this.isSorting = true;
            this.isSortingActive = true;
        },
        sortEnd: function (sortData) {
            var _this = this;
            this.isSortingActive = false;
            if (this.sortTimeout) {
                clearTimeout(this.sortTimeout);
            }
            this.sortTimeout = setTimeout(function () {
                _this.isSorting = false;
            }, this.transitionDuration + 100);
            if (sortData.oldIndex !== sortData.newIndex) {
                this.rawFileRecords = utils_1["default"].arrayMove(this.rawFileRecords, sortData.oldIndex, sortData.newIndex);
                this.$nextTick(function () {
                    _this.$emit('input', _this.rawFileRecords);
                    _this.$emit('sort', {
                        oldIndex: sortData.oldIndex,
                        newIndex: sortData.newIndex
                    });
                });
            }
        }
    },
    created: function () {
        this.uniqueId = new Date().getTime().toString(36) + Math.random().toString(36).slice(2);
        this.checkValue();
    },
    watch: {
        value: function () {
            this.checkValue();
        }
    }
});
