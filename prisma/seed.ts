import "dotenv/config";
import { PrismaClient } from "../generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL,
});

const prisma = new PrismaClient({
  adapter,
});

async function main() {
  console.log("🌱 Starting seed...");

  // ================================
  // USERS
  // ================================

  await prisma.user.create({
    data: {
      id: "u-alex",
      username: "alex",
      avatarUrl: "https://i.pravatar.cc/150?img=12",
      bio: "CS student · Building in public",
      currentStreak: 5,
    },
  });

  await prisma.user.create({
    data: {
      id: "u-priya",
      username: "priya",
      avatarUrl: "https://i.pravatar.cc/150?img=32",
      bio: "Frontend learner · React & TypeScript",
      currentStreak: 12,
    },
  });

  await prisma.user.create({
    data: {
      id: "u-rahim",
      username: "rahim",
      avatarUrl: "https://i.pravatar.cc/150?img=53",
      bio: "Backend enthusiast · Node & PostgreSQL",
      currentStreak: 3,
    },
  });


  // ================================
  // PASSWORDS
  // ================================

  await prisma.password.create({
    data: {
      userId: "u-alex",
      passwordHash: "demo_hash_alex",
    },
  });

  await prisma.password.create({
    data: {
      userId: "u-priya",
      passwordHash: "demo_hash_priya",
    },
  });

  await prisma.password.create({
    data: {
      userId: "u-rahim",
      passwordHash: "demo_hash_rahim",
    },
  });


  // ================================
  // LEARNING LOGS
  // ================================

  await prisma.learningLog.create({
    data: {
      id: "l-01",
      userId: "u-alex",
      topic: "React Server Components",
      description: "Understanding RSC and data fetching.",
      minutesSpent: 60,
      minutesCompleted: 60,
      stickyColor: "bg-yellow-100",
      dateLogged: new Date("2026-08-10"),
    },
  });

  await prisma.learningLog.create({
    data: {
      id: "l-02",
      userId: "u-priya",
      topic: "TypeScript Generics",
      description: "Practicing generic functions and types.",
      minutesSpent: 45,
      minutesCompleted: 30,
      stickyColor: "bg-pink-100",
      dateLogged: new Date("2026-08-10"),
    },
  });

  await prisma.learningLog.create({
    data: {
      id: "l-03",
      userId: "u-rahim",
      topic: "PostgreSQL Indexing",
      description: "B-tree indexes and query performance.",
      minutesSpent: 50,
      minutesCompleted: 40,
      stickyColor: "bg-green-100",
      dateLogged: new Date("2026-08-09"),
    },
  });


  // ================================
  // REACTIONS
  // ================================

  await prisma.logReaction.create({
    data: {
      id: "r-01",
      logId: "l-01",
      userId: "u-priya",
      reactionType: "🔥",
    },
  });

  await prisma.logReaction.create({
    data: {
      id: "r-02",
      logId: "l-01",
      userId: "u-rahim",
      reactionType: "👍",
    },
  });

  await prisma.logReaction.create({
    data: {
      id: "r-03",
      logId: "l-02",
      userId: "u-alex",
      reactionType: "❤️",
    },
  });


  // ================================
  // FRAGMENTS
  // ================================

  await prisma.fragment.create({
    data: {
      id: "f-01",
      logId: "l-01",
      userId: "u-priya",
      message: "Great progress! Keep going 🔥",
    },
  });

  await prisma.fragment.create({
    data: {
      id: "f-02",
      logId: "l-02",
      userId: "u-alex",
      message: "Generics are confusing at first, but you'll get it!",
    },
  });

  await prisma.fragment.create({
    data: {
      id: "f-03",
      logId: "l-03",
      userId: "u-priya",
      message: "PostgreSQL indexing is really useful for performance.",
    },
  });


  // ================================
  // EXTERNAL LINKS
  // ================================

  await prisma.externalLink.create({
    data: {
      id: "link-01",
      logId: "l-01",
      addedBy: "u-alex",
      url: "https://react.dev",
      title: "React Documentation",
    },
  });

  await prisma.externalLink.create({
    data: {
      id: "link-02",
      logId: "l-02",
      addedBy: "u-priya",
      url: "https://www.typescriptlang.org/docs/",
      title: "TypeScript Documentation",
    },
  });

  await prisma.externalLink.create({
    data: {
      id: "link-03",
      logId: "l-03",
      addedBy: "u-rahim",
      url: "https://www.postgresql.org/docs/",
      title: "PostgreSQL Documentation",
    },
  });


  console.log("🌱 Seed completed successfully!");
}


// ================================
// RUN SEED
// ================================

main()
  .catch((error) => {
    console.error("❌ Seed failed:");
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });