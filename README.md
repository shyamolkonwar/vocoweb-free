# Setu - AI Website Builder for Local Businesses

> **Build professional websites using voice or text in English or Hindi**

An AI-powered platform that enables non-technical local business owners to create, preview, and publish professional websites instantly.

[![Next.js](https://img.shields.io/badge/Next.js-14-black)](https://nextjs.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.109-009688)](https://fastapi.tiangolo.com/)
[![OpenAI](https://img.shields.io/badge/OpenAI-GPT--3.5-412991)](https://openai.com/)
[![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-3ECF8E)](https://supabase.com/)

---

## 🚀 Features

### ✅ Phase 1: Landing Page + Waitlist
- Mobile-first responsive landing page
- Bilingual support (English/Hindi)
- Secure waitlist with Supabase
- Rate limiting & duplicate prevention
- Row Level Security (RLS)

### ✅ Phase 2: AI Website Generator
- Text-to-website using OpenAI GPT-3.5
- Automatic business type detection
- Industry-specific templates
- Mobile/Desktop preview
- Regenerate with theme variations

### ✅ Phase 3: Publish Engine
- 1-click publish functionality
- Auto subdomain generation
- Static HTML hosting
- Live URL generation
- Instant updates

---

## 🛠️ Tech Stack

### Frontend
- **Framework**: Next.js 14 (App Router)
- **Styling**: Tailwind CSS + Custom CSS
- **Language**: TypeScript
- **Deployment**: Vercel (recommended)

### Backend
- **Framework**: FastAPI (Python 3.12+)
- **AI**: OpenAI GPT-3.5 Turbo
- **Database**: Supabase (PostgreSQL)
- **Deployment**: Railway/Render (recommended)

---

## 📋 Prerequisites

- **Node.js** 18+ and npm
- **Python** 3.12+
- **OpenAI API Key** ([Get one here](https://platform.openai.com/api-keys))
- **Supabase Account** ([Sign up free](https://supabase.com))

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
# - OPENAI_API_KEY
# - SUPABASE_URL
# - SUPABASE_SERVICE_KEY
```

### 3. Supabase Database Setup

1. Create a new Supabase project
2. Go to **SQL Editor** in Supabase dashboard
3. Run the schema from `backend/supabase_schema.sql`
4. Copy your credentials to `backend/.env`

### 4. Frontend Setup

```bash
# Navigate to frontend
cd frontend

# Install dependencies
npm install

# Create .env.local (optional)
echo "BACKEND_URL=http://localhost:8000" > .env.local
```

### 5. Start Development Servers

```bash
# Terminal 1: Backend
cd backend
python -m uvicorn app.main:app --reload

# Terminal 2: Frontend
cd frontend
npm run dev
```

### 6. Access the Application

- **Landing Page**: http://localhost:3000
- **Create Website**: http://localhost:3000/create
- **API Documentation**: http://localhost:8000/docs
- **Published Sites**: http://localhost:8000/sites/{subdomain}

---

## 📁 Project Structure

```
website-builder-fusion-focus/
├── frontend/                 # Next.js frontend
│   ├── src/
│   │   ├── app/             # App router pages
│   │   │   ├── page.tsx     # Landing page
│   │   │   ├── create/      # Website creation
│   │   │   ├── preview/     # Website preview
│   │   │   └── api/         # API routes (proxy to backend)
│   │   └── components/      # React components
│   ├── public/              # Static assets
│   └── package.json
│
├── backend/                 # FastAPI backend
│   ├── app/
│   │   ├── main.py         # FastAPI app entry
│   │   ├── core/           # Configuration
│   │   ├── api/            # API routes
│   │   │   └── routes/     # Endpoint definitions
│   │   ├── ai/             # AI modules
│   │   │   ├── business_parser.py  # OpenAI integration
│   │   │   └── layout_selector.py  # Template selection
│   │   ├── website/        # Website builder
│   │   └── services/       # Business logic
│   │       ├── supabase.py # Database operations
│   │       ├── rate_limiter.py
│   │       └── deploy.py   # Publishing logic
│   ├── data/               # Generated websites (gitignored)
│   ├── supabase_schema.sql # Database schema
│   └── requirements.txt
│
├── docs/                   # Project documentation
│   ├── branding.txt       # Brand guidelines
│   ├── phases.txt         # Development phases
│   └── project_description.txt
│
└── README.md              # This file
```

---

## 🔐 Environment Variables

### Backend (`backend/.env`)

```env
# OpenAI
OPENAI_API_KEY=sk-proj-...

# Supabase
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_SERVICE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Server
HOST=0.0.0.0
PORT=8000
DEBUG=true
```

### Frontend (`frontend/.env.local`) - Optional

```env
BACKEND_URL=http://localhost:8000
```

---

## 🧪 Testing

### Test Waitlist Submission

```bash
curl -X POST http://localhost:8000/api/waitlist \
  -H "Content-Type: application/json" \
  -d '{
    "contact": "test@example.com",
    "contact_type": "email",
    "business_description": "Test business",
    "language": "en"
  }'
```

### Test Website Generation

```bash
curl -X POST http://localhost:8000/api/generate \
  -H "Content-Type: application/json" \
  -d '{
    "description": "I run a bakery in Delhi. We sell cakes and pastries.",
    "language": "en"
  }'
```

### Test Rate Limiting

Run 6 requests rapidly - the 6th should be blocked:

```bash
for i in {1..6}; do
  curl -X POST http://localhost:8000/api/waitlist \
    -H "Content-Type: application/json" \
    -d '{"contact":"test'$i'@example.com","contact_type":"email"}'
  echo ""
done
```

---

## 🔒 Security Features

- ✅ **Row Level Security (RLS)** - Supabase policies prevent unauthorized access
- ✅ **Rate Limiting** - 5 requests per IP per hour on waitlist
- ✅ **Input Validation** - Pydantic models validate all inputs
- ✅ **Duplicate Prevention** - Checks for existing contacts
- ✅ **IP Logging** - Tracks requests for abuse detection
- ✅ **Environment Security** - Sensitive keys never exposed to frontend
- ✅ **CORS Protection** - Configured allowed origins
- ✅ **SQL Injection Prevention** - Parameterized queries

---

## 📊 API Endpoints

### Waitlist
- `POST /api/waitlist` - Join waitlist (rate limited)
- `GET /api/waitlist/count` - Get total count

### Website Generation
- `POST /api/generate` - Generate website from text
- `GET /api/preview/{id}` - Get website preview
- `POST /api/regenerate/{id}` - Regenerate with new theme

### Publishing
- `POST /api/publish/{id}` - Publish website
- `POST /api/republish/{id}` - Update published site
- `GET /api/publish/{id}/status` - Check publish status
- `GET /sites/{subdomain}` - Serve published site

Full API documentation: http://localhost:8000/docs

---

## 🚢 Deployment

### Frontend (Vercel)

```bash
cd frontend
vercel deploy
```

### Backend (Railway)

1. Create new project on [Railway](https://railway.app)
2. Connect your GitHub repository
3. Add environment variables
4. Deploy automatically on push

### Database (Supabase)

Already hosted! Just use your production credentials.

---

## 🗺️ Roadmap

### Phase 4: Voice Input (Planned)
- [ ] Voice recording interface
- [ ] Whisper API integration
- [ ] Speech-to-text processing

### Phase 5: Visual Editor (Planned)
- [ ] Drag-and-drop editing
- [ ] Image upload
- [ ] Section management
- [ ] Color customization

### Phase 6: Custom Domains (Planned)
- [ ] Domain connection
- [ ] SSL certificates
- [ ] DNS configuration

---

## 🤝 Collaboration

This is a **proprietary project** owned by **Shyamol Konwar**.

### Interested in Collaborating?

If you'd like to contribute or collaborate on this project:

1. **Review the codebase** for understanding
2. **Contact the owner** with your proposal
3. **Discuss collaboration terms** before contributing
4. **Sign a collaboration agreement** if approved

**Contact:**
- GitHub: [Create an issue](../../issues) with "Collaboration Request" label
- Email: [Your Email Here]

All contributions require prior approval and will be subject to the project's proprietary license.

---

## 📝 License & Copyright

**Copyright © 2025 Shyamol Konwar. All Rights Reserved.**

This project is proprietary software. Unauthorized copying, distribution, modification, or use is strictly prohibited.

See the [LICENSE](./LICENSE) file for full terms and conditions.

### Usage Rights

- ✅ View source code for educational purposes
- ✅ Request collaboration with owner approval
- ❌ No redistribution without permission
- ❌ No commercial use without license
- ❌ No derivative works without permission

---

## 🙏 Acknowledgments

- **OpenAI** for GPT-3.5 Turbo API
- **Supabase** for database and authentication
- **Next.js** team for the amazing framework
- **FastAPI** for the high-performance backend framework

---

## 📧 Support

For questions or support:
- Open an issue on GitHub
- Check the [documentation](./docs/)
- Review the [walkthrough](./docs/walkthrough.md)

---

## 🌟 Star History

If you find this project useful, please consider giving it a star ⭐

---

**Copyright © 2025 Shyamol Konwar. All Rights Reserved.**

Built with ❤️ for local businesses in India
