/**
 * @file src/settings/settings.js options配置界面封装的相关函数
 * @description 用于获取和设置插件的配置选项，并保存到浏览器的本地存储中。
 */

import log from "loglevel";
import browser from "webextension-polyfill";
import defaultSettings from "./defaultSettings";

const logDir = "settings/settings";

// 当前设置的缓存
let currentSettings = {};

/**
 * 初始化设置
 * 从浏览器存储中读取设置，如果不存在则使用默认设置
 */
export const initSettings = async () => {
	const response = await browser.storage.local.get("Settings");
	currentSettings = response.Settings || {};
	let shouldSave = false;

	/**
	 * 添加设置项到当前设置中
	 * @param {Object} element - 设置元素
	 */
	const pushSettings = (element) => {
		// 如果元素没有ID或默认值则跳过
		if (element.id == undefined || element.default == undefined) return;

		// 如果当前设置中不存在该ID，则使用默认值并标记需要保存
		if (currentSettings[element.id] == undefined) {
			currentSettings[element.id] = element.default;
			shouldSave = true;
		}
	};

	/**
	 * 获取默认设置
	 */
	const fetchDefaultSettings = () => {
		defaultSettings.forEach((category) => {
			category.elements.forEach((optionElement) => {
				pushSettings(optionElement);
				// 处理子元素
				if (optionElement.childElements) {
					optionElement.childElements.forEach((childElement) => {
						pushSettings(childElement);
					});
				}
			});
		});
	};

	fetchDefaultSettings();

	// 如果有新增设置项则保存到存储中
	if (shouldSave) await browser.storage.local.set({Settings: currentSettings});
};

/**
 * 设置特定ID的配置项
 * @param {string} id - 设置项ID
 * @param {*} value - 设置值
 */
export const setSettings = async (id, value) => {
	log.info(logDir, "setSettings()", id, value);
	currentSettings[id] = value;
	await browser.storage.local.set({Settings: currentSettings});
};

/**
 * 获取特定ID的配置项
 * @param {string} id - 设置项ID
 * @returns {*} 设置值
 */
export const getSettings = (id) => {
	return currentSettings[id];
};

/**
 * 获取所有配置项
 * @returns {Object} 所有配置项
 */
export const getAllSettings = () => {
	return currentSettings;
};

/**
 * 重置所有配置项为默认值
 */
export const resetAllSettings = async () => {
	log.info(logDir, "resetAllSettings()");
	currentSettings = {};
	await browser.storage.local.set({Settings: currentSettings});
	await initSettings();
};

/**
 * 处理设置变更
 * @param {Object} changes - 变更对象
 * @returns {Object|null} 新的设置或null
 */
export const handleSettingsChange = (changes) => {
	if (Object.keys(changes).includes("Settings")) {
		currentSettings = changes.Settings.newValue;
		return currentSettings;
	}
	return null;
};

/**
 * 导出设置到JSON文件
 */
export const exportSettings = async () => {
	const settingsIds = getSettingsIds();

	// 构建设置对象
	let settingsObj = {};
	for (const id of settingsIds) {
		settingsObj[id] = getSettings(id);
	}

	// 创建下载链接
	const downloadUrl = URL.createObjectURL(
		new Blob([JSON.stringify(settingsObj, null, "  ")], {
			type: "aplication/json",
		})
	);

	// 触发下载
	const a = document.createElement("a");
	document.body.appendChild(a);
	a.download = "SimpleTranslate_Settings.json";
	a.href = downloadUrl;
	a.click();
	a.remove();
	URL.revokeObjectURL(downloadUrl);
};

/**
 * 从JSON文件导入设置
 * @param {Event} e - 文件选择事件
 */
export const importSettings = async (e) => {
	const reader = new FileReader();

	reader.onload = async () => {
		// 解析导入的设置
		const importedSettings = JSON.parse(reader.result);
		const settingsIds = getSettingsIds();

		// 应用导入的设置
		for (const id of settingsIds) {
			if (importedSettings[id] !== undefined)
				await setSettings(id, importedSettings[id]);
		}

		// 重新加载页面以应用更改
		location.reload(true);
	};

	// 读取选择的文件
	const file = e.target.files[0];
	reader.readAsText(file);
};

/**
 * 获取所有设置项的ID
 * @returns {Array<string>} 设置项ID数组
 */
const getSettingsIds = () => {
	let settingsIds = [];
	defaultSettings.forEach((category) => {
		category.elements.forEach((optionElement) => {
			// 添加主元素ID
			if (optionElement.id && optionElement.default !== undefined)
				settingsIds.push(optionElement.id);

			// 添加子元素ID
			if (optionElement.childElements) {
				optionElement.childElements.forEach((childElement) => {
					if (childElement.id && childElement.default !== undefined)
						settingsIds.push(childElement.id);
				});
			}
		});
	});
	return settingsIds;
};
