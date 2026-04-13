/**
 * Seed script — creates default owner & admin accounts
 * Run once: node src/seed.js
 */
import dotenv from "dotenv";
dotenv.config();

import connectDB from "./db/index.js";
import { User } from "./models/user.model.js";

const seed = async () => {
  await connectDB();

  const defaults = [
    {
      name: "Owner",
      email: "owner@csrp.com",
      password: "owner123",
      role: "owner",
      playerId: "OWNER-001",
      discordId: "owner#0001",
      servers: ["EN:1", "EN:2", "EN:3"],
      status: "active",
      approvalStatus: "approved",
    },
    {
      name: "Admin",
      email: "admin@csrp.com",
      password: "admin123",
      role: "admin",
      playerId: "ADMIN-001",
      discordId: "admin#0001",
      servers: ["EN:1", "EN:2", "EN:3"],
      status: "active",
      approvalStatus: "approved",
    },
  ];

  for (const data of defaults) {
    const exists = await User.findOne({ email: data.email });
    if (exists) {
      console.log(`⚠️  Already exists: ${data.email} — skipped`);
      continue;
    }
    await User.create(data);
    console.log(`✅  Created: ${data.role} → ${data.email} / ${data.password}`);
  }

  console.log("\nSeeding complete.");
  process.exit(0);
};

seed().catch((err) => {
  console.error("Seed error:", err);
  process.exit(1);
});
