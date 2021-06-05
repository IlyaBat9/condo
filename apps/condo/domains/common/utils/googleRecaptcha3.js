const isEmpty = require('lodash/isEmpty')
const conf = require('@core/config')
const Redis = require('ioredis')
const { SERVER_KEY } = conf.GOOGLE_RECAPTCHA_CONFIG ? JSON.parse(conf.GOOGLE_RECAPTCHA_CONFIG) : {}
const CAPTCHA_SCORE_URL = 'https://www.google.com/recaptcha/api/siteverify'
const WORKER_REDIS_URL = conf['WORKER_REDIS_URL']
const { SAFE_CAPTCHA_SCORE, LOCK_TIMEOUT } = require('@condo/domains/user/constants/common')
class RedisLock {

    constructor () {
        this.redisConnection = null
        this.prefix = 'LOCK_'
        this.connect()
    }

    connect () {
        this.redisConnection = new Redis(WORKER_REDIS_URL)
    }

    async lockExpiredTime (phoneNumber) {
        const time = await this.redisConnection.ttl(`${this.prefix}${phoneNumber}`)
        // -1: no ttl on variable, -2: key not exists
        return Math.max(time, 0)
    }

    async isLocked (phoneNumber) {
        const value = await this.redisConnection.exists(`${this.prefix}${phoneNumber}`)
        return !!value
    }

    async lock (phoneNumber, ttl = LOCK_TIMEOUT) {
        await this.redisConnection.set(`${this.prefix}${phoneNumber}`, '1')
        await this.redisConnection.expire(`${this.prefix}${phoneNumber}`, ttl)
    }

}

const SecurityLock = new RedisLock()

/*
Move to tests
const phoneToLock = '+79111111111'
SecurityLock.lock('+79111111111')
const interval = setInterval(async () => {
    const isLocked = await SecurityLock.isLocked(phoneToLock)
    const timeToLive = await SecurityLock.lockExpiredTime(phoneToLock)
    if (timeToLive === 0 || !isLocked) {
        console.log(`Lock is removed for phone ${phoneToLock} : ${isLocked}, TTL ${timeToLive}`)
        clearInterval(interval)
    }
    console.log(`Checking phone ${phoneToLock} : ${isLocked}, TTL ${timeToLive}`)
}, 1000)
*/


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
    SecurityLock,
    captchaCheck,
}
