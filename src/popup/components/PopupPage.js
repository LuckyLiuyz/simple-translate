import "../styles/PopupPage.scss";
import log from "loglevel";
import Header from "./Header";
import Footer from "./Footer";
import InputArea from "./InputArea";
import ResultArea from "./ResultArea";
import React, {Component} from "react";
import browser from "webextension-polyfill";
import {updateLogLevel, overWriteLogLevel} from "src/common/log";
import generateLangOptions from "src/common/generateLangOptions";
import {initSettings, getSettings, setSettings} from "src/settings/settings";

const logDir = "popup/PopupPage";

/**
 * 获取当前标签页信息
 * 包括URL、选中文本和扩展是否启用等信息
 * @returns {Promise<Object>} 标签页信息对象
 */
const getTabInfo = async () => {
	try {
		// 获取当前活动标签页
		const tab = (
			await browser.tabs.query({currentWindow: true, active: true})
		)[0];

		// 向内容脚本发送消息获取页面信息
		const tabUrl = browser.tabs.sendMessage(tab.id, {message: "getTabUrl"});
		const selectedText = browser.tabs.sendMessage(tab.id, {
			message: "getSelectedText",
		});
		const isEnabledOnPage = browser.tabs.sendMessage(tab.id, {
			message: "getEnabled",
		});

		// 等待所有消息响应
		const tabInfo = await Promise.all([tabUrl, selectedText, isEnabledOnPage]);
		return {
			isConnected: true, // 是否连接成功
			url: tabInfo[0], // 页面URL
			selectedText: tabInfo[1], // 选中文本
			isEnabledOnPage: tabInfo[2], // 扩展是否在页面上启用
		};
	} catch (e) {
		// 发生错误时返回默认值
		return {
			isConnected: false,
			url: "",
			selectedText: "",
			isEnabledOnPage: false,
		};
	}
};

// 获取UI语言并判断是否为从右到左的语言（如希伯来语、阿拉伯语）
const UILanguage = browser.i18n.getUILanguage();
const rtlLanguage = ["he", "ar"].includes(UILanguage);
const rtlLanguageClassName = rtlLanguage ? "popup-page-rtl-language" : "";

/**
 * 弹出页面主组件
 * 用户点击浏览器扩展图标时显示的界面
 */
export default class PopupPage extends Component {
	constructor(props) {
		super(props);
		this.state = {
			sourceLang: "", // 源语言
			targetLang: "", // 目标语言
			inputText: "", // 输入文本
			resultText: "", // 翻译结果
			candidateText: "", // 候选翻译
			isError: false, // 是否出错
			errorMessage: "", // 错误信息
			langList: [], // 语言列表
			tabUrl: "", // 标签页URL
			isConnected: true, // 是否连接到内容脚本
			isEnabledOnPage: true, // 扩展是否在页面上启用
			langHistory: [], // 语言历史记录
		};
		this.isSwitchedSecondLang = false; // 是否已切换到第二语言
		this.init();
	}

	/**
	 * 初始化弹出页面
	 */
	init = async () => {
		console.log("PopupPage init()");
		// 初始化设置
		await initSettings();
		overWriteLogLevel();
		updateLogLevel();

		// 设置主题
		this.themeClass = getSettings("theme") + "-theme";
		document.body.classList.add(this.themeClass);

		// 获取目标语言和语言历史记录
		const targetLang = getSettings("targetLang");
		let langHistory = getSettings("langHistory");
		if (!langHistory) {
			// 如果没有语言历史记录，则创建默认历史记录
			const secondLang = getSettings("secondTargetLang");
			langHistory = [targetLang, secondLang];
			setSettings("langHistory", langHistory);
		}

		// 更新状态
		this.setState({
			targetLang: targetLang,
			langHistory: langHistory,
			langList: generateLangOptions(getSettings("translationApi")),
		});

		// 获取标签页信息
		const tabInfo = await getTabInfo();
		this.setState({
			isConnected: tabInfo.isConnected,
			inputText: tabInfo.selectedText,
			tabUrl: tabInfo.url,
			isEnabledOnPage: tabInfo.isEnabledOnPage,
		});

		// 如果有选中文本则自动翻译
		if (tabInfo.selectedText !== "") this.handleInputText(tabInfo.selectedText);

		// 设置弹出页面宽度
		document.body.style.width = "348px";
	};

	/**
	 * 处理输入文本变化
	 * @param {string} inputText - 输入的文本
	 */
	handleInputText = (inputText) => {
		this.setState({inputText: inputText});

		// 清除之前的定时器
		const waitTime = getSettings("waitTime");
		clearTimeout(this.inputTimer);

		// 设置新的定时器，在等待时间后执行翻译
		this.inputTimer = setTimeout(async () => {
			const result = await this.translateText(inputText, this.state.targetLang);
			this.switchSecondLang(result);
		}, waitTime);
	};

	/**
	 * 设置语言历史记录
	 * @param {string} lang - 语言代码
	 */
	setLangHistory = (lang) => {
		let langHistory = getSettings("langHistory") || [];
		langHistory.push(lang);
		// 限制历史记录长度为30
		if (langHistory.length > 30) langHistory = langHistory.slice(-30);
		setSettings("langHistory", langHistory);
		this.setState({langHistory: langHistory});
	};

	/**
	 * 处理语言变更
	 * @param {string} lang - 新的目标语言
	 */
	handleLangChange = (lang) => {
		log.info(logDir, "handleLangChange()", lang);
		this.setState({targetLang: lang});
		const inputText = this.state.inputText;
		// 如果有输入文本则执行翻译
		if (inputText !== "") this.translateText(inputText, lang);
		this.setLangHistory(lang);
	};

	/**
	 * 翻译文本
	 * @param {string} text - 待翻译文本
	 * @param {string} targetLang - 目标语言
	 * @returns {Promise<Object>} 翻译结果
	 */
	translateText = async (text, targetLang) => {
		log.info(logDir, "translateText()", text, targetLang);

		// 向后台脚本发送翻译请求
		const result = await browser.runtime.sendMessage({
			message: "translate",
			text: text,
			sourceLang: "auto",
			targetLang: targetLang,
		});

		// 更新状态
		this.setState({
			resultText: result.resultText,
			candidateText: result.candidateText,
			sourceLang: result.sourceLanguage,
			isError: result.isError,
			errorMessage: result.errorMessage,
		});
		return result;
	};

	/**
	 * 切换第二语言
	 * 根据设置和翻译结果自动切换到第二语言
	 * @param {Object} result - 翻译结果
	 */
	switchSecondLang = (result) => {
		// 如果未启用自动切换语言功能则返回
		if (!getSettings("ifChangeSecondLang")) return;

		const defaultTargetLang = getSettings("targetLang");
		const secondLang = getSettings("secondTargetLang");
		// 如果默认语言和第二语言相同则返回
		if (defaultTargetLang === secondLang) return;

		// 判断源语言和目标语言是否相同
		const equalsSourceAndTarget =
			result.sourceLanguage.split("-")[0] ===
				this.state.targetLang.split("-")[0] && result.percentage > 0;
		const equalsSourceAndDefault =
			result.sourceLanguage.split("-")[0] === defaultTargetLang.split("-")[0] &&
			result.percentage > 0;
		// split("-")[0] : deepLでenとen-USを区別しないために必要

		// 根据条件切换语言
		if (!this.isSwitchedSecondLang) {
			// 如果未切换过且满足条件则切换到第二语言
			if (equalsSourceAndTarget && equalsSourceAndDefault) {
				log.info(logDir, "=>switchSecondLang()", result, secondLang);
				this.handleLangChange(secondLang);
				this.isSwitchedSecondLang = true;
			}
		} else {
			// 如果已切换过且不满足条件则切回默认语言
			if (!equalsSourceAndDefault) {
				log.info(logDir, "=>switchSecondLang()", result, defaultTargetLang);
				this.handleLangChange(defaultTargetLang);
				this.isSwitchedSecondLang = false;
			}
		}
	};

	/**
	 * 切换页面上的扩展启用状态
	 * @param {Event} e - 事件对象
	 */
	toggleEnabledOnPage = async (e) => {
		const isEnabled = e.target.checked;
		this.setState({isEnabledOnPage: isEnabled});
		try {
			// 获取当前标签页并向内容脚本发送启用/禁用消息
			const tab = (
				await browser.tabs.query({currentWindow: true, active: true})
			)[0];
			if (isEnabled)
				await browser.tabs.sendMessage(tab.id, {message: "enableExtension"});
			else
				await browser.tabs.sendMessage(tab.id, {message: "disableExtension"});
		} catch (e) {}
	};

	/**
	 * 渲染组件
	 */
	render() {
		return (
			<div className={rtlLanguageClassName}>
				<Header
					toggleEnabledOnPage={this.toggleEnabledOnPage}
					isEnabledOnPage={this.state.isEnabledOnPage}
					isConnected={this.state.isConnected}
				/>
				<InputArea
					inputText={this.state.inputText}
					handleInputText={this.handleInputText}
					sourceLang={this.state.sourceLang}
				/>
				<hr />
				<ResultArea
					inputText={this.state.inputText}
					targetLang={this.state.targetLang}
					resultText={this.state.resultText}
					candidateText={this.state.candidateText}
					isError={this.state.isError}
					errorMessage={this.state.errorMessage}
				/>
				<Footer
					tabUrl={this.state.tabUrl}
					targetLang={this.state.targetLang}
					langHistory={this.state.langHistory}
					handleLangChange={this.handleLangChange}
					langList={this.state.langList}
				/>
			</div>
		);
	}
}
