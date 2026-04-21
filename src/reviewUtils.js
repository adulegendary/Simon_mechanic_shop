// ── reviewUtils.js ──
// Pure utility functions — no React, no side-effects, easy to unit test.

/**
 * Clamp a rating value to a valid integer between 1 and 5.
 * Handles null, undefined, out-of-range, and non-numeric values.
 */
export function clampRating(rating) {
  const n = Number(rating);
  if (!Number.isFinite(n)) return 0;
  return Math.min(5, Math.max(0, Math.round(n)));
}

/**
 * Sanitize a single review object coming from the Google Places API.
 * Fills in safe defaults so the UI never receives undefined/null fields.
 */
export function sanitizeReview(raw) {
  return {
    name:     (raw?.authorAttribution?.displayName || "Anonymous").trim(),
    rating:   clampRating(raw?.rating),
    date:     (raw?.relativePublishTimeDescription || "").trim(),
    text:     (raw?.text?.text || "").trim(),
    location: "",
    avatar:   raw?.authorAttribution?.photoUri || null,
  };
}

/**
 * Compute summary stats from a reviews array.
 * Safe with empty arrays.
 */
export function computeSummary(reviews) {
  const total = reviews.length;
  const avg = total
    ? (reviews.reduce((s, r) => s + clampRating(r.rating), 0) / total).toFixed(1)
    : "5.0";
  const counts = [5, 4, 3, 2, 1].map((star) => ({
    star,
    pct: total
      ? Math.round(
          (reviews.filter((r) => clampRating(r.rating) === star).length / total) * 100
        )
      : 0,
  }));
  return { total, avg, counts };
}

/**
 * Fetch reviews from Google Places API (New).
 * - Trims credentials to handle accidental whitespace in .env
 * - Aborts after `timeoutMs` milliseconds (default 8 s)
 * - Returns an empty array if the place has no reviews yet
 */
export async function fetchGoogleReviews(placeId, apiKey, timeoutMs = 8000) {
  const id  = placeId.trim();
  const key = apiKey.trim();

  if (!id || !key) throw new Error("Missing Place ID or API key");

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const url = `https://places.googleapis.com/v1/places/${id}?key=${key}`;
    const res = await fetch(url, {
      signal: controller.signal,
      headers: { "X-Goog-FieldMask": "reviews,rating,userRatingCount" },
    });

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new Error(
        body?.error?.message || `Places API error: ${res.status}`
      );
    }

    const data = await res.json();
    return (data.reviews || []).map(sanitizeReview);
  } finally {
    clearTimeout(timer);
  }
}
