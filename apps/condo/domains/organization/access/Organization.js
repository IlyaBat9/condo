/**
 * Generated by `createschema organization.Organization 'country:Select:ru,en; name:Text; description?:Text; avatar?:File; meta:Json; employees:Relationship:OrganizationEmployee:CASCADE; statusTransitions:Json; defaultEmployeeRoleStatusTransitions:Json' --force`
 */

async function canReadOrganizations ({ authentication: { item: user } }) {
    if (!user) return false
    if (user.isAdmin) return {}
    return {
        employees_some: { user: { id: user.id } },
    }
}

async function canManageOrganizations ({ authentication: { item: user }, originalInput, operation, itemId }) {
    if (!user) return false
    if (user.isAdmin) return true
    if (operation === 'create') {
        return false
    } else if (operation === 'update') {
        // user is inside employee list
        return {
            employees_some: { user: { id: user.id, canManageOrganization: true } },
        }
    }
    return false
}

/*
  Rules are logical functions that used for list access, and may return a boolean (meaning
  all or no items are available) or a set of filters that limit the available items.
*/
module.exports = {
    canReadOrganizations,
    canManageOrganizations,
}
