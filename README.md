# RTDP - Resource Training Development Platform

Full-stack project structure initialized with React, Vite, TypeScript, Tailwind CSS, Node.js, Express, and PostgreSQL structure.

## Project Structure

```text
rtdp-resource-training-platform/
│
├── frontend/                   # React Frontend
│   ├── src/
│   │   ├── api/
│   │   ├── assets/
│   │   ├── components/
│   │   │   ├── common/
│   │   │   ├── layout/
│   │   │   └── ui/
│   │   ├── context/
│   │   ├── hooks/
│   │   ├── pages/
│   │   ├── routes/
│   │   ├── types/
│   │   ├── utils/
│   │   ├── App.tsx
│   │   ├── main.tsx
│   │   └── index.css
│   │
│   ├── public/
│   ├── package.json
│   ├── tsconfig.json
│   └── vite.config.ts
│
├── backend/                    # Node + Express Backend
│   ├── src/
│   │   ├── config/
│   │   ├── controllers/
│   │   ├── middleware/
│   │   ├── models/
│   │   ├── routes/
│   │   ├── services/
│   │   ├── types/
│   │   ├── utils/
│   │   ├── database/
│   │   ├── app.ts
│   │   └── server.ts
│   │
│   ├── package.json
│   └── tsconfig.json
│
├── .gitignore
├── package.json
├── README.md
└── .env.example
```

## Available Commands

### 1. Install Dependencies

To install all dependencies for root, frontend, and backend with one command:

```bash
npm run install:all
```

Alternatively, install dependencies manually:

```bash
# Root dependencies
npm install

# Frontend dependencies
cd frontend && npm install

# Backend dependencies
cd backend && npm install
```

---

### 2. Run Frontend Separately

From the root directory:

```bash
npm run dev:frontend
```

Or inside the `frontend` folder:

```bash
cd frontend
npm run dev
```

---

### 3. Run Backend Separately

From the root directory:

```bash
npm run dev:backend
```

Or inside the `backend` folder:

```bash
cd backend
npm run dev
```

---

### 4. Run Both Frontend and Backend Together

From the root directory:

```bash
npm run dev
```

---

## Health Check Endpoint

- Backend Health Check: [http://localhost:5000/api/health](http://localhost:5000/api/health)
- Frontend Dev Server: [http://localhost:5173](http://localhost:5173)
