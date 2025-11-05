import "../styles/ManualTranslatePortal.scss";
import ReactDOM from "react-dom";
import React, {useEffect, useRef} from "react";
import {getSettings} from "src/settings/settings";
import generateLangOptions from "src/common/generateLangOptions";

/**
 * 手动翻译Portal组件
 * 在当前页面上显示一个浮层，用于手动输入翻译
 * @param {Object} props - 组件属性
 * @param {string} props.text - 需要翻译的原始文本
 * @param {Function} props.onClose - 关闭浮层的回调函数
 */
const ManualTranslatePortal = ({text, onClose}) => {
	const portalRef = useRef(null);
	const translatedTextRef = useRef(null);
	// 获取目标语言设置
	const targetLang = getSettings("targetLang");
	const langList = generateLangOptions(getSettings("translationApi"));
	const targetLangName =
		langList.find((lang) => lang.value === targetLang)?.name || targetLang;

	useEffect(() => {
		// 处理点击外部区域关闭浮层
		const handleClickOutside = (event) => {
			if (portalRef.current && !portalRef.current.contains(event.target)) {
				onClose();
			}
		};

		// 处理ESC键关闭浮层
		const handleEscape = (event) => {
			if (event.keyCode === 27) {
				onClose();
			}
		};

		// 添加事件监听器
		document.addEventListener("mousedown", handleClickOutside);
		document.addEventListener("keydown", handleEscape);

		// 翻译文本框自动获得焦点
		if (translatedTextRef.current) {
			translatedTextRef.current.focus();
		}

		// 清理事件监听器
		return () => {
			document.removeEventListener("mousedown", handleClickOutside);
			document.removeEventListener("keydown", handleEscape);
		};
	}, [onClose]);

	/**
	 * 处理保存按钮点击事件
	 */
	const handleSave = () => {
		const translatedText = translatedTextRef.current?.value.trim();
		if (translatedText) {
			// 在实际应用中，这里可以保存翻译结果到存储或其他操作
			alert(
				`Translation saved:\n\nOriginal: ${text}\n\nTranslation: ${translatedText}`
			);
			onClose();
		} else {
			alert("Please enter a translation.");
		}
	};

	/**
	 * 处理取消按钮点击事件
	 */
	const handleCancel = () => {
		onClose();
	};

	// 创建portal容器
	const container = document.createElement("div");
	container.id = "simple-translate-manual-portal";
	document.body.appendChild(container);

	const portalContent = (
		<div className='simple-translate-portal-overlay'>
			<div className='simple-translate-portal-container' ref={portalRef}>
				<div className='simple-translate-portal-header'>
					<h3>手动翻译</h3>
				</div>
				<div className='simple-translate-portal-content'>
					<label htmlFor='selectedText'>
						目标语言：<span style={{color: "red"}}>{targetLangName}</span>
					</label>
					<div className='simple-translate-portal-text-section'>
						<label htmlFor='selectedText'>选中的文本内容：</label>
						<textarea id='selectedText' readOnly value={text} />
					</div>
					<div className='simple-translate-portal-text-section'>
						<label htmlFor='translatedText'>目标翻译内容：</label>
						<textarea
							id='translatedText'
							ref={translatedTextRef}
							placeholder='Enter your translation here...'
						/>
					</div>
					<div className='simple-translate-portal-actions'>
						<button
							className='simple-translate-portal-cancel-btn'
							onClick={handleCancel}>
							Cancel
						</button>
						<button
							className='simple-translate-portal-save-btn'
							onClick={handleSave}>
							Save
						</button>
					</div>
				</div>
			</div>
		</div>
	);

	return ReactDOM.createPortal(portalContent, container);
};

export default ManualTranslatePortal;
