# Entirely Claude Generated
# Class data (HOW-132)

Shared class fields used by the admin class list (HOW-104), class creation (HOW-106),
class editing (HOW-113), the public calendar (HOW-388), and class details (HOW-389).

Code: `services/classes.js` (queries, validation, admin/public views) and `routes/classes.js` (endpoints).

## Fields

| API field | Column | Notes |
|---|---|---|
| `id` | `id_pk` | Stable ID. Use it in links, e.g. `/admin/classes/12/edit`. |
| `title` | `class_name` | Required, up to 255 characters. |
| `description` | `description` | Optional, up to 5000 characters. |
| `date` | `starts_at` | `YYYY-MM-DD`. |
| `startTime`, `endTime` | `starts_at`, `ends_at` | `HH:MM` (24-hour). End must be after start, same day. |
| `timeZone` | `time_zone` | IANA name. Only `America/Los_Angeles` is supported for now. |
| `format` | `attendance_format` | `in_person`, `virtual`, or `hybrid`. |
| `location` | `location` | Required for `in_person` and `hybrid`. |
| `meetingLink` | `meeting_link` | `https://` link, required for `virtual` and `hybrid`. **Admin only.** |
| `instructor` | `user_name` | Instructor name, required. |
| `capacity` | `capacity` | Whole number from 1 to 1000. |
| `status` | `status` | `pending` (awaiting approval) or `published`. **Admin only.** |
| `registrationCount` | none | Active registrations, or `null` when unavailable. **Admin only.** |

Dates and times are local wall-clock times in the class's `time_zone`, not UTC.
They are stored as `DATETIME` and returned as plain strings, so the server's own
time zone never shifts them.

`class_name` and `user_name` are the columns the table already had. They keep
their names so existing code keeps working.

## Endpoints

| Method and path | Access | Returns |
|---|---|---|
| `GET /api/classes` | Anyone | Published classes with a date, ordered by start. |
| `GET /api/classes/:id` | Anyone | One published class, or 404. |
| `GET /api/classes/admin` | Administrators | Every class, including pending ones. |
| `POST /api/classes/admin` | Administrators | Creates a published session and returns it with its new `id` (201). |
| `GET /api/classes/admin/:id` | Administrators | One class, or 404. |
| `PUT /api/classes/admin/:id` | Administrators | Saves an edit and returns the updated class. |

Admin endpoints use `requireRole("administrator")` from `middleware/auth.js` (HOW-532):
signed out gets 401, signed in without admin permission gets 403. Responses are sent with
`Cache-Control: no-store`.

Public responses never include `meetingLink`, `status`, or `registrationCount`.
Pending classes are never returned publicly.

### Creating a class

`POST /api/classes/admin` takes the same fields and validation as an edit (below). Admin-created
sessions are published straight away; `pending` is for volunteer submissions. The browser can't set
`id`, `status`, or `registrationCount`. New sessions have no registrations, and counts only come from
saved registrations.

Instructors are stored as a name. Creating a session does not create instructor accounts or grant
permissions.

### Saving an edit

`PUT /api/classes/admin/:id` takes every field in the edit form (all fields above except `id`,
`status`, and `registrationCount`). Any other field is rejected with 400.

- **400** `{ error, errors: { field: message } }`: validation failed and nothing was saved.
- **404**: unknown class.
- **409** `{ code: "capacity_confirmation_required", registrationCount, capacity }`: the
  capacity is being lowered below the active registration count, or lowered while that count
  is unknown. Nothing was saved. Send the same request again with
  `"confirmCapacityReduction": true` to save anyway. The server rechecks the count on every save.

Switching a class to `in_person` clears its meeting link, and switching to `virtual` clears
its location.

## Pages

| URL | Code | Notes |
|---|---|---|
| `/admin/classes` | `public/admin/classes/ClassList.jsx` | Search and filters. Shows a success message after a class is created. |
| `/admin/classes/new` | `public/admin/classes/ClassCreate.jsx` | Create form. |
| `/admin/classes/:id/edit` | `public/admin/classes/ClassEdit.jsx` | Edit form. |
| `/calendar/Calendar.html` | `Calendar/` | Public calendar. Each class shows on its own date. |
| `/classes/upcoming.html` | `Upcoming Classes Practice/Header & Section.html` | Public list of upcoming classes. |
| `/classes/ClassPage.html?id=12` | `Upcoming Classes Practice/ClassPage.html` | Public class details. |

The create and edit forms share their fields (`ClassForm.jsx`).
The public pages load classes with `public/js/class-schedule.js`, which calls `GET /api/classes`.
`Calendar/CalendarDatabase.js` and `Upcoming Classes Practice/classes.js` are old sample data
and are no longer loaded.

## Registration counts

Class registration storage does not exist yet. `services/class-registrations.js` returns no
counts, so the admin pages show "Registrations unavailable" instead of a made-up number.
Update `getRegistrationCounts` there when registrations are stored.

## Database changes

New databases: `npm run builddb` creates the full table.

Existing databases: run `migrations/002_class_schedule_fields.sql` once, after telling the group.
It only adds columns and keeps existing rows. Existing rows become `pending`, so they are not shown
publicly until an admin reviews them.

## Tests

`npm test` runs `tests/classes.test.js` and `tests/admin-class-filters.test.js`. These use
in-memory class records and never touch the shared Railway database.
