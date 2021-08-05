/**
 * Generated by `createschema ticket.Ticket organization:Text; statusReopenedCounter:Integer; statusReason?:Text; status:Relationship:TicketStatus:PROTECT; number?:Integer; client?:Relationship:User:SET_NULL; clientName:Text; clientEmail:Text; clientPhone:Text; operator:Relationship:User:SET_NULL; assignee?:Relationship:User:SET_NULL; classifier:Relationship:TicketClassifier:PROTECT; details:Text; meta?:Json;`
 * In most cases you should not change it by hands
 * Please, don't remove `AUTOGENERATE MARKER`s
 */

const { generateServerUtils, execGqlWithoutAccess } = require('@condo/domains/common/utils/codegeneration/generate.server.utils')
const { Ticket: TicketGQL } = require('@condo/domains/ticket/gql')
const { AnaliticsTicket: AnaliticsTicketGQL } = require('@condo/domains/ticket/gql')
const { TicketStatus: TicketStatusGQL } = require('@condo/domains/ticket/gql')
const { TicketChange: TicketChangeGQL } = require('@condo/domains/ticket/gql')
const { TicketFile: TicketFileGQL } = require('@condo/domains/ticket/gql')
const { TicketClassifier: TicketClassifierGQL } = require('@condo/domains/ticket/gql')
const { TicketComment: TicketCommentGQL } = require('@condo/domains/ticket/gql')
const { CREATE_RESIDENT_TICKET_MUTATION } = require('@condo/domains/ticket/gql')
const { GET_ALL_RESIDENT_TICKETS_QUERY } = require('@condo/domains/ticket/gql')
const { UPDATE_RESIDENT_TICKET_MUTATION } = require('@condo/domains/ticket/gql')
/* AUTOGENERATE MARKER <IMPORT> */

const Ticket = generateServerUtils(TicketGQL)
const AnaliticsTicket = generateServerUtils(AnaliticsTicketGQL)
const TicketStatus = generateServerUtils(TicketStatusGQL)
const TicketChange = generateServerUtils(TicketChangeGQL)
const TicketFile = generateServerUtils(TicketFileGQL)
const TicketClassifier = generateServerUtils(TicketClassifierGQL)
const TicketComment = generateServerUtils(TicketCommentGQL)

async function createResidentTicket (context, data) {
    if (!context) throw new Error('no context')
    if (!data) throw new Error('no data')
    if (!data.sender) throw new Error('no data.sender')
    // TODO(codegen): write createResidentTicket serverSchema guards

    return await execGqlWithoutAccess(context, {
        query: CREATE_RESIDENT_TICKET_MUTATION,
        variables: { data: { dv: 1, ...data } },
        errorMessage: '[error] Unable to createResidentTicket',
        dataPath: 'obj',
    })
}

async function getAllResidentTickets (context, data) {
    if (!context) throw new Error('no context')
    if (!data) throw new Error('no data')
    if (!data.sender) throw new Error('no data.sender')
    // TODO(codegen): write getAllResidentTickets serverSchema guards

    return await execGqlWithoutAccess(context, {
        query: GET_ALL_RESIDENT_TICKETS_QUERY,
        variables: { data: { dv: 1, ...data } },
        errorMessage: '[error] Unable to getAllResidentTickets',
        dataPath: 'obj',
    })
}

async function updateResidentTicket (context, data) {
    if (!context) throw new Error('no context')
    if (!data) throw new Error('no data')
    if (!data.sender) throw new Error('no data.sender')
    // TODO(codegen): write updateResidentTicket serverSchema guards

    return await execGqlWithoutAccess(context, {
        query: UPDATE_RESIDENT_TICKET_MUTATION,
        variables: { data: { dv: 1, ...data } },
        errorMessage: '[error] Unable to updateResidentTicket',
        dataPath: 'obj',
    })
}

/* AUTOGENERATE MARKER <CONST> */

module.exports = {
    Ticket,
    AnaliticsTicket,
    TicketStatus,
    TicketChange,
    TicketFile,
    TicketClassifier,
    TicketComment,
    createResidentTicket,
    getAllResidentTickets,
    updateResidentTicket,
/* AUTOGENERATE MARKER <EXPORTS> */
}
