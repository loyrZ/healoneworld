"use strict";

// HOW-531: Associate verified Clerk identities with application users.

const { getAuth, clerkClient } = require("@clerk/express");
const db = require("../conf/database");

function accountError(status, message) {
  const error = new Error(message);
  error.status = status;
  return error;
}

async function getOrCreateApplicationUser(req) {
  const { userId, sessionId } = getAuth(req);

  if (!userId || !sessionId) {
    throw accountError(401, "Please sign in.");
  }

  // Obtain account details from Clerk, never from req.body.
  const clerkUser = await clerkClient.users.getUser(userId);

  const primaryEmail = clerkUser.emailAddresses.find(
    (address) => address.id === clerkUser.primaryEmailAddressId
  );

  if (primaryEmail?.verification?.status !== "verified") {
    throw accountError(403, "Please verify your primary email address.");
  }

  const email = primaryEmail.emailAddress;
  const name =
    [clerkUser.firstName, clerkUser.lastName]
      .filter(Boolean)
      .join(" ")
      .trim() || email;

  if (email.length > 255 || name.length > 255) {
    throw accountError(
      422,
      "Your account information exceeds the supported length."
    );
  }

  // Retry transactions that MySQL rolls back because of concurrency.
  for (let attempt = 0; attempt < 3; attempt += 1) {
    const connection = await db.getConnection();

    try {
      await connection.beginTransaction();

      /*
       * Either create the user or leave the existing record unchanged.
       * Never attach a Clerk ID to an existing record by matching email.
       * Unique database constraints handle simultaneous requests.
       */
      await connection.execute(
        `INSERT INTO users
           (clerk_user_id, name, email, password_hash)
         VALUES (?, ?, ?, NULL)
         ON DUPLICATE KEY UPDATE id_pk = id_pk`,
        [userId, name, email]
      );

      const [users] = await connection.execute(
        `SELECT id_pk, clerk_user_id, name, email
         FROM users
         WHERE clerk_user_id = ?
         FOR UPDATE`,
        [userId]
      );

      if (users.length !== 1) {
        throw accountError(
          409,
          "Your account needs administrator assistance before it can be linked."
        );
      }

      const user = users[0];

      /*
       * Create a default permission record if missing.
       * Existing permission values are never overwritten.
       */
      await connection.execute(
        `INSERT INTO permission
           (id_fk, instructor, volunteer, staff, admin)
         VALUES (?, FALSE, FALSE, FALSE, FALSE)
         ON DUPLICATE KEY UPDATE id_fk = id_fk`,
        [user.id_pk]
      );

      await connection.commit();

      // Return only application identity fields, never password hashes.
      return {
        id: user.id_pk,
        clerkUserId: user.clerk_user_id,
        name: user.name,
        email: user.email
      };
    } catch (error) {
      await connection.rollback();

      const retryable =
        error.code === "ER_LOCK_DEADLOCK" ||
        error.code === "ER_LOCK_WAIT_TIMEOUT";

      if (!retryable || attempt === 2) {
        throw error;
      }
    } finally {
      connection.release();
    }
  }
}

module.exports = { getOrCreateApplicationUser };