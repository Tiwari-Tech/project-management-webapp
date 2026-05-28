<div align="center">

# 📋 Project Management Web App

### A full-stack web application to plan, track, and collaborate on projects — all in one place.

[![Live Demo](https://img.shields.io/badge/🚀_Live_Demo-Vercel-black?style=for-the-badge)](https://project-mgt-app-server.vercel.app)
[![JavaScript](https://img.shields.io/badge/JavaScript-99%25-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black)](https://github.com/Tiwari-Tech/project-management-webapp)
[![License](https://img.shields.io/badge/License-MIT-blue?style=for-the-badge)](LICENSE)

</div>

---

## 📖 About

A clean, responsive **Project Management Web Application** built with a modern JavaScript stack. Designed to help teams and individuals create projects, manage tasks, assign responsibilities, track deadlines, and collaborate effectively — all from a browser.

The app follows a **client-server architecture**, with a dedicated React frontend and a Node.js/Express backend, both deployed seamlessly on Vercel.

---

## ✨ Features

- 📁 **Project Management** — Create, update, and delete projects with ease
- ✅ **Task Tracking** — Assign tasks, set priorities, and mark completions
- 👥 **Team Collaboration** — Assign members to projects and tasks
- 📅 **Deadline Management** — Set and monitor due dates across all tasks
- 📊 **Progress Overview** — Visual status indicators for project health
- 🔐 **User Authentication** — Secure login and registration system
- 📱 **Responsive Design** — Works seamlessly on desktop, tablet, and mobile
- ☁️ **Cloud Deployed** — Hosted on Vercel with instant availability

---

## 🛠️ Tech Stack

### Frontend (`/client`)
| Technology | Purpose |
|------------|---------|
| **React.js** | UI framework & component architecture |
| **JavaScript (ES6+)** | Core language |
| **CSS / Tailwind CSS** | Styling & responsive layout |
| **Axios** | HTTP client for API calls |
| **React Router** | Client-side routing & navigation |

### Backend (`/server`)
| Technology | Purpose |
|------------|---------|
| **Node.js** | Runtime environment |
| **Express.js** | REST API framework |
| **MongoDB / Database** | Data persistence |
| **JWT** | Secure authentication tokens |
| **bcrypt** | Password hashing |
| **CORS** | Cross-origin request handling |

### DevOps & Tools
| Tool | Purpose |
|------|---------|
| **Vercel** | Frontend & backend deployment |
| **Git & GitHub** | Version control & collaboration |
| **.env** | Environment variable management |

---

## 🏗️ Architecture

```
project-management-webapp/
│
├── client/                     # React Frontend
│   ├── public/                 # Static assets
│   └── src/
│       ├── components/         # Reusable UI components
│       ├── pages/              # Route-level pages
│       ├── services/           # API call functions
│       ├── context/            # Global state management
│       ├── hooks/              # Custom React hooks
│       └── App.js              # App entry point
│
├── server/                     # Node.js Backend
│   └── src/
│       ├── controllers/        # Request handlers & business logic
│       ├── routes/             # API endpoint definitions
│       ├── models/             # Database schema & models
│       ├── middleware/         # Auth guards, error handlers
│       └── utils/              # Helper functions
│
├── .gitignore
├── .vercelignore
└── README.md
```

---

## 🚀 Getting Started

### Prerequisites

- Node.js v16+
- npm or yarn
- MongoDB (local or Atlas cloud instance)

---

### 1. Clone the Repository

```bash
git clone https://github.com/Tiwari-Tech/project-management-webapp.git
cd project-management-webapp
```

---

### 2. Setup the Backend

```bash
cd server
npm install
```

Create a `.env` file inside `/server`:

```env
PORT=5000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret_key
CLIENT_URL=http://localhost:3000
```

Start the server:

```bash
npm start
# or for development with auto-reload:
npm run dev
```

> Backend runs at: `http://localhost:5000`

---

### 3. Setup the Frontend

```bash
cd ../client
npm install
```

Create a `.env` file inside `/client`:

```env
REACT_APP_API_URL=http://localhost:5000
```

Start the React app:

```bash
npm start
```

> Frontend runs at: `http://localhost:3000`

---

## 🌐 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/auth/register` | Register a new user |
| `POST` | `/api/auth/login` | Login & receive JWT token |
| `GET`  | `/api/projects` | Fetch all projects |
| `POST` | `/api/projects` | Create a new project |
| `PUT`  | `/api/projects/:id` | Update a project |
| `DELETE` | `/api/projects/:id` | Delete a project |
| `GET`  | `/api/tasks/:projectId` | Get tasks for a project |
| `POST` | `/api/tasks` | Create a new task |
| `PUT`  | `/api/tasks/:id` | Update task status/details |
| `DELETE` | `/api/tasks/:id` | Delete a task |

---

## ☁️ Deployment

This app is deployed on **Vercel** for both frontend and backend.

**Live URL:** [https://project-mgt-app-server.vercel.app](https://project-mgt-app-server.vercel.app)

To deploy your own instance:

1. Push your code to GitHub
2. Go to [vercel.com](https://vercel.com) and import the repository
3. Set the **root directory** to `client` for frontend and `server` for backend
4. Add your environment variables in the Vercel dashboard
5. Deploy 🚀

---

## 👥 Contributors

| Contributor | Role |
|-------------|------|
| **[Tiwari-Tech](https://github.com/Tiwari-Tech)** | Full Stack Development — Frontend UI, routing, API integration, Vercel deployment |

---

## 📄 License

This project is licensed under the **MIT License** — feel free to use, modify, and distribute it.

---

## 🙌 Acknowledgements

- [React.js](https://reactjs.org/) — for the powerful UI framework
- [Express.js](https://expressjs.com/) — for the clean and minimal backend
- [Vercel](https://vercel.com/) — for effortless deployment
- [MongoDB Atlas](https://www.mongodb.com/atlas) — for cloud database hosting

---

<div align="center">

Made with ❤️ by [Tiwari-Tech](https://github.com/Tiwari-Tech)

⭐ **Star this repo if you found it helpful!**

</div>
