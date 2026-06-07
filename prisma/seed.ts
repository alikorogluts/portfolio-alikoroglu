import { PrismaPg } from "@prisma/adapter-pg";
import { AdminRole, PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { z } from "zod";

const envSchema = z.object({
  DATABASE_URL: z.string().url("DATABASE_URL must be a valid PostgreSQL URL."),
  ADMIN_EMAIL: z.string().email("ADMIN_EMAIL must be a valid email address."),
  ADMIN_PASSWORD: z
    .string()
    .min(12, "ADMIN_PASSWORD must be at least 12 characters long."),
});

async function main() {
  const env = envSchema.safeParse({
    DATABASE_URL: process.env.DATABASE_URL,
    ADMIN_EMAIL: process.env.ADMIN_EMAIL,
    ADMIN_PASSWORD: process.env.ADMIN_PASSWORD,
  });

  if (!env.success) {
    const message = env.error.issues.map((issue) => issue.message).join(" ");
    throw new Error(
      `Missing or invalid seed environment variables. ${message} Set ADMIN_EMAIL and ADMIN_PASSWORD before running pnpm db:seed.`
    );
  }

  const adapter = new PrismaPg({ connectionString: env.data.DATABASE_URL });
  const prisma = new PrismaClient({ adapter });
  const passwordHash = await bcrypt.hash(env.data.ADMIN_PASSWORD, 12);

  try {
    const admin = await prisma.adminUser.upsert({
      where: { email: env.data.ADMIN_EMAIL.toLowerCase() },
      update: {
        passwordHash,
        role: AdminRole.OWNER,
        isActive: true,
      },
      create: {
        email: env.data.ADMIN_EMAIL.toLowerCase(),
        passwordHash,
        role: AdminRole.OWNER,
        isActive: true,
      },
      select: {
        id: true,
        email: true,
        role: true,
      },
    });

    console.log(`Seeded ${admin.role} admin user: ${admin.email}`);
  } finally {
    await prisma.$disconnect();
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
