# Vocoweb - AI Website Builder for Local Businesses

> **Build professional websites using voice or text in English or Hindi**

An AI-powered platform that enables non-technical local business owners to create, preview, and publish professional websites instantly using natural language.

[![Next.js](https://img.shields.io/badge/Next.js-16-black)](https://nextjs.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-Latest-009688)](https://fastapi.tiangolo.com/)
[![OpenAI](https://img.shields.io/badge/OpenAI-GPT--3.5-412991)](https://openai.com/)
[![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-3ECF8E)](https://supabase.com/)
[![Cloudflare](https://img.shields.io/badge/Cloudflare-Pages-F38020)](https://pages.cloudflare.com/)

---

## 🚀 Features

### ✅ Phase 1-2: Landing Page + Authentication
- Mobile-first responsive landing page
- Bilingual support (English/Hindi)
- Google OAuth authentication via Supabase
- Secure user dashboard
- Row Level Security (RLS)

### ✅ Phase 3: AI Website Generation (Draft Mode)
- Text-to-website using OpenAI GPT-3.5
- Automatic business type detection
- Industry-specific templates
- Mobile/Desktop preview
- Regenerate with theme variations
- Celery async task processing

### ✅ Phase 4: Publishing Engine (Cloudflare Pages)
- 1-click publish to Cloudflare Pages
- Auto subdomain generation (`*.vocoweb.fun`)
- Cloudflare Worker proxy for custom domain routing
- SSL enabled automatically
- Instant deployment via Wrangler CLI
- Live URL generation

### ✅ Phase 5: Voice Input + Regional Language
- Voice recording interface
- OpenAI Whisper integration
- Hindi + English support
- Voice-to-website pipeline
- Audio processing via Celery

### ✅ Phase 6: Website Editing + Redesign
- Section-based editing
- Redesign from existing URL
- Web scraping and content extraction
- Version history (planned)
- Auto-save drafts

### ✅ Phase 7: Credits & Abuse Control
- Credit-based usage system
- Free tier limits
- Upstash Redis rate limiting
- Abuse detection and blocking
- Credit transaction logging
- Usage limits tracking

### ✅ Phase 8: Dashboard (Control Room)
- User dashboard with stats
- My Websites (all drafts and published)
- Real-time credit balance
- Website management (edit, preview, publish)
- User profile with avatar dropdown
- Login/Logout functionality

### 🔜 Phase 9: Custom Domains + Payments (Planned)
- Custom domain linking
- Razorpay integration
- Paid plans
- Domain verification

---

## 🛠️ Tech Stack

### Frontend
- **Framework**: Next.js 16 (App Router)
- **Styling**: Tailwind CSS 4 + Custom CSS
- **Language**: TypeScript 5
- **Auth**: Supabase Auth (Google OAuth)
- **State**: React Context API
- **Deployment**: Vercel (recommended)

### Backend
- **Framework**: FastAPI (Python 3.12+)
- **AI**: OpenAI GPT-3.5 Turbo + Whisper
- **Database**: Supabase (PostgreSQL)
- **Task Queue**: Celery + Redis
- **Rate Limiting**: Upstash Redis
- **Auth**: JWT (Supabase tokens)
- **Deployment**: Railway/Render + Cloudflare Tunnel

### Infrastructure
- **Hosting**: Cloudflare Pages (websites)
- **Proxy**: Cloudflare Worker (custom domain routing)
- **Database**: Supabase (PostgreSQL with RLS)
- **Cache/Queue**: Redis (Celery broker)
- **CDN**: Cloudflare
- **Tunnel**: Cloudflare Tunnel (backend access)

---

## 📋 Prerequisites

- **Node.js** 18+ and npm
- **Python** 3.12+
- **Redis** (for Celery)
- **OpenAI API Key** ([Get one here](https://platform.openai.com/api-keys))
- **Supabase Account** ([Sign up free](https://supabase.com))
- **Cloudflare Account** (for Pages deployment)
- **Upstash Redis** (for rate limiting)

---

## 🚀 Quick Start

### 1. Clone the Repository

```bash
git clone <your-repo-url>
cd website-builder-fusion-focus
```

### 2. Backend Setup

```bash
# Navigate to backend
cd backend

# Install dependencies
pip install -r requirements.txt

# Create .env file
cp .env.supabase.template .env

# Edit .env and add your credentials:
# - APP_MODE=production
# - OPENAI_API_KEY
# - SUPABASE_URL
# - SUPABASE_KEY
# - SUPABASE_JWT_SECRET
# - CLOUDFLARE_ACCOUNT_ID
# - CLOUDFLARE_API_TOKEN
# - CLOUDFLARE_PAGES_PROJECT=user-websites
# - BASE_DOMAIN=vocoweb.fun
# - UPSTASH_REDIS_URL
# - UPSTASH_REDIS_TOKEN
```

### 3. Supabase Database Setup

1. Create a new Supabase project
2. Go to **SQL Editor** in Supabase dashboard
3. Run the schema from `backend/supabase_schema_v2.sql`
4. Run migrations from `backend/migrations/` in order
5. Copy your credentials to `backend/.env`

### 4. Cloudflare Setup

#### Cloudflare Pages
```bash
# Install Wrangler CLI
npm install -g wrangler

# Login to Cloudflare
wrangler login

# Create Pages project
wrangler pages project create user-websites
```

#### Cloudflare Worker (Proxy)
```bash
cd proxy-worker
npm install
wrangler deploy
```

### 5. Frontend Setup

```bash
# Navigate to frontend
cd frontend

# Install dependencies
npm install

# Create .env.local
echo "NEXT_PUBLIC_API_BASE_URL=https://api-dev.vocoweb.fun" > .env.local
echo "NEXT_PUBLIC_SUPABASE_URL=<your-supabase-url>" >> .env.local
echo "NEXT_PUBLIC_SUPABASE_ANON_KEY=<your-anon-key>" >> .env.local
```

### 6. Start Development Servers

```bash
# Terminal 1: Redis (required for Celery)
redis-server

# Terminal 2: Backend
cd backend
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload

# Terminal 3: Celery Worker
cd backend
celery -A app.core.celery_app worker --loglevel=info

# Terminal 4: Frontend
cd frontend
npm run dev

# Terminal 5: Cloudflare Tunnel (optional, for production-like setup)
cloudflared tunnel run vocoweb-backend
```

### 7. Access the Application

- **Landing Page**: http://localhost:3000
- **Create Website**: http://localhost:3000/create
- **Dashboard**: http://localhost:3000/dashboard
- **API Documentation**: http://localhost:8000/docs
- **Published Sites**: https://*.vocoweb.fun (production)

---

## 📁 Project Structure

```
website-builder-fusion-focus/
├── frontend/                    # Next.js frontend
│   ├── src/
│   │   ├── app/                # App router pages
│   │   │   ├── page.tsx        # Landing page
│   │   │   ├── create/         # Website creation
│   │   │   ├── preview/        # Website preview
│   │   │   ├── editor/         # Website editor
│   │   │   ├── dashboard/      # User dashboard
│   │   │   ├── login/          # Login page
│   │   │   └── api/            # API routes (proxy to backend)
│   │   ├── components/         # React components
│   │   │   ├── Header.tsx      # Nav with login/avatar
│   │   │   ├── Footer.tsx
│   │   │   └── auth/           # Auth components
│   │   ├── context/            # React Context
│   │   │   └── AuthContext.tsx # Supabase auth state
│   │   └── utils/              # Utilities
│   │       └── supabase/       # Supabase client
│   └── package.json
│
├── backend/                     # FastAPI backend
│   ├── app/
│   │   ├── main.py             # FastAPI app entry
│   │   ├── core/               # Configuration
│   │   │   ├── config.py       # Settings
│   │   │   ├── auth_middleware.py  # JWT verification
│   │   │   ├── rate_limit.py   # Upstash rate limiting
│   │   │   └── celery_app.py   # Celery config
│   │   ├── api/                # API routes
│   │   │   └── routes/         # Endpoint definitions
│   │   │       ├── generate.py # Website generation
│   │   │       ├── publish.py  # Publishing
│   │   │       ├── edit.py     # Editing
│   │   │       ├── redesign.py # Redesign from URL
│   │   │       ├── voice.py    # Voice input
│   │   │       ├── websites.py # Website CRUD
│   │   │       └── waitlist.py # Waitlist
│   │   ├── ai/                 # AI modules
│   │   │   ├── business_parser.py  # OpenAI integration
│   │   │   ├── layout_selector.py  # Template selection
│   │   │   └── voice_processor.py  # Whisper integration
│   │   ├── website/            # Website builder
│   │   │   └── builder.py      # HTML generation
│   │   ├── services/           # Business logic
│   │   │   ├── supabase.py     # Database operations
│   │   │   └── cloudflare_service.py  # Cloudflare Pages
│   │   └── workers/            # Celery tasks
│   │       └── tasks.py        # Async tasks
│   ├── data/                   # Generated websites (gitignored)
│   ├── migrations/             # Database migrations
│   ├── supabase_schema_v2.sql  # Database schema
│   └── requirements.txt
│
├── proxy-worker/               # Cloudflare Worker
│   ├── src/
│   │   └── index.js           # Proxy logic (*.vocoweb.fun → Pages)
│   └── wrangler.toml          # Worker config
│
├── docs/                       # Project documentation
│   ├── phases.txt             # Development phases
│   ├── deployment.txt         # Deployment guide
│   └── authentication.txt     # Auth setup
│
└── README.md                  # This file
```

---

## 🔐 Environment Variables

### Backend (`backend/.env`)

```env
# Mode
APP_MODE=production  # or development

# OpenAI
OPENAI_API_KEY=sk-proj-...

# Supabase
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_JWT_SECRET=your-jwt-secret

# Cloudflare
CLOUDFLARE_ACCOUNT_ID=your-account-id
CLOUDFLARE_API_TOKEN=your-api-token
CLOUDFLARE_PAGES_PROJECT=user-websites
BASE_DOMAIN=vocoweb.fun

# Upstash Redis (Rate Limiting)
UPSTASH_REDIS_URL=https://...
UPSTASH_REDIS_TOKEN=...

# Redis (Celery)
REDIS_URL=redis://localhost:6379/0

# Server
HOST=0.0.0.0
PORT=8000
DEBUG=false
```

### Frontend (`frontend/.env.local`)

```env
NEXT_PUBLIC_API_BASE_URL=https://api-dev.vocoweb.fun
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

---

## 📊 API Endpoints

### Authentication
- All endpoints require `Authorization: Bearer <token>` header (except waitlist)

### Waitlist
- `POST /api/waitlist` - Join waitlist (rate limited)

### Website Generation
- `POST /api/generate` - Generate website from text (sync)
- `POST /api/generate/async` - Generate website (async with Celery)
- `GET /api/tasks/{task_id}` - Check task status
- `GET /api/preview/{id}` - Get website preview

### Publishing
- `POST /api/publish/{id}` - Publish website to Cloudflare Pages
- `POST /api/republish/{id}` - Update published site
- `GET /api/publish/{id}/status` - Check publish status

### Editing
- `POST /api/edit/{id}` - Edit website section
- `POST /api/redesign` - Redesign from URL
- `POST /api/regenerate/{id}` - Regenerate with new theme

### Voice
- `POST /api/voice/transcribe` - Transcribe audio to text

### User Data
- `GET /api/websites` - Get user's websites
- `GET /api/credits` - Get credit balance
- `GET /api/dashboard` - Get dashboard data (websites + credits)

Full API documentation: http://localhost:8000/docs

---

## 🔒 Security Features

- ✅ **Supabase Auth** - Google OAuth with JWT tokens
- ✅ **Row Level Security (RLS)** - Database-level access control
- ✅ **Rate Limiting** - Upstash Redis with abuse detection
- ✅ **JWT Verification** - ES256 signature validation
- ✅ **Input Validation** - Pydantic models
- ✅ **CORS Protection** - Configured allowed origins
- ✅ **SQL Injection Prevention** - Parameterized queries
- ✅ **Credit System** - Prevent abuse with usage limits
- ✅ **Cloudflare Security** - DDoS protection, SSL, firewall

---

## 🚢 Deployment

### Frontend (Vercel)
```bash
cd frontend
vercel deploy --prod
```

### Backend (Railway with Cloudflare Tunnel)
1. Deploy to Railway
2. Set up Cloudflare Tunnel
3. Configure environment variables
4. Start Celery worker as separate service

### Cloudflare Pages
- Automatic deployment via Wrangler CLI from backend
- Each website gets unique branch: `<subdomain>.user-websites.pages.dev`

### Cloudflare Worker
```bash
cd proxy-worker
wrangler deploy
```

### Database (Supabase)
- Already hosted
- Run migrations via SQL Editor
- Enable RLS policies

---

## 🗺️ Development Phases

Based on `docs/phases.txt`:

- ✅ **Phase 1**: Landing Page + Waitlist
- ✅ **Phase 2**: Authentication (Google OAuth)
- ✅ **Phase 3**: Text → Website Generation (Draft Mode)
- ✅ **Phase 4**: Publishing Engine (Cloudflare Pages)
- ✅ **Phase 5**: Voice Input + Regional Language
- ✅ **Phase 6**: Website Editing + Redesign
- ✅ **Phase 7**: Credits, Free Tier & Abuse Control
- ✅ **Phase 8**: Dashboard (Control Room)
- 🔜 **Phase 9**: Custom Domains + Payments (Planned)

---

## 🤝 Collaboration

This is a **proprietary project** owned by **Shyamol Konwar**.

### Interested in Collaborating?

Contact the owner before contributing:
- GitHub: Create an issue with "Collaboration Request"
- All contributions require prior approval

---

## 📝 License & Copyright

**Copyright © 2025 Shyamol Konwar. All Rights Reserved.**

This project is proprietary software. See [LICENSE](./LICENSE) for full terms.

---

## 🙏 Acknowledgments

- **OpenAI** for GPT-3.5 and Whisper APIs
- **Supabase** for database and authentication
- **Cloudflare** for Pages, Workers, and CDN
- **Next.js** team for the framework
- **FastAPI** for the backend framework

---

**Copyright © 2025 Shyamol Konwar. All Rights Reserved.**

Built with ❤️ for local businesses in India
