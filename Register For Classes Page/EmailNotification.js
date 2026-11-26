const EMAILJS_PUBLIC_KEY = "x3fGr3mu78pjU8ZxZ";
const EMAILJS_SERVICE_ID = "service_i8bkbve";
const EMAILJS_TEMPLATE_ID = "template_6n3waov";

async function sendClassNotification({
  to,
  firstName,
  className,
  action,
  classDate,
  classTime,
  classLocation
}) {
  console.log("sendClassNotification was called");
  const recipient = typeof to === "string" ? to.trim() : "";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(recipient)) 
    throw new Error("Invalid recipient email address.");
  if (!className || !className.trim()) 
    throw new Error("A class name is required.");
  if (!window.emailjs) 
    throw new Error("EmailJS was not loaded.");
  window.emailjs.init({publicKey:EMAILJS_PUBLIC_KEY});
  const messages = {
    registered: `Your registration for ${className} was successful.`,
    cancelled: `Your registration for ${className} was canceled.`,
    deleted: `Your registration for ${className} was permanently deleted.`
  };

  if (!messages[action]) 
    throw new Error(`Unsupported action: ${action}`);

  const templateParams = {
    to_email: recipient,
    to_name: firstName || "Customer",
    subject: `Registration ${action}: ${className}`,
    message: messages[action],
    class_name: className,
    class_date: classDate || "",
    class_time: classTime || "",
    class_location: classLocation || ""
  };

  console.log("About to send email:", templateParams);

  try {
    const response = await window.emailjs.send(
      EMAILJS_SERVICE_ID,
      EMAILJS_TEMPLATE_ID,
      templateParams
    );

    console.log("Email sent successfully:", response);
    return response;
  } catch (error) {
    console.error("EmailJS error:", error);
    throw error;
  }
}

window.sendClassNotification = sendClassNotification;