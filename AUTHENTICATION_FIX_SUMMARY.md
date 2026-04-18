# JWT Authentication Flow - Fix Summary

## ✅ Issues Fixed

### 1. **moduleRoutes.js** - Missing `protect` Middleware
**Problem:** The POST route was not using the `protect` middleware, so `req.user` was never set.
```javascript
// BEFORE: ❌ No middleware
router.post('/', (req, res, next) => {
    console.log('📬 POST /api/modules hit');
    next();
}, createModule);

// AFTER: ✅ Proper middleware chain
router.post('/', protect, authorize('teacher', 'admin'), createModule);
```

### 2. **moduleController.js** - Fallback to Default User ID
**Problem:** Used a dummy user ID '000000000000000000000001' as fallback when `req.user` was not available.
```javascript
// BEFORE: ❌ Fallback value
const createdBy = req.user?._id || '000000000000000000000001';

// AFTER: ✅ No fallback, proper error handling
if (!req.user) {
    return res.status(401).json({ message: 'User must be authenticated to create a module' });
}
const module = new Module({
    title,
    fileName,
    createdBy: req.user._id  // ✓ Correct user ID
});
```

### 3. **authMiddleware.js** - ✓ Already Correct
The middleware correctly:
- ✓ Extracts JWT token from `Authorization: Bearer <token>` header
- ✓ Verifies token using `jwt.verify(token, JWT_SECRET)`
- ✓ Sets `req.user` using `User.findById(decoded.id)`
- ✓ Includes debug logs

---

## 🔐 Authentication Flow - End-to-End

### Step 1: User Login
```javascript
// Frontend (using api.js helper)
await loginUser('jane.smith@crisiscraft.edu', 'teacher');

// Backend (authController.js)
- Validates credentials
- Generates JWT: jwt.sign({ id: user._id }, JWT_SECRET, { expiresIn: '30d' })
- Returns token to frontend
- Frontend stores: localStorage.setItem('token', token)
```

### Step 2: Create Module Request
```javascript
// Frontend sends request with token
const headers = {
    'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
};
await fetch('/api/modules', {
    method: 'POST',
    headers,
    body: JSON.stringify({ title: 'Fire Safety', fileName: 'fire.pdf' })
});

// Backend middleware chain
1. express.json() - Parses body
2. protect middleware - Extracts & verifies token, sets req.user
3. authorize('teacher', 'admin') - Checks user role
4. createModule controller - Uses req.user._id for createdBy
```

### Step 3: Module Created with Correct User ID
```javascript
// Database
{
    _id: ObjectId("..."),
    title: "Fire Safety",
    fileName: "fire.pdf",
    createdBy: ObjectId("user_id_from_token"),  // ✓ Correct!
    createdAt: "2025-04-18...",
    updatedAt: "2025-04-18..."
}
```

---

## 📋 Verification Checklist

### Backend ✓
- [x] `authMiddleware.js` extracts token correctly
- [x] `authMiddleware.js` verifies JWT and sets `req.user`
- [x] `moduleRoutes.js` uses `protect` middleware
- [x] `moduleRoutes.js` uses `authorize('teacher', 'admin')`
- [x] `moduleController.js` checks for `req.user`
- [x] `moduleController.js` uses `req.user._id` without fallback
- [x] Debug logs added throughout

### Frontend ✓
- [x] `api.js` helper created with examples
- [x] `api.js` stores token in localStorage
- [x] `api.js` attaches token to requests: `Authorization: Bearer <token>`
- [x] All API functions available globally

### Database ✓
- [x] Module schema has `createdBy` field with ref to User
- [x] `createdBy` is required and type ObjectId

---

## 🚀 How to Test

### 1. Start Backend
```bash
cd backend
npm install
npm start
```

### 2. Test Login (via Postman or curl)
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"jane.smith@crisiscraft.edu","password":"teacher"}'

Response:
{
  "user": {
    "_id": "507f1f77bcf86cd799439011",
    "name": "Jane Smith",
    "email": "jane.smith@crisiscraft.edu",
    "role": "teacher"
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### 3. Test Create Module (with token from login response)
```bash
curl -X POST http://localhost:5000/api/modules \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -d '{"title":"Fire Safety","fileName":"fire.pdf"}'

Response (check console logs):
✅ MODULE CREATION REQUEST RECEIVED
req.body: { title: 'Fire Safety', fileName: 'fire.pdf' }
req.user: {
  _id: 507f1f77bcf86cd799439011,
  name: 'Jane Smith',
  email: 'jane.smith@crisiscraft.edu',
  role: 'teacher'
}
✓ User attached to request: jane.smith@crisiscraft.edu
✓ Token verified, user ID: 507f1f77bcf86cd799439011
✅ Module created successfully
✓ Created by user: 507f1f77bcf86cd799439011

Created Module:
{
  "_id": "507f1f77bcf86cd799439012",
  "title": "Fire Safety",
  "fileName": "fire.pdf",
  "createdBy": "507f1f77bcf86cd799439011",  ✓ Correct user ID!
  "createdAt": "2025-04-18T..."
}
```

### 4. Test Without Token (should fail)
```bash
curl -X POST http://localhost:5000/api/modules \
  -H "Content-Type: application/json" \
  -d '{"title":"Fire Safety"}'

Response (401):
{ "message": "Not authorized, no token" }
```

### 5. Test With Invalid Token (should fail)
```bash
curl -X POST http://localhost:5000/api/modules \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer invalid_token" \
  -d '{"title":"Fire Safety"}'

Response (401):
{ "message": "Not authorized, token failed" }
```

### 6. Test As Student (should fail)
```bash
# Login as student
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"student@crisiscraft.edu","password":"student"}'

# Try to create module with student token
curl -X POST http://localhost:5000/api/modules \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <student_token>" \
  -d '{"title":"Fire Safety"}'

Response (403):
{ "message": "User role 'student' is not authorized to access this route" }
```

---

## 📂 Files Modified

1. **backend/routes/moduleRoutes.js** - Added `protect` and `authorize` middleware
2. **backend/controllers/moduleController.js** - Removed fallback, added proper auth check
3. **frontend/api.js** - NEW - Helper functions for API calls with JWT

---

## 🔑 Key Takeaways

1. **Always verify middleware chain** - Routes must use `protect` middleware
2. **Never use fallback values** - Should fail gracefully if `req.user` is missing
3. **JWT token flow**: Login → Store token → Attach to requests → Middleware verifies
4. **Debug logs** - Help track authentication flow issues
5. **Frontend sends correctly** - `Authorization: Bearer <token>` header format is critical

---

## 🐛 Common Issues & Solutions

| Issue | Cause | Solution |
|-------|-------|----------|
| `createdBy` shows default ID | Middleware not applied | Add `protect` to route |
| `req.user` is undefined | Token not verified | Check `Authorization` header |
| 401 "No token" | Token not sent | Verify `Authorization: Bearer` header |
| 403 "Not authorized" | Wrong role | Login with teacher/admin account |
| JWT verification fails | Wrong secret or expired | Check `JWT_SECRET` in .env |

---

## ✨ Result

✅ **`createdBy` now stores the actual logged-in user's MongoDB _id**
✅ **No more default values**
✅ **Proper authentication flow end-to-end**
✅ **Debug logs for troubleshooting**
