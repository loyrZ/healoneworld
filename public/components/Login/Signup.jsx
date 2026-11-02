import { SignUp } from "@clerk/react";
import "./Login.css";

export default function Signup() {
    return (
        <main className="login-page">
            <SignUp
                routing="path"
                path="/sign-up"
                signInUrl="/sign-in"
                oauthFlow="redirect"
                forceRedirectUrl="/account"
                signInForceRedirectUrl="/account"
            />
        </main>
    );
}