/**
 * @file src/background/menus.js 后台脚本 - 菜单相关
 * @description: Background 自定义右键菜单按钮
 */

import log from "loglevel";
import browserInfo from "browser-info";
import browser from "webextension-polyfill";
import {getSettings} from "src/settings/settings";

const logDir = "background/menus";

/**
 * 在网页或者标签页上右击时，将项目添加到右键菜单中。
 * 根据设置中的 ifShowMenu 选项决定是否显示菜单
 */
export const showMenus = () => {
	if (getSettings("ifShowMenu")) {
		removeMenus();
		createMenus();
	} else removeMenus();
};

/**
 * 当菜单显示时的监听器
 * 根据不同的上下文环境控制菜单项的可见性
 * @param {Object} info - 包含有关上下文菜单事件的信息
 * @param {Object} tab - 包含有关当前标签页的信息
 */
export const onMenusShownListener = (info, tab) => {
	//当选择文本或链接时，隐藏页面翻译选项
	if (info.contexts.includes("selection") || info.contexts.includes("link")) {
		browser.contextMenus.update("translatePage", {visible: false});
	} else {
		browser.contextMenus.update("translatePage", {visible: true});
	}
	browser.contextMenus.refresh();
};

/**
 * 右键菜单项被点击时的监听器
 * 根据点击的菜单项ID执行相应的翻译操作
 * @param {Object} info - 包含有关已点击上下文菜单的信息
 * @param {Object} tab - 包含有关当前标签页的信息
 */
export const onMenusClickedListener = (info, tab) => {
	log.log(logDir, "onMenusClickedListener()", info, tab);
	switch (info.menuItemId) {
		case "translatePage":
		case "translatePageOnTab":
			translatePage(info, tab);
			break;
		case "translateText":
			translateText(tab);
			break;
		case "translateLink":
			translateLink(info, tab);
			break;
		case "manualTranslate": // 手动翻译
			openManualTranslate(tab, info);
			break;
	}
};

/**
 * 创建右键菜单项
 * 根据浏览器类型和版本创建不同的菜单项
 */
function createMenus() {
	// 检查浏览器是否支持标签页上下文菜单（Firefox 53及以上版本）
	const isValidContextsTypeTab =
		browserInfo().name === "Firefox" && browserInfo().version >= 53;
	if (isValidContextsTypeTab) {
		browser.contextMenus.create({
			id: "translatePageOnTab", // 该 id 在onMenusClickedListener方法中使用
			title: browser.i18n.getMessage("translatePageMenu"), // 翻译此页面
			contexts: ["tab"],
		});
	}

	// 创建手动翻译菜单项，仅在选择文本时显示
	browser.contextMenus.create({
		id: "manualTranslate",
		title: browser.i18n.getMessage("manualTranslateMenu"), // 手动翻译
		contexts: ["selection"],
	});

	// 创建页面翻译菜单项，在所有上下文中显示
	browser.contextMenus.create({
		id: "translatePage", // 该 id 在onMenusClickedListener方法中使用
		title: browser.i18n.getMessage("translatePageMenu"), // 翻译此页面
		contexts: ["all"],
		visible: true,
	});

	// 创建文本翻译菜单项，仅在选择文本时显示
	browser.contextMenus.create({
		id: "translateText", // 该 id 在onMenusClickedListener方法中使用
		title: browser.i18n.getMessage("translateTextMenu"), // 翻译选中的文本
		contexts: ["selection"],
	});

	// 创建链接翻译菜单项，仅在链接上下文中显示
	browser.contextMenus.create({
		id: "translateLink", // 该 id 在onMenusClickedListener方法中使用
		title: browser.i18n.getMessage("translateLinkMenu"), // 翻译选中的链接
		contexts: ["link"],
	});
}

/**
 * 移除所有右键菜单项
 */
function removeMenus() {
	browser.contextMenus.removeAll();
}

/**
 * 翻译选中文本
 * 向内容脚本发送消息以翻译当前选中的文本
 * @param {Object} tab - 当前标签页对象
 */
function translateText(tab) {
	browser.tabs.sendMessage(tab.id, {
		message: "translateSelectedText",
	});
}

/**
 * 发送消息给content script 打开手动翻译的窗口
 * 向内容脚本发送消息以显示手动翻译浮层
 * @param {Object} tab - 当前标签页对象
 * @param {Object} info - 上下文菜单信息
 */
function openManualTranslate(tab, info) {
	browser.tabs.sendMessage(tab.id, {
		message: "openManualTranslate",
		text: info.selectionText,
	});
}

/**
 * 【可废弃，使用不到】译整个页面
 * 使用Google翻译服务翻译当前页面，并根据设置决定在当前标签页还是新标签页中打开
 * @param {Object} info - 包含有关上下文菜单事件的信息，包括页面URL
 * @param {Object} tab - 包含有关当前标签页的信息
 */
function translatePage(info, tab) {
	const targetLang = getSettings("targetLang");
	const encodedPageUrl = encodeURIComponent(info.pageUrl);
	const translationUrl = `https://translate.google.com/translate?hl=${targetLang}&tl=${targetLang}&sl=auto&u=${encodedPageUrl}`;
	const isCurrentTab = getSettings("pageTranslationOpenTo") === "currentTab";

	if (isCurrentTab) {
		// 在当前标签页中打开翻译页面
		browser.tabs.update(tab.id, {
			url: translationUrl,
		});
	} else {
		// 在新标签页中打开翻译页面
		browser.tabs.create({
			url: translationUrl,
			active: true,
			index: tab.index + 1,
		});
	}
}

/**
 * 【可废弃，使用不到】翻译链接指向的页面
 * 使用Google翻译服务翻译链接指向的页面，并在新标签页中打开
 * @param {Object} info - 包含有关上下文菜单事件的信息，包括链接URL
 * @param {Object} tab - 包含有关当前标签页的信息
 */
function translateLink(info, tab) {
	const targetLang = getSettings("targetLang");
	const encodedLinkUrl = encodeURIComponent(info.linkUrl);
	const translationUrl = `https://translate.google.com/translate?hl=${targetLang}&tl=${targetLang}&sl=auto&u=${encodedLinkUrl}`;

	browser.tabs.create({
		url: translationUrl,
		active: true,
		index: tab.index + 1,
	});
}
