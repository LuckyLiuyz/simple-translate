import {translateText} from "../../content/components/TranslateContainer";

/**
 * 页面翻译器类
 * 负责整个页面的文本翻译功能
 */
export default class PageTranslator {
	/**
	 * 构造函数
	 * @param {Object} options - 配置选项
	 * @param {string} options.targetLanguage - 目标语言，默认为'en'
	 * @param {string} options.apiKey - API密钥
	 * @param {string} options.apiUrl - API地址
	 * @param {Array<string>} options.excludeSelectors - 排除的选择器列表
	 * @param {Array<string>} options.translateAttributes - 需要翻译的属性列表
	 * @param {number} options.batchSize - 批量翻译大小，默认为10
	 */
	constructor(options = {}) {
		this.options = {
			targetLanguage: "en",
			apiKey: "",
			apiUrl: "https://translation-api.example.com/translate",
			excludeSelectors: ["script", "style", "noscript", ".no-translate"],
			translateAttributes: ["title", "alt", "placeholder"],
			batchSize: 10,
			...options,
		};

		// 存储已翻译元素的弱映射
		this.translatedElements = new WeakMap();
		// 存储待处理翻译的映射
		this.pendingTranslations = new Map();
		// DOM变化观察器
		this.observer = null;
	}

	/**
	 * 初始化翻译器
	 * @returns {Promise} 翻译页面的Promise
	 */
	init() {
		// 移除了调试代码
		// this.setupMutationObserver();
		return this.translatePage();
	}

	/**
	 * 设置MutationObserver监听DOM变化
	 */
	setupMutationObserver() {
		this.observer = new MutationObserver((mutations) => {
			mutations.forEach((mutation) => {
				if (mutation.type === "childList") {
					mutation.addedNodes.forEach((node) => {
						if (node.nodeType === Node.ELEMENT_NODE) {
							this.translateElement(node);
						}
					});
				}
			});
		});

		this.observer.observe(document.body, {
			childList: true,
			subtree: true,
		});
	}

	/**
	 * 翻译整个页面
	 * @returns {Promise} 批量翻译元素的Promise
	 */
	async translatePage() {
		const elements = this.collectTranslatableElements();
		return this.batchTranslateElements(elements);
	}

	/**
	 * 收集可翻译元素
	 * @param {HTMLElement} root - 根元素，默认为document.body
	 * @returns {Array<Object>} 可翻译元素数组
	 */
	collectTranslatableElements(root = document.body) {
		const elements = [];
		const walker = document.createTreeWalker(
			root,
			NodeFilter.SHOW_ELEMENT | NodeFilter.SHOW_TEXT,
			{
				acceptNode: (node) => {
					// 跳过不需要翻译的元素
					if (node.nodeType === Node.ELEMENT_NODE) {
						if (this.shouldSkipElement(node)) {
							return NodeFilter.FILTER_REJECT;
						}
						return NodeFilter.FILTER_SKIP;
					}

					// 文本节点：检查是否为空或已翻译
					if (node.nodeType === Node.TEXT_NODE) {
						if (
							!node.textContent.trim() ||
							this.translatedElements.has(node.parentElement)
						) {
							return NodeFilter.FILTER_REJECT;
						}
						return NodeFilter.FILTER_ACCEPT;
					}

					return NodeFilter.FILTER_SKIP;
				},
			}
		);

		let node;
		while ((node = walker.nextNode())) {
			if (node.nodeType === Node.TEXT_NODE) {
				elements.push({
					type: "text", // 元素类型
					node: node, // DOM节点
					text: node.textContent, // 当前文本
					originalText: node.textContent, // 原始文本
				});
			}
		}

		// 收集属性文本
		this.collectAttributeTexts(root).forEach((attr) => elements.push(attr));
		// 移除了调试用的 alert
		console.log("collectTranslatableElements()", elements);
		return elements;
	}

	/**
	 * 收集属性中的文本
	 * @param {HTMLElement} element - 要收集属性的元素
	 * @returns {Array<Object>} 属性文本数组
	 */
	collectAttributeTexts(element) {
		const attributes = [];
		const walker = document.createTreeWalker(
			element,
			NodeFilter.SHOW_ELEMENT,
			null,
			false
		);

		let node;
		while ((node = walker.nextNode())) {
			if (this.shouldSkipElement(node)) continue;

			this.options.translateAttributes.forEach((attr) => {
				const value = node.getAttribute(attr);
				if (value && value.trim()) {
					attributes.push({
						type: "attribute", // 元素类型
						element: node, // DOM元素
						attribute: attr, // 属性名
						text: value, // 当前文本
						originalText: value, // 原始文本
					});
				}
			});
		}

		console.log("collectAttributeTexts()", attributes);
		return attributes;
	}

	/**
	 * 判断是否跳过元素
	 * @param {HTMLElement} element - 要检查的元素
	 * @returns {boolean} 是否跳过该元素
	 */
	shouldSkipElement(element) {
		// 检查排除选择器
		if (
			this.options.excludeSelectors.some((selector) => {
				// 替换可选链操作符以提高兼容性
				return (
					(element.matches && element.matches(selector)) ||
					(element.closest && element.closest(selector))
				);
			})
		) {
			return true;
		}

		// 检查是否已翻译
		if (this.translatedElements.has(element)) {
			return true;
		}

		// 检查可见性
		const style = window.getComputedStyle(element);
		if (style.display === "none" || style.visibility === "hidden") {
			return true;
		}

		return false;
	}

	/**
	 * 批量翻译元素
	 * @param {Array<Object>} elements - 要翻译的元素数组
	 * @returns {Promise} 所有批次翻译完成的Promise
	 */
	async batchTranslateElements(elements) {
		// 将元素分割成批次
		const batches = [];
		for (let i = 0; i < elements.length; i += this.options.batchSize) {
			batches.push(elements.slice(i, i + this.options.batchSize));
		}

		// 逐批次翻译
		for (const batch of batches) {
			try {
				await this.translateBatch(batch);
				// 避免频繁请求，添加延迟
				await this.delay(100);
			} catch (error) {
				console.error("Batch translation failed:", error);
			}
		}
	}

	/**
	 * 翻译批次
	 * @param {Array<Object>} batch - 批次元素数组
	 * @returns {Promise} 批次翻译完成的Promise
	 */
	async translateBatch(batch) {
		// 提取需要翻译的文本
		const texts = batch.map((item) => item.text);

		try {
			// 调用翻译API获取翻译结果
			const translations = await this.callTranslationAPI(texts);

			// 应用翻译结果到每个元素
			batch.forEach((item, index) => {
				if (translations[index]) {
					this.applyTranslation(item, translations[index]);
				}
			});
		} catch (error) {
			console.error("Translation API error:", error);
			// 可以在这里添加重试逻辑
		}
	}

	/**
	 * 调用翻译API
	 * @param {Array<string>} texts - 需要翻译的文本数组
	 * @returns {Promise<Array<string>>} 翻译结果数组
	 */
	async callTranslationAPI(texts) {
		console.log("callTranslationAPI()", texts);
		if (texts.length === 0) return [];
		let result = [];

		// 修复异步处理逻辑，确保所有翻译完成后再返回结果
		for (let index = 0; index < texts.length; index++) {
			let ret = await translateText(texts[index]);
			result[index] = ret.resultText;
		}

		console.log("callTranslationAPI() result", result);
		return result;
	}

	/**
	 * 应用翻译结果
	 * @param {Object} item - 要应用翻译的元素信息
	 * @param {string} translatedText - 翻译后的文本
	 */
	applyTranslation(item, translatedText) {
		try {
			switch (item.type) {
				case "text":
					// 确保文本未被修改后再应用翻译
					if (item.node.textContent === item.originalText) {
						item.node.textContent = translatedText;
						this.translatedElements.set(item.node.parentElement, true);
					}
					break;

				case "attribute":
					// 确保属性未被修改后再应用翻译
					if (item.element.getAttribute(item.attribute) === item.originalText) {
						item.element.setAttribute(item.attribute, translatedText);
						this.translatedElements.set(item.element, true);
					}
					break;
			}
		} catch (error) {
			console.error("Error applying translation:", error);
		}
	}

	/**
	 * 翻译单个元素
	 * @param {HTMLElement} element - 要翻译的元素
	 * @returns {Promise} 元素翻译完成的Promise
	 */
	async translateElement(element) {
		const items = this.collectTranslatableElements(element);
		if (items.length > 0) {
			return this.batchTranslateElements(items);
		}
	}

	/**
	 * 恢复原始文本
	 */
	restoreOriginal() {
		this.translatedElements = new WeakMap();

		// 重新加载页面是最简单的方式
		window.location.reload();
	}

	/**
	 * 更改目标语言
	 * @param {string} lang - 新的目标语言
	 * @returns {Promise} 页面翻译完成的Promise
	 */
	async changeLanguage(lang) {
		this.options.targetLanguage = lang;
		this.translatedElements = new WeakMap();
		return this.translatePage();
	}

	/**
	 * 延迟函数
	 * @param {number} ms - 延迟毫秒数
	 * @returns {Promise} 延迟完成的Promise
	 */
	delay(ms) {
		return new Promise((resolve) => setTimeout(resolve, ms));
	}

	/**
	 * 销毁翻译器
	 */
	destroy() {
		if (this.observer) {
			this.observer.disconnect();
		}
		this.translatedElements = new WeakMap();
		this.pendingTranslations.clear();
	}
}
