const { getById, getSchemaCtx } = require('@core/keystone/schema')
const { GQLCustomSchema } = require('@core/keystone/schema')
const { normalizePhone } = require('@condo/domains/common/utils/phone')
const { User } = require('@condo/domains/user/utils/serverSchema')
const { WRONG_PHONE_ERROR, WRONG_PASSWORD_ERROR } = require('@condo/domains/user/constants/errors')
const isEmpty = require('lodash/isEmpty')
const { recaptchaCheck } = require('@condo/domains/common/utils/googleRecaptcha3')


const AuthenticateUserWithPhoneAndPasswordService = new GQLCustomSchema('AuthenticateUserWithPhoneAndPasswordService', {
    types: [
        {
            access: true,
            type: 'input AuthenticateUserWithPhoneAndPasswordInput { phone: String!, password: String!, recaptcha: String }',
        },
        {
            access: true,
            type: 'type AuthenticateUserWithPhoneAndPasswordOutput { item: User, token: String! }',
        },
    ],
    mutations: [
        {
            access: true,
            schema: 'authenticateUserWithPhoneAndPassword(data: AuthenticateUserWithPhoneAndPasswordInput!): AuthenticateUserWithPhoneAndPasswordOutput',
            resolver: async (parent, args, context, info, extra = {}) => {
                console.log('authenticateUserWithPhoneAndPassword', args, info.variableValues)

                const { phone: inputPhone, password, recaptcha } = info.variableValues
                if (!isEmpty(recaptcha)) {
                    recaptchaCheck(recaptcha)
                }
                const phone = normalizePhone(inputPhone)
                const users = await User.getAll(context, { phone })
                if (users.length !== 1) {
                    const msg = `${WRONG_PHONE_ERROR}] Unable to find user. Try to register`
                    throw new Error(msg)
                }
                const user = await getById('User', users[0].id)
                const { keystone } = await getSchemaCtx(AuthenticateUserWithPhoneAndPasswordService)  
                const { auth: { User: { password: PasswordStrategy } } } = keystone
                // We can't configure main PasswordStrategy to use phones by default as jest tests will be broken, but we can override identity field here
                PasswordStrategy.config.identityField = 'phone'
                const { success, message } = await PasswordStrategy.validate({ phone, password })
                if (!success) {
                    throw new Error(`${WRONG_PASSWORD_ERROR}] ${message}`)
                }
                const authToken = await context.startAuthedSession({ item: users[0], list: keystone.lists['User'] })
                const result = {
                    item: user,
                    token: authToken,
                }
                return result
            },
        },
    ],
})

module.exports = {
    AuthenticateUserWithPhoneAndPasswordService,
}
