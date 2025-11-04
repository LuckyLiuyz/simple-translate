import browser from "webextension-polyfill";
import React, {Component} from "react";
import ReactDOM from "react-dom";
import {getSettings} from "src/settings/settings";
import "../styles/TranslatePanel.scss";
import {
	getBackgroundColor,
	getCandidateFontColor,
	getResultFontColor,
} from "../../settings/defaultColors";

/**
 * 分割文本中的换行符
 * 将文本中的换行符转换为<br>标签
 * @param {string} text - 需要处理的文本
 * @returns {Array} 包含文本和<br>标签的数组
 */
const splitLine = (text) => {
	const regex = /(\n)/g;
	return text
		.split(regex)
		.map((line, i) => (line.match(regex) ? <br key={i} /> : line));
};

/**
 * 翻译面板组件
 * 显示翻译结果的面板，支持拖拽移动和自定义样式
 */
export default class TranslatePanel extends Component {
	constructor(props) {
		super(props);
		this.state = {
			panelPosition: {x: 0, y: 0}, // 面板位置
			panelWidth: 0, // 面板宽度
			panelHeight: 0, // 面板高度
			shouldResize: true, // 是否需要调整大小
			isOverflow: false, // 是否内容溢出
		};

		// 拖拽相关变量
		this.dragOffsets = {x: 0, y: 0}; // 拖拽偏移量
		this.isDragging = false; // 是否正在拖拽
	}

	/**
	 * 组件挂载完成后添加事件监听器
	 */
	componentDidMount = () => {
		document.addEventListener("dragstart", this.handleDragStart);
		document.addEventListener("dragover", this.handleDragOver);
		document.addEventListener("drop", this.handleDrop);
	};

	/**
	 * 组件卸载前移除事件监听器
	 */
	componentWillUnmount = () => {
		document.removeEventListener("dragstart", this.handleDragStart);
		document.removeEventListener("dragover", this.handleDragOver);
		document.removeEventListener("drop", this.handleDrop);
	};

	/**
	 * 处理拖拽开始事件
	 * @param {Object} e - 拖拽事件对象
	 */
	handleDragStart = (e) => {
		// 只有在移动区域才能拖拽
		if (e.target.className !== "simple-translate-move") return;
		this.isDragging = true;

		// 计算拖拽偏移量
		const rect = document
			.querySelector(".simple-translate-panel")
			.getBoundingClientRect();
		this.dragOffsets = {
			x: e.clientX - rect.left,
			y: e.clientY - rect.top,
		};
		e.dataTransfer.setData("text/plain", "");
	};

	/**
	 * 处理拖拽过程中事件
	 * @param {Object} e - 拖拽事件对象
	 */
	handleDragOver = (e) => {
		// 如果没有在拖拽则返回
		if (!this.isDragging) return;
		e.preventDefault();

		// 更新面板位置
		const panel = document.querySelector(".simple-translate-panel");
		panel.style.top = `${e.clientY - this.dragOffsets.y}px`;
		panel.style.left = `${e.clientX - this.dragOffsets.x}px`;
	};

	/**
	 * 处理拖拽结束事件
	 * @param {Object} e - 拖拽事件对象
	 */
	handleDrop = (e) => {
		// 如果没有在拖拽则返回
		if (!this.isDragging) return;
		e.preventDefault();
		this.isDragging = false;

		// 更新面板位置
		const panel = document.querySelector(".simple-translate-panel");
		panel.style.top = `${e.clientY - this.dragOffsets.y}px`;
		panel.style.left = `${e.clientX - this.dragOffsets.x}px`;
	};

	/**
	 * 计算面板位置
	 * 根据参考位置和设置计算面板应该显示的位置
	 * @returns {Object} 包含x和y坐标的对象
	 */
	calcPosition = () => {
		// 获取最大宽度和高度设置
		const maxWidth = parseInt(getSettings("width"));
		const maxHeight = parseInt(getSettings("height"));
		// 获取包装器元素
		const wrapper = ReactDOM.findDOMNode(this.refs.wrapper);
		// 计算面板宽高
		const panelWidth = Math.min(wrapper.clientWidth, maxWidth);
		const panelHeight = Math.min(wrapper.clientHeight, maxHeight);
		// 获取窗口宽高
		const windowWidth = document.documentElement.clientWidth;
		const windowHeight = document.documentElement.clientHeight;
		// 获取参考位置
		const referencePosition = this.props.position;
		// 获取面板偏移量设置
		const offset = parseInt(getSettings("panelOffset"));

		let position = {x: 0, y: 0};
		// 根据面板方向设置计算位置
		const panelDirection = getSettings("panelDirection");
		switch (panelDirection) {
			case "top":
				position.x = referencePosition.x - panelWidth / 2;
				position.y = referencePosition.y - panelHeight - offset;
				break;
			case "bottom":
				position.x = referencePosition.x - panelWidth / 2;
				position.y = referencePosition.y + offset;
				break;
			case "right":
				position.x = referencePosition.x + offset;
				position.y = referencePosition.y - panelHeight / 2;
				break;
			case "left":
				position.x = referencePosition.x - panelWidth - offset;
				position.y = referencePosition.y - panelHeight / 2;
				break;
			case "topRight":
				position.x = referencePosition.x + offset;
				position.y = referencePosition.y - panelHeight - offset;
				break;
			case "topLeft":
				position.x = referencePosition.x - panelWidth - offset;
				position.y = referencePosition.y - panelHeight - offset;
				break;
			case "bottomRight":
				position.x = referencePosition.x + offset;
				position.y = referencePosition.y + offset;
				break;
			case "bottomLeft":
				position.x = referencePosition.x - panelWidth - offset;
				position.y = referencePosition.y + offset;
				break;
		}

		// 确保面板不会超出窗口边界
		if (position.x + panelWidth > windowWidth - offset) {
			position.x = windowWidth - panelWidth - offset;
		}
		if (position.y + panelHeight > windowHeight - offset) {
			position.y = windowHeight - panelHeight - offset;
		}
		if (position.x < 0 + offset) {
			position.x = offset;
		}
		if (position.y < 0 + offset) {
			position.y = offset;
		}
		return position;
	};

	/**
	 * 计算面板大小
	 * @returns {Object} 包含面板宽度和高度的对象
	 */
	calcSize = () => {
		// 获取最大宽度设置
		const maxWidth = parseInt(getSettings("width"));
		// 获取包装器元素
		const wrapper = ReactDOM.findDOMNode(this.refs.wrapper);
		// 计算包装器宽高
		const wrapperWidth =
			wrapper.clientWidth < maxWidth ? wrapper.clientWidth + 1 : maxWidth;
		const wrapperHeight = wrapper.clientHeight;
		return {panelWidth: wrapperWidth, panelHeight: wrapperHeight};
	};

	/**
	 * 组件属性更新时调用
	 * @param {Object} nextProps - 下一个属性
	 */
	componentWillReceiveProps = (nextProps) => {
		// 判断内容是否发生变化
		const isChangedContents =
			this.props.resultText !== nextProps.resultText ||
			this.props.candidateText !== nextProps.candidateText ||
			this.props.position !== nextProps.position;

		// 如果内容发生变化且面板应该显示，则设置需要调整大小
		if (isChangedContents && nextProps.shouldShow)
			this.setState({shouldResize: true});
	};

	/**
	 * 组件更新完成后调用
	 */
	componentDidUpdate = () => {
		// 如果不需要调整大小或面板不应该显示则返回
		if (!this.state.shouldResize || !this.props.shouldShow) return;

		// 计算面板位置和大小
		const panelPosition = this.calcPosition();
		const {panelWidth, panelHeight} = this.calcSize();
		// 判断是否内容溢出
		const isOverflow = panelHeight == parseInt(getSettings("height"));

		// 更新状态
		this.setState({
			shouldResize: false,
			panelPosition: panelPosition,
			panelWidth: panelWidth,
			panelHeight: panelHeight,
			isOverflow: isOverflow,
		});
	};

	/**
	 * 渲染组件
	 */
	render = () => {
		const {
			shouldShow,
			selectedText,
			currentLang,
			resultText,
			candidateText,
			isError,
			errorMessage,
		} = this.props;

		// 根据是否需要调整大小决定使用哪种宽高
		const {width, height} = this.state.shouldResize
			? {
					width: parseInt(getSettings("width")),
					height: parseInt(getSettings("height")),
			  }
			: {width: this.state.panelWidth, height: this.state.panelHeight};

		// 设置面板样式
		const panelStyles = {
			width: width,
			height: height,
			top: this.state.panelPosition.y,
			left: this.state.panelPosition.x,
			fontSize: parseInt(getSettings("fontSize")),
		};

		// 设置背景颜色
		const backgroundColor = getBackgroundColor();
		if (backgroundColor) {
			panelStyles.backgroundColor = backgroundColor.backgroundColor;
		}

		// 设置包装器样式
		const wrapperStyles = {
			overflow: this.state.isOverflow ? "auto" : "hidden",
		};

		// 获取翻译API设置
		const translationApi = getSettings("translationApi");

		return (
			<div
				className={`simple-translate-panel ${shouldShow ? "isShow" : ""}`}
				ref='panel'
				style={panelStyles}>
				<div
					className='simple-translate-result-wrapper'
					ref='wrapper'
					style={wrapperStyles}>
					<div
						className='simple-translate-move'
						draggable='true'
						ref='move'></div>
					<div className='simple-translate-result-contents'>
						<p
							className='simple-translate-result'
							style={getResultFontColor()}
							dir='auto'>
							{splitLine(resultText)}
						</p>
						<p
							className='simple-translate-candidate'
							style={getCandidateFontColor()}
							dir='auto'>
							{splitLine(candidateText)}
						</p>
						{isError && (
							<p className='simple-translate-error'>
								{errorMessage}
								<br />
								<a
									href={
										translationApi === "google"
											? `https://translate.google.com/?sl=auto&tl=${currentLang}&text=${encodeURIComponent(
													selectedText
											  )}`
											: `https://www.deepl.com/translator#auto/${currentLang}/${encodeURIComponent(
													selectedText
											  )}`
									}
									target='_blank'>
									{translationApi === "google"
										? browser.i18n.getMessage("openInGoogleLabel")
										: browser.i18n.getMessage("openInDeeplLabel")}
								</a>
							</p>
						)}
					</div>
				</div>
			</div>
		);
	};
}
