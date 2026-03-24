import { getPreferenceValues } from "@raycast/api";
import { ProviderConfig } from "./types";

type TranslatorPreferences = {
  providerName: string;
  baseUrl: string;
  apiKey: string;
  model: string;
  extraHeaders?: string;
  temperature?: string;
  requestTimeoutSeconds?: string;
};

export function getConfiguredProvider(): ProviderConfig | undefined {
  const preferences = getPreferenceValues<TranslatorPreferences>();
  const providerName = preferences.providerName.trim();
  const baseUrl = preferences.baseUrl.trim();
  const apiKey = preferences.apiKey.trim();
  const model = preferences.model.trim();

  if (!providerName || !baseUrl || !apiKey || !model) {
    return undefined;
  }

  // Let the commands surface a friendly configuration error instead of a low-level fetch failure.
  new URL(baseUrl);

  const now = new Date().toISOString();

  return {
    id: "settings-provider",
    name: providerName,
    baseUrl,
    apiKey,
    model,
    extraHeaders: preferences.extraHeaders?.trim() ?? "",
    temperature: preferences.temperature?.trim() ?? "",
    requestTimeoutSeconds: preferences.requestTimeoutSeconds?.trim() ?? "",
    isDefault: true,
    createdAt: now,
    updatedAt: now,
  };
}
