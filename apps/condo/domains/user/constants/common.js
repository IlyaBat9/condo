const MIN_PASSWORD_LENGTH = 8
const LOCK_TIMEOUT = 5  // 5 seconds
const SMS_CODE_LENGTH = 6
const SMS_CODE_TTL = 60 // seconds
const CONFIRM_PHONE_ACTION_EXPIRY = 3600 // 1 hour
const CONFIRM_PHONE_SMS_MAX_RETRIES = 10

module.exports = {
    MIN_PASSWORD_LENGTH,
    LOCK_TIMEOUT,
    SMS_CODE_LENGTH,
    SMS_CODE_TTL,
    CONFIRM_PHONE_ACTION_EXPIRY,
    CONFIRM_PHONE_SMS_MAX_RETRIES,
}
