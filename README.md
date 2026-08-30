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

---

## Database Architecture & User-Role Relationship

### Many-to-Many User-Roles Junction Table

The platform uses a Many-to-Many (M:N) relationship model between `users` and `roles` via the `user_roles` junction table:

`Users (1) <---> (N) UserRoles (N) <---> (1) Roles`

```sql
users (id, name, email, password_hash, employee_id, region_id, practice_id, status, ...)
roles (id, name, description)
user_roles (user_id REFERENCES users(id), role_id REFERENCES roles(id), PRIMARY KEY(user_id, role_id))
```

### Admin Account Creation & Restrictions

1. **Single Seeded Admin**: There is only **one Admin account** (`System Administrator`) in the platform, initialized strictly via the database seeding script (`seed.ts`).
2. **UI & API Restriction**: The `System Administrator` role is excluded from role selection lists in the user creation UI. Attempting to assign or create an Admin user via the `/api/users` REST API returns a `400 Bad Request` security error.

---

## Seed Test User Credentials

All passwords are saved as secure `bcrypt` hashes in the database. Plaintext passwords below are provided for development and testing purposes only:

| User Name | Email | Assigned Role(s) | Region / Practice | Plain Test Password |
| :--- | :--- | :--- | :--- | :--- |
| **System Administrator** | `admin@rtdp.com` | `System Administrator` | APAC / — | `Admin@786` |
| **Sarah Practice Lead** | `practice.lead@rtdp.com` | `Practice Lead` | APAC / Software Engineering | `Admin@786` |
| **Rohan Regional Lead** | `regional.lead@rtdp.com` | `Regional Lead` | KSA / — | `Admin@786` |
| **Tania Training Manager** | `training.manager@rtdp.com` | `Training Manager` | UAE / — | `Admin@786` |
| **Michael Mentor** | `mentor@rtdp.com` | `Mentor`, `Practice Lead` | VSI / Quality Assurance | `Admin@786` |
| **Rachel Resource** | `resource@rtdp.com` | `Resource` | APAC / Software Engineering | `Admin@786` |
| **Marcus Management** | `management@rtdp.com` | `Management` | APAC / — | `Admin@786` |

