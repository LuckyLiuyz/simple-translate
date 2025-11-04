import browserInfo from "browser-info";
import manifest from "src/manifest-chrome.json";

/**
 * 获取快捷键
 * 根据操作系统类型获取对应平台的快捷键设置
 * @param {string} commandId - 命令ID
 * @returns {string|null} 快捷键字符串或null
 */
export default (commandId) => {
	// 获取建议的快捷键设置
	const suggestedKeys = manifest.commands[commandId].suggested_key || null;

	// 如果没有设置快捷键则返回null
	if (!suggestedKeys) return null;

	// 获取操作系统类型
	const os = browserInfo().os;

	// 根据操作系统返回对应的快捷键
	switch (os) {
		case "Windows":
			// Windows平台快捷键
			return suggestedKeys.windows || suggestedKeys.default;
		case "OS X":
			// macOS平台快捷键
			return suggestedKeys.mac || suggestedKeys.default;
		case "Linux":
			// Linux平台快捷键
			return suggestedKeys.linux || suggestedKeys.default;
		case "Android":
			// Android平台快捷键
			return suggestedKeys.android || suggestedKeys.default;
		case "iOS":
			// iOS平台快捷键
			return suggestedKeys.ios || suggestedKeys.default;
		default:
			// 默认快捷键
			return suggestedKeys.default || null;
	}
};
