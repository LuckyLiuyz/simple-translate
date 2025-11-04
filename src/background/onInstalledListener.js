import log from "loglevel";
import browser from "webextension-polyfill";
import {initShortcuts} from "./keyboardShortcuts";
import {initSettings, getSettings, setSettings} from "src/settings/settings";
import {
	RESULT_FONT_COLOR_LIGHT,
	RESULT_FONT_COLOR_DARK,
	CANDIDATE_FONT_COLOR_LIGHT,
	CANDIDATE_FONT_COLOR_DARK,
	BG_COLOR_LIGHT,
	BG_COLOR_DARK,
} from "src/settings/defaultColors";

const logDir = "background/onInstalledListener";

/**
 * 打开选项页面
 * @param {boolean} active - 是否激活标签页
 */
const openOptionsPage = (active) => {
	browser.tabs.create({
		url: "options/index.html#information?action=updated",
		active: active,
	});
};

/**
 * 处理插件安装或更新事件
 * @param {Object} details - 包含安装详情的对象
 */
export default async (details) => {
	// 只处理安装和更新事件
	if (details.reason != "install" && details.reason != "update") return;
	log.info(logDir, "onInstalledListener()", details);

	// 初始化设置
	await initSettings();
	// 初始化快捷键
	initShortcuts();

	// 根据设置决定是否打开选项页面
	const isShowOptionsPage = getSettings("isShowOptionsPageWhenUpdated");
	if (isShowOptionsPage) openOptionsPage(false);

	// 处理从2.8.0之前版本更新的情况
	if (
		details.reason == "update" &&
		details.previousVersion.replaceAll(".", "") < 280
	) {
		// 如果用户设置了自定义颜色，则启用颜色覆盖功能
		const isSetUserColor =
			(getSettings("resultFontColor") !== RESULT_FONT_COLOR_LIGHT &&
				getSettings("resultFontColor") !== RESULT_FONT_COLOR_DARK) ||
			(getSettings("candidateFontColor") !== CANDIDATE_FONT_COLOR_LIGHT &&
				getSettings("candidateFontColor") !== CANDIDATE_FONT_COLOR_DARK) ||
			(getSettings("bgColor") !== BG_COLOR_LIGHT &&
				getSettings("bgColor") !== BG_COLOR_DARK);

		if (isSetUserColor) {
			setSettings("isOverrideColors", true);
		}
	}
};
