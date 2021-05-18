/**
 * Generated by `createschema ticket.TicketChange 'ticket:Relationship:Ticket:CASCADE;'`
 */

const { Text, Relationship, Integer, Select, Checkbox, DateTimeUtc, CalendarDay, Decimal, Password, File } = require('@keystonejs/fields')
const { Json } = require('@core/keystone/fields')
const { GQLListSchema } = require('@core/keystone/schema')
const { historical, versioned, uuided, tracked, softDeleted } = require('@core/keystone/plugins')
const { SENDER_FIELD, DV_FIELD } = require('@condo/domains/common/schema/fields')
const access = require('@condo/domains/ticket/access/TicketChange')


const TicketChange = new GQLListSchema('TicketChange', {
    // TODO(codegen): write doc for the TicketChange domain model!
    schemaDoc: 'TODO DOC!',
    fields: {
        dv: DV_FIELD,
        sender: SENDER_FIELD,

        ticket: {
            // TODO(codegen): write doc for TicketChange.ticket field!
            schemaDoc: 'TODO DOC!',
            type: Relationship,
            ref: 'Ticket',
            isRequired: true,
            knexOptions: { isNotNullable: true }, // Required relationship only!
            kmigratorOptions: { null: false, on_delete: 'models.CASCADE' },
        },

    },
    plugins: [uuided(), versioned(), tracked(), softDeleted(), historical()],
    access: {
        read: access.canReadTicketChanges,
        create: access.canManageTicketChanges,
        update: access.canManageTicketChanges,
        delete: false,
        auth: true,
    },
})

module.exports = {
    TicketChange,
}
