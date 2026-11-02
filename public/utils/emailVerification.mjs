// Clerk remains responsible for sending and checking verification codes.

export function getEmailVerificationState({
    loaded,
    signedIn,
    primaryEmailVerified,
    signup
}) {
    if (!loaded) return "loading";

    if (signedIn) {
        return primaryEmailVerified ? "success" : "unverified";
    }

    if (!signup?.id || signup.status === "abandoned") {
        return "restart";
    }

    const verification = signup.verifications?.emailAddress;

    if (verification?.status === "verified") {
        return signup.status === "complete"
            ? "verified"
            : "continue-signup";
    }

    if (verification?.status === "expired") {
        return "expired";
    }

    if (!signup.emailAddress) {
        return "continue-signup";
    }

    return "pending";
}

export function getVerificationErrorMessage(error) {
    const code =
        error?.errors?.[0]?.code ||
        error?.code ||
        "";

    switch (code) {
        case "form_code_incorrect":
            return "That code is incorrect. Check it and try again.";

        case "verification_expired":
        case "form_code_expired":
            return "That code has expired. Request a new code.";

        case "verification_failed":
            return "Verification failed. Request a new code and try again.";

        case "too_many_requests":
        case "too_many_requests_error":
            return "Too many attempts. Wait before trying again.";

        case "resource_not_found":
            return "This signup could not be recovered. Restart signup.";

        default:
            return "Unable to complete the request. Check your connection and try again.";
    }
}