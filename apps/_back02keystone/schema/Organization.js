const { Wysiwyg } = require('@keystonejs/fields-wysiwyg-tinymce')
const { LocalFileAdapter } = require('@keystonejs/file-adapters')
const { Text, Checkbox, Password, CalendarDay, File, Relationship, DateTime } = require('@keystonejs/fields')
const { Organization: BaseOrganization, OrganizationToUserLink: BaseOrganizationToUserLink, RegisterNewOrganizationService: BaseRegisterNewOrganizationService, InviteNewUserToOrganizationService: BaseInviteNewUserToOrganizationService, AcceptOrRejectOrganizationInviteService } = require('@core/keystone/schemas/Organization')
const conf = require('@core/config')
const faker = require('faker')

const AVATAR_FILE_ADAPTER = new LocalFileAdapter({
    src: `${conf.MEDIA_ROOT}/orgavatars`,
    path: `${conf.MEDIA_URL}/orgavatars`,
})

const Organization = BaseOrganization._override({
    fields: {
        // settings: { type: MultiCheck, options: ['Feature1', 'Feature2'] },
        avatar: { type: File, adapter: AVATAR_FILE_ADAPTER },
        description: {
            factory: () => faker.lorem.paragraph(),
            type: Wysiwyg,
        },
    },
})

const OrganizationToUserLink = BaseOrganizationToUserLink._override({
    fields: {
        phone: {
            factory: () => faker.phone.phoneNumberFormat(),
            type: Text,
            hooks: {
                resolveInput: async ({ resolvedData }) => {
                    return resolvedData['phone'] && resolvedData['phone'].toLowerCase().replace(/\D/g, '')
                },
            },
        },
    },
})

const RegisterNewOrganizationService = BaseRegisterNewOrganizationService._override({
    types: [
        {
            access: true,
            type: 'input RegisterNewOrganizationInput { name: String!, description: String!, avatar: Upload }',
        },
    ]
})

RegisterNewOrganizationService.on('beforeRegisterNewOrganization', async ({ data, extraLinkData, extraOrganizationData, context }) => {
    extraLinkData.phone = context.authedItem.phone
})

const InviteNewUserToOrganizationService = BaseInviteNewUserToOrganizationService._override({
    types: [
        {
            access: true,  // TODO(pahaz): how-to be with phone! there is not a part of core logic!
            type: 'input InviteNewUserToOrganizationInput { organization: OrganizationWhereUniqueInput!, name: String, email: String!, phone: String }',
        },
    ],
})

InviteNewUserToOrganizationService.on('afterInviteNewUserToOrganization', (ctx) => {
    console.log('Fake send security email!', JSON.stringify(ctx))
})

module.exports = {
    Organization,
    OrganizationToUserLink,
    RegisterNewOrganizationService,
    InviteNewUserToOrganizationService,
    AcceptOrRejectOrganizationInviteService,
}
