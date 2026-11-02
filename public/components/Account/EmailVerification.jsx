import { useClerk } from "@clerk/react";
import { useEmailVerification } from "../../hooks/useEmailVerification";
import "./EmailVerification.css";

const statusMessages = {
    loading: "Loading your verification status...",
    pending: "Enter the verification code from your email.",
    sending: "Sending another verification code...",
    verifying: "Checking your verification code...",
    activating: "Completing sign-in...",
    success: "Your email is verified and you are signed in.",
    verified: "Your email is verified. Finish signing in to continue.",
    expired: "Your code has expired. Request another code.",
    failure: "The request could not be completed.",
    restart: "No active signup was found. Return to signup to begin again.",
    "continue-signup": "Continue signup to provide the remaining information.",
    unverified: "Your signed-in account's primary email is not verified."
};

function maskEmail(email) {
    const separator = email.lastIndexOf("@");

    if (separator < 1) return "your email address";

    return `${email[0]}***${email.slice(separator)}`;
}

export default function EmailVerification() {
    const verification = useEmailVerification();
    const { signOut } = useClerk();

    const {
        code,
        setCode,
        status,
        baseState,
        message,
        isBusy,
        emailAddress,
        canVerify,
        canResend,
        canFinish,
        verifyCode,
        resendCode,
        finishSignup
    } = verification;

    const showCodeForm = ["pending", "expired"].includes(baseState);

    function handleSubmit(event) {
        event.preventDefault();
        verifyCode();
    }

    return (
        <main className="email-verification">
            <section
                className="email-verification__card"
                aria-labelledby="verification-heading"
            >
                <h1 id="verification-heading">Email verification</h1>

                <p role="status" aria-live="polite">
                    {statusMessages[status] || statusMessages.restart}
                </p>

                {message && (
                    <p role={status === "failure" ? "alert" : "status"}>
                        {message}
                    </p>
                )}

                {showCodeForm && (
                    <form onSubmit={handleSubmit} aria-busy={isBusy}>
                        <p id="verification-instructions">
                            Check the inbox for {maskEmail(emailAddress)}.
                            Use the latest code you received.
                        </p>

                        <label htmlFor="verification-code">
                            Verification code
                        </label>
                        <input
                            id="verification-code"
                            name="verification-code"
                            type="text"
                            inputMode="numeric"
                            autoComplete="one-time-code"
                            aria-describedby="verification-instructions"
                            value={code}
                            onChange={(event) => setCode(event.target.value)}
                            disabled={isBusy || baseState === "expired"}
                            required
                        />

                        <div className="email-verification__actions">
                            <button type="submit" disabled={!canVerify}>
                                {status === "verifying"
                                    ? "Verifying..."
                                    : "Verify email"}
                            </button>

                            <button
                                type="button"
                                className="email-verification__secondary"
                                onClick={resendCode}
                                disabled={!canResend}
                            >
                                {status === "sending"
                                    ? "Sending..."
                                    : "Send another code"}
                            </button>
                        </div>
                    </form>
                )}

                {canFinish && (
                    <button type="button" onClick={finishSignup}>
                        Finish signing in
                    </button>
                )}

                {baseState === "success" && (
                    <a className="email-verification__primary" href="/account">
                        Continue to my account
                    </a>
                )}

                {["restart", "continue-signup"].includes(baseState) && (
                    <a href="/sign-up">Return to signup</a>
                )}

                {baseState === "unverified" && (
                    <button
                        type="button"
                        onClick={() => signOut({ redirectUrl: "/sign-in" })}
                    >
                        Sign out and return to sign-in
                    </button>
                )}

                <p className="email-verification__help">
                    Never share your verification code with anyone.
                </p>
                <a href="/home.html">Back to homepage</a>
            </section>
        </main>
    );
}