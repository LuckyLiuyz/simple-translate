import browser from "webextension-polyfill";
import translate from "src/common/translate";
import {initSettings} from "src/settings/settings";

/**
 * 处理来自插件其他部分（如popup、content script）发送的消息
 * @param {Object} data - 包含消息数据的对象
 * @returns {Promise<any>} 翻译结果的Promise
 */
export default async (data) => {
	// 初始化设置
	await initSettings();

	// 根据消息类型执行相应操作
	switch (data.message) {
		case "translate": {
			// 执行翻译操作
			return await translate(data.text, data.sourceLang, data.targetLang);
		}
	}
};
