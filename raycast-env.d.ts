/// <reference types="@raycast/api">

/* 🚧 🚧 🚧
 * This file is auto-generated from the extension's manifest.
 * Do not modify manually. Instead, update the `package.json` file.
 * 🚧 🚧 🚧 */

/* eslint-disable @typescript-eslint/ban-types */

type ExtensionPreferences = {
  /** Provider Name - Display name for your AI provider. */
  "providerName": string,
  /** Base URL - Exact request URL for your provider. No path will be appended automatically. */
  "baseUrl": string,
  /** API Key - API key used to access your provider. */
  "apiKey": string,
  /** Model - Default model name used for translation. */
  "model": string,
  /** Extra Headers - Optional extra headers in JSON or key:value format. */
  "extraHeaders"?: string,
  /** Temperature - Optional temperature value for the provider request. */
  "temperature": string,
  /** Request Timeout - Optional timeout in seconds for each provider request. */
  "requestTimeoutSeconds": string
}

/** Preferences accessible in all the extension's commands */
declare type Preferences = ExtensionPreferences

declare namespace Preferences {
  /** Preferences accessible in the `chat-with-provider` command */
  export type ChatWithProvider = ExtensionPreferences & {}
  /** Preferences accessible in the `translate-selected-text` command */
  export type TranslateSelectedText = ExtensionPreferences & {}
}

declare namespace Arguments {
  /** Arguments passed to the `chat-with-provider` command */
  export type ChatWithProvider = {}
  /** Arguments passed to the `translate-selected-text` command */
  export type TranslateSelectedText = {}
}

