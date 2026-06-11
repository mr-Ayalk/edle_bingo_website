import { prisma } from '../src/lib/db';
import { ensureAppSettings, seedDefaultUsers } from '../src/lib/settings';

async function main() {
  await ensureAppSettings();
  await seedDefaultUsers();
  console.log('Database seeded successfully.');
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
