# ImmigAI — Startup Visa Co-Pilot

AI-powered immigration intelligence platform for startup founders, co-founders, employees, and travelers.

## Quick Start

### 1. Backend setup

```bash
cd backend
npm install
cp .env.example .env
# Add your OPENAI_API_KEY to .env
npm run dev
```

### 2. Frontend setup

```bash
cd frontend
npm install
npm run dev
```

Frontend runs at: http://localhost:5173
Backend runs at:  http://localhost:3001

---

## Project Structure

```
law/
├── backend/
│   ├── src/
│   │   ├── server.js              # Express app entry point
│   │   ├── db/
│   │   │   ├── database.js        # SQLite connection (better-sqlite3)
│   │   │   └── migrate.js         # Auto-runs schema on startup
│   │   ├── config/
│   │   │   └── openai.js          # OpenAI client (GPT-4o)
│   │   ├── data/
│   │   │   ├── visaRules.js       # USCIS criteria knowledge base
│   │   │   └── letterTemplates.js # Letter types + legal basis
│   │   ├── agents/
│   │   │   ├── visaStrategyAgent.js    # Visa pathway matching + scoring
│   │   │   ├── travelIntelAgent.js     # Travel risk assessment
│   │   │   ├── documentDrafterAgent.js # All letter/petition generation
│   │   │   └── trustLayer.js           # Citation check + confidence scoring
│   │   ├── routes/
│   │   │   ├── users.js       # Profile CRUD
│   │   │   ├── visa.js        # Visa analysis
│   │   │   ├── travel.js      # Travel advisory + letters
│   │   │   └── documents.js   # Document generation + PDF download
│   │   └── utils/
│   │       └── pdfGenerator.js # PDFKit letter renderer
└── frontend/
    └── src/
        ├── App.jsx              # Router + user context
        ├── api/client.js        # All API calls
        ├── pages/
        │   ├── Onboarding.jsx   # 3-step signup + persona selection
        │   ├── Dashboard.jsx    # Overview + alerts
        │   ├── VisaStrategy.jsx # Visa pathway analysis
        │   ├── TravelAdvisory.jsx # Travel risk + airport letters
        │   └── DocumentStudio.jsx # All documents + RFE Shield
        └── components/
            └── Navbar.jsx
```

---

## Sponsor Integrations vs Free Alternatives

Every sponsor integration has a working free alternative built-in. The app works out of the box with just your OpenAI key.

| Feature | Sponsor | Free Alternative (default) | How to switch |
|---|---|---|---|
| Legal case law corpus | **LexisNexis** | CourtListener free API | Set `LEXISNEXIS_API_KEY` in .env |
| Case management output | **Filevine** | Local PDF download | Set `FILEVINE_API_KEY` + `FILEVINE_ORG_ID` |
| Legal-domain embeddings | **HuggingFace** | OpenAI text-embedding-3-small | Set `USE_HUGGINGFACE_EMBEDDINGS=true` |
| Compliance rules engine | **Norm.AI** | Built-in rules engine | Set `NORMAI_API_KEY` |
| AI safety/trust audit | **Trust Foundry** | Built-in citation scorer | Set `TRUST_FOUNDRY_API_KEY` |
| LLM backbone | OpenAI GPT-4o | — | Required: `OPENAI_API_KEY` |

Check which integrations are active: `GET http://localhost:3001/health`

---

## User Personas

| Persona | Key Features |
|---|---|
| **Founder** | O-1A/EB-1A/NIW pathway, equity impact analysis, founder role letters |
| **Co-Founder** | Equity split advice, role delineation, separate petition strategy |
| **Employee** | H-1B/TN/L-1 sponsorship, grace period rules, offer letters |
| **Pre-Incorporation** | LLC vs C-Corp visa impact, first steps checklist, B-1 guidance |
| **Traveler** | Full risk assessment, re-entry analysis, airport letter generator |

---

## Core Features

### Visa Strategy Agent
- Scores fit for O-1A, EB-1A, EB-2 NIW, H-1B, L-1A, TN, E-2
- Evidence gap analysis with specific, actionable steps
- Timeline + cost comparison across pathways
- Cites specific USCIS regulations per criterion

### Travel Intelligence Agent
- Risk levels: LOW / MEDIUM / HIGH / CRITICAL
- Unlawful presence calculator
- Handles: third-country travel, home country visits, pending I-485, DACA, expired visas
- "What to say / not say" at the border
- Document checklist per scenario

### Document Drafter Agent
- 10+ letter types (employment verification, business travel, founder role, advance parole, re-entry, B-1 purpose, offer letter, RFE response cover, etc.)
- RFE Shield: paste RFE text → get drafted response with case law citations
- Every letter auto-filled from your profile
- PDF download via PDFKit

### Trust & Safety Layer
- Confidence score (0-100) on every output
- Citation verification against known USCIS/INA sources
- Hallucination firewall
- Attorney review gate
- Disclaimer on every document

---

## API Endpoints

```
POST /api/users                     Create profile
GET  /api/users/:id                 Get profile

POST /api/visa/analyze/:userId      Run visa analysis
GET  /api/visa/assessments/:userId  Get saved assessments

POST /api/travel/assess/:userId     Travel risk assessment
POST /api/travel/letter/:userId     Generate travel letter
GET  /api/travel/history/:userId    Past travel advisories

GET  /api/documents/templates       List all letter types
POST /api/documents/generate/:userId Generate any document
POST /api/documents/rfe/:userId     Generate RFE response
GET  /api/documents/user/:userId    List user's documents
GET  /api/documents/:id/pdf         Download PDF
PATCH /api/documents/:id/review     Mark attorney reviewed
```

---

## Tech Stack

- **Frontend:** React 18 + Vite + Tailwind CSS + React Router
- **Backend:** Node.js + Express
- **Database:** SQLite (better-sqlite3, local file)
- **LLM:** OpenAI GPT-4o (structured JSON outputs)
- **PDF:** PDFKit
- **Icons:** Lucide React

---

## Hackathon Notes

**Build on Day 1 (demo-ready):**
1. Onboarding → profile creation
2. Visa Strategy analysis (the "aha" moment)
3. Travel Advisory + one airport letter generated as PDF

**Show as roadmap in pitch:**
- Real-time USCIS policy monitoring
- LexisNexis deep citation integration
- Filevine case management push
- Multi-language support (ElAbogado / Spanish)
- M&A immigration risk audit (VisaDiligence module)

**Trust & Safety pitch line:**
> "Every claim cites a specific USCIS regulation. The model never fabricates a citation. The attorney always reviews before anything is filed."
# law
