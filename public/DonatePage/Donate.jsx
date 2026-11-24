import { useState } from "react";
import { formatDonationAmount, normalizeDonationAmount } from "./donation-demo.mjs";
import "./Donate.css";

const SUGGESTED_AMOUNTS = [10, 25, 50, 100];

function Donate() {
    const [amount, setAmount] = useState("");
    const [confirmation, setConfirmation] = useState("");
    const [error, setError] = useState("");

    function selectAmount(selectedAmount) {
        setAmount(String(selectedAmount));
        setConfirmation("");
        setError("");
    }

    function handleAmountChange(event) {
        setAmount(event.target.value);
        setConfirmation("");
        setError("");
    }

    function handleSubmit(event) {
        event.preventDefault();

        const selectedAmount = normalizeDonationAmount(amount);

        if (selectedAmount === null) {
            setConfirmation("");
            setError("Enter a donation amount greater than $0 to preview the demo.");
            return;
        }

        setError("");
        setConfirmation(
            `Demo confirmation: ${formatDonationAmount(selectedAmount)} selected. No payment was processed and no donation was received.`
        );
    }

    return (
        <main className="donate-page" id="main-content" tabIndex={-1}>
            <section className="donate-hero" aria-labelledby="donate-heading">
                <div className="container donate-hero__content">
                    <p className="section-eyebrow">Support Heal One World</p>
                    <h1 id="donate-heading">Help keep wellness within reach.</h1>
                    <p>
                        Donations help Heal One World continue offering free and
                        donation-based wellness classes, supportive resources, and a
                        welcoming space for the community.
                    </p>
                    <p className="donate-notice">
                        <strong>Donation demonstration only.</strong> This page does
                        not process payments, collect card details, or record donations.
                    </p>
                </div>
            </section>

            <section className="container donate-content" aria-labelledby="demo-heading">
                <div className="donate-copy">
                    <h2>What your support makes possible</h2>
                    <p>
                        Every gift, whatever the amount, helps sustain accessible
                        opportunities for people to explore practices that support their
                        body, mind, and spirit.
                    </p>
                    <p>
                        Heal One World is powered by volunteers and believes no one
                        should be turned away because they cannot afford to participate.
                    </p>
                </div>

                <form className="donate-demo" onSubmit={handleSubmit} noValidate>
                    <p className="section-eyebrow">Interactive preview</p>
                    <h2 id="demo-heading">Choose a demonstration amount</h2>
                    <p className="donate-demo__intro">
                        Select an amount or enter your own to see a sample confirmation.
                    </p>

                    <div className="donate-amounts" aria-label="Suggested donation amounts">
                        {SUGGESTED_AMOUNTS.map((suggestedAmount) => (
                            <button
                                className="button button--outline"
                                type="button"
                                key={suggestedAmount}
                                aria-pressed={Number(amount) === suggestedAmount}
                                onClick={() => selectAmount(suggestedAmount)}
                            >
                                {formatDonationAmount(suggestedAmount)}
                            </button>
                        ))}
                    </div>

                    <label className="donate-custom-amount" htmlFor="donation-amount">
                        Custom demonstration amount
                        <span>$</span>
                        <input
                            id="donation-amount"
                            inputMode="decimal"
                            min="0.01"
                            name="donation-amount"
                            onChange={handleAmountChange}
                            placeholder="25.00"
                            step="0.01"
                            type="number"
                            value={amount}
                        />
                    </label>

                    <button className="button button--primary" type="submit">
                        Preview donation confirmation
                    </button>

                    {error && <p className="donate-demo__error" role="alert">{error}</p>}
                    {confirmation && (
                        <p className="donate-demo__confirmation" role="status" aria-live="polite">
                            {confirmation}
                        </p>
                    )}
                    <p className="donate-demo__disclaimer">
                        This is a demo. No payment is processed, and no real donation is made.
                    </p>
                </form>
            </section>
        </main>
    );
}

export default Donate;