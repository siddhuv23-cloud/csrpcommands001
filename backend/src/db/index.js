import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import connectDB from "./db/index.js";

dotenv.config();

const app = express();

// 🔥 DEBUG (VERY IMPORTANT)
console.log("MONGO_URI:", process.env.MONGO_URI);
console.log("PORT:", process.env.PORT);

// Middleware
app.use(cors());
app.use(express.json());

// Test route
app.get("/", (req, res) => {
  res.send("API is running...");
});

// 🔥 Connect DB
connectDB();

// 🔥 Start server
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
