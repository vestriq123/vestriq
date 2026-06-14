import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Starting seed...");

  // 1. Create Permissions
  const permissionsData = [
    { name: "view:dashboard", description: "Access to user dashboard panel" },
    { name: "view:admin", description: "Access to administrative panel" },
    { name: "manage:users", description: "Create, view, update and delete users" },
    { name: "manage:investments", description: "Modify values and parameters of active user investments" },
    { name: "manage:deposits", description: "Approve or reject incoming deposit funding requests" },
    { name: "manage:withdrawals", description: "Approve or process withdrawal requests" },
    { name: "manage:wallets", description: "Enable, disable or edit wallet destination addresses" },
    { name: "manage:plans", description: "Create and update investment plans" },
  ];

  const permissions: any = {};
  for (const perm of permissionsData) {
    permissions[perm.name] = await prisma.permission.upsert({
      where: { name: perm.name },
      update: {},
      create: perm,
    });
  }
  console.log(`✅ Created ${Object.keys(permissions).length} permissions`);

  // 2. Create Roles
  // Admin Role (has all permissions)
  const adminRole = await prisma.role.upsert({
    where: { name: "ADMIN" },
    update: {
      permissions: {
        set: Object.values(permissions).map((p: any) => ({ id: p.id })),
      },
    },
    create: {
      name: "ADMIN",
      description: "Super Administrator with full portal capability",
      permissions: {
        connect: Object.values(permissions).map((p: any) => ({ id: p.id })),
      },
    },
  });

  // User Role (basic permissions)
  const userRole = await prisma.role.upsert({
    where: { name: "USER" },
    update: {
      permissions: {
        set: [
          { id: permissions["view:dashboard"].id }
        ],
      },
    },
    create: {
      name: "USER",
      description: "Standard registered investor profile",
      permissions: {
        connect: [
          { id: permissions["view:dashboard"].id }
        ],
      },
    },
  });

  console.log("✅ Created ADMIN and USER roles");

  // 3. Create Bootstrap Users
  const salt = await bcrypt.genSalt(10);
  const adminPasswordHash = await bcrypt.hash("vestriqAdmin2026!", salt);
  const userPasswordHash = await bcrypt.hash("vestriqUser2026!", salt);

  const adminUser = await prisma.user.upsert({
    where: { email: "admin@vestriq.com" },
    update: {},
    create: {
      email: "admin@vestriq.com",
      username: "vestriqadmin",
      passwordHash: adminPasswordHash,
      roleId: adminRole.id,
      profile: {
        create: {
          fullName: "Vestriq System Administrator",
        },
      },
    },
  });

  const normalUser = await prisma.user.upsert({
    where: { email: "investor@vestriq.com" },
    update: {},
    create: {
      email: "investor@vestriq.com",
      username: "investorone",
      passwordHash: userPasswordHash,
      roleId: userRole.id,
      profile: {
        create: {
          fullName: "Premium Investor",
        },
      },
    },
  });

  console.log(`✅ Created bootstrap users: ${adminUser.email}, ${normalUser.email}`);

  // 4. Create Investment Plans
  const plans = [
    {
      name: "Standard Alpha",
      description: "Entry-level plan curated for steady diversified holdings. Perfect for beginners.",
      minAmount: 100,
      maxAmount: 4999,
    },
    {
      name: "Premium Growth",
      description: "Dynamic mid-tier portfolio optimization targeted at high-yielding assets.",
      minAmount: 5000,
      maxAmount: 24999,
    },
    {
      name: "Vanguard Select",
      description: "Elite tier private equity fund options custom tailored for high net worth investors.",
      minAmount: 25000,
      maxAmount: 1000000,
    },
  ];

  for (const plan of plans) {
    await prisma.investmentPlan.upsert({
      where: { name: plan.name },
      update: {
        minAmount: plan.minAmount,
        maxAmount: plan.maxAmount,
        description: plan.description,
      },
      create: plan,
    });
  }
  console.log("✅ Instantiated investment plans");

  // 5. Create Payment Wallets
  const wallets = [
    {
      name: "USDT (TRC-20)",
      address: "TYG3j8Z1pQWJt99fKLAkNsN7v4Yh8R3q2w",
      qrCodeUrl: "/images/wallets/usdt-trc20.png",
    },
    {
      name: "Bitcoin (BTC)",
      address: "19hdEPSFQ4iUhtWoXHqg2E1kPCpUmaEgP8",
      qrCodeUrl: "https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=19hdEPSFQ4iUhtWoXHqg2E1kPCpUmaEgP8",
    },
  ];

  for (const wallet of wallets) {
    const existing = await prisma.wallet.findFirst({
      where: { address: wallet.address },
    });
    if (existing) {
      await prisma.wallet.update({
        where: { id: existing.id },
        data: {
          name: wallet.name,
          qrCodeUrl: wallet.qrCodeUrl,
        },
      });
    } else {
      await prisma.wallet.create({
        data: {
          name: wallet.name,
          address: wallet.address,
          qrCodeUrl: wallet.qrCodeUrl,
        },
      });
    }
  }
  console.log("✅ Configured system funding wallets");

  console.log("🌱 Seed completed successfully!");
}

main()
  .catch((e) => {
    console.error("❌ Seed execution error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
