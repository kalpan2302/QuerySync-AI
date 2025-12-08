# QuerySync AI - Real-time Q&A Dashboard

A full-stack real-time Q&A dashboard with AI-powered answer suggestions, built for the Hemut Take-Home Project.

## 🚀 Features

- **Real-time Updates**: WebSocket-powered live updates for questions, answers, and status changes
- **Guest & Admin Access**: Guests can post questions/answers; admins can manage status
- **AJAX XMLHttpRequest**: Question submission uses AJAX XMLHttpRequest as per requirements
- **AI-Powered Suggestions**: RAG integration with LangChain + Groq for auto-suggesting answers
- **Analytics Dashboard**: Admin metrics showing question stats and response times
- **Email Notifications**: SMTP integration for answered question notifications
- **Webhook Support**: External webhook calls when questions are answered

## 🛠️ Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | Next.js 15, TypeScript, Tailwind CSS |
| Backend | FastAPI, Python 3.11, SQLAlchemy |
| Database | PostgreSQL 16 |
| Real-time | WebSockets |
| Auth | JWT (python-jose, bcrypt) |
| AI/RAG | LangChain, Groq API |
| Infra | Docker, Docker Compose, GitHub Actions |

## 📁 Project Structure

```
QuerySync AI/
├── backend/                 # FastAPI backend
│   ├── app/
│   │   ├── api/v1/         # REST API routes
│   │   ├── models/         # SQLAlchemy models
│   │   ├── schemas/        # Pydantic schemas
│   │   ├── services/       # Business logic
│   │   ├── core/           # Config, security
│   │   ├── db/             # Database session
│   │   └── websocket/      # WebSocket manager
│   ├── tests/              # pytest tests
│   ├── alembic/            # DB migrations
│   └── Dockerfile
├── frontend/               # Next.js frontend
│   ├── src/
│   │   ├── app/           # App router pages
│   │   ├── components/    # React components
│   │   └── lib/           # API, auth, WebSocket
│   └── Dockerfile
├── docker-compose.yml
└── .github/workflows/ci.yml
```

## 🚦 Quick Start

### Prerequisites

- Docker & Docker Compose
- (Optional) Groq API key for RAG features

### 1. Clone and Configure

```bash
git clone https://github.com/your-username/querysync-ai.git
cd querysync-ai

# Copy environment files
cp backend/.env.example backend/.env
cp frontend/env.example frontend/.env.local

# Edit .env files with your settings (especially GROQ_API_KEY)
```

### 2. Run with Docker Compose

```bash
docker-compose up --build
```

### 3. Access the Application

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8000
- **API Docs**: http://localhost:8000/docs

## 🔧 Development Setup

### Backend

```bash
cd backend
python -m venv venv
source venv/bin/activate  # or `venv\Scripts\activate` on Windows
pip install -e ".[dev]"

# Run with auto-reload
uvicorn app.main:app --reload
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

## 📡 API Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/v1/auth/register` | - | Register admin |
| POST | `/api/v1/auth/login` | - | Login |
| GET | `/api/v1/questions` | - | List questions |
| POST | `/api/v1/questions` | - | Create question |
| PATCH | `/api/v1/questions/{id}/status` | Admin | Update status |
| POST | `/api/v1/questions/{id}/answers` | - | Add answer |
| POST | `/api/v1/questions/{id}/suggest` | Admin | Get AI suggestion |
| GET | `/api/v1/admin/stats` | Admin | Dashboard stats |

## 🔌 WebSocket Events

Connect to `ws://localhost:8000/ws` to receive:

- `new_question` - New question posted
- `new_answer` - New answer added
- `status_change` - Question status updated
- `suggestion` - AI suggestion generated

## 🧪 Testing

```bash
# Backend tests
cd backend
pytest tests/ -v

# Frontend lint
cd frontend
npm run lint
```

## 🚀 Deployment

### AWS (ECS/EC2)

1. Push images to ECR
2. Deploy with ECS Fargate or EC2 + Docker Compose
3. Use RDS for PostgreSQL
4. Configure ALB for SSL termination

---

Built with ❤️ for the Hemut Take-Home Project
