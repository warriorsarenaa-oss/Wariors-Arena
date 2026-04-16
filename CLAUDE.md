# CLAUDE.md — Warriors Arena Project Documentation

> This file is the single source of truth for the Warriors Arena project.
> Read this entire file before making any changes to the codebase.

---

## PROJECT OVERVIEW

**Business:** Warriors Arena — Laser Tag & Gel Blasters Playground
**Location:** Heliopolis, Cairo, Egypt
**Type:** PWA + Online Reservation System + Admin Dashboard
**Stack:** Next.js 14 (App Router) · TypeScript · Tailwind CSS · Supabase · Framer Motion

---

## ABSOLUTE RULES — READ BEFORE EVERY RESPONSE

1. **Straight ASCII quotes only** — never use " " ' ' in any code
2. **No truncation** — output every file completely, no placeholder comments
3. **No `...rest of code here`** — if a file is too long, split the response
4. **type="button"** on every button that is not a form submit
5. **Never use toISOString()** for local date strings — use the toLocalDateString helper
6. **Never use .eq() for NULL** — use .is("column", null) in Supabase
7. **Always await context.params** in Next.js 15 dynamic routes
8. **supabaseAdmin only** in all server-side API routes
9. **Validate admin session** at the top of every /api/admin/* route
10. **Test after every change** — zero TypeScript errors before proceeding

---

## TECH STACK & VERSIONS

```
next: 16.2.3 (Turbopack)
react: 19
typescript: 5
tailwindcss: 3
framer-motion: latest
next-intl: latest
@supabase/supabase-js: latest
@react-pdf/renderer: latest (runs in child process only)
xlsx: latest
lucide-react: latest
```

---

## PROJECT STRUCTURE

```
/app
  /[locale]
    /page.tsx                    ← Homepage
    /book/page.tsx               ← 4-step booking wizard
    /faq/page.tsx                ← FAQ accordion
    /blog/page.tsx               ← Blog posts
    /admin
      /login/page.tsx            ← Admin login (preset credentials)
      /dashboard/page.tsx        ← Admin dashboard shell
  /api
    /slots/route.ts              ← GET available slots for a date
    /bookings/route.ts           ← POST create booking
    /game-durations/route.ts     ← GET game types + durations + prices
    /pricing/route.ts            ← GET public prices (no auth)
    /pdf/route.ts                ← POST generate PDF (spawns child process)
    /otp
      /send/route.ts             ← POST send OTP via Vonage
      /verify/route.ts           ← POST verify OTP code
    /admin
      /login/route.ts            ← POST admin login
      /logout/route.ts           ← POST admin logout
      /bookings/route.ts         ← GET bookings by date or range
      /bookings/[id]/route.ts    ← PATCH cancel/modify booking
      /blocks/route.ts           ← GET/POST manual blocks
      /blocks/[id]/route.ts      ← DELETE unblock
      /revenue/route.ts          ← GET revenue analytics
      /pricing/route.ts          ← GET all game durations with names
      /pricing/[id]/route.ts     ← PATCH update price
      /config/hours/route.ts     ← GET/PATCH working hours config
      /notifications/route.ts    ← GET new booking count (30s window)
      /manual-booking/route.ts   ← POST admin creates booking manually

/components
  /layout
    /Navbar.tsx                  ← Sticky nav, language toggle
    /Hero.tsx                    ← Immersive hero with video/particles
    /Preloader.tsx               ← Laser gun animation on load
    /Footer.tsx
  /ui
    /GamesSection.tsx            ← Game cards with LIVE prices from DB
    /HowItWorksSection.tsx       ← 4-step process
    /ImportantNoticeSection.tsx  ← Park fee notice
    /LocationSection.tsx         ← Google Maps embed
  /booking
    /BookingContext.tsx          ← Wizard state management
    /StepIndicator.tsx           ← Step 1-4 progress bar
    /Step1GameSelect.tsx         ← Game + duration selection
    /Step2Calendar.tsx           ← Date picker + slot grid
    /Step3PlayerInfo.tsx         ← Name, phone, email, players
    /Step5Confirm.tsx            ← Confirmation + PDF download
  /admin
    /AdminLayout.tsx             ← Sidebar navigation
    /ReservationsView.tsx        ← Slot grid + booking detail panel
    /RevenueView.tsx             ← Charts + metric cards
    /ManageSlotsView.tsx         ← Working hours editor
    /SettingsView.tsx            ← Pricing editor
    /ExportView.tsx              ← Excel export

/lib
  /supabase.ts                   ← Two clients: anon + supabaseAdmin
  /slotEngine.ts                 ← Slot generation + availability logic
  /pdfTemplate.ts                ← PDF document builder (React.createElement)
  /designTokens.ts               ← Color palette

/scripts
  /generatePdf.mjs               ← Standalone PDF script (child process)

/messages
  /en.json                       ← English translations
  /ar.json                       ← Arabic translations

/public
  /videos/hero-bg.mp4            ← Hero background video
  /images/hero-poster.webp       ← Video poster frame
```

---

## DATABASE SCHEMA

### Tables

**game_types**
```
id uuid PK | name text | display_name_en text | display_name_ar text
```
Seed: laser_tag (Laser Tag), gel_blasters (Gel Blasters)

**game_durations**
```
id uuid PK | game_type_id uuid FK | duration_minutes int | price_per_player int
```
Seed: laser_tag/30min/150 EGP | laser_tag/60min/300 EGP | gel_blasters/30min/100 EGP

**working_hours_config**
```
id uuid PK | day_of_week int nullable | specific_date date nullable
slots jsonb | is_active bool | note text | updated_at timestamptz
```
Priority: specific_date > day_of_week > null (global default)
Default slots: ["18:00","18:30","19:00","19:30","20:00","20:30"]

**bookings**
```
id uuid PK | booking_code text UNIQUE | game_type_id uuid FK
duration_id uuid FK | booking_date date | slot_time time
slot_end_time time | num_players int (1-6) | total_price int
customer_name text | customer_phone text | customer_email text
status text (confirmed/cancelled/blocked) | created_at timestamptz
```

**manual_blocks**
```
id uuid PK | block_date date | slot_time time | slot_end_time time
reason text | created_at timestamptz
```

**admin_sessions**
```
id uuid PK | session_token text UNIQUE | expires_at timestamptz
created_at timestamptz
```

**otp_verifications**
```
id uuid PK | phone text | otp text | expires_at timestamptz
verified bool | attempts int | created_at timestamptz
```

**blog_posts**
```
id uuid PK | title_en text | title_ar text | excerpt_en text
excerpt_ar text | content_en text | content_ar text
image_url text | published_at timestamptz | slug text UNIQUE
```

---

## CRITICAL BUSINESS RULES

### Booking System
- **One zone only** — only one game runs at any time
- **Session duration:** Laser Tag = 30min or 60min | Gel Blasters = 30min only
- **Players:** 1–6 per booking (minimum 1)
- **Pricing:** total_price = price_per_player × num_players (calculated server-side)
- **Booking code format:** WA-MMDD-HH-XX (e.g., WA-0410-18-K4)
- **No online payment** — payment on arrival
- **Cancellation:** Must call at least 6 hours before session

### Slot Blocking Logic (CRITICAL)
```
Overlap formula: bookedStart < slotEnd AND bookedEnd > slotStart

Where all times are converted to minutes:
timeToMinutes("18:00") = 18*60 + 0 = 1080

A 1-hour booking at 18:00 (end: 19:00) blocks:
- 18:00 slot (end 18:30): 1080 < 1110 AND 1140 > 1080 = TRUE → BLOCKED
- 18:30 slot (end 19:00): 1080 < 1140 AND 1140 > 1110 = TRUE → BLOCKED
- 19:00 slot (end 19:30): 1080 < 1170 AND 1140 > 1140 = FALSE → AVAILABLE
```

### Working Hours
- **Default:** 6:00 PM – 9:00 PM (slots: 18:00 to 20:30)
- **Max slots per day:** 6 (one per 30-min window)
- **Admin can extend** up to any time with flexible hours editor
- **Display format:** 12-hour (6:00 PM) stored as 24-hour (18:00)

### Park Fee Notice (Show everywhere)
```
"Reservation fees do not include park entrance tickets —
30 EGP/person on regular days | 50 EGP/person on holidays and festivals"
```
Show on: Hero, GamesSection, Step1, Step3, Step5, PDF receipt, email

---

## DATE & TIME RULES (CRITICAL — Cairo is UTC+2)

```typescript
// ✅ CORRECT — local date string
function toLocalDateString(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

// ❌ WRONG — shifts date back by 2 hours in UTC+2
date.toISOString().split('T')[0]

// ✅ CORRECT — parse date string without timezone shift
const [year, month, day] = dateStr.split('-').map(Number);
const date = new Date(year, month - 1, day, 12, 0, 0);

// ❌ WRONG — parses as UTC midnight, shifts to previous day
new Date('2026-04-10')

// ✅ CORRECT — strip seconds from DB time values
booking.slot_time.substring(0, 5) // "18:00:00" → "18:00"

// ✅ CORRECT — numeric time comparison
function timeToMinutes(time: string): number {
  const [h, m] = time.split(':').map(Number);
  return h * 60 + m;
}
```

---

## SUPABASE CLIENT USAGE

```typescript
// /lib/supabase.ts exports two clients:

// 1. Public client — subject to RLS, use in components
import { supabase } from '@/lib/supabase';

// 2. Admin client — bypasses RLS, use ONLY in API routes
import { supabaseAdmin } from '@/lib/supabase';

// NEVER use supabaseAdmin in client components
// ALWAYS use supabaseAdmin in /api/admin/* routes
// ALWAYS use supabaseAdmin in /lib/slotEngine.ts
```

---

## ADMIN AUTHENTICATION

```typescript
// Cookie name: wa_admin_session
// Session duration: 8 hours
// Credentials: ADMIN_USERNAME + ADMIN_PASSWORD from env vars
// Comparison: crypto.timingSafeEqual() — never use ===

// Session validation (copy to every admin route):
async function validateAdminSession(
  request: NextRequest
): Promise<boolean> {
  const token = request.cookies.get('wa_admin_session')?.value;
  if (!token) return false;
  const { data } = await supabaseAdmin
    .from('admin_sessions')
    .select('id, expires_at')
    .eq('session_token', token)
    .single();
  if (!data) return false;
  return new Date(data.expires_at) > new Date();
}
```

---

## PDF GENERATION (SPECIAL — CHILD PROCESS)

The PDF system uses a child process to avoid React instance conflicts:

```
/app/api/pdf/route.ts
  → spawns: node scripts/generatePdf.mjs
  → sends: booking JSON via stdin
  → receives: PDF buffer via stdout
```

**Never import @react-pdf/renderer directly in Next.js API routes.**
**The generatePdf.mjs script must always exist in the /scripts folder.**

---

## ENVIRONMENT VARIABLES

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...

# Admin
ADMIN_USERNAME=warriors_admin
ADMIN_PASSWORD=your_strong_password

# App
NEXT_PUBLIC_SITE_URL=https://your-domain.com

# OTP (Vonage)
VONAGE_API_KEY=your_key
VONAGE_API_SECRET=your_secret

# Email (Resend)
RESEND_API_KEY=your_key
RESEND_FROM_EMAIL=bookings@yourdomain.com
```

---

## DESIGN TOKENS

```typescript
// /lib/designTokens.ts
colors: {
  primary:     '#FF3B3B',   // Red — CTA buttons
  primaryDark: '#CC2020',   // Red hover state
  accent:      '#00FFCC',   // Neon teal — highlights
  dark:        '#0A0A0F',   // Near-black background
  darkSurface: '#13131A',   // Card backgrounds
  darkBorder:  '#1E1E2E',   // Subtle borders
  textPrimary: '#FFFFFF',
  textSecondary: '#A0A0B8',
}
```

---

## INTERNATIONALIZATION

- **Locales:** ar (default), en
- **RTL:** Arabic uses dir="rtl" on html element
- **Routing:** /ar/... and /en/...
- **Font:** Tajawal (supports both Arabic and Latin)
- **Toggle:** Language switch in Navbar and Footer

---

## PHASE BUILD PLAN

---

### PHASE 1 — Foundation & Frontend ✅ COMPLETE

**Prompt 1.1 — Project Scaffold**
- Next.js 14 + TypeScript + Tailwind + Framer Motion
- next-intl bilingual setup (ar default, en)
- Supabase client setup (anon + admin)
- Middleware for locale routing + admin protection
- Folder structure as documented above

**Prompt 1.2 — Database Schema**
- All tables created in Supabase SQL Editor
- RLS policies configured
- Seed data inserted (game_types, game_durations, working_hours_config)
- claim_slot atomic function created

**Prompt 1.3 — Preloader & Design System**
- Laser gun SVG preloader (2.2 second animation)
- Design tokens in /lib/designTokens.ts
- Global CSS classes (.btn-primary, .btn-secondary, .glass-card, .neon-text)
- Tailwind theme extended with design tokens

**Prompt 1.4 — Hero & Navigation**
- Sticky Navbar with scroll-triggered background
- Language toggle (EN/AR)
- Hero section with particles, animated text, crosshair SVG
- Optional: MP4 video background from Veo3

**Prompt 1.5 — Public Pages**
- Homepage: GamesSection, HowItWorks, ImportantNotice, Location, Footer
- FAQ page with accordion
- Blog page (empty state if no posts)
- Google Maps iframe for Al-Azhar Park Heliopolis

---

### PHASE 2 — Booking Engine ✅ COMPLETE

**Prompt 2.1 — Slot Engine**
- /lib/slotEngine.ts with getAvailableSlots()
- Three-query priority: specific_date > day_of_week > null
- Overlap detection using timeToMinutes()
- formatSlotDisplay() converts 24h to 12h
- generateBookingCode() format: WA-MMDD-HH-XX

**Prompt 2.2 — Booking API Routes**
- GET /api/slots — with rate limiting (30/min per IP)
- POST /api/bookings — validates, calls claim_slot RPC
- POST /api/otp/send — Vonage SMS (bypassed in dev)
- POST /api/otp/verify — 6-digit code, 10 min expiry
- POST /api/pdf — spawns child process
- GET /api/game-durations — live prices from DB
- GET /api/pricing — public prices endpoint

**Prompt 2.3 — Booking Wizard UI**
- BookingContext for wizard state across all steps
- Step 1: Game cards with LIVE prices, auto-advance on selection
- Step 2: Custom calendar (no library), slot grid with availability
- Step 3: Player count, Egyptian phone validation, email
- Step 4: OTP verification (disabled in dev, re-enable before launch)
- Step 5: Confirmation screen + PDF download + confetti

---

### PHASE 3 — Admin Dashboard ✅ COMPLETE

**Prompt 3.1 — Admin Auth**
- Preset credentials only (no signup)
- timingSafeEqual for credential comparison
- 8-hour session with httpOnly cookie
- IP-based rate limiting on login (5 attempts/15min)
- Middleware protects all /admin/* routes

**Prompt 3.2 — Admin Dashboard**

*Reservations View:*
- 6-slot grid (6PM to 8:30PM) with BOOKED/AVAILABLE/BLOCKED states
- Booking detail panel: customer info, game, revenue, Cancel button
- Manual booking modal: admin fills form for available slot
- 1-hour bookings block 2 consecutive slots (overlap formula)
- 30-second polling for new booking notifications

*Revenue View:*
- Metric cards: Total Revenue, Total Games, Laser Tag count, Gel Blasters count
- Today: Bar chart by time slot (6 bars)
- Week: Line chart by day (Mon-Sun)
- Month: Line chart by week (Week 1-4)
- All counts = game sessions, NOT player counts

*Manage Slots View:*
- DEFAULT/DAY/DATE target modes
- DAY mode pre-loads default slots as base
- Add/remove slot pills with flexible layout
- Manual block with reason for specific dates

*Settings View:*
- Live pricing editor (prices reflect immediately on booking page)
- Saves to game_durations table

*Export View:*
- Date range selector using input type="date"
- Excel .xlsx download via xlsx library
- Columns: Booking Code, Name, Phone, Email, Game, Duration, Date, Time, Players, Revenue, Status

---

### PHASE 4 — PWA, Security & Launch 🔄 NEXT

**Prompt 4.1 — PWA**
- /public/manifest.json
- Service worker with cache-first for static, network-first for API
- Offline fallback page
- Install prompt on mobile

**Prompt 4.2 — Email Confirmation**
- Resend integration
- Email with PDF attachment on booking confirmation
- Subject: "Booking Confirmed — WA-XXXX | Warriors Arena"
- Park fee notice prominently in email body

**Prompt 4.3 — OTP Re-enable**
- Re-enable Step 4 in booking wizard
- Connect Twilio or Vonage
- Test with real Egyptian phone number

**Prompt 4.4 — Security**
- X-Frame-Options: DENY
- X-Content-Type-Options: nosniff
- Content-Security-Policy
- Rate limiting on /api/bookings (10/min per IP)
- Input sanitization on all string inputs
- poweredByHeader: false in next.config.mjs

**Prompt 4.5 — Performance & SEO**
- Lighthouse audit targeting: Performance 85+, Accessibility 90+, SEO 90+
- Image optimization (next/image for all images)
- Lazy loading for LocationSection (heavy iframe)
- Meta tags on all pages
- OG image for social sharing
- sitemap.xml and robots.txt

**Prompt 4.6 — Mobile UX Final Pass**
- 44×44px minimum tap targets on all interactive elements
- OTP input: inputMode="numeric" for mobile keyboard
- Step indicator overflow handling on small screens (<380px)
- haptic feedback on booking confirmation (navigator.vibrate)

**Prompt 4.7 — Deployment**
- Domain DNS → Vercel
- SSL certificate (automatic via Vercel)
- Supabase CORS updated with production domain
- All env vars in Vercel dashboard
- Final go-live checklist

---

## KNOWN ISSUES & WORKAROUNDS

| Issue | Workaround |
|---|---|
| OTP disabled in dev | Phone verification bypassed — re-enable in Phase 4 |
| No online payment | Admin approves via dashboard — ghost bookings mitigated by phone verification |
| @react-pdf/renderer React conflict | PDF runs in child process via scripts/generatePdf.mjs |
| Grammarly hydration warning | suppressHydrationWarning on body tag |

---

## AUDIT CHECKLIST (Run after every phase)

**Quick Check (30 seconds — after every file save):**
- [ ] Terminal shows no red errors
- [ ] Browser console (F12) shows no red errors
- [ ] Page still loads at localhost:3000
- [ ] VS Code shows 0 errors in bottom bar

**Before sending any prompt:**
- [ ] No real API keys in the prompt text
- [ ] No real passwords in the prompt text
- [ ] "Straight ASCII quotes only" specified
- [ ] "No truncation, complete file only" specified

---

## CONTACT & HANDOVER

**Admin URL:** https://yourdomain.com/en/admin/login
**Admin credentials:** Stored in Vercel env vars (ADMIN_USERNAME, ADMIN_PASSWORD)
**To change password:** Vercel → Settings → Env Vars → Edit ADMIN_PASSWORD → Redeploy
**Database:** Supabase dashboard — warriorsarenaa@gmail.com account
**Hosting:** Vercel — connected to GitHub warriors-arena repo
**DNS:** Namecheap → pointed to Vercel

---

*Last updated: April 2026 — Phase 3 complete, Phase 4 in progress*
