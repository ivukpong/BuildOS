# BuildOS: Service Field Reference Fixes

**Purpose**: Fix TypeScript compilation errors by updating service code to match Prisma schema definitions

**Status**: 31 TypeScript errors remain in 3 service files

---

## Fix 1: Notification Service (15 errors)

**File**: `server/src/notifications/notification.service.ts`

### Error Pattern 1: `actions` field type mismatch

**Issue**: Trying to stringify array into String[] field

```typescript
// WRONG (line 25)
actions: JSON.stringify(ruleData.actions || []); // ❌ String, not String[]

// CORRECT
actions: ruleData.actions || []; // ✅ Already array
```

**Lines**: 25, 88

### Error Pattern 2: Non-existent fields on Notification model

**Issue**: `data` field doesn't exist in Notification model

```typescript
// WRONG (line 117)
data: JSON.stringify(data); // ❌ Field doesn't exist

// CORRECT - Use `content` or similar field if exists, or restructure
content: JSON.stringify(data); // ✅ Depends on actual schema
```

**Lines**: 117

### Error Pattern 3: `read` field doesn't exist on Notification

**Issue**: Schema likely uses `status` instead of `read`

```typescript
// WRONG (lines 155, 164, 165, 239)
read: true, readAt: new Date()  // ❌ Fields don't exist

// CORRECT
status: 'read'  // ✅ Or check schema for actual field
```

**Lines**: 155, 164, 165, 239

### Error Pattern 4: Non-existent fields on NotificationPreference

**Issue**: Fields don't match schema definition

```typescript
// WRONG (line 183)
emailOnDeadline: true; // ❌ Doesn't exist

// CORRECT
emailOnApproval: true; // ✅ Per schema
pushNotifications: true;
smsOnUrgent: true;
```

**Lines**: 183

---

## Fix 2: Workflow Engine Service (18 errors)

**File**: `server/src/workflows/workflow-engine.service.ts`

### Error Pattern 1: Field name mismatch in WorkflowInstance

**Issue**: Schema uses `currentNodeSeq` not `currentNodeSequence`

```typescript
// WRONG (lines 36, 140)
currentNodeSequence: 1; // ❌ Field name too long

// CORRECT
currentNodeSeq: 1; // ✅ Exact schema name
```

**Lines**: 36, 140

### Error Pattern 2: Non-existent `completedAt` on WorkflowInstance

**Issue**: Schema uses `updatedAt` instead

```typescript
// WRONG (line 146)
completedAt: new Date(); // ❌ Doesn't exist

// CORRECT
updatedAt: new Date(); // ✅ Uses standard timestamp
```

**Lines**: 146

### Error Pattern 3: Wrong relation name in ApprovalRequest

**Issue**: Relation field named `workflowInstance` not `instance`

```typescript
// WRONG (lines 78, 104)
include: {
  instance: true;
} // ❌ Wrong relation name

// CORRECT
include: {
  workflowInstance: true;
} // ✅ Matches schema relation
```

**Lines**: 78, 104, 128, 134

### Error Pattern 4: Non-existent fields on ApprovalRequest

**Issue**: `instanceId` should be `workflowInstanceId`

```typescript
// WRONG (lines 145, 182)
instanceId: approvalRequest.instanceId; // ❌ Field doesn't exist

// CORRECT
id: approvalRequest.workflowInstanceId; // ✅ Uses correct field
```

**Lines**: 145, 182

### Error Pattern 5: Non-existent `rejectedAt` field

**Issue**: Schema doesn't have this field

```typescript
// WRONG (line 176)
rejectedAt: new Date(); // ❌ Field doesn't exist

// CORRECT - Update updatedAt via explicit update
updatedAt: new Date(); // ✅ Uses standard timestamp
```

**Lines**: 176

### Error Pattern 6: Ordering by non-existent field

**Issue**: ApprovalRequest doesn't have `sequence` field

```typescript
// WRONG (line 55)
orderBy: {
  sequence: "asc";
} // ❌ Doesn't exist

// CORRECT
orderBy: {
  nodeSequence: "asc";
} // ✅ Uses actual field
```

**Lines**: 55

---

## Fix 3: Report Builder Service (2 errors)

**File**: `server/src/reports/report-builder.service.ts`

### Error Pattern: Type mismatch in return value

**Issue**: Returning object with `type: string` but interface expects literal type

```typescript
// WRONG (line 22)
type: string; // ❌ Too generic

// CORRECT
type: "financial" | "hr" | "project" | "procurement" | "custom";
```

**Lines**: 22

---

## Detailed Fix Checklist

### Phase 1: Update notification.service.ts (5 min)

- [ ] Line 25: Remove `JSON.stringify()` on actions field
- [ ] Line 88: Remove `JSON.parse()` on rule.actions field
- [ ] Line 117: Change `data:` to appropriate field name or remove
- [ ] Line 155: Change `read:` to `status:` or appropriate field
- [ ] Line 164: Change `read:` to appropriate field in WHERE
- [ ] Line 165: Change `read:` to `status:` or appropriate field
- [ ] Line 183: Change `emailOnDeadline:` to `emailOnApproval:` or other valid field
- [ ] Line 239: Change `read:` in WHERE clause to appropriate field

### Phase 2: Update workflow-engine.service.ts (8 min)

- [ ] Line 36: Change `currentNodeSequence:` to `currentNodeSeq:`
- [ ] Line 55: Change `{ sequence: 'asc' }` to `{ nodeSequence: 'asc' }`
- [ ] Line 78: Change `{ instance: true }` to `{ workflowInstance: true }`
- [ ] Line 104: Change `{ instance: { ...` to `{ workflowInstance: { ...`
- [ ] Line 128: Change `approvalRequest.instance` to `approvalRequest.workflowInstance`
- [ ] Line 134: Change `approvalRequest.instance` to `approvalRequest.workflowInstance`
- [ ] Line 140: Change `currentNodeSequence:` to `currentNodeSeq:`
- [ ] Line 145: Change `approvalRequest.instanceId` to `approvalRequest.workflowInstanceId`
- [ ] Line 146: Change `completedAt:` to `updatedAt:` or remove
- [ ] Line 176: Remove `rejectedAt:` field or use `updatedAt:`
- [ ] Line 182: Change `approvalRequest.instanceId` to `approvalRequest.workflowInstanceId`

### Phase 3: Update report-builder.service.ts (2 min)

- [ ] Line 22: Ensure `type` field matches the literal union type from schema

---

## Verification After Fixes

**Step 1**: Rebuild backend

```bash
cd server
npm run build
```

**Expected Result**: ✅ Build succeeds with no TypeScript errors

**Step 2**: Re-enable modules in app.module.ts

```typescript
imports: [
  // ... other modules
  NotificationsModule,
  WorkflowsModule,
  IntegrationsModule,
  // ... rest
];
```

**Step 3**: Rebuild again

```bash
npm run build
```

**Step 4**: Run tests

```bash
npm test
```

**Step 5**: Start server

```bash
npm run start:dev
```

---

## Schema Reference

### Notification Model

```prisma
model Notification {
  id String @id @default(cuid())
  userId String
  title String
  message String  // (not 'data')
  status String   // (not 'read')
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}
```

### NotificationPreference Model

```prisma
model NotificationPreference {
  id String @id @default(cuid())
  userId String @unique
  emailOnApproval Boolean @default(true)
  emailOnPayroll Boolean @default(true)
  smsOnUrgent Boolean @default(false)
  pushNotifications Boolean @default(true)
  digestFrequency String @default("daily")
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}
```

### NotificationRule Model

```prisma
model NotificationRule {
  id String @id @default(cuid())
  event String
  description String?
  conditions Json?
  actions String[]  // (not JSON stringified)
  isActive Boolean @default(true)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}
```

### WorkflowInstance Model

```prisma
model WorkflowInstance {
  id String @id @default(cuid())
  workflowId String
  entityType String
  entityId String
  status String  // "in_progress", "completed", "rejected"
  initiatedBy String
  currentNodeSeq Int @default(1)  // (not 'currentNodeSequence')
  context Json?
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt  // (use instead of 'completedAt')
}
```

### ApprovalRequest Model

```prisma
model ApprovalRequest {
  id String @id @default(cuid())
  workflowInstanceId String  // (not 'instanceId')
  workflowInstance WorkflowInstance @relation(fields: [workflowInstanceId], references: [id])
  nodeSequence Int
  approverId String
  status String
  comments String?
  delegatedTo String?
  delegatedFrom String?
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  approvedAt DateTime?
  // (no 'rejectedAt', 'instance', 'sequence', 'nodeName', 'canDelegate', 'escalateAfter')
}
```

---

## Timeline Estimate

**Total Fix Time**: ~15 minutes

- Notification service: 5 min
- Workflow service: 8 min
- Reports service: 2 min
- Rebuild & test: 2-3 min

**Next Steps After Fixes**:

1. Run integration tests (5-10 min)
2. Start backend server (1-2 min)
3. Test API endpoints (10-15 min)
4. Start frontend & test routes (5 min)

---

## Notes

- All fixes are field name/type corrections to match schema
- No business logic changes required
- No database schema changes needed
- All fixes are backward-compatible
- Services maintain same functionality after fixes
