/* HOW-286 / HOW-566: one confirm dialog for "cancel class" and "remove attendee".
   Figma: "Prototype / Cancel this registration?" (358:9840): title, short message,
   main action, then a "Keep ..." button. */

import { useEffect, useRef } from "react";

function ConfirmDialog({ title, message, confirmLabel, cancelLabel, busy, error, onConfirm, onClose }) {
    const dialogRef = useRef(null);
    const keepRef = useRef(null);

    useEffect(() => {
        const dialog = dialogRef.current;
        const opener = document.activeElement;

        // Native modal <dialog> keeps Tab inside it and closes on Escape.
        if (!dialog.open) dialog.showModal();
        // Start on the safe choice so Enter doesn't cancel a class by accident.
        keepRef.current?.focus();

        // Focus goes back to the button that opened the dialog. A removed attendee's
        // Remove button is gone by then, so fall back to the page's main content (HOW-566).
        return () => {
            if (opener instanceof HTMLElement && opener.isConnected) {
                opener.focus();
            } else {
                document.getElementById("main-content")?.focus();
            }
        };
    }, []);

    // Escape is ignored while a request is in flight, so the result isn't lost.
    function handleCancel(event) {
        if (busy) event.preventDefault();
    }

    return (
        <dialog
            ref={dialogRef}
            className="admin-confirm"
            aria-labelledby="admin-confirm-title"
            onCancel={handleCancel}
            onClose={onClose}
        >
            <h2 id="admin-confirm-title">{title}</h2>
            <p>{message}</p>
            {error && <p role="alert" className="admin-roster__message--error">{error}</p>}
            <div className="admin-confirm__actions">
                <button type="button" className="button admin-roster__danger" onClick={onConfirm} disabled={busy}>
                    {busy ? "Saving…" : confirmLabel}
                </button>
                <button ref={keepRef} type="button" className="button button--outline" onClick={onClose} disabled={busy}>
                    {cancelLabel}
                </button>
            </div>
        </dialog>
    );
}

export default ConfirmDialog;
