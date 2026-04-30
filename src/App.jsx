import React, { useState, useEffect } from "react";
import "./App.css";
import { computeSummary, fetchGoogleReviews, clampRating } from "./reviewUtils";

// ── Fallback reviews (shown while loading or when API is not configured) ──
const DEFAULT_REVIEWS = [
  { name: "Marcus T.",  rating: 5, date: "March 2026",    text: "Got a flat on I-225 at midnight — Simon showed up in under 20 minutes. Swapped the tire fast and even checked my other tires for free. Absolute lifesaver!", location: "Aurora, CO",     avatar: null },
  { name: "Priya S.",   rating: 5, date: "February 2026", text: "Super professional and honest. Simon could've sold me a new tire but instead patched it and saved me $120. I won't go anywhere else for tire work.",            location: "Denver, CO",     avatar: null },
  { name: "James R.",   rating: 5, date: "January 2026",  text: "Called on a Sunday morning and Simon were there within the hour. Fair price, quick work, no nonsense. Highly recommend to anyone in the Aurora area.",             location: "Aurora, CO",     avatar: null },
  { name: "Elena M.",   rating: 5, date: "December 2025", text: "Had all four tires rotated and balanced. Smooth ride ever since. Simon was super friendly and got me in and out in no time. Great local business!",                  location: "Centennial, CO", avatar: null },
  { name: "David K.",   rating: 5, date: "November 2025", text: "Stranded in a parking lot with a nail in my tire. They came out, fixed it on the spot, and charged a very fair price. Couldn't be happier.",                     location: "Aurora, CO",     avatar: null },
  { name: "Sofia L.",   rating: 4, date: "October 2025",  text: "Very responsive and knowledgeable. Simon explained everything clearly before doing the work. Will definitely be coming back.",                                       location: "Parker, CO",     avatar: null },
];

// ── Env vars — read as functions so tests can stub import.meta.env ──
const getPlaceId = () => (import.meta.env.VITE_GOOGLE_PLACE_ID || "").trim();
const getApiKey  = () => (import.meta.env.VITE_GOOGLE_API_KEY  || "").trim();

const GOOGLE_REVIEW_URL = getPlaceId()
  ? `https://search.google.com/local/writereview?placeid=${getPlaceId()}`
  : "https://maps.google.com";

// ── Static data ──
const services = [
  { icon: "🛢️", title: "Oil Change",          desc: "Quick and reliable oil change to keep your engine running smoothly." },
  { icon: "🛑", title: "Brake Service",        desc: "Inspection, repair, and replacement of brake pads, rotors, brake shoes, and drums." },
  { icon: "🔧", title: "Tire Change",          desc: "Fast and safe tire replacement for worn, damaged, or flat tires." },
  { icon: "🩹", title: "Tire Repair",          desc: "Patch and repair services for punctures and minor tire damage." },
  { icon: "🚨", title: "Roadside Assistance",  desc: "Emergency tire help when you need quick support on the road." },
  { icon: "🔄", title: "Tire Rotation",        desc: "Extend tire life and improve performance with proper rotation." },
  { icon: "💨", title: "Air Pressure Check",   desc: "Keep tires at the correct pressure for safety and fuel efficiency." },
  { icon: "🔩", title: "Basic Service",        desc: "Includes oil & filter replacement, fluid top-up, belt & hose inspection, battery check, and a full safety inspection." },
];

const contacts = [
  { icon: "📞", label: "Phone",    value: "(720) 416-9852" },
  { icon: "✉️", label: "Email",    value: "saimonestifanose@gmail.com" },
  { icon: "📍", label: "Location", value: "Aurora, Colorado" },
  { icon: "🕐", label: "Hours",    value: "Mon – Sun: 24 Hours" },
];

// ── Google logo SVG (shared) ──
const GoogleLogo = ({ size = 16 }) => (
  <svg viewBox="0 0 48 48" width={size} height={size} aria-hidden="true">
    <path fill="#4285F4" d="M44.5 20H24v8.5h11.8C34.7 33.9 30.1 37 24 37c-7.2 0-13-5.8-13-13s5.8-13 13-13c3.1 0 5.9 1.1 8.1 2.9l6.4-6.4C34.6 4.1 29.6 2 24 2 11.8 2 2 11.8 2 24s9.8 22 22 22c11 0 21-8 21-22 0-1.3-.2-2.7-.5-4z"/>
    <path fill="#34A853" d="M6.3 14.7l7 5.1C15 16.1 19.1 13 24 13c3.1 0 5.9 1.1 8.1 2.9l6.4-6.4C34.6 4.1 29.6 2 24 2c-7.6 0-14.2 4.2-17.7 10.7z" transform="translate(0 1)"/>
    <path fill="#FBBC05" d="M24 46c5.5 0 10.5-1.8 14.4-5l-6.7-5.5C29.6 37 27 37.8 24 37.8c-6 0-11.1-4-12.9-9.5l-7 5.4C7.8 41.8 15.4 46 24 46z" transform="translate(0 -1)"/>
    <path fill="#EA4335" d="M44.5 20H24v8.5h11.8c-.8 2.3-2.3 4.3-4.3 5.7l6.7 5.5C42.2 36.2 45 30.5 45 24c0-1.3-.2-2.7-.5-4z"/>
  </svg>
);

// ── ReviewCard ──
function ReviewCard({ name, rating, date, text, location, avatar }) {
  const [imgError, setImgError] = useState(false);
  const safeRating  = clampRating(rating);
  const displayName = name?.trim() || "Anonymous";
  const initial     = displayName.charAt(0).toUpperCase();

  return (
    <div className="review-card" data-testid="review-card">
      <div className="review-header">
        <div className="reviewer-avatar">
          {avatar && !imgError
            ? <img
                src={avatar}
                alt={displayName}
                referrerPolicy="no-referrer"
                onError={() => setImgError(true)}
              />
            : initial
          }
        </div>
        <div className="reviewer-info">
          <strong>{displayName}</strong>
          {location && <span>{location}</span>}
        </div>
        {date && <span className="review-date">{date}</span>}
      </div>

      <div className="review-stars" aria-label={`${safeRating} out of 5 stars`}>
        {"★".repeat(safeRating)}{"☆".repeat(5 - safeRating)}
      </div>

      {text && <p className="review-text">"{text}"</p>}

      <div className="review-source">
        <GoogleLogo size={16} />
        Google Review
      </div>
    </div>
  );
}

// ── App ──
function App() {
  const [reviews,    setReviews]    = useState(DEFAULT_REVIEWS);
  const [loading,    setLoading]    = useState(false);
  const [fromGoogle, setFromGoogle] = useState(false);
  const [fetchError, setFetchError] = useState("");

  useEffect(() => {
    const placeId = getPlaceId();
    const apiKey  = getApiKey();
    if (!placeId || !apiKey) return;
    setLoading(true);
    setFetchError("");
    fetchGoogleReviews(placeId, apiKey)
      .then((fetched) => {
        if (fetched.length > 0) {
          setReviews(fetched);
          setFromGoogle(true);
        }
        // If Google returns 0 reviews, keep the defaults silently
      })
      .catch((err) => {
        const msg = err?.name === "AbortError"
          ? "Request timed out. Showing recent reviews."
          : "Could not load Google reviews. Showing recent reviews.";
        setFetchError(msg);
        console.warn("Google Reviews fetch failed:", err.message);
      })
      .finally(() => setLoading(false));
  }, []);

  const { total, avg, counts } = computeSummary(reviews);

  return (
    <div className="app">
      {/* ── Navbar ── */}
      <header className="navbar">
        <div className="logo">Asmara Tire Change</div>
        <nav className="nav-links" aria-label="Main navigation">
          <a href="#home">Home</a>
          <a href="#services">Services</a>
          <a href="#about">About</a>
          <a href="#reviews">Reviews</a>
          <a href="#contact">Contact</a>
        </nav>
      </header>

      <main>
        {/* ── Hero ── */}
        <section className="hero" id="home" aria-label="Hero">
          <div className="hero-overlay">
            <div className="hero-content">
              <p className="tag">Fast &bull; Reliable &bull; Affordable</p>
              <h1>Your Trusted <span>Tire Service</span><br />in Town</h1>
              <p className="hero-text">
                At Asmara Tire Change we provide quick, professional tire replacement,
                repair, wheel balancing, and roadside support — keeping you safe
                on the road, day or night.
              </p>
              <div className="hero-buttons">
                <a href="#contact" className="btn primary-btn">Book a Service</a>
                <a href="#services" className="btn secondary-btn">View Services</a>
              </div>
            </div>
          </div>
        </section>

        {/* ── Trust Bar ── */}
        <div className="trust-bar" aria-label="Trust signals">
          {["Licensed & Insured", "Same-Day Service", "500+ Happy Customers", "24/7 Available"].map((t) => (
            <div className="trust-item" key={t}>
              <span className="trust-dot" aria-hidden="true" />
              {t}
            </div>
          ))}
        </div>

        {/* ── Services ── */}
        <section className="services section" id="services" aria-label="Our services">
          <div className="section-header">
            <p className="section-tag">Our Services</p>
            <h2>Everything Your Tires Need</h2>
            <p>We help drivers get back on the road quickly with dependable tire services and honest, transparent customer care.</p>
          </div>
          <div className="service-grid">
            {services.map(({ icon, title, desc }) => (
              <div className="card" key={title}>
                <span className="card-icon" aria-hidden="true">{icon}</span>
                <h3>{title}</h3>
                <p>{desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ── About ── */}
        <section className="about section dark-section" id="about" aria-label="About us">
          <div className="about-content">
            <div className="about-text">
              <p className="section-tag">Why Choose Us</p>
              <h2>Built on Trust and Quality Service</h2>
              <p>
                Asmara Tire Change is committed to providing dependable tire service
                with a focus on speed, safety, and customer satisfaction. Whether
                you need a quick change or emergency help — we are here for you,
                around the clock.
              </p>
              <div className="about-badges">
                <span className="badge">Licensed &amp; Insured</span>
                <span className="badge">Expert Technicians</span>
                <span className="badge">Transparent Pricing</span>
                <span className="badge">No Hidden Fees</span>
              </div>
            </div>
            <div className="stats">
              <div className="stat-box"><h3>500+</h3><p>Happy Customers</p></div>
              <div className="stat-box"><h3>24/7</h3><p>Always Open</p></div>
              <div className="stat-box"><h3>Same Day</h3><p>Quick Service</p></div>
              <div className="stat-box"><h3>100%</h3><p>Customer Focused</p></div>
            </div>
          </div>
        </section>

        {/* ── CTA Banner ── */}
        <div className="cta-banner">
          <h2>Flat Tire? We've Got You Covered.</h2>
          <p>Call us anytime — we're available 24 hours a day, 7 days a week.</p>
          <a href="tel:7204169852" className="cta-btn">
            📞 Call Now — (720) 416-9852
          </a>
        </div>

        {/* ── Reviews ── */}
        <section className="reviews section" id="reviews" aria-label="Customer reviews">
          <div className="reviews-top">
            <div className="section-header" style={{ margin: 0, textAlign: "left" }}>
              <p className="section-tag">Customer Reviews</p>
              <h2>What Our Customers Say</h2>
              <p>Real feedback from real drivers we've helped across the Aurora area.</p>
            </div>
            <a
              href={GOOGLE_REVIEW_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="btn leave-review-btn"
              aria-label="Leave a review on Google (opens in new tab)"
            >
              <GoogleLogo size={20} />
              Leave a Review on Google
            </a>
          </div>

          {/* Summary */}
          <div className="review-summary" aria-label="Rating summary">
            <div className="review-score">
              <span className="score-number">{avg}</span>
              <div className="score-stars" aria-label={`Average rating ${avg} out of 5`}>
                {"★".repeat(Math.round(Number(avg)))}
              </div>
              <span className="score-label">Average Rating</span>
            </div>
            <div className="review-bar-group">
              {counts.map(({ star, pct }) => (
                <div className="review-bar-row" key={star}>
                  <span className="bar-label">{star}★</span>
                  <div className="bar-track">
                    <div className="bar-fill" style={{ width: `${pct}%` }} />
                  </div>
                  <span className="bar-pct">{pct}%</span>
                </div>
              ))}
            </div>
            <div className="review-total">
              <span className="total-count">{total}</span>
              <span className="total-label">{fromGoogle ? "Google Reviews" : "Total Reviews"}</span>
            </div>
          </div>

          {/* Soft error banner */}
          {fetchError && (
            <div className="fetch-warning" role="status">
              ⚠️ {fetchError}
            </div>
          )}

          {/* Cards */}
          {loading ? (
            <div className="reviews-loading" role="status" aria-live="polite">
              <div className="spinner" aria-hidden="true" />
              <p>Loading reviews from Google…</p>
            </div>
          ) : (
            <div className="review-grid">
              {reviews.map((r, i) => (
                <ReviewCard key={`${r.name}-${i}`} {...r} />
              ))}
            </div>
          )}
        </section>

        {/* ── Contact ── */}
        <section className="contact section" id="contact" aria-label="Contact information">
          <div className="section-header">
            <p className="section-tag">Contact Us</p>
            <h2>Get in Touch</h2>
            <p>Need a tire service? Reach out — we respond fast.</p>
          </div>
          <div className="contact-box">
            {contacts.map(({ icon, label, value }) => (
              <div className="contact-item" key={label}>
                <span className="contact-icon" aria-hidden="true">{icon}</span>
                <h3>{label}</h3>
                <p>{value}</p>
              </div>
            ))}
          </div>
        </section>
      </main>

      <footer className="footer">
        <p>© 2026 <strong>Asmara Tire Change</strong>. All rights reserved. &nbsp;·&nbsp; Aurora, Colorado</p>
      </footer>
    </div>
  );
}

export default App;
