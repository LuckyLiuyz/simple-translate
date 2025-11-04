import log from "loglevel";
import browserInfo from "browser-info";
import openUrl from "../common/openUrl";
import browser from "webextension-polyfill";
import manifest from "src/manifest-chrome.json";
import getShortcut from "src/common/getShortcut";
import {initSettings} from "../settings/settings";
import {getSettings, setSettings} from "src/settings/settings";

const logDir = "background/keyboardShortcuts";

/**
 * 初始化快捷键设置
 * 仅在Firefox 60及以上版本中有效
 */
export const initShortcuts = async () => {
	// 检查浏览器是否支持快捷键功能
	const isValidShortcuts =
		browserInfo().name == "Firefox" && browserInfo().version >= 60;
	if (!isValidShortcuts) return;
	log.info(logDir, "initShortcuts()");

	// 获取已初始化的快捷键列表
	let initedShortcuts = getSettings("initedShortcuts") || [];

	// 遍历清单文件中的命令并初始化快捷键
	const commands = manifest.commands;
	for (const commandId of Object.keys(commands)) {
		// 如果快捷键已经初始化过则跳过
		if (initedShortcuts.includes(commandId)) continue;

		try {
			// 更新快捷键设置
			await browser.commands.update({
				name: commandId,
				shortcut: getShortcut(commandId),
			});
			// 将已初始化的快捷键加入列表
			initedShortcuts.push(commandId);
		} catch (e) {
			// 记录错误日志
			log.error(logDir, "initShortcuts()", e);
		}
	}
	// 保存已初始化的快捷键列表
	setSettings("initedShortcuts", initedShortcuts);
};

/**
 * 处理快捷键命令的监听器
 * @param {string} command - 触发的命令名称
 */
export const onCommandListener = async (command) => {
	log.log(logDir, "onCommandListener()", command);
	// 初始化设置
	await initSettings();

	// 根据命令类型执行相应操作
	switch (command) {
		case "translateSelectedText": {
			translateSelectedText();
			break;
		}
		case "translatePage": {
			translatePage();
			break;
		}
	}
};

/**
 * 翻译选中文本
 * 获取当前活动标签页并向其发送翻译选中文本的消息
 */
const translateSelectedText = async () => {
	// 获取当前活动标签页
	const tab = (
		await browser.tabs.query({active: true, currentWindow: true})
	)[0];

	// 向标签页发送翻译选中文本的消息
	browser.tabs.sendMessage(tab.id, {
		message: "translateSelectedText",
	});
};

/**
 * 翻译整个页面
 * 获取当前页面URL并通过Google翻译服务进行翻译
 */
const translatePage = async () => {
	// 获取当前活动标签页
	const tab = (
		await browser.tabs.query({active: true, currentWindow: true})
	)[0];

	// 向标签页发送获取页面URL的消息
	const tabUrl = await browser.tabs.sendMessage(tab.id, {message: "getTabUrl"});

	// 获取目标语言设置
	const targetLang = getSettings("targetLang");
	// 对页面URL进行编码
	const encodedPageUrl = encodeURIComponent(tabUrl);
	// 构造Google翻译URL
	const translationUrl = `https://translate.google.com/translate?hl=${targetLang}&tl=${targetLang}&sl=auto&u=${encodedPageUrl}`;
	// 判断是否在当前标签页打开翻译结果
	const isCurrentTab = getSettings("pageTranslationOpenTo") === "currentTab";

	// 打开翻译结果页面
	openUrl(translationUrl, isCurrentTab);
};
