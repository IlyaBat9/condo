// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
import React from 'react'
import { Space, Spin } from 'antd'
import { MenuUnfoldOutlined, BellFilled } from '@ant-design/icons'
import { useAuth } from '@core/next/auth'
import { useOrganization } from '@core/next/organization'
import { OrganizationSelect } from '@condo/domains/organization/components/OrganizationSelect'
import { TopMenuItem, menuIconStyles } from './styles'

import { UserMenu } from '@condo/domains/user/components/UserMenu'

interface ITopMenuItemsProps {
    isMobile: boolean
    toggleSideMenuCollapsed: boolean
    headerAction?: React.ElementType
}

export const TopMenuItems: React.FC<ITopMenuItemsProps> = (props) => {
    const auth = useAuth()
    const { isLoading } = useOrganization()
    const { isMobile, toggleSideMenuCollapsed } = props

    if (isLoading || auth.isLoading) {
        return (
            <div>
                <Spin size="small" style={{ marginLeft: 16, marginRight: 16 }}/>
            </div>
        )
    }

    return (
        <>
            {props.headerAction && props.headerAction}
            {
                isMobile && (
                    <TopMenuItem onClick={toggleSideMenuCollapsed}>
                        <MenuUnfoldOutlined style={menuIconStyles}/>
                    </TopMenuItem>
                )
            }
            <Space direction={'horizontal'} size={40} style={{ marginLeft: 'auto' }}>
                <BellFilled style={{ ...menuIconStyles, marginLeft: 'auto' }}/>
                <OrganizationSelect/>
                <UserMenu/>
            </Space>
        </>
    )
}
