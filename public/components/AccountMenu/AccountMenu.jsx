import { useEffect, useRef, useState } from "react";
import { useClerk, useUser } from "@clerk/react";
import "./AccountMenu.css";

export default function AccountMenu() {
    const { user } = useUser();
    const { signOut } = useClerk();
    const [isOpen, setIsOpen] = useState(false);
    const menuRef = useRef(null);

    useEffect(() => {
        function handleKeyDown(event) {
            if (event.key === "Escape") setIsOpen(false);
        }

        function handlePointerDown(event) {
            if (!menuRef.current?.contains(event.target)) setIsOpen(false);
        }

        document.addEventListener("keydown", handleKeyDown);
        document.addEventListener("pointerdown", handlePointerDown);

        return () => {
            document.removeEventListener("keydown", handleKeyDown);
            document.removeEventListener("pointerdown", handlePointerDown);
        };
    }, []);

    if (!user) {
        return (
            <a className="account-menu__sign-in" href="/sign-in">
                Sign in
            </a>
        );
    }

    async function handleSignOut() {
        await signOut();
        window.location.assign("/");
    }

    const displayName =
        user.fullName ||
        user.firstName ||
        user.primaryEmailAddress?.emailAddress ||
        "Account";

    return (
        <div className="account-menu" ref={menuRef}>
            <button
                type="button"
                className="account-menu__trigger"
                aria-expanded={isOpen}
                aria-haspopup="menu"
                onClick={() => setIsOpen((open) => !open)}
            >
                <span>{displayName}</span>
                <span className="account-menu__chevron" aria-hidden="true">
                    ▾
                </span>
            </button>

            {isOpen && (
                <div className="account-menu__dropdown" role="menu">
                    <a href="/account" role="menuitem" onClick={() => setIsOpen(false)}>
                        My dashboard
                    </a>
                    <a href="/account/settings" role="menuitem" onClick={() => setIsOpen(false)}>
                        Account settings
                    </a>
                    <button type="button" role="menuitem" onClick={handleSignOut}>
                        Sign out
                    </button>
                </div>
            )}
        </div>
    );
}
