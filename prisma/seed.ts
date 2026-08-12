import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import * as argon2 from 'argon2';

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('Starting seed...');

  // 1. Create Roles (System Roles)
  console.log('Seeding Roles...');
  const adminRole = await prisma.role.create({
    data: { name: 'ADMIN', description: 'System Administrator', isSystemRole: true },
  });
  const memberRole = await prisma.role.create({
    data: { name: 'TEAM_MEMBER', description: 'Standard Team Member', isSystemRole: true },
  });
  const viewerRole = await prisma.role.create({
    data: { name: 'PROJECT_VIEWER', description: 'Project Viewer (Read Only)', isSystemRole: true },
  });

  // 2. Create Admin User
  console.log('Seeding Users...');
  const passwordHash = await argon2.hash('password123'); // All users will have 'password123'
  const admin = await prisma.user.create({
    data: {
      email: 'admin@resourcedrop.local',
      username: 'admin',
      passwordHash,
      accountStatus: 'ACTIVE',
      roleId: adminRole.id,
    },
  });

  // Create some standard users
  const members = [];
  for (let i = 1; i <= 4; i++) {
    const member = await prisma.user.create({
      data: {
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
  const project1 = await prisma.project.create({
    data: {
      name: 'Alpha Project',
      description: 'The first flagship project.',
      createdBy: admin.id,
      status: 'ACTIVE',
      members: {
        create: [
          { userId: admin.id, projectRoleId: adminRole.id },
          { userId: members[0].id, projectRoleId: memberRole.id },
          { userId: members[1].id, projectRoleId: viewerRole.id },
        ],
      },
      documents: {
        create: [
          {
            fileName: 'alpha_architecture.pdf',
            fileUrl: 'projects/alpha/alpha_architecture.pdf',
            uploadedBy: admin.id,
          },
        ],
      },
    },
  });

  const project2 = await prisma.project.create({
    data: {
      name: 'Beta Project',
      description: 'A top secret beta initiative.',
      createdBy: admin.id,
      status: 'PLANNING',
      members: {
        create: [
          { userId: members[2].id, projectRoleId: memberRole.id },
          { userId: members[3].id, projectRoleId: memberRole.id },
        ],
      },
    },
  });

  // 4. Create some pending Invitations
  console.log('Seeding Invitations...');
  await prisma.invitation.create({
    data: {
      email: 'pending.invite@resourcedrop.local',
      token: 'mock-token-1234567890',
      roleId: memberRole.id,
      invitedBy: admin.id,
      status: 'PENDING',
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
    },
  });

  await prisma.invitation.create({
    data: {
      email: 'expired.invite@resourcedrop.local',
      token: 'mock-token-0987654321',
      roleId: viewerRole.id,
      invitedBy: admin.id,
      status: 'PENDING',
      expiresAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
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
