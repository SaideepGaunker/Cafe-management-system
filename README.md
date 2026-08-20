# ☕ BiiZnest - Real-Time Cafe Management System (CMS) & POS

**BiiZnest** is an end-to-end, full-stack Cafe Management System (CMS) and Point-of-Sale (POS) application built for modern cafes and restaurants. It features real-time order tracking, automated inventory deduction, kitchen queue management, offline sales queuing, role-scoped WebSocket alerts, and automated email notifications.

---

## 🌟 Key Features

### 🛒 1. Customer Storefront & Live Order Tracker
- **Interactive Menu Catalog**: Browse menu items categorized by Coffee, Bakery, Teas, and Pastries.
- **Dynamic Stock Badges**: Real-time availability badges (*e.g., "5 left"*, *"Sold Out"*) computed dynamically from ingredient stock dependencies.
- **Cart Drawer & Auth Guards**: Unauthenticated users are seamlessly prompted to sign in before checkout.
- **Live Visual Order Tracker**: Real-time modal tracking order progress (`Pending` $\rightarrow$ `Preparing` $\rightarrow$ `Ready` $\rightarrow$ `Out for Delivery` $\rightarrow$ `Completed`).

### 👨‍🍳 2. Kitchen Display System (KDS)
- **Real-Time Order Queue**: Incoming orders pop up instantly on staff screens via Socket.io.
- **Status Searching Tags**: Filter queue by `🔥 Active Queue`, `⏳ Pending`, `👨‍🍳 Preparing`, `✅ Ready`, `🚚 Out for Delivery`, `🏁 Completed`, or `All Orders`.
- **One-Click Order Actions**: Transition order statuses with single-click action buttons.
- **Kitchen Ingredient Restock**: Barista staff can restock ingredients directly from the KDS monitor.

### 👑 3. Executive Admin Portal
- **Menu & Recipe Manager**: Full CRUD for menu items and their ingredient recipe mappings.
- **Inventory & Supplier Catalog**: Track ingredient stock levels, cost per unit, reorder thresholds, and vendor details.
- **Employee Staff Accounts**: Provision or disable staff accounts with role-based permissions.
- **Sales Analytics Reports**: Interactive revenue graphs, top-selling items breakdown, ingredient usage trends, and one-click PDF report export.

### 🖥️ 4. Offline Counter POS Mode
- **Offline Sales Resilience**: Baristas can take walk-up counter orders even during internet outages.
- **Local Storage Queue**: Counter transactions are stored locally in the browser and automatically synced to the central database & inventory when connection restores.

### 🔔 5. Role-Scoped WebSockets & Email Notifications
- **JWT Socket Authentication**: WebSockets enforce role-scoped rooms (`staff_room`, `user:${id}`, `order:${id}`).
- **Staff-Only Low-Stock Alerts**: Sensitive "Inventory Out of Stock" alert popups emit strictly to `staff_room` and are filtered from customers.
- **Nodemailer Email Integration**: Customers receive automated HTML email updates when their order is `READY` for pickup or `OUT_FOR_DELIVERY`.

---

## 🔑 Quick Demo Login Credentials

You can test out the various role perspectives using the built-in quick login buttons or credentials below:

| Role | Email | Password | Access Portal |
| :--- | :--- | :--- | :--- |
| **👑 Cafe Manager (Admin)** | `admin@cafe.com` | `admin123` | `/staff-portal` (or Staff Portal Link) |
| **☕ Barista Staff** | `staff@cafe.com` | `staff123` | `/staff-portal` (or Kitchen Display) |
| **🛍️ Customer Demo** | `customer@cafe.com` | `customer123` | Customer Storefront Modal (`/`) |

---

## 🛠️ Tech Stack

### **Frontend**
- **Framework**: React 18, TypeScript, Vite
- **Routing**: React Router v6
- **Real-Time Communications**: Socket.io-client
- **Icons & UI**: Lucide Icons, Custom CSS Design System

### **Backend**
- **Runtime & Server**: Node.js, Express.js, TypeScript
- **Database & ORM**: MongoDB Atlas, Prisma ORM
- **Authentication**: JWT (JSON Web Tokens), bcryptjs
- **WebSockets**: Socket.io (with JWT auth middleware & room scoping)
- **Email Delivery**: Nodemailer (Gmail SMTP integration)
- **Testing**: Vitest, Supertest

---

## 🚀 Local Development Setup

### Prerequisites
- [Node.js](https://nodejs.org/) (v18 or higher)
- `npm` package manager

### 1. Clone the Repository
```bash
git clone https://github.com/your-username/biiznest.git
cd biiznest
```

### 2. Backend Setup
```bash
cd backend
npm install
```

Create a `.env` file inside the `backend/` directory:
```env
PORT=5000
DATABASE_URL="mongodb+srv://<username>:<password>@cluster0.mongodb.net/biiznestdb?retryWrites=true&w=majority"
JWT_SECRET="biiznest_secret_key_2026_super_secure"

# Email SMTP Credentials (Gmail App Password)
SMTP_HOST="smtp.gmail.com"
SMTP_PORT=587
SMTP_USER="your-email@gmail.com"
SMTP_PASS="your-gmail-app-password"
SMTP_FROM="BiiZnest <your-email@gmail.com>"
```

Generate Prisma client and seed sample data:
```bash
npx prisma generate
npx prisma db seed
```

Start the backend development server:
```bash
npm run dev
```
*(Backend runs on `http://localhost:5000`)*

### 3. Frontend Setup
Open a new terminal window:
```bash
cd frontend
npm install
```

Create a `.env` file inside the `frontend/` directory (optional for local defaults):
```env
VITE_API_URL="http://localhost:5000/api"
VITE_SOCKET_URL="http://localhost:5000"
```

Start the frontend Vite development server:
```bash
npm run dev
```
*(Frontend runs on `http://localhost:5173`)*

---

## 🧪 Running Tests

To run the automated backend test suite (unit & integration tests for auth, inventory, and nodemailer email delivery):

```bash
cd backend
npm test
```

---

## 🌐 Cloud Deployment Guide

### Deploy Backend on Railway
1. Create a project on [Railway.app](https://railway.app) connected to your GitHub repository.
2. In **Settings** $\rightarrow$ **Root Directory**, set: `backend`.
3. In **Variables**, add:
   - `PORT=5000`
   - `DATABASE_URL` *(Your MongoDB Atlas URL)*
   - `JWT_SECRET`
   - `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM`
4. Copy your Railway public domain (e.g. `https://biiznest-backend.up.railway.app`).

### Deploy Frontend on Vercel
1. Create a project on [Vercel.com](https://vercel.com) connected to the same GitHub repository.
2. Set **Root Directory** to: `frontend`.
3. In **Environment Variables**, add:
   - `VITE_API_URL`: `https://biiznest-backend.up.railway.app/api`
   - `VITE_SOCKET_URL`: `https://biiznest-backend.up.railway.app`
4. Deploy!

---

## 📝 License
This project is open source and available under the [MIT License](LICENSE).
