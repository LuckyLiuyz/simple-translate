import React from "react";
import browser from "webextension-polyfill";
import {getSettings} from "src/settings/settings";
import openUrl from "src/common/openUrl";
import CopyButton from "./CopyButton";
import ListenButton from "./ListenButton";
import "../styles/ResultArea.scss";

/**
 * 分割文本中的换行符
 * @param {string} text - 需要处理的文本
 * @returns {Array<JSX.Element|string>} 处理后的文本数组（包含<br>元素）
 */
const splitLine = (text) => {
	const regex = /(\n)/g;
	return text
		.split(regex)
		.map((line, i) => (line.match(regex) ? <br key={i} /> : line));
};

/**
 * 结果显示区域组件
 * 显示翻译结果、候选翻译和错误信息
 * @param {Object} props - 组件属性
 * @param {string} props.resultText - 翻译结果文本
 * @param {string} props.candidateText - 候选翻译文本
 * @param {boolean} props.isError - 是否发生错误
 * @param {string} props.errorMessage - 错误信息
 * @param {string} props.targetLang - 目标语言
 * @param {string} props.inputText - 输入文本
 * @returns {JSX.Element} 结果区域组件元素
 */
export default (props) => {
	const {resultText, candidateText, isError, errorMessage, targetLang} = props;
	// 获取是否显示候选翻译的设置
	const shouldShowCandidate = getSettings("ifShowCandidate");
	// 获取翻译API设置
	const translationApi = getSettings("translationApi");

	/**
	 * 处理链接点击事件
	 * 在外部浏览器中打开翻译页面
	 */
	const handleLinkClick = () => {
		const {inputText, targetLang} = props;
		const encodedText = encodeURIComponent(inputText);
		// 根据翻译API生成相应的翻译页面URL
		const translateUrl =
			translationApi === "google"
				? `https://translate.google.com/?sl=auto&tl=${targetLang}&text=${encodedText}`
				: `https://www.deepl.com/translator#auto/${targetLang}/${encodedText}`;
		openUrl(translateUrl);
	};

	return (
		<div id='resultArea'>
			{/* 翻译结果显示 */}
			<p className='resultText' dir='auto'>
				{splitLine(resultText)}
			</p>
			{/* 候选翻译显示（根据设置决定是否显示） */}
			{shouldShowCandidate && (
				<p className='candidateText' dir='auto'>
					{splitLine(candidateText)}
				</p>
			)}
			{/* 错误信息显示 */}
			{isError && <p className='error'>{errorMessage}</p>}
			{/* 错误时显示的备用链接 */}
			{isError && (
				<p className='translateLink'>
					<a onClick={handleLinkClick}>
						{translationApi === "google"
							? browser.i18n.getMessage("openInGoogleLabel")
							: browser.i18n.getMessage("openInDeeplLabel")}
					</a>
				</p>
			)}
			{/* 媒体操作按钮（复制和语音播放） */}
			<div className='mediaButtons'>
				<CopyButton text={resultText} />
				<ListenButton text={resultText} lang={targetLang} />
			</div>
		</div>
	);
};
