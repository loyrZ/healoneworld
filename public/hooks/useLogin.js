import { useState } from "react";
import { useSignIn } from "@clerk/react";

export function useLogin({ redirectTo = "/account" } = {}) {
  const { isLoaded, signIn, setActive } = useSignIn();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();

    if (!email || !password) {
      setError("Email and password are required.");
      return;
    }

    if (!isLoaded || isSubmitting) return;

    setError("");
    setIsSubmitting(true);

    try {
      const result = await signIn.create({
        identifier: email,
        password,
      });

      if (result.status !== "complete") {
        setError("Additional verification is required.");
        return;
      }

      await setActive({ session: result.createdSessionId });
      window.location.assign(redirectTo);
    } catch {
      setError("Invalid email or password.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return {
    email,
    password,
    error,
    isLoaded,
    isSubmitting,
    setEmail,
    setPassword,
    handleSubmit,
  };
}
