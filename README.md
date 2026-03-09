# WVNews Publishing Platform (WPP)

## Enterprise CMS Replacement for BLOX

A complete, purpose-built news publishing platform for wvnews.com and affiliated properties. Built with Next.js 14, designed for deployment on Vercel with AWS or GCP backend services.

---

## What's Included in This Prototype

### Public-Facing Website
- **Homepage** — Breaking news ticker, hero stories, section grid, weather, newsletter signup, most-read sidebar, self-service links
- **Article Pages** — Full article layout with paywall enforcement, social sharing, AI-suggested related stories, access badges (Free/Premium/Subscriber)
- **Section Pages** — Filterable story listings by section with multi-section support
- **Subscribe Page** — 4-tier pricing (Free, Digital, Print+Digital, E-Edition) with Stripe-ready checkout
- **E-Edition** — Digital newspaper viewer with archive and subscriber gate
- **Account Portal** — Self-service profile, subscription, billing, newsletters, reading history
- **Submission Forms** — Obituaries ($75), letters, news tips, events, classifieds ($25), advertise inquiry — all with payment support

### Admin CMS Dashboard (15 Modules)
1. **Dashboard** — Real-time stats, traffic chart, editorial budget, paywall funnel, AI insights
2. **Stories / CMS** — Full editor with multi-section placement, multi-site publishing, access controls, AI writing tools
3. **Media Library** — Grid/list view, storage stats, AI alt-text, duplicate detection, Google Drive import
4. **Editorial Budget** — Kanban board, list view, calendar view, PrintManager sync
5. **Analytics** — Pageviews, revenue breakdown, subscription funnel, GA4 integration
6. **Newsletters** — Newsletter management, Constant Contact sync, AI auto-builder
7. **Social Media Hub** — Multi-platform posting, AI post copy, engagement tracking
8. **Forms & Submissions** — Drag-and-drop form builder, payment forms, submission management
9. **Advertising** — Campaign management, ad zones, self-service portal, revenue tracking
10. **Subscribers** — Full subscriber database, tier management, Stripe + PrintManager sync
11. **E-Edition** — Upload/process PDFs, subscriber notifications, archive management
12. **Sites & Domains** — Multi-site management for all publications
13. **SEO & AI Engine** — SEO audit, headline optimizer, auto-tagging, meta generator, trend matcher, internal link builder
14. **Settings** — General, integrations, paywall config, security status

### AI Features Throughout
- AI headline suggestions & SEO optimization
- Auto-generated meta descriptions
- Smart content tagging & topic detection
- Image alt-text generation
- Social media post copy generation
- Newsletter auto-assembly
- Internal link suggestions
- Google Trends matching
- Content summaries for newsletters/social

---

## Deploy to Vercel — Step by Step

### Prerequisites
- A [GitHub](https://github.com) account
- A [Vercel](https://vercel.com) account (free tier works)
- [Node.js 18+](https://nodejs.org) installed locally
- [Git](https://git-scm.com) installed locally

### Step 1: Set Up the Project Locally

```bash
# Unzip the project
unzip wvnews-platform.zip
cd wvnews-platform

# Install dependencies
npm install

# Test locally
npm run dev
# Open http://localhost:3000
```

### Step 2: Push to GitHub

```bash
# Initialize git repo
git init
git add .
git commit -m "Initial WVNews Platform build"

# Create a new repo on GitHub (go to github.com/new)
# Then push:
git remote add origin https://github.com/YOUR_USERNAME/wvnews-platform.git
git branch -M main
git push -u origin main
```

### Step 3: Deploy to Vercel

1. Go to [vercel.com/new](https://vercel.com/new)
2. Click **"Import Git Repository"**
3. Select your `wvnews-platform` repo
4. Vercel auto-detects Next.js — leave all defaults
5. Click **Deploy**
6. Wait ~60 seconds for the build

Your site will be live at: `https://wvnews-platform-XXXXX.vercel.app`

### Step 4: Set Up a Custom Preview URL

1. In Vercel dashboard, go to your project → **Settings** → **Domains**
2. Add a custom domain like `wpp-preview.wvnews.com` or use the auto-generated `.vercel.app` URL
3. For a custom domain, add the CNAME record Vercel provides to your DNS

### Step 5: Environment Variables (for production features)

In Vercel → Project → Settings → Environment Variables, add:

```
DATABASE_URL=postgresql://...
NEXTAUTH_SECRET=your-secret
STRIPE_SECRET_KEY=sk_live_...
STRIPE_PUBLISHABLE_KEY=pk_live_...
GOOGLE_ANALYTICS_ID=G-...
CONSTANT_CONTACT_API_KEY=...
OPENAI_API_KEY=sk-...  (or Google Vertex credentials)
AWS_ACCESS_KEY_ID=...
AWS_SECRET_ACCESS_KEY=...
AWS_S3_BUCKET=wvnews-assets
```

---

## Architecture

```
Next.js 14 (App Router)  →  Vercel (Frontend)
         ↓
    API Routes (Next.js)  →  Vercel Serverless Functions
         ↓
    PostgreSQL (RDS/Cloud SQL)  +  Redis (ElastiCache)
         ↓
    AWS S3 / GCS (Media Storage)  →  CloudFront / Cloud CDN
         ↓
    External Services: Stripe, Constant Contact, Google APIs, Social APIs
```

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 14, React 18, Tailwind CSS |
| Editor | TipTap (ProseMirror) |
| Database | PostgreSQL |
| Cache | Redis |
| Storage | AWS S3 or Google Cloud Storage |
| CDN | CloudFront or Cloud CDN |
| Payments | Stripe |
| Email | Constant Contact API + SendGrid |
| AI | OpenAI API or Google Vertex AI |
| Analytics | Google Analytics 4 + BigQuery |
| Auth | NextAuth.js + Firebase Auth |
| Search | Elasticsearch or Algolia |
| Deployment | Vercel |

## Project Structure

```
src/
├── app/
│   ├── page.js              # Homepage
│   ├── article/[slug]/      # Article pages
│   ├── section/[slug]/      # Section pages
│   ├── subscribe/           # Subscription pricing
│   ├── account/             # Self-service account portal
│   ├── e-edition/           # E-Edition viewer
│   ├── submit/              # User submission forms
│   └── admin/               # CMS Dashboard
│       ├── stories/         # Story editor & management
│       ├── media/           # Media library
│       ├── budget/          # Editorial budget & print planning
│       ├── analytics/       # Analytics dashboard
│       ├── newsletters/     # Newsletter management
│       ├── social/          # Social media hub
│       ├── forms/           # Form builder
│       ├── ads/             # Advertising management
│       ├── subscribers/     # Subscriber management
│       ├── e-edition/       # E-Edition admin
│       ├── sites/           # Multi-site management
│       ├── seo/             # SEO & AI engine
│       └── settings/        # Platform settings
├── components/
│   ├── public/              # Public-facing components
│   └── admin/               # Admin components
├── data/
│   └── mock.js              # Mock data (replace with API)
└── lib/                     # Utilities & API clients
```

## Next Steps for Production

1. **Database**: Set up PostgreSQL (AWS RDS or Cloud SQL) and build the schema
2. **Authentication**: Implement NextAuth.js with Google/Facebook OAuth
3. **Stripe**: Connect Stripe for subscriptions and payment forms
4. **Storage**: Configure AWS S3 or GCS for media uploads
5. **API Routes**: Build Next.js API routes connecting to the database
6. **Constant Contact**: Implement newsletter sync via API
7. **AI Integration**: Connect OpenAI or Vertex AI for SEO/content tools
8. **BLOX Migration**: Export data from BLOX and build the import pipeline
9. **301 Redirects**: Map all BLOX URLs to new platform URLs
10. **Load Testing**: Stress test before going live

---

Built for WVNews Group · March 2026
