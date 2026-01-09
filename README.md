# Vocoweb Free - Open Source AI Website Builder

> **The free & open-source version of [Vocoweb](https://vocoweb.com)**

Build professional websites using voice or text in English or Hindi. This is the community-driven, open-source edition of the paid Vocoweb platform.

[![Next.js](https://img.shields.io/badge/Next.js-16-black)](https://nextjs.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-Latest-009688)](https://fastapi.tiangolo.com/)
[![OpenAI](https://img.shields.io/badge/OpenAI-GPT--3.5-412991)](https://openai.com/)
[![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-3ECF8E)](https://supabase.com/)
[![Cloudflare](https://img.shields.io/badge/Cloudflare-Pages-F38020)](https://pages.cloudflare.com/)

---

## 🚀 Features

### 🤖 AI Website Generation
- **Text-to-Website**: Generate professional websites from a simple description.
- **Bilingual Support**: Create websites using instructions in English or Hindi.
- **Voice Input**: Describe your business using voice commands (OpenAI Whisper).
- **Industry Templates**: Intelligent layout selection based on business type.
- **Theme Variations**: Regenerate with different styles and color palettes.

### ⚡ Publishing & Performance
- **Instant Publishing**: Deploy to the live web in one click via Cloudflare Pages.
- **Global CDN**: Fast loading speeds worldwide.
- **Custom Domains**: Automatic subdomain generation on your own domain (e.g., `*.yourdomain.com`).
- **Mobile-First**: Fully responsive designs that look great on all devices.

### 🛡️ Security & Authentication
- **Secure Login**: Google OAuth authentication.
- **Row Level Security**: Data isolation ensuring users only see their own sites.
- **Rate Limiting**: Protection against abuse using Upstash Redis.
- **Credit System**: Usage tracking and quota management.

### 📊 Dashboard & Management
- **Central Control**: Manage all your drafts and published sites in one place.
- **Real-time Stats**: View credit usage and account status.
- **Preview Mode**: Test your site on mobile, tablet, and desktop views before publishing.

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
git clone <https://github.com/shyamolkonwar/vocoweb-free.git>
cd vocoweb-free
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
# - BASE_DOMAIN=yourdomain.com  # The root domain for published sites
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
echo "NEXT_PUBLIC_API_BASE_URL=http://localhost:8000" > .env.local
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
- **Published Sites**: `https://*.<your-domain>`

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
BASE_DOMAIN=yourdomain.com # Your root domain (e.g., mysaas.com)

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
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000
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

## 🌐 Custom Domain Integration

VocoWeb is designed to work with your own custom domain (e.g., `yourdomain.com`). This uses Cloudflare for DNS, Pages (hosting), and Workers (routing).

### 1. DNS Configuration (Cloudflare)
1. Add your domain to your Cloudflare account.
2. Ensure your domain's nameservers are pointed to Cloudflare.

### 2. Backend Configuration
Update your `backend/.env` file:
```env
# The root domain where user sites will be accessible (e.g., sub.yourdomain.com)
BASE_DOMAIN=yourdomain.com
```

### 3. Proxy Worker Setup
The `proxy-worker` handles routing requests from `*.yourdomain.com` to the correct Cloudflare Pages deployment.

1. **Edit `proxy-worker/wrangler.toml`**:
   Update the `routes` section:
   ```toml
   routes = [
     { pattern = "*.yourdomain.com/*", zone_name = "yourdomain.com" }
   ]
   ```

2. **Edit `proxy-worker/src/index.js`**:
   Update the root redirect (optional):
   ```javascript
   // Change 'https://yourdomain.com' to your main landing page URL
   return Response.redirect('https://yourdomain.com', 301);
   ```

3. **Deploy the Worker**:
   ```bash
   cd proxy-worker
   npm install
   wrangler deploy
   ```

### 4. Verification
Once deployed:
1. Create a new website via the Dashboard.
2. Publish it.
3. The link should now be `https://<subdomain>.yourdomain.com`.

---



---

## 🤝 Contributing

We welcome contributions to VocoWeb! This is an open-source project.

### How to Contribute

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

Please make sure to update tests as appropriate.

---

## 📝 License

Distributed under the MIT License. See [LICENSE](./LICENSE) for more information.

Copyright (c) 2026 Shyamol Konwar & Fusion Focus.

---

## 🙏 Acknowledgments

- **OpenAI** for GPT-3.5 and Whisper APIs
- **Supabase** for database and authentication
- **Cloudflare** for Pages, Workers, and CDN
- **Next.js** team for the framework
- **FastAPI** for the backend framework

---

Built with ❤️ for local businesses in India
