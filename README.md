# CrisisCraft

CrisisCraft is a full-stack educational platform designed to empower students and educators with disaster preparedness and crisis management skills. The platform provides a comprehensive solution for interactive learning with a multi-portal management system.

## Features

*   **Three Distinct Portals**:
    *   **Admin Portal**: System-wide management, global alerts, and user oversight.
    *   **Teacher Portal**: Tools for uploading modules, managing content, and tracking student performance.
    *   **Student Portal**: Interactive learning dashboard, module viewer, and point tracking system.
*   **Authentication**: Enhanced role-based access control (RBAC) using JWT.
*   **Module Management**: Complete lifecycle for educational content with PDF support.
*   **Crisis Alerts**: Real-time system broadcasts for emergency notifications.

## Tech Stack

*   **Frontend**: HTML5, CSS3 (Vanilla), JavaScript (Vanilla)
*   **Backend**: Node.js with Express.js
*   **Database**: MongoDB with Mongoose ORM
*   **Authentication**: JWT-based auth with secure role-based permissions

---

## Getting Started

### Prerequisites
*   Node.js 18+ and npm
*   MongoDB database (Local or Atlas)

### Installation

1.  **Clone the repository**
    ```bash
    git clone https://github.com/yourusername/crisiscraft.git
    cd crisiscraft
    ```

2.  **Install dependencies**
    ```bash
    # For Backend
    cd backend
    npm install

    # For Root/Frontend (if applicable)
    cd ..
    npm install
    ```

3.  **Set up environment variables**
    Create a `.env` file in the `backend/` directory with the following variables:
    ```env
    PORT=5000
    MONGO_URI=your_mongodb_connection_string
    JWT_SECRET=your_super_secret_key
    ```

4.  **Initialize the database**
    ```bash
    cd backend
    node populate-db.js
    ```

5.  **Start the development server**
    ```bash
    cd backend
    npm run dev
    ```

6.  **Access the application**
    The application will be available at: `http://localhost:5000` (Backend)
    Open `frontend/index.html` in your browser to view the UI.


---

## Project Structure

```text
crisiscraft/
├── backend/                # Backend Express application
│   ├── config/             # Database & environment config
│   ├── controllers/        # Request handlers (logic)
│   ├── middleware/         # Auth & role-based middleware
│   ├── models/             # Mongoose schemas (User, Module, Alert)
│   ├── routes/             # API route definitions
│   └── server.js           # Main entry point
├── frontend/               # Frontend Vanilla application
│   ├── index.html          # Main application structure
│   ├── style.css           # Custom styling
│   ├── app.js              # Core application logic
│   ├── api.js              # API interaction helper
│   └── script.js           # UI interaction scripts
└── shared/                 # Shared resources and data
```

---

## Default Credentials

*   **Admin**:
    *   **Email**: `admin@crisiscraft.edu`
    *   **Password**: `admin`
*   **Teacher**:
    *   **Email**: `jane.smith@crisiscraft.edu`
    *   **Password**: `teacher`
*   **Student**:
    *   **Email**: `student@crisiscraft.edu`
    *   **Password**: `student`

---

## Deployment

This application can be deployed on any platform that supports Node.js applications with MongoDB databases, such as **Render**, **Railway**, or **Vercel**.

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgements

*   "Be Prepared, Not Scared" - Empowering communities through crisis education.
*   Built as part of the DPRES-ADL Project.
