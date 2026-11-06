"use strict";

// HOW-132: Registration counts for classes.
// Class registration storage is a separate story and does not exist yet,
// so no counts are known. Callers treat a missing count as "unavailable"
// and must never assume it is zero.
// When registrations are stored, count active registrations here.
//  Claude Revised 

// Returns a Map of class ID -> active registration count.
// IDs missing from the Map have an unknown count.
async function getRegistrationCounts(classIds, connection) {
  return new Map();
}

module.exports = { getRegistrationCounts };
