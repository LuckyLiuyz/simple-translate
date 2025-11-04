import React from "react";
import browser from "webextension-polyfill";
import openUrl from "src/common/openUrl";
import SettingsIcon from "../icons/settings.svg";
import Toggle from "react-toggle";
import "react-toggle/style.css";
import "../styles/Header.scss";

/**
 * 打开设置页面
 */
const openSettings = () => {
	const url = "../options/index.html#settings";
	openUrl(url);
};

/**
 * 获取切换按钮的标题提示
 * @param {boolean} isEnabled - 当前是否启用扩展
 * @returns {string} 标题提示文本
 */
const getToggleButtonTitle = (isEnabled) => {
	return isEnabled
		? browser.i18n.getMessage("disableOnThisPage")
		: browser.i18n.getMessage("enableOnThisPage");
};

/**
 * 头部组件
 * 包含标题和操作按钮（启用/禁用切换、捐赠、设置）
 * @param {Object} props - 组件属性
 * @param {boolean} props.isEnabledOnPage - 扩展在当前页面是否启用
 * @param {boolean} props.isConnected - 是否连接到内容脚本
 * @param {Function} props.toggleEnabledOnPage - 切换启用状态的回调函数
 * @returns {JSX.Element} 头部组件元素
 */
export default (props) => (
	<div id='header'>
		<div className='title'>Simple Translate</div>
		<div className='rightButtons'>
			<div
				className='toggleButton'
				title={getToggleButtonTitle(props.isEnabledOnPage)}>
				{/* 启用/禁用切换开关 */}
				<Toggle
					checked={props.isEnabledOnPage}
					onChange={props.toggleEnabledOnPage}
					icons={false}
					disabled={!props.isConnected}
				/>
			</div>
			{/* 设置按钮 */}
			<button
				className={"settingsButton"}
				onClick={openSettings}
				title={browser.i18n.getMessage("settingsLabel")}>
				<SettingsIcon />
			</button>
		</div>
	</div>
);
