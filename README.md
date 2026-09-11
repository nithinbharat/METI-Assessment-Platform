# METI Assessment Platform

A high-performance, full-stack enterprise assessment, testing, proctoring, and AI-driven candidate evaluation platform built with **Next.js 14 (App Router & TypeScript)**, **FastAPI (Python Asynchronous)**, and **PostgreSQL**.

The **METI Assessment Platform** provides an end-to-end digital examination and evaluation ecosystem. It enables organizations to create, deliver, proctor, and automatically grade standardized examinations, multiple-choice tests, true/false questions, short-answer items, and live coding challenges with multi-language execution sandboxes. Additionally, the platform integrates **MediaPipe Vision AI Face Detection Proctoring**, active **Tab & Window Focus Security Monitoring**, and an innovative **AI Resume Interview Engine** that parses candidate resumes (PDF/TXT), extracts technical skill taxonomies, and delivers adaptive skill verification with real-time confidence scoring and intelligent clarification branching.

---

## Project Overview

The **METI Assessment Platform** bridges the gap between static testing tools and dynamic, security-conscious, skill-focused candidate evaluation. It caters to enterprise recruitment teams, educational institutions, and technical bootcamps by providing a secure, role-separated platform for assessment management, anti-cheating enforcement, and deep technical evaluation.

### Target Users
* **Platform Administrators & Evaluators**: Test authors and hiring leads who create categories, construct assessments, author question banks with code templates and test cases, configure proctoring controls (webcam, face detection, tab monitoring, fullscreen), monitor attempt histories, inspect security violation logs, and review analytical metrics across the platform.
* **Candidates & Students**: Test takers who register, log in, browse active assessments, participate in timed examination rooms with live webcam proctoring matrices and live code sandboxes, receive automated grading breakdowns with rationale explanations, and undertake AI-powered resume skill assessments.

### Main Workflow
1. **Authentication & Identity Management**: Candidates and administrators authenticate via OAuth2 Bearer password flow receiving JWT tokens signed with `HS256`. Passwords are encrypted using one-way `bcrypt` hashing.
2. **Assessment Discovery & Selection**: Candidates browse active assessments categorized by domain (e.g., Software Engineering, Data Science & AI), inspecting duration limits, question formats, passing score thresholds, and proctoring requirements.
3. **Proctoring Validation & Live Examination Execution**: 
   - When launching a proctored assessment, the client runs MediaPipe AI face detection checks (confirming one candidate present) and verifies full-screen state.
   - Questions and options are dynamically shuffled per attempt to eliminate peer cheating.
   - The distraction-free exam room features countdown timers, question status matrices (answered, un-answered, flagged), live code execution sandboxes, and file upload solution handlers.
   - Background listeners capture security violations (tab switching, window blur, loss of face detection) and log them to the backend in real time.
4. **Automated Evaluation & Score Breakdown**: Upon manual submission or automatic timer expiration, the backend grading engine evaluates submissions against stored answer criteria, computes total scores, calculates percentage marks, determines pass/fail status, and generates itemized question explanations.
5. **AI Resume Skill Adaptive Assessment**: Candidates upload PDF/TXT resumes. The backend extracts text using `pypdf`, parses key technical skills via regex taxonomy matching, and initiates an adaptive session. An AI evaluator asks skill-targeted questions, measures response confidence, and dynamically branches to follow-up clarification questions or advances to subsequent resume topics.
6. **EVE Interactive Assistant**: An animated CSS 3D robot assistant (EVE) provides voice-guided platform FAQs, knowledge queries, and role-based assistance during dashboard navigation, while intelligently self-disabling during active exam writing and AI resume evaluations to preserve testing integrity.

---

## Problem Statement

Traditional assessment and recruitment testing systems suffer from several technical and operational inefficiencies:

* **Manual & Error-Prone Evaluation**: Grading mixed question types (MCQs, True/False, and Short Answer text) manually requires significant administrative overhead and slows down result dissemination.
* **Lack of Real-Time Attempt Enforcement**: Standard web forms fail to enforce strict test durations, leaving room for unauthorized delays and un-synchronized test state.
* **Vulnerability to Cheating & Collaboration**: Without tab monitoring, fullscreen enforcement, face detection, or question/option order randomization, candidates can easily collaborate, switch tabs for answers, or have someone else take the exam.
* **Absence of Practical Coding Evaluation**: Typical platforms only test rote memorization via MCQs, lacking built-in sandboxes to compile and execute actual code in Python, JavaScript, C++, or SQL.
* **Rigid Static Tests**: Conventional assessment tools deliver identical static questions to every candidate, failing to evaluate specific skills listed on individual candidate resumes.
* **Opaque Candidate Feedback**: Standard testing platforms report simple overall percentages without detailing question-by-question explanations, correct answer references, or performance leaderboards.
* **Weak Access Controls & Unencrypted Credentials**: Legacy tools often store credentials in plaintext or fail to restrict administrative actions to verified system administrators.

The **METI Assessment Platform** directly addresses these challenges by implementing an asynchronous backend engine, strict role-based authorization middleware, client-side persistent timers with auto-submission, automated multi-format grading, live isolated code execution sandboxes, MediaPipe AI vision proctoring, security event tracking, and resume-driven adaptive skill assessment.

---

## Project Objectives

* **Centralized Assessment Administration**: Provide administrators with a control center to manage categories, assessments, questions, options, code templates, proctoring policies, and pass/fail thresholds.
* **Secure Authentication & RBAC**: Enforce server-side role-based access control distinguishing between `ADMIN` and `CANDIDATE` roles using JWT tokens and `bcrypt` password hashing.
* **Asynchronous High-Performance API**: Deliver responsive, asynchronous REST endpoints using FastAPI and Async SQLAlchemy 2.0 with PostgreSQL/SQLite.
* **Live Anti-Cheating & Proctoring**: Integrate client-side MediaPipe Tasks Vision face detection, browser tab focus tracking, and fullscreen enforcement logging into backend `security_events`.
* **Multi-Language Code Runner Sandbox**: Enable candidates to write and execute code in Python, JavaScript, C++, and SQL directly within the browser with output, stderr, and execution benchmarks.
* **Question & Option Randomization**: Prevent question leaking and cheating by shuffling question order and option sequences per candidate attempt.
* **Distraction-Free Exam Room**: Implement a responsive Next.js exam UI complete with real-time countdown timers, question flagging, and auto-submission on expiration.
* **Automated Grading Engine**: Calculate exact score metrics, overall percentages, and pass/fail outcomes instantly upon submission.
* **AI Resume Parsing & Adaptive Testing**: Parse technical skills from candidate resumes and execute adaptive interview sessions with dynamic evaluation status (`CONFIDENT` vs `NEEDS_CLARIFICATION`).
* **Interactive AI Platform Assistant**: Incorporate EVE, a voice-enabled platform assistant with intelligent context-aware deactivation during active test sessions.
* **Analytical Dashboards & Leaderboards**: Render summary analytics for administrators and candidate-specific attempt histories and assessment leaderboards.
* **Containerized Deployment**: Provide container orchestration with Docker and Docker Compose for PostgreSQL, FastAPI, and Next.js services.

---

## Main Features

### 1. User Authentication & Authorization
* **Self-Service Candidate Registration**: Candidates register with full name, email, and password via `POST /api/v1/auth/signup`.
* **OAuth2 JWT Token Authentication**: Login endpoint `POST /api/v1/auth/login` verifies credentials and returns a Bearer access token containing user identity and role claims (`sub`, `role`, `exp`).
* **Bcrypt Password Security**: Passwords are salted and hashed using `bcrypt` prior to database persistence.
* **Protected Session Hydration**: Next.js client hydrates authentication state from `localStorage` and verifies validity via `GET /api/v1/auth/me`.

### 2. Role-Based Access Control (RBAC)
* **Strict Server-Side Enforcement**: Backend dependencies `get_current_user` and `get_current_admin` validate JWT tokens and verify user roles before granting access to protected routes.
* **Admin Control Rights**: Exclusive permissions to create/delete assessments, author questions, configure proctoring, inspect all candidate attempts, review security violations, and view system-wide analytics.
* **Candidate Rights**: Permissions to list active assessments, start attempts, run sandbox code, upload solutions, submit answers, view personal result details, upload resumes, and engage in adaptive assessments.

### 3. Assessment Management & Category Organization
* **Category Tagging**: Assessments are organized under domain categories (e.g., Software Engineering, Data Science & AI).
* **Assessment Configuration**: Admins configure title, description, time limit (minutes), passing score percentage, active/inactive status, and granular proctoring switches (`is_proctored`, `tab_monitoring_enabled`, `fullscreen_required`, `webcam_monitoring_enabled`, `face_monitoring_enabled`).
* **Cascade Deletion**: Deleting an assessment cleanly removes associated questions, options, attempts, answers, and security events.

### 4. Question & Option Authoring
* **Multiple Question Types**: Supports `MCQ` (Multiple Choice Questions), `TRUE_FALSE`, `SHORT_TEXT`, `CODING`, and `FILE_UPLOAD` question formats.
* **Live Coding Authoring**: Define starter code templates, target programming languages (`python`, `javascript`, `cpp`, `sql`), and unit test cases.
* **Points & Explanations**: Custom point weightings per question and explanations displayed to candidates during post-exam review.
* **Option Association**: Multi-option creation with strict correctness flagging (`is_correct`).

### 5. Multi-Modal Security & Anti-Cheating Engine
* **MediaPipe AI Face Detection**: Uses Google's `@mediapipe/tasks-vision` FilesetResolver to detect candidate face presence in real time through the webcam:
  * `ONE_FACE`: Normal valid test state.
  * `NO_FACE`: Alert triggered if candidate steps away from the camera.
  * `MULTIPLE_FACES`: Alert triggered if an unauthorized person enters the frame.
* **Tab & Window Focus Tracking**: Detects when a candidate switches browser tabs or minimizes windows (`TAB_SWITCH`, `WINDOW_BLUR`).
* **Fullscreen Enforcement**: Enforces browser fullscreen mode and flags `FULLSCREEN_EXIT` violations.
* **Security Event Persistence**: All violations are logged via `POST /api/v1/attempts/{id}/security-event` and permanently stored in the `security_events` database table for administrative review.
* **Question & Option Randomization**: Shuffles questions and option orders uniquely per attempt, preventing peer-to-peer screen copying.

### 6. Timed Live Examination Room & Code Sandbox
* **Real-Time Client Countdown**: Next.js exam UI tracks remaining time with a live JavaScript timer hook.
* **Live Sandbox Execution**: `POST /api/v1/assessments/run-code` executes candidate solutions inside an isolated subprocess sandbox with configurable timeouts, capturing stdout, stderr, and execution benchmarks.
* **Solution File Uploads**: `POST /api/v1/assessments/upload-solution` handles architecture diagram and code project uploads.
* **Question Navigation Matrix**: Candidates can jump directly to any question, monitor completion state (answered vs un-answered), and toggle question review flags.
* **Auto-Submission**: When the timer reaches zero, the interface automatically triggers the submission payload, preventing post-expiry edits.

### 7. Automated Scoring & Multi-Format Grading Engine
* **Instant Evaluation**: Backend `grading.py` module evaluates candidate submissions against database option keys and text representations.
* **Score & Percentage Calculation**: Computes `score_obtained`, `max_score`, `percentage`, and sets `passed` status based on the assessment's passing threshold.
* **Attempt State Transition**: Updates attempt status from `IN_PROGRESS` to `COMPLETED` and records exact `completed_at` timestamps.

### 8. Post-Exam Results & Performance Review
* **Candidate Result Summary**: Detailed breakdown showing total score, percentage, pass/fail badge, and completion timestamps.
* **Question-by-Question Review**: Shows question text, candidate's selected option/text response/code, correctness indicator, awarded points, correct answer reference, and rationale explanation.
* **Security Violation Audit**: Summarizes all recorded security events (tab switches, webcam anomalies) for review.

### 9. Dashboards & Analytics
* **Candidate Dashboard**: Displays overall attempt metrics, list of active assessments with direct "Start Assessment" launchers, and past attempt history table.
* **Admin Control Center**: Visualizes platform-wide metrics (total assessments, total registered candidates, total completed attempts, aggregate pass rate percentage) with candidate attempt review modals.
* **Assessment Leaderboards**: Public/Admin leaderboard (`GET /api/v1/analytics/leaderboard/{assessment_id}`) ranking candidate attempts by highest percentage score and fastest completion time.

### 10. AI Resume Skill Extraction & Adaptive Assessment
* **Resume Document Parsing**: Upload PDF or TXT resumes via `POST /api/v1/resume/upload` using `pypdf` text extraction.
* **Skill Taxonomy Matching**: Regex taxonomy matcher identifies technical skills (e.g., Python, Next.js, React, FastAPI, SQL, Docker).
* **Adaptive Question Generator**: Generates primary topic questions tailored to parsed resume skills (`ai_evaluator.py`).
* **Confidence Scoring & Intelligent Branching**: Evaluates candidate answers, assigns a confidence score (0.0 to 1.0), and assigns evaluation status:
  * `CONFIDENT` (score ≥ 0.70): Advances to the next resume skill.
  * `NEEDS_CLARIFICATION` (score < 0.70): Generates a targeted follow-up clarification question on the same topic.

### 11. Interactive EVE Assistant Chatbot
* **Animated 3D Robot UI**: Crafted using smooth CSS keyframes and animations inspired by Wall-E / EVE with multiple states (`idle`, `thinking`, `answering`, `chat_open`).
* **Voice Speech Synthesis**: Reads answers aloud using native Web Speech API voices.
* **Platform Knowledge Engine**: Answers candidate questions about exam formats, resume parsing, grading criteria, and administrative features.
* **Route-Aware Proctoring Protection**: Intelligently hides and disables the chatbot whenever a candidate enters active assessment writing rooms (`/assessment/[id]/take`) or AI resume evaluation sessions (`/resume`, `/assessment/adaptive`), guaranteeing zero cheating assistance during tests.

---

## Authentication and Authorization

### Authentication

Authentication across the platform is handled via JSON Web Tokens (JWT) and OAuth2 Bearer Password specification.

```text
Client (Next.js)                         Backend (FastAPI)                          Database
   |                                            |                                      |
   |--- 1. POST /api/v1/auth/login ----------->|                                      |
   |    (username=email, password)              |--- 2. Fetch user by email ---------->|
   |                                            |<-- 3. Return user record ------------|
   |                                            |                                      |
   |                                            |--- 4. Verify password with bcrypt --|
   |                                            |                                      |
   |<-- 5. Return JWT Access Token + User JSON -|                                      |
   |                                            |                                      |
   |--- 6. GET /api/v1/protected --------------->|                                      |
   |    Header: Authorization: Bearer <Token>   |--- 7. Validate JWT signature & exp -|
   |                                            |--- 8. Extract user_id & role --------|
   |                                            |                                      |
   |<-- 9. Response Data -----------------------|                                      |
```

#### Password Hashing with Bcrypt
* **Security Rationale**: Storing passwords as plaintext is a severe security vulnerability.
* **Implementation**: The backend utilizes Python's native `bcrypt` library (`bcrypt.hashpw` with `bcrypt.gensalt()`).
* **Verification**: Supplied login passwords are verified against stored hashes using `bcrypt.checkpw()`.
* **Resilience**: Protects user credentials even if the underlying database is compromised.

#### Protected Routes & Session Handling
* **Client Token Storage**: Upon successful login, the JWT token is saved in browser `localStorage` under the key `meti_token`.
* **API Header Injection**: `src/lib/api.ts` attaches `Authorization: Bearer <meti_token>` to every outgoing HTTP request.
* **Session Restoration**: On application load, `AuthProvider` queries `/api/v1/auth/me` to hydrate current user details.

### Role-Based Access Control (RBAC)

The platform defines two distinct user roles stored in the `UserRole` enum:

1. `ADMIN`: Platform administrator with full write, read, and delete permissions over system assessments, categories, questions, and candidate attempt data.
2. `CANDIDATE`: Student/Candidate user with permissions to view active assessments, execute exam attempts, run code sandboxes, inspect personal result histories, upload resumes, and run adaptive interview sessions.

#### Role-Permission Matrix

| Permission / Endpoint | Admin Role | Candidate Role | Unauthenticated |
| :--- | :---: | :---: | :---: |
| `POST /auth/signup` | Allowed | Allowed | Allowed |
| `POST /auth/login` | Allowed | Allowed | Allowed |
| `GET /auth/me` | Allowed | Allowed | Denied (401) |
| `GET /assessments/categories` | Allowed | Allowed | Allowed |
| `POST /assessments/categories` | Allowed | Denied (403) | Denied (401) |
| `GET /assessments/` | Allowed | Allowed | Allowed |
| `POST /assessments/` | Allowed | Denied (403) | Denied (401) |
| `DELETE /assessments/{id}` | Allowed | Denied (403) | Denied (401) |
| `POST /assessments/run-code` | Allowed | Allowed | Denied (401) |
| `POST /assessments/upload-solution` | Allowed | Allowed | Denied (401) |
| `POST /questions/{assessment_id}` | Allowed | Denied (403) | Denied (401) |
| `DELETE /questions/{question_id}` | Allowed | Denied (403) | Denied (401) |
| `POST /attempts/start/{assessment_id}` | Allowed | Allowed | Denied (401) |
| `POST /attempts/{attempt_id}/security-event` | Allowed | Allowed | Denied (401) |
| `POST /attempts/{attempt_id}/submit` | Allowed | Allowed | Denied (401) |
| `GET /attempts/{attempt_id}/result` | Allowed | Owner Only | Denied (401) |
| `GET /analytics/my-attempts` | Allowed | Allowed | Denied (401) |
| `GET /analytics/summary` | Allowed | Denied (403) | Denied (401) |
| `GET /analytics/leaderboard/{id}` | Allowed | Allowed | Allowed |
| `GET /analytics/admin/attempts/{id}` | Allowed | Denied (403) | Denied (401) |
| `POST /resume/upload` | Allowed | Allowed | Denied (401) |
| `GET /resume/my-resume` | Allowed | Allowed | Denied (401) |
| `POST /adaptive/start` | Allowed | Allowed | Denied (401) |
| `POST /adaptive/answer` | Allowed | Allowed | Denied (401) |
| `GET /adaptive/session/{id}` | Allowed | Allowed | Denied (401) |

---

## Assessment Workflow

```text
[Candidate Logs In]
         │
         ▼
[Selects Assessment on Dashboard]
         │
         ▼
[Check Proctoring Requirements]
   ├── Webcam Permissions Granted?
   ├── MediaPipe Face Verification (1 Face Verified)
   └── Fullscreen Mode Activated
         │
         ▼
[Backend Creates Attempt & Shuffles Questions/Options]
         │
         ▼
[Exam Room In Progress] ◄────────────────────────────────────────┐
   ├── Live Countdown Timer Running                               │
   ├── Candidate Answers MCQs / Short Text                        │
   ├── Candidate Runs Code in Sandbox (Python/JS/C++/SQL)         │
   ├── Candidate Uploads Solution Files                           │
   └── Security Listeners Monitor State:                          │
         ├── Tab Switch / Window Blur ──► Log Security Event     │
         └── Face Lost / Multiple Faces ─► Log Security Event     │
         │                                                        │
         ├────── Time Remaining > 0 & Not Submitted ──────────────┘
         │
         ▼
[Candidate Submits or Timer Expires]
         │
         ▼
[Backend Grading Engine Evaluates Submission]
         │
         ▼
[View Detailed Score, Rationale, and Security Summary]
```

---

## User Roles

### 1. Platform Administrator (`ADMIN`)
* Creates and organizes test categories.
* Authors assessments and tunes time limits, pass percentages, and proctoring parameters.
* Adds questions, options, code templates, and test cases.
* Inspects system-wide candidate attempts, score leaderboards, and proctoring event logs.

### 2. Candidate / Student (`CANDIDATE`)
* Browses available active assessments and initiates timed attempts.
* Passes pre-exam proctoring calibration (webcam, face detection, fullscreen).
* Solves MCQs, writes code solutions in the live sandbox, and uploads project attachments.
* Reviews submitted attempt scores, percentages, and question explanations.
* Uploads resumes to experience the dynamic AI adaptive evaluation session.

---

## Technology Stack

### Frontend
* **Framework**: Next.js 14 (React 18, App Router Architecture)
* **Language**: TypeScript 5.x
* **Styling**: Tailwind CSS & Glassmorphic Custom Design System
* **Icons**: Lucide React
* **AI Computer Vision**: `@mediapipe/tasks-vision` (Google MediaPipe WebAssembly Face Detector)
* **Voice Synthesis**: Web Speech API (`SpeechSynthesisUtterance`)

### Backend
* **Framework**: FastAPI (Asynchronous ASGI Web Framework)
* **Language**: Python 3.10+
* **ASGI Server**: Uvicorn with WatchFiles auto-reloading
* **Data Validation**: Pydantic v2
* **Authentication**: OAuth2 Password Flow with PyJWT & Bcrypt
* **Document Processing**: `pypdf` (PDF text extraction)
* **Subprocess Code Runner**: Python `subprocess` isolated sandbox with execution timeouts

### Database & ORM
* **Relational Database**: PostgreSQL 15 (Production & Docker) / SQLite (Local dev fallback)
* **Async Database Driver**: `asyncpg` (PostgreSQL) / `aiosqlite` (SQLite)
* **ORM**: Async SQLAlchemy 2.0 (Mapped type annotations & relationship cascading)

### Security & DevOps
* **Containerization**: Docker & Docker Compose
* **Unit & Integration Testing**: Pytest, Pytest-Asyncio, HTTPX

---

## Why These Technologies Were Used

* **Next.js 14 App Router**: Delivers fast client navigation, server-side metadata generation, and unified API route orchestration with seamless TypeScript safety.
* **FastAPI**: Provides native async/await coroutine performance, automatic OpenAPI documentation, and rapid request serialization with Pydantic.
* **PostgreSQL & Async SQLAlchemy 2.0**: Ensures ACID transactional consistency across assessments, attempts, answers, and security events while handling high-concurrency connections without blocking threads.
* **MediaPipe Tasks Vision**: Delivers client-side, zero-latency computer vision face detection inside the browser without needing to stream private video frames to external third-party servers.
* **Isolated Subprocess Code Runner**: Safely executes candidate code across Python, JavaScript, C++, and SQL with memory limits and execution timeouts.

---

## Project Structure

Below is the directory structure of the repository ready for GitHub upload:

```text
METI-Assessment-Platform/
├── .gitignore                      # Git exclusion rules (dependencies, build caches, env files, db)
├── README.md                       # Comprehensive project documentation
├── docker-compose.yml              # Multi-container stack (Postgres + FastAPI + Next.js)
├── docs/                           # Architecture guides and reference documents
│   └── ARCHITECTURE.md
│
├── backend/                        # Asynchronous FastAPI Backend Application
│   ├── Dockerfile                  # Python 3.10 Slim backend container specification
│   ├── pytest.ini                  # Pytest async configuration
│   ├── requirements.txt            # Python dependencies (FastAPI, SQLAlchemy, pypdf, etc.)
│   ├── app/
│   │   ├── __init__.py
│   │   ├── main.py                 # FastAPI application entry point, CORS & lifespan events
│   │   ├── api/
│   │   │   ├── __init__.py
│   │   │   └── v1/
│   │   │       ├── __init__.py
│   │   │       ├── adaptive.py     # AI Adaptive interview endpoints
│   │   │       ├── analytics.py    # Attempt analytics, summaries & leaderboards
│   │   │       ├── assessments.py  # Assessment CRUD, code execution & file solution uploads
│   │   │       ├── attempts.py     # Attempt lifecycle, question randomization & security events
│   │   │       ├── auth.py         # Signup, login, JWT token generation & dependencies
│   │   │       ├── questions.py    # Question & Option authoring endpoints
│   │   │       └── resume.py       # Resume upload & skill taxonomy extraction
│   │   ├── core/
│   │   │   ├── config.py           # Application settings & environment variables
│   │   │   └── security.py         # Password hashing (bcrypt) & JWT encoding/decoding
│   │   ├── db/
│   │   │   ├── base.py             # SQLAlchemy DeclarativeBase
│   │   │   ├── models.py           # Relational ORM models (8 database tables)
│   │   │   ├── seed.py             # Database seed script with sample assessments & users
│   │   │   └── session.py          # Async sessionmaker and DB dependency
│   │   ├── schemas/
│   │   │   └── schemas.py          # Pydantic request/response schemas
│   │   └── services/
│   │       ├── ai_evaluator.py     # Adaptive question generator & confidence scorer
│   │       ├── code_runner.py      # Multi-language code execution sandbox
│   │       ├── grading.py          # Automated multi-format exam grading engine
│   │       └── resume_parser.py    # PDF/TXT skill taxonomy extraction
│   └── tests/                      # Automated Backend Test Suite
│       ├── test_adaptive.py        # Tests resume skills and adaptive scoring
│       ├── test_api.py             # Tests root and authentication flows
│       ├── test_randomization.py   # Tests question & option order shuffling
│       └── test_security_events.py # Tests anti-cheating security event recording
│
└── frontend/                       # Next.js 14 App Router Frontend Application
    ├── Dockerfile                  # Node.js Alpine multi-stage production build container
    ├── next.config.mjs             # Next.js configuration
    ├── package.json                # Dependencies (@mediapipe/tasks-vision, lucide-react, etc.)
    ├── postcss.config.mjs          # PostCSS configuration
    ├── tailwind.config.ts          # Tailwind CSS styling & design system tokens
    ├── tsconfig.json               # TypeScript configuration
    └── src/
        ├── app/
        │   ├── layout.tsx          # Root layout with ThemeProvider, AuthProvider & EVE Chatbot
        │   ├── page.tsx            # Public landing hero page & feature highlights
        │   ├── globals.css         # Custom animations, glassmorphism styles & dark theme
        │   ├── admin/
        │   │   └── page.tsx        # Admin control center, analytics & test authoring
        │   ├── assessment/
        │   │   ├── adaptive/
        │   │   │   └── page.tsx    # Live AI adaptive skill interview & evaluation room
        │   │   └── [id]/
        │   │       ├── result/
        │   │       │   └── page.tsx # Attempt score summary, question review & proctoring logs
        │   │       └── take/
        │   │           └── page.tsx # Distraction-free exam room, MediaPipe vision & code sandbox
        │   ├── dashboard/
        │   │   └── page.tsx        # Candidate dashboard & assessment launcher
        │   ├── login/
        │   │   └── page.tsx        # Authentication login portal
        │   ├── register/
        │   │   └── page.tsx        # Candidate registration portal
        │   └── resume/
        │       └── page.tsx        # Resume PDF/TXT upload & skill extraction
        ├── components/
        │   ├── Navbar.tsx          # Responsive navigation bar with role-based links
        │   └── chatbot/            # EVE Platform Assistant Chatbot
        │       ├── ApplicationChatbot.tsx # Entry controller with route-aware proctoring visibility
        │       ├── ChatbotButton.tsx      # Floating trigger button with robot avatar
        │       ├── ChatbotWindow.tsx      # Interactive chat dialogue with voice controls
        │       ├── ChatMessage.tsx        # Formatted chat bubble component
        │       ├── SuggestedQuestions.tsx # Contextual quick-reply prompt pills
        │       ├── WallERobot.tsx         # Pure CSS 3D animated robot avatar
        │       ├── chatbotKnowledge.ts    # Comprehensive platform knowledge base
        │       └── chatbotUtils.ts        # Intent matching, responses & sound synthesis
        └── lib/
            ├── api.ts              # Typed API fetch client with JWT bearer injection
            ├── authContext.tsx     # React authentication context & session hydration
            └── themeContext.tsx    # Theme provider (dark/light theme support)
```

### Files Excluded from Version Control (`.gitignore`)
The project includes a root `.gitignore` ensuring that sensitive files, build artifacts, and system caches are **never committed to GitHub**:
* Python virtual environments (`.venv/`, `venv/`, `ENV/`)
* Bytecode and caches (`__pycache__/`, `*.pyc`, `.pytest_cache/`)
* Node modules (`frontend/node_modules/`)
* Next.js build directories (`frontend/.next/`, `*.tsbuildinfo`)
* Environment files (`.env`, `.env.local`, `.env.production.local`)
* Local databases (`*.db`, `*.sqlite3`)
* Uploaded files (`backend/uploads/`)
* Operating system artifacts (`.DS_Store`, `Thumbs.db`)

---

## System Architecture

```text
                               +---------------------------------------------+
                               |              Candidate Browser              |
                               |                                             |
                               |  +---------------------------------------+  |
                               |  |       Next.js 14 Exam Interface       |  |
                               |  |  - Real-time Timer Hook               |  |
                               |  |  - Multi-Question Matrix              |  |
                               |  |  - Live Code Execution Sandbox        |  |
                               |  |  - MediaPipe Tasks Vision Face Model  |  |
                               |  |  - Tab / Focus Event Observers        |  |
                               |  |  - EVE Assistant (Auto-disabled)      |  |
                               |  +---------------------------------------+  |
                               +---------------------------------------------+
                                                      │
                              HTTPS / REST API Calls  │ JWT Bearer Auth
                                                      ▼
                               +---------------------------------------------+
                               |               FastAPI Backend               |
                               |                                             |
                               |  +---------------------------------------+  |
                               |  |      Role & Auth Middleware (JWT)     |  |
                               |  +---------------------------------------+  |
                               |  |      API Routers (/api/v1/...)        |  |
                               |  |   - /auth, /assessments, /attempts    |  |
                               |  |   - /questions, /analytics, /resume   |  |
                               |  |   - /adaptive, /run-code              |  |
                               |  +---------------------------------------+  |
                               |  |            Services Engine            |  |
                               |  |   - grading.py (Automated Scoring)    |  |
                               |  |   - code_runner.py (Sandbox Process)  |  |
                               |  |   - ai_evaluator.py (Adaptive Engine) |  |
                               |  |   - resume_parser.py (pypdf Skills)   |  |
                               |  +---------------------------------------+  |
                               +---------------------------------------------+
                                                      │
                                                      │ Async SQLAlchemy 2.0
                                                      ▼
                               +---------------------------------------------+
                               |           PostgreSQL 15 Database            |
                               |                                             |
                               |  - Users & Roles (bcrypt hashes)            |
                               |  - Categories & Assessments                 |
                               |  - Questions & Options                      |
                               |  - Attempts, Answers & Shuffled Orders      |
                               |  - Security Violations (security_events)    |
                               |  - Adaptive Sessions & Evaluation Traces    |
                               +---------------------------------------------+
```

---

## Module Description

### Backend Core & Services
* **[`backend/app/main.py`](file:///c:/Users/S%20NITHIN/OneDrive/Desktop/METI-Assessment-Platform/backend/app/main.py)**: Initializes FastAPI app, configures CORS origins, and mounts the API v1 router.
* **[`backend/app/core/security.py`](file:///c:/Users/S%20NITHIN/OneDrive/Desktop/METI-Assessment-Platform/backend/app/core/security.py)**: Implements password hashing (`bcrypt.hashpw`), password validation (`bcrypt.checkpw`), and JWT token encoding/decoding (`PyJWT`).
* **[`backend/app/services/code_runner.py`](file:///c:/Users/S%20NITHIN/OneDrive/Desktop/METI-Assessment-Platform/backend/app/services/code_runner.py)**: Executes candidate code in Python, JavaScript, C++, or SQL inside an isolated subprocess with 4-second execution timeouts, capturing stdout, stderr, execution time, and exit status.
* **[`backend/app/services/grading.py`](file:///c:/Users/S%20NITHIN/OneDrive/Desktop/METI-Assessment-Platform/backend/app/services/grading.py)**: Performs automated multi-format answer evaluations, calculates score totals and percentages, and determines pass/fail marks.
* **[`backend/app/services/ai_evaluator.py`](file:///c:/Users/S%20NITHIN/OneDrive/Desktop/METI-Assessment-Platform/backend/app/services/ai_evaluator.py)**: Generates skill-tailored questions, calculates candidate answer confidence scores (0.0 to 1.0), and branches to follow-up questions when clarification is required.
* **[`backend/app/services/resume_parser.py`](file:///c:/Users/S%20NITHIN/OneDrive/Desktop/METI-Assessment-Platform/backend/app/services/resume_parser.py)**: Extracts text from uploaded PDF/TXT resumes using `pypdf` and matches key technical skills against predefined taxonomy regexes.

### API Routers
* **[`backend/app/api/v1/auth.py`](file:///c:/Users/S%20NITHIN/OneDrive/Desktop/METI-Assessment-Platform/backend/app/api/v1/auth.py)**: Signup, login, and current authenticated user retrieval.
* **[`backend/app/api/v1/assessments.py`](file:///c:/Users/S%20NITHIN/OneDrive/Desktop/METI-Assessment-Platform/backend/app/api/v1/assessments.py)**: Assessment and category management, live sandbox code execution (`/run-code`), and solution file uploads (`/upload-solution`).
* **[`backend/app/api/v1/attempts.py`](file:///c:/Users/S%20NITHIN/OneDrive/Desktop/METI-Assessment-Platform/backend/app/api/v1/attempts.py)**: Handles starting attempts with randomized question/option orders, recording security events (`/security-event`), submitting answers, and fetching detailed result scorecards.
* **[`backend/app/api/v1/analytics.py`](file:///c:/Users/S%20NITHIN/OneDrive/Desktop/METI-Assessment-Platform/backend/app/api/v1/analytics.py)**: Serves admin dashboard metric summaries, personal candidate attempt histories, and public assessment leaderboards.
* **[`backend/app/api/v1/resume.py`](file:///c:/Users/S%20NITHIN/OneDrive/Desktop/METI-Assessment-Platform/backend/app/api/v1/resume.py)**: Manages candidate resume uploads, profile skill retrieval, and parsing.
* **[`backend/app/api/v1/adaptive.py`](file:///c:/Users/S%20NITHIN/OneDrive/Desktop/METI-Assessment-Platform/backend/app/api/v1/adaptive.py)**: Executes AI adaptive resume assessments, records candidate responses, and provides full session traces.

### Frontend Application Modules
* **[`frontend/src/app/assessment/[id]/take/page.tsx`](file:///c:/Users/S%20NITHIN/OneDrive/Desktop/METI-Assessment-Platform/frontend/src/app/assessment/%5Bid%5D/take/page.tsx)**: Examination room featuring countdown timer, MediaPipe AI face detection proctoring, tab/focus violation listeners, live coding sandbox runner, solution upload, and auto-submission.
* **[`frontend/src/app/assessment/[id]/result/page.tsx`](file:///c:/Users/S%20NITHIN/OneDrive/Desktop/METI-Assessment-Platform/frontend/src/app/assessment/%5Bid%5D/result/page.tsx)**: Displays overall score, pass/fail status, question-by-question explanations, and audit logs of security events recorded during the attempt.
* **[`frontend/src/components/chatbot/ApplicationChatbot.tsx`](file:///c:/Users/S%20NITHIN/OneDrive/Desktop/METI-Assessment-Platform/frontend/src/components/chatbot/ApplicationChatbot.tsx)**: Manages EVE Platform Assistant with automatic contextual hiding on active exam writing pages and AI resume evaluation rooms.
* **[`frontend/src/lib/api.ts`](file:///c:/Users/S%20NITHIN/OneDrive/Desktop/METI-Assessment-Platform/frontend/src/lib/api.ts)**: Centralized typed API client automatically attaching JWT bearer authentication headers.

---

## Database Design

The platform utilizes a relational database managed via Async SQLAlchemy 2.0 ORM:

```text
 +-------------------+             +-----------------------+
 |       users       |             |      categories       |
 +-------------------+             +-----------------------+
 | id (PK)           |             | id (PK)               |
 | email (UK)        |             | name (UK)             |
 | hashed_password   |             | description           |
 | full_name         |             +-----------------------+
 | role (Enum)       |                         | 1
 | created_at        |                         |
 | resume_filename   |                         | N
 | resume_text       |             +-----------------------+
 | parsed_skills     |             |      assessments      |
 +-------------------+             +-----------------------+
     | 1         | 1               | id (PK)               |
     |           |                 | category_id (FK)      |
     | N         | N               | title                 |
     v           v                 | description           |
+----------+  +------------------+ | time_limit_minutes    |
| attempts |  | adaptive_sessions| | passing_score_percent |
+----------+  +------------------+ | is_active             |
| id (PK)  |  | id (PK)          | | is_proctored          |
| user_id  |  | user_id (FK)     | | tab_monitoring_enabled|
| assess_id|  | target_skills    | | fullscreen_required   |
| started  |  | status (Enum)    | | webcam_monitoring     |
| completed|  +------------------+ | face_monitoring       |
| score    |           | 1         +-----------------------+
| max_score|           |               | 1             | 1
| percent  |           | N             |               |
| status   |           v               | N             | N
| q_order  |  +------------------+     v               v
| opt_order|  |adaptive_questions| +-----------+   +----------+
+----------+  +------------------+ | questions |   | attempts |
     | 1      | id (PK)          | +-----------+   +----------+
     |        | session_id (FK)  | | id (PK)   |
     | N      | question_text    | | assess_id |
     v        | topic            | | text      |
+----------+  | difficulty       | | q_type    |
|  answers |  | confidence_score | | points    |
+----------+  | evaluation_status| |explanation|
| id (PK)  |  | ai_feedback     | | code_temp |
| attempt  |  +------------------+ | prog_lang |
| question |                       | test_cases|
| selected |                       +-----------+
| text_resp|                             | 1
| file_path|                             |
| score    |                             | N
+----------+                             v
     | 1                           +-----------+
     |                             |  options  |
     | N                           +-----------+
     v                             | id (PK)   |
+---------------+                  | q_id (FK) |
|security_events|                  | text      |
+---------------+                  | is_correct|
| id (PK)       |                  +-----------+
| attempt_id(FK)|
| event_type    |
| timestamp     |
| details       |
+---------------+
```

---

## API Documentation

All endpoints reside under `/api/v1`. Interactive Swagger documentation is automatically generated at `http://localhost:8000/docs`.

### Authentication Endpoints
| Method | Endpoint | Purpose | Authentication |
| :--- | :--- | :--- | :--- |
| `POST` | `/auth/signup` | Register a new account (`ADMIN` or `CANDIDATE`) | None |
| `POST` | `/auth/login` | Authenticate credentials and receive JWT access token | None |
| `GET` | `/auth/me` | Fetch authenticated user profile | Bearer Token |

### Assessment & Sandbox Endpoints
| Method | Endpoint | Purpose | Authentication |
| :--- | :--- | :--- | :--- |
| `GET` | `/assessments/categories` | List all assessment categories | Optional |
| `POST` | `/assessments/categories` | Create a new category | Admin Only |
| `GET` | `/assessments/` | List all active assessments (supports filtering) | Optional |
| `GET` | `/assessments/{id}` | Get assessment details and questions | Optional |
| `POST` | `/assessments/` | Create a new assessment with proctoring config | Admin Only |
| `DELETE` | `/assessments/{id}` | Delete an assessment and associated content | Admin Only |
| `POST` | `/assessments/run-code` | Execute Python, JS, C++, or SQL in sandbox | Bearer Token |
| `POST` | `/assessments/upload-solution` | Upload project solution attachments | Bearer Token |

### Question & Option Endpoints
| Method | Endpoint | Purpose | Authentication |
| :--- | :--- | :--- | :--- |
| `POST` | `/questions/{assessment_id}` | Add question (MCQ, Coding, Short Text, File) | Admin Only |
| `DELETE` | `/questions/{question_id}` | Delete a question and its options | Admin Only |

### Attempt, Proctoring & Result Endpoints
| Method | Endpoint | Purpose | Authentication |
| :--- | :--- | :--- | :--- |
| `POST` | `/attempts/start/{assessment_id}` | Start test attempt with randomized questions | Bearer Token |
| `POST` | `/attempts/{attempt_id}/security-event` | Record proctoring violation (tab switch, etc.) | Bearer Token |
| `POST` | `/attempts/{attempt_id}/submit` | Submit attempt answers and trigger evaluation | Bearer Token |
| `GET` | `/attempts/{attempt_id}/result` | View detailed attempt score and audit logs | Owner / Admin |

### Analytics & Leaderboards
| Method | Endpoint | Purpose | Authentication |
| :--- | :--- | :--- | :--- |
| `GET` | `/analytics/my-attempts` | Fetch authenticated candidate's attempts | Bearer Token |
| `GET` | `/analytics/summary` | Fetch platform-wide aggregate metrics | Admin Only |
| `GET` | `/analytics/leaderboard/{id}` | View ranked leaderboard for an assessment | Optional |
| `GET` | `/analytics/admin/attempts/{id}` | View detailed attempt list for an assessment | Admin Only |

### Resume Profile & AI Adaptive Endpoints
| Method | Endpoint | Purpose | Authentication |
| :--- | :--- | :--- | :--- |
| `POST` | `/resume/upload` | Upload PDF/TXT resume or paste raw text | Bearer Token |
| `GET` | `/resume/my-resume` | Get current parsed resume profile and skills | Bearer Token |
| `POST` | `/adaptive/start` | Start AI adaptive assessment based on skills | Bearer Token |
| `POST` | `/adaptive/answer` | Submit answer, compute confidence & branch | Bearer Token |
| `GET` | `/adaptive/session/{id}` | View detailed log of an adaptive session | Bearer Token |

---

## Security

1. **Password Security**: One-way salt and hash generation via `bcrypt` preventing plaintext password exposure.
2. **Stateless JWT Authorization**: Cryptographically signed JSON Web Tokens (`HS256`) containing expiration limits and role claims.
3. **Role-Based Endpoint Protection**: Strict dependency guards (`get_current_admin`) enforcing role validation on administrative endpoints.
4. **Data Isolation in Exam API**: When `POST /attempts/start/{assessment_id}` returns questions, `is_correct` flags on options are stripped from the response payload.
5. **Anti-Cheating Security Monitoring**: Real-time logging of browser tab switching, window blurring, fullscreen exits, and webcam face anomalies.
6. **Subprocess Sandbox Isolation**: Execution timeouts (4.0s max) and separate subprocess environments for candidate code submissions.
7. **SQL Injection Prevention**: Built entirely on SQLAlchemy 2.0 ORM parameterized query construction.
8. **CORS Restriction**: Configured via FastAPI `CORSMiddleware`.

---

## Installation & Setup

### 1. Clone the Repository
```bash
git clone https://github.com/<YOUR_GITHUB_USERNAME>/METI-Assessment-Platform.git
cd METI-Assessment-Platform
```

### 2. Environment Variables Setup
Create `.env` files in root or configure backend/frontend variables:

**Backend (`backend/.env`)**:
```env
PROJECT_NAME="METI Assessment Platform API"
VERSION="1.0.0"
API_V1_STR="/api/v1"
SECRET_KEY="your_super_secret_jwt_key_change_in_production"
ALGORITHM="HS256"
ACCESS_TOKEN_EXPIRE_MINUTES=1440
DATABASE_URL="postgresql+asyncpg://meti_user:meti_password@db:5432/meti_assessment_db"
```

**Frontend (`frontend/.env.local`)**:
```env
NEXT_PUBLIC_API_URL="http://localhost:8000"
```

### 3. Backend Setup (Local Manual)
```bash
cd backend

# Create and activate Python virtual environment
python -m venv venv

# Windows:
venv\Scripts\activate
# macOS/Linux:
# source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Run database seed script (creates sample tests, categories, and demo users)
python -m app.db.seed

# Start FastAPI development server
uvicorn app.main:app --reload --port 8000
```

### 4. Frontend Setup (Local Manual)
```bash
cd frontend

# Install Node dependencies
npm install

# Start Next.js development server
npm run dev
```

### 5. Docker Setup (One-Command Launch)
To launch the complete multi-container stack (PostgreSQL + FastAPI + Next.js):
```bash
docker compose up --build
```

---

## Running the Application

| Service | URL | Description |
| :--- | :--- | :--- |
| **Frontend Web App** | `http://localhost:3000` | Main Next.js candidate & admin application |
| **Backend API & Swagger UI** | `http://localhost:8000` | FastAPI server (redirects to Swagger `/docs`) |
| **Interactive API Specs** | `http://localhost:8000/docs` | Swagger UI interactive documentation |
| **ReDoc API Spec** | `http://localhost:8000/redoc` | ReDoc API documentation |

### Demo Credentials (Pre-seeded)
| Role | Email | Password | Allowed Access |
| :--- | :--- | :--- | :--- |
| **Platform Admin** | `admin@meti.org` | `admin123` | Admin Control Center (`/admin`), Test Authoring, Analytics |
| **Demo Candidate** | `student@meti.org` | `student123` | Candidate Dashboard (`/dashboard`), Assessments, Resume Interview |

---

## Testing

The backend includes an automated test suite implemented with `pytest`, `pytest-asyncio`, and `httpx`.

### Running Automated Tests
```bash
cd backend
python -m pytest
```

### Test Coverage Summary
* `backend/tests/test_adaptive.py`: Tests resume skill extraction, regex taxonomy matching, and AI confidence scoring.
* `backend/tests/test_api.py`: Tests async root endpoint availability and full candidate signup/login authentication flows.
* `backend/tests/test_randomization.py`: Tests question order and option sequence shuffling per candidate attempt.
* `backend/tests/test_security_events.py`: Tests tab-switch, window blur, and proctoring security event recording and persistence.

---

## GitHub Repository Guidelines & Upload Instructions

### 1. Step-by-Step Commands to Upload to GitHub

Follow these commands to push the project to your GitHub account:

```bash
# 1. Initialize git in the project root directory
git init

# 2. Check that untracked files are recognized and sensitive files are ignored
git status

# 3. Stage all source files and documentation
git add .

# 4. Commit files with an informative message
git commit -m "Initial commit: METI Assessment Platform with AI Proctoring, Code Sandbox, and Resume Engine"

# 5. Set the primary branch to main
git branch -M main

# 6. Link your remote GitHub repository (replace with your GitHub repository URL)
git remote add origin https://github.com/<YOUR_GITHUB_USERNAME>/METI-Assessment-Platform.git

# 7. Push to GitHub
git push -u origin main
```

### 2. Files to Commit vs Files Ignored

| Category | Status | Details |
| :--- | :---: | :--- |
| **Source Code** (`backend/app`, `frontend/src`) | **Commit** | Core application logic, components, routes, models |
| **Configuration Files** (`package.json`, `requirements.txt`, `tsconfig.json`) | **Commit** | Dependency and compiler configurations |
| **Docker Configurations** (`Dockerfile`, `docker-compose.yml`) | **Commit** | Container deployment manifests |
| **Tests & Seed Scripts** (`backend/tests`, `seed.py`) | **Commit** | Automated test suites and database seed scripts |
| **Documentation** (`README.md`, `docs/`) | **Commit** | Architecture guides and documentation |
| **Dependencies** (`node_modules/`, `venv/`, `.venv/`) | **IGNORED** | Downloaded via `npm install` and `pip install` |
| **Build Caches** (`frontend/.next/`, `__pycache__/`, `.pytest_cache/`) | **IGNORED** | Generated dynamically at build/runtime |
| **Secrets & Environment** (`.env`, `.env.local`) | **IGNORED** | Must remain private and never pushed to git |
| **Database Binaries** (`*.db`, `*.sqlite3`) | **IGNORED** | Generated locally by seed script |
| **Uploads** (`backend/uploads/`) | **IGNORED** | User resume and solution files |

---

## License

Distributed under the MIT License. See [LICENSE](file:///c:/Users/S%20NITHIN/OneDrive/Desktop/METI-Assessment-Platform/LICENSE) for more information.

---

## Author

**Nithin Bharat**

Full-Stack Software Engineer specializing in scalable web architectures, asynchronous API systems, AI-assisted evaluation tools, and secure full-stack design.
