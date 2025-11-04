import React, {Component} from "react";
import browser from "webextension-polyfill";
import {getSettings} from "src/settings/settings";
import TranslateButton from "./TranslateButton";
import TranslatePanel from "./TranslatePanel";
import "../styles/TranslateContainer.scss";

// TODO 临时默认目标语言为英文
/**
 * 翻译文本函数
 * 向后台脚本发送翻译请求并获取翻译结果
 * @param {string} text - 需要翻译的文本
 * @param {string} targetLang - 目标语言代码，默认为设置中的目标语言
 * @returns {Promise<Object>} 翻译结果的Promise对象
 */
export const translateText = async (
	text,
	targetLang = getSettings("targetLang")
) => {
	console.log("translateText()", text, targetLang);
	let result = {};
	const isOpenCustomMode = getSettings("isOpenCustomMode");
	// 自定义模式下的翻译, 优先级高于翻译引擎
	if (isOpenCustomMode) {
		// 示例：自定义翻译词条
		if (text === "葡萄城AI搜索") {
			result = {
				resultText: "自定义修正词条：Grape City AI Search For YonYou Search",
				candidateText: "",
				sourceLanguage: "zh-CN",
				percentage: 1,
				isError: false,
				errorMessage: "",
			};
		} else {
			// 发送翻译消息到后台脚本
			result = await browser.runtime.sendMessage({
				message: "translate",
				text: text,
				sourceLang: "auto",
				targetLang: targetLang,
			});
		}
	} else {
		// 发送翻译消息到后台脚本
		result = await browser.runtime.sendMessage({
			message: "translate",
			text: text,
			sourceLang: "auto",
			targetLang: targetLang,
		});
	}

	console.log("translateText() result", JSON.stringify(result));
	return result;
};

/**
 * 检查选中文本的语言是否与目标语言匹配
 * @param {string} selectedText - 选中的文本
 * @returns {Promise<boolean>} 是否匹配目标语言的Promise对象
 */
const matchesTargetLang = async (selectedText) => {
	const targetLang = getSettings("targetLang");
	// 使用detectLanguage进行判断
	const langInfo = await browser.i18n.detectLanguage(selectedText);
	const matchsLangsByDetect =
		langInfo.isReliable && langInfo.languages[0].language === targetLang;
	if (matchsLangsByDetect) return true;

	// 翻译前100个字符进行判断
	const partSelectedText = selectedText.substring(0, 100);
	const result = await translateText(partSelectedText);
	if (result.isError) return false;

	const isNotText = result.percentage === 0;
	if (isNotText) return true;

	// 比较语言代码（考虑en和en-US等变体）
	const matchsLangs =
		targetLang.split("-")[0] === result.sourceLanguage.split("-")[0]; // split("-")[0] : deepLでenとen-USを区別しないために必要
	return matchsLangs;
};

/**
 * 翻译容器组件
 * 管理翻译按钮和翻译面板的显示与交互
 */
export default class TranslateContainer extends Component {
	constructor(props) {
		super(props);
		this.state = {
			shouldShowButton: false, // 是否显示翻译按钮
			buttonPosition: {x: 0, y: 0}, // 按钮位置
			shouldShowPanel: false, // 是否显示翻译面板
			panelPosition: {x: 0, y: 0}, // 面板位置
			currentLang: getSettings("targetLang"), // 当前语言
			resultText: "", // 翻译结果文本
			candidateText: "", // 候选翻译文本
			isError: false, // 是否发生错误
			errorMessage: "", // 错误信息
		};

		// 存储传入的选中文本和位置信息
		this.selectedText = props.selectedText;
		this.selectedPosition = props.selectedPosition;
	}

	/**
	 * 组件挂载完成后执行
	 * 根据属性决定是显示翻译面板还是处理文本选择
	 */
	componentDidMount = () => {
		if (this.props.shouldTranslate) this.showPanel();
		else this.handleTextSelect(this.props.clickedPosition);
	};

	/**
	 * 处理文本选择事件
	 * 根据设置决定是否显示按钮或面板
	 * @param {Object} clickedPosition - 点击位置信息
	 */
	handleTextSelect = async (clickedPosition) => {
		// 获取文本选择行为设置
		const onSelectBehavior = getSettings("whenSelectText");
		// 如果设置为不显示按钮，则移除容器
		if (onSelectBehavior === "dontShowButton")
			return this.props.removeContainer();

		// 如果启用了语言检查，则检查选中文本语言是否与目标语言匹配
		if (getSettings("ifCheckLang")) {
			const matchesLang = await matchesTargetLang(this.selectedText);
			// 如果语言匹配，则移除容器
			if (matchesLang) return this.props.removeContainer();
		}

		// 根据设置决定显示按钮还是面板
		if (onSelectBehavior === "showButton") this.showButton(clickedPosition);
		else if (onSelectBehavior === "showPanel") this.showPanel(clickedPosition);
	};

	/**
	 * 显示翻译按钮
	 * @param {Object} clickedPosition - 点击位置信息
	 */
	showButton = (clickedPosition) => {
		this.setState({shouldShowButton: true, buttonPosition: clickedPosition});
	};

	/**
	 * 隐藏翻译按钮
	 */
	hideButton = () => {
		this.setState({shouldShowButton: false});
	};

	/**
	 * 处理按钮点击事件
	 * @param {Object} e - 点击事件对象
	 */
	handleButtonClick = (e) => {
		// 获取点击位置
		const clickedPosition = {x: e.clientX, y: e.clientY};
		// 显示翻译面板
		this.showPanel(clickedPosition);
		// 隐藏按钮
		this.hideButton();
	};

	/**
	 * 显示翻译面板
	 * @param {Object} clickedPosition - 点击位置信息（可选）
	 */
	showPanel = async (clickedPosition = null) => {
		// 获取面板参考点设置
		const panelReferencePoint = getSettings("panelReferencePoint");
		// 判断是否使用点击位置作为参考点
		const useClickedPosition =
			panelReferencePoint === "clickedPoint" && clickedPosition !== null;
		// 确定面板位置
		const panelPosition = useClickedPosition
			? clickedPosition
			: this.selectedPosition;

		// 翻译选中文本
		let result = await translateText(this.selectedText);
		// 获取目标语言和第二目标语言设置
		const targetLang = getSettings("targetLang");
		const secondLang = getSettings("secondTargetLang");

		// 判断是否需要切换到第二目标语言
		const shouldSwitchSecondLang =
			getSettings("ifChangeSecondLangOnPage") &&
			result.sourceLanguage.split("-")[0] === targetLang.split("-")[0] &&
			result.percentage > 0 &&
			targetLang !== secondLang;

		// 如果需要切换语言，则使用第二目标语言重新翻译
		if (shouldSwitchSecondLang)
			result = await translateText(this.selectedText, secondLang);

		// 更新状态以显示翻译面板
		this.setState({
			shouldShowPanel: true,
			panelPosition: panelPosition,
			resultText: result.resultText,
			candidateText: getSettings("ifShowCandidate") ? result.candidateText : "",
			isError: result.isError,
			errorMessage: result.errorMessage,
			currentLang: shouldSwitchSecondLang ? secondLang : targetLang,
		});
	};

	/**
	 * 隐藏翻译面板
	 */
	hidePanel = () => {
		this.setState({shouldShowPanel: false});
	};

	/**
	 * 渲染组件
	 */
	render = () => {
		return (
			<div>
				<TranslateButton
					shouldShow={this.state.shouldShowButton}
					position={this.state.buttonPosition}
					handleButtonClick={this.handleButtonClick}
				/>
				<TranslatePanel
					shouldShow={this.state.shouldShowPanel}
					position={this.state.panelPosition}
					selectedText={this.selectedText}
					currentLang={this.state.currentLang}
					resultText={this.state.resultText}
					candidateText={this.state.candidateText}
					isError={this.state.isError}
					errorMessage={this.state.errorMessage}
					hidePanel={this.hidePanel}
				/>
			</div>
		);
	};
}
