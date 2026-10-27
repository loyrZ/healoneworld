import { useEffect, useState } from "react";
import {
    useAuth,
    useReverification,
    useUser,
} from "@clerk/react";
import "./AccountSettings.css";

export default function AccountSettings() {
    const { isLoaded, isSignedIn } = useAuth();
    const { user } = useUser();

    const [firstName, setFirstName] = useState("");
    const [lastName, setLastName] = useState("");
    const [email, setEmail] = useState("");
    const [verificationCode, setVerificationCode] = useState("");
    const [pendingEmailAddress, setPendingEmailAddress] = useState(null);

    const [status, setStatus] = useState("");
    const [error, setError] = useState("");
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        if (isLoaded && !isSignedIn) {
            window.location.replace("/sign-in");
        }
    }, [isLoaded, isSignedIn]);

    const createEmailAddress = useReverification((newEmail) =>
        user?.createEmailAddress({
            email: newEmail,
        })
    );

    const setPrimaryEmailAddress = useReverification((emailAddressId) =>
        user?.update({
            primaryEmailAddressId: emailAddressId,
        })
    );

    useEffect(() => {
        if (!user) return;

        setFirstName(user.firstName || "");
        setLastName(user.lastName || "");
        setEmail(user.primaryEmailAddress?.emailAddress || "");
    }, [user]);

    if (!isLoaded) {
        return (
            <main className="account-settings">
                <p role="status">Loading your account...</p>
            </main>
        );
    }

    if (!isSignedIn || !user) {
        return null;
    }

    async function handleNameSubmit(event) {
        event.preventDefault();

        setError("");
        setStatus("");
        setIsSaving(true);

        try {
            const updatedUser = await user.update({
                firstName: firstName.trim(),
                lastName: lastName.trim(),
            });

            setFirstName(updatedUser.firstName || "");
            setLastName(updatedUser.lastName || "");
            setStatus("Your name has been updated.");
        } catch (error) {
            setError(
                error?.errors?.[0]?.longMessage ||
                error?.errors?.[0]?.message ||
                "We could not update your name."
            );
        } finally {
            setIsSaving(false);
        }
    }

    async function handleEmailSubmit(event) {
        event.preventDefault();
        setError("");
        setStatus("");
        setIsSaving(true);

        try {
            const createdEmailAddress = await createEmailAddress(
                email.trim().toLowerCase()
            );

            await user.reload();

            const emailAddress = user.emailAddresses.find(
                (address) => address.id === createdEmailAddress.id
            );

            await emailAddress.prepareVerification({
                strategy: "email_code",
            });

            setPendingEmailAddress(emailAddress);
            setStatus("A verification code was sent to your new email.");
        } catch {
            setError("We could not start the email change.");
        } finally {
            setIsSaving(false);
        }
    }

    async function handleEmailVerification(event) {
        event.preventDefault();
        setError("");
        setStatus("");
        setIsSaving(true);

        try {
            const verifiedEmailAddress =
                await pendingEmailAddress.attemptVerification({
                    code: verificationCode.trim(),
                });

            await setPrimaryEmailAddress(verifiedEmailAddress.id);
            await user.reload();

            setPendingEmailAddress(null);
            setVerificationCode("");
            setStatus("Your email address has been updated.");
        } catch {
            setError("The verification code was not accepted.");
        } finally {
            setIsSaving(false);
        }
    }

    return (
        <main className="account-settings">
            <a className="account-settings__back" href="/account">
                ← Back to dashboard
            </a>

            <section className="account-settings__card">
                <p className="account-settings__eyebrow">
                    Account settings
                </p>

                <h1>Account information</h1>

                <p>
                    Your account-information form will be available through
                    HOW-243.
                </p>

                <form
                    className="account-settings__form"
                    onSubmit={handleNameSubmit}
                >
                    <h2>Name</h2>

                    <label htmlFor="first-name">First name</label>
                    <input
                        id="first-name"
                        type="text"
                        value={firstName}
                        onChange={(event) => setFirstName(event.target.value)}
                        autoComplete="given-name"
                        required
                    />

                    <label htmlFor="last-name">Last name</label>
                    <input
                        id="last-name"
                        type="text"
                        value={lastName}
                        onChange={(event) => setLastName(event.target.value)}
                        autoComplete="family-name"
                    />

                    <button type="submit" disabled={isSaving}>
                        Save name
                    </button>
                </form>

                <form
                    className="account-settings__form"
                    onSubmit={
                        pendingEmailAddress
                            ? handleEmailVerification
                            : handleEmailSubmit
                    }
                >
                    <h2>Email address</h2>

                    <label htmlFor="email-address">Email address</label>
                    <input
                        id="email-address"
                        type="email"
                        value={email}
                        onChange={(event) => setEmail(event.target.value)}
                        autoComplete="email"
                        disabled={Boolean(pendingEmailAddress)}
                        required
                    />

                    {pendingEmailAddress && (
                        <>
                            <label htmlFor="verification-code">
                                Verification code
                            </label>

                            <input
                                id="verification-code"
                                type="text"
                                value={verificationCode}
                                onChange={(event) =>
                                    setVerificationCode(event.target.value)
                                }
                                autoComplete="one-time-code"
                                required
                            />
                        </>
                    )}

                    <button type="submit" disabled={isSaving}>
                        {pendingEmailAddress
                            ? "Verify email"
                            : "Change email"}
                    </button>
                </form>

                {error && <p role="alert">{error}</p>}
                {status && <p role="status">{status}</p>}
            </section>
        </main>
    );
}
