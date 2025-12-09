# Berberi Backend API Contract

**Version**: 1.0  
**Base URL**: `/api`  
**Database**: PostgreSQL  
**Authentication**: JWT Bearer Token

This document defines the complete API contract between the React Native frontend and the .NET backend. Both teams should reference this to ensure alignment.

---

## Table of Contents

1. [Authentication](#authentication)
2. [Data Models](#data-models)
3. [DTOs (Data Transfer Objects)](#dtos-data-transfer-objects)
4. [API Endpoints](#api-endpoints)
5. [Error Handling](#error-handling)
6. [Response Wrappers](#response-wrappers)
7. [Validation Rules](#validation-rules)

---

## Authentication

### JWT Token Structure

**Access Token** (included in `Authorization` header):
```
Authorization: Bearer <access_token>
```

**Token Claims**:
- `sub` (NameIdentifier): User GUID
- `email`: User email
- `role`: User role (`user` or `barberAdmin`)
- `shopId`: Shop ID (if barberAdmin)

**Token Expiry**: Configurable (default: 3600 seconds / 1 hour)

**Refresh Token**: Stored server-side, returned in auth responses

---

## Data Models

### User Model
```typescript
{
  id: Guid
  email: string (unique, required)
  role: "user" | "barberAdmin" (required)
  firstName: string (required)
  lastName: string (required)
  phoneNumber: string? (nullable)
  avatarUrl: string? (nullable)
  shopId: Guid? (nullable, FK to Shop)
  isActive: boolean (default: true)
  createdAt: DateTime (UTC)
  updatedAt: DateTime (UTC)
}
```

**Notes**:
- Extends ASP.NET Identity `IdentityUser<Guid>`
- Role normalization: accepts `"barber"` or `"barberAdmin"`, stores as `"barberAdmin"`
- `shopId` is set when user is a barberAdmin with a shop

---

### Shop Model
```typescript
{
  id: Guid
  name: string (required)
  logoUrl: string? (nullable)
  address: string? (nullable)
  phone: string? (nullable)
  description: string? (nullable)
  workingDays: int[] (required, 0=Sun, 1=Mon, ..., 6=Sat)
  shiftStart: string (required, format: "HH:mm", e.g., "09:00")
  shiftEnd: string (required, format: "HH:mm", e.g., "18:00")
  slotLengthMinutes: int (required, range: 10-60)
  plan: "basic" | "standard" | "pro" (required, default: "basic")
  createdAt: DateTime (UTC)
  updatedAt: DateTime (UTC)
}
```

**Notes**:
- `workingDays` stored as PostgreSQL integer array
- Time format is always "HH:mm" (24-hour)

---

### BarberEmployee Model
```typescript
{
  id: Guid
  shopId: Guid (required, FK to Shop)
  name: string (required)
  avatarUrl: string? (nullable)
  shiftStart: string (required, format: "HH:mm")
  shiftEnd: string (required, format: "HH:mm")
  slotLengthMinutes: int (required, range: 10-60)
  isActive: boolean (default: true)
  createdAt: DateTime (UTC)
  updatedAt: DateTime (UTC)
}
```

---

### Reservation Model
```typescript
{
  id: Guid
  shopId: Guid (required, FK to Shop)
  barberId: Guid (required, FK to BarberEmployee)
  customerId: Guid (required, FK to User)
  date: DateOnly (required, format: YYYY-MM-DD)
  time: string (required, format: "HH:mm")
  firstName: string (required)
  lastName: string (required)
  comment: string? (nullable)
  clientNumber: string? (nullable)
  status: "booked" | "canceled" | "completed" (required, default: "booked")
  createdAt: DateTime (UTC)
  updatedAt: DateTime (UTC)
}
```

**Notes**:
- `date` stored as PostgreSQL `date` type
- `time` stored as string "HH:mm"
- Only `status: "booked"` reservations block availability

---

### Favorite Model
```typescript
{
  id: Guid
  customerId: Guid (required, FK to User)
  shopId: Guid (required, FK to Shop)
  createdAt: DateTime (UTC)
}
```

**Notes**:
- Unique constraint: one favorite per customer-shop pair

---

### RefreshToken Model (Server-side only)
```typescript
{
  id: Guid
  userId: Guid (required, FK to User)
  token: string (required, unique)
  expiresAt: DateTime (required)
  revokedAt: DateTime? (nullable)
  replacedByToken: string? (nullable)
  userAgent: string? (nullable)
  ipAddress: string? (nullable)
}
```

---

## DTOs (Data Transfer Objects)

### Request DTOs

#### SignupRequest
```typescript
{
  firstName: string (required)
  lastName: string (required)
  phoneNumber: string? (optional)
  avatarUrl: string? (optional)
  email: string (required, valid email)
  password: string (required, min 6 chars)
  role: "user" | "barber" | "barberAdmin" (required, default: "user")
  
  // Flat shop fields (required if role is barber/barberAdmin)
  shopName?: string
  logo?: string
  workingDays?: int[] (required if barber, non-empty)
  shiftStart?: string (format: "HH:mm", default: "09:00")
  shiftEnd?: string (format: "HH:mm", default: "18:00")
  slotLengthMinutes?: int (range: 10-60, default: 30)
}
```

**Example**:
```json
{
  "firstName": "John",
  "lastName": "Doe",
  "email": "john@example.com",
  "password": "SecurePass123!",
  "role": "user"
}
```

```json
{
  "firstName": "Barber",
  "lastName": "Owner",
  "email": "barber@example.com",
  "password": "SecurePass123!",
  "role": "barber",
  "shopName": "Elite Cuts",
  "logo": "https://example.com/logo.png",
  "workingDays": [1, 2, 3, 4, 5],
  "shiftStart": "09:00",
  "shiftEnd": "18:00",
  "slotLengthMinutes": 30
}
```

---

#### LoginRequest
```typescript
{
  email: string (required)
  password: string (required)
}
```

---

#### RefreshTokenRequest
```typescript
{
  refreshToken: string (required)
}
```

---

#### UpdateUserRequest
```typescript
{
  firstName?: string
  lastName?: string
  phoneNumber?: string
  avatarUrl?: string
}
```

---

#### UpdateShopRequest
```typescript
{
  name?: string
  logoUrl?: string
  address?: string
  phone?: string
  description?: string
  workingDays?: int[]
  shiftStart?: string (format: "HH:mm")
  shiftEnd?: string (format: "HH:mm")
  slotLengthMinutes?: int (range: 10-60)
  plan?: "basic" | "standard" | "pro"
}
```

---

#### CreateBarberEmployeeRequest
```typescript
{
  name: string (required)
  avatarUrl?: string
  shiftStart: string (format: "HH:mm", default: "09:00")
  shiftEnd: string (format: "HH:mm", default: "18:00")
  slotLengthMinutes: int (range: 10-60, default: 30)
}
```

---

#### UpdateBarberEmployeeRequest
```typescript
{
  name?: string
  avatarUrl?: string
  shiftStart?: string (format: "HH:mm")
  shiftEnd?: string (format: "HH:mm")
  slotLengthMinutes?: int (range: 10-60)
  isActive?: boolean
}
```

---

#### CreateReservationRequest
```typescript
{
  shopId: Guid (required)
  barberId?: Guid (optional - auto-assigned if omitted)
  date: string (required, ISO date: "YYYY-MM-DD")
  time: string (required, format: "HH:mm")
  firstName?: string (optional, uses user's name if omitted)
  lastName?: string (optional, uses user's name if omitted)
  comment?: string
  clientNumber?: string
}
```

**Notes**:
- If `barberId` is omitted, system auto-assigns first available barber
- Returns `409` with `NO_AVAILABLE_BARBER` if no barber available

---

#### UpdateReservationRequest
```typescript
{
  status?: "booked" | "canceled" | "completed"
  comment?: string
  firstName?: string
  lastName?: string
  clientNumber?: string
}
```

---

#### CreateFavoriteRequest
```typescript
{
  shopId: Guid (required)
}
```

---

### Response DTOs

#### UserResponse
```typescript
{
  id: Guid
  email: string
  role: "user" | "barberAdmin"
  firstName: string
  lastName: string
  phoneNumber: string | null
  avatarUrl: string | null
  shopId: Guid | null
  isActive: boolean
  createdAt: string (ISO 8601)
  updatedAt: string (ISO 8601)
}
```

---

#### ShopResponse
```typescript
{
  id: Guid
  name: string
  logoUrl: string | null
  workingDays: int[]
  shiftStart: string ("HH:mm")
  shiftEnd: string ("HH:mm")
  slotLengthMinutes: int
  address: string | null
  phone: string | null
  description: string | null
  plan: "basic" | "standard" | "pro"
  createdAt: string (ISO 8601)
  updatedAt: string (ISO 8601)
}
```

---

#### BarberEmployeeResponse
```typescript
{
  id: Guid
  shopId: Guid
  name: string
  avatarUrl: string | null
  shiftStart: string ("HH:mm")
  shiftEnd: string ("HH:mm")
  slotLengthMinutes: int
  isActive: boolean
  createdAt: string (ISO 8601)
  updatedAt: string (ISO 8601)
}
```

---

#### ReservationResponse
```typescript
{
  id: Guid
  shopId: Guid
  barberId: Guid
  customerId: Guid
  date: string (ISO date: "YYYY-MM-DD")
  time: string ("HH:mm")
  firstName: string
  lastName: string
  comment: string | null
  clientNumber: string | null
  status: "booked" | "canceled" | "completed"
  createdAt: string (ISO 8601)
  updatedAt: string (ISO 8601)
}
```

---

#### FavoriteResponse
```typescript
{
  id: Guid
  customerId: Guid
  shopId: Guid
  createdAt: string (ISO 8601)
}
```

---

#### AvailabilitySlotResponse
```typescript
{
  time: string ("HH:mm")
  barberId: Guid
  isAvailable: boolean
}
```

---

#### TokensResponse
```typescript
{
  accessToken: string
  refreshToken: string
  expiresIn: int (seconds)
}
```

---

#### AuthResponse
```typescript
{
  user: UserResponse
  tokens: TokensResponse
}
```

---

## API Endpoints

### Base Path
All endpoints are prefixed with `/api`

---

### Authentication Endpoints

#### POST `/api/auth/signup`
**Description**: Register a new user account

**Request Body**: `SignupRequest`

**Response**: `200 OK`
```json
{
  "user": { /* UserResponse */ },
  "tokens": {
    "accessToken": "eyJhbGc...",
    "refreshToken": "base64token...",
    "expiresIn": 3600
  }
}
```

**Errors**:
- `400 VALIDATION_ERROR`: Missing required fields, invalid email/password
- `400 VALIDATION_ERROR`: Shop info required for barber role
- `400 VALIDATION_ERROR`: WorkingDays must be non-empty for barber

**Notes**:
- Role `"barber"` is normalized to `"barberAdmin"` server-side
- Shop is created automatically if role is barber/barberAdmin

---

#### POST `/api/auth/login`
**Description**: Authenticate user and get tokens

**Request Body**: `LoginRequest`

**Response**: `200 OK`
```json
{
  "user": { /* UserResponse */ },
  "tokens": { /* TokensResponse */ }
}
```

**Errors**:
- `400 UNAUTHORIZED`: Invalid email or password
- `400 UNAUTHORIZED`: Account is deactivated

---

#### POST `/api/auth/refresh`
**Description**: Refresh access token using refresh token

**Request Body**: `RefreshTokenRequest`
```json
{
  "refreshToken": "base64token..."
}
```

**Response**: `200 OK`
```json
{
  "tokens": { /* TokensResponse */ }
}
```

**Errors**:
- `400 UNAUTHORIZED`: Invalid or expired refresh token

**Notes**:
- Old refresh token is revoked and replaced
- Token rotation is implemented

---

#### POST `/api/auth/logout`
**Description**: Logout and revoke all refresh tokens

**Authentication**: Required (Bearer token)

**Request Body**: None

**Response**: `204 No Content`

**Notes**:
- Revokes all active refresh tokens for the authenticated user
- No custom headers or body required

---

### User Endpoints

#### GET `/api/me`
**Description**: Get current user profile

**Authentication**: Required

**Response**: `200 OK`
```json
{
  "user": { /* UserResponse */ }
}
```

**Errors**:
- `401 UNAUTHORIZED`: Not authenticated

---

#### PUT `/api/me`
**Description**: Update current user profile

**Authentication**: Required

**Request Body**: `UpdateUserRequest` (all fields optional)

**Response**: `200 OK`
```json
{
  "user": { /* UserResponse */ }
}
```

**Errors**:
- `401 UNAUTHORIZED`: Not authenticated

---

#### DELETE `/api/me`
**Description**: Deactivate current user account

**Authentication**: Required

**Response**: `204 No Content`

**Notes**:
- Sets `isActive = false` (soft delete)
- User can still login but account is marked inactive

---

### Shops/Barbers Endpoints

#### GET `/api/barbers`
**Description**: List all barber shops (public)

**Query Parameters**:
- `search?`: string (optional) - Search by name or description

**Response**: `200 OK`
```json
{
  "data": [
    { /* ShopResponse */ },
    ...
  ]
}
```

**Example**:
```
GET /api/barbers?search=elite
```

---

#### GET `/api/barbers/{id}`
**Description**: Get shop details by ID

**Path Parameters**:
- `id`: Guid (required)

**Response**: `200 OK`
```json
{
  "data": { /* ShopResponse */ }
}
```

**Errors**:
- `400 NOT_FOUND`: Shop not found

---

#### PUT `/api/barbers/{id}`
**Description**: Update shop details

**Authentication**: Required (barberAdmin of that shop)

**Path Parameters**:
- `id`: Guid (required)

**Request Body**: `UpdateShopRequest` (all fields optional)

**Response**: `200 OK`
```json
{
  "data": { /* ShopResponse */ }
}
```

**Errors**:
- `401 UNAUTHORIZED`: Not authenticated or not shop owner
- `400 NOT_FOUND`: Shop not found

---

### Barber Employees Endpoints

#### GET `/api/barbers/{shopId}/employees`
**Description**: List all employees for a shop

**Path Parameters**:
- `shopId`: Guid (required)

**Response**: `200 OK`
```json
{
  "data": [
    { /* BarberEmployeeResponse */ },
    ...
  ]
}
```

---

#### POST `/api/barbers/{shopId}/employees`
**Description**: Create a new barber employee

**Authentication**: Required (barberAdmin of that shop)

**Path Parameters**:
- `shopId`: Guid (required)

**Request Body**: `CreateBarberEmployeeRequest`

**Response**: `200 OK`
```json
{
  "data": { /* BarberEmployeeResponse */ }
}
```

**Errors**:
- `401 UNAUTHORIZED`: Not authenticated or not shop owner

---

#### PUT `/api/barbers/{shopId}/employees/{employeeId}`
**Description**: Update barber employee

**Authentication**: Required (barberAdmin of that shop)

**Path Parameters**:
- `shopId`: Guid (required)
- `employeeId`: Guid (required)

**Request Body**: `UpdateBarberEmployeeRequest` (all fields optional)

**Response**: `200 OK`
```json
{
  "data": { /* BarberEmployeeResponse */ }
}
```

**Errors**:
- `401 UNAUTHORIZED`: Not authenticated or not shop owner
- `400 NOT_FOUND`: Employee not found

---

#### DELETE `/api/barbers/{shopId}/employees/{employeeId}`
**Description**: Delete barber employee

**Authentication**: Required (barberAdmin of that shop)

**Path Parameters**:
- `shopId`: Guid (required)
- `employeeId`: Guid (required)

**Response**: `204 No Content`

**Errors**:
- `401 UNAUTHORIZED`: Not authenticated or not shop owner
- `400 NOT_FOUND`: Employee not found

---

### Availability Endpoints

#### GET `/api/barbers/{shopId}/availability`
**Description**: Get shop availability for a date

**Path Parameters**:
- `shopId`: Guid (required)

**Query Parameters**:
- `date`: string (required, format: "YYYY-MM-DD")
- `barberId?`: Guid (optional) - Filter by specific barber

**Response**: `200 OK`
```json
{
  "data": [
    {
      "time": "09:00",
      "barberId": "guid",
      "isAvailable": true
    },
    {
      "time": "09:30",
      "barberId": "guid",
      "isAvailable": false
    },
    ...
  ]
}
```

**Example**:
```
GET /api/barbers/123e4567-e89b-12d3-a456-426614174000/availability?date=2024-12-15&barberId=456e7890-e89b-12d3-a456-426614174001
```

**Notes**:
- Returns empty array if date is not in shop's working days
- Slots are generated based on barber's shift and slot length
- Booked reservations (status="booked") mark slots as unavailable

---

#### GET `/api/barbers/{shopId}/employees/{barberId}/availability`
**Description**: Get specific barber availability for a date

**Path Parameters**:
- `shopId`: Guid (required)
- `barberId`: Guid (required)

**Query Parameters**:
- `date`: string (required, format: "YYYY-MM-DD")

**Response**: `200 OK`
```json
{
  "data": [ /* AvailabilitySlotResponse[] */ ]
}
```

**Errors**:
- `400 VALIDATION_ERROR`: Invalid date format

---

### Reservations Endpoints

#### POST `/api/reservations`
**Description**: Create a new reservation

**Authentication**: Required

**Request Body**: `CreateReservationRequest`

**Response**: `200 OK`
```json
{
  "data": { /* ReservationResponse */ }
}
```

**Errors**:
- `401 UNAUTHORIZED`: Not authenticated
- `400 VALIDATION_ERROR`: Invalid date format or date in past
- `400 SLOT_UNAVAILABLE`: Selected time slot is not available
- `409 NO_AVAILABLE_BARBER`: No available barber when barberId omitted
- `400 SLOT_UNAVAILABLE`: Slot was just booked (concurrency conflict)

**Notes**:
- If `barberId` is omitted, system auto-assigns first available barber
- Uses database transaction to prevent double-booking
- Date must be today or in the future

---

#### GET `/api/reservations`
**Description**: List reservations

**Authentication**: Required

**Query Parameters** (for barberAdmin only):
- `date?`: DateOnly (optional)
- `barberId?`: Guid (optional)
- `status?`: string (optional, "booked" | "canceled" | "completed")

**Response**: `200 OK`
```json
{
  "data": [
    { /* ReservationResponse */ },
    ...
  ]
}
```

**Notes**:
- **User role**: Returns only own reservations
- **barberAdmin role**: Returns all reservations for their shop (with optional filters)

---

#### GET `/api/reservations/{id}`
**Description**: Get reservation details

**Authentication**: Required

**Path Parameters**:
- `id`: Guid (required)

**Response**: `200 OK`
```json
{
  "data": { /* ReservationResponse */ }
}
```

**Errors**:
- `401 UNAUTHORIZED`: Not authenticated or not authorized
- `400 NOT_FOUND`: Reservation not found

**Authorization**:
- Customer can view own reservations
- barberAdmin can view reservations for their shop

---

#### PUT `/api/reservations/{id}`
**Description**: Update reservation

**Authentication**: Required

**Path Parameters**:
- `id`: Guid (required)

**Request Body**: `UpdateReservationRequest` (all fields optional)

**Response**: `200 OK`
```json
{
  "data": { /* ReservationResponse */ }
}
```

**Errors**:
- `401 UNAUTHORIZED`: Not authenticated or not authorized
- `400 NOT_FOUND`: Reservation not found

**Authorization**:
- Customer can update own reservations
- barberAdmin can update reservations for their shop

---

#### DELETE `/api/reservations/{id}`
**Description**: Cancel reservation

**Authentication**: Required

**Path Parameters**:
- `id`: Guid (required)

**Response**: `204 No Content`

**Notes**:
- Sets status to "canceled" (soft delete)
- Authorization same as PUT

---

### Favorites Endpoints

#### POST `/api/favorites`
**Description**: Add shop to favorites

**Authentication**: Required

**Request Body**: `CreateFavoriteRequest`

**Response**: `200 OK`
```json
{
  "data": { /* FavoriteResponse */ }
}
```

**Errors**:
- `401 UNAUTHORIZED`: Not authenticated

**Notes**:
- If already favorited, returns existing favorite (idempotent)

---

#### GET `/api/favorites`
**Description**: List user's favorite shops

**Authentication**: Required

**Response**: `200 OK`
```json
{
  "data": [
    { /* FavoriteResponse */ },
    ...
  ]
}
```

---

#### DELETE `/api/favorites/{id}`
**Description**: Remove favorite

**Authentication**: Required

**Path Parameters**:
- `id`: Guid (required)

**Response**: `204 No Content`

**Errors**:
- `400 NOT_FOUND`: Favorite not found or not owned by user

---

## Error Handling

### Error Response Format

All errors follow this structure:

```json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable error message",
    "details": {} // Optional, additional error details
  }
}
```

### Error Codes

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `VALIDATION_ERROR` | 400 | Request validation failed |
| `UNAUTHORIZED` | 400 | Authentication/authorization failed |
| `NOT_FOUND` | 400 | Resource not found |
| `SLOT_UNAVAILABLE` | 400 | Time slot is not available |
| `NO_AVAILABLE_BARBER` | 409 | No barber available for auto-assign |

### Example Error Responses

**Validation Error**:
```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Email and password are required",
    "details": null
  }
}
```

**Unauthorized**:
```json
{
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Invalid email or password"
  }
}
```

**Not Found**:
```json
{
  "error": {
    "code": "NOT_FOUND",
    "message": "Shop not found"
  }
}
```

**Slot Unavailable**:
```json
{
  "error": {
    "code": "SLOT_UNAVAILABLE",
    "message": "The selected time slot is not available"
  }
}
```

---

## Response Wrappers

### Single Item Response
```json
{
  "data": { /* DTO object */ }
}
```

### List Response
```json
{
  "data": [
    { /* DTO object */ },
    ...
  ]
}
```

### Auth Response
```json
{
  "user": { /* UserResponse */ },
  "tokens": { /* TokensResponse */ }
}
```

### Error Response
```json
{
  "error": {
    "code": "string",
    "message": "string",
    "details": {} // optional
  }
}
```

---

## Validation Rules

### Password
- Minimum length: 6 characters
- Requires: digit, lowercase, uppercase
- No special character requirement

### Email
- Must be valid email format
- Must be unique

### Role
- Accepted values: `"user"`, `"barber"`, `"barberAdmin"`
- `"barber"` is normalized to `"barberAdmin"` server-side

### Working Days
- Array of integers: `[0, 1, 2, 3, 4, 5, 6]`
- `0` = Sunday, `1` = Monday, ..., `6` = Saturday
- Must be non-empty for barber/barberAdmin role

### Time Format
- Always `"HH:mm"` (24-hour format)
- Examples: `"09:00"`, `"18:30"`, `"23:59"`

### Date Format
- ISO date string: `"YYYY-MM-DD"`
- Examples: `"2024-12-15"`, `"2024-01-01"`

### Slot Length
- Range: 10-60 minutes
- Default: 30 minutes

### Shift Times
- `shiftStart` must be before `shiftEnd`
- Both in "HH:mm" format

### Reservation Date
- Must be today or in the future
- Cannot book past dates

### Plan
- Values: `"basic"`, `"standard"`, `"pro"`
- Default: `"basic"`

---

## Notes for Frontend Team

### Role Handling
- Frontend can send `"barber"` or `"barberAdmin"` in signup
- Backend normalizes both to `"barberAdmin"` internally
- Responses always return `"barberAdmin"` (never `"barber"`)

### Signup Payload
- Use **flat structure** (not nested `shop` object):
  ```json
  {
    "shopName": "...",
    "logo": "...",
    "workingDays": [1,2,3,4,5]
  }
  ```
- Not:
  ```json
  {
    "shop": {
      "name": "..."
    }
  }
  ```

### Refresh Token
- Send in **request body**: `{ "refreshToken": "..." }`
- Not in header

### Logout
- Only requires `Authorization: Bearer <token>` header
- No body or custom headers needed
- Revokes all refresh tokens for the user

### Auto-Assign Barber
- Omit `barberId` in `CreateReservationRequest` to auto-assign
- Backend returns `409 NO_AVAILABLE_BARBER` if none available

### Availability
- Response includes all barbers if `barberId` not specified
- Each slot has `barberId` to identify which barber
- `isAvailable: false` means slot is booked

### Favorites
- One favorite per customer-shop pair (unique constraint)
- Adding duplicate returns existing favorite (idempotent)

---

## Notes for Backend Team

### Database
- PostgreSQL with native array support for `workingDays`
- Use migrations for production (not `EnsureCreatedAsync`)
- All timestamps in UTC

### Concurrency
- Reservation creation uses database transactions
- Double-check availability before committing

### Token Rotation
- Refresh tokens are rotated on each refresh
- Old token is marked as revoked and replaced

### Soft Deletes
- User deactivation: `isActive = false`
- Reservation cancellation: `status = "canceled"`
- No hard deletes for user data

---

## Version History

- **v1.0** (2024-12-09): Initial API contract documentation

---

## Contact

For questions or clarifications about this API contract, contact the backend team lead.

