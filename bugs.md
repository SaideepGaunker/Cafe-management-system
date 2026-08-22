Active Bugs & AI Execution Guide

## Instructions for AI
* You have full autonomy to inspect files, edit code, and make necessary fixes across the codebase.
* Do not hesitate to apply full fixes or modify files as needed to resolve the issues completely.
* After resolving an issue, mark the corresponding checkbox from `[ ]` to `[x]`. Leave unresolved or pending items as `[ ]`.

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