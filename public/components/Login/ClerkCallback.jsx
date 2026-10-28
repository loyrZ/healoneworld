import { useEffect, useRef } from "react";
import { useClerk } from "@clerk/react";

export default function ClerkCallback() {
    const { handleRedirectCallback } = useClerk();
    const hasHandledCallback = useRef(false);

    useEffect(() => {
        if (hasHandledCallback.current) return;

        hasHandledCallback.current = true;

        async function completeCallback() {
            try {
                await handleRedirectCallback({
                    signInForceRedirectUrl: "/account",
                    signUpForceRedirectUrl: "/account",
                });
            } catch (error) {
                console.error("Clerk callback failed:", error);
                window.location.replace("/");
            }
        }

        completeCallback();
    }, [handleRedirectCallback]);

    return (
        <main>
            <p role="status">Completing sign-in...</p>
        </main>
    );
}