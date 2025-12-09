# Database Documentation - Berberi Application

## Overview
This document provides a comprehensive analysis of all database entities, models, and interfaces required for the Berberi barbershop reservation application.

---

## 1. MODELS (Database Schema)

### 1.1 User Model
**Purpose**: Represents all users in the system (both customers and barber shop owners)

**Table**: `users`

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| `id` | UUID/STRING | PRIMARY KEY, NOT NULL | Unique user identifier |
| `email` | STRING | UNIQUE, NOT NULL | User email address (used for login) |
| `password` | STRING | NOT NULL | Hashed password |
| `firstName` | STRING | NOT NULL | User's first name |
| `lastName` | STRING | NOT NULL | User's last name |
| `name` | STRING | NOT NULL | Full name (computed: firstName + lastName) |
| `phoneNumber` | STRING | NULLABLE | User's phone number |
| `role` | ENUM('user', 'barber') | NOT NULL, DEFAULT 'user' | User role: 'user' for customers, 'barber' for shop owners |
| `isActive` | BOOLEAN | NOT NULL, DEFAULT true | Account active status (for soft delete/deactivation) |
| `plan` | ENUM('basic', 'standard', 'premium') | NULLABLE | Subscription plan (affects employee limits) |
| `createdAt` | TIMESTAMP | NOT NULL, DEFAULT NOW() | Account creation timestamp |
| `updatedAt` | TIMESTAMP | NOT NULL, DEFAULT NOW() | Last update timestamp |

**Indexes**:
- `idx_users_email` on `email`
- `idx_users_role` on `role`

**Relationships**:
- One-to-Many with `barber_shops` (if role = 'barber')
- One-to-Many with `reservations` (if role = 'user')
- One-to-Many with `employees` (if role = 'barber', as shop owner)

---

### 1.2 Barber Shop Model
**Purpose**: Represents a barbershop business owned by a barber user

**Table**: `barber_shops`

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| `id` | UUID/STRING | PRIMARY KEY, NOT NULL | Unique shop identifier |
| `ownerId` | UUID/STRING | FOREIGN KEY, NOT NULL | Reference to `users.id` (where role = 'barber') |
| `name` | STRING | NOT NULL | Shop name |
| `logo` | STRING (URL) | NULLABLE | Shop logo image URL |
| `image` | STRING (URL) | NULLABLE | Shop main image URL |
| `address` | STRING | NULLABLE | Physical address |
| `phone` | STRING | NULLABLE | Shop contact phone |
| `description` | TEXT | NULLABLE | Shop description |
| `rating` | DECIMAL(3,2) | NULLABLE | Average rating (0.00 - 5.00) |
| `isOpen` | BOOLEAN | NOT NULL, DEFAULT true | Current open/closed status |
| `shiftStart` | TIME | NOT NULL, DEFAULT '09:00' | Default shift start time (HH:MM format) |
| `shiftEnd` | TIME | NOT NULL, DEFAULT '18:00' | Default shift end time (HH:MM format) |
| `slotLengthMinutes` | INTEGER | NOT NULL, DEFAULT 30 | Default appointment slot length in minutes (10-60) |
| `workingDays` | JSON/ARRAY | NOT NULL, DEFAULT [] | Array of working day indices: [0=Sunday, 1=Monday, ..., 6=Saturday] |
| `createdAt` | TIMESTAMP | NOT NULL, DEFAULT NOW() | Shop creation timestamp |
| `updatedAt` | TIMESTAMP | NOT NULL, DEFAULT NOW() | Last update timestamp |

**Indexes**:
- `idx_barber_shops_owner_id` on `ownerId`
- `idx_barber_shops_name` on `name` (for search)

**Relationships**:
- Many-to-One with `users` (owner)
- One-to-Many with `employees`
- One-to-Many with `reservations` (through employees)

**Validation Rules**:
- `slotLengthMinutes` must be between 10 and 60
- `workingDays` must contain at least one day
- `shiftStart` must be before `shiftEnd`

---

### 1.3 Employee Model
**Purpose**: Represents individual barbers/employees working in a barbershop

**Table**: `employees`

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| `id` | UUID/STRING | PRIMARY KEY, NOT NULL | Unique employee identifier |
| `shopId` | UUID/STRING | FOREIGN KEY, NOT NULL | Reference to `barber_shops.id` |
| `name` | STRING | NOT NULL | Employee's name |
| `image` | STRING (URL) | NULLABLE | Employee profile image URL |
| `shiftStart` | TIME | NOT NULL | Employee's shift start time (HH:MM format) |
| `shiftEnd` | TIME | NOT NULL | Employee's shift end time (HH:MM format) |
| `slotLengthMinutes` | INTEGER | NOT NULL | Appointment slot length for this employee (10-60) |
| `isActive` | BOOLEAN | NOT NULL, DEFAULT true | Employee active status |
| `createdAt` | TIMESTAMP | NOT NULL, DEFAULT NOW() | Employee creation timestamp |
| `updatedAt` | TIMESTAMP | NOT NULL, DEFAULT NOW() | Last update timestamp |

**Indexes**:
- `idx_employees_shop_id` on `shopId`
- `idx_employees_active` on `isActive`

**Relationships**:
- Many-to-One with `barber_shops`
- One-to-Many with `reservations`

**Validation Rules**:
- `slotLengthMinutes` must be between 10 and 60
- `shiftStart` must be before `shiftEnd`
- Employee count per shop limited by owner's plan:
  - Basic: 1 employee
  - Standard: 2-4 employees
  - Premium: 5+ employees

---

### 1.4 Reservation Model
**Purpose**: Represents a booked appointment/reservation

**Table**: `reservations`

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| `id` | UUID/STRING | PRIMARY KEY, NOT NULL | Unique reservation identifier |
| `customerId` | UUID/STRING | FOREIGN KEY, NOT NULL | Reference to `users.id` (where role = 'user') |
| `shopId` | UUID/STRING | FOREIGN KEY, NOT NULL | Reference to `barber_shops.id` |
| `employeeId` | UUID/STRING | FOREIGN KEY, NULLABLE | Reference to `employees.id` (null = auto-select) |
| `date` | DATE | NOT NULL | Reservation date |
| `time` | TIME | NOT NULL | Reservation time (HH:MM format) |
| `firstName` | STRING | NOT NULL | Customer's first name (for this reservation) |
| `lastName` | STRING | NULLABLE | Customer's last name |
| `clientNumber` | STRING | NULLABLE | Customer's phone number (if different from account) |
| `comment` | TEXT | NULLABLE | Additional comments/notes |
| `status` | ENUM('pending', 'confirmed', 'completed', 'cancelled', 'no_show') | NOT NULL, DEFAULT 'confirmed' | Reservation status |
| `createdAt` | TIMESTAMP | NOT NULL, DEFAULT NOW() | Reservation creation timestamp |
| `updatedAt` | TIMESTAMP | NOT NULL, DEFAULT NOW() | Last update timestamp |

**Indexes**:
- `idx_reservations_customer_id` on `customerId`
- `idx_reservations_shop_id` on `shopId`
- `idx_reservations_employee_id` on `employeeId`
- `idx_reservations_date` on `date`
- `idx_reservations_date_time` on `(date, time)` (composite for availability queries)
- `idx_reservations_status` on `status`

**Relationships**:
- Many-to-One with `users` (customer)
- Many-to-One with `barber_shops`
- Many-to-One with `employees` (nullable)

**Validation Rules**:
- `date` must be >= current date
- `time` must be within employee's shift (if employeeId is set)
- `time` must be within shop's default shift (if employeeId is null)
- Cannot create duplicate reservation for same employee + date + time
- Cannot create reservation in the past

**Unique Constraints**:
- `UNIQUE(employeeId, date, time)` - Prevents double booking

---

### 1.5 Authentication Token Model (Optional - for JWT/Token Management)
**Purpose**: Manages authentication tokens for users

**Table**: `auth_tokens`

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| `id` | UUID/STRING | PRIMARY KEY, NOT NULL | Unique token identifier |
| `userId` | UUID/STRING | FOREIGN KEY, NOT NULL | Reference to `users.id` |
| `token` | STRING | UNIQUE, NOT NULL | Authentication token |
| `expiresAt` | TIMESTAMP | NOT NULL | Token expiration timestamp |
| `createdAt` | TIMESTAMP | NOT NULL, DEFAULT NOW() | Token creation timestamp |

**Indexes**:
- `idx_auth_tokens_user_id` on `userId`
- `idx_auth_tokens_token` on `token`
- `idx_auth_tokens_expires_at` on `expiresAt`

**Relationships**:
- Many-to-One with `users`

---

## 2. INTERFACES (TypeScript/JavaScript Type Definitions)

### 2.1 User Interface

```typescript
interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  name: string; // Computed: `${firstName} ${lastName}`
  phoneNumber?: string;
  role: 'user' | 'barber';
  isActive: boolean;
  plan?: 'basic' | 'standard' | 'premium';
  createdAt: Date | string;
  updatedAt: Date | string;
  
  // Barber-specific fields (only if role === 'barber')
  shopName?: string;
  logo?: string | null;
  workingDays?: number[]; // [0=Sunday, 1=Monday, ..., 6=Saturday]
  shiftStart?: string; // HH:MM format
  shiftEnd?: string; // HH:MM format
  slotLengthMinutes?: number;
  employees?: Employee[];
}
```

---

### 2.2 Barber Shop Interface

```typescript
interface BarberShop {
  id: string;
  ownerId: string;
  name: string;
  logo?: string | null;
  image?: string | null;
  address?: string | null;
  phone?: string | null;
  description?: string | null;
  rating?: number | null; // 0.00 - 5.00
  isOpen: boolean;
  shiftStart: string; // HH:MM format
  shiftEnd: string; // HH:MM format
  slotLengthMinutes: number; // 10-60
  workingDays: number[]; // [0=Sunday, 1=Monday, ..., 6=Saturday]
  nextAvailableSlot?: number; // 0 = today, 1 = tomorrow, 2+ = in X days
  createdAt: Date | string;
  updatedAt: Date | string;
  
  // Relationships (populated from API)
  owner?: User;
  employees?: Employee[];
}
```

---

### 2.3 Employee Interface

```typescript
interface Employee {
  id: string;
  shopId: string;
  name: string;
  image?: string | null;
  shiftStart: string; // HH:MM format
  shiftEnd: string; // HH:MM format
  slotLengthMinutes: number; // 10-60
  isActive: boolean;
  createdAt: Date | string;
  updatedAt: Date | string;
  
  // Relationships (populated from API)
  shop?: BarberShop;
}
```

---

### 2.4 Reservation Interface

```typescript
interface Reservation {
  id: string;
  customerId: string;
  shopId: string;
  employeeId?: string | null; // null = auto-select
  date: string; // ISO date string or Date object
  time: string; // HH:MM format
  firstName: string;
  lastName?: string;
  clientNumber?: string;
  comment?: string;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled' | 'no_show';
  createdAt: Date | string;
  updatedAt: Date | string;
  
  // Computed/Display fields (from relationships)
  barberName?: string; // Employee name or "Auto Select"
  shopName?: string; // Shop name
  barberImage?: string | null; // Employee image
  customerName?: string; // Customer full name
  
  // Relationships (populated from API)
  customer?: User;
  shop?: BarberShop;
  employee?: Employee;
}
```

---

### 2.5 Time Slot Interface

```typescript
interface TimeSlot {
  time: string; // HH:MM format
  minutes: number; // Total minutes from midnight
  isAvailable: boolean;
  isBooked: boolean;
}
```

---

### 2.6 Booked Slot Interface

```typescript
interface BookedSlot {
  date: string; // Date string
  time: string; // HH:MM format
  employeeId?: string;
}
```

---

### 2.7 Shop Settings Interface

```typescript
interface ShopSettings {
  shopName: string;
  logo?: string | null;
  workingDays: number[]; // [0=Sunday, 1=Monday, ..., 6=Saturday]
  shiftStart: string; // HH:MM format
  shiftEnd: string; // HH:MM format
  slotLengthMinutes: number; // 10-60
}
```

---

### 2.8 Employee Settings Interface

```typescript
interface EmployeeSettings {
  name: string;
  shiftStart: string; // HH:MM format
  shiftEnd: string; // HH:MM format
  slotLengthMinutes: number; // 10-60
}
```

---

### 2.9 Plan Limit Interface

```typescript
interface PlanLimit {
  min: number;
  max: number;
  label: string; // e.g., "1", "2-4", "5+"
}
```

---

### 2.10 API Response Interfaces

```typescript
interface ApiResponse<T> {
  data: T;
  message?: string;
  error?: string;
}

interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}
```

---

### 2.11 Authentication Interfaces

```typescript
interface LoginCredentials {
  email: string;
  password: string;
}

interface SignupData {
  firstName: string;
  lastName: string;
  phoneNumber: string;
  email: string;
  password: string;
  role: 'user' | 'barber';
  
  // Barber-specific fields
  shopName?: string;
  logo?: string | null;
  workingDays?: number[];
  shiftStart?: string;
  shiftEnd?: string;
  slotLengthMinutes?: number;
}

interface AuthToken {
  token: string;
  expiresAt: Date | string;
  userId: string;
}
```

---

## 3. RELATIONSHIPS SUMMARY

### Entity Relationship Diagram (ERD) Overview:

```
users (1) ──────< (many) barber_shops
  │                    │
  │                    │
  │                    │ (1) ──────< (many) employees
  │                    │
  │                    │
  │                    │ (1) ──────< (many) reservations
  │                    │
  │                    │
  │ (1) ──────< (many) ┘
  │
  │
  └───< (many) reservations
```

**Key Relationships**:
1. **User → Barber Shop**: One-to-Many (a user with role='barber' can own multiple shops)
2. **Barber Shop → Employee**: One-to-Many (a shop has multiple employees)
3. **User → Reservation**: One-to-Many (a customer can have multiple reservations)
4. **Barber Shop → Reservation**: One-to-Many (a shop receives multiple reservations)
5. **Employee → Reservation**: One-to-Many (an employee can have multiple reservations)
6. **Reservation → Employee**: Many-to-One (optional - null for auto-select)

---

## 4. BUSINESS RULES & CONSTRAINTS

### 4.1 User Rules
- Email must be unique across all users
- Role must be either 'user' or 'barber'
- Password must be hashed before storage
- `isActive` flag allows soft deletion

### 4.2 Barber Shop Rules
- Only users with `role='barber'` can own shops
- `workingDays` must contain at least one day
- `slotLengthMinutes` must be between 10 and 60
- `shiftStart` must be before `shiftEnd`

### 4.3 Employee Rules
- Employee count per shop limited by owner's plan:
  - **Basic Plan**: Maximum 1 employee
  - **Standard Plan**: 2-4 employees
  - **Premium Plan**: 5+ employees
- `slotLengthMinutes` must be between 10 and 60
- `shiftStart` must be before `shiftEnd`

### 4.4 Reservation Rules
- Cannot book in the past
- Cannot double-book same employee at same date/time
- If `employeeId` is null (auto-select), system assigns available employee
- Time slot must be within employee's shift (if employee specified)
- Time slot must be within shop's default shift (if auto-select)

### 4.5 Time Slot Generation Rules
- Slots generated based on employee's `shiftStart`, `shiftEnd`, and `slotLengthMinutes`
- Last slot must end before or at shift end time
- Example: Shift 09:00-17:00, Slot Length 30min → Slots: 09:00, 09:30, 10:00, ..., 16:30

---

## 5. DATA VALIDATION

### 5.1 Email Validation
- Must be valid email format
- Must be unique

### 5.2 Time Format Validation
- Must be in HH:MM format (24-hour)
- Valid hours: 00-23
- Valid minutes: 00-59

### 5.3 Date Validation
- Cannot be in the past
- Must be valid date format

### 5.4 Working Days Validation
- Must be array of integers
- Valid values: 0 (Sunday) through 6 (Saturday)
- Must contain at least one day

### 5.5 Slot Length Validation
- Must be integer between 10 and 60 (inclusive)
- Represents minutes

---

## 6. INDEXES FOR PERFORMANCE

### Critical Indexes:
1. **Users**: `email` (for login), `role` (for filtering)
2. **Barber Shops**: `ownerId` (for owner queries), `name` (for search)
3. **Employees**: `shopId` (for shop employee lists), `isActive` (for filtering)
4. **Reservations**: 
   - `customerId` (for user's reservations)
   - `shopId` (for shop's reservations)
   - `employeeId` (for employee's reservations)
   - `(date, time)` composite (for availability checks)
   - `status` (for filtering)

---

## 7. NOTES FOR IMPLEMENTATION

### 7.1 Current Implementation Status
- Currently using AsyncStorage for local data persistence
- Mock data used for barbers and reservations
- User authentication is simplified (token generation)
- No actual database backend implemented yet

### 7.2 Migration Considerations
- When migrating to a real database, consider:
  - Data migration from AsyncStorage
  - User password re-hashing if needed
  - Reservation data integrity
  - Employee assignment to shops

### 7.3 Future Enhancements
- Add reviews/ratings system
- Add notification system
- Add payment integration
- Add calendar integration
- Add recurring appointments
- Add waitlist functionality

---

## 8. EXAMPLE QUERIES

### 8.1 Get User's Reservations
```sql
SELECT * FROM reservations 
WHERE customerId = ? 
ORDER BY date DESC, time DESC;
```

### 8.2 Get Shop's Employees
```sql
SELECT * FROM employees 
WHERE shopId = ? AND isActive = true 
ORDER BY name;
```

### 8.3 Check Time Slot Availability
```sql
SELECT COUNT(*) FROM reservations 
WHERE employeeId = ? 
  AND date = ? 
  AND time = ? 
  AND status IN ('confirmed', 'pending');
```

### 8.4 Get Available Time Slots for Employee
```sql
SELECT time FROM (
  -- Generate all possible slots
  -- Then exclude booked ones
) WHERE NOT EXISTS (
  SELECT 1 FROM reservations 
  WHERE employeeId = ? 
    AND date = ? 
    AND time = slot_time
    AND status IN ('confirmed', 'pending')
);
```

---

**Document Version**: 1.0  
**Last Updated**: 2024  
**Author**: Database Analysis Documentation

