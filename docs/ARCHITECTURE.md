# System Architecture & Database Design

This document details the architectural design, database relationships, and data flow pipelines for the **METI Assessment Platform**.

---

## 🏗️ High-Level Architecture

The platform follows a modern decoupled architecture:

```mermaid
graph TD
    Client[Next.js 14 Frontend UI] -->|REST API / JSON| FastAPI[FastAPI Backend Engine]
    FastAPI -->|Async SQLAlchemy 2.0| Postgres[(PostgreSQL Database)]
    FastAPI -->|Pydantic v2| Validation[Schema Validation & Security]
    FastAPI -->|Grading Engine| Scoring[Automated Evaluation Service]
```

### Components

1. **Frontend (Client Tier)**
   - **Framework**: Next.js 14 (App Router)
   - **State & Auth**: Client React Context + LocalStorage JWT token management
   - **UI Design**: Modern glassmorphism, responsive grid layout, Lucide icon set, real-time timer hooks.

2. **Backend (API Tier)**
   - **Framework**: FastAPI (Asynchronous Python 3.10+)
   - **Security**: OAuth2 Bearer password flow, JWT tokens (`HS256`), Bcrypt password hashing.
   - **ORM & DB Layer**: Async SQLAlchemy 2.0 with SQLite / PostgreSQL database backends.
   - **Scoring Engine**: Synchronous & automated grading module calculating percentage scores, pass/fail status, and per-question correctness.

3. **Database Tier**
   - **RDBMS**: PostgreSQL 15 / SQLite
   - **Tables**: Users, Categories, Assessments, Questions, Options, Attempts, Answers.

---

## 🗄️ Database ERD Schema

```mermaid
erDiagram
    USER ||--o{ ATTEMPT : "makes"
    CATEGORY ||--o{ ASSESSMENT : "contains"
    ASSESSMENT ||--o{ QUESTION : "has"
    ASSESSMENT ||--o{ ATTEMPT : "evaluated in"
    QUESTION ||--o{ OPTION : "provides"
    ATTEMPT ||--o{ ANSWER : "records"
    QUESTION ||--o{ ANSWER : "evaluated against"

    USER {
        int id PK
        string email UK
        string hashed_password
        string full_name
        string role "ADMIN | CANDIDATE"
        datetime created_at
    }

    CATEGORY {
        int id PK
        string name UK
        string description
    }

    ASSESSMENT {
        int id PK
        int category_id FK
        string title
        string description
        int time_limit_minutes
        float passing_score_percentage
        boolean is_active
        datetime created_at
    }

    QUESTION {
        int id PK
        int assessment_id FK
        string text
        string question_type "MCQ | TRUE_FALSE | SHORT_TEXT"
        float points
        string explanation
    }

    OPTION {
        int id PK
        int question_id FK
        string option_text
        boolean is_correct
    }

    ATTEMPT {
        int id PK
        int user_id FK
        int assessment_id FK
        datetime started_at
        datetime completed_at
        float score_obtained
        float max_score
        float percentage
        boolean passed
        string status "IN_PROGRESS | COMPLETED | TIMED_OUT"
    }

    ANSWER {
        int id PK
        int attempt_id FK
        int question_id FK
        int selected_option_id FK
        string text_response
        boolean is_correct
        float score_awarded
    }
```

---

## 🔄 Assessment Execution Sequence

```mermaid
sequenceDiagram
    autonumber
    actor Student as Candidate
    participant UI as Next.js Exam Room
    participant API as FastAPI Backend
    participant DB as PostgreSQL DB

    Student->>UI: Selects Assessment & Click "Start Test"
    UI->>API: POST /api/v1/attempts/start/{assessment_id}
    API->>DB: Create ATTEMPT record (status="IN_PROGRESS")
    API-->>UI: Return Attempt ID & Randomized Questions (Without Is_Correct flags)
    
    UI->>Student: Render Live Timer & Question Matrix
    
    loop During Assessment
        Student->>UI: Select Answer
        UI->>UI: Auto-save draft in Local State
    end
    
    alt Candidate Submits or Timer Expires
        UI->>API: POST /api/v1/attempts/{attempt_id}/submit
        API->>DB: Fetch Questions & Correct Options
        API->>API: Calculate Scores & Pass/Fail status
        API->>DB: Update ATTEMPT (status="COMPLETED", score, percentage)
        API-->>UI: Return Immediate Detailed Result Summary
        UI->>Student: Render Detailed Result & Performance Analytics
    end
```
