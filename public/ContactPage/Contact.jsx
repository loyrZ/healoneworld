import { useState } from "react";
import "./Contact.css";

const INITIAL_FORM = {
    name: "",
    email: "",
    subject: "",
    message: ""
};

const FIELD_LIMITS = {
    name: 100,
    email: 254,
    subject: 200,
    message: 5000
};

function Contact() {
    const [form, setForm] = useState(INITIAL_FORM);
    const [errors, setErrors] = useState({});
    const [status, setStatus] = useState({ type: "", message: "" });
    const [isSubmitting, setIsSubmitting] = useState(false);

    function handleChange(event) {
        const { name, value } = event.target;

        setForm((current) => ({ ...current, [name]: value }));
        setErrors((current) => ({ ...current, [name]: "" }));
        setStatus({ type: "", message: "" });
    }

    async function handleSubmit(event) {
        event.preventDefault();

        if (!event.currentTarget.reportValidity()) return;

        setIsSubmitting(true);
        setErrors({});
        setStatus({ type: "", message: "" });

        try {
            const response = await fetch("/api/contact-submissions", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Accept: "application/json"
                },
                body: JSON.stringify(form)
            });
            const data = await response.json();

            if (!response.ok) {
                setErrors(data.errors || {});
                setStatus({
                    type: "error",
                    message: data.error || "We could not send your message. Please try again."
                });
                return;
            }

            setForm(INITIAL_FORM);
            setStatus({
                type: "success",
                message: "Thank you. Your message has been sent to Heal One World."
            });
        } catch {
            setStatus({
                type: "error",
                message: "We could not send your message. Please check your connection and try again."
            });
        } finally {
            setIsSubmitting(false);
        }
    }

    function fieldProps(name) {
        return {
            "aria-describedby": errors[name] ? `${name}-error` : undefined,
            "aria-invalid": errors[name] ? "true" : "false",
            maxLength: FIELD_LIMITS[name],
            name,
            onChange: handleChange,
            required: true,
            value: form[name]
        };
    }

    return (
        <main className="contact-page" id="main-content" tabIndex={-1}>
            <section className="contact-hero" aria-labelledby="contact-heading">
                <div className="container">
                    <p className="section-eyebrow">Contact Heal One World</p>
                    <h1 id="contact-heading">We would love to hear from you.</h1>
                    <p>
                        Send us a question, share feedback, or ask how to connect with
                        Heal One World. We will use the information below only to respond
                        to your inquiry.
                    </p>
                </div>
            </section>

            <section className="container contact-content" aria-label="Contact information and form">
                <aside className="contact-details">
                    <h2>Contact information</h2>
                    <address>
                        Heal One World<br />
                        3503 W Pico Blvd<br />
                        Los Angeles, CA
                    </address>
                    <p>
                        <a href="mailto:skye@healoneworld.org">skye@healoneworld.org</a>
                    </p>
                </aside>

                <form className="contact-form" onSubmit={handleSubmit} noValidate>
                    <h2>Send an inquiry</h2>

                    <div className="contact-form__field">
                        <label htmlFor="contact-name">Name</label>
                        <input id="contact-name" type="text" autoComplete="name" {...fieldProps("name")} />
                        {errors.name && <p id="name-error" role="alert">{errors.name}</p>}
                    </div>

                    <div className="contact-form__field">
                        <label htmlFor="contact-email">Email address</label>
                        <input id="contact-email" type="email" autoComplete="email" {...fieldProps("email")} />
                        {errors.email && <p id="email-error" role="alert">{errors.email}</p>}
                    </div>

                    <div className="contact-form__field">
                        <label htmlFor="contact-subject">Subject</label>
                        <input id="contact-subject" type="text" {...fieldProps("subject")} />
                        {errors.subject && <p id="subject-error" role="alert">{errors.subject}</p>}
                    </div>

                    <div className="contact-form__field">
                        <label htmlFor="contact-message">Message</label>
                        <textarea id="contact-message" rows={7} {...fieldProps("message")} />
                        {errors.message && <p id="message-error" role="alert">{errors.message}</p>}
                    </div>

                    <button className="button button--primary" type="submit" disabled={isSubmitting}>
                        {isSubmitting ? "Sending..." : "Send inquiry"}
                    </button>

                    {status.message && (
                        <p
                            className={`contact-form__status contact-form__status--${status.type}`}
                            role="status"
                            aria-live="polite"
                        >
                            {status.message}
                        </p>
                    )}
                </form>
            </section>
        </main>
    );
}

export default Contact;