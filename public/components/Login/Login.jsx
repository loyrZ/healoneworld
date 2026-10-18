import { useLogin } from "../../hooks/useLogin.js";

function Login() {
    const {
        email,
        password,
        error,
        isLoaded,
        isSubmitting,
        setEmail,
        setPassword,
        handleSubmit,
    } = useLogin();

    const page = {
        minHeight: "100vh",
        boxSizing: "border-box",
        border: "4px solid #2e5ba8",
        background: "#eef8f7",
        color: "#082d47",
        fontFamily: "Arial, Helvetica, sans-serif",
    };

    const button = {
        border: 0,
        borderRadius: "5px",
        background: "#082d47",
        color: "#fff",
        fontSize: "9px",
    };

    const input = {
        width: "100%",
        height: "28px",
        boxSizing: "border-box",
        marginBottom: "10px",
        padding: "0 9px",
        border: "1px solid #d6dfe2",
        borderRadius: "5px",
        fontSize: "8px",
    };

    return (
        <div style={page}>
            <header style={{
                height: "54px",
                padding: "0 42px",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                background: "#fff",
            }}>
                <div style={{
                    width: "36px",
                    height: "36px",
                    display: "grid",
                    placeItems: "center",
                    border: "2px solid #08344d",
                    borderRadius: "50%",
                    background: "linear-gradient(145deg, #efb63c, #46a86d, #4c9fc1)",
                    color: "#fff",
                    fontFamily: "Georgia, serif",
                    fontSize: "13px",
                    fontWeight: "bold",
                    fontStyle: "italic",
                }}>
                    H4W
                </div>

                <nav style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "25px",
                    fontSize: "9px",
                }}>
                    <span>Classes</span>
                    <span>Programs</span>
                    <span>Volunteer</span>
                    <span>Rent Our Space</span>
                    <span>About</span>
                    <span>Blog</span>
                    <span style={{
                        height: "16px",
                        borderLeft: "1px solid #d8e0e3",
                    }} />
                    <span>Sign In</span>
                    <button type="button" style={{
                        ...button,
                        borderRadius: "16px",
                        padding: "8px 15px",
                    }}>
                        Donate
                    </button>
                </nav>
            </header>

            <main style={{
                minHeight: "calc(100vh - 54px)",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                paddingTop: "78px",
                boxSizing: "border-box",
            }}>
                <section style={{
                    width: "280px",
                    minHeight: "274px",
                    boxSizing: "border-box",
                    padding: "25px 26px 22px",
                    borderRadius: "9px",
                    background: "#fff",
                }}>
                    <h1 style={{
                        margin: 0,
                        color: "#0b304b",
                        fontFamily: "Georgia, Times New Roman, serif",
                        fontSize: "22px",
                        fontWeight: "normal",
                    }}>
                        Welcome back
                    </h1>

                    <p style={{
                        margin: "9px 0 14px",
                        fontSize: "9px",
                    }}>
                        Sign in to manage your classes and account.
                    </p>

                    <form onSubmit={handleSubmit} noValidate>
                        <label htmlFor="email" style={{
                            display: "block",
                            marginBottom: "4px",
                            fontSize: "8px",
                        }}>
                            Email address
                        </label>

                        <input
                            id="email"
                            type="email"
                            placeholder="name@example.com"
                            value={email}
                            onChange={(event) => setEmail(event.target.value)}
                            style={input}
                            required
                        />

                        <label htmlFor="password" style={{
                            display: "block",
                            marginBottom: "4px",
                            fontSize: "8px",
                        }}>
                            Password
                        </label>

                        <input
                            id="password"
                            type="password"
                            placeholder="********"
                            value={password}
                            onChange={(event) => setPassword(event.target.value)}
                            style={input}
                            required
                        />

                        {error && (
                            <p
                                role="alert"
                                style={{
                                    margin: "-3px 0 8px",
                                    color: "#b42318",
                                    fontSize: "8px",
                                }}
                            >
                                {error}
                            </p>
                        )}

                        <button
                            type="submit"
                            disabled={!isLoaded || isSubmitting}
                            style={{
                                ...button,
                                padding: "8px 14px",
                                opacity: !isLoaded || isSubmitting ? 0.65 : 1,
                            }}
                        >
                            {isSubmitting ? "Signing in..." : "Sign in"}
                        </button>
                    </form>

                    <div style={{
                        display: "flex",
                        justifyContent: "space-between",
                        marginTop: "10px",
                        fontSize: "8px",
                    }}>
                        <span>Create account</span>
                        <span>Forgot password?</span>
                    </div>

                    <span style={{
                        display: "block",
                        marginTop: "11px",
                        fontSize: "8px",
                    }}>
                        Volunteer portal (prototype)
                    </span>
                </section>

                <button
                    type="button"
                    style={{
                        ...button,
                        marginTop: "9px",
                        padding: "8px 13px",
                    }}
                >
                    Admin login (prototype)
                </button>
            </main>
        </div>
    );
}

export default Login;