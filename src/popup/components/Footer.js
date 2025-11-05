import "../styles/Footer.scss";
import React, {Component} from "react";
import browser from "webextension-polyfill";

/**
 * 弹出页面底部组件
 * 包含页面翻译链接和语言选择下拉框
 */
export default class Footer extends Component {
	constructor(props) {
		super(props);
	}

	/**
	 * 处理页面翻译链接点击事件
	 * 向内容脚本发送消息以翻译整个页面
	 */
	handleLinkClick = async () => {
		const {tabUrl, targetLang} = this.props;

		// 查询当前活动标签页
		const tabs = await browser.tabs.query({active: true, currentWindow: true});
		const activeTab = tabs[0];

		try {
			// 向内容脚本发送翻译整个页面的消息
			await browser.tabs.sendMessage(activeTab.id, {
				message: "translateAllPage",
			});
		} catch (error) {
			console.error("Error sending message to content script:", error);
		}
	};

	/**
	 * 处理语言选择变化事件
	 * @param {Event} e - 选择框变化事件
	 */
	handleChange = (e) => {
		const lang = e.target.value;
		this.props.handleLangChange(lang);
	};

	/**
	 * 渲染底部组件
	 * @returns {JSX.Element} 底部组件元素
	 */
	render() {
		const {tabUrl, targetLang, langHistory, langList} = this.props;

		return (
			<div id='footer'>
				<div className='translateLink'>
					{/* 页面翻译链接 */}
					{tabUrl && (
						<a onClick={this.handleLinkClick}>
							{/* {browser.i18n.getMessage("showLink")} */}
							翻译当前页面
						</a>
					)}
				</div>
				<div className='selectWrap'>
					{/* 语言选择下拉框 */}
					<select
						id='langList'
						value={targetLang}
						onChange={this.handleChange}
						title={browser.i18n.getMessage("targetLangLabel")}>
						{/* 最近使用的语言分组 */}
						<optgroup label={browser.i18n.getMessage("recentLangLabel")}>
							{langList
								.filter((option) => langHistory.includes(option.value))
								.map((option) => (
									<option value={option.value} key={option.value}>
										{option.name}
									</option>
								))}
						</optgroup>
						{/* 所有语言分组 */}
						<optgroup label={browser.i18n.getMessage("allLangLabel")}>
							{langList.map((option) => (
								<option value={option.value} key={option.value}>
									{option.name}
								</option>
							))}
						</optgroup>
					</select>
				</div>
			</div>
		);
	}
}
