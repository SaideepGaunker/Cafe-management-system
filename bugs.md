Active Bugs & AI Execution Guide

## Instructions for AI
* You have full autonomy to inspect files, edit code, and make necessary fixes across the codebase.
* Do not hesitate to apply full fixes or modify files as needed to resolve the issues completely.
* After resolving an issue, mark the corresponding checkbox from `[ ]` to `[x]`. Leave unresolved or pending items as `[ ]`.
* Pushing the code to the gate to perform test cases and then once the test cases have passed, you push the code. 

## Bug Checklist
[x] Bug 1: Gmail Order Status Email Notifications Not Received by Customers
    Severity: High / Critical

    Affected Area: Backend Mail Service (`mailService.ts`), Order Status Controller (`orders.ts`), Nodemailer SMTP / Gmail Configuration & Delivery

    Description:
    Email notifications for order lifecycle updates (e.g., "Order Confirmation", "In Preparation / In Progress", "Ready for Pickup", "Out for Delivery", and "Completed") are delivered to customers' Gmail inboxes. When an order is placed or when staff/admin updates the order status in the Kitchen KDS or Admin Portal, Nodemailer dispatches HTML email notifications with startup transport verification.

    Root Cause Analysis:
    - Missing or misconfigured SMTP environment variables (`SMTP_USER`, `SMTP_PASS` / Gmail App Password, `SMTP_HOST`, `SMTP_PORT`, `EMAIL_FROM`) in the backend hosting environment (e.g., Railway / `.env`).
    - Gmail SMTP authentication failure (e.g., standard Google account password used instead of a 16-character Google App Password, or 2-Factor Authentication blocking basic SMTP login).
    - Asynchronous transport / connection failure in `sendOrderStatusEmail` when Nodemailer fails to establish TLS/SSL handshake with `smtp.gmail.com:587` or `smtp.gmail.com:465`.
    - Null or unpopulated `customerEmail` on the order record during status update payload processing.
    - Outgoing mail silently dropped, delayed, or flagged by spam filters due to missing SPF/DKIM or cloud server IP reputation.

    Action Items / Tasks:
    - [x] Verify and configure SMTP environment credentials (`SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `EMAIL_FROM`) in backend deployment environment.
    - [x] Ensure a valid 16-character Google App Password is generated and applied in `SMTP_PASS`.
    - [x] Check backend server logs for Nodemailer error traces during `sendOrderStatusEmail` invocations.
    - [x] Validate that `order.customerEmail` and `order.user.email` are reliably captured and passed to the mail service during status updates.
    - [x] Implement Nodemailer startup verification (`transporter.verify()`) to log clear diagnostic warnings if the mail server is unreachable or credentials are invalid.

[x] Bug 2: Live Order Status Not Updating in Real-Time (Requires Hard Reload)
    Severity: Medium / High

    Affected Area: Customer Order Tracking / Status Dashboard

    Description:
    On the deployed environment, changes to order statuses do not reflect dynamically on the customer's page. The customer is forced to manually refresh the browser to fetch updated state.

    Root Cause Analysis:

    WebSocket / Server-Sent Events (SSE) connection is failing to establish or disconnecting silently in the production/deployed environment.

    Reverse proxy configuration (e.g., NGINX, Cloudflare, AWS ALB) is not configured to upgrade HTTP connections to WebSockets (Upgrade $http_upgrade, Connection "upgrade").

    Frontend state management (React/Vue/Redux/Zustand) is not subscribing to incoming socket events or failing to trigger re-renders upon event arrival.

    Action Items / Tasks:

    Check browser console and network WS tab on production for failed WebSocket handshakes (e.g., 400 Bad Request, 502 Bad Gateway).

    Verify reverse proxy / load balancer WebSocket headers and timeouts.

    Ensure client-side socket listener updates the local cache/state when receiving status change payloads.

[x] Bug 3: Cross-Role Real-Time Notifications Not Delivering to Customer
    Severity: High

    Affected Area: Live Notification System / Event Pub-Sub Channel

    Description:
    In-session notifications work when triggered by the customer's own local actions. However, when staff/admin performs an action on their portal (e.g., marking an order as "Ready"), the target customer receives no real-time pop-up notification.

    Root Cause Analysis:

    Room/Channel Misconfiguration: The customer is not joined to their dedicated user/order room (e.g., user_<id> or order_<id>), or the staff backend handler is broadcasting to the wrong channel.

    Pub/Sub Scaling Issue: If multiple server instances/processes are running in production, events emitted from the staff instance are not propagating to the customer's connected instance (missing Redis Pub/Sub / message broker adapter).

    Action Items / Tasks:

    Verify customer room subscription logic upon socket connection (socket.join("user_" + customerId)).

    Verify staff backend action emits event to target room: io.to("user_" + targetCustomerId).emit("order_notification", data).

    Ensure message broker (e.g., Redis adapter for Socket.io) is enabled if running multi-instance production servers.

    Verify UI toast/notification provider is hooked into the socket listener.

[x] Bug 4: Phone Number Input Auto-Erase / Overwrite Issue in Customer Profile
    Severity: High

    Affected Area: Customer Profile (/profile), Phone Number Input / Management

    Description:
    In the customer profile, when a user attempts to add/enter a phone number, the field automatically erases typed digits. For instance, after entering five numbers, all five digits get erased, and the sixth number is typed at the first position.

    Root Cause Analysis:
    - Input masking or controlled input `onChange` / formatting logic resetting or miscalculating string slicing when reaching a specific digit count.
    - Regex pattern replacement or form state synchronization resetting state unexpectedly on intermediate inputs.

    Action Items / Tasks:
    - Inspect the phone number input component and its state / `onChange` handler in the profile view.
    - Fix the input formatting / mask to cleanly accept and preserve full phone numbers without clearing previous digits.
    - Validate proper state persistence upon form submission.

[x] Bug 5: Multi-Item Order Placement Fails ("Failed to place order")
    Severity: High / Blocker

    Affected Area: Cart / Checkout, Order Placement Endpoint (/api/orders or checkout flow)

    Description:
    When a customer attempts to place an order containing multiple products (e.g., 3 products at once), the transaction fails with the error message "Failed to place order".

    Root Cause Analysis:
    - Payload mismatch or serialization issue in frontend cart submission when sending multi-item arrays.
    - Backend order creation service / transaction failing on batch validation, inventory checks, or database insert loops for multiple items.

    Action Items / Tasks:
    - Inspect the checkout request payload sent by the frontend for orders with 3+ items.
    - Inspect backend order controller / order creation route and database models for handling multi-item arrays and transactions.
    - Ensure correct validation, pricing calculation, and atomic creation of order items.

[x] Bug 6: Redundant Dashboard Live Order Status Component & Broken Real-Time Updates in Original "Track Product" View
    Severity: Medium / High

    Affected Area: Customer Dashboard, "Track Product" View / Modal

    Description:
    A duplicate live order status widget was mistakenly added directly onto the customer dashboard. The original application already possesses a dedicated live order status component accessible when clicking "Track Product", but it was not receiving live real-time updates. The newly added duplicate dashboard component must be removed, and real-time socket event updates must be fixed in the existing "Track Product" view instead.

    Root Cause Analysis:
    - Redundant UI widget introduced to the dashboard instead of repairing the pre-existing tracking component.
    - The original "Track Product" component lacks proper socket subscription / state synchronization to reactively update its stage/status upon backend order status events.

    Action Items / Tasks:
    - Remove the newly inserted duplicate live order tracking widget from the customer dashboard.
    - Locate the original "Track Product" component / modal opened via the track button.
    - Connect WebSocket real-time listeners (`order_status_updated` / socket events) to the original "Track Product" component to update live order status dynamically without requiring manual reloads.

[x] Bug 7: Dashboard UI & Product Cards Display Layout Broken After Widget Removal
    Severity: High

    Affected Area: Customer Dashboard UI, Product Cards Grid / Container

    Description:
    Removing the live tracking widget from the dashboard corrupted the overall layout and styling of the customer dashboard. The product cards are no longer displayed properly, causing visual alignment and grid structure issues across the page.

    Root Cause Analysis:
    - CSS grid/flex layout containers or JSX wrapper tags on the customer dashboard were altered or removed alongside the tracking widget, breaking the responsiveness and card grid structure.

    Action Items / Tasks:
    - Restore the customer dashboard's layout wrappers, CSS grid/flex styling, and container hierarchy.
    - Ensure product cards render with proper spacing, alignment, and responsiveness as in the previous working dashboard design.

[x] Bug 8: Inner "Track Product" Modal / View Not Receiving Real-Time Live Order Updates
    Severity: High

    Affected Area: "Track Product" Button / Order Tracking Modal / Detailed View

    Description:
    The primary inner order tracking feature (which activates upon clicking the "Track Product" button) is not receiving real-time live status updates when order statuses change. While the previously removed dashboard widget had working real-time updates, the inner "Track Product" component was not working in real time previously and remains non-functional.

    Root Cause Analysis:
    - The modal/view opened by the "Track Product" button is not subscribed to the WebSocket event channel or is missing reactive state bindings for incoming `order_status_updated` / `status_changed` payloads.

    Action Items / Tasks:
    - Inspect the component/modal activated by the "Track Product" button.
    - Wire WebSocket / Socket.io listeners and room subscriptions into the inner "Track Product" component.
    - Verify that order status steps (Pending -> Preparing -> Ready -> Delivered/Completed) advance live in the inner tracking view without requiring manual page refresh.

[x] Bug 9: Rebuild Dashboard-Level Live Order Tracker (As Implemented in Bug 2)
    Severity: High

    Affected Area: Customer Dashboard, Live Order Tracking Component

    Description:
    Remove the current order tracking implementation and rebuild the dashboard-level live order tracking banner/component that was previously working and updating in real-time (as originally implemented in Bug 2 directly on the dashboard).

    Root Cause Analysis:
    - The previous dashboard-embedded tracking component was functioning correctly with real-time socket events before being removed.

    Action Items / Tasks:
    - Re-implement/restore the live order tracking widget directly on the Customer Dashboard as implemented in Bug 2.
    - Ensure real-time WebSocket listeners connect to this dashboard widget so status updates reflect immediately without page refreshes.
    - Clean up any broken or redundant alternative tracking flows.

[x] Bug 10: Product Cards Alignment & Comprehensive Dashboard UI/Styling Overhaul
    Severity: High

    Affected Area: Customer Dashboard, Product Cards Grid, Card Layout & Typography

    Description:
    The UI of the product cards is disaligned and improperly structured. The product cards, grid spacing, layout hierarchy, and overall customer dashboard styling require a complete design and alignment overhaul.

    Root Cause Analysis:
    - Inconsistent card dimensions, uneven padding/margins, image container aspect ratio mismatches, and flexbox/grid alignment discrepancies causing broken alignment across different screen sizes.

    Action Items / Tasks:
    - Fix product card grid styling (standardize card heights, image ratios, padding, button alignments, and pricing badges).
    - Refine responsive breakpoints (mobile, tablet, desktop) to prevent card overflow or uneven columns.
    - Enhance overall dashboard aesthetics with clean modern styling, polished typography, and visual consistency.

[x] Bug 11: Multi-Quantity, Multi-Product & Dynamic Stock Limit Order Placement Failures
    Severity: High / Blocker

    Affected Area: Frontend Cart / Quantity Selector / Checkout, Backend Order Controller, Inventory Validation & DB Transaction

    Description:
    Order placement failed when ordering multiple units of an item (`quantity >= 2`) or when adding 3 or more distinct products to cart, throwing `Transaction API error: Transaction already closed: A query cannot be executed on an expired transaction. The timeout for this transaction was 5000 ms, however 5253 ms passed since the start of the transaction.` during `prisma.ingredient.update()`.
    Additionally, the order quantity limit must dynamically match the actual available stock (e.g., if 100 units are available in stock, the customer should be able to order up to 100 units).

    Root Cause Analysis:
    - Default Prisma interactive transaction timeout (`5000ms`) was exceeded when processing multiple order items / ingredients sequentially (`tx.ingredient.update` and `tx.stockTransaction.create` ran in a sequential loop, multiplying network latency across remote MongoDB connections).
    - Missing explicit timeout parameters `{ maxWait: 15000, timeout: 30000 }` on `prisma.$transaction`.

    Action Items / Tasks:
    - [x] Configure explicit `maxWait: 15000` and `timeout: 30000` on Prisma interactive transactions in `backend/src/routes/orders.ts` and `inventory.ts`.
    - [x] Parallelize ingredient updates and stock transaction logging using `Promise.all` inside the interactive transaction to drastically cut database round-trip latency.
    - [x] Enforce dynamic stock-based quantity limits on both frontend and backend (allow ordering up to available stock, e.g., 100 if stock is 100).
    - [x] Ensure robust batch insertion, inventory deduction, and atomic transactions for multi-item (3+) and multi-quantity orders.
    - [x] Eliminate all failure points to guarantee seamless order placement for any valid stock-compliant order.

[x] Bug 12: Incomplete User Session Termination on Logout Causing Cross-Role Auto-Login via URL Navigation
    Severity: High / Critical

    Affected Area: Frontend Auth State Management (`App.tsx`), LocalStorage / Session Token Lifecycle, Route Guards & Navigation

    Description:
    When any user (Staff, Admin, or Customer) logs out and subsequently attempts to access the login page or customer storefront by typing the URL and pressing Enter, the application treats them as logged out cleanly.

    Root Cause Analysis:
    - `handleLogout` only partially cleared auth state, leaving lingering user objects in `localStorage` (`cafe_user`).
    - App initialization (`fetchData`) restored user session from un-cleared `cafe_user` when tokens were absent.

    Action Items / Tasks:
    - [x] Perform full session purge on logout: remove all auth tokens (`cafe_auth_token`), user data (`cafe_user`), tracked order, cart items, and socket authentication across all components.
    - [x] Invalidate and reset client-side user state (`currentUser`, `orders`, `cartItems`, `ingredients`) to prevent lingering state reuse.
    - [x] Enforce strict route guards so that accessing `/` or `/staff-portal` post-logout presents a clean unauthenticated/login state rather than auto-authenticating with stale credentials.
    - [x] Validate logout and URL re-entry across all user roles (Staff -> Customer, Admin -> Staff, Customer -> Staff) to guarantee absolute session isolation.

[x] Bug 13: Incomplete Mobile Responsiveness & Viewport Optimization Across Core UI Views
    Severity: Medium / High

    Affected Area: Customer Storefront, Navbar, Cart Drawer & Checkout, Kitchen KDS, Admin Dashboard / Inventory Tables, Offline POS & Profile

    Description:
    The application user interface is fully responsive across desktop, tablet, and mobile viewports (< 768px, < 480px, < 360px). All views render cleanly without horizontal overflow, touch targets are optimized, and card grids scale fluidly.

    Root Cause Analysis:
    - Fixed pixel widths and rigid grid layouts without fluid responsive `minmax()` or auto-fit wrapping.
    - Missing CSS media query breakpoints for mobile screen sizes (320px - 768px).

    Action Items / Tasks:
    - [x] Establish cohesive responsive media query breakpoints (320px, 375px, 480px, 768px, 1024px) across all global styles and components.
    - [x] Refactor Customer Storefront (Hero banner, Category filter pills, Product Card grid, Live Tracker) for fluid mobile layouts and single/two-column scaling.
    - [x] Optimize Cart Drawer, Checkout, and Auth Modals for mobile viewports with flexible bottom-sheet styling and full touch accessibility.
    - [x] Convert dense Admin Inventory / Order tables to responsive card layouts or horizontally scrollable containers on mobile.
    - [x] Ensure Kitchen KDS and Offline POS provide touch-friendly, ergonomic card layouts on mobile and tablet screens.
    - [x] Eliminate all unintended horizontal page scroll (`overflow-x: hidden`) and guarantee smooth, polished 60fps mobile touch interaction.

[x] Bug 14: Gmail Order Lifecycle Email Notifications Not Delivering to Customer Inboxes
    Severity: High / Critical

    Affected Area: Backend Mail Service (`mailService.ts`), Order Creation & Status Controller (`orders.ts`), Frontend Cart/Checkout (`CartDrawer.tsx`), SMTP Environment Credentials (`.env`)

    Description:
    Real-time Gmail email notifications for order lifecycle milestones (Order Confirmation, Preparation Started, Ready for Pickup, Out for Delivery, and Order Completed/Cancelled) are delivered to customers' inboxes via Nodemailer with Gmail service optimization and password sanitization.

    Root Cause Analysis:
    - Password formatting and whitespace handling in Google App Passwords (`SMTP_PASS`).
    - Sender address header (`SMTP_FROM`) mismatch with authenticated `SMTP_USER`.
    - Missing frontend checkout email validation.

    Action Items / Tasks:
    - [x] Update `SMTP_PASS` handling in `mailService.ts` to sanitize and strip whitespace from Google App Passwords.
    - [x] Correct `SMTP_FROM` to match the exact authenticated Gmail address (`SMTP_USER`).
    - [x] Enhance `mailService.ts` transporter configuration to support direct `service: 'gmail'` profile with robust startup verification.
    - [x] Enforce frontend email validation in `CartDrawer.tsx` so customers provide a valid email format to receive receipts and status tracking alerts.
    - [x] Validate end-to-end delivery of all 5 email templates (Confirmation, In Progress, Ready, Out for Delivery, Completed) to active Gmail addresses.


