import { SignIn } from "@clerk/react";
import "../Login/Login.css";

export default function ClassesSignIn() {
    return (
        <main className="login-page">
            <SignIn
                routing="path"
                path="/classes/sign-in"
                oauthFlow="redirect"
                forceRedirectUrl="/user-classes"
                signUpForceRedirectUrl="/user-classes"
                signUpUrl="/sign-up"
            />
        </main>
    );
}
