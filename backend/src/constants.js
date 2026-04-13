export const DB_NAME = process.env.DB_NAME || "csrp_db";

export const STATUS_CODES = {
  SUCCESS: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  INTERNAL_SERVER_ERROR: 500,
};

export const USER_TYPES = {
  FITNESS_ENTHUSIAST: "fitness_enthusiast",
  TRAINER: "trainer",
  LAB_PARTNER: "lab_partner",
  // CSRP player type (for this project)
  PLAYER: "player",
  ADMIN: "admin",
  OWNER: "owner",
};
