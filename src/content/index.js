/**
 * @file src/content/index.js 内容脚本入口
 * @description 内容脚本，注入到网页中运行，可直接访问和修改页面DOM，与网页内容交互
 */

import React from "react";
import ReactDOM from "react-dom";
import browser from "webextension-polyfill";
import PageTranslator from "../popup/components/PageTranslator";
import {updateLogLevel, overWriteLogLevel} from "src/common/log";
import TranslateContainer from "./components/TranslateContainer";
import {
	initSettings,
	getSettings,
	handleSettingsChange,
} from "src/settings/settings";

// 页面翻译器实例，用于整页翻译功能
let pageTranslator = null;

/**
 * 初始化函数，设置各种事件监听器和初始配置
 * 包括鼠标按键、键盘按键、页面可见性变化等事件监听器
 */
const init = async () => {
	console.log("Content script init()");
	// 初始化设置
	await initSettings();

	// 添加鼠标按键释放事件监听器，用于处理文本选择后的翻译操作
	document.addEventListener("mouseup", handleMouseUp);

	// 添加键盘按键按下事件监听器，用于处理特定按键（如ESC）操作
	document.addEventListener("keydown", handleKeyDown);

	// 添加页面可见性变化事件监听器，用于优化资源使用
	document.addEventListener("visibilitychange", handleVisibilityChange);

	// 添加本地存储变更监听器，用于实时响应设置变更
	browser.storage.local.onChanged.addListener(handleSettingsChange);

	// 添加消息监听器，用于接收来自扩展其他部分的消息
	browser.runtime.onMessage.addListener(handleMessage);

	// 覆盖和更新日志级别设置
	overWriteLogLevel();
	updateLogLevel();

	// 根据URL列表禁用扩展
	disableExtensionByUrlList();

	// 检查是否需要自动翻译页面
	checkAutoTranslate();
};

// 启动初始化过程
init();

/**
 * 检查是否需要自动翻译页面
 * 当设置启用且浏览器语言为中文时，会自动翻译页面
 */
const checkAutoTranslate = async () => {
	// 检测是否启用自动翻译功能
	const isAutoTranslate = getSettings("isAutoTranslate");
	if (!isAutoTranslate) return;

	// 获取浏览器语言
	const language = navigator.language || navigator.userLanguage;
	console.log("Language:", language);

	// 如果语言是中文（简体），则自动翻译页面
	if (language === "zh-CN") {
		// 延迟一点执行，确保页面加载完成
		setTimeout(() => {
			translateCurrentPage();
		}, 1000);
	}
};

/**
 * 翻译当前页面
 * 使用PageTranslator类执行整个页面的翻译
 */
const translateCurrentPage = async () => {
	try {
		// 创建PageTranslator实例，指定目标语言
		pageTranslator = new PageTranslator({
			targetLanguage: getSettings("targetLang") || "en",
		});

		// 执行页面翻译
		await pageTranslator.init();
		console.log("Page auto-translated successfully");
	} catch (error) {
		console.error("Page auto-translation failed:", error);
	}
};

// 存储上次选中的文本，用于外部访问
let prevSelectedText = "";

/**
 * 处理鼠标按键释放事件
 * 主要用于检测用户选择文本的操作，并决定是否显示翻译容器
 * @param {MouseEvent} e - 鼠标事件对象
 */
const handleMouseUp = async (e) => {
	// 等待一小段时间确保文本选择已完成
	await waitTime(10);

	// 只处理左键点击事件
	const isLeftClick = e.button === 0;
	if (!isLeftClick) return;

	// 过滤掉不需要翻译的情况

	// 不在密码输入框中显示翻译功能
	const isInPasswordField =
		e.target.tagName === "INPUT" && e.target.type === "password";
	if (isInPasswordField) return;

	// 如果设置中启用了代码元素禁用，则不在代码标签中显示翻译功能
	const inCodeElement =
		e.target.tagName === "CODE" ||
		(!!e.target.closest && !!e.target.closest("code"));
	if (inCodeElement && getSettings("isDisabledInCodeElement")) return;

	// 如果点击的是翻译容器本身，则不处理
	const isInThisElement =
		document.querySelector("#simple-translate") &&
		document.querySelector("#simple-translate").contains(e.target);
	if (isInThisElement) return;

	// 移除现有的翻译容器
	removeTranslatecontainer();

	// 检查文档语言是否在忽略列表中
	const ignoredDocumentLang = getSettings("ignoredDocumentLang")
		.split(",")
		.map((s) => s.trim())
		.filter((s) => !!s);
	if (ignoredDocumentLang.length) {
		const ignoredLangSelector = ignoredDocumentLang
			.map((lang) => `[lang="${lang}"]`)
			.join(",");
		if (!!e.target.closest && !!e.target.closest(ignoredLangSelector)) return;
	}

	// 获取选中的文本
	const selectedText = getSelectedText();
	prevSelectedText = selectedText;
	if (selectedText.length === 0) return;

	// 如果设置了在文本字段中禁用，则在输入框和文本域中不显示翻译功能
	if (getSettings("isDisabledInTextFields")) {
		if (isInContentEditable()) return;
	}

	// 如果设置了只在按下修饰键时翻译，则检查修饰键状态
	if (getSettings("ifOnlyTranslateWhenModifierKeyPressed")) {
		const modifierKey = getSettings("modifierKey");
		switch (modifierKey) {
			case "shift":
				if (!e.shiftKey) return;
				break;
			case "alt":
				if (!e.altKey) return;
				break;
			case "ctrl":
				if (!e.ctrlKey) return;
				break;
			case "cmd":
				if (!e.metaKey) return;
				break;
			default:
				break;
		}
	}

	// 获取点击位置和选中文本位置信息
	const clickedPosition = {x: e.clientX, y: e.clientY};
	const selectedPosition = getSelectedPosition();

	// 显示翻译容器
	showTranslateContainer(selectedText, selectedPosition, clickedPosition);
};

/**
 * 等待指定时间的工具函数
 * @param {number} time - 等待时间（毫秒）
 * @returns {Promise} 返回一个在指定时间后resolve的Promise
 */
const waitTime = (time) => {
	return new Promise((resolve) => setTimeout(() => resolve(), time));
};

/**
 * 获取当前选中的文本
 * @returns {string} 选中的文本内容
 */
const getSelectedText = () => {
	const element = document.activeElement;

	// 判断是否在输入框或文本域中
	const isInTextField =
		element.tagName === "INPUT" || element.tagName === "TEXTAREA";

	// 根据不同情况获取选中文本
	const selectedText = isInTextField
		? element.value.substring(element.selectionStart, element.selectionEnd)
		: window.getSelection()?.toString() ?? "";
	return selectedText;
};

/**
 * 获取选中文本的位置信息
 * @returns {Object} 包含x和y坐标的对象
 */
const getSelectedPosition = () => {
	const element = document.activeElement;

	// 判断是否在输入框或文本域中
	const isInTextField =
		element.tagName === "INPUT" || element.tagName === "TEXTAREA";

	// 获取选中文本的边界矩形
	const selectedRect = isInTextField
		? element.getBoundingClientRect()
		: window.getSelection().getRangeAt(0).getBoundingClientRect();

	let selectedPosition;

	// 根据设置确定翻译面板参考点位置
	const panelReferencePoint = getSettings("panelReferencePoint");
	switch (panelReferencePoint) {
		case "topSelectedText":
			// 以上方为参考点
			selectedPosition = {
				x: selectedRect.left + selectedRect.width / 2,
				y: selectedRect.top,
			};
			break;
		case "bottomSelectedText":
		default:
			// 以下方为参考点（默认）
			selectedPosition = {
				x: selectedRect.left + selectedRect.width / 2,
				y: selectedRect.bottom,
			};
			break;
	}
	return selectedPosition;
};

/**
 * 检查当前焦点元素是否为可编辑内容
 * @returns {boolean} 是否为可编辑内容
 */
const isInContentEditable = () => {
	const element = document.activeElement;

	// 输入框或文本域
	if (element.tagName === "INPUT" || element.tagName === "TEXTAREA")
		return true;

	// 可编辑元素
	if (element.contentEditable === "true") return true;
	return false;
};

/**
 * 处理键盘按键按下事件
 * @param {KeyboardEvent} e - 键盘事件对象
 */
const handleKeyDown = (e) => {
	// ESC键按下时移除翻译容器
	if (e.key === "Escape") {
		removeTranslatecontainer();
	}
};

/**
 * 处理页面可见性变化事件
 * 当页面隐藏时移除监听器，页面显示时重新添加监听器，以节省资源
 */
const handleVisibilityChange = () => {
	if (document.visibilityState === "hidden") {
		browser.storage.local.onChanged.removeListener(handleSettingsChange);
	} else {
		browser.storage.local.onChanged.addListener(handleSettingsChange);
	}
};

// 扩展启用状态标志
let isEnabled = true;

/**
 * 处理来自扩展其他部分的消息
 * @param {Object} request - 请求对象，包含message属性
 */
const handleMessage = async (request) => {
	// 创建一个空的Promise，用于返回空结果
	const empty = new Promise((resolve) => {
		setTimeout(() => {
			return resolve("");
		}, 100);
	});

	switch (request.message) {
		case "getTabUrl":
			// 获取当前标签页URL
			if (!isEnabled) return empty;
			if (window == window.parent) return location.href;
			else return empty;

		case "getSelectedText":
			// 获取之前选中的文本
			if (!isEnabled) return empty;
			if (prevSelectedText.length === 0) return empty;
			else return prevSelectedText;

		case "translateSelectedText": {
			// 翻译当前选中文本
			if (!isEnabled) return empty;
			const selectedText = getSelectedText();
			if (selectedText.length === 0) return;
			const selectedPosition = getSelectedPosition();
			removeTranslatecontainer();
			showTranslateContainer(selectedText, selectedPosition, null, true);
			break;
		}

		case "translateAllPage": {
			// 处理页面翻译演示消息
			console.log("Received translateAllPage message");

			// 创建PageTranslator实例
			if (!pageTranslator) {
				pageTranslator = new PageTranslator({
					targetLanguage: getSettings("targetLang") || "en",
				});
			}

			// 执行页面翻译
			pageTranslator
				.init()
				.then(() => {
					console.log("Page translation demo completed");
				})
				.catch((error) => {
					console.error("Page translation demo failed:", error);
				});

			break;
		}

		case "getEnabled":
			// 获取扩展启用状态
			return isEnabled;

		case "enableExtension":
			// 启用扩展
			isEnabled = true;
			break;

		case "disableExtension":
			// 禁用扩展并移除翻译容器
			removeTranslatecontainer();
			isEnabled = false;
			break;

		default:
			return empty;
	}
};

/**
 * 根据URL列表禁用扩展
 * 检查当前页面是否匹配禁用URL列表中的模式
 */
const disableExtensionByUrlList = () => {
	// 获取禁用URL列表并分割成数组
	const disableUrls = getSettings("disableUrlList").split("\n");
	let pageUrl;

	// 尝试获取页面URL，如果无法访问则使用referrer
	try {
		pageUrl = top.location.href;
	} catch (e) {
		pageUrl = document.referrer;
	}

	/**
	 * 检查URL是否匹配给定的模式
	 * @param {string} urlPattern - URL模式
	 * @returns {boolean} 是否匹配
	 */
	const matchesPageUrl = (urlPattern) => {
		const pattern = urlPattern
			.trim()
			.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, (match) =>
				match === "*" ? ".*" : "\\" + match
			);
		if (pattern === "") return false;
		return RegExp("^" + pattern + "$").test(pageUrl);
	};

	// 检查是否有匹配的禁用URL
	const isMatched = disableUrls.some(matchesPageUrl);
	if (isMatched) isEnabled = false;
};

/**
 * 移除翻译容器
 * 卸载React组件并从DOM中删除容器元素
 */
const removeTranslatecontainer = async () => {
	const element = document.getElementById("simple-translate");
	if (!element) return;

	// 卸载React组件
	ReactDOM.unmountComponentAtNode(element);

	// 从DOM中删除元素
	element.parentNode.removeChild(element);
};

/**
 * 显示翻译容器
 * 创建并渲染翻译容器组件
 * @param {string} selectedText - 选中的文本
 * @param {Object} selectedPosition - 选中文本位置
 * @param {Object} clickedPosition - 点击位置（可选）
 * @param {boolean} shouldTranslate - 是否应该立即翻译（可选）
 */
const showTranslateContainer = (
	selectedText,
	selectedPosition,
	clickedPosition = null,
	shouldTranslate = false
) => {
	const element = document.getElementById("simple-translate");

	// 如果容器已存在或扩展被禁用则返回
	if (element) return;
	if (!isEnabled) return;

	// 获取主题设置并构造CSS类名
	const themeClass = "simple-translate-" + getSettings("theme") + "-theme";

	// 在body末尾插入容器元素
	document.body.insertAdjacentHTML(
		"beforeend",
		`<div id="simple-translate" class="${themeClass}"></div>`
	);

	// 渲染翻译容器组件
	ReactDOM.render(
		<TranslateContainer
			removeContainer={removeTranslatecontainer}
			selectedText={selectedText}
			selectedPosition={selectedPosition}
			clickedPosition={clickedPosition}
			shouldTranslate={shouldTranslate}
		/>,
		document.getElementById("simple-translate")
	);
};
