import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import App from '../App';

// Mock the module so we control fetchGoogleReviews without real network calls
vi.mock('../reviewUtils', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    fetchGoogleReviews: vi.fn(),
  };
});

import { fetchGoogleReviews } from '../reviewUtils';

// Reset mock to a safe default before every test so it never returns undefined
beforeEach(() => {
  fetchGoogleReviews.mockResolvedValue([]);
});
afterEach(() => {
  vi.clearAllMocks();
});

// ── helpers ──
const googleReview = (overrides = {}) => ({
  name: 'Test User',
  rating: 5,
  date: '1 week ago',
  text: 'Great service!',
  location: '',
  avatar: null,
  ...overrides,
});

describe('App — default state (no env vars)', () => {
  beforeEach(() => {
    // Env vars not set → fetchGoogleReviews should not be called
    vi.stubEnv('VITE_GOOGLE_PLACE_ID', '');
    vi.stubEnv('VITE_GOOGLE_API_KEY', '');
  });
  afterEach(() => vi.unstubAllEnvs());

  it('renders the navbar logo', () => {
    render(<App />);
    // Text appears in both the logo div and footer <strong> — target the logo specifically
    expect(screen.getByText('Asmara Tire Change', { selector: '.logo' })).toBeInTheDocument();
  });

  it('renders all nav links', () => {
    render(<App />);
    ['Home', 'Services', 'About', 'Reviews', 'Contact'].forEach((link) => {
      expect(screen.getByRole('link', { name: link })).toBeInTheDocument();
    });
  });

  it('renders all 6 service cards', () => {
    render(<App />);
    expect(screen.getAllByTestId('review-card')).toHaveLength(6); // 6 defaults
    expect(screen.getByText('Tire Change')).toBeInTheDocument();
    expect(screen.getByText('Roadside Assistance')).toBeInTheDocument();
  });

  it('shows default reviews without calling the API', () => {
    render(<App />);
    expect(fetchGoogleReviews).not.toHaveBeenCalled();
    expect(screen.getByText(/Marcus T\./)).toBeInTheDocument();
  });

  it('renders the "Leave a Review on Google" link', () => {
    render(<App />);
    const link = screen.getByRole('link', { name: /leave a review on google/i });
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute('target', '_blank');
    expect(link).toHaveAttribute('rel', 'noopener noreferrer');
  });

  it('renders the contact section with phone number', () => {
    render(<App />);
    expect(screen.getByText('(720) 416-9852')).toBeInTheDocument();
  });

  it('renders the CTA call link', () => {
    render(<App />);
    const callLink = screen.getByRole('link', { name: /call now/i });
    expect(callLink).toHaveAttribute('href', 'tel:7204169852');
  });

  it('does not show a loading spinner', () => {
    render(<App />);
    expect(screen.queryByRole('status', { name: /loading/i })).toBeNull();
  });
});

describe('App — Google Reviews fetch succeeds', () => {
  beforeEach(() => {
    vi.stubEnv('VITE_GOOGLE_PLACE_ID', 'FAKE_PLACE_ID');
    vi.stubEnv('VITE_GOOGLE_API_KEY', 'FAKE_API_KEY');
    fetchGoogleReviews.mockResolvedValue([
      googleReview({ name: 'Alice G.', text: 'Fantastic!' }),
      googleReview({ name: 'Bob H.',   text: 'Very fast!', rating: 4 }),
    ]);
  });
  afterEach(() => vi.unstubAllEnvs());

  it('shows the loading spinner initially', () => {
    render(<App />);
    expect(screen.getByText(/loading reviews from google/i)).toBeInTheDocument();
  });

  it('replaces defaults with Google reviews after fetch', async () => {
    render(<App />);
    await waitFor(() =>
      expect(screen.getByText(/Fantastic!/)).toBeInTheDocument()
    );
    expect(screen.queryByText(/Marcus T\./)).not.toBeInTheDocument();
  });

  it('renders the correct number of Google review cards', async () => {
    render(<App />);
    await waitFor(() =>
      expect(screen.getAllByTestId('review-card')).toHaveLength(2)
    );
  });

  it('labels the total as "Google Reviews"', async () => {
    render(<App />);
    await waitFor(() =>
      expect(screen.getByText('Google Reviews')).toBeInTheDocument()
    );
  });
});

describe('App — Google Reviews fetch fails', () => {
  beforeEach(() => {
    vi.stubEnv('VITE_GOOGLE_PLACE_ID', 'FAKE_PLACE_ID');
    vi.stubEnv('VITE_GOOGLE_API_KEY', 'FAKE_API_KEY');
    fetchGoogleReviews.mockRejectedValue(new Error('403 Forbidden'));
  });
  afterEach(() => vi.unstubAllEnvs());

  it('keeps default reviews visible after a fetch error', async () => {
    render(<App />);
    await waitFor(() =>
      expect(screen.getByText(/Marcus T\./)).toBeInTheDocument()
    );
  });

  it('shows a warning banner after a fetch error', async () => {
    render(<App />);
    await waitFor(() =>
      expect(
        screen.getByText(/could not load google reviews/i)
      ).toBeInTheDocument()
    );
  });
});

describe('App — fetch times out', () => {
  beforeEach(() => {
    vi.stubEnv('VITE_GOOGLE_PLACE_ID', 'FAKE_PLACE_ID');
    vi.stubEnv('VITE_GOOGLE_API_KEY', 'FAKE_API_KEY');
    const abortError = Object.assign(new Error('Aborted'), { name: 'AbortError' });
    fetchGoogleReviews.mockRejectedValue(abortError);
  });
  afterEach(() => vi.unstubAllEnvs());

  it('shows timeout message in the warning banner', async () => {
    render(<App />);
    await waitFor(() =>
      expect(screen.getByText(/request timed out/i)).toBeInTheDocument()
    );
  });
});

describe('App — Google returns empty reviews array', () => {
  beforeEach(() => {
    vi.stubEnv('VITE_GOOGLE_PLACE_ID', 'FAKE_PLACE_ID');
    vi.stubEnv('VITE_GOOGLE_API_KEY', 'FAKE_API_KEY');
    fetchGoogleReviews.mockResolvedValue([]);
  });
  afterEach(() => vi.unstubAllEnvs());

  it('keeps default reviews when Google returns empty array', async () => {
    render(<App />);
    await waitFor(() =>
      expect(screen.getByText(/Marcus T\./)).toBeInTheDocument()
    );
  });
});
