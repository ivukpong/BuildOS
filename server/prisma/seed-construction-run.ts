import { PrismaClient } from '@prisma/client';
import { seedConstruction } from './seed-construction';

/**
 * Standalone runner that seeds ONLY the construction module domains, using the
 * projects that already exist in the database. Use this to populate the
 * construction tables without re-running the full seed (which is not idempotent
 * for the base HR/finance data).
 */
const prisma = new PrismaClient();

async function main() {
  console.log('Seeding construction module only...');
  const projects = await prisma.project.findMany({ select: { id: true, name: true } });
  const projectRecords = new Map<string, { id: string }>();
  for (const p of projects) {
    projectRecords.set(p.name, { id: p.id });
  }
  if (!projectRecords.has('Lekki Tower A') || !projectRecords.has('Riverside Residential')) {
    throw new Error('Expected projects "Lekki Tower A" and "Riverside Residential" not found. Run the full seed first.');
  }
  await seedConstruction(prisma, projectRecords);
  console.log('Done.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
