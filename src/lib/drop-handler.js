"use strict";
exports.__esModule = true;
exports.getFilesFromDroppedItems = void 0;
function getFilesFromDroppedItems(dataTransfer) {
    return new Promise(function (resolve) {
        if (!includesFolder(dataTransfer)) {
            return resolve(dataTransfer.files);
        }
        var files = [];
        var folderReadQueue = [];
        // tslint:disable-next-line
        for (var i = 0; i < dataTransfer.items.length; i++) {
            var item = dataTransfer.items[i];
            if (item.kind !== 'file') {
                continue;
            }
            var fileSystemEntries = getEntries(item);
            if (fileSystemEntries) {
                folderReadQueue.push(fileSystemEntries);
            }
            else {
                var file = item.getAsFile();
                if (file) {
                    files.push(file);
                }
            }
        }
        Promise.all(folderReadQueue).then(function (filesInFolders) {
            resolve(files.concat.apply(files, filesInFolders));
        });
    });
}
exports.getFilesFromDroppedItems = getFilesFromDroppedItems;
function getEntries(entry) {
    // convert DataTransferItem to FileSystemEntry first if necessary
    if (entry.getAsEntry) {
        return getEntries(entry.getAsEntry());
    }
    if (entry.webkitGetAsEntry) {
        return getEntries(entry.webkitGetAsEntry());
    }
    // return if item is from a browser that does not support webkitGetAsEntry
    if (entry.getAsFile) {
        return;
    }
    // Processing directories with more than 100 files:
    // https://github.com/lian-yue/vue-upload-component/commit/9c9d8aafbcef005a2cc598454383ec65205d61ee
    return new Promise(function (resolve) {
        if (entry.isFile) {
            entry.file(function (file) { return resolve([file]); });
            return;
        }
        if (entry.isDirectory) {
            var files_1 = [];
            var entryReader_1 = entry.createReader();
            var readEntries_1 = function () {
                entryReader_1.readEntries(function (entries) {
                    var iterateEntry = function (i) {
                        if (!entries[i] && i === 0) {
                            return resolve(files_1);
                        }
                        if (!entries[i]) {
                            return readEntries_1();
                        }
                        getEntries(entries[i]).then(function (entryFiles) {
                            files_1.push.apply(files_1, entryFiles);
                            iterateEntry(i + 1);
                        });
                    };
                    iterateEntry(0);
                });
            };
            readEntries_1();
        }
        if (!entry.isFile && !entry.isDirectory) {
            resolve([]);
        }
    });
}
function includesFolder(transfer) {
    if (!transfer.files.length) {
        return true; // if dropping only folders, no files will exist
    }
    // Loop through the dropped items and log their data
    for (var _i = 0, _a = transfer.items; _i < _a.length; _i++) {
        var item = _a[_i];
        if (item.webkitGetAsEntry != null) {
            var entry = item.webkitGetAsEntry();
            if (entry && entry.isDirectory) {
                return true;
            }
        }
    }
    var files = transfer.files;
    // tslint:disable-next-line
    for (var i = 0; i < files.length; i++) {
        // A folder has no type and has a size that is a multiple of 4096
        if (!files[i].type && files[i].size % 4096 === 0) {
            return true;
        }
    }
    return false;
}
