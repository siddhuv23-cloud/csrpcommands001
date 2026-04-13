import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const userSchema = new mongoose.Schema(
  {
    // Common fields for all users
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: [true, "Password is required"],
      select: false,
    },
    role: {
      type: String,
      enum: ["player", "admin", "owner"],
      default: "player",
    },

    // CSRP-specific fields
    playerId: {
      type: String,
      trim: true,
    },
    discordId: {
      type: String,
      trim: true,
    },
    servers: {
      type: [String],
      enum: ["EN:1", "EN:2", "EN:3"],
      default: [],
    },

    // Account status
    status: {
      type: String,
      enum: ["pending", "active", "rejected", "blocked"],
      default: "pending",
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    isSuspended: {
      type: Boolean,
      default: false,
    },
    suspensionReason: {
      type: String,
      default: null,
    },

    // Admin/Owner approval
    approvalStatus: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },

    // Tokens
    refreshToken: {
      type: String,
      select: false,
    },

    // Optional: fitness / trainer fields from original controller
    userType: {
      type: String,
      default: null,
    },
    fitnessGoal: { type: String, default: null },
    specialization: { type: String, default: null },
    certifications: { type: String, default: null },
    laboratoryName: { type: String, default: null },
    laboratoryAddress: { type: String, default: null },
    licenseNumber: { type: String, default: null },
  },
  { timestamps: true }
);

// Hash password before save
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

// Compare password
userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// Generate access token
userSchema.methods.generateAccessToken = function () {
  return jwt.sign(
    {
      _id: this._id,
      email: this.email,
      name: this.name,
      role: this.role,
    },
    process.env.ACCESS_TOKEN_SECRET,
    { expiresIn: process.env.ACCESS_TOKEN_EXPIRY || "1d" }
  );
};

// Generate refresh token
userSchema.methods.generateRefreshToken = function () {
  return jwt.sign(
    { _id: this._id },
    process.env.REFRESH_TOKEN_SECRET,
    { expiresIn: process.env.REFRESH_TOKEN_EXPIRY || "7d" }
  );
};

export const User = mongoose.model("User", userSchema);
