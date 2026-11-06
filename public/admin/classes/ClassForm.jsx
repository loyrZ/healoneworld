/* HOW-139, HOW-165: Class fields shared by the create and edit pages. Layout from the Figma "Mock Up Prototype" file, frame "Admin / Add or Edit Class". */
//  Claude Revised 

import { FORMAT_LABELS, TIME_ZONE_LABELS } from "./classData.mjs";
import "./ClassEdit.css";

// Field names match the API fields in docs/class-data.md.

function Field({ id, label, error, hint, children }) {
    const describedBy = [hint && `${id}-hint`, `${id}-error`].filter(Boolean).join(" ");

    return (
        <div className="class-edit__field">
            <label htmlFor={id}>{label}</label>
            {hint && <p id={`${id}-hint`} className="class-edit__hint">{hint}</p>}
            {children({ id, "aria-invalid": error ? "true" : "false", "aria-describedby": describedBy })}
            <p id={`${id}-error`} className="class-edit__error">{error}</p>
        </div>
    );
}

function ClassFormFields({ form, errors, onChange }) {
    const showLocation = form.format === "in_person" || form.format === "hybrid";
    const showMeetingLink = form.format === "virtual" || form.format === "hybrid";

    return (
        <>
            <Field id="title" label="Class or event title" error={errors.title}>
                {(props) => <input {...props} name="title" type="text" maxLength={255} value={form.title} onChange={onChange} />}
            </Field>

            <Field id="description" label="Description (optional)" error={errors.description}>
                {(props) => <textarea {...props} name="description" rows={4} maxLength={5000} value={form.description} onChange={onChange} />}
            </Field>

            <fieldset className="class-edit__group">
                <legend>Date and time</legend>
                <div className="class-edit__row">
                    <Field id="date" label="Date" error={errors.date}>
                        {(props) => <input {...props} name="date" type="date" value={form.date} onChange={onChange} />}
                    </Field>
                    <Field id="startTime" label="Start time" error={errors.startTime}>
                        {(props) => <input {...props} name="startTime" type="time" value={form.startTime} onChange={onChange} />}
                    </Field>
                    <Field id="endTime" label="End time" error={errors.endTime}>
                        {(props) => <input {...props} name="endTime" type="time" value={form.endTime} onChange={onChange} />}
                    </Field>
                </div>
                <Field id="timeZone" label="Time zone" error={errors.timeZone}>
                    {(props) => (
                        <select {...props} name="timeZone" value={form.timeZone} onChange={onChange}>
                            {Object.entries(TIME_ZONE_LABELS).map(([value, label]) => (
                                <option key={value} value={value}>{label}</option>
                            ))}
                        </select>
                    )}
                </Field>
            </fieldset>

            <Field id="format" label="Attendance format" error={errors.format}>
                {(props) => (
                    <select {...props} name="format" value={form.format} onChange={onChange}>
                        {Object.entries(FORMAT_LABELS).map(([value, label]) => (
                            <option key={value} value={value}>{label}</option>
                        ))}
                    </select>
                )}
            </Field>

            {showLocation && (
                <Field
                    id="location"
                    label="Location"
                    hint="The physical address or room where attendees meet."
                    error={errors.location}
                >
                    {(props) => <input {...props} name="location" type="text" maxLength={255} value={form.location} onChange={onChange} />}
                </Field>
            )}

            {showMeetingLink && (
                <Field
                    id="meetingLink"
                    label="Virtual meeting link"
                    hint="Only shared with registered attendees, never on the public website."
                    error={errors.meetingLink}
                >
                    {(props) => <input {...props} name="meetingLink" type="url" placeholder="https://" maxLength={2048} value={form.meetingLink} onChange={onChange} />}
                </Field>
            )}

            <Field id="instructor" label="Instructor" error={errors.instructor}>
                {(props) => <input {...props} name="instructor" type="text" maxLength={255} value={form.instructor} onChange={onChange} />}
            </Field>

            <Field id="capacity" label="Capacity" error={errors.capacity}>
                {(props) => <input {...props} name="capacity" type="number" min={1} max={1000} step={1} inputMode="numeric" value={form.capacity} onChange={onChange} />}
            </Field>
        </>
    );
}

export default ClassFormFields;
