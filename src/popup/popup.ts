import { cleanTwitterUrl } from '../cleaner';

const countEl = document.getElementById('cleaned-count') as HTMLDivElement;
const inputEl = document.getElementById('url-input') as HTMLInputElement;
const outputBox = document.getElementById('output-box') as HTMLDivElement;
const outputText = document.getElementById('output-text') as HTMLDivElement;
const copyBtn = document.getElementById('copy-btn') as HTMLButtonElement;

// 1. Load initial stats
chrome.storage.local.get({ cleanedCount: 0 }).then((data) => {
  countEl.textContent = (data.cleanedCount || 0).toLocaleString();
});

// Listen for updates while popup is open
chrome.storage.onChanged.addListener((changes, area) => {
  if (area === 'local' && changes.cleanedCount) {
    countEl.textContent = (changes.cleanedCount.newValue || 0).toLocaleString();
  }
});

// 2. Interactive URL tester
inputEl.addEventListener('input', () => {
  const raw = inputEl.value.trim();
  if (!raw) {
    outputBox.classList.add('hidden');
    return;
  }

  const cleaned = cleanTwitterUrl(raw);
  outputText.textContent = cleaned;
  outputBox.classList.remove('hidden');
});

copyBtn.addEventListener('click', async () => {
  const text = outputText.textContent;
  if (!text) return;

  await navigator.clipboard.writeText(text);
  copyBtn.textContent = 'Copied!';
  setTimeout(() => {
    copyBtn.textContent = 'Copy Clean';
  }, 1200);
});
