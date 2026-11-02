import { SignIn } from "@clerk/react";
import "./Login.css";

export default function Login() {
    return (
        <main className="login-page">
            <SignIn
                routing="path"
                path="/sign-in"
                oauthFlow="redirect"
                forceRedirectUrl="/account"
                signUpForceRedirectUrl="/verify-email"
                signUpUrl="/sign-up"
            />
        </main>
    );
}