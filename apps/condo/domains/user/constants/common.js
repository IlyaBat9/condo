const MIN_PASSWORD_LENGTH = 8
const SMS_CODE_LENGTH = 6
// need some tests not on localhost before setting to 0.3
const SAFE_CAPTCHA_SCORE = 0.0 

const CONFIRM_PHONE_SMS_MAX_RETRIES = 3

const LOCK_TIMEOUT = 5  // 5 seconds
const SMS_CODE_TTL = 30 * 1000 // 30 seconds
const CONFIRM_PHONE_TOKEN_EXPIRY = 1000 * 60 * 60 * 1 // 1 hour
const SMS_RESEND_TIMEOUT = 30 * 1000 // 30 seconds

module.exports = {
    MIN_PASSWORD_LENGTH,
    SMS_CODE_LENGTH,
    CONFIRM_PHONE_SMS_MAX_RETRIES,
    SMS_CODE_TTL,
    LOCK_TIMEOUT,
    SAFE_CAPTCHA_SCORE,
    CONFIRM_PHONE_TOKEN_EXPIRY,
    SMS_RESEND_TIMEOUT,
}
