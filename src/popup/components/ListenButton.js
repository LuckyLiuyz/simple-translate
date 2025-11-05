import "../styles/ListenButton.scss";
import React from "react";
import log from "loglevel";
import browser from "webextension-polyfill";
import SpeakerIcon from "../icons/speaker.svg";

const logDir = "popup/AudioButton";

/**
 * 播放音频函数
 * 通过Google翻译API播放文本语音
 * @param {string} text - 需要播放的文本
 * @param {string} lang - 文本语言代码
 */
const playAudio = async (text, lang) => {
	// 构造Google翻译TTS服务的URL
	const url = `https://translate.google.com/translate_tts?client=tw-ob&q=${encodeURIComponent(
		text
	)}&tl=${lang}`;
	const audio = new Audio(url);
	audio.crossOrigin = "anonymous";
	audio.load();

	// 请求访问Google翻译域名的权限
	await browser.permissions.request({
		origins: ["https://translate.google.com/*"],
	});

	// 播放音频，出错时记录日志
	await audio.play().catch((e) => log.error(logDir, "playAudio()", e, url));
};

/**
 * 语音播放按钮组件
 * 提供文本转语音播放功能
 * @param {Object} props - 组件属性
 * @param {string} props.text - 需要播放的文本
 * @param {string} props.lang - 文本语言代码
 * @returns {JSX.Element|null} 语音播放按钮或null（当不满足播放条件时）
 */
export default (props) => {
	const {text, lang} = props;
	// 判断是否可以播放语音（文本存在且长度小于200字符）
	const canListen = text && text.length < 200;
	if (!canListen) return null;

	return (
		<button
			className='listenButton'
			onClick={() => playAudio(text, lang)}
			title={browser.i18n.getMessage("listenLabel")}>
			<SpeakerIcon />
		</button>
	);
};
