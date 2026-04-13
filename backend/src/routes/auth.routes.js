import { Router } from "express";
import {
  signup,
  login,
  logout,
  getMe,
  getAllUsers,
  updateUserApproval,
  toggleBlockUser,
  updateUserRole,
} from "../controllers/auth.controller.js";
import { verifyJWT, requireRole } from "../middlewares/auth.middleware.js";

const router = Router();

// Public routes
router.post("/signup", signup);
router.post("/login", login);

// Private routes
router.post("/logout", verifyJWT, logout);
router.get("/me", verifyJWT, getMe);

// Admin/Owner only
router.get("/users", verifyJWT, requireRole("admin", "owner"), getAllUsers);
router.patch("/users/:id/approval", verifyJWT, requireRole("admin", "owner"), updateUserApproval);

// Owner only
router.patch("/users/:id/block", verifyJWT, requireRole("owner"), toggleBlockUser);
router.patch("/users/:id/role", verifyJWT, requireRole("owner"), updateUserRole);

export default router;
