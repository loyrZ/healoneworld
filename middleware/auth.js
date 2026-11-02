"use strict";

const db = require("../conf/database");
const {
  getOrCreateApplicationUser
} = require("../services/application-user");

function accessError(status, message) {
  const error = new Error(message);
  error.status = status;
  return error;
}

async function loadApplicationIdentity(req) {
  const user = await getOrCreateApplicationUser(req);

  const [rows] = await db.execute(
    `SELECT instructor, volunteer, staff, admin
     FROM permission
     WHERE id_fk = ?`,
    [user.id]
  );

  if (rows.length !== 1) {
    throw accessError(403, "Account permissions are unavailable.");
  }

  const row = rows[0];
  const fields = ["instructor", "volunteer", "staff", "admin"];

  // Unexpected permission values must never grant access.
  for (const field of fields) {
    if (row[field] !== 0 && row[field] !== 1) {
      throw accessError(403, "Account permissions are invalid.");
    }
  }

  const permissions = {
    instructor: row.instructor === 1,
    approvedVolunteer: row.volunteer === 1,
    staff: row.staff === 1,
    administrator: row.admin === 1
  };

  req.applicationUser = user;
  req.applicationPermissions = permissions;
}

function handleAccessError(error, res, next) {
  if ([401, 403, 409, 422].includes(error.status)) {
    return res.status(error.status).json({
      error: error.message
    });
  }

  // Unexpected failures go to Express's server-error handler.
  return next(error);
}

async function requireApplicationUser(req, res, next) {
  try {
    await loadApplicationIdentity(req);
    return next();
  } catch (error) {
    return handleAccessError(error, res, next);
  }
}

const rolePermissions = new Map([
  ["administrator", "administrator"],
  ["approved-volunteer", "approvedVolunteer"]
]);

function requireRole(role) {
  return async function checkApplicationRole(req, res, next) {
    try {
      await loadApplicationIdentity(req);

      const permission = rolePermissions.get(role);

      if (
        !permission ||
        req.applicationPermissions[permission] !== true
      ) {
        throw accessError(
          403,
          "You do not have permission to access this resource."
        );
      }

      return next();
    } catch (error) {
      return handleAccessError(error, res, next);
    }
  };
}

module.exports = {
  requireApplicationUser,
  requireRole,

  // Preserve the names imported by existing admin routes.
  isLoggedIn: requireApplicationUser,
  isAdmin: requireRole("administrator")
};