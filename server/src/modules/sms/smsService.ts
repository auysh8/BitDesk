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
 * Sends a 6-digit OTP SMS via Fast2SMS (Indian carrier) or Twilio
 */
export const sendOtpSms = async (
  phone: string,
  otp: string,
  purpose: string = "Verification",
): Promise<boolean> => {
  if (!phone) return false;

  const formattedPhone = formatPhoneNumber(phone);
  const clean10Digits = formattedPhone.slice(-10);

  // 1. Fast2SMS Integration (Instant Indian SMS with zero template approval required)
  if (appConfig.FAST2SMS_API_KEY) {
    try {
      const res = await fetch("https://www.fast2sms.com/dev/bulkV2", {
        method: "POST",
        headers: {
          authorization: appConfig.FAST2SMS_API_KEY,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          route: "otp",
          variables_values: otp,
          numbers: clean10Digits,
        }),
      });

      const data: any = await res.json().catch(() => null);
      if (data?.return) {
        console.log(
          `[SMS Service - Fast2SMS] Dispatched ${purpose} SMS to +91${clean10Digits}`,
        );
        return true;
      }
      console.warn(
        `[SMS Service - Fast2SMS Error]:`,
        data?.message || "Failed to deliver SMS",
      );
    } catch (err: any) {
      console.error(`[SMS Service - Fast2SMS Network Error]:`, err.message);
    }
  }

  // 2. Twilio Integration
  const {
    TWILIO_ACCOUNT_SID,
    TWILIO_AUTH_TOKEN,
    TWILIO_PHONE_NUMBER,
    TWILIO_VERIFY_SERVICE_SID,
  } = appConfig;

  if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN) {
    console.log(
      `[SMS Service - Dev Log] SMS Provider not active. Code for ${formattedPhone}: ${otp}`,
    );
    return false;
  }

  const authHeader = Buffer.from(
    `${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`,
  ).toString("base64");

  try {
    // 2a. Twilio Verify Service (If configured)
    if (TWILIO_VERIFY_SERVICE_SID) {
      const verifyRes = await fetch(
        `https://verify.twilio.com/v2/Services/${TWILIO_VERIFY_SERVICE_SID}/Verifications`,
        {
          method: "POST",
          headers: {
            Authorization: `Basic ${authHeader}`,
            "Content-Type": "application/x-www-form-urlencoded",
          },
          body: new URLSearchParams({
            To: formattedPhone,
            Channel: "sms",
            CustomCode: otp,
          }),
        },
      );

      const verifyData: any = await verifyRes.json().catch(() => null);

      if (verifyRes.ok) {
        console.log(
          `[SMS Service - Twilio Verify] Dispatched ${purpose} OTP to ${formattedPhone} (SID: ${verifyData?.sid})`,
        );
        return true;
      }
      console.warn(
        `[SMS Service - Twilio Verify]: ${verifyData?.message || "Verification request failed"}`,
      );
    }

    // 2b. Twilio Programmable Messages API
    if (TWILIO_PHONE_NUMBER) {
      const messageBody = `Your BitDesk ${purpose} code is: ${otp}. Valid for 10 minutes.`;

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

      if (res.ok) {
        console.log(
          `[SMS Service - Twilio] Dispatched ${purpose} SMS to ${formattedPhone} (SID: ${data?.sid})`,
        );
        return true;
      }

      console.error(
        `[SMS Service - Twilio Error] Failed sending OTP to ${formattedPhone}:`,
        data?.message || res.statusText,
      );
    }
  } catch (err: any) {
    console.error(
      `[SMS Service - Twilio Network Error] Failed sending SMS to ${formattedPhone}:`,
      err.message,
    );
  }

  return false;
};
