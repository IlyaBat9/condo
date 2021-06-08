
const WRONG_PASSWORD_ERROR = '[passwordAuth:secret:mismatch'
const EMPTY_PASSWORD_ERROR = '[passwordAuth:secret:notSet'
const WRONG_EMAIL_ERROR = '[passwordAuth:identity:notFound'
const MULTIPLE_ACCOUNTS_MATCHES = '[resetPassword:identity:multipleFound'
const WRONG_PHONE_ERROR = '[passwordAuth:identity:notFound'
const AUTH_BY_PASSWORD_FAILED_ERROR = '[passwordAuth:failure'
const EMAIL_ALREADY_REGISTERED_ERROR = '[register:email:multipleFound'
const MIN_PASSWORD_LENGTH_ERROR = '[register:password:minLength'
const ALREADY_REGISTERED = '[unique:phone:multipleFound'
const RESET_TOKEN_NOT_FOUND = '[resetPassword:token:notFound'
const PASSWORD_TOO_SHORT = '[password:min:length'

const CONFIRM_PHONE_EXPIRED = '[confirm:phone:experied' 
const CONFIRM_PHONE_SMS_CODE_VERIFICATION_FAILED = '[confirm:phone:smscode:verify:failed'
const CONFIRM_PHONE_SMS_CODE_MAX_RETRIES_REACHED = '[confirm:phone:smscode:tooManyRequests'
const TOO_MANY_REQUESTS = '[security:tooManyRequests'
const CAPTCHA_CHECK_FAILED = '[security:captcha:failed'

module.exports = {
    WRONG_PASSWORD_ERROR,
    EMPTY_PASSWORD_ERROR,
    WRONG_EMAIL_ERROR,
    ALREADY_REGISTERED,
    MULTIPLE_ACCOUNTS_MATCHES,
    WRONG_PHONE_ERROR,
    TOO_MANY_REQUESTS,
    CAPTCHA_CHECK_FAILED,
    PASSWORD_TOO_SHORT,
    AUTH_BY_PASSWORD_FAILED_ERROR,
    EMAIL_ALREADY_REGISTERED_ERROR,
    RESET_TOKEN_NOT_FOUND,
    MIN_PASSWORD_LENGTH_ERROR,
    CONFIRM_PHONE_EXPIRED,
    CONFIRM_PHONE_SMS_CODE_VERIFICATION_FAILED,
    CONFIRM_PHONE_SMS_CODE_MAX_RETRIES_REACHED,
}