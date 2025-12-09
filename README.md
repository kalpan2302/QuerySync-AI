# QuerySync AI - Real-time Q&A Dashboard

A full-stack real-time Q&A dashboard with AI-powered answer suggestions, built for the Hemut Take-Home Project.

## 🌐 Live Demo

**Deployed URL**: [https://querysync-frontend.onrender.com/](https://querysync-frontend.onrender.com/)

> [!IMPORTANT]
> **Email Limitation on Render Free Tier**
> 
> Due to Render's free tier restrictions, I couldn't use SMTP for email delivery. Instead, I'm using [Resend.com](https://resend.com) as a 3rd party email service. However, since I don't have a verified domain, I'm using Resend's test email domain which only delivers emails to the host email address.
> 
> **What this means**: On the deployed version, new users cannot register as ADMIN because they won't receive the verification email.
> 
> **To test admin features, use these credentials:**
> 
> | Field | Value |
> |-------|-------|
> | Email | `kalpan.s.23@gmail.com` |
> | Password | `12345678` |

---

## 🚀 Features

- **Real-time Updates**: WebSocket-powered live updates for questions, answers, and status changes
- **Guest & Admin Access**: Guests can post questions/answers; admins can manage status
- **AJAX XMLHttpRequest**: Question submission uses AJAX XMLHttpRequest as per requirements
- **AI-Powered Suggestions**: RAG integration with LangChain + Groq for auto-suggesting answers
- **Analytics Dashboard**: Admin metrics showing question stats and response times
- **Email Notifications**: Email integration for answered question notifications
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
| Email | Resend (cloud) / SMTP (local) |
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

---

## 🖥️ Local Development Setup

Follow these steps to run QuerySync AI on your local machine.

### Prerequisites

Before you begin, ensure you have the following installed:

- **Docker Desktop** - [Download here](https://www.docker.com/products/docker-desktop/)
- **Git** - [Download here](https://git-scm.com/downloads)
- **Groq API Key** (for AI features) - [Get free API key](https://console.groq.com/)

### Step 1: Clone the Repository

```bash
git clone https://github.com/Kalpan2007/QuerySync-AI.git
cd QuerySync-AI
```

### Step 2: Create Backend Environment File

Create a `.env` file in the `backend/` directory:

```bash
# Navigate to backend folder
cd backend

# Create .env file (Windows)
copy NUL .env

# Or on Mac/Linux
touch .env
```

Add the following content to `backend/.env`:

```env
# Required - AI Features
GROQ_API_KEY=your-groq-api-key-here

# JWT Secret (change in production)
JWT_SECRET=your-super-secret-jwt-key-change-in-production

# Database (uses Docker PostgreSQL by default)
DATABASE_URL=postgresql+asyncpg://hemut:password@db:5432/querysync

# Email Configuration (Optional - choose one)
# Option 1: Resend (recommended for cloud)
RESEND_API_KEY=your-resend-api-key

# Option 2: SMTP (for local development with Gmail)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password
EMAIL_FROM=noreply@querysync.ai

# Webhook (Optional)
WEBHOOK_URL=
```

> [!TIP]
> **Getting a Groq API Key:**
> 1. Go to [console.groq.com](https://console.groq.com/)
> 2. Sign up or log in
> 3. Navigate to API Keys
> 4. Create a new API key and copy it

### Step 3: Start the Application

Navigate back to the project root and run Docker Compose:

```bash
cd ..
docker-compose up --build
```

This will:
- 🐘 Start PostgreSQL database
- 🐍 Build and start the FastAPI backend
- ⚛️ Build and start the Next.js frontend

> [!NOTE]
> The first build may take 3-5 minutes. Subsequent starts will be faster.

### Step 4: Access the Application

Once all services are running, open your browser:

| Service | URL | Description |
|---------|-----|-------------|
| **Frontend** | [http://localhost:3000](http://localhost:3000) | Main application |
| **Backend API** | [http://localhost:8000](http://localhost:8000) | API server |
| **API Docs** | [http://localhost:8000/docs](http://localhost:8000/docs) | Swagger documentation |
| **Database** | `localhost:5432` | PostgreSQL (user: `hemut`, pass: `password`) |

### Step 5: Create an Admin Account

1. Go to [http://localhost:3000](http://localhost:3000)
2. Click **"Register"**
3. Fill in your details and submit
4. If email is configured, check your inbox for verification
5. Login with your credentials

---

## 🔧 Development Without Docker

If you prefer to run services individually:

### Backend (FastAPI)

```bash
cd backend

# Create virtual environment
python -m venv venv

# Activate virtual environment
# Windows:
venv\Scripts\activate
# Mac/Linux:
source venv/bin/activate

# Install dependencies
pip install -e ".[dev]"

# Run database migrations
alembic upgrade head

# Start the server
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### Frontend (Next.js)

```bash
cd frontend

# Install dependencies
npm install

# Create environment file
echo "NEXT_PUBLIC_API_URL=http://localhost:8000" > .env.local
echo "NEXT_PUBLIC_WS_URL=ws://localhost:8000/ws" >> .env.local

# Start development server
npm run dev
```

### Database (PostgreSQL)

You'll need a local PostgreSQL instance. Update `DATABASE_URL` in your `.env`:

```env
DATABASE_URL=postgresql+asyncpg://your-user:your-password@localhost:5432/querysync
```

---

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

---

## 🚀 Deployment

### Render (Current Deployment)

The application is currently deployed on Render:
- **Frontend**: Render Static Site
- **Backend**: Render Web Service
- **Database**: Render PostgreSQL

### AWS (ECS/EC2)

1. Push images to ECR
2. Deploy with ECS Fargate or EC2 + Docker Compose
3. Use RDS for PostgreSQL
4. Configure ALB for SSL termination

---

## 🐳 Useful Docker Commands

| Command | Description |
|---------|-------------|
| `docker-compose up --build` | Build and start all services |
| `docker-compose up -d` | Start in detached mode (background) |
| `docker-compose down` | Stop all services |
| `docker-compose down -v` | Stop and remove volumes (clears database) |
| `docker-compose logs -f` | View logs from all services |
| `docker-compose logs -f backend` | View backend logs only |
| `docker-compose restart backend` | Restart backend service |

---

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📄 License

This project is built for the Hemut Take-Home Project.

---

Built with ❤️ by [Kalpan](https://github.com/Kalpan2007)
