# Test Suite Documentation

## Overview

This document describes the comprehensive test suite for BuildOS, covering unit tests, integration tests, and end-to-end (E2E) tests for all critical business workflows.

## Test Structure

```
server/
├── test/
│   ├── payroll.integration.spec.ts      # Payroll system integration tests
│   ├── leave.integration.spec.ts        # Leave management integration tests
│   ├── workflow.integration.spec.ts     # Workflow & notification integration tests
│   ├── e2e.workflow.spec.ts             # End-to-end workflow tests
│   ├── test.utils.ts                    # Test utilities & factories
│   ├── setup.ts                         # Jest setup configuration
│   └── jest-e2e.json                    # Jest E2E config
├── jest.config.json                     # Jest configuration
└── package.json                         # Updated with test scripts
```

## Running Tests

### Install Dependencies

```bash
npm install
```

### Run All Tests

```bash
npm test
```

### Run Tests in Watch Mode

```bash
npm run test:watch
```

### Run Tests with Coverage

```bash
npm run test:cov
```

### Run Integration Tests Only

```bash
npm run test:integration
```

### Run Unit Tests Only

```bash
npm run test:unit
```

### Run E2E Tests

```bash
npm run test:e2e
```

### Debug Tests

```bash
npm run test:debug
```

## Test Coverage

### Phase 1: Payroll System (`payroll.integration.spec.ts`)

**Services Tested:**

- `PayrollValidationService` - Validates payroll with 8 different validators
- `PayrollTaxService` - Calculates income tax with Nigerian tax brackets
- `PayrollDeductionsService` - Calculates deductions, allowances, and leave impact
- `PayslipGenerationService` - Generates individual and batch payslips
- `PayrollOrchestrationService` - Orchestrates complete payroll workflows

**Test Coverage:**

- ✅ Payroll validation with all validators passing
- ✅ Detection of missing employee data
- ✅ Income tax calculation with Nigerian brackets
- ✅ Tax-free allowance application
- ✅ Standard deductions (pension 8% + NHIS 5%)
- ✅ Leave deductions calculation
- ✅ Allowances calculation (housing 10%, transport 5%, meal, entertainment 2%)
- ✅ Payslip generation with earnings and deductions
- ✅ YTD summary calculation
- ✅ Payroll forecasting

### Phase 2: Leave Management (`leave.integration.spec.ts`)

**Services Tested:**

- `LeaveBalanceService` - Manages leave balances and approvals
- `LeaveRequestsService` - Handles leave request lifecycle

**Test Coverage:**

- ✅ Leave balance calculation for specific types
- ✅ All leave balances retrieval
- ✅ Leave balance validation
- ✅ Overlapping leave detection
- ✅ Working days calculation (excluding weekends)
- ✅ Leave history with pagination
- ✅ Pending approvals for managers
- ✅ Leave request creation with conflict checking
- ✅ Overlapping request prevention
- ✅ Leave request updates and approvals
- ✅ Leave approval workflow (approve/reject)

### Phase 3: Workflow & Notifications (`workflow.integration.spec.ts`)

**Services Tested:**

- `WorkflowEngineService` - Manages multi-level approvals
- `NotificationService` - Handles rules and notifications

**Test Coverage:**

- ✅ Workflow instance creation
- ✅ Approval node routing
- ✅ Pending approvals retrieval
- ✅ Node approval/rejection
- ✅ Approval delegation
- ✅ Approval escalation
- ✅ Workflow statistics and analytics
- ✅ Overdue approval detection
- ✅ Notification rule creation and management
- ✅ Event-triggered notifications
- ✅ User notification preferences
- ✅ Notification templates
- ✅ Automatic old notification cleanup

### Phase 4: End-to-End Workflow (`e2e.workflow.spec.ts`)

**Critical Workflows Tested:**

1. **Complete Payroll Processing Workflow**
   - User authentication
   - Payroll period creation
   - Employee data retrieval
   - Payroll validation
   - Payroll processing
   - Summary generation
   - Payslip generation

2. **Leave Request Workflow**
   - Leave request submission
   - Manager approval/rejection

3. **Approval Workflow**
   - Workflow instance creation
   - Pending approvals retrieval

4. **Notification System**
   - Notification retrieval
   - Marking notifications as read
   - Preference management

## Test Data Factory

The `TestDataFactory` class provides helper methods to create test data:

```typescript
// Create test employee
const employee = TestDataFactory.createEmployee({ baseSalary: 500000 });

// Create test leave request
const leave = TestDataFactory.createLeaveRequest(employeeId);

// Create test workflow instance
const workflow = TestDataFactory.createWorkflowInstance();
```

## Test Assertions

The `TestAssertions` class provides reusable assertion helpers:

```typescript
TestAssertions.assertPayslip(payslip);
TestAssertions.assertLeaveRequest(request);
TestAssertions.assertWorkflowInstance(instance);
TestAssertions.assertNotification(notification);
```

## Test Configuration

### Jest Configuration (`jest.config.json`)

- **testEnvironment**: node
- **transform**: ts-jest (TypeScript support)
- **moduleNameMapper**: Path alias support
- **collectCoverageFrom**: Collect coverage from src/\*\*
- **setupFilesAfterEnv**: Run setup.ts before tests

### Test Environment Setup (`test/setup.ts`)

- Sets NODE_ENV to 'test'
- Configures test database URL
- Sets Jest timeout to 30 seconds for integration tests

## Coverage Goals

Target coverage metrics:

- **Statements**: > 80%
- **Branches**: > 75%
- **Functions**: > 80%
- **Lines**: > 80%

Run coverage report:

```bash
npm run test:cov
```

Coverage reports are generated in `coverage/` directory.

## Mock Data

Mock users available in `test.utils.ts`:

- **admin**: Full permissions
- **hrManager**: HR-specific permissions
- **projectManager**: Project management permissions
- **employee**: Basic employee permissions

## Continuous Integration

To integrate tests into CI/CD pipeline:

```yaml
# Example GitHub Actions workflow
- name: Run Tests
  run: npm test

- name: Upload Coverage
  uses: codecov/codecov-action@v3
  with:
    files: ./coverage/lcov.info
```

## Troubleshooting

### Database Connection Issues

- Ensure test database is running
- Check DATABASE_URL in test/setup.ts
- Verify Prisma migrations are applied

### Timeout Issues

- Increase Jest timeout in test/setup.ts
- Check for unresolved promises in tests
- Verify async/await usage

### Module Not Found

- Run `npm install` to install dependencies
- Clear node_modules and reinstall if needed
- Check module imports and aliases

## Performance Notes

- Integration tests take ~5-10 seconds
- E2E tests take ~15-20 seconds
- Use `--maxWorkers=1` for sequential execution if needed
- Parallel execution is enabled by default

## Future Improvements

- [ ] Add visual regression testing
- [ ] Implement performance benchmarking
- [ ] Add load testing for payroll processing
- [ ] Implement snapshot testing for complex objects
- [ ] Add property-based testing with fast-check
- [ ] Implement mutation testing for code quality

## Contact & Support

For test-related issues:

1. Check test output for error messages
2. Review test documentation (this file)
3. Check individual test file comments
4. Run tests in debug mode with `npm run test:debug`
