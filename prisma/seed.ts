import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import * as argon2 from 'argon2';

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('Starting seed...');

  // 1. Create Roles (System Roles)
  const adminRole = await prisma.role.upsert({
    where: { name: 'ADMIN' },
    update: {},
    create: {
      name: 'ADMIN',
      description: 'System Administrator',
      isSystemRole: true,
    },
  });

  const memberRole = await prisma.role.upsert({
    where: { name: 'TEAM_MEMBER' },
    update: {},
    create: {
      name: 'TEAM_MEMBER',
      description: 'Standard Team Member',
      isSystemRole: true,
    },
  });

  await prisma.role.upsert({
    where: { name: 'PROJECT_VIEWER' },
    update: {},
    create: {
      name: 'PROJECT_VIEWER',
      description: 'Project Viewer (Read Only)',
      isSystemRole: true,
    },
  });

  // 2. Create Users
  const passwordHash = await argon2.hash('password123'); // All users will have 'password123'

  const admin = await prisma.user.upsert({
    where: { email: 'admin@resourcedrop.local' },
    update: {},
    create: {
      email: 'admin@resourcedrop.local',
      username: 'admin',
      passwordHash,
      accountStatus: 'ACTIVE',
      roleId: adminRole.id,
    },
  });

  const members = [];
  for (let i = 1; i <= 4; i++) {
    const member = await prisma.user.upsert({
      where: { email: `member${i}@resourcedrop.local` },
      update: {},
      create: {
        email: `member${i}@resourcedrop.local`,
        username: `member${i}`,
        passwordHash,
        accountStatus: 'ACTIVE',
        roleId: memberRole.id,
      },
    });
    members.push(member);
  }

  // 3. Create Projects
  const project1 = await prisma.project.upsert({
    where: { name: 'Alpha Project' },
    update: {},
    create: {
      name: 'Alpha Project',
      description: 'The first flagship project.',
      createdBy: admin.id,
    },
  });

  const project2 = await prisma.project.upsert({
    where: { name: 'Beta Project' },
    update: {},
    create: {
      name: 'Beta Project',
      description: 'A top secret beta initiative.',
      createdBy: admin.id,
    },
  });

  // 4. Assign Members to Projects
  // Project 1: member1 and member2
  await prisma.projectMember.upsert({
    where: { projectId_userId: { projectId: project1.id, userId: members[0].id } },
    update: {},
    create: {
      projectId: project1.id,
      userId: members[0].id,
      projectRoleId: memberRole.id,
    },
  });
  await prisma.projectMember.upsert({
    where: { projectId_userId: { projectId: project1.id, userId: members[1].id } },
    update: {},
    create: {
      projectId: project1.id,
      userId: members[1].id,
      projectRoleId: memberRole.id,
    },
  });

  // Project 2: member3 and member4
  await prisma.projectMember.upsert({
    where: { projectId_userId: { projectId: project2.id, userId: members[2].id } },
    update: {},
    create: {
      projectId: project2.id,
      userId: members[2].id,
      projectRoleId: memberRole.id,
    },
  });
  await prisma.projectMember.upsert({
    where: { projectId_userId: { projectId: project2.id, userId: members[3].id } },
    update: {},
    create: {
      projectId: project2.id,
      userId: members[3].id,
      projectRoleId: memberRole.id,
    },
  });

  console.log('Seed completed successfully!');
  console.log('Admin Login: admin@resourcedrop.local / password123');
  console.log('Member Logins: member[1-4]@resourcedrop.local / password123');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
