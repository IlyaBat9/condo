const { v4: uuid } = require('uuid')
const faker = require('faker')
const access = require('@core/keystone/access')
const conf = require('@core/config')
const { Text, DateTimeUtc, Checkbox, Integer } = require('@keystonejs/fields')
const { historical, uuided, softDeleted } = require('@core/keystone/plugins')
const { GQLListSchema, GQLCustomSchema } = require('@core/keystone/schema')
const { sendMessage } = require('@condo/domains/notification/utils/serverSchema')
const { normalizePhone } = require('@condo/domains/common/utils/phone')
const { captchaCheck, SecurityLock } = require('@condo/domains/common/utils/googleRecaptcha3')
const { SENDER_FIELD, DV_FIELD } = require('@condo/domains/common/schema/fields')
const { has, isEmpty } = require('lodash')

const { 
    TOO_MANY_REQUESTS, 
    CAPTCHA_CHECK_FAILED, 
    CONFIRM_PHONE_EXPIRED, 
    CONFIRM_PHONE_SMS_CODE_VERIFICATION_FAILED, 
    CONFIRM_PHONE_SMS_CODE_MAX_RETRIES_REACHED, 
} = require('@condo/domains/user/constants/errors')

const { COUNTRIES, RUSSIA_COUNTRY } = require('@condo/domains/common/constants/countries')
const { SMS_VERIFY_CODE_MESSAGE_TYPE } = require('@condo/domains/notification/constants')

const { 
    SMS_CODE_LENGTH, 
    SMS_CODE_TTL, 
    CONFIRM_PHONE_TOKEN_EXPIRY, 
    CONFIRM_PHONE_SMS_MAX_RETRIES,
    SMS_RESEND_TIMEOUT,
} = require('@condo/domains/user/constants/common')

const whiteList = conf.SMS_WHITE_LIST ? JSON.parse(conf.SMS_WHITE_LIST) : {}

const generateSmsCode = (phone) => {
    if (has(whiteList, phone)) { // Emulate firebase white list for development - don't send sms
        return Number(whiteList[phone])
    }
    return faker.datatype.number({ 
        min: Math.pow(10, SMS_CODE_LENGTH - 1), // example 6 symbols:  min = 10^(6-1) = 100000
        max: Math.pow(10, SMS_CODE_LENGTH) - 1, // max = 10^6-1 = 999999
    })
}

const ConfirmPhoneAction = new GQLListSchema('ConfirmPhoneAction', {
    fields: {
        dv: DV_FIELD,
        sender: SENDER_FIELD,
        phone: {
            schemaDoc: 'Phone. In international E.164 format without spaces',
            type: Text,
            kmigratorOptions: { null: true, unique: false },
            hooks: {
                resolveInput: ({ resolvedData }) => {
                    return normalizePhone(resolvedData['phone'])
                },
            },
        },
        token: {
            schemaDoc: 'Unique token to complete registration',
            type: Text,
            isUnique: true,
            isRequired: true,
        },
        smsCode: {
            schemaDoc: 'Last sms code sent to user',
            type: Integer,
            length: SMS_CODE_LENGTH,
        },
        smsCodeRequestedAt: {
            schemaDoc: 'Time when sms code was requested',
            type: DateTimeUtc,
            isRequired: true,
        },
        smsCodeExpiresAt: {
            schemaDoc: 'Time when sms code becomes not valid',
            type: DateTimeUtc,
            isRequired: true,
        },
        retries: {
            schemaDoc: 'Number of times sms code input from user failed',
            type: Integer,
            defaultValue: 0,
        },                
        isPhoneVerified: {
            schemaDoc: 'Phone verification flag. User verify phone by access to secret sms message',
            type: Checkbox,
            defaultValue: false,
        },
        requestedAt: {
            type: DateTimeUtc,
            isRequired: true,
        },
        expiresAt: {
            type: DateTimeUtc,
            isRequired: true,
        },
        completedAt: {
            type: DateTimeUtc,
            defaultValue: null,
        },
    },
    access: {
        auth: true,
        create: access.userIsAdmin,
        read: access.userIsAdmin,
        update: access.userIsAdmin,
        delete: access.userIsAdmin,
    },
    plugins: [uuided(), softDeleted(), historical()],
    adminDoc: 'A list of confirm  phone actions',
    adminConfig: {
        defaultPageSize: 50,
        maximumPageSize: 200,
        defaultColumns: 'phone, smsCode, requestedAt, retries',
    },
})


const ConfirmPhoneService = new GQLCustomSchema('ConfirmPhoneService', {
    mutations: [
        {
            access: true,
            schema: 'startConfirmPhoneAction(phone: String!, dv:Int!, sender: JSON!, captcha: String): String',
            resolver: async (parent, args, context, info, extra = {}) => {
                const { phone: inputPhone, captcha, sender, dv } = args
                if (!isEmpty(captcha)) {
                    const { isScorePassed, score } = await captchaCheck(captcha)
                    if (!isScorePassed) {
                        throw new Error(`${CAPTCHA_CHECK_FAILED}] bot activity detected ${score} / 1.0`)
                    } 
                }
                const phone = normalizePhone(inputPhone)
                const isLocked = await SecurityLock.isLocked(phone)
                if (isLocked) {
                    const lockTimeRemain = await SecurityLock.lockExpiredTime(phone)
                    throw new Error(`${TOO_MANY_REQUESTS}] retry in ${lockTimeRemain} seconds `)
                }                

                const token = uuid()
                const tokenExpiration = extra.extraTokenExpiration || parseInt(CONFIRM_PHONE_TOKEN_EXPIRY)
                const now = extra.extraNow || Date.now()
                const requestedAt = new Date(now).toISOString()
                const expiresAt = new Date(now + tokenExpiration).toISOString()
                const smsCode = generateSmsCode(phone)
                const smsCodeExpiresAt = new Date(now + SMS_CODE_TTL).toISOString()
                const smsCodeRequestedAt = new Date(now).toISOString()
                const variables = { 
                    dv,
                    sender,
                    phone,
                    smsCode,
                    token,
                    smsCodeRequestedAt,
                    smsCodeExpiresAt,
                    requestedAt,
                    expiresAt,
                }
                const { errors: createErrors } = await context.executeGraphQL({
                    context: context.createContext({ skipAccessControl: true }),
                    query: `
                        mutation createConfirmPhoneAction(
                          $dv: Int!,
                          $sender: JSON!,
                          $phone: String!,
                          $smsCode: Int!,
                          $token: String!,
                          $smsCodeRequestedAt: String!,
                          $smsCodeExpiresAt: String!,
                          $requestedAt: String!,
                          $expiresAt: String!,
                        ) {
                        createConfirmPhoneAction(data: {
                            dv:$dv,
                            sender:$sender,
                            phone: $phone,
                            smsCode: $smsCode,
                            token: $token,
                            smsCodeRequestedAt:$smsCodeRequestedAt,
                            smsCodeExpiresAt: $smsCodeExpiresAt,
                            requestedAt: $requestedAt,
                            expiresAt: $expiresAt,
                          }) {
                            id
                            token
                          }
                        }
                    `,
                    variables,
                })
                if (createErrors) {
                    console.error(createErrors)
                    throw new Error('[error]: Unable to create ConfirmPhoneAction')
                }
                const lang = COUNTRIES[RUSSIA_COUNTRY].locale
                await sendMessage(context, {
                    lang,
                    to: { phone },
                    type: SMS_VERIFY_CODE_MESSAGE_TYPE,
                    meta: {
                        dv: 1,
                        smsCode,                        
                    },
                    sender: sender,
                })
                return token
            },
        },
        {
            access: true,
            schema: 'confirmPhoneResendSms(token: String!, captcha: String): String',
            resolver: async (parent, args, context, info, extra) => {
                const { token, captcha } = args
                if (!isEmpty(captcha)) {
                    const { isScorePassed, score } = await captchaCheck(captcha)
                    if (!isScorePassed) {
                        throw new Error(`${CAPTCHA_CHECK_FAILED}] bot activity detected ${score} / 1.0`)
                    } 
                }
                const now = extra.extraNow || Date.now()
                const { errors: findErrors, data } = await context.executeGraphQL({
                    context: context.createContext({ skipAccessControl: true }),
                    query: `
                        query findConfirmPhoneFromToken($token: String!, $now: String!) {
                          confirmPhoneActions: allConfirmPhoneActions(where: { token: $token, expiresAt_gte: $now, completedAt: null }) {
                            id
                            phone
                            sender
                            retries
                          }
                        }
                    `,
                    variables: { token, now: new Date(now).toISOString() },
                })
                if (findErrors) {
                    console.error(findErrors)
                    throw new Error('[error]: Unable to find confirm phone action by token')
                }
                const { phone, retries, sender } = data[0]
                const isLocked = await SecurityLock.isLocked(phone)
                if (isLocked) {
                    const lockTimeRemain = await SecurityLock.lockExpiredTime(phone)
                    throw new Error(`${TOO_MANY_REQUESTS}] retry in ${lockTimeRemain} seconds `)
                }                
                await SecurityLock.lock(phone, SMS_RESEND_TIMEOUT)
                const newSmsCode = generateSmsCode(phone)
                const { errors: resendSmsError } = await context.executeGraphQL({
                    context: context.createContext({ skipAccessControl: true }),
                    query: `
                        mutation resendSmsCode($smsCode: Int!, $smsCodeRequestedAt: String!, $smsCodeExpiresAt: String!, $retries: Int! ) {
                          updateConfirmPhoneAction(id: $id, data: {
                                smsCode: $smsCode,
                                smsCodeExpiresAt: $smsCodeExpiresAt,
                                smsCodeRequestedAt: $smsCodeRequestedAt,
                                retries: $retries,
                          }) {
                            id
                          }
                        }           
                    `,
                    variables: {
                        smsCode: newSmsCode,
                        smsCodeExpiresAt: new Date(now + SMS_CODE_TTL).toISOString(),
                        smsCodeRequestedAt: new Date(now).toISOString(),
                        retries: retries + 1,
                    },
                })
                if (resendSmsError) {
                    console.error(resendSmsError)
                    throw new Error('[error]: Unable to resend SMS')   
                }   
                const lang = COUNTRIES[RUSSIA_COUNTRY].locale                
                await sendMessage(context, {
                    lang,
                    to: { phone },
                    type: SMS_VERIFY_CODE_MESSAGE_TYPE,
                    meta: {
                        dv: 1,
                        newSmsCode,                        
                    },
                    sender: sender,
                })
                return 'ok'
            },
        },
        {
            access: true,
            schema: 'confirmPhoneComplete(token: String!, smsCode: String!, captcha: String): String',
            resolver: async (parent, args, context, info, extra) => {
                const { token, smsCode, captcha } = args
                if (!isEmpty(captcha)) {
                    const { isScorePassed, score } = await captchaCheck(captcha)
                    if (!isScorePassed) {
                        throw new Error(`${CAPTCHA_CHECK_FAILED}] bot activity detected ${score} / 1.0`)
                    } 
                }
                const now = extra.extraNow || Date.now()                        
                const { errors: findErrors, data } = await context.executeGraphQL({
                    context: context.createContext({ skipAccessControl: true }),
                    query: `
                        query findConfirmPhoneAction($token: String!, $now: String!) {
                          confirmPhoneActions: allConfirmPhoneActions(where: { token: $token, expiresAt_gte: $now, completedAt: null }) {
                            id
                            smsCode
                            token
                            retries
                            smsCodeExpiresAt
                          }
                        }
                    `,
                    variables: { token, now: new Date(now).toISOString() },
                })

                if (findErrors || !data.confirmPhoneActions || !data.confirmPhoneActions.length) {
                    throw new Error(`${CONFIRM_PHONE_EXPIRED}] Unable to find confirm phone action`)
                }
                const { id, smsCode: actionSmsCode, retries } = data.confirmPhoneActions[0]
                if (actionSmsCode !== smsCode) {
                    const { errors: incrementRetriesError } = await context.executeGraphQL({
                        context: context.createContext({ skipAccessControl: true }),
                        query: `
                            mutation confirmPhoneIncrementRetries($id: ID!, $retries: Int!) {
                              updateConfirmPhoneAction(id: $id, data: {retries: $retries}) {
                                id
                              }
                            }           
                        `,
                        variables: { id, retries: retries + 1 },
                    })
                    if (incrementRetriesError) {
                        console.error(incrementRetriesError)
                        throw new Error('[error]: Unable to increment retries on confirm phone action')   
                    }
                    throw new Error(`${CONFIRM_PHONE_SMS_CODE_VERIFICATION_FAILED}]: SMSCode mismatch`)   
                }
                if ((retries + 1) >= CONFIRM_PHONE_SMS_MAX_RETRIES) {
                    const { errors: markAsFailedError } = await context.executeGraphQL({
                        context: context.createContext({ skipAccessControl: true }),
                        query: `
                            mutation markConfirmPhoneActionAsClosed($id: ID!, $now: String!) {
                              updateConfirmPhoneAction(id: $id, data: {completedAt: $now}) {
                                id
                                completedAt
                              }
                            }           
                        `,
                        variables: { id, now: new Date(now).toISOString() },
                    })
                    if (markAsFailedError) {
                        console.error(markAsFailedError)
                        throw new Error('[error]: Unable to mark confirm phone action as failed')   
                    } else {
                        throw new Error(`${CONFIRM_PHONE_SMS_CODE_MAX_RETRIES_REACHED}] Retries limit is excided try to confirm from start`)
                    }                    
                }
                const { errors: confirmPhoneCompleteErrors } = await context.executeGraphQL({
                    context: context.createContext({ skipAccessControl: true }),
                    query: `
                        mutation confirmPhoneComplete($id: ID!, $now: String!) {
                          updateConfirmPhoneAction(id: $id, data: {completedAt: $now, isPhoneVerified: true }) {
                            id
                            token
                          }
                        }           
                    `,
                    variables: { 
                        id, now: new Date(now).toISOString()
                    },
                })
                if (confirmPhoneCompleteErrors) {
                    console.error(confirmPhoneCompleteErrors)
                    throw new Error('[error]: Unable to set phone is confirmed')   
                }
                return token
            },
        },
    ],
})



module.exports = {
    ConfirmPhoneService,
    ConfirmPhoneAction,
}