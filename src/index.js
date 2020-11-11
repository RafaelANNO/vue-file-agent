"use strict";
exports.__esModule = true;
exports.FileData = exports.plugins = exports.FileRecord = exports.utils = exports.VueFilePreviewMixin = exports.VueFileAgentMixin = exports.mixin = exports.VueFileAgentPlugin = void 0;
var vue_file_icon_vue_1 = require("./components/vue-file-icon.vue");
var vue_file_preview_vue_1 = require("./components/vue-file-preview.vue");
var vue_file_list_vue_1 = require("./components/vue-file-list.vue");
var vue_file_list_item_vue_1 = require("./components/vue-file-list-item.vue");
var vue_file_agent_vue_1 = require("./components/vue-file-agent.vue");
var vue_file_agent_mixin_1 = require("./components/vue-file-agent-mixin");
exports.VueFileAgentMixin = vue_file_agent_mixin_1["default"];
var vue_file_preview_mixin_1 = require("./components/vue-file-preview-mixin");
exports.VueFilePreviewMixin = vue_file_preview_mixin_1["default"];
var utils_1 = require("./lib/utils");
exports.utils = utils_1["default"];
var plugins_1 = require("./lib/plugins");
exports.plugins = plugins_1["default"];
var file_record_1 = require("./lib/file-record");
exports.FileRecord = file_record_1["default"];
var VueFileAgentPlugin = /** @class */ (function () {
    function VueFileAgentPlugin() {
        this.VueFileIcon = vue_file_icon_vue_1["default"];
        this.VueFilePreview = vue_file_preview_vue_1["default"];
        this.VueFileAgent = vue_file_agent_vue_1["default"];
        this.component = vue_file_agent_vue_1["default"];
        this.mixin = vue_file_agent_mixin_1["default"];
        this.plugins = plugins_1["default"];
        this.VueFileAgentMixin = vue_file_agent_mixin_1["default"];
        this.VueFilePreviewMixin = vue_file_preview_mixin_1["default"];
        this.install = function (Vue, options) {
            Vue.component('VueFileIcon', vue_file_icon_vue_1["default"]);
            Vue.component('VueFilePreview', vue_file_preview_vue_1["default"]);
            Vue.component('VueFileList', vue_file_list_vue_1["default"]);
            Vue.component('VueFileListItem', vue_file_list_item_vue_1["default"]);
            Vue.component('VueFileAgent', vue_file_agent_vue_1["default"]);
            Vue.prototype.$vueFileAgent = {
                mixin: vue_file_agent_mixin_1["default"]
            };
        };
    }
    return VueFileAgentPlugin;
}());
exports.VueFileAgentPlugin = VueFileAgentPlugin;
var vfaPlugin = new VueFileAgentPlugin();
// auto install
if (typeof window !== 'undefined' && window.Vue) {
    vfaPlugin.install(window.Vue, {});
    window.VueFileAgent = vfaPlugin;
}
exports.mixin = vue_file_agent_mixin_1["default"];
exports.FileData = file_record_1["default"]; // for backward compatibility
exports["default"] = vfaPlugin;
