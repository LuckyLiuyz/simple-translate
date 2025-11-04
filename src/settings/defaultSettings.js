import React from "react";
import browser from "webextension-polyfill";
import generateLangOptions from "src/common/generateLangOptions";
import {getSettings, setSettings} from "./settings";
import {
	RESULT_FONT_COLOR_LIGHT,
	RESULT_FONT_COLOR_DARK,
	CANDIDATE_FONT_COLOR_LIGHT,
	CANDIDATE_FONT_COLOR_DARK,
	BG_COLOR_LIGHT,
	BG_COLOR_DARK,
} from "./defaultColors";

/**
 * 获取默认语言设置
 * 根据浏览器界面语言设置默认的目标语言和第二目标语言
 * @returns {Object} 包含targetLang和secondTargetLang的对象
 */
const getDefaultLangs = async () => {
	const uiLang = browser.i18n.getUILanguage(); // 获取浏览器 UI 的语言。它返回一个表示浏览器界面语言的字符串，例如 "en" 表示英语，"zh-CN" 表示简体中文等。

	// 如果获取到locale cookie，则使用其值作为UI语言
	const loginLocale = getLocalCookie("loginLocale"); // 获取BIP系统的登录语言
	console.log("lyz loginLocale=", loginLocale);

	const langOptions = generateLangOptions("google");

	const shouldUseUiLang = langOptions.some((lang) => lang.value == uiLang);
	let targetLang = shouldUseUiLang ? uiLang : "en";
	// 优先使用BIP系统的登录语言，否则使用浏览器UI语言
	if (loginLocale) {
		targetLang = loginLocale;
	}
	const secondTargetLang = targetLang === "en" ? "ja" : "en";

	return {targetLang, secondTargetLang};
};

/**
 * 获取本地Cookie
 * 尝试获取浏览器的locale cookie，但需要确保在合适的上下文中执行
 * @param {string} name - cookie的名称
 * @returns {string} cookie的值，如果没有找到则返回空字符串
 */
const getLocalCookie = (name) => {
	// 尝试获取locale cookie，但需要确保在合适的上下文中执行
	let cookieString = document.cookie;
	console.log("lyz cookieString=", cookieString);

	// 创建空对象存储cookie键值对
	const cookies = {};
	// 按分号和空格分割cookie字符串
	const items = cookieString.split("; ");
	// 遍历每个键值对
	items.forEach((item) => {
		// 按等号分割键和值
		const [key, value] = item.split("=");
		// 将键值对存储到对象中，如果值为空字符串或undefined，则存储为空字符串
		cookies[key] = value || "";
	});
	return cookies[name] || "";
};

/**
 * 当切换翻译API时更新语言设置
 * 处理不同翻译服务之间的语言代码映射
 */
const updateLangsWhenChangeTranslationApi = () => {
	const translationApi = getSettings("translationApi");
	const targetLang = getSettings("targetLang");
	const secondTargetLang = getSettings("secondTargetLang");
	const currentLangs = generateLangOptions(translationApi).map(
		(option) => option.value
	);

	/**
	 * 语言代码映射函数
	 * 处理不同翻译服务之间的语言代码差异
	 * @param {string} lang - 原始语言代码
	 * @returns {string} 映射后的语言代码
	 */
	const mappingLang = (lang) => {
		switch (lang) {
			case "en":
				return "en-US";
			case "en-US":
			case "en-GB":
				return "en";
			case "zh":
				return "zh-CN";
			case "zh-CN":
			case "zh-TW":
				return "zh";
			case "pt":
				return "pt-PT";
			case "pt-PT":
			case "pt-BR":
				return "pt";
			default:
				return currentLangs[0];
		}
	};

	// 如果当前目标语言不被新的翻译API支持，则进行映射
	if (!currentLangs.includes(targetLang))
		setSettings("targetLang", mappingLang(targetLang));
	if (!currentLangs.includes(secondTargetLang))
		setSettings("secondTargetLang", mappingLang(secondTargetLang));
};

// 获取默认语言设置
const defaultLangs = getDefaultLangs();
// MV2中使用window.matchMedia获取系统主题，但在MV3中难以实现，因此省略
const getTheme = () => "light";

/**
 * 默认设置配置
 * 定义了插件的所有设置项，包括分类、类型、默认值等
 */
export default [
	{
		// 通用设置分类
		category: "generalLabel",
		elements: [
			{
				// 翻译API设置
				id: "translationApi",
				title: "translationApiLabel",
				captions: [],
				type: "none",
				default: "google",
				// 子元素：Google和DeepL API选项
				childElements: [
					{
						id: "translationApi",
						title: "googleApiLabel",
						captions: ["googleApiCaptionLabel"],
						type: "radio",
						value: "google",
						// 切换API时更新语言设置
						handleChange: () => updateLangsWhenChangeTranslationApi(),
					},
					{
						id: "translationApi",
						title: "deeplApiLabel",
						captions: ["deeplApiCaptionLabel"],
						// DeepL API额外说明链接
						extraCaption: React.createElement(
							"p",
							{className: "caption"},
							React.createElement(
								"a",
								{
									href: "https://github.com/sienori/simple-translate/wiki/How-to-register-DeepL-API",
									target: "_blank",
								},
								browser.i18n.getMessage("howToUseDeeplLabel")
							)
						),
						type: "radio",
						value: "deepl",
						// 切换API时更新语言设置
						handleChange: () => updateLangsWhenChangeTranslationApi(),
					},
					{
						// DeepL计划设置（免费版/专业版）
						id: "deeplPlan",
						title: "deeplPlanLabel",
						captions: ["deeplPlanCaptionLabel"],
						type: "select",
						default: "deeplFree",
						// 仅当选择DeepL API时显示
						shouldShow: () => getSettings("translationApi") === "deepl",
						hr: true,
						options: [
							{
								name: "deeplFreeLabel",
								value: "deeplFree",
							},
							{
								name: "deeplProLabel",
								value: "deeplPro",
							},
						],
					},
					{
						// DeepL认证密钥设置
						id: "deeplAuthKey",
						title: "deeplAuthKeyLabel",
						captions: ["deeplAuthKeyCaptionLabel"],
						type: "text",
						default: "",
						placeholder: "00000000-0000-0000-0000-00000000000000:fx",
						// 仅当选择DeepL API时显示
						shouldShow: () => getSettings("translationApi") === "deepl",
					},
				],
			},
			{
				// 目标语言设置
				id: "targetLang",
				title: "targetLangLabel",
				captions: ["targetLangCaptionLabel"],
				type: "select",
				default: defaultLangs.targetLang,
				// 动态生成语言选项
				options: () => generateLangOptions(getSettings("translationApi")),
				useRawOptionName: true,
			},
			{
				// 第二目标语言设置
				id: "secondTargetLang",
				title: "secondTargetLangLabel",
				captions: ["secondTargetLangCaptionLabel"],
				type: "select",
				default: defaultLangs.secondTargetLang,
				// 动态生成语言选项
				options: () => generateLangOptions(getSettings("translationApi")),
				useRawOptionName: true,
			},
			{
				// 是否显示候选翻译设置
				id: "ifShowCandidate",
				title: "ifShowCandidateLabel",
				captions: ["ifShowCandidateCaptionLabel"],
				type: "checkbox",
				default: true,
				// 仅当使用Google翻译时显示
				shouldShow: () => getSettings("translationApi") === "google",
			},
		],
	},
	{
		// 网页翻译设置分类
		category: "webPageLabel",
		elements: [
			{
				// 文本选择时的行为设置
				id: "whenSelectText",
				title: "whenSelectTextLabel",
				captions: [],
				type: "none",
				default: "showButton",
				// 子元素：不同行为选项
				childElements: [
					{
						id: "whenSelectText",
						title: "ifShowButtonLabel",
						captions: ["ifShowButtonCaptionLabel"],
						type: "radio",
						value: "showButton",
					},
					{
						id: "whenSelectText",
						title: "ifAutoTranslateLabel",
						captions: ["ifAutoTranslateCaptionLabel"],
						type: "radio",
						value: "showPanel",
					},
					{
						id: "whenSelectText",
						title: "dontShowButtonLabel",
						captions: ["dontShowButtonCaptionLabel"],
						type: "radio",
						value: "dontShowButton",
					},
					{
						// 是否检查语言设置
						id: "ifCheckLang",
						title: "ifCheckLangLabel",
						captions: ["ifCheckLangCaptionLabel"],
						type: "checkbox",
						default: true,
						hr: true,
					},
				],
			},
			{
				// 仅在按下修饰键时翻译设置
				id: "ifOnlyTranslateWhenModifierKeyPressed",
				title: "ifOnlyTranslateWhenModifierKeyPressedLabel",
				captions: ["ifOnlyTranslateWhenModifierKeyPressedCaptionLabel"],
				type: "checkbox",
				default: false,
				// 子元素：修饰键选择
				childElements: [
					{
						id: "modifierKey",
						title: "modifierKeyLabel",
						captions: [],
						type: "select",
						default: "shift",
						options: [
							{
								name: "shiftLabel",
								value: "shift",
							},
							{
								name: "ctrlLabel",
								value: "ctrl",
							},
							{
								name: "altLabel",
								value: "alt",
							},
							{
								name: "cmdLabel",
								value: "cmd",
							},
						],
					},
				],
			},
			{
				// 是否在页面上切换第二语言设置
				id: "ifChangeSecondLangOnPage",
				title: "ifChangeSecondLangLabel",
				captions: ["ifChangeSecondLangOnPageCaptionLabel"],
				type: "checkbox",
				default: false,
			},
			{
				// 禁用翻译设置组
				title: "disableTranslationLabel",
				captions: [],
				type: "none",
				// 子元素：各种禁用翻译的选项
				childElements: [
					{
						// 在文本字段中禁用翻译
						id: "isDisabledInTextFields",
						title: "isDisabledInTextFieldsLabel",
						captions: ["isDisabledInTextFieldsCaptionLabel"],
						type: "checkbox",
						default: false,
					},
					{
						// 在代码元素中禁用翻译
						id: "isDisabledInCodeElement",
						title: "isDisabledInCodeElementLabel",
						captions: ["isDisabledInCodeElementCaptionLabel"],
						type: "checkbox",
						default: false,
					},
					{
						// 忽略的文档语言
						id: "ignoredDocumentLang",
						title: "ignoredDocumentLangLabel",
						captions: ["ignoredDocumentLangCaptionLabel"],
						type: "text",
						default: "",
						placeholder: "en, ru, zh",
					},
					{
						// 禁用翻译的URL列表
						id: "disableUrlList",
						title: "disableUrlListLabel",
						captions: ["disableUrlListCaptionLabel"],
						type: "textarea",
						default: "",
						placeholder: "https://example.com/*\nhttps://example.net/*",
					},
				],
			},
		],
	},
	{
		// 工具栏设置分类
		category: "toolbarLabel",
		elements: [
			{
				// 等待时间设置
				id: "waitTime",
				title: "waitTimeLabel",
				captions: ["waitTimeCaptionLabel", "waitTime2CaptionLabel"],
				type: "number",
				min: 0,
				placeholder: 500,
				default: 500,
			},
			{
				// 是否切换第二语言设置
				id: "ifChangeSecondLang",
				title: "ifChangeSecondLangLabel",
				captions: ["ifChangeSecondLangCaptionLabel"],
				type: "checkbox",
				default: true,
			},
		],
	},
	{
		// 菜单设置分类
		category: "menuLabel",
		elements: [
			{
				// 是否显示菜单设置
				id: "ifShowMenu",
				title: "ifShowMenuLabel",
				captions: ["ifShowMenuCaptionLabel"],
				type: "checkbox",
				default: true,
			},
		],
	},
	{
		// 页面翻译设置分类
		category: "pageTranslationLabel",
		elements: [
			{
				// 页面翻译打开方式设置
				id: "pageTranslationOpenTo",
				title: "pageTranslationOpenToLabel",
				captions: ["pageTranslationOpenToCaptionLabel"],
				type: "select",
				default: "newTab",
				options: [
					{
						name: "newTabLabel",
						value: "newTab",
					},
					{
						name: "currentTabLabel",
						value: "currentTab",
					},
				],
			},
		],
	},
	{
		// 样式设置分类
		category: "styleLabel",
		elements: [
			{
				// 主题设置
				id: "theme",
				title: "themeLabel",
				captions: ["themeCaptionLabel"],
				type: "select",
				default: "system",
				options: [
					{
						name: "lightLabel",
						value: "light",
					},
					{
						name: "darkLabel",
						value: "dark",
					},
					{
						name: "systemLabel",
						value: "system",
					},
				],
			},
			{
				// 按钮样式设置组
				title: "buttonStyleLabel",
				captions: ["buttonStyleCaptionLabel"],
				type: "none",
				// 子元素：按钮相关设置
				childElements: [
					{
						// 按钮大小设置
						id: "buttonSize",
						title: "buttonSizeLabel",
						captions: [],
						type: "number",
						min: 1,
						placeholder: 22,
						default: 22,
					},
					{
						// 按钮方向设置
						id: "buttonDirection",
						title: "displayDirectionLabel",
						captions: [],
						type: "select",
						default: "bottomRight",
						options: [
							{
								name: "topLabel",
								value: "top",
							},
							{
								name: "bottomLabel",
								value: "bottom",
							},
							{
								name: "rightLabel",
								value: "right",
							},
							{
								name: "leftLabel",
								value: "left",
							},
							{
								name: "topRightLabel",
								value: "topRight",
							},
							{
								name: "topLeftLabel",
								value: "topLeft",
							},
							{
								name: "bottomRightLabel",
								value: "bottomRight",
							},
							{
								name: "bottomLeftLabel",
								value: "bottomLeft",
							},
						],
					},
					{
						// 按钮偏移量设置
						id: "buttonOffset",
						title: "positionOffsetLabel",
						captions: [],
						type: "number",
						default: 10,
						placeholder: 10,
					},
				],
			},
			{
				// 面板样式设置组
				title: "panelStyleLabel",
				captions: ["panelStyleCaptionLabel"],
				type: "none",
				// 子元素：面板相关设置
				childElements: [
					{
						// 面板宽度设置
						id: "width",
						title: "widthLabel",
						captions: [],
						type: "number",
						min: 1,
						placeholder: 300,
						default: 300,
					},
					{
						// 面板高度设置
						id: "height",
						title: "heightLabel",
						captions: [],
						type: "number",
						min: 1,
						placeholder: 200,
						default: 200,
					},
					{
						// 字体大小设置
						id: "fontSize",
						title: "fontSizeLabel",
						captions: [],
						type: "number",
						min: 1,
						placeholder: 13,
						default: 13,
					},
					{
						// 面板参考点设置
						id: "panelReferencePoint",
						title: "referencePointLabel",
						captions: [],
						type: "select",
						default: "bottomSelectedText",
						options: [
							{
								name: "topSelectedTextLabel",
								value: "topSelectedText",
							},
							{
								name: "bottomSelectedTextLabel",
								value: "bottomSelectedText",
							},
							{
								name: "clickedPointLabel",
								value: "clickedPoint",
							},
						],
					},
					{
						// 面板方向设置
						id: "panelDirection",
						title: "displayDirectionLabel",
						captions: [],
						type: "select",
						default: "bottom",
						options: [
							{
								name: "topLabel",
								value: "top",
							},
							{
								name: "bottomLabel",
								value: "bottom",
							},
							{
								name: "rightLabel",
								value: "right",
							},
							{
								name: "leftLabel",
								value: "left",
							},
							{
								name: "topRightLabel",
								value: "topRight",
							},
							{
								name: "topLeftLabel",
								value: "topLeft",
							},
							{
								name: "bottomRightLabel",
								value: "bottomRight",
							},
							{
								name: "bottomLeftLabel",
								value: "bottomLeft",
							},
						],
					},
					{
						// 面板偏移量设置
						id: "panelOffset",
						title: "positionOffsetLabel",
						captions: [],
						type: "number",
						default: 10,
						placeholder: 10,
					},
					{
						// 是否覆盖颜色设置
						id: "isOverrideColors",
						title: "isOverrideColorsLabel",
						captions: [],
						type: "checkbox",
						default: false,
					},
					{
						// 结果字体颜色设置
						id: "resultFontColor",
						title: "resultFontColorLabel",
						captions: [],
						type: "color",
						default:
							getTheme() === "light"
								? RESULT_FONT_COLOR_LIGHT
								: RESULT_FONT_COLOR_DARK,
					},
					{
						// 候选词字体颜色设置
						id: "candidateFontColor",
						title: "candidateFontColorLabel",
						captions: [],
						type: "color",
						default:
							getTheme() === "light"
								? CANDIDATE_FONT_COLOR_LIGHT
								: CANDIDATE_FONT_COLOR_DARK,
					},
					{
						// 背景颜色设置
						id: "bgColor",
						title: "bgColorLabel",
						captions: [],
						type: "color",
						default: getTheme() === "light" ? BG_COLOR_LIGHT : BG_COLOR_DARK,
					},
				],
			},
		],
	},
	{
		// 其他设置分类
		category: "otherLabel",
		elements: [
			{
				// 更新时是否显示选项页面设置
				id: "isShowOptionsPageWhenUpdated",
				title: "isShowOptionsPageWhenUpdatedLabel",
				captions: ["isShowOptionsPageWhenUpdatedCaptionLabel"],
				type: "checkbox",
				default: true,
			},
			{
				// 是否启用调试模式设置
				id: "isDebugMode",
				title: "isDebugModeLabel",
				captions: ["isDebugModeCaptionLabel"],
				type: "checkbox",
				default: false,
			},
			{
				// 是否启用自定义模式设置
				id: "isOpenCustomMode",
				title: "isOpenCustomModeLabel",
				captions: ["isOpenCustomModeCaptionLabel"],
				type: "checkbox",
				default: false,
			},
			{
				// 是否自动翻译设置
				id: "isAutoTranslate",
				title: "isAutoTranslateLabel",
				captions: ["isAutoTranslateCaptionLabel"],
				type: "checkbox",
				default: false,
			},
		],
	},
];
