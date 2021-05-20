/**
 * Generated by `createschema ticket.TicketChange 'ticket:Relationship:Ticket:CASCADE;'`
 */

const { catchErrorFrom } = require('../../common/utils/testSchema')
const faker = require('faker')
const { getById, find } = require('@core/keystone/schema')
const { expectToThrowAccessDeniedErrorToObjects } = require('@condo/domains/common/utils/testSchema')
const { updateTestTicket } = require('../utils/testSchema')

const { expectToThrowAccessDeniedErrorToObj } = require('@condo/domains/common/utils/testSchema')

const { createTestTicket } = require('../utils/testSchema')
const { makeClientWithProperty } = require('@condo/domains/property/schema/Property.test')
const { makeLoggedInAdminClient, makeClient, DATETIME_RE } = require('@core/keystone/test.utils')

const { TicketChange, createTestTicketChange, updateTestTicketChange } = require('@condo/domains/ticket/utils/testSchema')

const { STATUS_IDS } = require('../constants/statusTransitions')

describe('TicketChange', () => {

    describe('create', async () => {
        it('gets created when Ticket has changes in at least one field', async () => {
            const openedStatus = await getById('TicketStatus', STATUS_IDS.OPEN)
            const inProgressStatus = await getById('TicketStatus', STATUS_IDS.IN_PROGRESS)
            const classifiers = await find('TicketClassifier', {})
            const sources = await find('TicketSource', {})

            const admin = await makeLoggedInAdminClient()
            const client = await makeClientWithProperty()
            const client2 = await makeClientWithProperty()
            const client3 = await makeClientWithProperty()
            const client4 = await makeClientWithProperty()
            const [ticket2] = await createTestTicket(client, client.organization, client.property)
            const [ticket3] = await createTestTicket(client, client.organization, client.property)
            const [ticket] = await createTestTicket(client, client.organization, client.property, {
                isEmergency: true,
                isPaid: true,
                status: { connect: { id: openedStatus.id } },
                client: { connect: { id: client.user.id } },
                operator: { connect: { id: client.user.id } },
                assignee: { connect: { id: client.user.id } },
                executor: { connect: { id: client.user.id } },
                classifier: { connect: { id: classifiers[0].id } },
                source: { connect: { id: sources[0].id } },
                related: { connect: { id: ticket2.id } },
                // TODO(antonal): figure out how to get old list of related items in many-to-many relationship.
                // watchers: { connect: [{ id: client2.user.id }, { id: client3.user.id }] },
            })

            const payload = {
                details: faker.lorem.sentence(),
                number: ticket.number + 1,
                statusReason: faker.lorem.sentence(),
                clientName: faker.name.firstName(),
                clientEmail: faker.internet.email(),
                clientPhone: faker.phone.phoneNumber(),
                entranceName: faker.lorem.word(),
                floorName: faker.lorem.word(),
                unitName: faker.lorem.word(),
                isEmergency: false,
                isPaid: false,
                property: { connect: { id: client2.property.id } },
                status: { connect: { id: inProgressStatus.id } },
                client: { connect: { id: client2.user.id } },
                operator: { connect: { id: client2.user.id } },
                assignee: { connect: { id: client2.user.id } },
                executor: { connect: { id: client2.user.id } },
                classifier: { connect: { id: classifiers[1].id } },
                source: { connect: { id: sources[1].id } },
                related: { connect: { id: ticket3.id } },
                // TODO(antonal): figure out how to get old list of related items in many-to-many relationship.
                // watchers: { connect: [{ id: client3.user.id }, { id: client4.user.id }] },
            }

            await updateTestTicket(admin, ticket.id, payload)

            const objs = await TicketChange.getAll(admin, {
                ticket: { id: ticket.id },
            })

            expect(objs).toHaveLength(1)
            expect(objs[0].id).toBeDefined()
            expect(objs[0].dv).toEqual(1)
            expect(objs[0].detailsFrom).toEqual(ticket.details)
            expect(objs[0].detailsTo).toEqual(payload.details)
            expect(objs[0].numberFrom).toEqual(ticket.number)
            expect(objs[0].numberTo).toEqual(payload.number)
            expect(objs[0].statusReasonFrom).toEqual(ticket.statusReason)
            expect(objs[0].statusReasonTo).toEqual(payload.statusReason)
            expect(objs[0].clientNameFrom).toEqual(ticket.clientName)
            expect(objs[0].clientNameTo).toEqual(payload.clientName)
            expect(objs[0].clientEmailFrom).toEqual(ticket.clientEmail)
            expect(objs[0].clientEmailTo).toEqual(payload.clientEmail)
            expect(objs[0].clientPhoneFrom).toEqual(ticket.clientPhone)
            expect(objs[0].clientPhoneTo).toEqual(payload.clientPhone)
            expect(objs[0].isEmergencyFrom).toEqual(ticket.isEmergency)
            expect(objs[0].isEmergencyTo).toEqual(payload.isEmergency)
            expect(objs[0].isPaidFrom).toEqual(ticket.isPaid)
            expect(objs[0].isPaidTo).toEqual(payload.isPaid)

            /*
                `entranceName`, `floorName`, `unitName` are unused in Ticket yet
            */
            // expect(objs[0].entranceNameFrom).toEqual(ticket.entranceName)
            // expect(objs[0].entranceNameTo).toEqual(payload.entranceName)
            // expect(objs[0].floorNameFrom).toEqual(ticket.floorName)
            // expect(objs[0].floorNameTo).toEqual(payload.floorName)
            // expect(objs[0].unitNameFrom).toEqual(ticket.unitName)
            // expect(objs[0].unitNameTo).toEqual(payload.unitName)

            expect(objs[0].createdBy).toEqual(expect.objectContaining({ id: admin.user.id }))
            expect(objs[0].updatedBy).toEqual(expect.objectContaining({ id: admin.user.id }))
            expect(objs[0].createdAt).toMatch(DATETIME_RE)
            expect(objs[0].updatedAt).toMatch(DATETIME_RE)

            expect(objs[0].propertyIdFrom).toEqual(ticket.property.id)
            expect(objs[0].propertyIdTo).toEqual(payload.property.connect.id)
            expect(objs[0].propertyDisplayNameFrom).toEqual(client.property.name)
            expect(objs[0].propertyDisplayNameTo).toEqual(client2.property.name)

            expect(objs[0].statusIdFrom).toEqual(ticket.status.id)
            expect(objs[0].statusIdTo).toEqual(payload.status.connect.id)
            expect(objs[0].statusDisplayNameFrom).toEqual(openedStatus.name)
            expect(objs[0].statusDisplayNameTo).toEqual(inProgressStatus.name)

            expect(objs[0].clientIdFrom).toEqual(ticket.client.id)
            expect(objs[0].clientIdTo).toEqual(payload.client.connect.id)
            expect(objs[0].clientDisplayNameFrom).toEqual(client.user.name)
            expect(objs[0].clientDisplayNameTo).toEqual(client2.user.name)

            expect(objs[0].operatorIdFrom).toEqual(ticket.operator.id)
            expect(objs[0].operatorIdTo).toEqual(payload.operator.connect.id)
            expect(objs[0].operatorDisplayNameFrom).toEqual(client.user.name)
            expect(objs[0].operatorDisplayNameTo).toEqual(client2.user.name)

            expect(objs[0].assigneeIdFrom).toEqual(ticket.assignee.id)
            expect(objs[0].assigneeIdTo).toEqual(payload.assignee.connect.id)
            expect(objs[0].assigneeDisplayNameFrom).toEqual(client.user.name)
            expect(objs[0].assigneeDisplayNameTo).toEqual(client2.user.name)

            expect(objs[0].executorIdFrom).toEqual(ticket.executor.id)
            expect(objs[0].executorIdTo).toEqual(payload.executor.connect.id)
            expect(objs[0].executorDisplayNameFrom).toEqual(client.user.name)
            expect(objs[0].executorDisplayNameTo).toEqual(client2.user.name)

            expect(objs[0].classifierIdFrom).toEqual(ticket.classifier.id)
            expect(objs[0].classifierIdTo).toEqual(payload.classifier.connect.id)
            expect(objs[0].classifierDisplayNameFrom).toEqual(classifiers[0].name)
            expect(objs[0].classifierDisplayNameTo).toEqual(classifiers[1].name)

            expect(objs[0].sourceIdFrom).toEqual(ticket.source.id)
            expect(objs[0].sourceIdTo).toEqual(payload.source.connect.id)
            expect(objs[0].sourceDisplayNameFrom).toEqual(sources[0].name)
            expect(objs[0].sourceDisplayNameTo).toEqual(sources[1].name)

            expect(objs[0].relatedIdFrom).toEqual(ticket2.id)
            expect(objs[0].relatedIdTo).toEqual(payload.related.connect.id)
            expect(objs[0].relatedDisplayNameFrom).toEqual(ticket2.number.toString())
            expect(objs[0].relatedDisplayNameTo).toEqual(ticket3.number.toString())

            // TODO(antonal): figure out how to get old list of related items in many-to-many relationship.
            // expect(objs[0].watchersIdsFrom).toEqual([client2.user.id, client3.user.id])
            // expect(objs[0].watchersIdsTo).toEqual([client3.id, client4.id])
            // expect(objs[0].watchersDisplayNamesFrom).toEqual([client2.user.name, client2.user.name])
            // expect(objs[0].watchersDisplayNamesTo).toEqual([client3.user.name, client4.user.name])
        })

        it('not gets created when Ticket has no changes', async () => {
            const admin = await makeLoggedInAdminClient()
            const client = await makeClientWithProperty()
            const [ticket] = await createTestTicket(client, client.organization, client.property)

            const payloadThatChangesNothing = {
                details: ticket.details,
                statusReason: ticket.statusReason,
                clientName: ticket.clientName,
                property: { connect: { id: client.property.id } },
            }

            await updateTestTicket(admin, ticket.id, payloadThatChangesNothing)

            const objs = await TicketChange.getAll(admin, {
                ticket: { id: ticket.id },
            })

            expect(objs).toHaveLength(0)
        })
    })

    test('user: create TicketChange', async () => {
        const client = await makeClientWithProperty()
        const [ticket] = await createTestTicket(client, client.organization, client.property)
        await expectToThrowAccessDeniedErrorToObj(async () => {
            await createTestTicketChange(client, ticket)
        })
    })

    test('anonymous: create TicketChange', async () => {
        const client = await makeClientWithProperty()
        const [ticket] = await createTestTicket(client, client.organization, client.property)
        const anonymous = await makeClient()
        await expectToThrowAccessDeniedErrorToObj(async () => {
            await createTestTicketChange(anonymous, ticket)
        })
    })

    describe('user: read TicketChange', async () => {
        it('only belonging to organization, it employed in', async () => {
            const admin = await makeLoggedInAdminClient()
            const client = await makeClientWithProperty()
            const [ticket] = await createTestTicket(admin, client.organization, client.property)

            const payload = {
                details: faker.lorem.sentence(),
            }

            await updateTestTicket(admin, ticket.id, payload)

            const objs = await TicketChange.getAll(client, {
                ticket: { id: ticket.id },
            })

            expect(objs).toHaveLength(1)
            expect(objs[0].ticket.id).toEqual(ticket.id)
        })
    })

    test('anonymous: read TicketChange', async () => {
        const anonymous = await makeClient()
        await expectToThrowAccessDeniedErrorToObjects(async () => {
            await TicketChange.getAll(anonymous)
        })
    })

    test('user: update TicketChange', async () => {
        const admin = await makeLoggedInAdminClient()
        const client = await makeClientWithProperty()
        const [ticket] = await createTestTicket(admin, client.organization, client.property)

        const payload = {
            details: faker.lorem.sentence(),
        }

        await updateTestTicket(admin, ticket.id, payload)

        const [objCreated] = await TicketChange.getAll(admin, {
            ticket: { id: ticket.id },
        })

        await catchErrorFrom(async () => {
            await updateTestTicketChange(client, objCreated.id)
        }, ({ errors, data }) => {
            // Custom match should be used here, because error message contains
            // suggestions, like "Did you mean …", that cannot be known in advance
            // So, just inspect basic part of the message
            expect(errors[0].message).toMatch('Unknown type "TicketChangeUpdateInput"')
        })
    })

    test('anonymous: update TicketChange', async () => {
        const admin = await makeLoggedInAdminClient()
        const client = await makeClientWithProperty()
        const [ticket] = await createTestTicket(admin, client.organization, client.property)
        const anonymous = await makeClient()

        const payload = {
            details: faker.lorem.sentence(),
        }

        await updateTestTicket(admin, ticket.id, payload)

        const [objCreated] = await TicketChange.getAll(admin, {
            ticket: { id: ticket.id },
        })

        await catchErrorFrom(async () => {
            await updateTestTicketChange(anonymous, objCreated.id)
        }, ({ errors, data }) => {
            // Custom match should be used here, because error message contains
            // suggestions, like "Did you mean …", that cannot be known in advance
            // So, just inspect basic part of the message
            expect(errors[0].message).toMatch('Unknown type "TicketChangeUpdateInput"')
        })
    })

    test('user: delete TicketChange', async () => {
        const admin = await makeLoggedInAdminClient()
        const client = await makeClientWithProperty()
        const [ticket] = await createTestTicket(admin, client.organization, client.property)

        const payload = {
            details: faker.lorem.sentence(),
        }

        await updateTestTicket(admin, ticket.id, payload)

        const [objCreated] = await TicketChange.getAll(admin, {
            ticket: { id: ticket.id },
        })

        await catchErrorFrom(async () => {
            await TicketChange.delete(client, objCreated.id)
        }, ({ errors, data }) => {
            // Custom match should be used here, because error message contains
            // suggestions, like "Did you mean …", that cannot be known in advance
            // So, just inspect basic part of the message
            expect(errors[0].message).toMatch('Cannot query field "deleteTicketChange" on type "Mutation"')
        })
    })

    test('anonymous: delete TicketChange', async () => {
        const admin = await makeLoggedInAdminClient()
        const client = await makeClientWithProperty()
        const anonymous = await makeClient()
        const [ticket] = await createTestTicket(admin, client.organization, client.property)

        const payload = {
            details: faker.lorem.sentence(),
        }

        await updateTestTicket(admin, ticket.id, payload)

        const [objCreated] = await TicketChange.getAll(admin, {
            ticket: { id: ticket.id },
        })

        await catchErrorFrom(async () => {
            await TicketChange.delete(anonymous, objCreated.id)
        }, ({ errors, data }) => {
            // Custom match should be used here, because error message contains
            // suggestions, like "Did you mean …", that cannot be known in advance
            // So, just inspect basic part of the message
            expect(errors[0].message).toMatch('Cannot query field "deleteTicketChange" on type "Mutation"')
        })
    })
})
