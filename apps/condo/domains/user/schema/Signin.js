const { v4: uuid } = require('uuid')
const faker = require('faker')
const { Text, DateTimeUtc, Checkbox, Integer } = require('@keystonejs/fields')
const { historical, uuided, softDeleted } = require('@core/keystone/plugins')
const { GQLListSchema, GQLCustomSchema } = require('@core/keystone/schema')
const access = require('@core/keystone/access')
const conf = require('@core/config')

const { SMS_VERIFY_CODE } = require('@condo/domains/notification/constants')
const { sendMessage } = require('@condo/domains/notification/utils/serverSchema')
const { COUNTRIES, RUSSIA_COUNTRY } = require('@condo/domains/common/constants/countries')
const { SIGNIN_EXPIRED, SIGNIN_SMS_CODE_EXPIRED, SIGNIN_SMS_CODE_VERIFICATION_FAILED, SIGNIN_SMS_CODE_MAX_VERIFICATION_NUMBER_REACHED } = require('@condo/domains/user/constants/errors')
const { SMS_CODE_LENGTH, SMS_CODE_TTL } = require('@condo/domains/user/constants/common')
const { normalizePhone } = require('@condo/domains/common/utils/phone')
const { captchaCheck } = require('@condo/domains/common/utils/googleRecaptcha3')
const isEmpty = require('lodash/isEmpty')

const SIGNIN_TOKEN_EXPIRY = conf.SIGNIN_TOKEN_EXPIRY || 1000 * 60 * 60 * 1




/**
 *  Flow:
 *    1. User request signin
 *    2. SignIn action is created now user have 3 attempts to confrm phone 
 *    3. User confirmed phone and got some times to complete registration
 *    4. User complet registration and log in
 *    5. User failed at sms code confirmation and starts from beginning
 *    6. User failed to complete registration and starts from beginning
 */

const SigninAction = new GQLListSchema('ForgotPasswordAction', {
    fields: {
        phone: {
            schemaDoc: 'Phone. In international E.164 format without spaces',
            type: Text,
            kmigratorOptions: { null: true, unique: true },
            hooks: {
                resolveInput: ({ resolvedData }) => {
                    return normalizePhone(resolvedData['phone'])
                },
            },
        },
        smsCode: {
            schemaDoc: 'Last sms code sent to user',
            type: Integer,
            length: SMS_CODE_LENGTH,
        },
        token: {
            schemaDoc: 'Unique token to complete registration',
            type: Text,
            isUnique: true,
            isRequired: true,
        },
        smsCodeExpiresAt: {
            schemaDoc: 'Time when sms code becomes not valid',
            type: DateTimeUtc,
            isRequired: true,
        },
        retries: {
            schemaDoc: 'Number of times sms code from user failed',
            type: Number,
            defaultValue: 0,
        },                
        isPhoneVerified: {
            schemaDoc: 'Phone verification flag. User verify phone by access to secret sms message',
            type: Checkbox,
            defaultValue: false,
        },        
        requestedAt: {
            schemaDoc: 'When user start signin',
            type: DateTimeUtc,
            isRequired: true,
        },
        expiresAt: {
            schemaDoc: 'Time limit to verify phone',
            type: DateTimeUtc,
            isRequired: true,
        },
        completedAt: {
            schemaDoc: 'When user completed signin',
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
    adminDoc: 'A list of signin user actions',
    adminConfig: {
        defaultPageSize: 50,
        maximumPageSize: 200,
        defaultColumns: 'phone, captchaScore, smsCode, requestedAt, retries',
    },
})

const SigninService = new GQLCustomSchema('SigninService', {
    mutations: [
        {
            access: true,
            schema: 'startSignIn(phone: String!, captcha: String): String',
            resolver: async (parent, args, context, info, extra = {}) => {
                const { phone: inputPhone, captcha } = args
                if (!isEmpty(captcha)) {
                    captchaCheck()
                }
                const phone = normalizePhone(inputPhone)
                const token = uuid()
                const tokenExpiration = extra.extraTokenExpiration || parseInt(SIGNIN_TOKEN_EXPIRY)
                const now =  Date.now()
                const requestedAt = new Date(now).toISOString()
                const expiresAt = new Date(now + tokenExpiration).toISOString()
                const smsCode = faker.datatype.number({ 'min': Math.pow(10, SMS_CODE_LENGTH - 1), 'max': Math.pow(10, SMS_CODE_LENGTH) - 1 })
                const smsCodeExpiresAt = new Date(now + SMS_CODE_TTL).toISOString()
                const variables = {
                    phone,
                    smsCode,
                    token,
                    smsCodeExpiresAt,
                    requestedAt,
                    expiresAt,
                }
                const { errors: createErrors } = await context.executeGraphQL({
                    context: context.createContext({ skipAccessControl: true }),
                    query: `
                        mutation createSigninAction(
                          $phone: String!,
                          $smsCode: Integer!,
                          $token: String!,
                          $smsCodeExpiresAt: String!,
                          $requestedAt: String!,
                          $expiresAt: String!,
                        ) {
                          createSigninAction(data: {
                            phone: $phone,
                            smsCode: $smsCode,
                            token: $token,
                            smsCodeExpiresAt: $smsCodeExpiresAt,
                            requestedAt: $requestedAt,
                            expiresAt: $expiresAt,
                          }) {
                            id
                            token
                            requestedAt
                            expiresAt
                          }
                        }
                    `,
                    variables,
                })
                if (createErrors) {
                    throw new Error('[error]: Unable to create signin action')
                }
                const lang = COUNTRIES[RUSSIA_COUNTRY].locale
                await sendMessage(context, {
                    lang,
                    to: { phone },
                    type: SMS_VERIFY_CODE,
                    meta: {
                        token,
                        dv: 1,
                    },
                    sender: 'sender',
                })
                return 'ok'
            },
        },
        {
            access: true,
            schema: 'signinConfirmPhone(phone: String!, smsCode: String!, captcha: String): String',
            resolver: async (parent, args, context, info, extra) => {
                const { phone, token, captcha } = args
                if (!isEmpty(captcha)) {
                    captchaCheck()
                }
                const now = extra.extraNow || (new Date(Date.now())).toISOString()
                const { errors, data } = await context.executeGraphQL({
                    context: context.createContext({ skipAccessControl: true }),
                    query: `
                        query findSigninActionFromPhone($phone: String!, $now: String!) {
                          signInActions: allSigninAction(where: { phone: $phone, expiresAt_gte: $now, completedAt: null }) {
                            smsCode
                            token
                            smsCodeExpiresAt
                          }
                        }
                    `,
                    variables: { token, now },
                })

                if (errors || !data.signInActions || !data.signInActions.length) {
                    throw new Error(`${SIGNIN_EXPIRED}] Unable to find signin action`)
                }

/*
              
              
                const user = data.passwordTokens[0].user.id
                const tokenId = data.passwordTokens[0].id
                // mark token as used
                const { errors: markAsUsedError } = await context.executeGraphQL({
                    context: context.createContext({ skipAccessControl: true }),
                    query: `
                        mutation markTokenAsUsed($tokenId: ID!, $now: String!) {
                          updateForgotPasswordAction(id: $tokenId, data: {usedAt: $now}) {
                            id
                            usedAt
                          }
                        }           
                    `,
                    variables: { tokenId, now },
                })
                if (markAsUsedError) {
                    throw new Error('[error] Unable to mark token as used')
                }
                const { errors: passwordError } = await context.executeGraphQL({
                    context: context.createContext({ skipAccessControl: true }),
                    query: `
                        mutation updateUserPassword($user: ID!, $password: String!) {
                          updateUser(id: $user, data: { password: $password }) {
                            id
                          }
                        }
                    `,
                    variables: { user, password },
                })
                if (passwordError) {
                    throw new Error('[error] Unable to change password')
                }
*/
                return 'ok'
            },
        },
        {
            access: true,
            schema: 'completeSignin(token: String!): String',
            resolver: async (parent, args, context, info, extra) => {
                const { phone, token } = args
                const now = extra.extraNow || (new Date(Date.now())).toISOString()
/*
                if (password.length < MIN_PASSWORD_LENGTH) {
                    throw new Error(`${PASSWORD_TOO_SHORT}] Password too short`)
                }
                const { errors, data } = await context.executeGraphQL({
                    context: context.createContext({ skipAccessControl: true }),
                    query: `
                        query findUserFromToken($token: String!, $now: String!) {
                            passwordTokens: allForgotPasswordActions(where: { token: $token, expiresAt_gte: $now, usedAt: null }) {
                            id
                            token
                            user {
                                id
                                email
                            }
                            }
                        }
                    `,
                    variables: { token, now },
                })
                if (errors || !data.passwordTokens || !data.passwordTokens.length) {
                    throw new Error(`${RESET_TOKEN_NOT_FOUND}] Unable to find token`)
                }
                const user = data.passwordTokens[0].user.id
                const tokenId = data.passwordTokens[0].id
                // mark token as used
                const { errors: markAsUsedError } = await context.executeGraphQL({
                    context: context.createContext({ skipAccessControl: true }),
                    query: `
                        mutation markTokenAsUsed($tokenId: ID!, $now: String!) {
                            updateForgotPasswordAction(id: $tokenId, data: {usedAt: $now}) {
                            id
                            usedAt
                            }
                        }           
                    `,
                    variables: { tokenId, now },
                })
                if (markAsUsedError) {
                    throw new Error('[error] Unable to mark token as used')
                }
                const { errors: passwordError } = await context.executeGraphQL({
                    context: context.createContext({ skipAccessControl: true }),
                    query: `
                        mutation updateUserPassword($user: ID!, $password: String!) {
                            updateUser(id: $user, data: { password: $password }) {
                            id
                            }
                        }
                    `,
                    variables: { user, password },
                })
                if (passwordError) {
                    throw new Error('[error] Unable to change password')
                }
*/
                return 'ok'
            },            
        },
    ],
})



module.exports = {
    SigninService,
    SigninAction,
}