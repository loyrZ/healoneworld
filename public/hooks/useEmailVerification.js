import { useRef, useState } from "react";
import { useUser } from "@clerk/react";
import { useSignUp } from "@clerk/react/legacy";
import {
    getEmailVerificationState,
    getVerificationErrorMessage
} from "../utils/emailVerification.mjs";

export function useEmailVerification() {
    const {
        isLoaded: signupLoaded,
        signUp,
        setActive
    } = useSignUp();

    const {
        isLoaded: userLoaded,
        isSignedIn,
        user
    } = useUser();

    const [code, setCode] = useState("");
    const [phase, setPhase] = useState("");
    const [message, setMessage] = useState("");
    const requestRunning = useRef(false);

    const loaded = signupLoaded && userLoaded;

    const baseState = getEmailVerificationState({
        loaded,
        signedIn: isSignedIn,
        primaryEmailVerified:
            user?.primaryEmailAddress?.verification?.status === "verified",
        signup: signUp
    });

    const isBusy = ["sending", "verifying", "activating"].includes(phase);

    async function runRequest(nextPhase, action) {
        // A ref blocks repeated clicks immediately, before React rerenders.
        if (requestRunning.current || !loaded) return;

        requestRunning.current = true;
        setPhase(nextPhase);
        setMessage("");

        try {
            await action();
            setPhase("");
        } catch (error) {
            setPhase("failure");
            setMessage(getVerificationErrorMessage(error));
        } finally {
            requestRunning.current = false;
        }
    }

    async function activateCompletedSignup(result) {
        if (
            result.status !== "complete" ||
            result.verifications?.emailAddress?.status !== "verified"
        ) {
            return;
        }

        if (!result.createdSessionId) {
            throw new Error("No completed signup session is available.");
        }

        // Activate the Clerk session before opening authenticated pages.
        // Navigation belongs to the result screen.
        await setActive({
            session: result.createdSessionId,
            navigate: async () => {}
        });
    }

    async function verifyCode() {
        if (baseState !== "pending") return;

        if (!code.trim()) {
            setPhase("failure");
            setMessage("Enter the verification code from your email.");
            return;
        }

        await runRequest("verifying", async () => {
            const result = await signUp.attemptEmailAddressVerification({
                code: code.trim()
            });

            // Only Clerk's returned result can confirm verification.
            if (result.verifications?.emailAddress?.status !== "verified") {
                const error = new Error("Verification was not confirmed.");
                error.code = "verification_failed";
                throw error;
            }

            await activateCompletedSignup(result);
            setCode("");
            setMessage("Your email address has been verified.");
        });
    }

    async function resendCode() {
        if (!["pending", "expired"].includes(baseState)) return;

        await runRequest("sending", async () => {
            await signUp.prepareEmailAddressVerification({
                strategy: "email_code"
            });

            setMessage("A new code was sent. Check your inbox.");
        });
    }

    async function finishSignup() {
        if (baseState !== "verified") return;

        await runRequest("activating", async () => {
            await activateCompletedSignup(signUp);
            setMessage("Your email address has been verified.");
        });
    }

    return {
        code,
        setCode,
        status: phase || baseState,
        baseState,
        message,
        isBusy,
        emailAddress:
            signUp?.emailAddress ||
            user?.primaryEmailAddress?.emailAddress ||
            "",
        canVerify: baseState === "pending" && !isBusy,
        canResend:
            ["pending", "expired"].includes(baseState) && !isBusy,
        canFinish: baseState === "verified" && !isBusy,
        verifyCode,
        resendCode,
        finishSignup
    };
}