import { cleanTextPayload } from './cleaner';

(() => {
  if (!navigator.clipboard || !navigator.clipboard.writeText) return;
  const originalWriteText = navigator.clipboard.writeText.bind(navigator.clipboard);

  navigator.clipboard.writeText = async function (text: string): Promise<void> {
    try {
      if (typeof text === 'string') {
        const { cleanedText, count } = cleanTextPayload(text);
        if (count > 0) {
          window.postMessage({ type: 'UNTRACKX_LINK_CLEANED', amount: count }, '*');
          return originalWriteText(cleanedText);
        }
      }
    } catch (e) {
      console.error('[UntrackX] Error sanitizing clipboard text', e);
    }
    return originalWriteText(text);
  };
})();
