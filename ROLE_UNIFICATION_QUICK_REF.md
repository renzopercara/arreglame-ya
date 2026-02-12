# Role Unification - Quick Reference

## What Changed?

### Problem
When users switched roles (CLIENT ↔ WORKER), the app didn't reflect the change properly because:
1. `switchActiveRole` only updated `activeRole`, leaving `currentRole` stale
2. JWT tokens contained outdated role information
3. Frontend state wasn't immediately updated

### Solution
✅ Backend: Both fields are now synchronized on role switch
✅ Backend: Authorization checks database instead of JWT
✅ Frontend: Immediate state update + data refetch

## For Developers

### Backend Changes

#### Before
```typescript
// Only updated activeRole
async switchActiveRole(userId: string, activeRole: ActiveRole) {
  return this.prisma.user.update({
    where: { id: userId },
    data: { activeRole },
  });
}
```

#### After
```typescript
// Now updates BOTH fields
async switchActiveRole(userId: string, activeRole: ActiveRole) {
  const currentRole = activeRole === ActiveRole.WORKER ? UserRole.WORKER : UserRole.CLIENT;
  
  return this.prisma.user.update({
    where: { id: userId },
    data: { 
      activeRole,
      currentRole, // Kept in sync!
    },
  });
}
```

### Frontend Changes

#### Before
```typescript
const switchRole = async (activeRole) => {
  await switchRoleMutation({ variables: { activeRole } });
  await fetchMe(); // Refetch only
};
```

#### After
```typescript
// onCompleted immediately updates state
const [switchRoleMutation] = useMutation(SWITCH_ACTIVE_ROLE, {
  onCompleted: (data) => {
    setUser(prevUser => prevUser ? {
      ...prevUser,
      activeRole: data.switchActiveRole.activeRole,
      currentRole: data.switchActiveRole.currentRole,
      // ... other fields
    } : null);
  },
});

const switchRole = async (activeRole) => {
  await switchRoleMutation({ variables: { activeRole } });
  await fetchMe(); // Also refetch for consistency
  await client.resetStore();
};
```

## Usage Examples

### Switching Roles (No changes needed!)
```typescript
// Frontend - works exactly the same
const { switchRole } = useAuth();
await switchRole('WORKER'); // Switches to worker mode
await switchRole('CLIENT'); // Switches back to client mode
```

### Checking Current Role
```typescript
// Frontend - works exactly the same
const { user } = useAuth();
console.log(user.activeRole); // 'WORKER' or 'CLIENT'
console.log(user.currentRole); // Always matches activeRole now!
```

### Backend Authorization
```typescript
// No changes needed - still works!
@RequireActiveRole('WORKER')
async startJob() {
  // Only workers can call this
}
```

## Testing

### Run All Tests
```bash
cd apps/api
npm test -- --testPathPattern="auth"
```

Expected output:
```
Test Suites: 2 passed, 2 total
Tests:       20 passed, 20 total
```

### Test Specific Files
```bash
# Role switching tests
npm test -- auth.service.spec.ts

# Authorization guard tests
npm test -- roles.guard.spec.ts
```

## Debugging

### Check Role Sync
```bash
# In Prisma Studio or database console
SELECT id, email, "currentRole", "activeRole" FROM "User" WHERE email = 'user@example.com';
```

Both fields should match after role switch.

### Check Frontend State
```typescript
// In React DevTools or console
const { user } = useAuth();
console.log({
  activeRole: user.activeRole,
  currentRole: user.currentRole,
  roles: user.roles,
});
```

### Check Backend Authorization
```typescript
// Add temporary logging in roles.guard.ts
console.log('JWT activeRole:', user.activeRole);
console.log('DB activeRole:', dbUser.activeRole);
```

## Migration Checklist

- [ ] Deploy backend changes
- [ ] Verify all tests pass in production
- [ ] Monitor role switch success rate
- [ ] Check for any authorization errors
- [ ] Verify frontend state updates correctly
- [ ] Test role switching in production

## Common Issues & Solutions

### Issue: "Esta acción requiere estar en modo Profesional"
**Cause:** User doesn't have WORKER role or activeRole is CLIENT
**Solution:** 
1. Check user has WORKER in roles array
2. Ensure role switch completed successfully
3. Verify database activeRole matches

### Issue: UI doesn't update after role switch
**Cause:** Frontend state not updating
**Solution:**
1. Check browser console for errors
2. Verify Apollo cache is resetting
3. Check ME_QUERY refetch is working

### Issue: Authorization still uses old role
**Cause:** Database lookup failing
**Solution:**
1. Check RolesGuard is injecting PrismaService correctly
2. Verify database connection
3. Check user still exists in database

## Performance Notes

- Database query adds ~2-5ms latency per authorization check
- Only affects endpoints with `@RequireActiveRole`
- Queries are indexed and optimized
- Can add Redis caching if needed

## Backward Compatibility

✅ All existing code continues to work
✅ No API changes required
✅ No database migrations needed
✅ No breaking changes

## Next Steps

### Immediate (Done)
- [x] Sync both role fields
- [x] Update authorization guard
- [x] Add comprehensive tests
- [x] Update documentation

### Future Enhancements
- [ ] Add Redis caching for activeRole lookups
- [ ] Add audit logging for role changes
- [ ] Consider deprecating currentRole field
- [ ] Add role change notifications

## Support

If you encounter issues:
1. Check this guide first
2. Review ROLE_UNIFICATION_SUMMARY.md for details
3. Run the test suite to verify setup
4. Check database for role consistency

## References

- **Implementation Guide**: ROLE_UNIFICATION_SUMMARY.md
- **Tests**: apps/api/src/auth/*.spec.ts
- **Code Changes**: PR commits and diffs
