import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

async function resendEmail(to, token, type = "forgot-password") {
  const isVerification = type === "verify-email";

  const subject = isVerification ? "Verify Your Email" : "Forgot Password";
  const heading = isVerification ? "Verify Your Email" : "Forgot Password";
  const body = isVerification
    ? "Thanks for signing up! Click the button below to verify your email address."
    : "We received a request to reset your password. Click the button below to proceed.";
  const link = isVerification
    ? `${process.env.FRONTEND_URL}/verify-email?token=${token}`
    : `${process.env.FRONTEND_URL}/reset-password?token=${token}`;
  const buttonText = isVerification ? "Verify Email" : "Reset Password";

  const { data, error } = await resend.emails.send({
    from: "Acme <onboarding@resend.dev>",
    to: [to],
    subject,
    html: `
  <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; padding: 24px; border: 1px solid #e0e0e0; border-radius: 8px;">
    <h1 style="font-size: 22px; font-weight: bold; color: #1a1a1a;">${heading}</h1>
    <p style="font-size: 15px; color: #444; line-height: 1.6;">${body}</p>
    <a href="${link}" style="display: inline-block; margin-top: 16px; padding: 12px 24px; background-color: #ff4500; color: #fff; text-decoration: none; border-radius: 6px; font-size: 15px; font-weight: bold;">
      ${buttonText}
    </a>
    <p style="font-size: 13px; color: #999; margin-top: 24px;">
      If you didn't request this, you can safely ignore this email.
    </p>
  </div>
`,
  });

  if (error) {
    return { message: "could not send an email", err: error.message };
  }

  return { message: "email sent successfully", data };
}

export default resendEmail;
