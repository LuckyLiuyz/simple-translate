/* Copyright (c) 2018 Kamil Mikosz
 * Copyright (c) 2019 Sienori
 * Released under the MIT license.
 * see https://opensource.org/licenses/MIT */

const CopyWebpackPlugin = require("copy-webpack-plugin");
const {
	getHTMLPlugins,
	getOutput,
	getCopyPlugins,
	getZipPlugin,
	getFirefoxCopyPlugins,
	getMiniCssExtractPlugin,
	getEntry,
} = require("./webpack.utils");
const path = require("path");
const config = require("./config.json");
const CleanWebpackPlugin = require("clean-webpack-plugin");
const MiniCssExtractPlugin = require("mini-css-extract-plugin");

// 获取Chrome扩展版本号
const extVersion = require("./src/manifest-chrome.json").version;
// 获取Firefox扩展版本号
const ffExtVersion = require("./src/manifest-firefox.json").version;

/**
 * 通用Webpack配置
 * 包含生产环境下的基本配置项
 */
const generalConfig = {
	// 设置为开发模式
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

/**
 * 导出Webpack配置数组
 * 分别为Chrome、Firefox浏览器和源代码配置不同的构建目标
 */
module.exports = [
	{
		// 扩展通用配置
		...generalConfig,
		// 获取Chrome扩展的输出配置
		output: getOutput("chrome", config.tempDirectory),
		// 获取Chrome扩展的入口文件配置
		entry: getEntry(config.chromePath),
		// 优化配置
		optimization: {
			// 启用代码压缩
			minimize: true,
		},
		// 配置插件
		plugins: [
			// 清理插件，构建前清理dist和temp目录
			new CleanWebpackPlugin(["dist", "temp"]),
			// CSS提取插件
			...getMiniCssExtractPlugin(),
			// HTML插件
			...getHTMLPlugins("chrome", config.tempDirectory, config.chromePath),
			// 文件复制插件
			...getCopyPlugins("chrome", config.tempDirectory, config.chromePath),
			// ZIP打包插件，为Chrome扩展创建zip包
			getZipPlugin(
				`${config.extName}-for-chrome-${extVersion}`,
				config.distDirectory
			),
		],
	},
	{
		// 扩展通用配置
		...generalConfig,
		// 获取Firefox扩展的入口文件配置
		entry: getEntry(config.firefoxPath),
		// 获取Firefox扩展的输出配置
		output: getOutput("firefox", config.tempDirectory),
		// 优化配置
		optimization: {
			// 启用代码压缩
			minimize: true,
		},
		// 配置插件
		plugins: [
			// 清理插件，构建前清理dist和temp目录
			new CleanWebpackPlugin(["dist", "temp"]),
			// CSS提取插件
			...getMiniCssExtractPlugin(),
			// HTML插件
			...getHTMLPlugins("firefox", config.tempDirectory, config.firefoxPath),
			// Firefox专用文件复制插件
			...getFirefoxCopyPlugins(
				"firefox",
				config.tempDirectory,
				config.firefoxPath
			),
			// ZIP打包插件，为Firefox扩展创建zip包
			getZipPlugin(
				`${config.extName}-for-firefox-${ffExtVersion}`,
				config.distDirectory
			),
		],
	},
	{
		// 生产环境配置
		mode: "production",
		// 配置模块解析规则
		resolve: {
			// 设置路径别名
			alias: {
				// src目录别名
				src: path.resolve(__dirname, "src/"),
			},
		},
		// 入口文件配置，指定background.js作为入口
		entry: {other: path.resolve(__dirname, `src/background/background.js`)},
		// 获取输出配置
		output: getOutput("copiedSource", config.tempDirectory),
		// 配置插件
		plugins: [
			// 文件复制插件，用于复制源代码
			new CopyWebpackPlugin({
				patterns: [
					{
						// 从src目录复制到临时目录
						from: `src`,
						to: path.resolve(
							__dirname,
							`${config.tempDirectory}/copiedSource/src/`
						),
						info: {minimized: true},
					},
					{
						// 从根目录复制文件到临时目录
						from: "*",
						to: path.resolve(
							__dirname,
							`${config.tempDirectory}/copiedSource/`
						),
						// 忽略特定文件
						globOptions: {
							ignore: ["**/BACKERS.md", "**/crowdin.yml"],
						},
					},
				],
			}),
			// ZIP打包插件，为源代码创建zip包
			getZipPlugin(
				`copiedSource-${config.extName}-${ffExtVersion}`,
				config.distDirectory,
				"other/"
			),
		],
	},
];
