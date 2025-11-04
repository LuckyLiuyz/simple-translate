import React from "react";
import browser from "webextension-polyfill";
import {getSettings} from "src/settings/settings";
import "../styles/TranslateButton.scss";

/**
 * 计算翻译按钮的位置
 * 根据设置中的按钮大小、偏移量和方向计算按钮相对于选中文本的位置
 * @returns {Object} 包含top和left属性的位置对象
 */
const calcPosition = () => {
	// 获取按钮大小和偏移量设置
	const buttonSize = parseInt(getSettings("buttonSize"));
	const offset = parseInt(getSettings("buttonOffset"));

	// 根据按钮方向设置计算位置
	switch (getSettings("buttonDirection")) {
		case "top":
			// 按钮位于选中文本上方
			return {top: -buttonSize - offset, left: -buttonSize / 2};
		case "bottom":
			// 按钮位于选中文本下方
			return {top: offset, left: -buttonSize / 2};
		case "right":
			// 按钮位于选中文本右侧
			return {top: -buttonSize / 2, left: offset};
		case "left":
			// 按钮位于选中文本左侧
			return {top: -buttonSize / 2, left: -buttonSize - offset};
		case "topRight":
			// 按钮位于选中文本右上方
			return {top: -buttonSize - offset, left: offset};
		case "topLeft":
			// 按钮位于选中文本左上方
			return {top: -buttonSize - offset, left: -buttonSize - offset};
		case "bottomLeft":
			// 按钮位于选中文本左下方
			return {top: offset, left: -buttonSize - offset};
		case "bottomRight":
		default:
			// 按钮位于选中文本右下方（默认）
			return {top: offset, left: offset};
	}
};

/**
 * 翻译按钮组件
 * 显示一个可点击的翻译图标按钮
 * @param {Object} props - 组件属性
 * @param {Object} props.position - 按钮位置信息
 * @param {boolean} props.shouldShow - 是否显示按钮
 * @param {Function} props.handleButtonClick - 按钮点击事件处理函数
 */
export default (props) => {
	const {position, shouldShow} = props;
	// 获取按钮大小设置
	const buttonSize = parseInt(getSettings("buttonSize"));
	// 计算按钮位置
	const {top, left} = calcPosition();
	// 获取按钮图标URL
	const iconUrl = browser.runtime.getURL("icons/512.png");

	// 设置按钮样式
	const buttonStyle = {
		backgroundImage: `url(${iconUrl})`,
		height: buttonSize,
		width: buttonSize,
		top: top + position.y,
		left: left + position.x,
	};

	return (
		<div
			style={buttonStyle}
			className={`simple-translate-button ${shouldShow ? "isShow" : ""}`}
			onClick={props.handleButtonClick}
		/>
	);
};
