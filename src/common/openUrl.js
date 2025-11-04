import browser from "webextension-polyfill";

/**
 * 打开URL链接
 * 可选择在当前标签页或新标签页中打开链接
 * @param {string} url - 需要打开的URL链接
 * @param {boolean} isCurrentTab - 是否在当前标签页打开，默认为false（在新标签页打开）
 */
export default async (url, isCurrentTab = false) => {
	// 获取当前活动的标签页
	const activeTab = (
		await browser.tabs.query({currentWindow: true, active: true})
	)[0];

	// 根据参数决定在当前标签页还是新标签页打开链接
	if (isCurrentTab)
		// 在当前标签页打开链接
		browser.tabs.update({url: url});
	// 在新标签页打开链接，位置在当前标签页的下一个
	else browser.tabs.create({url: url, index: activeTab.index + 1});
};
