/**
 * Generated by `createschema organization.Organization 'country:Select:ru,en; name:Text; description?:Text; avatar?:File; meta:Json; employees:Relationship:OrganizationEmployee:CASCADE; statusTransitions:Json; defaultEmployeeRoleStatusTransitions:Json' --force`
 * In most cases you should not change it by hands
 * Please, don't remove `AUTOGENERATE MARKER`s
 */

const { generateServerUtils } = require('@condo/domains/common/utils/codegeneration/generate.server.utils')

const { Organization: OrganizationGQL } = require('@condo/domains/organization/gql')
const { OrganizationEmployee: OrganizationEmployeeGQL } = require('@condo/domains/organization/gql')
/* AUTOGENERATE MARKER <IMPORT> */

const Organization = generateServerUtils(OrganizationGQL)
const OrganizationEmployee = generateServerUtils(OrganizationEmployeeGQL)
/* AUTOGENERATE MARKER <CONST> */

module.exports = {
    Organization,
    OrganizationEmployee,
/* AUTOGENERATE MARKER <EXPORTS> */
}
