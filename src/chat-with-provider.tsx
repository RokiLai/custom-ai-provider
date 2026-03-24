import {
  Action,
  ActionPanel,
  Clipboard,
  Icon,
  Keyboard,
  LaunchProps,
  List,
  Toast,
  openExtensionPreferences,
  showToast,
} from "@raycast/api";
import { useEffect, useMemo, useRef, useState } from "react";
import { chatWithProvider } from "./lib/provider-client";
import { ProviderConfig } from "./lib/types";
import {
  buildTranslationPrompt,
  parseBilingualTranslation,
  TRANSLATION_SYSTEM_PROMPT,
} from "./lib/translator";
import { getConfiguredProvider } from "./lib/preferences";

type TranslatorLaunchContext = {
  selectedText?: string;
};

function resolveProviderConfig(): {
  provider?: ProviderConfig;
  configError?: string;
} {
  try {
    return { provider: getConfiguredProvider() };
  } catch (error) {
    return {
      configError:
        error instanceof Error ? error.message : "Invalid provider settings",
    };
  }
}

function renderTranslatorMarkdown(params: {
  provider?: ProviderConfig;
  sourceText: string;
  translatedText: string;
  isTranslating: boolean;
  lastError?: string;
  configError?: string;
}) {
  const {
    provider,
    sourceText,
    translatedText,
    isTranslating,
    lastError,
    configError,
  } = params;

  if (!provider) {
    return configError
      ? `# Provider configuration error\n\n${configError}`
      : "# Configure a provider first";
  }

  const { chinese, english } = parseBilingualTranslation(translatedText);
  const sections: string[] = [];

  if (!sourceText.trim() && !translatedText.trim()) {
    sections.push(
      "Type text in the search bar above and press Enter to translate.",
    );
  } else {
    if (chinese || english) {
      sections.push(`## Chinese\n\n${chinese || "-"}`);
      sections.push(`## English\n\n${english || "-"}`);
    } else if (translatedText.trim()) {
      sections.push(`## Translation\n\n${translatedText}`);
    }
  }

  if (isTranslating) {
    sections.push("Translating...");
  }

  if (lastError) {
    sections.push(`\`\`\`\n${lastError}\n\`\`\``);
  }

  return sections.join("\n\n---\n\n");
}

export default function Command(
  props: LaunchProps<{ launchContext?: TranslatorLaunchContext }>,
) {
  const requestIdRef = useRef(0);
  const abortControllerRef = useRef<AbortController | null>(null);
  const initialSelectedText = props.launchContext?.selectedText?.trim() ?? "";
  const hasAutoTranslatedRef = useRef(false);
  const [sourceText, setSourceText] = useState(initialSelectedText);
  const [activeSourceText, setActiveSourceText] = useState("");
  const [translatedText, setTranslatedText] = useState("");
  const [lastError, setLastError] = useState<string | undefined>(undefined);
  const [isTranslating, setIsTranslating] = useState(false);

  const { provider: selectedProvider, configError } = useMemo(
    () => resolveProviderConfig(),
    [],
  );
  const { chinese, english } = parseBilingualTranslation(translatedText);

  const translatorMarkdown = renderTranslatorMarkdown({
    provider: selectedProvider,
    sourceText: activeSourceText,
    translatedText,
    isTranslating,
    lastError,
    configError,
  });

  async function handleTranslate(overrideSourceText?: string) {
    const trimmedSourceText = (overrideSourceText ?? sourceText).trim();

    if (!selectedProvider) {
      await showToast({
        style: Toast.Style.Failure,
        title: "Provider not found",
        message:
          "Open the extension settings and configure your provider first.",
      });
      return;
    }

    if (!trimmedSourceText) {
      await showToast({
        style: Toast.Style.Failure,
        title: "Text is empty",
        message: "Enter text before translating.",
      });
      return;
    }

    const requestId = requestIdRef.current + 1;
    requestIdRef.current = requestId;
    abortControllerRef.current?.abort();
    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    setActiveSourceText(trimmedSourceText);
    setTranslatedText("");
    setLastError(undefined);
    setIsTranslating(true);

    try {
      const result = await chatWithProvider({
        provider: selectedProvider,
        userPrompt: buildTranslationPrompt(trimmedSourceText),
        signal: abortController.signal,
      });

      if (requestId !== requestIdRef.current) {
        return;
      }

      setTranslatedText(result.content);
    } catch (error) {
      if (requestId !== requestIdRef.current) {
        return;
      }

      const message = error instanceof Error ? error.message : String(error);
      if (message === "The request was canceled.") {
        return;
      }

      setLastError(message);
      await showToast({
        style: Toast.Style.Failure,
        title: "Request failed",
        message,
      });
    } finally {
      if (requestId === requestIdRef.current) {
        abortControllerRef.current = null;
        setIsTranslating(false);
      }
    }
  }

  useEffect(() => {
    if (!initialSelectedText || hasAutoTranslatedRef.current) {
      return;
    }

    hasAutoTranslatedRef.current = true;
    void handleTranslate(initialSelectedText);
  }, [initialSelectedText, selectedProvider]);

  async function handleCopyText(value: string, label: string) {
    if (!value.trim()) {
      await showToast({
        style: Toast.Style.Failure,
        title: `No ${label.toLowerCase()} yet`,
        message: "Translate something first.",
      });
      return;
    }

    await Clipboard.copy(value);
    await showToast({
      style: Toast.Style.Success,
      title: `${label} copied`,
    });
  }

  function handleClear() {
    setSourceText("");
    setActiveSourceText("");
    setTranslatedText("");
    setLastError(undefined);
  }

  return (
    <List
      filtering={false}
      isShowingDetail
      navigationTitle="AI Translator"
      selectedItemId="translation"
      searchText={sourceText}
      onSearchTextChange={setSourceText}
      searchBarPlaceholder="Type text to translate into Chinese and English"
    >
      {!selectedProvider ? (
        <List.EmptyView
          icon={Icon.Message}
          title={
            configError
              ? "Provider Configuration Error"
              : "Provider Not Configured"
          }
          description={
            configError
              ? "Open the extension settings and fix the provider configuration."
              : "Open the extension settings, fill in your provider info, and then come back here to start translating."
          }
        />
      ) : (
        <>
          <List.Item
            id="translation"
            title={selectedProvider.model}
            subtitle={selectedProvider.name}
            accessories={[{ tag: "Dual" }]}
            detail={<List.Item.Detail markdown={translatorMarkdown} />}
            actions={
              <ActionPanel>
                <ActionPanel.Section>
                  <Action
                    title="Translate"
                    icon={Icon.ArrowRight}
                    shortcut={Keyboard.Shortcut.Common.Open}
                    onAction={() => {
                      void handleTranslate();
                    }}
                  />
                  <Action
                    title="Copy Translation"
                    icon={Icon.Clipboard}
                    shortcut={Keyboard.Shortcut.Common.Copy}
                    onAction={() => {
                      void handleCopyText(translatedText, "Translation");
                    }}
                  />
                  <Action
                    title="Copy Chinese"
                    icon={Icon.Text}
                    onAction={() => {
                      void handleCopyText(chinese ?? "", "Chinese");
                    }}
                  />
                  <Action
                    title="Copy English"
                    icon={Icon.Text}
                    onAction={() => {
                      void handleCopyText(english ?? "", "English");
                    }}
                  />
                  <Action
                    title="Clear"
                    icon={Icon.XMarkCircle}
                    shortcut={Keyboard.Shortcut.Common.New}
                    onAction={handleClear}
                  />
                  <Action
                    title="Open Settings"
                    icon={Icon.Gear}
                    onAction={() => {
                      void openExtensionPreferences();
                    }}
                  />
                </ActionPanel.Section>
              </ActionPanel>
            }
          />
          <List.Section title="Config">
            <List.Item
              id="provider"
              title="Provider"
              subtitle={selectedProvider.name}
              detail={<List.Item.Detail markdown={translatorMarkdown} />}
            />
            <List.Item
              id="model"
              title="Model"
              subtitle={selectedProvider.model}
              detail={<List.Item.Detail markdown={translatorMarkdown} />}
            />
            <List.Item
              id="system-prompt"
              title="System Prompt"
              subtitle={TRANSLATION_SYSTEM_PROMPT}
              detail={<List.Item.Detail markdown={translatorMarkdown} />}
            />
          </List.Section>
        </>
      )}
    </List>
  );
}
