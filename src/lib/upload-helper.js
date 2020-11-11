"use strict";
exports.__esModule = true;
var ajax_request_1 = require("./ajax-request");
var UploadHelper = /** @class */ (function () {
    function UploadHelper() {
    }
    // useAxios(axios){
    //   this.axios = axios;
    // }
    UploadHelper.prototype.addHeaders = function (xhr, headers) {
        xhr.setRequestHeader('Accept', 'application/json');
        if (headers) {
            for (var key in headers) {
                if (headers.hasOwnProperty(key)) {
                    xhr.setRequestHeader(key, headers[key]);
                }
            }
        }
        return xhr;
    };
    UploadHelper.prototype.doUpload = function (url, headers, formData, progressCallback, configureFn) {
        var _this = this;
        return ajax_request_1["default"].post(url, formData, function (xhr) {
            _this.addHeaders(xhr, headers);
            xhr.upload.addEventListener('progress', progressCallback, false);
            if (typeof configureFn === 'function') {
                configureFn(xhr);
            }
        });
    };
    UploadHelper.prototype.doDeleteUpload = function (url, headers, uploadData, configureFn) {
        var _this = this;
        if (typeof uploadData !== 'string') {
            uploadData = JSON.stringify(uploadData);
        }
        return ajax_request_1["default"]["delete"](url, uploadData, function (xhr) {
            xhr.setRequestHeader('Content-Type', 'application/json');
            _this.addHeaders(xhr, headers);
            if (typeof configureFn === 'function') {
                configureFn(xhr);
            }
        });
    };
    UploadHelper.prototype.doUpdateUpload = function (url, headers, uploadData, configureFn) {
        var _this = this;
        if (typeof uploadData !== 'string') {
            uploadData = JSON.stringify(uploadData);
        }
        return ajax_request_1["default"].put(url, uploadData, function (xhr) {
            xhr.setRequestHeader('Content-Type', 'application/json');
            _this.addHeaders(xhr, headers);
            if (typeof configureFn === 'function') {
                configureFn(xhr);
            }
        });
    };
    // doUploadAxios(axios, formData, progressCallback){
    //   return axios.post('/upload', formData, {
    //     onUploadProgress: progressCallback,
    //   });
    // }
    // doDeleteUploadAxios(axios, data, configureFn){
    //   return axios.delete('/upload', data, {
    //   });
    // }
    UploadHelper.prototype.prepareUploadError = function (fileRecord, err, timeout) {
        var errorText = err.message;
        if (err.response && err.response.data) {
            try {
                var errorMsg = err.response.data.error || JSON.parse(err.response.data).error;
                errorText = errorMsg;
            }
            catch (e) {
                // ignore
            }
        }
        if (!fileRecord.error) {
            fileRecord.error = {};
        }
        fileRecord.error.upload = errorText;
        fileRecord.upload.data = undefined;
        fileRecord.upload.error = errorText;
        if (timeout) {
            setTimeout(function () {
                if (!fileRecord.error) {
                    fileRecord.error = {};
                }
                fileRecord.error.upload = false;
                if (!fileRecord.error.size && !fileRecord.error.type) {
                    fileRecord.error = false;
                }
            }, timeout);
        }
    };
    UploadHelper.prototype.upload = function (url, headers, fileRecords, createFormData, progressFn, configureFn) {
        var _this = this;
        var updateOverallProgress = function () {
            /* no op */
        };
        if (progressFn) {
            updateOverallProgress = function () {
                var prgTotal = 0;
                for (var _i = 0, fileRecords_2 = fileRecords; _i < fileRecords_2.length; _i++) {
                    var fileRecord = fileRecords_2[_i];
                    prgTotal += fileRecord.progress();
                }
                progressFn(prgTotal / fileRecords.length);
            };
        }
        var promises = [];
        var failedUploadsCount = 0;
        var _loop_1 = function (fileRecord) {
            var formData = void 0;
            if (typeof createFormData === 'function') {
                formData = createFormData(fileRecord);
            }
            else {
                formData = new FormData();
                formData.append('file', fileRecord.file);
                formData.append('filename', fileRecord.name());
            }
            // ((fileRecord) => {
            var promise = this_1.doUpload(url, headers, formData, function (progressEvent) {
                var percentCompleted = (progressEvent.loaded * 100) / progressEvent.total;
                // do not complete until promise resolved
                fileRecord.progress(percentCompleted >= 100 ? 99.9999 : percentCompleted);
                updateOverallProgress();
            }, function (xhr) {
                fileRecord.xhr = xhr;
                if (typeof configureFn === 'function') {
                    configureFn(xhr);
                }
            });
            promises.push(new Promise(function (resolve, reject) {
                promise.then(function (response) {
                    delete fileRecord.xhr;
                    fileRecord.upload.data = response.data;
                    fileRecord.upload.error = false;
                    fileRecord.progress(100);
                    if (fileRecord.xhrQueue) {
                        fileRecord.xhrQueue();
                        delete fileRecord.xhrQueue;
                    }
                    resolve(response);
                } /* */, function (err) {
                    _this.prepareUploadError(fileRecord, err);
                    resolve(err);
                    failedUploadsCount++;
                } /* */);
            }));
        };
        var this_1 = this;
        for (var _i = 0, fileRecords_1 = fileRecords; _i < fileRecords_1.length; _i++) {
            var fileRecord = fileRecords_1[_i];
            _loop_1(fileRecord);
        }
        // return Promise.all(promises);
        return new Promise(function (resolve, reject) {
            Promise.all(promises).then(function (responses) {
                if (failedUploadsCount === promises.length) {
                    // all uploads failed
                    reject(responses);
                    return;
                }
                resolve(responses);
            }, reject);
        });
    };
    UploadHelper.prototype.deleteUpload = function (url, headers, fileRecord, uploadData, configureFn) {
        var _this = this;
        return new Promise(function (resolve, reject) {
            if (fileRecord.xhr) {
                fileRecord.xhr.abort();
            }
            if (uploadData === undefined) {
                uploadData = fileRecord.upload.data;
            }
            if (uploadData) {
                _this.doDeleteUpload(url, headers, uploadData, function (xhr) {
                    if (typeof configureFn === 'function') {
                        configureFn(xhr);
                    }
                }).then(function (result) {
                    resolve(result);
                }, function (err) {
                    _this.prepareUploadError(fileRecord, err);
                    reject(err);
                });
            }
        });
    };
    UploadHelper.prototype.updateUpload = function (url, headers, fileRecord, uploadData, configureFn) {
        var _this = this;
        return new Promise(function (resolve, reject) {
            if (fileRecord.xhr) {
                // probably updated while being uploaded.
                fileRecord.xhrQueue = function () {
                    _this.updateUpload(url, headers, fileRecord, uploadData);
                };
                return resolve();
            }
            if (uploadData === undefined) {
                uploadData = fileRecord.upload.data || {};
                uploadData.old_filename = fileRecord.oldFileName;
                uploadData.filename = fileRecord.name();
            }
            if (uploadData) {
                _this.doUpdateUpload(url, headers, uploadData, function (xhr) {
                    if (typeof configureFn === 'function') {
                        configureFn(xhr);
                    }
                }).then(function (response) {
                    fileRecord.upload.data = response.data;
                    fileRecord.upload.error = false;
                    resolve(response);
                }, function (err) {
                    _this.prepareUploadError(fileRecord, err);
                    reject(err);
                });
            }
        });
    };
    UploadHelper.prototype.doTusUpload = function (tus, url, fileRecord, headers, progressCallback, tusOptionsFn, uploadWithCredentials) {
        var tusOptions = tusOptionsFn ? tusOptionsFn(fileRecord) : {};
        return new Promise(function (resolve, reject) {
            if (!tus) {
                return reject(new Error('tus required. Please install tus-js-client'));
            }
            // https://github.com/tus/tus-js-client
            // Create a new tus upload
            var file = fileRecord.file;
            var upload = new tus.Upload(file, {
                endpoint: url,
                headers: headers,
                retryDelays: tusOptions.retryDelays ? tusOptions.retryDelays : [0, 3000, 5000, 10000, 20000],
                metadata: tusOptions.metadata
                    ? tusOptions.metadata
                    : {
                        filename: file.name,
                        filetype: file.type
                    },
                onError: function (error) {
                    reject(error);
                    // console.log("Failed because: " + error)
                },
                onProgress: function (bytesUploaded, bytesTotal) {
                    var event = { loaded: bytesUploaded, total: bytesTotal };
                    progressCallback(event);
                },
                onSuccess: function () {
                    resolve(upload);
                },
                onBeforeRequest: function (req) {
                    var xhr = req.getUnderlyingObject();
                    xhr.withCredentials = uploadWithCredentials;
                }
            });
            fileRecord.tusUpload = upload;
            // Start the upload
            upload.start();
        });
    };
    UploadHelper.prototype.tusUpload = function (tus, url, headers, fileRecords, progressFn, tusOptionsFn, uploadWithCredentials) {
        var _this = this;
        var updateOverallProgress = function () {
            /* no op */
        };
        if (progressFn) {
            updateOverallProgress = function () {
                var prgTotal = 0;
                for (var _i = 0, fileRecords_4 = fileRecords; _i < fileRecords_4.length; _i++) {
                    var fileRecord = fileRecords_4[_i];
                    prgTotal += fileRecord.progress();
                }
                progressFn(prgTotal / fileRecords.length);
            };
        }
        var promises = [];
        var _loop_2 = function (fileRecord) {
            var promise = this_2.doTusUpload(tus, url, fileRecord, headers, function (progressEvent) {
                var percentCompleted = (progressEvent.loaded * 100) / progressEvent.total;
                // do not complete until promise resolved
                fileRecord.progress(percentCompleted >= 100 ? 99.9999 : percentCompleted);
                updateOverallProgress();
            }, tusOptionsFn, uploadWithCredentials);
            promise.then(function (response) {
                // delete fileRecord.tusUpload;
                fileRecord.progress(100);
            }, function (err) {
                _this.prepareUploadError(fileRecord, err);
            });
            promises.push(promise);
        };
        var this_2 = this;
        for (var _i = 0, fileRecords_3 = fileRecords; _i < fileRecords_3.length; _i++) {
            var fileRecord = fileRecords_3[_i];
            _loop_2(fileRecord);
        }
        return Promise.all(promises);
    };
    UploadHelper.prototype.tusDeleteUpload = function (tus, url, headers, fileRecord) {
        var _this = this;
        return new Promise(function (resolve, reject) {
            if (!tus) {
                return reject('tus required');
            }
            if (!fileRecord.tusUpload) {
                return resolve();
            }
            // const shouldTerminate = true;
            var abort = function (shouldTerminate) {
                return new Promise(function (res, rej) {
                    fileRecord.tusUpload.abort(shouldTerminate, function (err) {
                        if (err) {
                            _this.prepareUploadError(fileRecord, err);
                            rej(err);
                            return;
                        }
                        res();
                    });
                });
            };
            abort(false).then(function () {
                setTimeout(function () {
                    abort(true).then(resolve, reject);
                }, 1000);
            });
        });
    };
    return UploadHelper;
}());
exports["default"] = new UploadHelper();
