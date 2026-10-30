import { describe, it, expect } from 'vitest';
import { cleanTwitterUrl, cleanTextPayload } from './cleaner';

describe('cleanTwitterUrl', () => {
  it('strips tracking params from status links', () => {
    const input = 'https://x.com/leviackermanft/status/2115652166325338163?a=uqa_a0BpGpaE4mGJaul&s=19';
    const expected = 'https://x.com/leviackermanft/status/2115652166325338163';
    expect(cleanTwitterUrl(input)).toBe(expected);
  });

  it('strips tracking params from twitter.com status links', () => {
    const input = 'https://twitter.com/arunpudur/status/2115745549756276873?s=20&t=9J1kl';
    const expected = 'https://twitter.com/arunpudur/status/2115745549756276873';
    expect(cleanTwitterUrl(input)).toBe(expected);
  });

  it('preserves legitimate search params while stripping trackers', () => {
    const input = 'https://x.com/search?q=typescript&s=20&f=live';
    const expected = 'https://x.com/search?q=typescript&f=live';
    expect(cleanTwitterUrl(input)).toBe(expected);
  });

   it('preserves legitimate search params while stripping trackers', () => {
    const input = 'https://twitter.com/search?q=typescript&s=20&f=live';
    const expected = 'https://twitter.com/search?q=typescript&f=live';
    expect(cleanTwitterUrl(input)).toBe(expected);
  });

  it('ignores non-X URLs', () => {
    const input = 'https://github.com/microsoft/typescript?s=20';
    expect(cleanTwitterUrl(input)).toBe(input);
  });
});

describe('cleanTextPayload', () => {
  it('detects and cleans multiple embedded links in text', () => {
    const text = 'Check this https://x.com/foo/status/123?s=19 and also https://x.com/bar/status/456?a=test&s=20';
    const result = cleanTextPayload(text);
    expect(result.count).toBe(2);
    expect(result.cleanedText).toBe('Check this https://x.com/foo/status/123 and also https://x.com/bar/status/456');
  });

  it('leaves clean text unaltered', () => {
    const text = 'Just normal text with no urls';
    const result = cleanTextPayload(text);
    expect(result.count).toBe(0);
    expect(result.cleanedText).toBe(text);
  });
});
