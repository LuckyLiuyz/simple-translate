/**
 * @file background.js 后台脚本，通常用于监听浏览器事件、处理插件核心逻辑，可调用全部Chrome API，生命周期与浏览器一致
 * @description: 注意：background 脚本无法直接操作页面 DOM，如需操作页面 DOM，请使用 content 脚本。
 */

// 日志记录库，用于输出调试信息
import log from "loglevel";
// 浏览器API兼容性库，提供统一的API调用方式兼容不同浏览器
import browser from "webextension-polyfill";
// 消息监听器，处理来自其他部分（如popup、content script）发送的消息
import onMessageListener from "./onMessageListener";
// 快捷键命令监听器，处理用户定义的快捷键操作
import {onCommandListener} from "./keyboardShortcuts";
// 插件安装事件监听器，处理插件安装或更新事件
import onInstalledListener from "./onInstalledListener";
// 日志级别管理函数，用于动态调整日志输出级别
import {updateLogLevel, overWriteLogLevel} from "src/common/log";
// 设置管理函数，包括初始化设置和处理设置变更
import {initSettings, handleSettingsChange} from "src/settings/settings";
// 菜单相关函数，包括显示菜单和处理菜单事件
import {showMenus, onMenusShownListener, onMenusClickedListener} from "./menus";

// 日志标识，用于标识日志来源
const logDir = "background/background";

// 监听插件安装或更新事件，执行初始化操作
browser.runtime.onInstalled.addListener(onInstalledListener);
// 监听快捷键命令事件，当用户按下定义的快捷键时触发
browser.commands.onCommand.addListener(onCommandListener);
// 监听运行时消息事件，处理来自插件其他部分的消息
browser.runtime.onMessage.addListener(onMessageListener);
// 监听本地存储变化事件，当设置发生变化时更新相关配置
browser.storage.local.onChanged.addListener((changes) => {
	// 处理设置变更逻辑
	handleSettingsChange(changes);
	// 更新日志输出级别
	updateLogLevel();
	// 重新显示上下文菜单
	showMenus();
});

// 如果浏览器支持上下文菜单的onShown事件，则添加监听器
if (!!browser.contextMenus?.onShown)
	// 监听上下文菜单显示事件，用于动态更新菜单内容
	browser.contextMenus.onShown.addListener(onMenusShownListener);
// 监听上下文菜单点击事件，处理用户的菜单选择操作
browser.contextMenus.onClicked.addListener(onMenusClickedListener);

// 插件初始化异步函数
const init = async () => {
	// 等待设置初始化完成
	await initSettings();
	// 覆盖日志级别设置
	overWriteLogLevel();
	// 更新日志级别
	updateLogLevel();
	// 输出初始化日志信息
	log.info(logDir, "init()");
	// 显示上下文菜单
	showMenus();
};

// 执行初始化函数
init();
