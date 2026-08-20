# Cafe Management System - Task List

This file tracks the status of all components implemented for the Cafe Management System.

## Phase 1: Environment & Project Setup
- [x] Initialise project directories: `backend/` and `frontend/`
- [x] Backend configurations: `tsconfig.json`, `package.json`, environment variables (`.env`)
- [x] Frontend configurations: Vite + React + TypeScript, `tsconfig.json`, `package.json`
- [x] Set up Prisma ORM and SQLite configuration

## Phase 2: Backend Development (API & Database)
- [x] Create Database Schema in `schema.prisma`
  - [x] Users (with Role field: customer, staff, admin)
  - [x] Menu Items
  - [x] Ingredients
  - [x] MenuItemIngredients (Recipe mapping table)
  - [x] Orders & OrderItems
  - [x] Suppliers
  - [x] StockTransactions
- [x] Implement JWT-based Authentication
  - [x] User register and login endpoints
  - [x] Password hashing (bcryptjs)
  - [x] Middleware for JWT verification & role protection
- [x] Implement Menu API
  - [x] `GET /api/menu` - Fetch menu items (with available stock count calculated from ingredients)
  - [x] `POST /api/menu` - Add menu item (Admin only)
  - [x] `PUT /api/menu/:id` - Update menu item (Admin only)
  - [x] `DELETE /api/menu/:id` - Delete menu item (Admin only)
- [x] Implement Orders API
  - [x] `POST /api/orders` - Place order (Customer only, deduct stock on placing or status updates)
  - [x] `GET /api/orders` - Fetch all orders (Staff/Admin) or user-specific orders (Customer)
  - [x] `PATCH /api/orders/:id/status` - Transition order status (`Pending` -> `In-Progress` -> `Ready` -> `Completed`)
- [x] Implement Inventory & Supplier API
  - [x] `GET /api/inventory` - Get all ingredients and stock levels (Staff/Admin)
  - [x] `POST /api/inventory/restock` - Log restocking transaction & update stock levels (Admin/Staff)
  - [x] `GET /api/suppliers` - Get supplier contact list (Admin only)
  - [x] `POST /api/suppliers` - Create/edit supplier details (Admin only)
- [x] Implement Reports API
  - [x] `GET /api/reports/sales` - Sales reports and summaries (Admin/Staff)
  - [x] `GET /api/reports/trends` - Ingredient usage trends over time (Admin only)
- [x] Implement real-time WebSockets (Socket.io) & Mail Notifications (Nodemailer)
  - [x] Authenticate WebSocket connections via JWT and scope rooms (`staff_room`, `user:${id}`)
  - [x] Restrict Low-Stock / Out-of-Stock alerts strictly to Staff/Admin rooms (hidden from customers)
  - [x] Broadcast order status updates to customer-specific user rooms & tracking rooms in real-time
  - [x] Send email notifications to user when order status updates to `OUT_FOR_DELIVERY` or `READY`

## Phase 3: Frontend Development (React & CSS)
- [x] Foundation: Set up CSS Variables, styling system (`index.css`), and layout wrapping.
- [x] State Management: Set up Zustand / React state & socket service for global cart, authentication state, and websocket listeners.
- [x] Pages & Components implementation:
  - [x] Login / Register page with instant quick demo accounts
  - [x] Customer Dashboard
    - [x] List menu items grouped by categories
    - [x] Real-time cart system (add, edit quantities, remove)
    - [x] Stock availability visual badges (computed from backend dependencies)
    - [x] Real-time Order Tracking section
  - [x] Staff Dashboard
    - [x] Real-time order queue with status update controls
    - [x] Current ingredient levels and low-stock flashing banners
    - [x] Stock adjustments form (adding ingredients manually)
  - [x] Admin Dashboard
    - [x] CRUD manager for menu items (name, price, ingredient dependencies)
    - [x] Staff account controls (create new staff, disable existing)
    - [x] Sales report charts/tables and exporter
    - [x] Supplier catalog manager
- [x] Bonus: Offline state handling (local storage order queue when connection is lost)

## Phase 4: Testing & Validation
- [x] Write integration tests for backend JWT authentication
- [x] Write tests for inventory deduction upon order creation
- [x] Write unit tests for frontend cart logic
- [x] Manual end-to-end verification of user registration, ordering, stock deduction, and real-time alerts.
