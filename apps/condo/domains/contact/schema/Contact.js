/**
 * Generated by `createschema contact.Contact 'property:Relationship:Property:SET_NULL; name:Text; phone:Text; unitName?:Text; email?:Text;'`
 */

const { Text, Relationship } = require('@keystonejs/fields')
const { GQLListSchema } = require('@core/keystone/schema')
const { historical, versioned, uuided, tracked, softDeleted } = require('@core/keystone/plugins')
const { SENDER_FIELD, DV_FIELD } = require('@condo/domains/common/schema/fields')
const { ORGANIZATION_OWNED_FIELD } = require('../../../schema/_common')
const access = require('@condo/domains/contact/access/Contact')
const { PHONE_WRONG_FORMAT_ERROR, EMAIL_WRONG_FORMAT_ERROR } = require('@condo/domains/common/constants/errors')
const { normalizePhone } = require('@condo/domains/common/utils/phone')
const { normalizeEmail } = require('@condo/domains/common/utils/mail')
const { Contact: ContactAPI } = require('../utils/serverSchema')

/**
 * Composite unique constraint with name `Contact_uniq` is declared in a database-level on following set of columns:
 * ("property", "unitName", "name", "phone")
 */
const Contact = new GQLListSchema('Contact', {
    schemaDoc: 'Contact information of a person. Currently it will be related to a ticket, but in the future, it will be associated with more things',
    fields: {
        dv: DV_FIELD,
        sender: SENDER_FIELD,

        organization: ORGANIZATION_OWNED_FIELD,

        property: {
            schemaDoc: 'Property, that is a subject of an issue, reported by this person in first ticket. Meaning of this field will be revised in the future',
            type: Relationship,
            ref: 'Property',
            isRequired: true,
            knexOptions: { isNotNullable: true }, // Required relationship only!
            kmigratorOptions: { null: false, on_delete: 'models.CASCADE' },
        },

        unitName: {
            schemaDoc: 'Property unit, that is a subject of an issue, reported by this person in first ticket. Meaning of this field will be revised in the future',
            type: Text,
            isRequired: false,
        },

        email: {
            schemaDoc: 'Normalized contact email of this person',
            type: Text,
            isRequired: false,
            hooks: {
                resolveInput: async ({ resolvedData }) => {
                    if (!resolvedData['email']) return resolvedData['email']
                    const newValue = normalizeEmail(resolvedData['email'])
                    return newValue || resolvedData['email']
                },
                validateInput: async ({ resolvedData, addFieldValidationError }) => {
                    const newValue = normalizeEmail(resolvedData['email'])
                    if (resolvedData['email'] && newValue !== resolvedData['email']) {
                        addFieldValidationError(`${EMAIL_WRONG_FORMAT_ERROR}email] invalid format`)
                    }
                },
            },
        },

        phone: {
            schemaDoc: 'Normalized contact phone of this person in E.164 format without spaces',
            type: Text,
            isRequired: true,
            hooks: {
                resolveInput: async ({ resolvedData }) => {
                    const newValue = normalizePhone(resolvedData['phone'])
                    return newValue || resolvedData['phone']
                },
                validateInput: async ({ resolvedData, addFieldValidationError }) => {
                    const newValue = normalizePhone(resolvedData['phone'])
                    if (resolvedData['phone'] && newValue !== resolvedData['phone']) {
                        addFieldValidationError(`${PHONE_WRONG_FORMAT_ERROR}phone] invalid format`)
                    }
                },
            },
        },

        name: {
            schemaDoc: 'Name or full name of this person',
            type: Text,
            isRequired: true,
            hooks: {
                validateInput: ({ resolvedData, fieldPath, addFieldValidationError }) => {
                    const value = resolvedData[fieldPath]
                    if (value === '') {
                        return addFieldValidationError('Name should not be a blank string')
                    } else if (value.length === 1) {
                        return addFieldValidationError('Name should not be a one-character string')
                    }
                },
            },
        },

    },
    hooks: {
        validateInput: async ({ resolvedData, operation, existingItem, addValidationError, context }) => {
            const { property, unitName, name, phone } = resolvedData
            const [contact] = await ContactAPI.getAll(context, {
                property: { id: property },
                unitName,
                name,
                phone,
            })
            if (operation === 'create') {
                if (contact) {
                    return addValidationError('Cannot create contact, because another contact with the same provided set of "property", "unitName", "name", "phone"')
                }
            } else if (operation === 'update') {
                if (contact && contact.id !== existingItem.id) {
                    return addValidationError('Cannot update contact, because another contact already exists with the same provided set of "property", "unitName", "name", "phone"')
                }
            }
        },
    },
    plugins: [uuided(), versioned(), tracked(), softDeleted(), historical()],
    access: {
        read: access.canReadContacts,
        create: access.canManageContacts,
        update: access.canManageContacts,
        delete: false,
        auth: true,
    },
})

module.exports = {
    Contact,
}
