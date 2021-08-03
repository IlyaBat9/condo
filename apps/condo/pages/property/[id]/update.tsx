import { Typography, Row, Col } from 'antd'
import Head from 'next/head'
import React from 'react'
import { PropertyForm } from '@condo/domains/property/components/PropertyForm'
import { useIntl } from '@core/next/intl'
import { PageContent, PageWrapper } from '@condo/domains/common/components/containers/BaseLayout'
import { OrganizationRequired } from '@condo/domains/organization/components/OrganizationRequired'
import { useRouter } from 'next/router'
import { ReturnBackHeaderAction } from '@condo/domains/common/components/HeaderActions'

interface IUpdatePropertyPage extends React.FC {
    headerAction?: JSX.Element
    requiredAccess?: React.FC
}

const UpdatePropertyPage: IUpdatePropertyPage = () => {
    const intl = useIntl()
    const PageTitleMsg = intl.formatMessage({ id:'pages.condo.property.index.UpdatePropertyTitle' })
    const { query: { id } } = useRouter()
    return (
        <>
            <Head>
                <title>{PageTitleMsg}</title>
            </Head>
            <PageWrapper>
                <PageContent>
                    <Row gutter={[0, 40]} style={{ height: '100%' }}>
                        <Col span={24}>
                            <Typography.Title level={1} style={{ margin: 0 }}>{PageTitleMsg}</Typography.Title>
                        </Col>
                        <PropertyForm id={id as string}/>
                    </Row>
                </PageContent>
            </PageWrapper>
        </>
    )
}

UpdatePropertyPage.headerAction = <ReturnBackHeaderAction
    descriptor={{ id: 'Back' }}
    path={(id) => `/property/${id}/`}/>
UpdatePropertyPage.requiredAccess = OrganizationRequired

export default UpdatePropertyPage
