import { cleanTwitterUrl } from './cleaner';

const CONTEXT_MENU_ID = 'untrackx_copy_clean_link';

// Register context menu on extension install/update
chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: CONTEXT_MENU_ID,
    title: 'Copy Clean Link (UntrackX)',
    contexts: ['link'],
    targetUrlPatterns: [
      '*://*.x.com/*',
      '*://*.twitter.com/*'
    ]
  });
});

// Increment the global cleaned links counter
async function incrementCleanCount(delta = 1) {
  const data = await chrome.storage.local.get({ cleanedCount: 0 });
  const updated = (data.cleanedCount as number) + delta;
  await chrome.storage.local.set({ cleanedCount: updated });
}

// Context menu click handler
chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (info.menuItemId !== CONTEXT_MENU_ID || !info.linkUrl || !tab?.id) {
    return;
  }

  const cleaned = cleanTwitterUrl(info.linkUrl);

  // Write to clipboard via activeTab execution
  await chrome.scripting.executeScript({
    target: { tabId: tab.id },
    func: async (urlToCopy: string) => {
      await navigator.clipboard.writeText(urlToCopy);
    },
    args: [cleaned]
  });

  await incrementCleanCount(1);
});

// Listen for message from content script or popup
chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message.type === 'INCREMENT_COUNT') {
    incrementCleanCount(message.amount || 1).then(() => sendResponse({ ok: true }));
    return true; // Keep message channel open for async response
  }
});
