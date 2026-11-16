const EMAILJS_PUBLIC_KEY = "x3fGr3mu78pjU8ZxZ";
const EMAILJS_SERVICE_ID = "bqAfJm0xLN7iiE2n1nDZG";
const EMAILJS_TEMPLATE_ID = "template_w8q9i0f";

emailjs.init({
  publicKey: EMAILJS_PUBLIC_KEY
});

async function sendClassNotification({
  to,
  firstName,
  className,
  action,
  classDate,
  classTime,
  classLocation
}) {
  return emailjs.send(
    EMAILJS_SERVICE_ID,
    EMAILJS_TEMPLATE_ID,
    {
      to_email: to,
      to_name: firstName || "Customer",
      subject: `Registration ${action}: ${className}`,
      message:
        action === "registered"
          ? `Your registration for ${className} was successful.`
          : `Your registration for ${className} was canceled.`,
      class_name: className,
      class_date: classDate || "",
      class_time: classTime || "",
      class_location: classLocation || ""
    }
  );
}

window.sendClassNotification = sendClassNotification;