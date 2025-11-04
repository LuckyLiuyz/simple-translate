import log from "loglevel";
import {getSettings} from "src/settings/settings";

// 标记是否已初始化日志系统
let isInited = false;

/**
 * 覆盖日志级别工厂方法
 * 自定义日志输出格式，添加方法名和日志目录信息
 */
export const overWriteLogLevel = () => {
	// 如果已经初始化则返回
	if (isInited) return;
	isInited = true;

	// 保存原始的日志方法工厂
	const originalFactory = log.methodFactory;

	// 重写日志方法工厂，自定义日志格式
	log.methodFactory = (methodName, logLevel, loggerName) => {
		const rawMethod = originalFactory(methodName, logLevel, loggerName);

		// 返回自定义的日志方法
		return (logDir, ...args) => {
			rawMethod(`[${methodName}]`, `${logDir}:`, ...args);
		};
	};
};

/**
 * 更新日志级别
 * 根据设置决定是否启用调试模式
 */
export const updateLogLevel = () => {
	// 获取调试模式设置
	const isDebugMode = getSettings("isDebugMode");

	// 根据调试模式设置启用或禁用所有日志
	if (isDebugMode) log.enableAll(false);
	else log.disableAll(false);
};
