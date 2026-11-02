import { useEffect } from "react";
import { SignUp, useUser, useClerk } from "@clerk/react";
import { useSignUp } from "@clerk/react/legacy";
import "./Login.css";
import "./Signup.css";

export default function Signup() {
    const clerk = useClerk();
    const { isLoaded, signUp } = useSignUp();
    const {
        isLoaded: userLoaded,
        isSignedIn
    } = useUser();

    const needsEmailVerification =
        isLoaded &&
        signUp?.status === "missing_requirements" &&
        signUp.missingFields.length === 0 &&
        signUp.unverifiedFields.includes("email_address") &&
        signUp.verifications?.emailAddress?.strategy === "email_code";

    const openVerification =
        needsEmailVerification || (userLoaded && isSignedIn);

    useEffect(() => {
        if (openVerification) {
            window.location.replace("/verify-email");
        }
    }, [openVerification]);

    useEffect(() => {
    if (!isLoaded || !userLoaded || isSignedIn) return;

    return clerk.addListener(({ client }) => {
        const signup = client?.signUp;

        const readyForEmailCode =
            signup?.status === "missing_requirements" &&
            signup.missingFields.length === 0 &&
            signup.unverifiedFields.includes("email_address") &&
            signup.verifications?.emailAddress?.strategy === "email_code";

        if (readyForEmailCode) {
            window.location.replace("/verify-email");
        }
    });
    }, [clerk, isLoaded, userLoaded, isSignedIn]);

    if (!isLoaded || !userLoaded) {
        return <p role="status">Loading signup...</p>;
    }

    if (openVerification) {
        return <p role="status">Opening email verification...</p>;
    }

    return (
        <main className="login-page">
            <div className="signup-content">
                <section aria-labelledby="signup-heading">
                    <h1 id="signup-heading">Create your account</h1>
                    <p>
                        Use an email address you can access. When asked
                        to verify it, enter the code Clerk sends to your
                        inbox. Check the email address shown on the form
                        before continuing.
                    </p>
                </section>

                <SignUp
                    routing="path"
                    path="/sign-up"
                    signInUrl="/sign-in"
                    oauthFlow="redirect"
                    forceRedirectUrl="/verify-email"
                    signInForceRedirectUrl="/account"
                />
            </div>
        </main>
    );
}