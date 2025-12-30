# 🧪 TESTING GUIDE — GraphQL API Connection Error Fixes

> **Purpose**: Validate that all fixes for GraphQL connection errors (ERR_CONNECTION_REFUSED) are working correctly.

---

## 📋 PRE-TEST CHECKLIST

Before running tests, ensure:

- [ ] All dependencies are installed: `npm install`
- [ ] Prisma client is generated: `npm --prefix apps/api run prisma:generate`
- [ ] Database is running: `npm run db:up`
- [ ] Environment variables are configured correctly

---

## 🔍 TEST SUITE 1 — Backend Configuration

### Test 1.1: Verify API Port Configuration

**Objective**: Confirm the backend is configured to run on port 3001.

**Steps**:
```bash
# Check .env.example
grep "API_PORT" apps/api/.env.example
```

**Expected Output**:
```
API_PORT=3001
```

✅ **Pass Criteria**: API_PORT is set to 3001

---

### Test 1.2: Verify CORS Configuration

**Objective**: Confirm CORS is properly configured in main.ts.

**Steps**:
```bash
# Review CORS configuration
grep -A 5 "enableCors" apps/api/src/main.ts
```

**Expected Output**:
```typescript
app.enableCors({
  origin: corsOrigin,
  methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'],
  credentials: true,
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
});
```

✅ **Pass Criteria**: CORS is configured with proper origins and methods

---

### Test 1.3: Verify Health Endpoint Configuration

**Objective**: Confirm /health is excluded from /api prefix.

**Steps**:
```bash
# Check global prefix configuration
grep -A 1 "setGlobalPrefix" apps/api/src/main.ts
```

**Expected Output**:
```typescript
app.setGlobalPrefix('api', { exclude: ['graphql', 'health'] });
```

✅ **Pass Criteria**: Both 'graphql' and 'health' are excluded

---

## 🚀 TEST SUITE 2 — Backend Runtime

### Test 2.1: Start Backend Server

**Objective**: Verify backend starts successfully on port 3001.

**Steps**:
```bash
# Terminal 1: Start the backend
cd apps/api
npm run start:dev
```

**Expected Output**:
```
🚀 ========================================
✅ Backend corriendo en: http://localhost:3001
✅ GraphQL Playground: http://localhost:3001/graphql
✅ Health Check: http://localhost:3001/health
✅ CORS habilitado para: http://localhost:3000, http://localhost:3001
========================================
```

✅ **Pass Criteria**: 
- Server starts without errors
- Logs show port 3001
- GraphQL and Health endpoints are listed

---

### Test 2.2: Test Health Endpoint

**Objective**: Verify /health endpoint is accessible without /api prefix.

**Steps**:
```bash
# Terminal 2: Test health endpoint
curl http://localhost:3001/health
```

**Expected Output**:
```json
{
  "status": "ok",
  "message": "Servidor operativo",
  "timestamp": "2025-12-30T...",
  "environment": "development",
  "graphql": {
    "endpoint": "/graphql",
    "available": true
  },
  "version": "1.0.0"
}
```

✅ **Pass Criteria**: 
- HTTP 200 status
- JSON response with all expected fields
- graphql.available is true

---

### Test 2.3: Test GraphQL Endpoint

**Objective**: Verify GraphQL endpoint is accessible.

**Steps**:
```bash
# Test GraphQL endpoint with a simple query
curl -X POST http://localhost:3001/graphql \
  -H "Content-Type: application/json" \
  -d '{"query":"{ __typename }"}'
```

**Expected Output**:
```json
{
  "data": {
    "__typename": "Query"
  }
}
```

**Alternative (Browser)**:
Open `http://localhost:3001/graphql` in a browser and verify Apollo Sandbox loads.

✅ **Pass Criteria**: 
- HTTP 200 status
- Valid GraphQL response OR Apollo Sandbox interface

---

### Test 2.4: Verify Port is Open

**Objective**: Confirm process is listening on port 3001.

**Steps**:
```bash
# Linux/Mac:
lsof -i :3001

# Windows (PowerShell):
netstat -ano | findstr :3001
```

**Expected Output**:
```
node    12345 user   23u  IPv6 0x... 0t0  TCP *:3001 (LISTEN)
```

✅ **Pass Criteria**: Node process is listening on port 3001

---

## 🖥️ TEST SUITE 3 — Frontend Configuration

### Test 3.1: Verify Environment Variables

**Objective**: Confirm frontend is configured to connect to port 3001.

**Steps**:
```bash
# Check .env.local
cat apps/mobile-app/.env.local

# Check .env.example
cat apps/mobile-app/.env.example
```

**Expected Output** (both files):
```bash
NEXT_PUBLIC_GRAPHQL_URL=http://localhost:3001/graphql
NEXT_PUBLIC_API_URL=http://localhost:3001/api
NEXT_PUBLIC_GRAPHQL_WS_URL=ws://localhost:3001/graphql
```

✅ **Pass Criteria**: 
- All URLs point to port 3001
- NEXT_PUBLIC_GRAPHQL_URL is correct

---

### Test 3.2: Verify Apollo Client Configuration

**Objective**: Confirm Apollo Client has error handling.

**Steps**:
```bash
# Check providers.tsx
grep -A 10 "onError" apps/mobile-app/src/app/providers.tsx
```

**Expected Elements**:
- Import of `onError` from `@apollo/client/link/error`
- Error link implementation
- Logging for both GraphQL and network errors

✅ **Pass Criteria**: Error handling is implemented

---

## 🔗 TEST SUITE 4 — Integration Tests

### Test 4.1: Frontend Connects to Backend (Success Case)

**Objective**: Verify frontend can connect when backend is running.

**Prerequisites**:
- Backend is running on port 3001
- Frontend is running on port 3000

**Steps**:
```bash
# Terminal 1: Backend (if not already running)
npm run start:api

# Terminal 2: Frontend
npm run start:web

# Terminal 3: Test with curl
curl http://localhost:3000
```

**Manual Test**:
1. Open browser to `http://localhost:3000`
2. Click on "Login" or "Register"
3. Fill in form and submit
4. Open browser console (F12)

**Expected Console Logs (on error)**:
```
[GraphQL Error]: Message: <error message>, Operation: login
```

**NOT Expected**:
```
ERR_CONNECTION_REFUSED (without detailed error handling)
```

✅ **Pass Criteria**: 
- Frontend loads successfully
- Auth forms are functional
- Errors are handled gracefully with user-friendly messages

---

### Test 4.2: Frontend Error Handling (Backend Down)

**Objective**: Verify frontend handles connection errors gracefully.

**Prerequisites**:
- Frontend is running
- Backend is NOT running

**Steps**:
```bash
# Terminal 1: Stop backend (Ctrl+C if running)

# Terminal 2: Frontend (should be running)
npm run start:web
```

**Manual Test**:
1. Open browser to `http://localhost:3000`
2. Open browser console (F12)
3. Click on "Login" or "Register"
4. Fill in form and submit

**Expected Behavior**:
1. **Alert appears** with message:
   ```
   ❌ Error de conexión
   
   El servidor no está disponible. Por favor:
   1. Verifica que el backend esté corriendo en el puerto 3001
   2. Revisa la consola del servidor para errores
   3. Confirma que la URL del API sea correcta
   
   URL esperada: http://localhost:3001/graphql
   ```

2. **Console logs**:
   ```
   [Network Error] API no disponible: {
     url: 'http://localhost:3001/graphql',
     error: FetchError: request to http://localhost:3001/graphql failed...
   }
   ```

3. **App does NOT crash** - user can still navigate

✅ **Pass Criteria**: 
- Alert is displayed with troubleshooting steps
- Detailed console error with URL
- App remains functional
- No white screen of death

---

### Test 4.3: CORS Validation

**Objective**: Verify CORS headers are present.

**Steps**:
```bash
# With backend running, test CORS
curl -X OPTIONS http://localhost:3001/graphql \
  -H "Origin: http://localhost:3000" \
  -H "Access-Control-Request-Method: POST" \
  -v 2>&1 | grep -i "access-control"
```

**Expected Output**:
```
< Access-Control-Allow-Origin: http://localhost:3000
< Access-Control-Allow-Methods: GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS
< Access-Control-Allow-Credentials: true
< Access-Control-Allow-Headers: Content-Type,Authorization,X-Requested-With
```

✅ **Pass Criteria**: All CORS headers are present

---

## 📊 TEST SUITE 5 — End-to-End Scenarios

### Test 5.1: Full Authentication Flow

**Objective**: Test complete user registration with proper error handling.

**Prerequisites**:
- Database is running and migrated
- Backend is running
- Frontend is running

**Steps**:
1. Open `http://localhost:3000`
2. Click "Register"
3. Fill in:
   - Name: "Test User"
   - Email: "test@example.com"
   - Password: "password123"
   - Role: CLIENT
4. Submit form
5. Check both browser and backend console

**Expected Behavior**:
- Registration succeeds OR
- Clear error message displayed
- Backend logs the request
- No connection errors

✅ **Pass Criteria**: 
- Request reaches backend
- Response is received and handled
- User is created OR validation error is shown

---

## 🎯 ACCEPTANCE CRITERIA SUMMARY

All tests must pass for the fix to be considered complete:

### Backend ✅
- [ ] API starts on port 3001
- [ ] /health endpoint is accessible
- [ ] /graphql endpoint is accessible
- [ ] CORS is properly configured
- [ ] Bootstrap logs are informative

### Frontend ✅
- [ ] Environment variables are correct
- [ ] Apollo Client has error link
- [ ] Network errors are caught and logged
- [ ] User-friendly error messages are shown
- [ ] App doesn't crash on backend failure

### Integration ✅
- [ ] Frontend can connect to backend
- [ ] GraphQL mutations work
- [ ] Error handling is robust
- [ ] CORS headers are present

---

## 🐛 TROUBLESHOOTING FAILED TESTS

### If Test 2.1 fails (Backend won't start):
1. Check if port 3001 is already in use: `lsof -i :3001`
2. Kill process using the port: `kill -9 <PID>`
3. Check database connection: `npm run db:up`
4. Verify Prisma client is generated: `npm --prefix apps/api run prisma:generate`

### If Test 4.1 fails (Frontend can't connect):
1. Verify backend is running: `curl http://localhost:3001/health`
2. Check frontend environment: `cat apps/mobile-app/.env.local`
3. Restart frontend after changing .env: Stop (Ctrl+C) and `npm run start:web`
4. Check browser console for actual error message

### If Test 4.3 fails (CORS errors):
1. Verify CORS_ORIGIN in backend .env includes frontend origin
2. Restart backend after changing CORS configuration
3. Check browser network tab for preflight (OPTIONS) request

---

## 📝 TEST EXECUTION LOG

Use this template to document test results:

```
Date: _________________
Tester: _________________

Backend Configuration:
- Test 1.1: [ ] Pass [ ] Fail
- Test 1.2: [ ] Pass [ ] Fail
- Test 1.3: [ ] Pass [ ] Fail

Backend Runtime:
- Test 2.1: [ ] Pass [ ] Fail
- Test 2.2: [ ] Pass [ ] Fail
- Test 2.3: [ ] Pass [ ] Fail
- Test 2.4: [ ] Pass [ ] Fail

Frontend Configuration:
- Test 3.1: [ ] Pass [ ] Fail
- Test 3.2: [ ] Pass [ ] Fail

Integration Tests:
- Test 4.1: [ ] Pass [ ] Fail
- Test 4.2: [ ] Pass [ ] Fail
- Test 4.3: [ ] Pass [ ] Fail

End-to-End:
- Test 5.1: [ ] Pass [ ] Fail

Notes:
_____________________________________________
_____________________________________________
```

---

**Last Updated**: 2025-12-30  
**Version**: 1.0.0  
**Related**: RUNBOOK_GRAPHQL_CONNECTION.md
