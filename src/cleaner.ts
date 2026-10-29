const TRACKING_PARAMS = new Set([
  'a',
  's',
  't',
  'ref_src',
  'ref_url',
  'mx',
  'cn',
  'fbclid',
  'gclid',
  'utm_source',
  'utm_medium',
  'utm_campaign',
  'utm_term',
  'utm_content'
]);

const X_DOMAINS = new Set([
  'x.com',
  'www.x.com',
  'twitter.com',
  'www.twitter.com',
  'mobile.twitter.com',
  'mobile.x.com'
]);

/**
 * Sanitizes an X / Twitter URL by removing telemetry & tracking parameters.
 */
export function cleanTwitterUrl(rawUrl: string): string {
  try {
    const url = new URL(rawUrl.trim());
    const hostname = url.hostname.toLowerCase();

    if (!X_DOMAINS.has(hostname)) {
      return rawUrl;
    }

    // Status / post permalinks need no query parameters or hash
    if (url.pathname.includes('/status/')) {
      url.search = '';
      url.hash = '';
      return url.toString();
    }

    // For other paths (search, user profiles, etc.), selectively prune tracking keys
    for (const key of Array.from(url.searchParams.keys())) {
      if (TRACKING_PARAMS.has(key.toLowerCase())) {
        url.searchParams.delete(key);
      }
    }

    url.hash = '';
    return url.toString();
  } catch {
    return rawUrl;
  }
}

const URL_REGEX = /https?:\/\/(?:[a-zA-Z0-9-]+\.)?(?:x|twitter)\.com\/[^\s)\]]+/gi;

/**
 * Finds and sanitizes any X / Twitter URLs embedded in a string of text.
 */
export function cleanTextPayload(text: string): { cleanedText: string; count: number } {
  let count = 0;
  const cleanedText = text.replace(URL_REGEX, (matchedUrl) => {
    const cleaned = cleanTwitterUrl(matchedUrl);
    if (cleaned !== matchedUrl) {
      count++;
    }
    return cleaned;
  });

  return { cleanedText, count };
}
