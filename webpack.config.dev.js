/* Copyright (c) 2018 Kamil Mikosz
 * Copyright (c) 2019 Sienori
 * Released under the MIT license.
 * see https://opensource.org/licenses/MIT */

const {
	getHTMLPlugins,
	getOutput,
	getCopyPlugins,
	getFirefoxCopyPlugins,
	getEntry,
	getMiniCssExtractPlugin,
} = require("./webpack.utils");
const path = require("path");
const config = require("./config.json");
const MiniCssExtractPlugin = require("mini-css-extract-plugin");

/**
 * 通用Webpack配置
 * 包含开发环境下的基本配置项
 */
const generalConfig = {
	// 设置为开发模式，不进行代码压缩
	mode: "development",
	// 生成source map便于调试
	devtool: "source-map",
	// 配置模块解析规则
	resolve: {
		// 设置路径别名，方便引用
		alias: {
			// src目录别名
			src: path.resolve(__dirname, "src/"),
			// webextension-polyfill别名，指向压缩版本
			"webextension-polyfill":
				"webextension-polyfill/dist/browser-polyfill.min.js",
		},
	},
	// 模块规则配置
	module: {
		rules: [
			{
				// 使用babel-loader处理JavaScript和JSX文件
				loader: "babel-loader",
				// 排除node_modules目录
				exclude: /node_modules/,
				// 匹配.js和.jsx文件
				test: /\.(js|jsx)$/,
				// 解析扩展名配置
				resolve: {
					extensions: [".js", ".jsx"],
				},
			},
			{
				// 处理SCSS和CSS文件
				test: /\.(scss|css)$/,
				// 使用MiniCssExtractPlugin提取CSS到独立文件
				use: [
					MiniCssExtractPlugin.loader,
					{
						loader: "css-loader",
						options: {
							// 禁用ES模块语法
							esModule: false,
						},
					},
					{
						// 使用sass-loader处理SCSS文件
						loader: "sass-loader",
					},
				],
			},
			{
				// 处理SVG文件
				test: /\.svg$/,
				// 使用@svgr/webpack将SVG作为React组件处理
				use: ["@svgr/webpack"],
			},
		],
	},
};

// 引入BundleAnalyzerPlugin用于分析打包结果
const BundleAnalyzerPlugin =
	require("webpack-bundle-analyzer").BundleAnalyzerPlugin;

/**
 * 导出Webpack配置数组
 * 分别为Chrome和Firefox浏览器配置不同的构建目标
 */
module.exports = [
	{
		// 扩展通用配置
		...generalConfig,
		// 获取Chrome扩展的入口文件配置
		entry: getEntry(config.chromePath),
		// 获取Chrome扩展的输出配置
		output: getOutput("chrome", config.devDirectory),
		// 配置插件
		plugins: [
			// CSS提取插件
			...getMiniCssExtractPlugin(),
			// HTML插件
			...getHTMLPlugins("chrome", config.devDirectory, config.chromePath),
			// 文件复制插件
			...getCopyPlugins("chrome", config.devDirectory, config.chromePath),
		],
	},
	{
		// 扩展通用配置
		...generalConfig,
		// 获取Firefox扩展的入口文件配置
		entry: getEntry(config.firefoxPath),
		// 获取Firefox扩展的输出配置
		output: getOutput("firefox", config.devDirectory),
		// 配置插件
		plugins: [
			// CSS提取插件
			...getMiniCssExtractPlugin(),
			// Firefox专用文件复制插件
			...getFirefoxCopyPlugins(
				"firefox",
				config.devDirectory,
				config.firefoxPath
			),
			// HTML插件
			...getHTMLPlugins("firefox", config.devDirectory, config.firefoxPath),
			// 打包分析插件
			new BundleAnalyzerPlugin({
				// 不自动打开分析器
				openAnalyzer: false,
				// 分析器主机地址
				analyzerHost: "127.0.0.1",
				// 分析器端口
				analyzerPort: 8888,
			}),
		],
	},
];
