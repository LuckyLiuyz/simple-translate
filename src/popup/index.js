/**
 * @file src/popup/index.js 弹出页面入口
 * @description 弹出页面，用户点击浏览器菜单栏的扩展图标时显示的界面，用于与用户进行交互操作
 */
import React from "react";
import ReactDOM from "react-dom";
import PopupPage from "./components/PopupPage";

ReactDOM.render(<PopupPage />, document.getElementById("root"));
