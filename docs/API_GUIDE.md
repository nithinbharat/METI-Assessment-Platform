# REST API Specification

The METI Assessment Platform backend exposes RESTful HTTP JSON APIs for authentication, assessment administration, candidate test attempts, and analytics.

---

## 🔐 Base URL & Headers

- **Base URL**: `http://localhost:8000/api/v1`
- **Interactive Swagger Docs**: `http://localhost:8000/docs`
- **ReDoc API Spec**: `http://localhost:8000/redoc`

All authenticated endpoints require an Authorization Header:
```http
Authorization: Bearer <JWT_ACCESS_TOKEN>
```

---

## 🔑 Authentication Endpoints

### 1. Register User
- **POST** `/auth/signup`
- **Request Body**:
```json
{
  "email": "user@example.com",
  "password": "securepassword123",
  "full_name": "Jane Doe",
  "role": "CANDIDATE"
}
```
- **Response (201 Created)**:
```json
{
  "id": 1,
  "email": "user@example.com",
  "full_name": "Jane Doe",
  "role": "CANDIDATE",
  "created_at": "2026-09-10T14:40:00Z"
}
```

### 2. Login / Obtain Token
- **POST** `/auth/login`
- **Form Data** or **JSON**:
```json
{
  "username": "user@example.com",
  "password": "securepassword123"
}
```
- **Response (200 OK)**:
```json
{
  "access_token": "eyJhbGciOiJIUzI1Ni...",
  "token_type": "bearer",
  "user": {
    "id": 1,
    "email": "user@example.com",
    "full_name": "Jane Doe",
    "role": "CANDIDATE"
  }
}
```

---

## 📝 Assessment Endpoints

### 1. List Available Assessments
- **GET** `/assessments/`
- **Response (200 OK)**:
```json
[
  {
    "id": 1,
    "title": "Full-Stack Web Development Assessment",
    "description": "Evaluate proficiency in Next.js, REST APIs, and SQL.",
    "category": { "id": 1, "name": "Software Engineering" },
    "time_limit_minutes": 30,
    "passing_score_percentage": 70.0,
    "total_questions": 10,
    "is_active": true
  }
]
```

### 2. Get Assessment Details with Questions
- **GET** `/assessments/{assessment_id}`
- **Response (200 OK)**:
```json
{
  "id": 1,
  "title": "Full-Stack Web Development Assessment",
  "time_limit_minutes": 30,
  "questions": [
    {
      "id": 101,
      "text": "Which HTTP method is idempotent?",
      "question_type": "MCQ",
      "points": 1.0,
      "options": [
        { "id": 1, "option_text": "POST" },
        { "id": 2, "option_text": "GET" },
        { "id": 3, "option_text": "PATCH" }
      ]
    }
  ]
}
```

### 3. Create Assessment (Admin Only)
- **POST** `/assessments/`
- **Request Body**:
```json
{
  "category_id": 1,
  "title": "Python Async Programming",
  "description": "Test understanding of asyncio, async/await, and FastAPI",
  "time_limit_minutes": 20,
  "passing_score_percentage": 75.0,
  "is_active": true
}
```

---

## 🎯 Test Attempt & Execution Endpoints

### 1. Start Assessment Attempt
- **POST** `/attempts/start/{assessment_id}`
- **Response (201 Created)**:
```json
{
  "attempt_id": 42,
  "assessment_id": 1,
  "started_at": "2026-09-10T14:40:00Z",
  "time_limit_minutes": 30,
  "status": "IN_PROGRESS",
  "questions": [ ... ]
}
```

### 2. Submit Assessment Attempt
- **POST** `/attempts/{attempt_id}/submit`
- **Request Body**:
```json
{
  "answers": [
    { "question_id": 101, "selected_option_id": 2 },
    { "question_id": 102, "text_response": "FastAPI is built on Starlette and Pydantic." }
  ]
}
```
- **Response (200 OK)**:
```json
{
  "attempt_id": 42,
  "score_obtained": 9.0,
  "max_score": 10.0,
  "percentage": 90.0,
  "passed": true,
  "completed_at": "2026-09-10T14:55:00Z",
  "detailed_breakdown": [ ... ]
}
```

---

## 📊 Analytics Endpoints

### 1. Candidate Performance Overview
- **GET** `/analytics/my-attempts`
- **Response (200 OK)**: List of user's past attempts, scores, and pass/fail history.

### 2. Admin Leaderboard & Summary (Admin Only)
- **GET** `/analytics/leaderboard/{assessment_id}`
- **Response (200 OK)**: Rank ordered list of candidates with highest percentage scores.
