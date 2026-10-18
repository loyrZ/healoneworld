import { useClerk, useUser } from "@clerk/react";

export default function AccountMenu() {
    const { user } = useUser();
    const { signOut } = useClerk();

    if (!user) {
        return <a href="/sign-in">Sign in</a>;
    }

    async function handleSignOut() {
        await signOut();
        window.location.assign("/");
    }

    return (
        <div className="account-menu">
            <button type="button">
                {user.firstName || user.primaryEmailAddress?.emailAddress}
            </button>

            <div className="account-menu-dropdown">
                <a href="/account">My account</a>

                <button type="button" onClick={handleSignOut}>
                    Sign out
                </button>
            </div>
        </div>
    );
}