import { PrismaClient } from '@prisma/client';

/**
 * Seeds the construction module domains (issues, change requests, delays,
 * stakeholders, quality, HSE, communications, funding, daily reports, documents,
 * earned value, baselines, calendars, settings, WBS tasks, and resource catalogs).
 *
 * Idempotent-friendly: the construction tables are expected to be empty on first
 * run. Safe to import from both the main seed and a standalone runner.
 */
export async function seedConstruction(
  prisma: PrismaClient,
  projectRecords: Map<string, { id: string }>,
) {
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
      { projectId: cProjectId, source: 'vendor', name: 'Sahara Steel Fixers Ltd', trade: 'Steel Fixing', contractType: 'subcontract', isNominated: false, contractSum: 12_000_000, skilledCount: 6, unskilledCount: 4, assignedWorkPackages: ['1.1'], blockAssignment: 'Block A', mandaysEstimate: 240 },
      { projectId: cProjectId, source: 'contractor', name: 'In-house Masonry Crew', trade: 'Masonry', payRate: 6_500, payRateUnit: 'daily', skilledCount: 12, unskilledCount: 8, assignedWorkPackages: ['1.2'], blockAssignment: 'Block A', mandaysEstimate: 400 },
      { projectId: cProjectId, source: 'staff', name: 'James Okoro', trade: 'Site Engineer', employeeId: 'EMP-1021', dailyRate: 18_000, status: 'active', assignedWorkPackages: ['1'], blockAssignment: 'All', mandaysEstimate: 214 },
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
}
