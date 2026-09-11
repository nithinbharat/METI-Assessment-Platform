# Setup & Deployment Guide

This guide describes how to run and deploy the **METI Assessment Platform** locally or in production containers.

---

## 📋 Prerequisites

- **Python**: 3.10 or higher
- **Node.js**: 18.x or 20.x LTS
- **Docker & Docker Compose**: (Optional but recommended)
- **Git**

---

## 🚀 Environment Setup

### Method 1: Running with Docker Compose (Recommended)

1. Clone or navigate to the project directory:
   ```bash
   cd METI-Assessment-Platform
   ```

2. Start the multi-container stack:
   ```bash
   docker-compose up --build
   ```

3. Services will start on the following ports:
   - **Frontend**: `http://localhost:3000`
   - **Backend API**: `http://localhost:8000`
   - **PostgreSQL DB**: `localhost:5432`

---

### Method 2: Manual Local Setup

#### Step 1: Backend Setup (FastAPI)

1. Navigate to backend directory:
   ```bash
   cd backend
   ```

2. Create and activate virtual environment:
   ```bash
   # Windows:
   python -m venv venv
   venv\Scripts\activate

   # macOS / Linux:
   python3 -m venv venv
   source venv/bin/activate
   ```

3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

4. Initialize SQLite / PostgreSQL Database with sample seed data:
   ```bash
   python -m app.db.seed
   ```

5. Run the server:
   ```bash
   uvicorn app.main:app --reload --port 8000
   ```

#### Step 2: Frontend Setup (Next.js)

1. Open a new terminal tab and navigate to frontend directory:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Configure environment variables (create `.env.local`):
   ```env
   NEXT_PUBLIC_API_URL=http://localhost:8000
   ```

4. Start development server:
   ```bash
   npm run dev
   ```

5. Open browser at [http://localhost:3000](http://localhost:3000).

---

## 🧪 Running Tests

### Backend Unit & Integration Tests

```bash
cd backend
pytest
```

---

## 🔧 Troubleshooting

- **CORS Issues**: Ensure `NEXT_PUBLIC_API_URL` matches the backend host address.
- **Port Conflict (8000/3000)**: You can change default ports in `docker-compose.yml` or standard command flags.
