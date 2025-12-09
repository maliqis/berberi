# Backend Integration Guide (React Native)

This document lists exactly what the React Native engineer needs to change to make the app fully compatible with the backend API, plus what to confirm with backend.

## 0) API Base URLs
- Use `config/api.js` -> `API_CONFIG.getBaseURL()` (already present). Set `DEV_API_URL` / `PROD_API_URL` appropriately.
- All calls should be prefixed with `/api` if your backend uses that path (current config assumes `/api`).

## 1) Auth & Token Handling
- Replace the **dummy login/signup** flows in `LoginScreen` and `SignupScreen` with real API calls:
  - `POST /auth/login` → returns `{ user, tokens }`
  - `POST /auth/signup` → returns `{ user, tokens }` (barber admin includes shop payload)
- Store `accessToken` in `@berberi_token`, and `user` in `@berberi_user` (same keys used in `AuthContext`).
- On each API call, send `Authorization: Bearer <accessToken>` (already supported in `services/api.js`).
- Implement **refresh** using `POST /auth/refresh` when 401 occurs; update stored tokens.
- Implement **logout** using `POST /auth/logout` then clear storage.

## 2) API Endpoints Mapping to Screens

### Landing / Login / Signup / Forgot Password
- Login: `POST /auth/login` with `{ email, password }`.
- Signup (customer or barber admin):
  - If `role=user`: `{ firstName, lastName, phoneNumber, email, password, role:'user' }`
  - If `role=barberAdmin`: include shop info `{ name, logoUrl?, workingDays[], shiftStart, shiftEnd, slotLengthMinutes }`
- Forgot password: if backend supports, `POST /auth/forgot-password` (confirm path), else keep client-only alert.
- After successful auth, navigate to MainTabs/BarberAdminTabs based on `user.role`.

### Home (“Browse” tab)
- Replace `mockBarbers` with `GET /barbers` (supports `?search=`).
- Fields expected by UI: `id, name, image/logoUrl, isOpen, shiftStart, shiftEnd, nextAvailableSlot (days)`.
- Use `services/barberService.js` to call backend (update to use new shape if needed).

### Favorites (MyBarber entry point)
- Persist favorite barber/shop via backend:
  - Add button/flow to **save favorite**: `POST /favorites { shopId }`
  - Load favorites: `GET /favorites`
  - Remove favorite: `DELETE /favorites/:id`
- Replace local `@berberi_selected_barber_id` with favorite from API; cache locally only for quick startup.

### MyBarber (Booking flow)
- Replace mock `barbers` and `bookedSlots` with backend data:
  - Fetch selected shop & employees: `GET /barbers/:id` and/or `GET /barbers/:shopId/employees`
  - Availability for a date: `GET /barbers/:shopId/availability?date=YYYY-MM-DD&barberId?=...`
- Booking:
  - `POST /reservations` with `{ shopId, barberId (or omit for auto-assign), date (ISO), time ("HH:mm"), firstName?, lastName?, comment?, clientNumber? }`
- Remove direct `AsyncStorage` persistence for reservations; rely on API.
- When auto-select is chosen, let backend assign a barber if `barberId` is omitted.

### My Reservations (Profile tab)
- Replace local storage reads with `GET /reservations` (scoped to current user).
- Reservation detail/cancel/update:
  - `GET /reservations/:id`
  - `PUT /reservations/:id` (e.g., status=“canceled” or update comment/name/phone)
  - `DELETE /reservations/:id` (cancel)
- Profile update:
  - `PUT /me` for `{ firstName, lastName, phoneNumber, avatarUrl? }`
  - Deactivate: `DELETE /me` or `PUT /me { isActive:false }` (confirm backend contract).

### Barber Admin Tabs
- Tab 2 (ScheduleTimeline):
  - Load availability: `GET /barbers/:shopId/availability?date=YYYY-MM-DD` (and per-employee variant).
  - Load reservations for the shop: `GET /reservations?shopId=...&date=...&barberId?=...`
  - Cancel/update reservations: `PUT /reservations/:id`, `DELETE /reservations/:id`.
  - Remove mock AsyncStorage reservations; bind UI to API responses.
- Tab 3 (Settings):
  - Update shop: `PUT /barbers/:id` with `{ name, logoUrl?, workingDays[], shiftStart, shiftEnd, slotLengthMinutes, address?, phone?, description? }`
  - Employees CRUD:
    - `GET /barbers/:shopId/employees`
    - `POST /barbers/:shopId/employees`
    - `PUT /barbers/:shopId/employees/:employeeId`
    - `DELETE /barbers/:shopId/employees/:employeeId`

## 3) Storage / Keys to Migrate Away From
- Reservations: stop using `@berberi_reservations` (MyBarber/MyReservations) → use API.
- Favorite barber: stop using `@berberi_selected_barber_id` → use `/favorites` and cache optional.
- Selected employee: stop using `@berberi_selected_barber_employee_id` → pull from `/barbers/:shopId/employees`, persist selection locally only as a UX preference if desired.
- Auth tokens & user: keep `@berberi_token` and `@berberi_user` but make them reflect real backend responses.

## 4) Models / Shapes Expected by UI
- **User**: `{ id, email, role, firstName, lastName, phoneNumber, avatarUrl?, shopId?, isActive, createdAt, updatedAt }`
- **Shop**: `{ id, name, logoUrl, workingDays:number[], shiftStart, shiftEnd, slotLengthMinutes, address?, phone?, description?, plan }`
- **Employee (Barber)**: `{ id, shopId, name, avatarUrl?, shiftStart, shiftEnd, slotLengthMinutes, isActive }`
- **Availability Slot**: `{ time:"HH:mm", barberId, isAvailable }`
- **Reservation**: `{ id, shopId, barberId, customerId, date:ISO, time:"HH:mm", firstName, lastName, comment?, clientNumber?, status, createdAt, updatedAt }`
- **Favorite**: `{ id, customerId, shopId, createdAt }`
- **Tokens**: `{ accessToken, refreshToken, expiresIn }`

## 5) UI Updates Checklist (RN)
- [ ] Replace mock data in `HomeScreen` with `barberService.getAllBarbers()`.
- [ ] Wire search box to `/barbers?search=`.
- [ ] Replace mock employees/availability/reservations in `MyBarberScreen` with API calls; call availability endpoint on date/barber change; call `POST /reservations` on Book.
- [ ] Replace local reservations in `MyReservationsScreen` with API list/detail; implement cancel/update if UX allows.
- [ ] Replace mock data in `ScheduleTimeline` (Tab2) with shop-scoped availability/reservations; write small data adapters if needed.
- [ ] Replace settings persistence in Tab3 with `PUT /barbers/:id` and employees CRUD endpoints.
- [ ] Implement favorites flow (add/remove, list) and use it to drive initial “MyBarber” selection.
- [ ] Add refresh-token handling in `services/api.js` (retry on 401 once, then logout).
- [ ] Handle loading/error states on each screen when calling API.

## 6) What to Confirm / Provide to Backend Engineer
- Exact **base URL** and whether paths are under `/api`.
- Final **auth contract**: endpoints for login/signup/refresh/logout; token TTLs; password reset path.
- **Availability** contract:
  - Request params (date format, optional `barberId`)
  - Response shape for slots; whether server enforces slotLength per barber.
- **Auto-assign barber**: confirm that omitting `barberId` in `POST /reservations` triggers auto-selection.
- **Favorites**: confirm endpoints and IDs to use (`shopId` vs `barberId`).
- **Reservation status values** (booked, canceled, completed, etc.) and cancellation rules.
- **Limits/validation**: slot length min/max, workingDays encoding (0=Sun).
- **Uploads**: If logo/avatar uploads are supported, confirm `POST /media` (multipart) and returned `url`.
- **Error format**: standard error response shape for consistent UI toasts.

## 7) Minimal API Call Matrix by Screen
- Landing/Login/Signup/Forgot: `/auth/login`, `/auth/signup`, `/auth/refresh`, `/auth/logout`, (optional `/auth/forgot-password`)
- Browse: `GET /barbers?search=`
- Favorites: `GET/POST/DELETE /favorites`
- MyBarber: `GET /barbers/:id`, `GET /barbers/:shopId/employees`, `GET /barbers/:shopId/availability`, `POST /reservations`
- MyReservations: `GET /reservations`, `GET/PUT/DELETE /reservations/:id`, `PUT /me`, `DELETE /me`
- Barber Admin Tab2: `GET /barbers/:shopId/availability`, `GET /reservations` (shop scoped), `PUT/DELETE /reservations/:id`
- Barber Admin Tab3: `PUT /barbers/:id`, `GET/POST/PUT/DELETE /barbers/:shopId/employees`