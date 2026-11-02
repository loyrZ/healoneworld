import { SignUp } from "@clerk/react";
import "./Login.css";
import "./Signup.css";

export default function Signup() {
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
                    forceRedirectUrl="/account"
                    signInForceRedirectUrl="/account"
                />
            </div>
        </main>
    );
}