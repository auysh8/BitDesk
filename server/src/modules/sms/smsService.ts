// server/src/modules/sms/smsService.ts
import appConfig from "../../config/config.js";

/**
 * Normalizes phone number into E.164 international standard format
 * Defaults to Indian country code (+91) if 10 digits without code
 */
export const formatPhoneNumber = (phone: string): string => {
  if (!phone) return "";
  let cleaned = phone.replace(/[\s\-\(\)]/g, "").trim();

  if (!cleaned.startsWith("+")) {
    if (cleaned.length === 10) {
      cleaned = `+91${cleaned}`;
    } else if (cleaned.startsWith("91") && cleaned.length === 12) {
      cleaned = `+${cleaned}`;
    } else {
      cleaned = `+${cleaned}`;
    }
  }

  return cleaned;
};

/**
 * Sends a 6-digit OTP SMS using Twilio REST API
 */
export const sendOtpSms = async (
  phone: string,
  otp: string,
  purpose: string = "Verification",
): Promise<boolean> => {
  if (!phone) return false;

  const formattedPhone = formatPhoneNumber(phone);
  const { TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_PHONE_NUMBER } =
    appConfig;

  // If Twilio credentials are not set, log safely and return
  if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN || !TWILIO_PHONE_NUMBER) {
    console.log(
      `[SMS Service - Dev Log] Twilio not configured. OTP for ${formattedPhone}: ${otp}`,
    );
    return false;
  }

  try {
    const authHeader = Buffer.from(
      `${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`,
    ).toString("base64");

    const messageBody = `Your BitDesk ${purpose} code is: ${otp}. Valid for 10 minutes. Do not share this code with anyone.`;

    const res = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_ACCOUNT_SID}/Messages.json`,
      {
        method: "POST",
        headers: {
          Authorization: `Basic ${authHeader}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          To: formattedPhone,
          From: TWILIO_PHONE_NUMBER,
          Body: messageBody,
        }),
      },
    );

    const data: any = await res.json().catch(() => null);

    if (!res.ok) {
      console.error(
        `[SMS Service - Twilio Error] Failed sending OTP to ${formattedPhone}:`,
        data?.message || res.statusText,
      );
      if (data?.code === 21608) {
        console.warn(
          `[SMS Service - Twilio Trial Warning] The number ${formattedPhone} is unverified on Twilio Trial. Verify it at https://console.twilio.com/us1/develop/phone-numbers/manage/verified`,
        );
      }
      return false;
    }

    console.log(
      `[SMS Service - Twilio] Dispatched ${purpose} SMS to ${formattedPhone} (SID: ${data?.sid})`,
    );
    return true;
  } catch (err: any) {
    console.error(
      `[SMS Service - Network Error] Failed sending SMS to ${formattedPhone}:`,
      err.message,
    );
    return false;
  }
};
