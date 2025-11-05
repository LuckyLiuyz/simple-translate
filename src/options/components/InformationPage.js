import queryString from "query-string";
import browser from "webextension-polyfill";
import manifest from "src/manifest-chrome.json";
import OptionsContainer from "./OptionContainer";
import React, {useState, useEffect} from "react";

export default (props) => {
	const query = queryString.parse(props.location.search);
	const extensionVersion = manifest.version;

	const [hasPermission, requestPermission] = useAdditionalPermission();

	return (
		<div>
			<p className='contentTitle'>
				{browser.i18n.getMessage("informationLabel")}
			</p>
			<hr />
			<OptionsContainer
				title={"extName"}
				captions={[]}
				type={"none"}
				updated={query.action === "updated"}
				extraCaption={
					<p className='caption'>
						<a
							href='https://github.com/sienori/simple-translate/releases'
							target='_blank'>
							Version {extensionVersion}
						</a>
						<span>　</span>
					</p>
				}
			/>

			<OptionsContainer
				title={"licenseLabel"}
				captions={["Mozilla Public License, Version. 2.0"]}
				useRawCaptions={true}
				type={"none"}
			/>

			{!hasPermission && (
				<>
					<hr />
					<OptionsContainer
						title={"additionalPermissionLabel"}
						captions={["additionalPermissionCaptionLabel"]}
						type={"button"}
						value={"enableLabel"}
						onClick={requestPermission}
					/>
				</>
			)}
		</div>
	);
};

const useAdditionalPermission = () => {
	const [hasPermission, setHasPermission] = useState(true);

	const permissions = {
		origins: ["http://*/*", "https://*/*", "<all_urls>"],
	};

	const checkPermission = async () => {
		const hasPermission = await browser.permissions.contains(permissions);
		setHasPermission(hasPermission);
	};

	const requestPermission = async () => {
		await browser.permissions.request(permissions);
		checkPermission();
	};

	useEffect(() => {
		checkPermission();
	}, []);

	return [hasPermission, requestPermission];
};
