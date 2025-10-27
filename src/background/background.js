/**
 * @file background.js 后台脚本，通常用于监听浏览器事件、处理插件核心逻辑，可调用全部Chrome API，生命周期与浏览器一致
 * @description: 注意：background 脚本无法直接操作页面 DOM，如需操作页面 DOM，请使用 content 脚本。
 */

import log from "loglevel";
import browser from "webextension-polyfill";
import onMessageListener from "./onMessageListener";
import {onCommandListener} from "./keyboardShortcuts";
import onInstalledListener from "./onInstalledListener";
import {updateLogLevel, overWriteLogLevel} from "src/common/log";
import {initSettings, handleSettingsChange} from "src/settings/settings";
import {showMenus, onMenusShownListener, onMenusClickedListener} from "./menus";

const logDir = "background/background";

browser.runtime.onInstalled.addListener(onInstalledListener);
browser.commands.onCommand.addListener(onCommandListener);
browser.runtime.onMessage.addListener(onMessageListener);
browser.storage.local.onChanged.addListener((changes) => {
	handleSettingsChange(changes);
	updateLogLevel();
	showMenus();
});

if (!!browser.contextMenus?.onShown)
	browser.contextMenus.onShown.addListener(onMenusShownListener);
browser.contextMenus.onClicked.addListener(onMenusClickedListener);

const init = async () => {
	await initSettings();
	overWriteLogLevel();
	updateLogLevel();
	log.info(logDir, "init()");
	showMenus();
};
init();
