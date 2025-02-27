import React from 'react'
import { Row, Col, Typography, Tooltip } from 'antd'
import { has } from 'lodash'
import styled from '@emotion/styled'
import { TicketChange as TicketChangeType } from '@app/condo/schema.d'
import { formatDate } from '../../utils/helpers'
import { useIntl } from '@core/next/intl'
import { PhoneLink } from '@condo/domains/common/components/PhoneLink'
import { green } from '@ant-design/colors'
import { FormattedMessage } from 'react-intl'

interface ITicketChangeProps {
    ticketChange: TicketChangeType
}

export const TicketChange: React.FC<ITicketChangeProps> = ({ ticketChange }) => {
    const intl = useIntl()
    const changedFieldMessages = useChangedFieldMessagesOf(ticketChange)
    return (
        <Row gutter={[12, 12]}>
            <Col span={3}>
                <Typography.Text style={{ fontSize: '16px' }}>{formatDate(intl, ticketChange.createdAt)}</Typography.Text>
            </Col>
            <Col span={21}>
                {changedFieldMessages.map(({ field, message }) => (
                    <Typography.Text key={field} style={{ fontSize: '16px' }}>
                        <Diff className={field}>
                            {message}
                        </Diff>
                    </Typography.Text>
                ))}
            </Col>
        </Row>
    )
}

const useChangedFieldMessagesOf = (ticketChange) => {
    const intl = useIntl()
    const ClientPhoneMessage = intl.formatMessage({ id: 'pages.condo.ticket.TicketChanges.clientPhone' })
    const DetailsMessage = intl.formatMessage({ id: 'pages.condo.ticket.TicketChanges.details' })
    const ClientNameMessage = intl.formatMessage({ id: 'pages.condo.ticket.TicketChanges.clientName' })
    const IsPaidMessage = intl.formatMessage({ id: 'pages.condo.ticket.TicketChanges.isPaid' })
    const IsEmergencyMessage = intl.formatMessage({ id: 'pages.condo.ticket.TicketChanges.isEmergency' })
    const StatusDisplayNameMessage = intl.formatMessage({ id: 'pages.condo.ticket.TicketChanges.statusDisplayName' })
    const UnitNameMessage = intl.formatMessage({ id: 'pages.condo.ticket.TicketChanges.unitName' })
    const AssigneeMessage = intl.formatMessage({ id: 'pages.condo.ticket.TicketChanges.assignee' })
    const ClassifierMessage = intl.formatMessage({ id: 'pages.condo.ticket.TicketChanges.classifier' })
    const fields = [
        ['clientPhone', ClientPhoneMessage],
        ['details', DetailsMessage],
        ['clientName', ClientNameMessage],
        ['isPaid', IsPaidMessage],
        ['isEmergency', IsEmergencyMessage],
        ['statusDisplayName', StatusDisplayNameMessage],
        ['unitName', UnitNameMessage],
        ['assigneeDisplayName', AssigneeMessage],
        ['classifierDisplayName', ClassifierMessage],
    ]

    const BooleanToString = {
        isPaid: {
            'true': intl.formatMessage({ id: 'pages.condo.ticket.TicketChanges.isPaid.true' }),
            'false': intl.formatMessage({ id: 'pages.condo.ticket.TicketChanges.isPaid.false' }),
        },
        isEmergency: {
            'true': intl.formatMessage({ id: 'pages.condo.ticket.TicketChanges.isEmergency.true' }),
            'false': intl.formatMessage({ id: 'pages.condo.ticket.TicketChanges.isEmergency.false' }),
        },
    }

    const formatField = (field, value) => {
        const formatterFor = {
            clientPhone: (field, value) => (
                <PhoneLink value={value}/>
            ),
            details: (field, value) => (
                value.length > 30 ? value.slice(0, 30) + '…' : value
            ),
            unitName: (field, value) => (
                // Formally, unit name (e.g. apartment) was changed, but semantically,
                // was changed a whole address of the ticket, so, to preserve context,
                // the change of the unit is displayed as the change of the address
                <FormattedMessage
                    id="pages.condo.ticket.TicketChanges.unitName.change"
                    values={{
                        address: ticketChange.ticket.property.address,
                        unitName: value,
                    }}
                />
            ),
        }
        return has(formatterFor, field)
            ? formatterFor[field](field, value)
            : value
    }

    const format = (field, value) => (
        typeof value === 'boolean'
            ? BooleanToString[field][value]
            : formatField(field, value)
    )

    /*
        Interpolates message string with JSX tags.
        They will be safely mounted in place of `{to}` and `{from}` placeholders
     */
    const formatDiffMessage = (field, message, ticketChange) => {
        // we have both "from" and "to" parts to interpolate
        if (message.search('{from}') !== -1 && message.search('{to}') !== -1) {
            const aroundFrom = message.split('{from}')
            const aroundTo =  aroundFrom[1].split('{to}')
            const valueFrom = ticketChange[`${field}From`]
            const valueTo = ticketChange[`${field}To`]
            return (
                <>
                    <SafeUserMention createdBy={ticketChange.createdBy}/>
                    &nbsp;{aroundFrom[0]}
                    <del>{format(field, valueFrom)}</del>
                    {aroundTo[0]}
                    <ins>{format(field, valueTo)}</ins>
                    {aroundTo[1]}
                </>
            )
        } else { // only "to" part
            const aroundTo =  message.split('{to}')
            const valueTo = ticketChange[`${field}To`]
            return (
                <>
                    <SafeUserMention createdBy={ticketChange.createdBy}/>
                    &nbsp;{aroundTo[0]}
                    <ins>{format(field, valueTo)}</ins>
                    {aroundTo[1]}
                </>
            )
        }
    }

    // Omit what was not changed
    const changedFields = fields.filter(([field]) => (
        ticketChange[`${field}From`] !== ticketChange[`${field}To`]
    ))

    return changedFields.map(([field, message]) => ({
        field,
        message: formatDiffMessage(field, message, ticketChange),
    }))
}

const SafeUserMention = ({ createdBy }) => {
    const intl = useIntl()
    const DeletedCreatedAtNoticeTitle = intl.formatMessage({ id: 'pages.condo.ticket.TicketChanges.notice.DeletedCreatedAt.title' })
    const DeletedCreatedAtNoticeDescription = intl.formatMessage({ id: 'pages.condo.ticket.TicketChanges.notice.DeletedCreatedAt.description' })
    return (
        createdBy ? (
            createdBy.name
        ) : (
            <Tooltip placement="top" title={DeletedCreatedAtNoticeDescription}>
                <span>{DeletedCreatedAtNoticeTitle}</span>
            </Tooltip>
        )
    )
}

const Diff = styled.p`
    &.statusDisplayName {
        del, ins {
            font-weight: bold;
            color: black;
        }
    }
    &.details, &.isEmergency, &.isPaid, &.classifierDisplayName {
        del, ins {
            color: black
        }
    }
    span, del, ins {
        &, a {
            color: ${green[6]};
        }
    }
    del, ins {
        text-decoration: none;
    }
`