"use strict";
exports.__esModule = true;
var vue_1 = require("vue");
require("./demo/demo-base");
var App_vue_1 = require("./App.vue");
var index_js_1 = require("./index.js");
var vue_slicksort_1 = require("vue-slicksort");
var tus = require("tus-js-client");
vue_1["default"].use(index_js_1["default"]);
vue_1["default"].config.productionTip = false;
vue_1["default"].component('vfa-sortable-list', vue_slicksort_1.SlickList);
vue_1["default"].component('vfa-sortable-item', vue_slicksort_1.SlickItem);
index_js_1["default"].plugins.tus = tus;
new vue_1["default"]({
    render: function (h) { return h(App_vue_1["default"]); }
}).$mount('#app');
