import { ChatMessage, ChatResponse, ProviderConfig } from "./types";

const DEFAULT_REQUEST_TIMEOUT_MS = 30_000;

function parseExtraHeaders(raw?: string): Record<string, string> {
  if (!raw?.trim()) {
    return {};
  }

  const value = raw.trim();

  if (value.startsWith("{")) {
    const parsed = JSON.parse(value) as Record<string, string>;
    return Object.fromEntries(
      Object.entries(parsed).map(([key, headerValue]) => [
        key,
        String(headerValue),
      ]),
    );
  }

  const entries = value
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const separatorIndex = line.indexOf(":");
      if (separatorIndex === -1) {
        throw new Error(`Invalid header line: ${line}`);
      }

      const key = line.slice(0, separatorIndex).trim();
      const headerValue = line.slice(separatorIndex + 1).trim();
      return [key, headerValue] as const;
    });

  return Object.fromEntries(entries);
}

function parseTemperature(value?: string): number | undefined {
  if (!value?.trim()) {
    return undefined;
  }

  const parsed = Number(value);
  if (Number.isNaN(parsed)) {
    throw new Error("Temperature must be a number");
  }

  return parsed;
}

function parseRequestTimeoutMs(value?: string): number {
  if (!value?.trim()) {
    return DEFAULT_REQUEST_TIMEOUT_MS;
  }

  const timeoutSeconds = Number(value);
  if (!Number.isFinite(timeoutSeconds) || timeoutSeconds <= 0) {
    throw new Error("Request Timeout must be a positive number");
  }

  return Math.round(timeoutSeconds * 1000);
}

function formatProviderError(raw: string): string {
  const trimmed = raw.trim();

  if (!trimmed) {
    return "The provider returned an empty error response.";
  }

  try {
    const payload = JSON.parse(trimmed) as {
      error?: {
        message?: string;
        type?: string;
        code?: string | number;
      };
      message?: string;
    };

    const message = payload.error?.message ?? payload.message;
    const code = payload.error?.code;
    const type = payload.error?.type;

    if (message) {
      const details = [type, code].filter(Boolean).join(" / ");
      return details ? `${message} (${details})` : message;
    }
  } catch {
    // Fall back to plain text below.
  }

  const singleLine = trimmed.replace(/\s+/g, " ");
  return singleLine.length > 240
    ? `${singleLine.slice(0, 239)}...`
    : singleLine;
}

export async function chatWithProvider(params: {
  provider: ProviderConfig;
  model?: string;
  systemPrompt?: string;
  userPrompt: string;
  messages?: ChatMessage[];
  signal?: AbortSignal;
}): Promise<ChatResponse> {
  const {
    provider,
    model,
    systemPrompt,
    userPrompt,
    messages: incomingMessages,
    signal,
  } = params;

  const messages: ChatMessage[] =
    incomingMessages && incomingMessages.length > 0
      ? incomingMessages
      : [
          ...(systemPrompt?.trim()
            ? [{ role: "system" as const, content: systemPrompt.trim() }]
            : []),
          { role: "user", content: userPrompt.trim() },
        ];

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${provider.apiKey}`,
    ...parseExtraHeaders(provider.extraHeaders),
  };

  const timeoutSignal = AbortSignal.timeout(
    parseRequestTimeoutMs(provider.requestTimeoutSeconds),
  );
  const requestSignal = signal
    ? AbortSignal.any([signal, timeoutSignal])
    : timeoutSignal;

  let response: Response;
  try {
    response = await fetch(provider.baseUrl.trim(), {
      method: "POST",
      headers,
      signal: requestSignal,
      body: JSON.stringify({
        model: model?.trim() || provider.model,
        messages,
        temperature: parseTemperature(provider.temperature),
        stream: false,
      }),
    });
  } catch (error) {
    if (error instanceof Error && error.name === "TimeoutError") {
      throw new Error(
        "The request timed out. Increase Request Timeout or try again.",
      );
    }

    if (error instanceof Error && error.name === "AbortError") {
      throw new Error("The request was canceled.");
    }

    throw error;
  }

  const raw = await response.text();

  if (!response.ok) {
    throw new Error(
      `Provider request failed (${response.status}): ${formatProviderError(raw)}`,
    );
  }

  const payload = JSON.parse(raw) as {
    model?: string;
    usage?: ChatResponse["usage"];
    choices?: Array<{
      message?: {
        content?: string;
      };
    }>;
  };

  const content = payload.choices?.[0]?.message?.content?.trim();

  if (!content) {
    throw new Error("Provider returned an empty response");
  }

  return {
    content,
    raw,
    model: payload.model,
    usage: payload.usage,
  };
}
