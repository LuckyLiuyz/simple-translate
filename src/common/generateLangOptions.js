import browser from "webextension-polyfill";

/**
 * 按字母顺序排序语言选项
 * @param {Object} a - 第一个语言对象
 * @param {Object} b - 第二个语言对象
 * @returns {number} 比较结果
 */
const alphabeticallySort = (a, b) => a.name.localeCompare(b.name);

// Google翻译支持的语言列表
const langListGoogle = ["zh-CN", "zh-TW", "en"];

// DeepL翻译支持的语言列表
const langListDeepl = ["en-US", "en-GB", "zh"];

/**
 * 生成语言选项列表
 * 根据翻译API类型生成对应的语言选项
 * @param {string} translationApi - 翻译API类型 ("google" 或 "deepl")
 * @returns {Array<Object>} 语言选项数组
 */
export default (translationApi) => {
	// 根据翻译API选择对应的语言列表
	const langList = translationApi === "google" ? langListGoogle : langListDeepl;

	// 将语言代码映射为包含值和名称的对象
	const langOptions = langList.map((lang) => ({
		value: lang,
		name: browser.i18n.getMessage("lang_" + lang.replace("-", "_")),
	}));

	// 按语言名称字母顺序排序
	langOptions.sort(alphabeticallySort);

	return langOptions;
};
