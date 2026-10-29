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
 * 2. Inject a lightweight MAIN-world hook to intercept programmatic
 *    `navigator.clipboard.writeText()` calls made by X's web application.
 */
function injectClipboardInterceptor() {
  const script = document.createElement('script');
  script.textContent = `
    (() => {
      if (!navigator.clipboard || !navigator.clipboard.writeText) return;
      const originalWriteText = navigator.clipboard.writeText.bind(navigator.clipboard);

      navigator.clipboard.writeText = async function(text) {
        try {
          if (typeof text === 'string' && (text.includes('x.com') || text.includes('twitter.com'))) {
            // Strip tracking query params
            const cleaned = text.replace(/https?:\\/\\/(?:[a-zA-Z0-9-]+\\.)?(?:x|twitter)\\.com\\/[^\\s)\\]]+/gi, (url) => {
              try {
                const parsed = new URL(url);
                if (parsed.pathname.includes('/status/')) {
                  parsed.search = '';
                  parsed.hash = '';
                } else {
                  ['a', 's', 't', 'ref_src', 'ref_url', 'mx', 'cn', 'fbclid', 'gclid'].forEach(p => parsed.searchParams.delete(p));
                  parsed.hash = '';
                }
                return parsed.toString();
              } catch {
                return url;
              }
            });

            window.postMessage({ type: 'UNTRACKX_LINK_CLEANED' }, '*');
            return originalWriteText(cleaned);
          }
        } catch (e) {
          console.error('[UntrackX] Error sanitizing clipboard text', e);
        }
        return originalWriteText(text);
      };
    })();
  `;

  (document.head || document.documentElement).appendChild(script);
  script.remove();
}

injectClipboardInterceptor();

window.addEventListener('message', (event) => {
  if (event.source === window && event.data?.type === 'UNTRACKX_LINK_CLEANED') {
    chrome.runtime.sendMessage({
      type: 'INCREMENT_COUNT',
      amount: 1
    }).catch(() => {});
  }
});
