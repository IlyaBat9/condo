const isEmpty = require('lodash/isEmpty')
const { SAFE_CAPTCHA_SCORE } = require('@condo/domains/user/constants/common')
const conf = require('@core/config')
const { SERVER_KEY } = conf.GOOGLE_RECAPTCHA_CONFIG ? JSON.parse(conf.GOOGLE_RECAPTCHA_CONFIG) : {}

const CAPTCHA_SCORE_URL = 'https://www.google.com/recaptcha/api/siteverify'

if (isEmpty(SERVER_KEY)) {
    console.error('Google reCaptcha not configured')
}

const onCaptchaCheck = ({ success, challenge_ts, hostname, score, action }) => {
    console.log(
        (score < SAFE_CAPTCHA_SCORE) ? '\x1b[31m' : '\x1b[32m',
        `Recaptcha: ${action} - [${score}]: ${success}`,         
        challenge_ts, 
        hostname,
        '\x1b[0m'
    )
} 

const captchaCheck = async (response) => {
    const serverAnswer = await fetch(CAPTCHA_SCORE_URL, {
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
        },
        method: 'POST',
        body: `secret=${SERVER_KEY}&response=${response}`,
    })
    if (serverAnswer.ok) {
        const result = await serverAnswer.json()
        onCaptchaCheck(result)
        return result
    } else {
        console.log('BAD Server response: ', serverAnswer)
    }
}

module.exports = {
    captchaCheck,
}
