import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import * as argon2 from 'argon2';

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('Starting seed...');

  // 1. Create Roles (System Roles)
  console.log('Seeding Roles...');
  const adminRole = await prisma.role.upsert({
    where: { name: 'ADMIN' },
    update: {},
    create: { name: 'ADMIN', description: 'System Administrator', isSystemRole: true },
  });
  const memberRole = await prisma.role.upsert({
    where: { name: 'TEAM_MEMBER' },
    update: {},
    create: { name: 'TEAM_MEMBER', description: 'Standard Team Member', isSystemRole: true },
  });
  const viewerRole = await prisma.role.upsert({
    where: { name: 'PROJECT_VIEWER' },
    update: {},
    create: { name: 'PROJECT_VIEWER', description: 'Project Viewer (Read Only)', isSystemRole: true },
  });

  // 2. Create Admin User
  console.log('Seeding Users...');
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

  // Create some standard users
  const members = [];
  for (let i = 1; i <= 9; i++) {
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

  // 3. Create Projects with nested Members & Documents
  console.log('Seeding Projects & Relations...');
  const projects = [];
  const projectStatuses = ['PLANNING', 'ACTIVE', 'COMPLETED', 'ARCHIVED'];
  for (let i = 1; i <= 10; i++) {
    const status = projectStatuses[i % 4];
    const p = await prisma.project.upsert({
      where: { name: `Project ${i}` },
      update: {},
      create: {
        name: `Project ${i}`,
        description: `Description for Project ${i}.`,
        createdBy: admin.id,
        status: status as any,
        members: {
          create: [
            { userId: admin.id, projectRoleId: memberRole.id },
            { userId: members[i % 9].id, projectRoleId: memberRole.id },
            { userId: members[(i + 1) % 9].id, projectRoleId: viewerRole.id },
          ],
        },
      },
    });
    projects.push(p);
  }

  // 4. Create some pending Invitations
  console.log('Seeding Invitations...');
  await prisma.invitation.upsert({
    where: { token: 'mock-token-1234567890' },
    update: {},
    create: {
      email: 'pending.invite@resourcedrop.local',
      token: 'mock-token-1234567890',
      roleId: memberRole.id,
      invitedBy: admin.id,
      status: 'PENDING',
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
    },
  });

  await prisma.invitation.upsert({
    where: { token: 'mock-token-0987654321' },
    update: {},
    create: {
      email: 'expired.invite@resourcedrop.local',
      token: 'mock-token-0987654321',
      roleId: viewerRole.id,
      invitedBy: admin.id,
      status: 'PENDING',
      expiresAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
    },
  });

  // 5. Create Resource Categories and Types
  console.log('Seeding Resource Categories and Types...');
  const categorySourceCode = await prisma.resourceCategory.upsert({
    where: { name: 'Source Code' },
    update: {},
    create: {
      name: 'Source Code',
      description: 'Code repositories and version control',
    }
  });
  const categoryStorage = await prisma.resourceCategory.upsert({
    where: { name: 'Storage' },
    update: {},
    create: {
      name: 'Storage',
      description: 'Data storage and object storage solutions',
    }
  });
  const categoryAccess = await prisma.resourceCategory.upsert({
    where: { name: 'Access' },
    update: {},
    create: {
      name: 'Access',
      description: 'API keys, tokens, and credentials',
    }
  });

  await prisma.resourceType.createMany({
    data: [
      {
        categoryId: categorySourceCode.id,
        name: 'github_repo',
        isCustom: false,
      },
      {
        categoryId: categoryStorage.id,
        name: 'object_storage',
        isCustom: false,
      },
      {
        categoryId: categoryAccess.id,
        name: 'api_key',
        isCustom: false,
      },
      {
        categoryId: categoryStorage.id,
        name: 'database',
        isCustom: false,
      }
    ],
    skipDuplicates: true,
  });

  // 6. Create some Resource Requests
  console.log('Seeding Resource Requests...');
  const resourceTypes = await prisma.resourceType.findMany();
  const requestStatuses = ['PENDING', 'PROVISIONED', 'REJECTED', 'REVOKED'];
  
  for (let i = 1; i <= 10; i++) {
    const status = requestStatuses[i % 4];
    const rType = resourceTypes[i % resourceTypes.length];
    await prisma.resourceRequest.create({
      data: {
        project: { connect: { id: projects[i - 1].id } },
        user: { connect: { id: members[i % 9].id } },
        resourceType: { connect: { id: rType.id } },
        status: status as any,
        parameters: { note: `Parameter for request ${i}` },
      },
    });
  }

  console.log('Seed completed successfully!');
  console.log('Admin Login: admin@resourcedrop.local / password123');
  console.log('Member Logins: member[1-9]@resourcedrop.local / password123');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
