import React, {Component} from "react";
import browser from "webextension-polyfill";
import openUrl from "src/common/openUrl";
import "../styles/Footer.scss";
import {getSettings} from "../../settings/settings";

export default class Footer extends Component {
	constructor(props) {
		super(props);
	}

	handleLinkClick = async () => {
		const {tabUrl, targetLang} = this.props;

		// 向内容脚本发送消息，请求翻译整个页面
		const tabs = await browser.tabs.query({active: true, currentWindow: true});
		const activeTab = tabs[0];

		try {
			// 尝试向内容脚本发送翻译页面的消息
			await browser.tabs.sendMessage(activeTab.id, {
				message: "translatePageDemo",
			});
		} catch (error) {
			console.error("Error sending message to content script:", error);
		}
	};

	handleChange = (e) => {
		const lang = e.target.value;
		this.props.handleLangChange(lang);
	};

	render() {
		const {tabUrl, targetLang, langHistory, langList} = this.props;

		return (
			<div id='footer'>
				<div className='translateLink'>
					{tabUrl && (
						<a onClick={this.handleLinkClick}>
							{/* {browser.i18n.getMessage("showLink")} */}
							翻译当前页面
						</a>
					)}
				</div>
				<div className='selectWrap'>
					<select
						id='langList'
						value={targetLang}
						onChange={this.handleChange}
						title={browser.i18n.getMessage("targetLangLabel")}>
						<optgroup label={browser.i18n.getMessage("recentLangLabel")}>
							{langList
								.filter((option) => langHistory.includes(option.value))
								.map((option) => (
									<option value={option.value} key={option.value}>
										{option.name}
									</option>
								))}
						</optgroup>
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
