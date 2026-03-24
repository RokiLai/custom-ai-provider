import {
  LaunchType,
  Toast,
  getSelectedText,
  launchCommand,
  showToast,
} from "@raycast/api";

export default async function Command() {
  try {
    const selectedText = await getSelectedText();

    await launchCommand({
      name: "chat-with-provider",
      type: LaunchType.UserInitiated,
      context: { selectedText },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    await showToast({
      style: Toast.Style.Failure,
      title: "Translate selected text failed",
      message,
    });
  }
}
