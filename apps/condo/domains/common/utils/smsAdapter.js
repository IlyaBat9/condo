const { isEmpty, get, has } = require('lodash')
const fetch = require('node-fetch')
const conf = require('@core/config')

const SNGPhoneTest = /^((\+?7|8)(?!95[4-79]|99[08]|907|94[^0]|336)([348]\d|9[0-6789]|7[0247])\d{8}|\+?(99[^4568]\d{7,11}|994\d{9}|9955\d{8}|996[57]\d{8}|9989\d{8}|380[34569]\d{8}|375[234]\d{8}|372\d{7,8}|37[0-4]\d{8}))$/
// const AllCountriesTest = /^\+?([87](?!95[5-79]|99[08]|907|94[^0]|336)([348]\d|9[0-6789]|7[01247])\d{8}|[1246]\d{9,13}|68\d{7}|5[1-46-9]\d{8,12}|55[1-9]\d{9}|55[138]\d{10}|55[1256][14679]9\d{8}|554399\d{7}|500[56]\d{4}|5016\d{6}|5068\d{7}|502[45]\d{7}|5037\d{7}|50[4567]\d{8}|50855\d{4}|509[34]\d{7}|376\d{6}|855\d{8,9}|856\d{10}|85[0-4789]\d{8,10}|8[68]\d{10,11}|8[14]\d{10}|82\d{9,10}|852\d{8}|90\d{10}|96(0[79]|17[0189]|181|13)\d{6}|96[23]\d{9}|964\d{10}|96(5[569]|89)\d{7}|96(65|77)\d{8}|92[023]\d{9}|91[1879]\d{9}|9[34]7\d{8}|959\d{7,9}|989\d{9}|971\d{8,9}|97[02-9]\d{7,11}|99[^4568]\d{7,11}|994\d{9}|9955\d{8}|996[2579]\d{8}|9989\d{8}|380[345679]\d{8}|381\d{9}|38[57]\d{8,9}|375[234]\d{8}|372\d{7,8}|37[0-4]\d{8}|37[6-9]\d{7,11}|30[69]\d{9}|34[679]\d{8}|3459\d{11}|3[12359]\d{8,12}|36\d{9}|38[169]\d{8}|382\d{8,9}|46719\d{10})$/

const validateConfig = (config, required) => {
    const missedFields = required.filter(field => !get(config, field))
    if (!isEmpty(missedFields)) {
        console.error(`SMSadapter missing fields in config file: ${[missedFields.join(', ')]}`)
        return false
    }
    return true
}

class SMSAdapter {

    constructor (type = conf.SMS_PROVIDER || 'SMS') {
        this.whitelist = conf['SMS_WHITE_LIST'] ? JSON.parse(conf['SMS_API_CONFIG']) : {}
        this.adapter = null
        switch (type) {
            case 'SMS':
                this.adapter = new SmsRu()
                break
            case 'SMSC':
                this.adapter = new SmsCRu()
                break
            default:
                console.error(`Unknown SMS-adapter: ${type}`)
        }
    }

    async send ({ phone, message }) {
        if (!this.adapter.isPhoneSupported(phone)) {
            throw new Error(`Unsupported phone number ${phone}`)
        }
        if (has(this.whitelist, phone)) {
            console.log('whitelist sms send ', phone, this.whitelist[phone])
            return [true, {}]
        }
        const result = await this.adapter.send({ phone, message })
        return result
    }
}


class SmsRu {
    constructor () {
        const config = conf['SMS_API_CONFIG'] ? JSON.parse(conf['SMS_API_CONFIG']) : {}
        validateConfig(config, [
            'token',
            'from',
        ])
        this.api_url = config.api_url || 'https://sms.ru'
        this.token = config.token
        this.from = config.from
    }

    isPhoneSupported (phoneNumber) {
        return /^[+]7[0-9]{10}$/g.test(phoneNumber)
    }

    async send ({ phone, message }) {        
        // NOTE: &test=1 for testing
        const result = await fetch(
            `${this.api_url}/sms/send?api_id=${this.token}&to=${phone}&from=${this.from}&json=1`,
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                body: `msg=${encodeURI(message)}`,
            }
        )
        const json = await result.json()
        const status = json['status_code']
        const isOk = status === 100
        return [isOk, json]
    }
}

class SmsCRu {
    constructor () {
        const config = conf['SMSC_API_CONFIG'] ? JSON.parse(conf['SMSC_API_CONFIG']) : {}
        validateConfig(config, [
            'login',
            'password',
            'sender',
        ])
        this.api_url = config.api_url || 'https://smsс.ru'
        this.login = config.login
        this.password = config.password
        this.flash = config.flash || 0
        this.sender = config.sender
    }

    isPhoneSupported (phoneNumber) {
        return SNGPhoneTest.test(phoneNumber)
    }

    async send ({ phone, message }) {        
        const _t = (name, value) => {
            return `${name}=${encodeURI(value)}`
        }
        const result = await fetch(
            `${this.api_url}/sys/send.php`,
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                body: [
                    _t('login', this.login),
                    _t('psw', this.password),
                    _t('sender', this.sender),
                    _t('phones', phone),
                    _t('mes', message),
                    `flash=${this.flash}`,
                    'fmt=3', // JSON response
                ].join('&'),
            }
        )
        const json = await result.json()
        
        console.log('====== SMS =========')
        console.log('json', json)
        console.log('result', result)
        console.log('====== SMS =========')

        const status = json['status_code']
        const isOk = status === 100
        return [isOk, json]
    }
}


module.exports = {
    SMSAdapter,
}
