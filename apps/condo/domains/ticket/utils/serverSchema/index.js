/**
 * Generated by `createschema ticket.Ticket organization:Text; statusReopenedCounter:Integer; statusReason?:Text; status:Relationship:TicketStatus:PROTECT; number?:Integer; client?:Relationship:User:SET_NULL; clientName:Text; clientEmail:Text; clientPhone:Text; operator:Relationship:User:SET_NULL; assignee?:Relationship:User:SET_NULL; classifier:Relationship:TicketClassifier:PROTECT; details:Text; meta?:Json;`
 * In most cases you should not change it by hands
 * Please, don't remove `AUTOGENERATE MARKER`s
 */

const { generateServerUtils } = require('@condo/domains/common/utils/codegeneration/generate.server.utils')

const { Ticket: TicketGQL } = require('@condo/domains/ticket/gql')
const { TicketStatus: TicketStatusGQL } = require('@condo/domains/ticket/gql')
const { TicketChange: TicketChangeGQL } = require('@condo/domains/ticket/gql')
/* AUTOGENERATE MARKER <IMPORT> */

const Ticket = generateServerUtils(TicketGQL)
const TicketStatus = generateServerUtils(TicketStatusGQL)
const TicketChange = generateServerUtils(TicketChangeGQL)
/* AUTOGENERATE MARKER <CONST> */

module.exports = {
    Ticket,
    TicketStatus,
    TicketChange,
/* AUTOGENERATE MARKER <EXPORTS> */
}
