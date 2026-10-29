import { cleanTextPayload } from './cleaner';

/**
 * 1. Listen for DOM 'copy' events (keyboard shortcuts, context menu selections).
 */
document.addEventListener(
  'copy',
  (event: ClipboardEvent) => {
    const selection = document.getSelection()?.toString();
    if (!selection) return;

    const { cleanedText, count } = cleanTextPayload(selection);
    if (count > 0 && event.clipboardData) {
      event.clipboardData.setData('text/plain', cleanedText);
      event.preventDefault();

      chrome.runtime.sendMessage({
        type: 'INCREMENT_COUNT',
        amount: count
      }).catch(() => {
        // Context might be invalidated; fail silently
      });
    }
  },
  true
);

/**
 * 2. Listen for messages from the MAIN world interceptor script.
 */
window.addEventListener('message', (event) => {
  if (event.source === window && event.data?.type === 'UNTRACKX_LINK_CLEANED') {
    chrome.runtime.sendMessage({
      type: 'INCREMENT_COUNT',
      amount: typeof event.data.amount === 'number' ? event.data.amount : 1
    }).catch(() => {});
  }
});
