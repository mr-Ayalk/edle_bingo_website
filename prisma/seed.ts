import { prisma } from '../src/lib/db';
import { ensureAppSettings, seedDefaultUsers } from '../src/lib/settings';

async function main() {
  await ensureAppSettings();
  await seedDefaultUsers();
  console.log('Seed complete. Only missing default users were added; existing data was not changed.');
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
