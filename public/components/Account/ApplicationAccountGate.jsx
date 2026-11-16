import { useEffect, useState } from "react";
import { useAuth } from "@clerk/react";


const ACCOUNT_CACHE_KEY = "healoneworld.account";
const CACHE_TIME = 60 * 1000;

function getCachedAccount(userId) {
    let cached;

    try {
        cached = JSON.parse(sessionStorage.getItem(ACCOUNT_CACHE_KEY));
    } catch {
        sessionStorage.removeItem(ACCOUNT_CACHE_KEY);
        return null;
    }

    if (
        !cached ||
        cached.userId !== userId ||
        Date.now() - cached.time > CACHE_TIME
    ) {
        sessionStorage.removeItem(ACCOUNT_CACHE_KEY);
        return null;
    }

    return cached.data;
}

function cacheAccount(userId, data) {
    sessionStorage.setItem(
        ACCOUNT_CACHE_KEY,
        JSON.stringify({ userId, data, time: Date.now() })
    );
}

export function clearAccountCache() {
    sessionStorage.removeItem(ACCOUNT_CACHE_KEY);
}

export default function ApplicationAccountGate({ children }) {
    const { isLoaded, isSignedIn, userId, getToken } = useAuth();
    const [linkedUserId, setLinkedUserId] = useState(null);
    const [error, setError] = useState("");

    useEffect(() => {
        setLinkedUserId(null);
        setError("");

        if (!isLoaded || !isSignedIn) return;

        const controller = new AbortController();

        async function connectAccount() {
            try {
                if (controller.signal.aborted) return;

                const cached = getCachedAccount(userId);

                if (cached) {
                    setLinkedUserId(userId);
                    return;
                }
                
                const token = await getToken();

                if (controller.signal.aborted) return;

                if (!token) {
                    throw new Error("Please sign in again.");
                }

                const response = await fetch("/api/account", {
                    headers: {
                        Accept: "application/json",
                        Authorization: `Bearer ${token}`
                    },
                    credentials: "same-origin",
                    cache: "no-store",
                    signal: controller.signal
                });

                const data = await response.json();

                if (!response.ok) {
                    throw new Error(
                        response.status < 500
                            ? data.error || "Unable to access your account."
                            : "Account service is unavailable. Please try again."
                    );
                }

                if (data.user?.clerkUserId !== userId) {
                    throw new Error("Unable to confirm your account.");
                }

                cacheAccount(userId, data);

                if (!controller.signal.aborted) {
                    setLinkedUserId(userId);
                }
            } catch (error) {
                if (!controller.signal.aborted) {
                    setError(
                        error.message || "Unable to load your account."
                    );
                }
            }
        }

        connectAccount();

        return () => controller.abort();
    }, [isLoaded, isSignedIn, userId, getToken]);

    if (!isLoaded) {
        return <p role="status">Loading your session...</p>;
    }

    if (!isSignedIn) {
        return (
            <main>
                <p>Please sign in to access your account.</p>
                <a href="/sign-in">Sign in</a>
            </main>
        );
    }

    if (error) {
        return (
            <main>
                <p role="alert">{error}</p>
                <button
                    type="button"
                    onClick={() => window.location.reload()}
                >
                    Try again
                </button>
            </main>
        );
    }

    if (linkedUserId !== userId) {
        return <p role="status">Loading your application account...</p>;
    }

    return children;
}
