# Hotel Management System - Test Suite

This repository contains **106 optimized test cases** for the Hotel Management backend system.

## Test Coverage

- ✅ **Authentication** (23 tests): Signup, Login, JWT validation
- ✅ **Hotel Management** (26 tests): Create hotels, search, filter
- ✅ **Room Management** (12 tests): Add rooms, validate ownership
- ✅ **Booking System** (29 tests): Create, retrieve, cancel bookings
- ✅ **Reviews** (11 tests): Submit reviews, eligibility checks, ALREADY_REVIEWED edge case
- ✅ **Edge Cases** (5 tests): Special characters, extreme values

## Setup

Install dependencies:

```bash
bun install
```

## Configuration

Before running tests, update the `BASE_URL` in `index.ts`:

```typescript
const BASE_URL = 'http://localhost:3000'; // Your backend URL
```

## Running Tests

Run all tests:

```bash
bun test
```

Run with verbose output:

```bash
bun test --reporter=verbose
```

Run specific test suite:

```bash
bun test -t "POST /api/auth/signup"
```

## Test Features

- **Atomic Operations**: Tests concurrent bookings to ensure no double-booking
- **Role-Based Access**: Validates customer vs owner permissions
- **Date Validations**: Checks future dates, 24-hour cancellation policy
- **Response Format**: Strictly validates API response structure
- **Error Handling**: Tests all error codes (UNAUTHORIZED, FORBIDDEN, etc.)

## Notes

- Tests are designed to be slightly loose on date format validation
- Some edge cases may pass or fail depending on backend implementation
- Concurrency tests validate race condition handling
- All tests follow the exact API contract specified in requirements

## Requirements Tested

✅ JWT authentication for all protected routes  
✅ Owner cannot book their own hotels  
✅ Bookings only for future dates  
✅ No double booking (same room, overlapping dates)  
✅ Cancellation up to 24 hours before check-in  
✅ Review eligibility (after checkout, confirmed bookings)  
✅ Strict response format validation

This project was created using `bun init` in bun v1.2.23. [Bun](https://bun.com) is a fast all-in-one JavaScript runtime.
