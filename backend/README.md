# PRAHARI Backend — Setup & Run Guide

## Prerequisites

- Python 3.11+
- pip

## Setup

```bash
# 1. Navigate to the backend directory
cd MPLADs-main/backend

# 2. Create a virtual environment
python -m venv venv

# 3. Activate it
# Windows:
venv\Scripts\activate
# macOS/Linux:
source venv/bin/activate

# 4. Install dependencies
pip install -r requirements.txt

# 5. Configure Gemini API Key
copy .env.example .env
# Edit .env and set: GEMINI_API_KEY=your_key_here
```

## Running the Server

```bash
# From the MPLADs-main/ root (not inside /backend):
uvicorn backend.main:app --reload --port 8000
```

The API will be available at `http://localhost:8000`.

## Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/health` | Health check |
| GET | `/api/projects` | List all MPLADS projects |
| GET | `/api/projects/{id}` | Get single project with risk analysis |
| POST | `/api/projects/{id}/generate-story` | Generate AI risk explanation |
| POST | `/api/verify-evidence` | AI evidence authenticity check |
| POST | `/api/complaints/submit` | Register citizen grievance |
| POST | `/api/investigations/{id}/action` | Record investigation action |
| GET | `/api/investigations/{id}/history` | Get case audit trail |

## Interactive Docs

Visit `http://localhost:8000/docs` for the Swagger UI.

## Offline / No-Key Mode

If `GEMINI_API_KEY` is not set, all AI endpoints gracefully fall back to
deterministic local analysis. The frontend also has its own offline fallback
in `src/api/client.js` — the app remains fully functional without the backend.

## Frontend Configuration

Set the backend URL in `MPLADs-main/.env`:
```
VITE_API_URL=http://localhost:8000
```
