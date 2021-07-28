/**
 * Generated by `createschema ticket.TicketComment 'ticket:Relationship:Ticket:CASCADE; user:Relationship:User:CASCADE; content:Text;'`
 */

const { checkOrganizationPermission } = require('@condo/domains/organization/utils/accessSchema')
const { Ticket, TicketComment } = require('../utils/serverSchema')
const get = require('lodash/get')
const { throwAuthenticationError } = require('@condo/domains/common/utils/apolloErrorFormatter')
const { checkUserIsRelatedFromOrganizationEmployee } = require('@condo/domains/organization/utils/accessSchema')
const { checkIfUserIsOrganizationEmployee } = require('@condo/domains/organization/utils/accessSchema')
const { queryOrganizationEmployeeFromRelatedOrganizationFor } = require('@condo/domains/organization/utils/accessSchema')
const { queryOrganizationEmployeeFor } = require('@condo/domains/organization/utils/accessSchema')
const { checkRelatedOrganizationPermission } = require('@condo/domains/organization/utils/accessSchema')

async function canReadTicketComments ({ authentication: { item: user } }) {
    if (!user) return throwAuthenticationError()
    if (user.isAdmin) return {}
    const userId = user.id
    return {
        ticket: {
            organization: {
                OR: [
                    queryOrganizationEmployeeFor(userId),
                    queryOrganizationEmployeeFromRelatedOrganizationFor(userId),
                ],
            },
        },
    }
}

async function canManageTicketComments ({ authentication: { item: user }, originalInput, existingItem, operation, context, itemId }) {
    if (!user) return throwAuthenticationError()
    if (user.isAdmin) return true
    if (operation === 'create') {
        const ticketId = get(originalInput, ['ticket', 'connect', 'id'])
        const [ticket] = await Ticket.getAll(context, { id: ticketId })
        if (!ticket) {
            return false
        }
        const organizationId = get(ticket, ['organization', 'id'])
        const canManageRelatedOrganizationTickets = await checkRelatedOrganizationPermission(context, user.id, organizationId, 'canManageTicketComments')
        if (canManageRelatedOrganizationTickets) {
            return true
        }
        return await checkOrganizationPermission(context, user.id, organizationId, 'canManageTicketComments')
    } else if (operation === 'update') {
        const [ticketComment] = await TicketComment.getAll(context, { id: itemId })
        if (!ticketComment) {
            return false
        }
        if (ticketComment.user.id !== user.id) {
            return false
        }
        const [ticket] = await Ticket.getAll(context, { id: ticketComment.ticket.id })
        if (!ticket) {
            return false
        }
        const organizationId = get(ticket, ['organization', 'id'])
        const canManageRelatedOrganizationTickets = await checkRelatedOrganizationPermission(context, user.id, organizationId, 'canManageTicketComments')
        if (canManageRelatedOrganizationTickets) {
            return true
        }
        return await checkOrganizationPermission(context, user.id, organizationId, 'canManageTicketComments')
    }
    return false
}

async function canSetUserField ({ authentication: { item: user }, originalInput, addFieldValidationError }) {
    if (!user) return throwAuthenticationError()    
    if (user.isAdmin) return true
    if (get(originalInput, ['user', 'connect', 'id']) === user.id) {
        return true
    }
    return false
}

/*
  Rules are logical functions that used for list access, and may return a boolean (meaning
  all or no items are available) or a set of filters that limit the available items.
*/
module.exports = {
    canReadTicketComments,
    canManageTicketComments,
    canSetUserField,
}
