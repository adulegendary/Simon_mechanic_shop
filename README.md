# Asmara Tire Change — Business Website

A modern, responsive homepage for **Asmara Tire Change**, a 24/7 tire service business based in Aurora, Colorado. Built with React + Vite and integrated with the Google Places API to display live customer reviews.

---

## Live Features

| Feature | Details |
|---|---|
| Responsive UI | Mobile-first design, works on all screen sizes |
| Animated Hero | Gradient overlays, floating glow effects, smooth fade-in |
| Services Section | 6 animated service cards with hover effects |
| Trust Bar | 4 key business trust signals |
| About + Stats | Business story with live stat counters |
| CTA Banner | Direct `tel:` link for instant calls |
| Google Reviews | Fetches live reviews via Google Places API (New) |
| Leave a Review | One-click redirect to Google Maps review page |
| Rating Summary | Dynamic average score + bar chart from real review data |
| Fallback Reviews | Shows curated defaults if API is unavailable |
| Footer | Branded footer with location |

---

## Tech Stack

- **Frontend:** React 19, Vite 8
- **Styling:** Pure CSS (custom variables, glassmorphism, CSS animations)
- **Reviews API:** Google Places API (New)
- **Testing:** Vitest + React Testing Library
- **Fonts:** Inter + Bebas Neue (Google Fonts)

---

## Project Structure

```
mechanic_shop/
├── src/
│   ├── App.jsx                  # Main component & UI layout
│   ├── App.css                  # All styles (design system + sections)
│   ├── reviewUtils.js           # Pure utility functions (fetch, compute, sanitize)
│   ├── main.jsx                 # React entry point
│   └── __tests__/
│       ├── setup.js             # Vitest + jest-dom setup
│       ├── reviewUtils.test.js  # Unit tests for utility functions
│       └── App.test.jsx         # Component integration tests
├── .env                         # Real credentials (gitignored — never commit)
├── .env.example                 # Safe template for new developers
├── .gitignore
├── vite.config.js
└── package.json
```

---

## Getting Started

### Prerequisites
- Node.js 18+
- A Google Cloud account with **Places API (New)** enabled

### 1. Clone and install

```bash
git clone https://github.com/YOUR_USERNAME/YOUR_REPO.git
cd mechanic_shop
npm install
```

### 2. Configure environment variables

```bash
cp .env.example .env
```

Edit `.env` and fill in your values:

```env
VITE_GOOGLE_API_KEY=AIza...your_key...
VITE_GOOGLE_PLACE_ID=ChIJ...your_place_id...
```

> **Place ID** is public and safe to share.
> **API Key** is secret — restrict it to your domain in Google Cloud Console.

### 3. Run locally

```bash
npm run dev
```

Open `http://localhost:5173`

### 4. Run tests

```bash
npm test
```

### 5. Build for production

```bash
npm run build
```

---

## Environment Variables

| Variable | Required | Description |
|---|---|---|
| `VITE_GOOGLE_API_KEY` | Yes (for live reviews) | Google Places API key — restrict to your domain |
| `VITE_GOOGLE_PLACE_ID` | Yes (for live reviews) | Your Google Business Place ID |

If either variable is missing, the site falls back to curated sample reviews automatically.

---

## How Google Reviews Work

```
Customer visits site
       ↓
"Leave a Review" button → opens Google Maps review page
       ↓
Customer submits review on Google
       ↓
Site fetches latest reviews via Places API (New)
       ↓
Reviews displayed with live rating summary
```

- Reviews are fetched on page load with an 8-second timeout
- On API failure or timeout, a soft warning banner is shown and defaults are kept
- Avatar images fall back to initials if the image fails to load

---

## Security

- `.env` is in `.gitignore` — real API key is never committed
- API key should be restricted to your domain in [Google Cloud Console](https://console.cloud.google.com/apis/credentials)
- All external links use `rel="noopener noreferrer"`
- Google avatar images use `referrerPolicy="no-referrer"`
- All data from the Places API is sanitized before rendering

---

## Tests

35 tests across 2 test files:

```
src/__tests__/reviewUtils.test.js   — 20 unit tests
  ✓ clampRating        (9 cases)
  ✓ sanitizeReview     (6 cases)
  ✓ computeSummary     (5 cases)
  ✓ fetchGoogleReviews (8 cases — success, 403, timeout, empty, missing creds)

src/__tests__/App.test.jsx          — 15 component tests
  ✓ Default state / no env vars     (8 cases)
  ✓ Google fetch succeeds           (4 cases)
  ✓ Google fetch fails              (2 cases)
  ✓ Request times out               (1 case)
```

---

## Roadmap

### v2.0 — Appointment Booking (Full Stack)

The next major version will transform this into a full-stack application, allowing customers to book tire service appointments directly from the website.

#### Planned Stack Addition

| Layer | Technology |
|---|---|
| Backend API | Node.js + Express (or Next.js API routes) |
| Database | PostgreSQL (appointments, customers) |
| Auth | JWT or session-based (owner dashboard) |
| Email | Nodemailer or Resend (confirmation emails) |
| Hosting | Railway / Render (backend) + Vercel (frontend) |

#### Planned Features

**Customer Side**
- [ ] Booking form — name, phone, service type, preferred date/time
- [ ] Available time slot picker (prevents double-booking)
- [ ] Booking confirmation page with summary
- [ ] Email confirmation sent to customer automatically
- [ ] Ability to cancel or reschedule via a unique booking link

**Owner Dashboard**
- [ ] Login-protected admin panel
- [ ] View all upcoming appointments in a calendar view
- [ ] Mark appointments as complete, cancelled, or no-show
- [ ] Send manual SMS/email reminders to customers
- [ ] Basic revenue and appointment analytics

**Integrations**
- [ ] Google Calendar sync for appointments
- [ ] Twilio SMS reminders (day before appointment)
- [ ] Stripe for optional deposit/prepayment

#### Proposed Booking Flow

```
Customer fills booking form
        ↓
Frontend sends POST /api/bookings
        ↓
Backend validates & checks availability
        ↓
Saves to PostgreSQL database
        ↓
Sends confirmation email to customer
        ↓
Owner sees new booking in dashboard
        ↓
(Optional) SMS reminder sent 24h before
```

---

## Contact

**Asmara Tire Change**
Aurora, Colorado
📞 (720) 416-9852
✉️ saimonestifanose@gmail.com
🕐 Mon – Sun: 24 Hours
