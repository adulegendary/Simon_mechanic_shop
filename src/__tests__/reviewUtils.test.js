import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  clampRating,
  sanitizeReview,
  computeSummary,
  fetchGoogleReviews,
} from '../reviewUtils';

// ══════════════════════════════════════════════
// clampRating
// ══════════════════════════════════════════════
describe('clampRating', () => {
  it('returns the rating unchanged for valid values', () => {
    expect(clampRating(1)).toBe(1);
    expect(clampRating(3)).toBe(3);
    expect(clampRating(5)).toBe(5);
  });

  it('clamps values above 5 to 5', () => {
    expect(clampRating(6)).toBe(5);
    expect(clampRating(100)).toBe(5);
  });

  it('clamps values below 0 to 0', () => {
    expect(clampRating(-1)).toBe(0);
    expect(clampRating(-99)).toBe(0);
  });

  it('returns 0 for null', () => expect(clampRating(null)).toBe(0));
  it('returns 0 for undefined', () => expect(clampRating(undefined)).toBe(0));
  it('returns 0 for NaN', () => expect(clampRating(NaN)).toBe(0));
  it('returns 0 for a string', () => expect(clampRating('bad')).toBe(0));
  it('coerces numeric strings', () => expect(clampRating('4')).toBe(4));
  it('rounds fractional values', () => expect(clampRating(4.6)).toBe(5));
});

// ══════════════════════════════════════════════
// sanitizeReview
// ══════════════════════════════════════════════
describe('sanitizeReview', () => {
  it('maps a full Google API review correctly', () => {
    const raw = {
      authorAttribution: { displayName: ' John D. ', photoUri: 'https://photo.url' },
      rating: 5,
      relativePublishTimeDescription: '2 weeks ago',
      text: { text: 'Great service!' },
    };
    expect(sanitizeReview(raw)).toEqual({
      name: 'John D.',
      rating: 5,
      date: '2 weeks ago',
      text: 'Great service!',
      location: '',
      avatar: 'https://photo.url',
    });
  });

  it('falls back to "Anonymous" when displayName is missing', () => {
    expect(sanitizeReview({ rating: 4 }).name).toBe('Anonymous');
  });

  it('returns empty string for missing text', () => {
    expect(sanitizeReview({}).text).toBe('');
  });

  it('returns null for missing avatar', () => {
    expect(sanitizeReview({}).avatar).toBeNull();
  });

  it('handles null input without throwing', () => {
    expect(() => sanitizeReview(null)).not.toThrow();
    expect(sanitizeReview(null).name).toBe('Anonymous');
  });

  it('clamps an out-of-range rating', () => {
    expect(sanitizeReview({ rating: 99 }).rating).toBe(5);
  });
});

// ══════════════════════════════════════════════
// computeSummary
// ══════════════════════════════════════════════
describe('computeSummary', () => {
  it('returns "5.0" avg and 0 total for an empty array', () => {
    const { total, avg, counts } = computeSummary([]);
    expect(total).toBe(0);
    expect(avg).toBe('5.0');
    counts.forEach(({ pct }) => expect(pct).toBe(0));
  });

  it('computes correct average for a single review', () => {
    const { avg, total } = computeSummary([{ rating: 4 }]);
    expect(avg).toBe('4.0');
    expect(total).toBe(1);
  });

  it('computes correct average for mixed ratings', () => {
    const reviews = [{ rating: 5 }, { rating: 3 }, { rating: 4 }];
    const { avg } = computeSummary(reviews);
    expect(avg).toBe('4.0');
  });

  it('calculates bar percentages correctly', () => {
    // 3 five-stars, 1 four-star → 75% / 25%
    const reviews = [
      { rating: 5 }, { rating: 5 }, { rating: 5 }, { rating: 4 },
    ];
    const { counts } = computeSummary(reviews);
    expect(counts.find((c) => c.star === 5).pct).toBe(75);
    expect(counts.find((c) => c.star === 4).pct).toBe(25);
    expect(counts.find((c) => c.star === 3).pct).toBe(0);
  });

  it('handles invalid ratings gracefully (clamps them)', () => {
    const reviews = [{ rating: null }, { rating: 5 }];
    // null clamps to 0, so avg = (0+5)/2 = 2.5
    const { avg } = computeSummary(reviews);
    expect(avg).toBe('2.5');
  });
});

// ══════════════════════════════════════════════
// fetchGoogleReviews
// ══════════════════════════════════════════════
describe('fetchGoogleReviews', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
  });
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  const mockSuccess = (reviews = []) =>
    fetch.mockResolvedValue({
      ok: true,
      json: async () => ({ reviews }),
    });

  it('returns sanitized reviews on success', async () => {
    mockSuccess([
      {
        authorAttribution: { displayName: 'Alice', photoUri: null },
        rating: 5,
        relativePublishTimeDescription: '1 month ago',
        text: { text: 'Amazing!' },
      },
    ]);
    const result = await fetchGoogleReviews('PLACE_ID', 'API_KEY');
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe('Alice');
    expect(result[0].rating).toBe(5);
  });

  it('returns empty array when Google returns no reviews', async () => {
    mockSuccess([]);
    const result = await fetchGoogleReviews('PLACE_ID', 'API_KEY');
    expect(result).toEqual([]);
  });

  it('trims whitespace from placeId and apiKey', async () => {
    mockSuccess();
    await fetchGoogleReviews('  PLACE_ID  ', '  API_KEY  ');
    const calledUrl = fetch.mock.calls[0][0];
    expect(calledUrl).toContain('PLACE_ID');
    expect(calledUrl).not.toContain('  PLACE_ID  ');
  });

  it('throws on 403 (API key restricted / invalid)', async () => {
    fetch.mockResolvedValue({
      ok: false,
      status: 403,
      json: async () => ({ error: { message: 'API key not authorized' } }),
    });
    await expect(fetchGoogleReviews('PLACE_ID', 'BAD_KEY')).rejects.toThrow(
      'API key not authorized'
    );
  });

  it('throws on network failure', async () => {
    fetch.mockRejectedValue(new Error('Network error'));
    await expect(fetchGoogleReviews('PLACE_ID', 'API_KEY')).rejects.toThrow(
      'Network error'
    );
  });

  it('throws when placeId is empty', async () => {
    await expect(fetchGoogleReviews('', 'API_KEY')).rejects.toThrow(
      'Missing Place ID or API key'
    );
  });

  it('throws when apiKey is empty', async () => {
    await expect(fetchGoogleReviews('PLACE_ID', '')).rejects.toThrow(
      'Missing Place ID or API key'
    );
  });

  it('aborts and throws when request exceeds timeout', async () => {
    fetch.mockImplementation(
      (_, { signal }) =>
        new Promise((_, reject) => {
          signal.addEventListener('abort', () =>
            reject(Object.assign(new Error('Aborted'), { name: 'AbortError' }))
          );
        })
    );
    await expect(fetchGoogleReviews('PLACE_ID', 'API_KEY', 50)).rejects.toMatchObject({
      name: 'AbortError',
    });
  });
});
