"use strict";
exports.__esModule = true;
var utils_1 = require("../lib/utils");
var vue_file_icon_vue_1 = require("./vue-file-icon.vue");
var file_record_1 = require("../lib/file-record");
var vue_1 = require("vue");
exports["default"] = vue_1["default"].extend({
    props: [
        'value',
        'deletable',
        'editable',
        'linkable',
        'errorText',
        'disabled',
        'thumbnailSize',
        'averageColor',
        'withCredentials',
    ],
    components: {
        VueFileIcon: vue_file_icon_vue_1["default"]
    },
    data: function () {
        return {
            isEditInputFocused: false,
            isEditCancelable: true,
            fileRecord: {}
        };
    },
    computed: {
        hasLinkableUrl: function () {
            if (!this.linkable) {
                return false;
            }
            return !!this.fileRecord.url() && !this.fileRecord.isPlayableVideo() && !this.fileRecord.isPlayableAudio();
        }
    },
    methods: {
        updateFileRecord: function () {
            var _this = this;
            if (this.value instanceof file_record_1["default"]) {
                this.fileRecord = this.value;
                return;
            }
            file_record_1["default"].fromRaw(this.value, {
                thumbnailSize: this.thumbnailSize,
                averageColor: this.averageColor,
                withCredentials: this.withCredentials
            }).then(function (fileRecord) {
                _this.fileRecord = fileRecord;
            });
            this.fileRecord = file_record_1["default"].fromRawSync(this.value, {
                thumbnailSize: this.thumbnailSize,
                averageColor: this.averageColor,
                withCredentials: this.withCredentials
            });
        },
        createThumbnail: function (fileRecord, video) {
            if (fileRecord.videoThumbnail) {
                video.poster = fileRecord.src();
                return;
            }
            var canvas = document.createElement('canvas');
            utils_1["default"]
                .createVideoThumbnail(video, canvas, this.fileRecord.thumbnailSize, this.averageColor !== false, this.withCredentials === true)
                .then(function (thumbnail) {
                fileRecord.imageColor = thumbnail.color;
                fileRecord.videoThumbnail = thumbnail.url;
                fileRecord.dimensions.width = thumbnail.width;
                fileRecord.dimensions.height = thumbnail.height;
                video.poster = fileRecord.src();
            });
        },
        playAv: function (fileRecord) {
            if (fileRecord.stopAv) {
                fileRecord.stopAv();
                return;
            }
            var createObjectURL = (window.URL || window.webkitURL || {}).createObjectURL;
            var revokeObjectURL = (window.URL || window.webkitURL || {}).revokeObjectURL;
            var wrapper = this.$refs.wrapper;
            var player = document.createElement(fileRecord.isAudio() ? 'audio' : 'video');
            if (player instanceof HTMLVideoElement && fileRecord.isPlayableVideo()) {
                this.createThumbnail(fileRecord, player);
            }
            player.controls = true;
            // player.style.width = this.prvWidth + 'px';
            wrapper.appendChild(player);
            var url = fileRecord.url() || createObjectURL(fileRecord.file);
            player.src = url;
            player.play();
            fileRecord.isPlayingAv = true;
            fileRecord.stopAv = function () {
                // player.src = null;
                player.src = '';
                wrapper.removeChild(player);
                revokeObjectURL(url);
                fileRecord.isPlayingAv = false;
                fileRecord.stopAv = null;
            };
        },
        removeFileRecord: function (fileRecord) {
            if (this.clearFilename()) {
                return;
            }
            if (this.disabled === true) {
                return;
            }
            this.$emit('remove', fileRecord);
        },
        editFileName: function () {
            if (this.editable !== true) {
                return;
            }
            if (!this.$refs.input) {
                return;
            }
            this.$refs.input.focus();
        },
        editInputFocused: function () {
            this.isEditInputFocused = true;
            this.isEditCancelable = true;
        },
        editInputBlured: function () {
            var _this = this;
            this.fileRecord.oldFileName = this.fileRecord.name();
            var oldValue = this.fileRecord.name(true);
            var value = this.$refs.input.value;
            this.fileRecord.customName = value;
            var newValue = this.fileRecord.name(true);
            if (newValue !== oldValue) {
                this.fileRecord.oldCustomName = oldValue;
                this.$emit('rename', this.fileRecord);
            }
            var timeout = 100;
            setTimeout(function () {
                _this.$nextTick(function () {
                    if (!_this.isEditCancelable) {
                        return;
                    }
                    _this.isEditInputFocused = false;
                });
            }, timeout);
        },
        filenameChanged: function (completed) {
            if (completed) {
                this.$refs.input.blur(); // @see editInputBlured method
            }
            if (completed === false) {
                this.clearFilename();
            }
        },
        filenameClearPressed: function () {
            if (!(this.editable === true && this.isEditInputFocused)) {
                return;
            }
            this.isEditCancelable = false;
        },
        clearFilename: function () {
            if (!(this.editable === true && this.isEditInputFocused)) {
                return false;
            }
            this.$refs.input.value = '';
            this.isEditCancelable = true;
            this.editInputBlured();
            return true;
        },
        dismissError: function () {
            if (this.fileRecord.error && (this.fileRecord.error.size || this.fileRecord.error.type)) {
                return;
            }
            this.fileRecord.error = false;
        }
    },
    created: function () {
        this.updateFileRecord();
    },
    watch: {
        value: function () {
            this.updateFileRecord();
        }
    }
});
