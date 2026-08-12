import "dotenv/config";
import express, { Request, Response } from "express";
import { prisma } from "../src/lib/prisma";

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(express.json());


// ================================
// HEALTH CHECK
// ================================

app.get("/api/health", (req: Request, res: Response) => {
  res.status(200).json({
    status: "OK",
    message: "Server is running smoothly",
  });
});


// ================================
// TEST PRISMA DATABASE CONNECTION
// ================================

app.get("/api/test-db", async (req: Request, res: Response) => {
  try {
    const users = await prisma.user.findMany();

    res.status(200).json({
      success: true,
      message: "Database connected successfully",
      users,
    });
  } catch (error) {
    console.error("Database error:", error);

    res.status(500).json({
      success: false,
      message: "Database connection failed",
    });
  }
});


// ================================
// START SERVER
// ================================

app.listen(PORT, () => {
  console.log(`🚀 Server is listening on http://localhost:${PORT}`);
});