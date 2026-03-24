# AI Translator

一个 Raycast 扩展，通过扩展设置配置单个第三方 AI Provider，并向你填写的精确请求地址发起翻译请求。

## 功能

- 支持在扩展设置中配置 Provider
- 支持配置 `Base URL`、`API Key`、默认模型、额外请求头
- 支持配置请求超时，避免第三方接口长时间无响应
- 支持自动检测源语言并翻译到目标语言
- 当前版本聚焦单 Provider 配置，所有命令共享同一套设置
- 支持自定义第三方 Provider 地址，不自动补全路径

## 使用方式

1. 执行 `npm install`
2. 执行 `npm run dev`
3. 在 Raycast 中打开扩展设置，填写 Provider 信息，例如：
   - Provider Name: `ChatGPT`
   - Base URL: `https://api.openai.com/v1/chat/completions`
   - API Key: 你的密钥
   - Model: 例如 `gpt-5.4`
4. 打开 `AI Translator`
5. 输入要翻译的文本

## Provider 填写建议

- `Base URL` 会被当成最终请求地址直接使用，不会自动补全任何路径
- 如果你的平台要求完整接口地址，例如 `/chat/completions` 或其他自定义路径，请直接填完整地址
- 额外请求头支持两种格式：
  - JSON：`{"X-Source":"raycast"}`
  - 每行一个：`X-Source: raycast`

## 当前实现

当前版本聚焦单 Provider，并直接请求你配置的目标地址。如果你后面想继续扩展，我可以再帮你补：

- 流式翻译输出
- OCR 图片翻译
- 剪贴板自动翻译
- 历史翻译记录
- 适配非 OpenAI 协议的 Provider
