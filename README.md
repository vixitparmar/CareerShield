# 💼 CareerShield: Job Application Tracker & Risk Auditor

A corporate-grade, executive web platform designed to eliminate post-layoff recruitment fatigue, triage high-volume job applications, audit predatory recruitment scams, benchmark labeled job posting datasets (such as the Kaggle Real/Fake Job Postings dataset), and automate follow-ups for stalled submissions.

---

### 🌐 Environment & Production API Configuration

#### Frontend Environment Variable (`frontend/.env`):
```env
# In production, set to your deployed backend origin (e.g. https://api.careershield.yourdomain.com)
# If left blank, requests use relative paths (/api/...) matching current origin or Vite dev proxy
VITE_API_BASE_URL=
```

#### Centralized API Endpoints ([frontend/src/config.ts](file:///home/yagnesh/Desktop/Garbathon/frontend/src/config.ts)):
All endpoints dynamically prepend `VITE_API_BASE_URL`:
- `sampleInbox`: `${VITE_API_BASE_URL}/api/sample-inbox`
- `sampleKaggleCsv`: `${VITE_API_BASE_URL}/api/sample-kaggle-csv`
- `uploadCsv`: `${VITE_API_BASE_URL}/api/upload-csv`
- `auditDataset`: `${VITE_API_BASE_URL}/api/audit-dataset`
- `health`: `${VITE_API_BASE_URL}/api/health`

---

### 🎨 Professional Light Theme & Aesthetics
- **Page Background**: Warm off-white / light parchment (`#FAF9F6` / `#F8F7F4`).
- **Cards & Containers**: Pure solid white (`#FFFFFF`) with thin borders (`#E5E0D8`).
- **Primary Typography**: Deep charcoal brown (`#1F1D1A`) for high-contrast executive headers.
- **Secondary Typography**: Muted coffee / slate (`#5C554E`) for body and descriptive labels.
- **Accessible Light Status Badges**:
  - **Scam / Threat Flag**: Soft rose background (`#FEE2E2`), crimson border (`#FCA5A5`), crimson text (`#991B1B`).
  - **Follow-up Due**: Light amber background (`#FEF3C7`), amber border (`#FCD34D`), dark amber text (`#92400E`).
  - **Interviews / Verified Offers**: Light sage background (`#DCFCE7`), emerald border (`#86EFAC`), deep emerald text (`#166534`).
  - **Applied / Under Review**: Soft taupe-slate background (`#F1EFEA`) with dark neutral text (`#44403C`).
- **Design Philosophy**: Utilitarian, corporate, data-dense, and clean. **Strictly NO 3D scenes, NO floating spheres, NO glowing neon gradients, and NO frivolous animations.**

---

### 🏛️ Architecture & Features

#### 1. CSV Parser & Ingestion Pipeline (`backend/src/csvParser.ts`)
- Implements streaming CSV parsing with `csv-parser` and `multer`.
- Automatically normalizes standard Kaggle Real/Fake Job Postings columns:
  - `job_id` / `id`
  - `title` / `role`
  - `company_profile` / `company`
  - `description`, `requirements`, `benefits`
  - `telecommuting`, `has_company_logo`, `has_questions`
  - `fraudulent` (0 for real, 1 for scam/fake)
- Maps dates and synthetic enterprise vs free webmail domains. Caps batch responsiveness to 50 rows per upload.

#### 2. REST Endpoints (`backend/src/server.ts`)
1. `GET /api/sample-inbox`: Returns the original 15-email simulated post-layoff inbox.
2. `GET /api/sample-kaggle-csv`: Delivers pre-parsed rows from the local `fake_job_postings.csv` file without transferring 48MB across the wire.
3. `POST /api/upload-csv`: Ingests multipart `.csv` files or direct CSV strings, returning parsed records.
4. `POST /api/audit-dataset`: Evaluates records using Gemini AI (`responseSchema`) or deterministic fallback, computes follow-up eligibility ($\ge 7$ days from `2026-10-24`), and computes ground truth validation accuracy percentage.
5. `GET /api/health`: Operational health check.

#### 3. Frontend Dashboard (`frontend/src/App.tsx`)
- **CSV Ingestion Dropzone & Controls**:
  - Drag-and-drop CSV upload zone.
  - Quick action buttons: **Load Kaggle Sample CSV**, **Upload Custom CSV**, and **Candidate Inbox**.
  - Toggle switch: **Show Ground Truth Comparison** (displays whether model predictions match dataset labels).
- **5-Metric Executive Summary Ribbon**:
  1. *Records Ingested*
  2. *Active Pipelines* (Interviews & Verified Offers)
  3. *Scams Flagged* (Neutralized Threats)
  4. *Stalled Applications* (Follow-ups Due $\ge 7$ days)
  5. *Model Validation Score* (% accuracy vs dataset ground truth)
- **Data Table & Filtering**:
  - Filter by `All Records`, `Scams Flagged`, `Genuine Roles`, `Follow-ups Due`, `Applied`.
  - Conditional ground truth comparison column with match verification indicators (`✓` / `✕`).
- **Detail Slide-Over Drawer**:
  - Forensic risk audit breakdown with Gemini confidence score and bulleted risk vectors.
  - Editable follow-up drafting textarea with a 1-click "Copy to Clipboard" action.
  - Full job description and composite requirements viewer.

---

### 🚀 Running the Platform

1. **Backend Server** (active on port `5001`):
   ```bash
   cd backend
   npm run dev
   # or: node dist/server.js
   ```

2. **Frontend Development Server**:
   ```bash
   cd frontend
   npm run dev
   ```
   Access the dashboard at `http://localhost:5173`.
