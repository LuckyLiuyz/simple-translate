/* Copyright (c) 2018 Kamil Mikosz
 * Copyright (c) 2019 Sienori
 * Released under the MIT license.
 * see https://opensource.org/licenses/MIT */

const HtmlWebpackPlugin = require("html-webpack-plugin");
const CopyWebpackPlugin = require("copy-webpack-plugin");
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const ZipPlugin = require("zip-webpack-plugin");
const path = require("path");

/**
 * 获取HTML插件配置
 * 用于生成popup和options页面的HTML文件
 * @param {string} browserDir - 浏览器目录名称 (如 "chrome" 或 "firefox")
 * @param {string} outputDir - 输出目录，默认为 "dev"
 * @param {string} sourceDir - 源代码目录，默认为 "src"
 * @returns {Array} HtmlWebpackPlugin实例数组
 */
const getHTMLPlugins = (browserDir, outputDir = "dev", sourceDir = "src") => [
	new HtmlWebpackPlugin({
		title: "Popup", // 页面标题
		// 输出文件路径
		filename: path.resolve(
			__dirname,
			`${outputDir}/${browserDir}/popup/index.html`
		),
		// 模板文件路径
		template: `${sourceDir}/popup/index.html`,
		// 关联的chunks
		chunks: ["popup"],
	}),
	new HtmlWebpackPlugin({
		title: "Options", // 页面标题
		// 输出文件路径
		filename: path.resolve(
			__dirname,
			`${outputDir}/${browserDir}/options/index.html`
		),
		// 模板文件路径
		template: `${sourceDir}/options/index.html`,
		// 关联的chunks
		chunks: ["options"],
	}),
];

/**
 * 获取输出配置
 * 定义webpack的输出路径和文件名规则
 * @param {string} browserDir - 浏览器目录名称
 * @param {string} outputDir - 输出目录，默认为 "dev"
 * @returns {Object} 输出配置对象
 */
const getOutput = (browserDir, outputDir = "dev") => {
	return {
		// 输出路径
		path: path.resolve(__dirname, `${outputDir}/${browserDir}`),
		// 输出文件名格式，使用[name]作为占位符
		filename: "[name]/[name].js",
	};
};

/**
 * 获取入口配置
 * 定义webpack的入口文件
 * @param {string} sourceDir - 源代码目录，默认为 "src"
 * @returns {Object} 入口配置对象
 */
const getEntry = (sourceDir = "src") => {
	return {
		// popup页面入口
		popup: path.resolve(__dirname, `${sourceDir}/popup/index.js`),
		// options页面入口
		options: path.resolve(__dirname, `${sourceDir}/options/index.js`),
		// content script入口
		content: path.resolve(__dirname, `${sourceDir}/content/index.js`),
		// background script入口
		background: path.resolve(
			__dirname,
			`${sourceDir}/background/background.js`
		),
	};
};

/**
 * 获取文件复制插件配置 (Chrome版本)
 * 用于复制图标、语言文件和manifest文件
 * @param {string} browserDir - 浏览器目录名称
 * @param {string} outputDir - 输出目录，默认为 "dev"
 * @param {string} sourceDir - 源代码目录，默认为 "src"
 * @returns {Array} CopyWebpackPlugin实例数组
 */
const getCopyPlugins = (browserDir, outputDir = "dev", sourceDir = "src") => [
	new CopyWebpackPlugin({
		patterns: [
			{
				// 复制图标文件
				from: `${sourceDir}/icons`,
				to: path.resolve(__dirname, `${outputDir}/${browserDir}/icons`),
			},
			{
				// 复制语言文件
				from: `${sourceDir}/_locales`,
				to: path.resolve(__dirname, `${outputDir}/${browserDir}/_locales`),
			},
			{
				// 复制Chrome manifest文件
				from: `${sourceDir}/manifest-chrome.json`,
				to: path.resolve(__dirname, `${outputDir}/${browserDir}/manifest.json`),
			},
		],
	}),
];

/**
 * 获取文件复制插件配置 (Firefox版本)
 * 用于复制图标、语言文件和Firefox专用manifest文件
 * @param {string} browserDir - 浏览器目录名称
 * @param {string} outputDir - 输出目录，默认为 "dev"
 * @param {string} sourceDir - 源代码目录，默认为 "src"
 * @returns {Array} CopyWebpackPlugin实例数组
 */
const getFirefoxCopyPlugins = (
	browserDir,
	outputDir = "dev",
	sourceDir = "src"
) => [
	new CopyWebpackPlugin({
		patterns: [
			{
				// 复制图标文件
				from: `${sourceDir}/icons`,
				to: path.resolve(__dirname, `${outputDir}/${browserDir}/icons`),
			},
			{
				// 复制语言文件
				from: `${sourceDir}/_locales`,
				to: path.resolve(__dirname, `${outputDir}/${browserDir}/_locales`),
			},
			{
				// 复制Firefox manifest文件
				from: `${sourceDir}/manifest-firefox.json`,
				to: path.resolve(__dirname, `${outputDir}/${browserDir}/manifest.json`),
			},
		],
	}),
];

/**
 * 获取CSS提取插件配置
 * 用于将CSS提取到独立的文件中
 * @returns {Array} MiniCssExtractPlugin实例数组
 */
const getMiniCssExtractPlugin = () => [
	new MiniCssExtractPlugin({
		// CSS文件名格式
		filename: "[name]/[name].css",
	}),
];

/**
 * 获取ZIP打包插件配置
 * 用于将构建结果打包成ZIP文件
 * @param {string} browserDir - 浏览器目录名称
 * @param {string} outputDir - 输出目录，默认为 "dist"
 * @param {string} exclude - 排除的文件模式
 * @returns {Object} ZipPlugin实例
 */
const getZipPlugin = (browserDir, outputDir = "dist", exclude = "") =>
	new ZipPlugin({
		// ZIP文件输出路径
		path: path.resolve(__dirname, `${outputDir}`),
		// ZIP文件名
		filename: browserDir,
		// 文件扩展名
		extension: "zip",
		// 文件选项
		fileOptions: {
			// 修改时间
			mtime: new Date(),
			// 文件权限
			mode: 0o100664,
			// 是否压缩
			compress: true,
			// 是否强制使用ZIP64格式
			forceZip64Format: false,
		},
		// ZIP选项
		zipOptions: {
			// 是否强制使用ZIP64格式
			forceZip64Format: false,
		},
		// 排除文件模式
		exclude: exclude,
	});

// 导出所有工具函数
module.exports = {
	getHTMLPlugins,
	getOutput,
	getCopyPlugins,
	getFirefoxCopyPlugins,
	getMiniCssExtractPlugin,
	getZipPlugin,
	getEntry,
};
