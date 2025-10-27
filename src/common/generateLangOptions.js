import browser from "webextension-polyfill";
const alphabeticallySort = (a, b) => a.name.localeCompare(b.name);

const langListGoogle = ["zh-CN", "zh-TW", "en"];
const langListDeepl = ["en-US", "en-GB", "zh"];

export default (translationApi) => {
	const langList = translationApi === "google" ? langListGoogle : langListDeepl;
	const langOptions = langList.map((lang) => ({
		value: lang,
		name: browser.i18n.getMessage("lang_" + lang.replace("-", "_")),
	}));
	langOptions.sort(alphabeticallySort);
	return langOptions;
};
