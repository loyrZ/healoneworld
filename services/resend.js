"use strict";

const RESEND_ENDPOINT = "https://api.resend.com/emails";

async function sendVolunteerDecisionEmail({
    applicantEmail,
    applicantName,
    decision,
    reason
}) {
    const apiKey = process.env.RESEND_API_KEY;
    const fromEmail = process.env.RESEND_FROM_EMAIL;
    const fromName = process.env.RESEND_FROM_NAME || "Heal One World";

    if (!apiKey || !fromEmail) {
        throw new Error("Resend environment variables are not configured.");
    }

    const approved = decision === "approved";
    const subject = approved
        ? "Your Heal One World volunteer application was approved"
        : "An update on your Heal One World volunteer application";
    const decisionText = approved
        ? "Your volunteer application has been approved."
        : "Your volunteer application has been declined.";
    const reasonText = reason ? `\nReason: ${reason}` : "";

    const response = await fetch(RESEND_ENDPOINT, {
        method: "POST",
        headers: {
            Authorization: `Bearer ${apiKey}`,
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            from: `${fromName} <${fromEmail}>`,
            to: [applicantEmail],
            subject,
            text: `Hello ${applicantName},\n\n${decisionText}${reasonText}\n\nThank you,\nHeal One World`,
            html: `<p>Hello ${escapeHtml(applicantName)},</p><p>${decisionText}</p>${reason ? `<p><strong>Reason:</strong> ${escapeHtml(reason)}</p>` : ""}<p>Thank you,<br>Heal One World</p>`
        })
    });

    if (!response.ok) {
        const detail = await response.text();
        throw new Error(`Resend returned ${response.status}: ${detail}`);
    }
}

function escapeHtml(value) {
    return String(value)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}

module.exports = { sendVolunteerDecisionEmail };
