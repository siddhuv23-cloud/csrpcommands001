// import express from "express";
// import cors from "cors";
// import dotenv from "dotenv";
// // import connectDB from "./db/index.js";

// dotenv.config();

// const app = express();

// // 🔥 DEBUG (VERY IMPORTANT)
// console.log("MONGO_URI:", process.env.MONGO_URI);
// console.log("PORT:", process.env.PORT);

// // Middleware
// app.use(cors());
// app.use(express.json());

// // Test route
// app.get("/", (req, res) => {
//   res.send("API is running...");
// });

// // 🔥 Connect DB
// connectDB();

// // 🔥 Start server
// const PORT = process.env.PORT || 5000;

// app.listen(PORT, () => {
//   console.log(`Server running on port ${PORT}`);
// });



// import mongoose from "mongoose";
// import { DB_NAME } from "../constants.js";

// const connectDB = async () => {
//   try {
//     const connectionInstance = await mongoose.connect(
//       process.env.MONGO_URI
//     );

//     console.log(
//       `\nMongoDB Connected! DB HOST: ${connectionInstance.connection.host}`
//     );
//   } catch (error) {
//     console.error("MongoDB Connection Error:", error);
//     process.exit(1);
//   }
// };

// export default connectDB;




import mongoose from "mongoose";
import { DB_NAME } from "../constants.js";

const connectDB = async () => {
  try {
    if (!process.env.MONGO_URI) {
      throw new Error("MONGO_URI is not defined");
    }

    const connectionInstance = await mongoose.connect(
      process.env.MONGO_URI,
      {
        dbName: DB_NAME,
      }
    );

    console.log(
      `MongoDB Connected! HOST: ${connectionInstance.connection.host}`
    );
  } catch (error) {
    console.error("MongoDB Connection Error:", error.message);
    process.exit(1);
  }
};

export default connectDB;
