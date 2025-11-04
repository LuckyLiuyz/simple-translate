import {getSettings} from "./settings";

// 定义浅色主题下的结果字体颜色
export const RESULT_FONT_COLOR_LIGHT = "#000000";
// 定义深色主题下的结果字体颜色
export const RESULT_FONT_COLOR_DARK = "#e6e6e6";
// 定义浅色主题下的候选词字体颜色
export const CANDIDATE_FONT_COLOR_LIGHT = "#737373";
// 定义深色主题下的候选词字体颜色
export const CANDIDATE_FONT_COLOR_DARK = "#aaaaaa";
// 定义浅色主题下的背景颜色
export const BG_COLOR_LIGHT = "#ffffff";
// 定义深色主题下的背景颜色
export const BG_COLOR_DARK = "#181818";

/**
 * 获取结果字体颜色
 * 根据是否覆盖颜色设置来决定返回的颜色值
 * @returns {Object|undefined} 包含颜色值的对象或undefined
 */
export function getResultFontColor() {
	const isOverrideColors = getSettings("isOverrideColors");

	if (!isOverrideColors) return undefined;

	return {color: getSettings("resultFontColor")};
}

/**
 * 获取候选词字体颜色
 * 根据是否覆盖颜色设置来决定返回的颜色值
 * @returns {Object|undefined} 包含颜色值的对象或undefined
 */
export function getCandidateFontColor() {
	const isOverrideColors = getSettings("isOverrideColors");

	if (!isOverrideColors) return undefined;

	return {color: getSettings("candidateFontColor")};
}

/**
 * 获取背景颜色
 * 根据是否覆盖颜色设置来决定返回的颜色值
 * @returns {Object|undefined} 包含背景颜色值的对象或undefined
 */
export function getBackgroundColor() {
	const isOverrideColors = getSettings("isOverrideColors");

	if (!isOverrideColors) return undefined;

	return {backgroundColor: getSettings("bgColor")};
}
