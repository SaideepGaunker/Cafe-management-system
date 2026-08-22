Active Bugs & AI Execution Guide

## Instructions for AI
* You have full autonomy to inspect files, edit code, and make necessary fixes across the codebase.
* Do not hesitate to apply full fixes or modify files as needed to resolve the issues completely.
* After resolving an issue, mark the corresponding checkbox from `[ ]` to `[x]`. Leave unresolved or pending items as `[ ]`.
* Pushing the code to the gate to perform test cases and then once the test cases have passed, you push the code. 

## Bug Checklist
[x] Bug 1: Authentication Token Missing/Malformed on Protected Profile & Order Requests
    Severity: High / Blocker

    Affected Area: Customer Profile (/profile), Address Management, Order History (/orders)

    Description:
    When an authenticated customer attempts to mutate profile data (add/update phone number, add address) or fetch order history (completed/pending orders), the requests fail with authentication errors.

    Error Logs / UI Errors:

    Phone update: "missing valid tokens"

    Address update: "Unauthorized: Missing or invalid token formaUnauthorized: Missing or invalid token format"

    Orders view: Blank / 401 Unauthorized (orders list not rendering)

    Root Cause Analysis:

    The frontend API client/interceptor is either omitting the Authorization header, passing Bearer undefined/Bearer null, or improperly formatting the header string.

    Token refresh lifecycle or token retrieval from storage (localStorage/cookies/Auth Context) is failing before these specific endpoint calls.

    Action Items / Tasks:

    Inspect the API request wrapper/interceptor for profile, address, and order endpoints.

    Ensure the header attaches properly: Authorization: Bearer <token>.

    Implement fallback token validation / automatic redirect to login or silent refresh when the token is missing/expired.

    Fix backend auth middleware string-parsing to prevent concatenated error strings.

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
    Order placement currently fails when ordering multiple units of an item (`quantity >= 2`) or when adding 3 or more distinct products to cart, despite single-item 2-product orders succeeding.
    Additionally, the order quantity limit must dynamically match the actual available stock (e.g., if 100 units are available in stock, the customer should be able to order up to 100 units). A comprehensive diagnostic of the Order API is required to resolve all underlying cart, payload, inventory check, and transaction failure edge cases.

    Root Cause Analysis:
    - Hardcoded or restrictive quantity limits / payload mapping issues in the frontend cart and quantity selector.
    - Backend order creation pipeline failing during multi-item array iterations, stock validation, or database transaction locks when handling quantities > 1 or arrays of size >= 3.
    - Schema validation or pricing calculation mismatches on bulk item payloads.

    Action Items / Tasks:
    - Perform deep diagnostics across the entire Order API pipeline (frontend cart serialization -> checkout payload -> backend controller -> inventory validation -> DB transaction).
    - Enforce dynamic stock-based quantity limits on both frontend and backend (allow ordering up to available stock, e.g., 100 if stock is 100).
    - Ensure robust batch insertion, inventory deduction, and atomic transactions for multi-item (3+) and multi-quantity orders.
    - Eliminate all failure points to guarantee seamless order placement for any valid stock-compliant order.