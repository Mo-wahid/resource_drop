import { prisma } from './src/lib/db';

async function main() {
  const result = await prisma.$executeRaw`UPDATE "ResourceRequest" SET status = 'PENDING' WHERE status = 'ACCEPTED'`;
  console.log(`Updated ${result} rows`);
}
main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
