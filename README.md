# AI App Builder Engine

A fully-monetized, production-ready AI app builder platform with **multi-provider AI** and **coordinated multi-agent workflows**.

## 🚀 Key Features

### Multi-Provider AI (Free Models)
- **OpenRouter** - Access to 20+ free models (Llama, DeepSeek, Qwen, Gemini Flash)
- **Groq** - Ultra-fast inference (30 req/min, 14.4K/day free)
- **Gemini** - Google's free tier (60 req/min, 1.5K/day)
- **OpenAI** - Premium fallback when free models fail
- **Intelligent Fallback** - Auto-switch providers on rate limits or failures

### Multi-Agent Workflow System
**10 specialized AI agents working together:**

| Phase | Agent | Role |
|-------|-------|------|
| **Planning** | 🧭 Architect | System design & tech stack |
| **Planning** | 🎯 Product Manager | Requirements & user flows |
| **Development** | 💻 Frontend Dev | React components & UI |
| **Development** | ⚙️ Backend Dev | API routes & logic |
| **Development** | 🗄️ Database Dev | Schema & migrations |
| **Production** | 🛡️ Security Engineer | Audits & vulnerabilities |
| **Production** | ⚡ Performance Engineer | Optimizations |
| **Production** | ✅ QA Engineer | Tests & coverage |
| **Production** | 🔀 DevOps Engineer | CI/CD & infrastructure |
| **Deployment** | 🚀 Deployment Engineer | Go live |

Each agent:
- Has specialized system prompts
- Waits for dependencies
- Parses structured outputs
- Falls back on failure
- Tracks token usage & timing

## 💰 Pricing Model

### Subscription Plans
| Plan | Price | Credits | AI Generations | Features |
|------|-------|---------|----------------|----------|
| **Starter** | $5.99/mo | 500 | ~40 | Basic editor, 5GB |
| **Pro** | $15.99/mo | 5,000 | ~400 | Unlimited, Git, 50GB |
| **Premium** | $29.99/mo | 15,000 | ~1,200 | CI/CD, agents, 200GB |
| **Enterprise** | $150/mo | 50,000 | ~4,000 | SSO, SLA, 1TB |

### Credit Costs (with margin)
| Action | Credits | Your Price | OpenAI Cost | Margin |
|--------|---------|------------|-------------|--------|
| AI Generation | 12-15 | $0.12-$0.15 | $0.01-$0.06 | **100-1100%** |
| AI Chat | 5 | $0.05 | $0.01 | **400%** |
| Mobile Build | 120 | $1.20 | - | Infrastructure |
| Custom Domain | 200/mo | $2.00 | - | Fixed cost |

## 🎯 Quick Start

```bash
# Install dependencies
npm install

# Set up environment
cp .env.example .env.local
# Add your API keys

# Run locally
npm run dev

# Deploy to Vercel
vercel --prod
```

## 🔑 Required API Keys

```env
# AI Providers (all offer free tiers)
OPENAI_API_KEY=sk-...           # Fallback paid
OPENROUTER_API_KEY=sk-or-v1-... # Free models
GROQ_API_KEY=gsk_...            # Fast free models
GEMINI_API_KEY=AIza...          # Google's free tier

# Database
SUPABASE_URL=https://...
SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...

# Auth
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_...
CLERK_SECRET_KEY=sk_...

# Payments
STRIPE_SECRET_KEY=sk_...
STRIPE_PUBLISHABLE_KEY=pk_...

# Deployment
VERCEL_TOKEN=...
```

## 📊 Architecture

```
User Request
    ↓
┌─────────────────────────────────────┐
│  Multi-Provider AI Router          │
│  - Tries free models first         │
│  - Auto-fallback on failure        │
│  - Tracks cost per provider        │
└─────────────────────────────────────┘
    ↓
┌─────────────────────────────────────┐
│  Agent Orchestrator                │
│  - Coordinates 10 agents           │
│  - Manages dependencies            │
│  - Parallel execution              │
│  - Retry with fallbacks            │
└─────────────────────────────────────┘
    ↓
┌─────────────────────────────────────┐
│  Output Pipeline                   │
│  - Parse code blocks               │
│  - Categorize files                │
│  - Store to database               │
└─────────────────────────────────────┘
    ↓
Live Application
```

## 🛠️ Database Schema

Run migrations:
```sql
-- 001_create_projects.sql
-- 002_enable_realtime.sql
-- 003_agent_workflows.sql  ← New multi-agent tables
```

## 📈 Revenue Projections

| Customer Type | Monthly Revenue |
|---------------|-----------------|
| Starter + usage | $5.99 + $5 = **$10.99** |
| Pro typical | $15.99 + $15 = **$30.99** |
| Premium team | $29.99 + $30 = **$59.99** |
| Enterprise | $150 + $100 = **$250.00** |
| **10 customers** | **$600-2,500/mo** |
| **100 customers** | **$6,000-25,000/mo** |

## 🚦 Status

✅ Core AI Generation  
✅ Multi-File Project System  
✅ Monaco Code Editor  
✅ Live Preview Engine  
✅ Deployment Engine  
✅ Auth System (Clerk)  
✅ Billing (Stripe)  
✅ Error Handling  
✅ Dashboard UI  
✅ **Multi-Provider AI** (NEW)  
✅ **Multi-Agent Workflow** (NEW)  
✅ Team Workspaces  
✅ CI/CD Pipeline  
✅ Custom Domains  
✅ Plugin System  
✅ AI Agents  
✅ Mobile Export  
✅ Analytics  

---

Built for Vercel deployment. Zero infrastructure costs using free AI tiers.
