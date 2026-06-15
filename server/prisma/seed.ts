import {
  PrismaClient,
  ProjectStatus,
  ProjectType,
  EmployeeStatus,
  EmploymentType,
  LeaveStatus,
  ClaimStatus,
  POStatus,
  POPaymentStatus,
  ExpenseStatus,
  IncomeStatus,
  BudgetScope,
  BudgetStatus,
  PaymentType,
  PaymentStatus,
} from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function clearDatabase() {
  await prisma.$executeRawUnsafe(`
    DO $$
    DECLARE
      r RECORD;
    BEGIN
      FOR r IN (
        SELECT tablename
        FROM pg_tables
        WHERE schemaname = 'public'
          AND tablename <> '_prisma_migrations'
      )
      LOOP
        EXECUTE 'TRUNCATE TABLE public.' || quote_ident(r.tablename) || ' RESTART IDENTITY CASCADE';
      END LOOP;
    END
    $$;
  `);
}

async function main() {
  console.log('Seeding database...');
  
  // Skip clearing database to avoid connection timeout
  // Database should be cleaned before seed if needed

  const departments = [
    { name: 'Engineering', description: 'Engineering teams', location: 'HQ Floor 3', budget: 45000000 },
    { name: 'Operations', description: 'Project execution teams', location: 'HQ Floor 2', budget: 38000000 },
    { name: 'Finance', description: 'Finance and reporting teams', location: 'HQ Floor 4', budget: 28000000 },
    { name: 'Human Resources', description: 'HR and payroll teams', location: 'HQ Floor 1', budget: 22000000 },
    { name: 'Procurement', description: 'Procurement and supplier teams', location: 'HQ Floor 2', budget: 18000000 },
    { name: 'Administration', description: 'Admin and support teams', location: 'HQ Floor 1', budget: 12000000 },
  ];

  const deptRecords = new Map<string, { id: string }>();
  for (const d of departments) {
    const rec = await prisma.department.upsert({
      where: { name: d.name },
      update: d,
      create: d,
    });
    deptRecords.set(d.name, { id: rec.id });
  }

  const employees = [
    {
      firstName: 'Chukwudi',
      lastName: 'Eze',
      email: 'c.eze@buildos.ng',
      phone: '+2348012345001',
      dateHired: new Date('2022-03-15'),
      status: EmployeeStatus.active,
      employmentType: EmploymentType.FullTime,
      projectCount: 2,
      projects: ['Lekki Tower A', 'Airport Bridge'],
      departmentId: deptRecords.get('Engineering')?.id,
    },
    {
      firstName: 'Amaka',
      lastName: 'Osei',
      email: 'a.osei@buildos.ng',
      phone: '+2348023456002',
      dateHired: new Date('2021-07-01'),
      status: EmployeeStatus.active,
      employmentType: EmploymentType.FullTime,
      projectCount: 2,
      projects: ['Lekki Tower A', 'Riverside Residential'],
      departmentId: deptRecords.get('Operations')?.id,
    },
    {
      firstName: 'Sola',
      lastName: 'Adeleke',
      email: 's.adeleke@buildos.ng',
      phone: '+2348067890006',
      dateHired: new Date('2019-09-15'),
      status: EmployeeStatus.active,
      employmentType: EmploymentType.FullTime,
      projectCount: 0,
      projects: [],
      departmentId: deptRecords.get('Finance')?.id,
    },
    {
      firstName: 'Ngozi',
      lastName: 'Okafor',
      email: 'n.okafor@buildos.ng',
      phone: '+2348045678004',
      dateHired: new Date('2020-05-20'),
      status: EmployeeStatus.active,
      employmentType: EmploymentType.FullTime,
      projectCount: 0,
      projects: [],
      departmentId: deptRecords.get('Human Resources')?.id,
    },
    {
      firstName: 'Musa',
      lastName: 'Ibrahim',
      email: 'm.ibrahim@buildos.ng',
      phone: '+2348034567003',
      dateHired: new Date('2023-01-10'),
      status: EmployeeStatus.active,
      employmentType: EmploymentType.FullTime,
      projectCount: 1,
      projects: ['Industrial Warehouse'],
      departmentId: deptRecords.get('Procurement')?.id,
    },
    {
      firstName: 'Kemi',
      lastName: 'Adeyemi',
      email: 'k.adeyemi@buildos.ng',
      phone: '+2348112345011',
      dateHired: new Date('2021-02-15'),
      status: EmployeeStatus.active,
      employmentType: EmploymentType.FullTime,
      projectCount: 0,
      projects: [],
      departmentId: deptRecords.get('Administration')?.id,
    },
  ];

  const employeeRecords = new Map<string, { id: string }>();
  for (const e of employees) {
    const rec = await prisma.employee.upsert({
      where: { email: e.email },
      update: e,
      create: e,
    });
    employeeRecords.set(`${e.firstName} ${e.lastName}`, { id: rec.id });
  }

  const engineeringHead = employeeRecords.get('Chukwudi Eze');
  if (engineeringHead) {
    await prisma.department.update({
      where: { id: deptRecords.get('Engineering')!.id },
      data: { headId: engineeringHead.id },
    });
  }

  const projects = [
    {
      id: 'lekki-tower-a',
      name: 'Lekki Tower A',
      client: 'Orbit Developments',
      location: 'Lekki Phase 1',
      state: 'Lagos',
      city: 'Lagos',
      status: ProjectStatus.Active,
      type: ProjectType.Commercial,
      budget: 12_500_000,
      spent: 8_125_000,
      progress: 65,
      startDate: new Date('2025-01-15'),
      endDate: new Date('2026-12-31'),
      manager: 'Amaka Osei',
      teamSize: 24,
    },
    {
      id: 'riverside-residential',
      name: 'Riverside Residential',
      client: 'ClearWater Properties',
      location: 'Trans-Amadi',
      state: 'Rivers',
      city: 'Port Harcourt',
      status: ProjectStatus.Active,
      type: ProjectType.Residential,
      budget: 8_200_000,
      spent: 3_444_000,
      progress: 42,
      startDate: new Date('2025-03-01'),
      endDate: new Date('2026-09-30'),
      manager: 'Chukwudi Eze',
      teamSize: 18,
    },
    {
      id: 'industrial-warehouse',
      name: 'Industrial Warehouse',
      client: 'Dangote Logistics',
      location: 'Apapa',
      state: 'Lagos',
      city: 'Lagos',
      status: ProjectStatus.Planning,
      type: ProjectType.Industrial,
      budget: 5_800_000,
      spent: 870_000,
      progress: 15,
      startDate: new Date('2026-02-01'),
      endDate: new Date('2027-01-31'),
      manager: 'Musa Ibrahim',
      teamSize: 12,
    },
  ];

  const projectRecords = new Map<string, { id: string }>();
  for (const p of projects) {
    const rec = await prisma.project.create({ data: p });
    projectRecords.set(p.name, { id: rec.id });
  }

  const leaveTypes = [
    { name: 'Annual Leave', daysAllowed: 21, carryOver: true, maxCarryOver: 5, paid: true, approvalsRequired: 1, color: '#3B82F6', gender: 'All' },
    { name: 'Sick Leave', daysAllowed: 14, carryOver: false, maxCarryOver: 0, paid: true, approvalsRequired: 1, color: '#F59E0B', gender: 'All' },
    { name: 'Maternity Leave', daysAllowed: 90, carryOver: false, maxCarryOver: 0, paid: true, approvalsRequired: 2, color: '#EC4899', gender: 'Female' },
  ];

  const leaveTypeRecords = new Map<string, { id: string }>();
  for (const lt of leaveTypes) {
    const rec = await prisma.leaveType.create({ data: lt });
    leaveTypeRecords.set(lt.name, { id: rec.id });
  }

  const claimTypes = [
    { name: 'Medical', description: 'Medical reimbursement', isProjectBased: false },
    { name: 'Travel', description: 'Business travel claims', isProjectBased: true },
    { name: 'Professional Development', description: 'Training and certifications', isProjectBased: false },
  ];

  const claimTypeRecords = new Map<string, { id: string }>();
  for (const ct of claimTypes) {
    const rec = await prisma.claimType.create({ data: ct });
    claimTypeRecords.set(ct.name, { id: rec.id });
  }

  await prisma.leaveRequest.create({
    data: {
      refId: 'LV-2026-001',
      employeeId: employeeRecords.get('Chukwudi Eze')!.id,
      leaveTypeId: leaveTypeRecords.get('Annual Leave')!.id,
      days: 5,
      startDate: new Date('2026-06-02'),
      endDate: new Date('2026-06-06'),
      status: LeaveStatus.approved,
      approvedBy: 'Ngozi Okafor',
      approvedAt: new Date('2026-05-30'),
      notes: 'Family vacation',
    },
  });

  await prisma.claim.create({
    data: {
      amount: 45_000,
      description: 'Hospital bill reimbursement',
      date: new Date('2026-04-11'),
      status: ClaimStatus.UnderReview,
      employeeId: employeeRecords.get('Kemi Adeyemi')!.id,
      claimTypeId: claimTypeRecords.get('Medical')!.id,
    },
  });

  const supplier = await prisma.supplier.create({
    data: {
      name: 'Dangote Cement PLC',
      contactPerson: 'Aliko Dangote Jr',
      phone: '+2348011110001',
      email: 'supplies@dangote-cement.com',
      city: 'Lagos',
      categories: ['Concrete', 'Aggregates'],
      rating: 4.8,
      onTimeDeliveryRate: 96,
      rejectRate: 1.2,
      totalSpend: 12_500_000,
      lastOrder: new Date('2026-04-10'),
      status: 'active',
      notes: 'Preferred cement supplier',
      materials: {
        create: [
          { name: 'OPC Cement', unit: 'bags', lastPrice: 8500 },
          { name: 'Ready Mix Concrete', unit: 'm3', lastPrice: 45000 },
        ],
      },
    },
  });

  await prisma.purchaseOrder.create({
    data: {
      id: 'PO-0027',
      supplierId: supplier.id,
      prRef: 'PR-2026-0041',
      mrRef: 'MR-2026-0039',
      status: POStatus.partially_received,
      paymentStatus: POPaymentStatus.confirmation_requested,
      sentToFinance: true,
      financeRef: 'FIN-2026-0112',
      createdBy: 'Musa Ibrahim',
      expectedDate: new Date('2026-04-20'),
      totalValue: 4_690_000,
      receivedValue: 3_100_000,
      items: {
        create: [
          { material: 'OPC Cement', qty: 500, unit: 'bags', unitCost: 8500, received: 300 },
          { material: 'Sharp Sand', qty: 20, unit: 'tonnes', unitCost: 22000, received: 20 },
        ],
      },
    },
  });

  await prisma.expense.create({
    data: {
      id: 'EXP-0051',
      category: 'Materials',
      amount: 245_000,
      description: 'Cement and steel',
      createdBy: 'Chukwudi Eze',
      date: new Date('2026-04-12'),
      status: ExpenseStatus.Submitted,
      projectId: projectRecords.get('Lekki Tower A')!.id,
    },
  });

  await prisma.income.create({
    data: {
      id: 'INC-0021',
      source: 'Contract Milestone',
      amount: 1_250_000,
      description: 'Phase 2 completion milestone',
      date: new Date('2026-04-12'),
      status: IncomeStatus.Received,
      projectId: projectRecords.get('Lekki Tower A')!.id,
    },
  });

  await prisma.budget.create({
    data: {
      id: 'BUD-001',
      name: 'Lekki Tower A',
      scope: BudgetScope.Project,
      totalBudget: 12_500_000,
      spent: 8_125_000,
      committed: 1_200_000,
      period: 'FY2026',
      status: BudgetStatus.OnTrack,
      projectId: projectRecords.get('Lekki Tower A')!.id,
    },
  });

  await prisma.payment.create({
    data: {
      id: 'PAY-0041',
      type: PaymentType.Contractor,
      reference: 'EXP-0051',
      recipient: 'Dangote Cement PLC',
      amount: 620_000,
      method: 'Bank Transfer',
      bank: 'Access Bank',
      date: new Date('2026-04-12'),
      status: PaymentStatus.PaymentCompleted,
      completedAt: new Date('2026-04-13T09:14:00'),
    },
  });

  const store = await prisma.store.create({
    data: {
      name: 'General Store',
      type: 'General',
      manager: 'Musa Ibrahim',
      location: 'Lagos HQ',
    },
  });

  await prisma.material.create({
    data: {
      name: 'OPC Cement',
      category: 'Concrete',
      unit: 'bags',
      totalQty: 1200,
      availableQty: 900,
      reservedQty: 300,
      unitCost: 8500,
      reorderLevel: 200,
      materialType: 'Consumable',
      allocationStatus: 'Available',
    },
  });

  await prisma.storeItem.create({
    data: {
      storeId: store.id,
      materialName: 'OPC Cement',
      category: 'Concrete',
      unit: 'bags',
      qty: 900,
      reorderLevel: 200,
      unitCost: 8500,
      lastReceived: new Date('2026-04-10'),
      bin: 'A-12',
    },
  });

  await prisma.cluster.createMany({
    data: [
      { name: 'Lagos Cluster', description: 'Projects in Lagos region' },
      { name: 'Abuja Cluster', description: 'Projects in Abuja / FCT region' },
      { name: 'Port Harcourt Cluster', description: 'Projects in Rivers region' },
      { name: 'Kano Cluster', description: 'Projects in Kano region' },
    ],
    skipDuplicates: true,
  });

  await prisma.equipment.createMany({
    data: [
      { name: 'Excavator (20 ton)', category: 'Earthwork', defaultInternalCostPerDay: 120000, status: 'Available' },
      { name: 'Bulldozer D6', category: 'Earthwork', defaultInternalCostPerDay: 180000, status: 'Assigned' },
      { name: 'Concrete Mixer (1m³)', category: 'Concreting', defaultInternalCostPerDay: 45000, status: 'Available' },
      { name: 'Concrete Pump', category: 'Concreting', defaultInternalCostPerDay: 95000, status: 'Available' },
      { name: 'Tower Crane (50m)', category: 'Lifting', defaultInternalCostPerDay: 250000, status: 'Assigned' },
      { name: 'Mobile Crane (25 ton)', category: 'Lifting', defaultInternalCostPerDay: 180000, status: 'Available' },
      { name: 'Generator (100 KVA)', category: 'Generators / Power', defaultInternalCostPerDay: 35000, status: 'Available' },
      { name: 'Dump Truck (20 ton)', category: 'Transport', defaultInternalCostPerDay: 75000, status: 'Available' },
    ],
  });

  await prisma.materialRequest.create({
    data: {
      reference: 'MR-2026-0039',
      materialName: 'OPC Cement',
      unit: 'bags',
      qty: 100,
      storeName: 'General Store',
      storeId: store.id,
      projectName: 'Lekki Tower A',
      projectId: projectRecords.get('Lekki Tower A')!.id,
      purpose: 'Concrete casting',
      priority: 'Normal',
      status: 'Pending',
      requestedBy: 'Chukwudi Eze',
    },
  });

  await prisma.purchaseRequest.create({
    data: {
      prRef: 'PR-2026-0041',
      title: 'Cement supply for Lekki Tower A',
      projectId: projectRecords.get('Lekki Tower A')!.id,
      projectName: 'Lekki Tower A',
      status: 'Approved',
      priority: 'Normal',
      requestedBy: 'Musa Ibrahim',
      items: [{ material: 'OPC Cement', qty: 500, unit: 'bags' }],
      notes: 'Urgent replenishment for slab works',
    },
  });

  await prisma.chartAccount.createMany({
    data: [
      { code: '1000', name: 'Cash and Bank', type: 'Asset', category: 'Current Asset', balance: 0 },
      { code: '2000', name: 'Accounts Payable', type: 'Liability', category: 'Current Liability', balance: 0 },
      { code: '4000', name: 'Project Revenue', type: 'Income', category: 'Operating Income', balance: 0 },
    ],
  });

  const report = await prisma.reportDefinition.create({
    data: {
      name: 'Project Financial Summary',
      type: 'financial',
      module: 'finance',
      description: 'Summary of budget, income, and expense by project',
      isScheduled: false,
      createdBy: 'system',
    },
  });

  await prisma.reportRun.create({
    data: {
      reportId: report.id,
      status: 'completed',
      startedAt: new Date('2026-06-01T09:00:00'),
      completedAt: new Date('2026-06-01T09:00:30'),
      outputUrl: '/reports/project-financial-summary-20260601.pdf',
    },
  });

  await prisma.appRole.create({
    data: {
      name: 'Admin',
      description: 'System administrator with unrestricted access',
      isSuper: true,
      appScope: ['admin', 'finance', 'hr', 'procurement', 'construction', 'ess', 'storefront'],
    },
  });

  // ─────────────── CONSTRUCTION MODULE SEED ───────────────
  const cProjectId = projectRecords.get('Lekki Tower A')!.id;
  const cProjectId2 = projectRecords.get('Riverside Residential')!.id;

  await prisma.constructionIssue.createMany({
    data: [
      {
        projectId: cProjectId, issueNumber: 'ISS-001', dateRaised: '2026-05-12', raisedBy: 'Amaka Osei',
        title: 'Rebar delivery delayed at Block C', description: 'Y16 rebars not delivered on schedule, blocking column casting.',
        impactTypes: ['Schedule', 'Cost'], rootCause: 'Supplier logistics breakdown', targetDate: '2026-06-20',
        actions: 'Escalated to procurement; alternate supplier sourced', ownerId: 'Amaka Osei', status: 'In Progress',
      },
      {
        projectId: cProjectId, issueNumber: 'ISS-002', dateRaised: '2026-05-28', raisedBy: 'Tunde Bello',
        title: 'Waterproofing failure in basement', description: 'Seepage observed after rains in basement level 2.',
        impactTypes: ['Quality'], rootCause: 'Inadequate membrane lap', targetDate: '2026-06-15',
        actions: 'Re-application scheduled with QA hold point', ownerId: 'Tunde Bello', status: 'Open',
      },
      {
        projectId: cProjectId2, issueNumber: 'ISS-003', dateRaised: '2026-06-01', raisedBy: 'Chukwudi Eze',
        title: 'Access road flooding', description: 'Site access road impassable during heavy rain.',
        impactTypes: ['Schedule'], rootCause: 'Poor drainage', targetDate: '2026-06-25',
        actions: 'Temporary culvert installation', ownerId: 'Chukwudi Eze', status: 'Open',
      },
    ],
  });

  await prisma.changeRequest.createMany({
    data: [
      {
        projectId: cProjectId, crNumber: 'CR-001', dateRaised: '2026-05-10', raisedBy: 'Orbit Developments',
        changeTypes: ['Scope', 'Cost'], description: 'Add rooftop solar array to Tower A',
        reason: 'Client sustainability requirement', scopeImpact: 'Additional MEP works on roof level',
        scheduleImpactDays: 21, costImpact: 145_000, recommendedAction: 'Approve with revised milestone',
        status: 'Proposed',
      },
      {
        projectId: cProjectId, crNumber: 'CR-002', dateRaised: '2026-04-22', raisedBy: 'Amaka Osei',
        changeTypes: ['Schedule'], description: 'Resequence facade installation', reason: 'Crane availability',
        scheduleImpactDays: 7, costImpact: 0, recommendedAction: 'Approve', status: 'Approved',
        approverId: 'Amaka Osei', approvedAt: '2026-04-25', approvalNotes: 'No cost impact, approved.',
      },
    ],
  });

  await prisma.projectDelay.createMany({
    data: [
      {
        projectId: cProjectId, taskId: 'T-120', taskName: 'Column casting Block C', stagePhase: 'Superstructure',
        plannedEndDate: '2026-05-18', daysDelayed: 9, rootCause: 'Rebar delivery delay',
        recoveryPlan: 'Double-shift casting', recoveryActions: 'Extra crew mobilized', ownerId: 'Amaka Osei',
        revisedEndDate: '2026-05-27', status: 'In Progress',
      },
      {
        projectId: cProjectId2, taskId: 'T-210', taskName: 'Site clearance', stagePhase: 'Enabling Works',
        plannedEndDate: '2026-05-30', daysDelayed: 5, rootCause: 'Access road flooding',
        recoveryPlan: 'Temporary access route', recoveryActions: 'Culvert installed', ownerId: 'Chukwudi Eze',
        revisedEndDate: '2026-06-04', status: 'Open',
      },
    ],
  });

  await prisma.stakeholder.createMany({
    data: [
      { projectId: cProjectId, name: 'Orbit Developments', organization: 'Orbit Developments Ltd', role: 'Client', email: 'pm@orbit.ng', phone: '+234 801 000 0001', influenceLevel: 'High', impactLevel: 'High', notes: 'Primary client and funder.' },
      { projectId: cProjectId, name: 'Lagos State Building Control', organization: 'LASBCA', role: 'Regulator', email: 'info@lasbca.gov.ng', influenceLevel: 'High', impactLevel: 'Medium', notes: 'Statutory inspections.' },
      { projectId: cProjectId, name: 'Amaka Osei', organization: 'BuildOS', role: 'Project Manager', email: 'amaka@buildos.ng', phone: '+234 802 000 0002', influenceLevel: 'High', impactLevel: 'High', notes: '' },
      { projectId: cProjectId2, name: 'ClearWater Properties', organization: 'ClearWater Properties', role: 'Client', email: 'contact@clearwater.ng', influenceLevel: 'High', impactLevel: 'High', notes: '' },
    ],
  });

  await prisma.qualityNcr.createMany({
    data: [
      { projectId: cProjectId, ncrId: 'NCR-001', date: '2026-05-20', description: 'Concrete cube test below Grade 30 at L4 slab', taskId: 'T-145', raisedBy: 'QA Inspector', correctiveAction: 'Core test and structural review', responsiblePerson: 'Tunde Bello', targetCloseDate: '2026-06-10', status: 'Open' },
      { projectId: cProjectId, ncrId: 'NCR-002', date: '2026-04-30', description: 'Misaligned formwork on column C12', taskId: 'T-130', raisedBy: 'Site Engineer', correctiveAction: 'Realign and re-inspect', responsiblePerson: 'Site Engineer', targetCloseDate: '2026-05-05', status: 'Closed' },
    ],
  });

  await prisma.hseRecord.createMany({
    data: [
      { projectId: cProjectId, staffMember: 'Amaka Osei', competency: 'Site Safety Manager', dateObtained: '2024-01-15', expiryDate: '2027-01-15', status: 'Valid' },
      { projectId: cProjectId, staffMember: 'Tunde Bello', competency: 'Scaffold Inspection', dateObtained: '2023-06-10', expiryDate: '2026-06-10', status: 'Expiring' },
      { projectId: cProjectId, staffMember: 'Site Crew Lead', competency: 'First Aid', dateObtained: '2022-03-01', expiryDate: '2025-03-01', status: 'Expired' },
    ],
  });

  await prisma.communicationLog.createMany({
    data: [
      { projectId: cProjectId, date: '2026-06-01', from: 'Amaka Osei', to: 'Orbit Developments', channel: 'email', subject: 'Monthly progress report - May', summary: 'Shared progress, RAG status, and upcoming milestones.', status: 'sent', createdBy: 'Amaka Osei' },
      { projectId: cProjectId, date: '2026-06-05', from: 'LASBCA', to: 'Amaka Osei', channel: 'meeting', subject: 'Structural inspection scheduling', summary: 'Agreed inspection date for L5 slab.', followUpDate: '2026-06-12', status: 'sent', createdBy: 'Amaka Osei' },
    ],
  });

  const alloc1 = await prisma.fundingAllocation.create({
    data: { projectId: cProjectId, source: 'Orbit Developments', totalAllocated: 12_500_000, dateAllocated: '2025-01-10', reference: 'FA-LTA-001', notes: 'Total project funding facility.' },
  });
  const alloc2 = await prisma.fundingAllocation.create({
    data: { projectId: cProjectId2, source: 'ClearWater Properties', totalAllocated: 8_200_000, dateAllocated: '2025-02-20', reference: 'FA-RR-001', notes: '' },
  });

  await prisma.fundingRelease.createMany({
    data: [
      { allocationId: alloc1.id, projectId: cProjectId, amount: 4_000_000, dateReleased: '2025-02-01', reference: 'FR-001', releasedTo: 'Project Account' },
      { allocationId: alloc1.id, projectId: cProjectId, amount: 4_125_000, dateReleased: '2025-08-01', reference: 'FR-002', releasedTo: 'Project Account' },
      { allocationId: alloc2.id, projectId: cProjectId2, amount: 3_444_000, dateReleased: '2025-04-01', reference: 'FR-003', releasedTo: 'Project Account' },
    ],
  });

  await prisma.disbursement.createMany({
    data: [
      { projectId: cProjectId, amount: 2_500_000, date: '2025-03-15', source: 'finance', reference: 'DSB-001', notes: 'Rebar and concrete procurement', allocatedTo: ['Materials'] },
      { projectId: cProjectId, amount: 1_800_000, date: '2025-05-20', source: 'finance', reference: 'DSB-002', notes: 'Subcontractor mobilization', allocatedTo: ['Subcontractors'] },
      { projectId: cProjectId, amount: 950_000, date: '2025-07-10', source: 'finance', reference: 'DSB-003', notes: 'Equipment hire', allocatedTo: ['Equipment'] },
      { projectId: cProjectId2, amount: 1_200_000, date: '2025-05-05', source: 'finance', reference: 'DSB-004', notes: 'Site clearance and enabling works', allocatedTo: ['Labour'] },
    ],
  });

  await prisma.dailyReport.createMany({
    data: [
      {
        projectId: cProjectId, reportDate: '2026-06-10', submittedBy: 'Amaka Osei', submittedAt: '2026-06-10T17:30:00Z',
        status: 'submitted', weather: { am: 'Sunny', pm: 'Cloudy' },
        manpower: [{ trade: 'Masons', skilledCount: 12, unskilledCount: 8, mandays: 20 }, { trade: 'Steel Fixers', skilledCount: 6, unskilledCount: 4, mandays: 10 }],
        equipment: [{ equipmentType: 'Tower Crane', inUse: true, maintenanceStatus: 'Usable' }],
        materials: [{ materialType: 'Grade 30 Concrete', unit: 'm³', receivedQty: 45 }],
        scope: [{ todayPlanned: 'Cast L5 slab section A', todayActual: 'Completed 80%', pctActual: 80 }],
        expenses: [{ description: 'Diesel', amount: 85_000 }],
        communicationLog: [],
      },
      {
        projectId: cProjectId, reportDate: '2026-06-11', submittedBy: 'Amaka Osei', submittedAt: '2026-06-11T17:45:00Z',
        status: 'submitted', weather: { am: 'Cloudy', pm: 'Rainy' },
        manpower: [{ trade: 'Masons', skilledCount: 10, unskilledCount: 6, mandays: 16 }],
        equipment: [{ equipmentType: 'Concrete Pump', inUse: true, maintenanceStatus: 'Usable' }],
        materials: [{ materialType: 'Y16 Rebar', unit: 'tonnes', receivedQty: 8 }],
        scope: [{ todayPlanned: 'Complete L5 slab', todayActual: 'Rain delay, 40%', pctActual: 40 }],
        expenses: [],
        communicationLog: [],
      },
    ],
  });

  const rootFolder = await prisma.documentFolder.create({
    data: { projectId: cProjectId, name: 'Project Documents', createdBy: 'Amaka Osei' },
  });
  const drawingsFolder = await prisma.documentFolder.create({
    data: { projectId: cProjectId, parentFolderId: rootFolder.id, name: 'Drawings', createdBy: 'Amaka Osei' },
  });
  const contractsFolder = await prisma.documentFolder.create({
    data: { projectId: cProjectId, parentFolderId: rootFolder.id, name: 'Contracts', createdBy: 'Amaka Osei' },
  });

  await prisma.documentFile.createMany({
    data: [
      { folderId: drawingsFolder.id, projectId: cProjectId, name: 'Structural-GA-L5.pdf', fileUrl: '', version: 2, uploadedBy: 'Tunde Bello', uploadedAt: '2026-05-15' },
      { folderId: drawingsFolder.id, projectId: cProjectId, name: 'Architectural-Floorplan.pdf', fileUrl: '', version: 1, uploadedBy: 'Amaka Osei', uploadedAt: '2026-04-10' },
      { folderId: contractsFolder.id, projectId: cProjectId, name: 'Main-Contract-Signed.pdf', fileUrl: '', version: 1, uploadedBy: 'Amaka Osei', uploadedAt: '2025-01-12' },
    ],
  });

  await prisma.earnedValueRecord.createMany({
    data: [
      { projectId: cProjectId, period: '2026-01', plannedValue: 8_000_000, earnedValue: 7_400_000, actualCost: 7_900_000 },
      { projectId: cProjectId, period: '2026-02', plannedValue: 16_000_000, earnedValue: 15_100_000, actualCost: 16_200_000 },
      { projectId: cProjectId, period: '2026-03', plannedValue: 24_000_000, earnedValue: 22_300_000, actualCost: 24_900_000 },
      { projectId: cProjectId, period: '2026-04', plannedValue: 32_000_000, earnedValue: 29_800_000, actualCost: 33_100_000 },
      { projectId: cProjectId2, period: '2026-01', plannedValue: 5_000_000, earnedValue: 4_900_000, actualCost: 5_050_000 },
      { projectId: cProjectId2, period: '2026-02', plannedValue: 10_000_000, earnedValue: 9_600_000, actualCost: 10_200_000 },
    ],
  });

  await prisma.constructionBaseline.create({
    data: {
      projectId: cProjectId, version: 1, label: 'Baseline v1 (Contract)', lockedAt: '2025-01-15T00:00:00Z', lockedBy: 'Amaka Osei',
      taskSnapshots: [
        { taskId: 'T-001', name: 'Substructure', plannedStart: '2025-02-01', plannedEnd: '2025-04-30' },
        { taskId: 'T-002', name: 'Superstructure', plannedStart: '2025-05-01', plannedEnd: '2025-11-30' },
      ],
    },
  });

  await prisma.constructionCalendar.create({
    data: {
      projectId: cProjectId, workingDays: [1, 2, 3, 4, 5, 6], workingHoursStart: '08:00', workingHoursEnd: '17:00',
      holidays: [{ date: '2026-10-01', name: 'Independence Day' }, { date: '2026-12-25', name: 'Christmas' }],
      shutdowns: [{ start: '2026-12-24', end: '2027-01-02', reason: 'Year-end break' }],
    },
  });

  await prisma.constructionSetting.upsert({
    where: { scope: 'global' },
    update: {},
    create: {
      scope: 'global',
      scheduleLevels: [
        { level: 1, name: 'Project', color: '#1e40af' },
        { level: 2, name: 'Phase', color: '#0e7490' },
        { level: 3, name: 'Work Package', color: '#15803d' },
        { level: 4, name: 'Activity', color: '#a16207' },
      ],
      weatherConfig: [
        { condition: 'Sunny', impact: 'none' },
        { condition: 'Rainy', impact: 'moderate' },
        { condition: 'Storm', impact: 'severe' },
      ],
      projectTypes: [
        { sector: 'Residential', categories: ['Apartment', 'Villa', 'Estate'] },
        { sector: 'Commercial', categories: ['Office', 'Retail', 'Mixed-Use'] },
        { sector: 'Infrastructure', categories: ['Road', 'Bridge', 'Utilities'] },
      ],
    },
  });

  const wbsParent = await prisma.constructionTask.create({
    data: {
      projectId: cProjectId, level: 1, name: 'Superstructure', wbsNumber: '1',
      plannedStart: '2025-05-01', plannedEnd: '2025-11-30', plannedDuration: 214,
      percentComplete: 65, lagDays: 0, subVendorIds: [], ragStatus: 'amber', ragOverride: false,
      isMilestone: false, isCritical: true,
    },
  });
  await prisma.constructionTask.createMany({
    data: [
      {
        projectId: cProjectId, parentTaskId: wbsParent.id, level: 2, name: 'Columns L1-L5', wbsNumber: '1.1',
        plannedStart: '2025-05-01', plannedEnd: '2025-07-15', plannedDuration: 75,
        percentComplete: 90, lagDays: 0, subVendorIds: [], ragStatus: 'green', ragOverride: false,
        isMilestone: false, isCritical: true,
      },
      {
        projectId: cProjectId, parentTaskId: wbsParent.id, level: 2, name: 'Slabs L1-L5', wbsNumber: '1.2',
        plannedStart: '2025-07-16', plannedEnd: '2025-09-30', plannedDuration: 76,
        percentComplete: 55, lagDays: 0, subVendorIds: [], ragStatus: 'amber', ragOverride: false,
        isMilestone: false, isCritical: false,
      },
      {
        projectId: cProjectId, parentTaskId: wbsParent.id, level: 2, name: 'Topping Out', wbsNumber: '1.3',
        plannedStart: '2025-11-28', plannedEnd: '2025-11-30', plannedDuration: 2,
        percentComplete: 0, lagDays: 0, subVendorIds: [], ragStatus: 'green', ragOverride: false,
        isMilestone: true, isCritical: true,
      },
    ],
  });

  await prisma.humanResource.createMany({
    data: [
      { projectId: cProjectId, source: 'vendor', name: 'Sahara Steel Fixers Ltd', trade: 'Steel Fixing', contractType: 'subcontract', isNominated: false, contractSum: 12_000_000, skilledCount: 6, unskilledCount: 4, subVendorIds: [], assignedWorkPackages: ['1.1'], blockAssignment: 'Block A', mandaysEstimate: 240 },
      { projectId: cProjectId, source: 'contractor', name: 'In-house Masonry Crew', trade: 'Masonry', payRate: 6_500, payRateUnit: 'daily', skilledCount: 12, unskilledCount: 8, subVendorIds: [], assignedWorkPackages: ['1.2'], blockAssignment: 'Block A', mandaysEstimate: 400 },
      { projectId: cProjectId, source: 'staff', name: 'James Okoro', trade: 'Site Engineer', employeeId: 'EMP-1021', dailyRate: 18_000, status: 'active', subVendorIds: [], assignedWorkPackages: ['1'], blockAssignment: 'All', mandaysEstimate: 214 },
    ],
  });

  await prisma.materialResource.createMany({
    data: [
      { projectId: cProjectId, name: 'Grade 30 Concrete', category: 'Concrete', unit: 'm³', estimatedQty: 1_200, estimatedUnitCost: 45_000, totalEstimatedCost: 54_000_000, procurementSource: 'supplier', supplierId: 'SUP-001' },
      { projectId: cProjectId, name: 'Y16 Rebar', category: 'Steel', unit: 'tonnes', estimatedQty: 85, estimatedUnitCost: 850_000, totalEstimatedCost: 72_250_000, procurementSource: 'supplier', supplierId: 'SUP-002' },
      { projectId: cProjectId, name: 'Formwork Plywood', category: 'Formwork', unit: 'sheets', estimatedQty: 600, estimatedUnitCost: 12_000, totalEstimatedCost: 7_200_000, procurementSource: 'supplier' },
    ],
  });

  await prisma.equipmentResource.createMany({
    data: [
      { projectId: cProjectId, name: 'Tower Crane TC-01', category: 'Lifting', ownership: 'rented', rentalCostPerDay: 180_000, rentalSupplier: 'CraneCo NG', estimatedDays: 214, totalEstimatedCost: 38_520_000, status: 'active' },
      { projectId: cProjectId, name: 'Concrete Pump CP-01', category: 'Concreting', ownership: 'rented', rentalCostPerDay: 95_000, rentalSupplier: 'PumpRent Ltd', estimatedDays: 120, totalEstimatedCost: 11_400_000, status: 'active' },
      { projectId: cProjectId, name: 'Excavator EX-01', category: 'Earthworks', ownership: 'owned', internalCostPerDay: 40_000, estimatedDays: 60, totalEstimatedCost: 2_400_000, status: 'idle' },
    ],
  });

  console.log('Construction module seeded.');

  const adminEmail = (process.env.SEED_ADMIN_EMAIL || 'admin@buildos.ng').trim().toLowerCase();
  const adminName = (process.env.SEED_ADMIN_NAME || 'Admin User').trim();
  const adminPassword = process.env.SEED_ADMIN_PASSWORD || 'BuildOS@2025';
  const adminAssignedApps = ['construction', 'finance', 'hr', 'procurement', 'admin', 'ess', 'storefront'];
  const hashedPassword = await bcrypt.hash(adminPassword, 10);

  await prisma.user.upsert({
    where: { email: adminEmail },
    update: {
      name: adminName,
      role: 'admin',
      assignedApps: adminAssignedApps,
      password: hashedPassword,
      status: 'Active',
    },
    create: {
      email: adminEmail,
      password: hashedPassword,
      name: adminName,
      role: 'admin',
      assignedApps: adminAssignedApps,
      status: 'Active',
    },
  });

  console.log('Seed completed successfully!');
  console.log(`Admin user seeded: ${adminEmail}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
