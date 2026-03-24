export const TRANSLATION_SYSTEM_PROMPT = `You are a professional translator.

Detect the source language automatically and translate the user's text into:
1. Chinese (Simplified)
2. English

Rules:
- Return exactly two sections
- Use this output format exactly:
Chinese:
<translation>

English:
<translation>
- The content after "Chinese:" and "English:" must be the actual translation result, never placeholders
- Never output placeholder words like "原文", "Original text", "same as above", "same as source", or template labels
- If the source text is already Chinese (Simplified), the Chinese section should reproduce the original wording faithfully
- If the source text is already English, the English section should reproduce the original wording faithfully
- Preserve meaning, tone, formatting, markdown, code blocks, URLs, placeholders, and line breaks
- Do not explain
- Do not add extra headings or notes`;

export function truncateText(text: string, maxLength = 96) {
  const normalized = text.replace(/\s+/g, " ").trim();
  if (normalized.length <= maxLength) {
    return normalized;
  }

  return `${normalized.slice(0, maxLength - 1)}…`;
}

export function buildTranslationPrompt(sourceText: string) {
  return `${TRANSLATION_SYSTEM_PROMPT}

Text to translate:
\`\`\`
${sourceText}
\`\`\``;
}

export function parseBilingualTranslation(translatedText: string): {
  chinese?: string;
  english?: string;
} {
  const normalized = translatedText.trim();

  const chineseMatch = normalized.match(
    /Chinese:\s*([\s\S]*?)(?:\n\s*English:\s*|$)/i,
  );
  const englishMatch = normalized.match(/English:\s*([\s\S]*?)$/i);

  return {
    chinese: chineseMatch?.[1]?.trim(),
    english: englishMatch?.[1]?.trim(),
  };
}
