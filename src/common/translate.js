/**
 * @file 翻译相关功能
 * @description 包含调用翻译 API 及缓存翻译结果等功能。
 */

import log from "loglevel";
import browser from "webextension-polyfill";
import {getSettings} from "src/settings/settings";

const logDir = "common/translate";

/**
 * 获取翻译历史记录
 * 从浏览器会话存储中获取已缓存的翻译结果
 * @param {string} sourceWord - 源文本
 * @param {string} sourceLang - 源语言
 * @param {string} targetLang - 目标语言
 * @param {string} translationApi - 翻译API类型
 * @returns {Promise<Object|boolean>} 翻译结果或false（未找到）
 */
const getHistory = async (
	sourceWord,
	sourceLang,
	targetLang,
	translationApi
) => {
	// 从会话存储中获取翻译结果
	const result = await browser.storage.session.get(
		`${sourceLang}-${targetLang}-${translationApi}-${sourceWord}`
	);

	// 如果找到缓存结果则返回，否则返回false
	return (
		result[`${sourceLang}-${targetLang}-${translationApi}-${sourceWord}`] ??
		false
	);
};

/**
 * 设置翻译历史记录
 * 将翻译结果保存到浏览器会话存储中
 * @param {string} sourceWord - 源文本
 * @param {string} sourceLang - 源语言
 * @param {string} targetLang - 目标语言
 * @param {string} translationApi - 翻译API类型
 * @param {Object} result - 翻译结果
 */
const setHistory = async (
	sourceWord,
	sourceLang,
	targetLang,
	translationApi,
	result
) => {
	// 如果翻译出错则不缓存
	if (result.isError) return;

	// 将翻译结果保存到会话存储中
	await browser.storage.session.set({
		[`${sourceLang}-${targetLang}-${translationApi}-${sourceWord}`]: result,
	});
};

/**
 * 向Google翻译API发送请求
 * @param {string} word - 需要翻译的文本
 * @param {string} sourceLang - 源语言
 * @param {string} targetLang - 目标语言
 * @returns {Promise<Object>} 翻译结果对象
 */
const sendRequestToGoogle = async (word, sourceLang, targetLang) => {
	// 构造Google翻译API请求URL
	const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=${sourceLang}&tl=${targetLang}&dt=t&dt=bd&dj=1&q=${encodeURIComponent(
		word
	)}`;

	// 发送请求并处理错误
	const response = await fetch(url).catch((e) => ({status: 0, statusText: ""}));

	// 初始化结果对象
	const resultData = {
		resultText: "", // 翻译结果文本
		candidateText: "", // 候选翻译文本
		sourceLanguage: "", // 源语言
		percentage: 0, // 翻译置信度
		isError: false, // 是否出错
		errorMessage: "", // 错误信息
	};

	// 处理HTTP错误状态
	if (response.status !== 200) {
		resultData.isError = true;

		// 根据不同错误状态设置相应的错误信息
		if (response.status === 0)
			resultData.errorMessage = browser.i18n.getMessage("networkError");
		else if (response.status === 429 || response.status === 503)
			resultData.errorMessage = browser.i18n.getMessage("unavailableError");
		else
			resultData.errorMessage = `${browser.i18n.getMessage("unknownError")} [${
				response.status
			} ${response.statusText}]`;

		log.error(logDir, "sendRequest()", response);
		return resultData;
	}

	// 解析翻译结果
	const result = await response.json();

	// 提取翻译信息
	resultData.sourceLanguage = result.src;
	resultData.percentage = result.ld_result.srclangs_confidences[0];

	// 提取翻译结果文本
	resultData.resultText = result.sentences
		.map((sentence) => sentence.trans)
		.join("");

	// 提取候选翻译（如果有）
	if (result.dict) {
		resultData.candidateText = result.dict
			.map(
				(dict) =>
					`${dict.pos}${dict.pos != "" ? ": " : ""}${
						dict.terms !== undefined ? dict.terms.join(", ") : ""
					}\n`
			)
			.join("");
	}

	log.log(logDir, "sendRequest()", resultData);
	return resultData;
};

/**
 * 向DeepL翻译API发送请求
 * @param {string} word - 需要翻译的文本
 * @param {string} sourceLang - 源语言
 * @param {string} targetLang - 目标语言
 * @returns {Promise<Object>} 翻译结果对象
 */
const sendRequestToDeepL = async (word, sourceLang, targetLang) => {
	// 构造请求参数
	let params = new URLSearchParams();
	const authKey = getSettings("deeplAuthKey"); // 获取DeepL认证密钥
	params.append("auth_key", authKey);
	params.append("text", word);
	params.append("target_lang", targetLang);

	// 根据设置选择DeepL API端点
	const url =
		getSettings("deeplPlan") === "deeplFree"
			? "https://api-free.deepl.com/v2/translate"
			: "https://api.deepl.com/v2/translate";

	// 发送请求并处理错误
	const response = await fetch(url, {
		method: "POST",
		body: params,
	}).catch((e) => ({status: 0, statusText: ""}));

	// 初始化结果对象
	const resultData = {
		resultText: "", // 翻译结果文本
		candidateText: "", // 候选翻译文本
		sourceLanguage: "", // 源语言
		percentage: 0, // 翻译置信度
		isError: false, // 是否出错
		errorMessage: "", // 错误信息
	};

	// 处理HTTP错误状态
	if (response.status !== 200) {
		resultData.isError = true;

		// 根据不同错误状态设置相应的错误信息
		if (response.status === 0)
			resultData.errorMessage = browser.i18n.getMessage("networkError");
		else if (response.status === 403)
			resultData.errorMessage = browser.i18n.getMessage("deeplAuthError");
		else
			resultData.errorMessage = `${browser.i18n.getMessage("unknownError")} [${
				response.status
			} ${response.statusText}]`;

		log.error(logDir, "sendRequestToDeepL()", response);
		return resultData;
	}

	// 解析翻译结果
	const result = await response.json();

	// 提取翻译信息
	resultData.resultText = result.translations[0].text;
	resultData.sourceLanguage =
		result.translations[0].detected_source_language.toLowerCase();
	resultData.percentage = 1; // DeepL不提供置信度，设为1

	log.log(logDir, "sendRequestToDeepL()", resultData);
	return resultData;
};

/**
 * 翻译函数主入口
 * 根据设置选择翻译API并执行翻译
 * @param {string} sourceWord - 源文本
 * @param {string} sourceLang - 源语言，默认为"auto"自动检测
 * @param {string} targetLang - 目标语言
 * @returns {Promise<Object>} 翻译结果对象
 */
export default async (sourceWord, sourceLang = "auto", targetLang) => {
	log.log(logDir, "tranlate()", sourceWord, targetLang);

	// 去除首尾空格
	sourceWord = sourceWord.trim();

	// 如果文本为空则返回空结果
	if (sourceWord === "")
		return {
			resultText: "",
			candidateText: "",
			sourceLanguage: "en",
			percentage: 0,
			statusText: "OK",
		};

	// 获取翻译API设置
	const translationApi = getSettings("translationApi");

	// 尝试从缓存中获取翻译结果
	const cachedResult = await getHistory(
		sourceWord,
		sourceLang,
		targetLang,
		translationApi
	);
	if (cachedResult) return cachedResult;

	// 根据设置选择API并执行翻译
	const result =
		translationApi === "google"
			? await sendRequestToGoogle(sourceWord, sourceLang, targetLang)
			: await sendRequestToDeepL(sourceWord, sourceLang, targetLang);

	// 缓存翻译结果
	setHistory(sourceWord, sourceLang, targetLang, translationApi, result);
	return result;
};
