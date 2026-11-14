import { useEffect, useId, useRef, useState } from "react";
import { useClerk, useUser } from "@clerk/react";
import "./AccountMenu.css";

export default function AccountMenu() {
    const { isLoaded, isSignedIn, user } = useUser();
    const { signOut } = useClerk();

    const [isOpen, setIsOpen] = useState(false);
    const menuRef = useRef(null);
    const triggerRef = useRef(null);
    const dropdownId = useId();

    useEffect(() => {
        function handlePointerDown(event) {
            if (!menuRef.current?.contains(event.target)) {
                setIsOpen(false);
            }
        }

        document.addEventListener("pointerdown", handlePointerDown);

        return () => {
            document.removeEventListener("pointerdown", handlePointerDown);
        };
    }, []);

    function handleKeyDown(event) {
        if (event.key === "Escape" && isOpen) {
            event.preventDefault();
            event.stopPropagation();
            setIsOpen(false);
            triggerRef.current?.focus();
        }
    }

    function handleBlur(event) {
        if (!event.currentTarget.contains(event.relatedTarget)) {
            setIsOpen(false);
        }
    }

    async function handleSignOut() {
        await signOut();
        window.location.assign("/");
    }

    if (!isLoaded) {
        return (
            <span
                className="account-menu__loading"
                role="status"
                aria-label="Checking sign-in status"
                aria-busy="true"
            />
        );
    }

    if (!isSignedIn || !user) {
        return (
            <a className="account-menu__sign-in" href="/sign-in">
                Sign in
            </a>
        );
    }

    const displayName =
        user.fullName ||
        user.firstName ||
        user.primaryEmailAddress?.emailAddress ||
        "Account";

    return (
        <div
            className="account-menu"
            ref={menuRef}
            onKeyDownCapture={handleKeyDown}
            onBlur={handleBlur}
        >
            <button
                ref={triggerRef}
                type="button"
                className="account-menu__trigger"
                aria-expanded={isOpen}
                aria-controls={isOpen ? dropdownId : undefined}
                onClick={() => setIsOpen((open) => !open)}
            >
                <span>{displayName}</span>
                <span className="account-menu__chevron" aria-hidden="true">
                    ▾
                </span>
            </button>

            {isOpen && (
                <div
                    id={dropdownId}
                    className="account-menu__dropdown"
                >
                    <a href="/account" onClick={() => setIsOpen(false)}>
                        My dashboard
                    </a>
                    <a
                        href="/account/settings"
                        onClick={() => setIsOpen(false)}
                    >
                        Account settings
                    </a>
                    <button type="button" onClick={handleSignOut}>
                        Sign out
                    </button>
                </div>
            )}
        </div>
    );
}