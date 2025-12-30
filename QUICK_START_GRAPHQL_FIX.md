# ⚡ QUICK START — GraphQL Connection Fix Reference

> **For developers who need to quickly resolve or prevent GraphQL connection errors**

---

## 🚨 Emergency Quick Fixes

### Problem: Frontend shows "ERR_CONNECTION_REFUSED"

**Solution (60 seconds):**
```bash
# 1. Start backend on correct port
npm run start:api

# 2. Verify it's running
curl http://localhost:3001/health

# 3. Check frontend env
cat apps/mobile-app/.env.local
# Should have: NEXT_PUBLIC_GRAPHQL_URL=http://localhost:3001/graphql

# 4. Restart frontend if you changed .env
npm run start:web
```

---

## ✅ Pre-Commit Checklist

Before committing code that touches API or frontend connection:

- [ ] Backend port is **3001** (not 3000)
- [ ] Frontend `NEXT_PUBLIC_GRAPHQL_URL` points to **:3001/graphql**
- [ ] Apollo Client has error handling
- [ ] User sees friendly error if backend is down
- [ ] Console logs help with debugging

---

## 📁 Key Files Reference

### Backend Configuration
```
apps/api/.env.example               → API_PORT=3001
apps/api/src/main.ts                → CORS + port config
apps/api/src/health/health.service.ts → Health check response
```

### Frontend Configuration
```
apps/mobile-app/.env.local          → NEXT_PUBLIC_GRAPHQL_URL
apps/mobile-app/src/app/providers.tsx → Apollo Client setup
apps/mobile-app/src/components/AuthModal.tsx → Error handling example
```

---

## 🔧 Common Commands

```bash
# Start everything
npm run dev

# Just backend
npm run start:api

# Just frontend  
npm run start:web

# Check health
curl http://localhost:3001/health

# Test GraphQL
curl -X POST http://localhost:3001/graphql \
  -H "Content-Type: application/json" \
  -d '{"query":"{ __typename }"}'

# Check what's on port 3001
lsof -i :3001
```

---

## 🐛 Debug Checklist

When connection fails, check in order:

1. **Is backend running?**
   ```bash
   lsof -i :3001
   ```

2. **Is GraphQL endpoint accessible?**
   ```bash
   curl http://localhost:3001/graphql
   ```

3. **Are frontend env vars correct?**
   ```bash
   grep GRAPHQL apps/mobile-app/.env.local
   ```

4. **Check browser console** - Look for:
   - `[Network Error]` → Backend down
   - `[GraphQL Error]` → Backend up, GraphQL issue
   - CORS error → Check backend CORS config

5. **Check backend console** - Look for:
   - Bootstrap logs showing port 3001
   - CORS configuration
   - Any error messages

---

## 💡 Code Patterns

### ✅ Correct Apollo Client Setup
```typescript
import { onError } from '@apollo/client/link/error';

const errorLink = onError(({ graphQLErrors, networkError }) => {
  if (networkError) console.error('[Network Error]', networkError);
  if (graphQLErrors) graphQLErrors.forEach(e => console.error('[GraphQL Error]', e));
});

const client = new ApolloClient({
  link: from([errorLink, httpLink]),
  // ... rest of config
});
```

### ✅ Correct Mutation Error Handling
```typescript
try {
  const { data } = await mutation({ variables });
  // handle success
} catch (error: any) {
  if (error.networkError) {
    // Backend is down - show user-friendly message
    alert('Server unavailable. Please check backend.');
    return;
  }
  if (error.graphQLErrors) {
    // GraphQL error - show specific error
    alert(error.graphQLErrors[0].message);
    return;
  }
}
```

### ❌ Wrong Pattern
```typescript
try {
  const { data } = await mutation({ variables });
} catch (e: any) {
  alert(e.message); // Too generic, doesn't help debug
}
```

---

## 📚 Full Documentation

- **Troubleshooting**: See [RUNBOOK_GRAPHQL_CONNECTION.md](./RUNBOOK_GRAPHQL_CONNECTION.md)
- **Testing**: See [TESTING_GUIDE_GRAPHQL_CONNECTION.md](./TESTING_GUIDE_GRAPHQL_CONNECTION.md)

---

## 🎯 Remember

1. **Port 3001** for backend (NOT 3000)
2. **Always restart frontend** after changing .env files
3. **Error handling is mandatory** for all mutations
4. **Check health endpoint** (`/health`) before debugging GraphQL
5. **Read console logs** - they tell you exactly what's wrong

---

**Last Updated**: 2025-12-30  
**Quick Help**: If stuck, run `curl http://localhost:3001/health` first!
