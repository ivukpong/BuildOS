/**
 * cleanup-dummy-data.ts
 *
 * Removes the demo/seed ("dummy") data that ships from seed.ts and
 * seed-construction.ts, while preserving:
 *   - Login users (User table) and roles (AppRole)
 *   - Admin configuration (issue types, change categories, store levels,
 *     general settings — these live in data/admin-settings.json, not the DB)
 *   - Leave/Claim type config (needed by ESS forms)
 *   - Any records the user created themselves (different ids/refs/projects)
 *
 * Run a preview first:   DRY_RUN=1 npx ts-node prisma/cleanup-dummy-data.ts
 * Then execute for real:           npx ts-node prisma/cleanup-dummy-data.ts
 */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const DRY_RUN = process.env.DRY_RUN === '1';

// The three demo projects every seeded construction/finance/HR record hangs off.
const SEED_PROJECT_IDS = [
  'lekki-tower-a',
  'riverside-residential',
  'industrial-warehouse',
];

const SEED_EMPLOYEE_EMAILS = [
  'c.eze@buildos.ng',
  'a.osei@buildos.ng',
  's.adeleke@buildos.ng',
  'n.okafor@buildos.ng',
  'm.ibrahim@buildos.ng',
  'k.adeyemi@buildos.ng',
];

const SEED_DEPARTMENT_NAMES = [
  'Engineering',
  'Operations',
  'Finance',
  'Human Resources',
  'Procurement',
  'Administration',
];

const SEED_TASK_TITLES = [
  'Foundation Works Inspection',
  'Safety Audit — Block B',
  'Concrete Pour Schedule Review',
  'Soil Compaction Test Review',
  'Site Photo Documentation',
  'Rebar Installation QC Check',
  'Review Q1 expense reports',
  'Process new hire onboarding',
  'Approve pending purchase requests',
  'Monthly stock count',
];

const results: { table: string; deleted: number }[] = [];

async function run(
  table: string,
  fn: () => Promise<{ count: number }>,
  countFn: () => Promise<number>,
) {
  try {
    if (DRY_RUN) {
      const n = await countFn();
      results.push({ table, deleted: n });
    } else {
      const { count } = await fn();
      results.push({ table, deleted: count });
    }
  } catch (err: any) {
    console.error(`  ! ${table}: ${err?.message ?? err}`);
    results.push({ table, deleted: -1 });
  }
}

async function main() {
  console.log(
    DRY_RUN
      ? '── DRY RUN — counting dummy rows that WOULD be deleted ──'
      : '── DELETING dummy/seed data ──',
  );

  const byProject = { projectId: { in: SEED_PROJECT_IDS } };

  // 1) Pure-seed construction tables tied to the demo projects (children first).
  await run('documentFile', () => prisma.documentFile.deleteMany({ where: byProject }), () => prisma.documentFile.count({ where: byProject }));
  await run('documentFolder', () => prisma.documentFolder.deleteMany({ where: byProject }), () => prisma.documentFolder.count({ where: byProject }));
  await run('fundingRelease', () => prisma.fundingRelease.deleteMany({ where: byProject }), () => prisma.fundingRelease.count({ where: byProject }));
  await run('disbursement', () => prisma.disbursement.deleteMany({ where: byProject }), () => prisma.disbursement.count({ where: byProject }));
  await run('fundingAllocation', () => prisma.fundingAllocation.deleteMany({ where: byProject }), () => prisma.fundingAllocation.count({ where: byProject }));
  await run('dailyReport', () => prisma.dailyReport.deleteMany({ where: byProject }), () => prisma.dailyReport.count({ where: byProject }));
  await run('earnedValueRecord', () => prisma.earnedValueRecord.deleteMany({ where: byProject }), () => prisma.earnedValueRecord.count({ where: byProject }));
  await run('constructionBaseline', () => prisma.constructionBaseline.deleteMany({ where: byProject }), () => prisma.constructionBaseline.count({ where: byProject }));
  await run('constructionCalendar', () => prisma.constructionCalendar.deleteMany({ where: byProject }), () => prisma.constructionCalendar.count({ where: byProject }));
  await run('constructionTask', () => prisma.constructionTask.deleteMany({ where: byProject }), () => prisma.constructionTask.count({ where: byProject }));
  await run('communicationLog', () => prisma.communicationLog.deleteMany({ where: byProject }), () => prisma.communicationLog.count({ where: byProject }));
  await run('hseRecord', () => prisma.hseRecord.deleteMany({ where: byProject }), () => prisma.hseRecord.count({ where: byProject }));
  await run('qualityNcr', () => prisma.qualityNcr.deleteMany({ where: byProject }), () => prisma.qualityNcr.count({ where: byProject }));
  await run('stakeholder', () => prisma.stakeholder.deleteMany({ where: byProject }), () => prisma.stakeholder.count({ where: byProject }));
  await run('projectDelay', () => prisma.projectDelay.deleteMany({ where: byProject }), () => prisma.projectDelay.count({ where: byProject }));
  await run('changeRequest', () => prisma.changeRequest.deleteMany({ where: byProject }), () => prisma.changeRequest.count({ where: byProject }));
  await run('constructionIssue', () => prisma.constructionIssue.deleteMany({ where: byProject }), () => prisma.constructionIssue.count({ where: byProject }));
  await run('humanResource', () => prisma.humanResource.deleteMany({ where: byProject }), () => prisma.humanResource.count({ where: byProject }));
  await run('materialResource', () => prisma.materialResource.deleteMany({ where: byProject }), () => prisma.materialResource.count({ where: byProject }));
  await run('equipmentResource', () => prisma.equipmentResource.deleteMany({ where: byProject }), () => prisma.equipmentResource.count({ where: byProject }));

  // 2) Global pure-seed catalogs (entirely demo data).
  // (Vendor/Contractor tables are not present in this database — skipped.)
  await run('equipment', () => prisma.equipment.deleteMany({}), () => prisma.equipment.count());
  await run('cluster', () => prisma.cluster.deleteMany({}), () => prisma.cluster.count());
  await run('chartAccount', () => prisma.chartAccount.deleteMany({}), () => prisma.chartAccount.count());

  // reportRun -> reportDefinition (children first)
  await run('reportRun', () => prisma.reportRun.deleteMany({}), () => prisma.reportRun.count());
  await run('reportDefinition', () => prisma.reportDefinition.deleteMany({ where: { name: 'Project Financial Summary' } }), () => prisma.reportDefinition.count({ where: { name: 'Project Financial Summary' } }));

  // 3) Seeded "My Tasks" rows (by exact seeded titles only).
  await run('task', () => prisma.task.deleteMany({ where: { title: { in: SEED_TASK_TITLES } } }), () => prisma.task.count({ where: { title: { in: SEED_TASK_TITLES } } }));

  // 4) Seeded finance / HR / procurement demo records (by unique seed ids/refs).
  await run('leaveRequest', () => prisma.leaveRequest.deleteMany({ where: { refId: 'LV-2026-001' } }), () => prisma.leaveRequest.count({ where: { refId: 'LV-2026-001' } }));
  await run('claim', () => prisma.claim.deleteMany({ where: { description: 'Hospital bill reimbursement', amount: 45000 } }), () => prisma.claim.count({ where: { description: 'Hospital bill reimbursement', amount: 45000 } }));
  await run('purchaseOrder', () => prisma.purchaseOrder.deleteMany({ where: { id: 'PO-0027' } }), () => prisma.purchaseOrder.count({ where: { id: 'PO-0027' } }));
  await run('expense', () => prisma.expense.deleteMany({ where: { id: 'EXP-0051' } }), () => prisma.expense.count({ where: { id: 'EXP-0051' } }));
  await run('income', () => prisma.income.deleteMany({ where: { id: 'INC-0021' } }), () => prisma.income.count({ where: { id: 'INC-0021' } }));
  await run('budget', () => prisma.budget.deleteMany({ where: { id: 'BUD-001' } }), () => prisma.budget.count({ where: { id: 'BUD-001' } }));
  await run('payment', () => prisma.payment.deleteMany({ where: { id: 'PAY-0041' } }), () => prisma.payment.count({ where: { id: 'PAY-0041' } }));
  await run('materialRequest', () => prisma.materialRequest.deleteMany({ where: { reference: 'MR-2026-0039' } }), () => prisma.materialRequest.count({ where: { reference: 'MR-2026-0039' } }));
  await run('purchaseRequest', () => prisma.purchaseRequest.deleteMany({ where: { prRef: 'PR-2026-0041' } }), () => prisma.purchaseRequest.count({ where: { prRef: 'PR-2026-0041' } }));

  // Seeded store + its item + standalone material.
  await run('storeItem', () => prisma.storeItem.deleteMany({ where: { materialName: 'OPC Cement', bin: 'A-12' } }), () => prisma.storeItem.count({ where: { materialName: 'OPC Cement', bin: 'A-12' } }));
  await run('store', () => prisma.store.deleteMany({ where: { name: 'General Store', location: 'Lagos HQ', manager: 'Musa Ibrahim' } }), () => prisma.store.count({ where: { name: 'General Store', location: 'Lagos HQ', manager: 'Musa Ibrahim' } }));
  await run('material', () => prisma.material.deleteMany({ where: { name: 'OPC Cement', category: 'Concrete' } }), () => prisma.material.count({ where: { name: 'OPC Cement', category: 'Concrete' } }));

  // Seeded supplier (cascade removes its materials).
  await run('supplier', () => prisma.supplier.deleteMany({ where: { name: 'Dangote Cement PLC' } }), () => prisma.supplier.count({ where: { name: 'Dangote Cement PLC' } }));

  // 5) Seeded employees, then departments, then the 3 demo projects.
  // Null out department heads first so employee deletes don't violate the head FK.
  if (!DRY_RUN) {
    await prisma.department.updateMany({
      where: { name: { in: SEED_DEPARTMENT_NAMES } },
      data: { headId: null },
    });
  }
  await run('employee', () => prisma.employee.deleteMany({ where: { email: { in: SEED_EMPLOYEE_EMAILS } } }), () => prisma.employee.count({ where: { email: { in: SEED_EMPLOYEE_EMAILS } } }));
  await run('department', () => prisma.department.deleteMany({ where: { name: { in: SEED_DEPARTMENT_NAMES } } }), () => prisma.department.count({ where: { name: { in: SEED_DEPARTMENT_NAMES } } }));
  await run('project', () => prisma.project.deleteMany({ where: { id: { in: SEED_PROJECT_IDS } } }), () => prisma.project.count({ where: { id: { in: SEED_PROJECT_IDS } } }));

  console.log('\nTable'.padEnd(26) + (DRY_RUN ? 'Would delete' : 'Deleted'));
  console.log('─'.repeat(40));
  let total = 0;
  for (const r of results) {
    console.log(r.table.padEnd(26) + (r.deleted < 0 ? 'ERROR' : r.deleted));
    if (r.deleted > 0) total += r.deleted;
  }
  console.log('─'.repeat(40));
  console.log('TOTAL'.padEnd(26) + total);
  console.log(
    DRY_RUN
      ? '\nDRY RUN complete — no rows were deleted.'
      : '\nCleanup complete.',
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
