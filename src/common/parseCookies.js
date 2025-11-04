/**
 * 将cookie字符串解析为键值对对象
 * @param {string} cookieString - cookie字符串，格式如 "key1=value1; key2=value2"
 * @returns {Object} 解析后的cookie对象
 */
export const parseCookies = (cookieString) => {
	// 创建空对象存储cookie键值对
	const cookies = {};
	
	// 按分号和空格分割cookie字符串
	const items = cookieString.split('; ');
	
	// 遍历每个键值对
	items.forEach(item => {
		// 按等号分割键和值
		const [key, value] = item.split('=');
		
		// 将键值对存储到对象中
		// 如果值为空字符串或undefined，则存储为空字符串
		cookies[key] = value || '';
	});
	
	return cookies;
};

/**
 * 将cookie对象转换为字符串
 * @param {Object} cookieObject - cookie键值对对象
 * @returns {string} 格式化后的cookie字符串
 */
export const stringifyCookies = (cookieObject) => {
	return Object.entries(cookieObject)
		.map(([key, value]) => `${key}=${value}`)
		.join('; ');
};

export default {
	parseCookies,
	stringifyCookies
};