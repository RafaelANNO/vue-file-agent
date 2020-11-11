"use strict";
exports.__esModule = true;
/* inspired by axios */
var AjaxRequest = /** @class */ (function () {
    function AjaxRequest() {
    }
    AjaxRequest.prototype.createError = function (message, code, request, response) {
        var error = new Error(message);
        error.error = true;
        if (code) {
            error.code = code;
        }
        error.request = request;
        error.response = response;
        return error;
    };
    AjaxRequest.prototype.settle = function (resolve, reject, response) {
        var validateStatus = function (status) {
            return status >= 200 && status < 300;
        };
        // Note: status is not exposed by XDomainRequest
        if (!response.status || !validateStatus || validateStatus(response.status)) {
            resolve(response);
        }
        else {
            reject(this.createError('Request failed with status code ' + response.status, null, response.request, response));
        }
    };
    AjaxRequest.prototype.request = function (method, url, formData, configureFn) {
        var _this = this;
        if (formData === void 0) { formData = null; }
        return new Promise(function (resolve, reject) {
            // tslint:disable-next-line
            var request = new XMLHttpRequest();
            var loadEvent = 'onreadystatechange';
            request.open(method, url, true);
            // Listen for ready state
            request[loadEvent] = function () {
                if (!request || request.readyState !== 4) {
                    return;
                }
                // The request errored out and we didn't get a response, this will be
                // handled by onerror instead
                // With one exception: request that using file: protocol, most browsers
                // will return status as 0 even though it's a successful request
                if (request.status === 0 && !(request.responseURL && request.responseURL.indexOf('file:') === 0)) {
                    return;
                }
                // Prepare the response
                var responseHeaders = request.getAllResponseHeaders();
                var responseData = request.responseText;
                var contentType = request.getResponseHeader('Content-Type');
                if (contentType && contentType.indexOf('application/json') !== -1) {
                    responseData = JSON.parse(responseData);
                }
                else {
                    try {
                        responseData = JSON.parse(responseData);
                    }
                    catch (e) {
                        /* ignore, possibly non json response */
                    }
                }
                var response = {
                    data: responseData,
                    // IE sends 1223 instead of 204 (https://github.com/axios/axios/issues/201)
                    status: request.status === 1223 ? 204 : request.status,
                    statusText: request.status === 1223 ? 'No Content' : request.statusText,
                    headers: responseHeaders,
                    request: request
                };
                _this.settle(resolve, reject, response);
                // Clean up request
                request = null;
            };
            // Handle browser request cancellation (as opposed to a manual cancellation)
            request.onabort = function () {
                if (!request) {
                    return;
                }
                reject(_this.createError('Request aborted', 'ECONNABORTED', request));
                // Clean up request
                request = null;
            };
            // Handle low level network errors
            request.onerror = function () {
                // Real errors are hidden from us by the browser
                // onerror should only fire if it's a network error
                reject(_this.createError('Network Error', null, request));
                // Clean up request
                request = null;
            };
            // Handle timeout
            request.ontimeout = function () {
                reject(_this.createError('timeout exceeded', 'ECONNABORTED', request));
                // Clean up request
                request = null;
            };
            // // Handle progress if needed
            // if (typeof config.onDownloadProgress === 'function') {
            //   request.addEventListener('progress', config.onDownloadProgress);
            // }
            // Not all browsers support upload events
            // if (typeof progressCallback === 'function' && request.upload) {
            //   request.upload.addEventListener('progress', progressCallback);
            // }
            if (typeof configureFn === 'function') {
                configureFn(request);
            }
            request.send(formData);
        });
    };
    AjaxRequest.prototype.post = function (url, formData, configureFn) {
        return this.request('POST', url, formData, configureFn);
    };
    AjaxRequest.prototype["delete"] = function (url, formData, configureFn) {
        return this.request('DELETE', url, formData, configureFn);
    };
    AjaxRequest.prototype.put = function (url, formData, configureFn) {
        return this.request('PUT', url, formData, configureFn);
    };
    return AjaxRequest;
}());
exports["default"] = new AjaxRequest();
