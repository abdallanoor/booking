import twilio from "twilio";

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const verifyServiceSid = process.env.TWILIO_VERIFY_SERVICE_SID;

function getClient() {
  if (!accountSid || !authToken || !verifyServiceSid) {
    throw new Error("Twilio credentials are not configured");
  }
  return twilio(accountSid, authToken);
}

/**
 * Send OTP to a phone number via SMS (switch to "whatsapp" later for cheaper delivery)
 */
export async function sendPhoneOtp(phone: string) {
  const client = getClient();
  return client.verify.v2
    .services(verifyServiceSid!)
    .verifications.create({ to: phone, channel: "sms" });
}

/**
 * Verify the OTP code entered by the user
 */
export async function verifyPhoneOtp(phone: string, code: string) {
  const client = getClient();
  return client.verify.v2
    .services(verifyServiceSid!)
    .verificationChecks.create({ to: phone, code });
}
