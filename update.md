# 🚀 BiiZnest CMS - Platform Access & Credentials Guide

## 🔗 Login Page URLs

### 1. Customer Storefront Login Page
- **URL Path**: `/` (Main Storefront Page, e.g. `https://<your-vercel-domain>.vercel.app/` or `http://localhost:5173/`)
- **Description**: Customers can browse the menu catalog. Clicking **"Sign In"** in the navigation bar or placing an order opens the Customer Auth Login modal.

### 2. Staff Login Portal (Kitchen Display System)
- **URL Path**: `/staff-portal` (e.g. `https://<your-vercel-domain>.vercel.app/staff-portal` or `http://localhost:5173/staff-portal`)
- **Description**: Dedicated employee login portal for Barista Staff. Once logged in, staff are redirected to the Kitchen Queue (`/kitchen`) and Offline POS (`/offline-pos`).

### 3. Executive Admin Login Portal
- **URL Path**: `/staff-portal` (e.g. `https://<your-vercel-domain>.vercel.app/staff-portal` or `http://localhost:5173/staff-portal`)
- **Description**: Admins log in through the same Employee Portal (`/staff-portal`). Upon authenticating as an Admin, they are automatically routed to the Executive Admin Dashboard (`/admin`).

---

## 🌐 Platform Hosting Details

The application is deployed across cloud hosting platforms:

* **Frontend**: Hosted on **Vercel** (React 18 + Vite SPA with SPA rewrite rules in `vercel.json` and `_redirects`).
* **Backend API & WebSockets**: Hosted on **Railway** (`https://cafe-management-system11-production.up.railway.app`) running Node.js, Express, Socket.io, and Nodemailer.
* **Database**: Hosted on **MongoDB Atlas** connected via Prisma ORM.

---

## 🔑 Demo Login Credentials

| Role | Access Portal Path | Email | Password | Description |
| :--- | :--- | :--- | :--- | :--- |
| **🛍️ Customer** | `/` (Storefront Modal) | `customer@cafe.com` | `customer123` | Storefront browsing, cart checkout, order tracking modal, and customer profile management. |
| **☕ Barista Staff** | `/staff-portal` | `staff@cafe.com` | `staff123` | Kitchen Display System queue, order status transitions, stock restocking, and Offline POS mode. |
| **👑 Cafe Manager (Admin)** | `/staff-portal` | `admin@cafe.com` | `admin123` | Executive Admin Portal, menu & recipe CRUD, inventory management, supplier catalog, sales analytics, and PDF export. |
