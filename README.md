# BIP Translate 浏览器翻译插件

#### 快速翻译网页上选定或键入的文本。支持谷歌翻译和 DeepL API。

项目克隆至：https://github.com/sienori/simple-translate。

## 开发

> 版本要求： Node 18.17.1

1. git clone https://github.com/LuckyLiuyz/simple-translate.git -- 克隆项目
2. Run `npm install` -- 安装依赖
3. Run `npm run watch-dev` -- 启动开发环境，构建的临时产物放到 dev 目录下，方便开发者模式下高效调试。
4. Run `npm run build` -- 构建打包插件，产物可以在浏览器开发者模式下调试。

### 本地调试

1. 运行 `npm run watch-dev`
2. 在 Chrome 中打开开发者模式，选择本地 /dev/chrome 目录下的文件，正常加载扩展程序
3. 修改 popup 下的内容，实时编译后会，点击扩展图标即可实时生效
4. 修改 content 下的内容，实时编译后需要重新加载扩展程序才可以生效

### 在 Chrome 中加载扩展程序

1. 打开 Chrome 浏览器并导航至“chrome://extensions”
2. 选择“开发者模式”，然后单击“加载解压的扩展...”
3. 从文件浏览器中选择“simple-translate/dev/chrome”

### 在 Edge 中加载扩展程序

1. 打开 Edge 浏览器并导航至“edge://extensions”
2. 选择“开发者模式”，然后点击“加载解压”
3. 从文件浏览器中选择“simple-translate/dev/chrome”

### 在 Firefox 中加载扩展程序

1. 打开 Firefox 浏览器并导航至“about:debugging”
2. 单击“加载临时插件”，然后从文件浏览器中选择 `simple-translate/dev/firefox`

## Privacy Policy

[Privacy Policy](https://simple-translate.sienori.com/privacy-policy) of BIP Translate
