import browser from "webextension-polyfill";
import translate from "src/common/translate";
import {initSettings} from "src/settings/settings";

export default async (data) => {
	await initSettings();
	switch (data.message) {
		case "translate": {
			return await translate(data.text, data.sourceLang, data.targetLang);
		}
	}
};
