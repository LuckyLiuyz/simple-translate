import React, {Component} from "react";
import ReactDOM from "react-dom";
import browser from "webextension-polyfill";
import ListenButton from "./ListenButton";
import "../styles/InputArea.scss";

/**
 * 输入区域组件
 * 提供文本输入框和语音播放按钮
 */
export default class InputArea extends Component {
	/**
	 * 调整文本区域大小以适应内容
	 */
	resizeTextArea = () => {
		const textarea = ReactDOM.findDOMNode(this.refs.textarea);
		textarea.style.height = "1px";
		textarea.style.height = `${textarea.scrollHeight + 2}px`;
	};

	/**
	 * 处理输入文本变化事件
	 * @param {Event} e - 输入事件
	 */
	handleInputText = (e) => {
		const inputText = e.target.value;
		this.props.handleInputText(inputText);
	};

	/**
	 * 判断组件是否需要更新
	 * 只有当输入文本或源语言发生变化时才更新组件
	 * @param {Object} nextProps - 下一个属性
	 * @returns {boolean} 是否需要更新组件
	 */
	shouldComponentUpdate(nextProps) {
		const shouldUpdate =
			this.props.inputText !== nextProps.inputText ||
			this.props.sourceLang !== nextProps.sourceLang;
		return shouldUpdate;
	}

	/**
	 * 组件更新后的处理函数
	 * 调整文本区域大小
	 */
	componentDidUpdate = () => {
		this.resizeTextArea();
	};

	/**
	 * 渲染输入区域组件
	 * @returns {JSX.Element} 输入区域组件元素
	 */
	render() {
		const {inputText, sourceLang} = this.props;
		return (
			<div id='inputArea'>
				{/* 文本输入框 */}
				<textarea
					value={inputText}
					ref='textarea'
					placeholder={browser.i18n.getMessage("initialTextArea")}
					onChange={this.handleInputText}
					autoFocus
					spellCheck={false}
					dir='auto'
				/>
				<div className='listen'>
					{/* 语音播放按钮 */}
					{sourceLang && <ListenButton text={inputText} lang={sourceLang} />}
				</div>
			</div>
		);
	}
}
