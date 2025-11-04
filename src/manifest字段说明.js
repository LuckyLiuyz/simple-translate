let manifest = {
	// Manifest 版本号，Chrome 扩展使用 MV3（Manifest V3）
	manifest_version: 3,

	// 扩展版本号
	version: "3.0.0",

	// 扩展名称，使用国际化消息 extName
	name: "__MSG_extName__",

	// 扩展描述，使用国际化消息 extDescription
	description: "__MSG_extDescription__",

	// 默认语言环境
	default_locale: "en",

	// 所需权限列表
	permissions: [
		"cookies", // 访问和修改 cookie 权限
		"storage", // 存储权限，用于保存用户设置
		"contextMenus", // 上下文菜单权限，用于创建右键菜单
	],

	// 选项页面配置
	options_ui: {
		// 选项页面 HTML 文件路径
		page: "options/index.html",
		// 是否在新标签页中打开选项页面
		open_in_tab: true,
	},

	// 扩展图标配置，不同尺寸对应不同场景
	icons: {
		512: "icons/512.png", // 512x512 像素图标
		128: "icons/128.png", // 128x128 像素图标
		64: "icons/64.png", // 64x64 像素图标
		48: "icons/48.png", // 48x48 像素图标
		32: "icons/32.png", // 32x32 像素图标
	},

	// 后台服务工作线程配置
	background: {
		// 服务工作线程 JavaScript 文件路径
		service_worker: "background/background.js",
		// 指定脚本类型为 ES6 模块
		type: "module",
	},

	// 地址栏右侧扩展按钮配置
	action: {
		// 按钮图标配置，不同尺寸适配不同屏幕密度
		default_icon: {
			512: "icons/512.png",
			128: "icons/128.png",
			64: "icons/64.png",
			48: "icons/48.png",
			38: "icons/38.png",
			32: "icons/32.png",
			19: "icons/19.png",
			16: "icons/16.png",
		},
		// 默认弹出页面 HTML 文件路径
		default_popup: "popup/index.html",
	},

	// 内容脚本配置，在匹配的网页中注入
	content_scripts: [
		{
			// 是否在所有框架页面中运行（包括 iframe）
			all_frames: true,
			// 是否在 about:blank 页面中运行
			match_about_blank: true,
			// 匹配的网址模式
			matches: [
				"http://*/*", // 所有 HTTP 网站
				"https://*/*", // 所有 HTTPS 网站
				"<all_urls>", // 所有网址
			],
			// 注入的 JavaScript 文件
			js: ["content/content.js"],
			// 注入的 CSS 样式文件
			css: ["content/content.css"],
		},
	],

	// 可从网页访问的资源列表
	web_accessible_resources: [
		{
			// 资源列表
			resources: ["icons/512.png"],
			// 可访问这些资源的网站模式
			matches: ["*://*/*"],
		},
	],

	// 命令配置（快捷键）
	commands: {
		// 执行默认动作命令（打开弹出窗口）
		_execute_action: {
			// 命令描述
			description: "__MSG_openPopupDescription__",
			// 建议的快捷键
			suggested_key: {
				default: "Ctrl+Shift+Space", // 默认快捷键
			},
		},
		// 翻译选中文本命令
		translateSelectedText: {
			// 命令描述
			description: "__MSG_translateTextMenu__",
			// 建议的快捷键
			suggested_key: {
				default: "Ctrl+Space", // 默认快捷键
			},
		},
		// 翻译整个页面命令
		translatePage: {
			// 命令描述
			description: "__MSG_translatePageMenu__",
			// 此命令没有预设快捷键
		},
	},
};
