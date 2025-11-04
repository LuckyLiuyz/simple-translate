import React, {Component} from "react";
import browser from "webextension-polyfill";
import {CopyToClipboard} from "react-copy-to-clipboard";
import CopyIcon from "../icons/copy.svg";
import "../styles/CopyButton.scss";

/**
 * 复制按钮组件
 * 提供复制文本到剪贴板的功能，并显示复制状态
 */
export default class CopyButton extends Component {
	constructor(props) {
		super(props);
		// 初始化状态，isCopied表示是否已复制
		this.state = {isCopied: false};
	}

	/**
	 * 处理复制操作
	 * @param {string} copiedText - 需要复制的文本
	 */
	handleCopy = (copiedText) => {
		// 使用navigator.clipboard API将文本写入剪贴板
		navigator.clipboard.writeText(copiedText);
		// 更新状态为已复制
		this.setState({isCopied: true});
	};

	/**
	 * 组件接收到新属性时的处理函数
	 * 当文本内容发生变化时，重置复制状态
	 * @param {Object} nextProps - 新的属性
	 */
	componentWillReceiveProps(nextProps) {
		if (this.props.text !== nextProps.text) this.setState({isCopied: false});
	}

	/**
	 * 渲染复制按钮组件
	 * @returns {JSX.Element|null} 复制按钮或null（当没有文本时）
	 */
	render() {
		const {text} = this.props;
		// 如果没有文本内容，则不渲染组件
		if (!text) return null;

		return (
			<div className='copy'>
				{/* 显示复制成功提示 */}
				{this.state.isCopied && (
					<span className='copiedText'>
						{browser.i18n.getMessage("copiedLabel")}
					</span>
				)}
				{/* 复制到剪贴板组件 */}
				<CopyToClipboard text={text} onCopy={this.handleCopy}>
					<button
						className='copyButton'
						title={browser.i18n.getMessage("copyLabel")}>
						<CopyIcon />
					</button>
				</CopyToClipboard>
			</div>
		);
	}
}
