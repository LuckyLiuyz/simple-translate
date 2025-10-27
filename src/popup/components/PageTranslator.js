import {translateText} from "../../content/components/TranslateContainer";

export default class PageTranslator {
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

		this.translatedElements = new WeakMap();
		this.pendingTranslations = new Map();
		this.observer = null;
	}

	// 初始化翻译器
	init() {
		// 移除了调试代码
		// this.setupMutationObserver();
		debugger;
		return this.translatePage();
	}

	// 设置MutationObserver监听DOM变化
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

	// 翻译整个页面
	async translatePage() {
		const elements = this.collectTranslatableElements();
		return this.batchTranslateElements(elements);
	}

	// 收集可翻译元素
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
					type: "text",
					node: node,
					text: node.textContent,
					originalText: node.textContent,
				});
			}
		}

		// 收集属性文本
		this.collectAttributeTexts(root).forEach((attr) => elements.push(attr));
		// 移除了调试用的 alert
		console.log("collectTranslatableElements()", elements);
		return elements;
	}

	// 收集属性中的文本
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
						type: "attribute",
						element: node,
						attribute: attr,
						text: value,
						originalText: value,
					});
				}
			});
		}

		console.log("collectAttributeTexts()", attributes);
		return attributes;
	}

	// 判断是否跳过元素
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

	// 批量翻译元素
	async batchTranslateElements(elements) {
		const batches = [];
		for (let i = 0; i < elements.length; i += this.options.batchSize) {
			batches.push(elements.slice(i, i + this.options.batchSize));
		}

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

	// 翻译批次
	async translateBatch(batch) {
		const texts = batch.map((item) => item.text);

		try {
			const translations = await this.callTranslationAPI(texts);

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

	// 调用翻译API
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

	// 应用翻译结果
	applyTranslation(item, translatedText) {
		try {
			switch (item.type) {
				case "text":
					if (item.node.textContent === item.originalText) {
						item.node.textContent = translatedText;
						this.translatedElements.set(item.node.parentElement, true);
					}
					break;

				case "attribute":
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

	// 翻译单个元素
	async translateElement(element) {
		const items = this.collectTranslatableElements(element);
		if (items.length > 0) {
			return this.batchTranslateElements(items);
		}
	}

	// 恢复原始文本
	restoreOriginal() {
		this.translatedElements = new WeakMap();

		// 重新加载页面是最简单的方式
		window.location.reload();
	}

	// 更改目标语言
	async changeLanguage(lang) {
		this.options.targetLanguage = lang;
		this.translatedElements = new WeakMap();
		return this.translatePage();
	}

	// 延迟函数
	delay(ms) {
		return new Promise((resolve) => setTimeout(resolve, ms));
	}

	// 销毁翻译器
	destroy() {
		if (this.observer) {
			this.observer.disconnect();
		}
		this.translatedElements = new WeakMap();
		this.pendingTranslations.clear();
	}
}
