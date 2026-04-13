import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { User } from "../models/user.model.js";
import { STATUS_CODES, USER_TYPES } from "../constants.js";

// ─── Token Generator ──────────────────────────────────────────────────────────
const generateAccessAndRefreshTokens = async (userId) => {
  try {
    const user = await User.findById(userId);
    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();

    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });

    return { accessToken, refreshToken };
  } catch (error) {
    throw new ApiError(
      STATUS_CODES.INTERNAL_SERVER_ERROR,
      "Something went wrong while generating tokens"
    );
  }
};

// Cookie options helper
const cookieOptions = () => ({
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: process.env.NODE_ENV === "production" ? "strict" : "lax",
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
});

// ─── @desc    Register a new user (CSRP Player)
// ─── @route   POST /api/auth/signup
// ─── @access  Public
const signup = asyncHandler(async (req, res) => {
  const { name, email, password, playerId, discordId, servers } = req.body;

  // Validate required fields
  if (!name || !email || !password || !playerId || !discordId) {
    throw new ApiError(STATUS_CODES.BAD_REQUEST, "All fields are required");
  }

  // Validate servers array
  const serverList = Array.isArray(servers) ? servers : [];
  if (serverList.length === 0) {
    throw new ApiError(STATUS_CODES.BAD_REQUEST, "Select at least one server");
  }

  // Password length check
  if (password.length < 6) {
    throw new ApiError(STATUS_CODES.BAD_REQUEST, "Password must be at least 6 characters");
  }

  // Email format
  if (!email.includes("@")) {
    throw new ApiError(STATUS_CODES.BAD_REQUEST, "Enter a valid email address");
  }

  // Check if user already exists
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    throw new ApiError(STATUS_CODES.CONFLICT, "User with this email already exists");
  }

  // Create user
  const user = await User.create({
    name,
    email,
    password,
    playerId,
    discordId,
    servers: serverList,
    role: "player",
    status: "pending",
    approvalStatus: "pending",
  });

  const createdUser = await User.findById(user._id).select("-password -refreshToken");

  if (!createdUser) {
    throw new ApiError(
      STATUS_CODES.INTERNAL_SERVER_ERROR,
      "Something went wrong while registering user"
    );
  }

  return res
    .status(STATUS_CODES.CREATED)
    .json(
      new ApiResponse(
        STATUS_CODES.CREATED,
        createdUser,
        "Application submitted! Await admin approval."
      )
    );
});

// ─── @desc    Login user
// ─── @route   POST /api/auth/login
// ─── @access  Public
const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    throw new ApiError(STATUS_CODES.BAD_REQUEST, "Email and password are required");
  }

  // Find user by email
  const user = await User.findOne({ email }).select("+password +refreshToken");

  if (!user) {
    throw new ApiError(STATUS_CODES.UNAUTHORIZED, "Invalid credentials");
  }

  // Check account status
  if (!user.isActive) {
    throw new ApiError(STATUS_CODES.FORBIDDEN, "Your account has been deactivated");
  }

  if (user.isSuspended) {
    throw new ApiError(
      STATUS_CODES.FORBIDDEN,
      `Your account has been suspended. Reason: ${user.suspensionReason || "No reason provided"}`
    );
  }

  // Players need approval; admins/owners can always log in
  if (user.role === "player") {
    if (user.approvalStatus === "pending") {
      throw new ApiError(
        STATUS_CODES.FORBIDDEN,
        "Your application is pending approval. Please wait for admin approval."
      );
    }
    if (user.approvalStatus === "rejected") {
      throw new ApiError(STATUS_CODES.FORBIDDEN, "Your application was rejected.");
    }
    if (user.status === "blocked") {
      throw new ApiError(STATUS_CODES.FORBIDDEN, "Your account has been blocked.");
    }
  }

  // Compare password
  const isPasswordValid = await user.comparePassword(password);
  if (!isPasswordValid) {
    throw new ApiError(STATUS_CODES.UNAUTHORIZED, "Invalid credentials");
  }

  // Generate tokens
  const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(user._id);

  const loggedInUser = await User.findById(user._id).select("-password -refreshToken");

  return res
    .status(STATUS_CODES.SUCCESS)
    .cookie("accessToken", accessToken, cookieOptions())
    .cookie("refreshToken", refreshToken, cookieOptions())
    .json(
      new ApiResponse(
        STATUS_CODES.SUCCESS,
        { user: loggedInUser, accessToken, refreshToken },
        "User logged in successfully"
      )
    );
});

// ─── @desc    Logout user
// ─── @route   POST /api/auth/logout
// ─── @access  Private
const logout = asyncHandler(async (req, res) => {
  await User.findByIdAndUpdate(
    req.user._id,
    { $unset: { refreshToken: 1 } },
    { new: true }
  );

  const options = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: process.env.NODE_ENV === "production" ? "strict" : "lax",
  };

  return res
    .status(STATUS_CODES.SUCCESS)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new ApiResponse(STATUS_CODES.SUCCESS, {}, "User logged out successfully"));
});

// ─── @desc    Get current user profile
// ─── @route   GET /api/auth/me
// ─── @access  Private
const getMe = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).select("-password -refreshToken");
  return res
    .status(STATUS_CODES.SUCCESS)
    .json(new ApiResponse(STATUS_CODES.SUCCESS, user, "User profile fetched"));
});

// ─── @desc    Admin: get all users
// ─── @route   GET /api/auth/users
// ─── @access  Admin/Owner
const getAllUsers = asyncHandler(async (req, res) => {
  const users = await User.find({ role: "player" }).select("-password -refreshToken").sort({ createdAt: -1 });
  return res
    .status(STATUS_CODES.SUCCESS)
    .json(new ApiResponse(STATUS_CODES.SUCCESS, users, "Users fetched"));
});

// ─── @desc    Admin: approve or reject a user
// ─── @route   PATCH /api/auth/users/:id/approval
// ─── @access  Admin/Owner
const updateUserApproval = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { approvalStatus, suspensionReason } = req.body;

  if (!["approved", "rejected", "pending"].includes(approvalStatus)) {
    throw new ApiError(STATUS_CODES.BAD_REQUEST, "Invalid approval status");
  }

  const update = { approvalStatus };
  if (approvalStatus === "approved") {
    update.status = "active";
  } else if (approvalStatus === "rejected") {
    update.status = "rejected";
  }

  const user = await User.findByIdAndUpdate(id, update, { new: true }).select(
    "-password -refreshToken"
  );

  if (!user) {
    throw new ApiError(STATUS_CODES.NOT_FOUND, "User not found");
  }

  return res
    .status(STATUS_CODES.SUCCESS)
    .json(new ApiResponse(STATUS_CODES.SUCCESS, user, `User ${approvalStatus}`));
});

const toggleBlockUser = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { block, reason } = req.body;

  const user = await User.findByIdAndUpdate(
    id,
    {
      isSuspended: block,
      suspensionReason: block ? (reason || "No reason provided") : null,
      status: block ? "blocked" : "active",
    },
    { new: true }
  ).select("-password -refreshToken");

  if (!user) throw new ApiError(STATUS_CODES.NOT_FOUND, "User not found");

  return res
    .status(STATUS_CODES.SUCCESS)
    .json(new ApiResponse(STATUS_CODES.SUCCESS, user, `User ${block ? "blocked" : "unblocked"}`));
});

const updateUserRole = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { role } = req.body;

  if (!USER_TYPES || !Object.values(USER_TYPES).includes(role)) {
    if (!["player", "admin", "owner"].includes(role)) {
      throw new ApiError(STATUS_CODES.BAD_REQUEST, "Invalid role");
    }
  }

  const user = await User.findByIdAndUpdate(
    id,
    { role },
    { new: true }
  ).select("-password -refreshToken");

  if (!user) throw new ApiError(STATUS_CODES.NOT_FOUND, "User not found");

  return res
    .status(STATUS_CODES.SUCCESS)
    .json(new ApiResponse(STATUS_CODES.SUCCESS, user, "User role updated"));
});

export { 
  signup, 
  login, 
  logout, 
  getMe, 
  getAllUsers, 
  updateUserApproval, 
  toggleBlockUser,
  updateUserRole 
};
