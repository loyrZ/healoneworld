"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

async function setup(options = {}) {
    const helpers = await import("../public/utils/emailVerification.mjs");
    const slots = [];
    let cursor = 0;

    const calls = {
        verify: 0,
        resend: 0,
        activate: 0
    };

    const identity = {
        isLoaded: true,
        isSignedIn: false,
        user: null
    };

    const signup = {
        id: "signup_test",
        status: "missing_requirements",
        emailAddress: "test@example.com",
        verifications: {
            emailAddress: { status: "unverified" }
        },

        async attemptEmailAddressVerification({ code }) {
            calls.verify += 1;
            assert.equal(code, "123456");

            if (options.verificationError) {
                throw {
                    code: options.verificationError,
                    message: "Private provider details"
                };
            }

            if (options.unconfirmed) return signup;

            signup.status = "complete";
            signup.createdSessionId = "session_test";
            signup.verifications.emailAddress.status = "verified";
            return signup;
        },

        async prepareEmailAddressVerification({ strategy }) {
            calls.resend += 1;
            assert.equal(strategy, "email_code");

            if (options.send) await options.send();

            signup.verifications.emailAddress.status = "unverified";
            return signup;
        }
    };

    const sandbox = {
        module: { exports: {} },
        ...helpers,

        useState(initial) {
            const index = cursor++;
            if (!(index in slots)) slots[index] = initial;

            return [
                slots[index],
                value => {
                    slots[index] = typeof value === "function"
                        ? value(slots[index])
                        : value;
                }
            ];
        },

        useRef(initial) {
            const index = cursor++;
            if (!(index in slots)) slots[index] = { current: initial };
            return slots[index];
        },

        useUser() {
            return identity;
        },

        useSignUp() {
            return {
                isLoaded: true,
                signUp: signup,

                async setActive({ session }) {
                    calls.activate += 1;
                    assert.equal(session, "session_test");

                    if (options.activationError) {
                        throw new Error("Activation unavailable");
                    }

                    identity.isSignedIn = true;
                    identity.user = {
                        primaryEmailAddress: {
                            verification: { status: "verified" }
                        }
                    };
                }
            };
        }
    };

    const filename = path.join(
        __dirname,
        "..",
        "public",
        "hooks",
        "useEmailVerification.js"
    );

    // Supply simulated hooks without loading the browser Clerk SDK.
    const source = fs.readFileSync(filename, "utf8")
        .replace(/^import[\s\S]*?;\s*/gm, "")
        .replace(
            "export function useEmailVerification",
            "function useEmailVerification"
        );

    vm.runInNewContext(
        `${source}\nmodule.exports = useEmailVerification;`,
        sandbox,
        { filename }
    );

    function render() {
        cursor = 0;
        return sandbox.module.exports();
    }

    function enterCode() {
        render().setCode("123456");
        return render();
    }

    return { render, enterCode, signup, identity, calls };
}

test("successful verification activates the Clerk session", async () => {
    const state = await setup();

    await state.enterCode().verifyCode();

    assert.equal(state.calls.activate, 1);
    assert.equal(state.render().status, "success");
    assert.equal(state.render().code, "");
});

for (const [code, message] of [
    ["form_code_incorrect", /incorrect/i],
    ["verification_expired", /expired/i],
    ["too_many_requests", /wait/i]
]) {
    test(`handles ${code} without activating a session`, async () => {
        const state = await setup({ verificationError: code });

        await state.enterCode().verifyCode();

        assert.equal(state.calls.activate, 0);
        assert.equal(state.render().status, "failure");
        assert.match(state.render().message, message);
        assert.equal(state.render().code, "123456");
        assert.doesNotMatch(
            state.render().message,
            /Private provider details/
        );
    });
}

test("an unconfirmed result never reports success", async () => {
    const state = await setup({ unconfirmed: true });

    await state.enterCode().verifyCode();

    assert.equal(state.render().status, "failure");
    assert.equal(state.calls.activate, 0);
});

test("blank codes do not send a verification request", async () => {
    const state = await setup();

    await state.render().verifyCode();

    assert.equal(state.calls.verify, 0);
    assert.match(state.render().message, /enter.*code/i);
});

test("resending requests another code through Clerk", async () => {
    const state = await setup();
    state.signup.verifications.emailAddress.status = "expired";

    assert.equal(state.render().status, "expired");
    await state.render().resendCode();

    assert.equal(state.calls.resend, 1);
    assert.equal(state.render().status, "pending");
    assert.match(state.render().message, /new code/i);
});

test("network failures do not report a code as sent", async () => {
    const state = await setup({
        send: async () => {
            throw new Error("Private network details");
        }
    });

    await state.render().resendCode();

    assert.equal(state.render().status, "failure");
    assert.match(state.render().message, /connection/i);
    assert.doesNotMatch(state.render().message, /Private network details/);
});

test("repeated clicks send only one in-flight request", async () => {
    let finish;
    const pending = new Promise(resolve => {
        finish = resolve;
    });

    const state = await setup({ send: () => pending });

    const first = state.render().resendCode();
    const second = state.render().resendCode();

    assert.equal(state.render().status, "sending");
    assert.equal(state.calls.resend, 1);
    assert.equal(state.render().canResend, false);

    finish();
    await Promise.all([first, second]);

    assert.equal(state.render().isBusy, false);
});

test("a lost signup shows a restart state", async () => {
    const state = await setup();
    state.signup.id = null;

    assert.equal(state.render().status, "restart");
    assert.equal(state.render().canVerify, false);
});

test("session activation failure remains recoverable", async () => {
    const state = await setup({ activationError: true });

    await state.enterCode().verifyCode();

    assert.equal(state.render().status, "failure");
    assert.equal(state.identity.isSignedIn, false);
    assert.equal(state.render().canFinish, true);
});