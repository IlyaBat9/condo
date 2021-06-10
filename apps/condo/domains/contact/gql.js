/**
 * Generated by `createschema contact.Contact 'property:Relationship:Property:SET_NULL; name:Text; phone:Text; unitName?:Text; email?:Text;'`
 * In most cases you should not change it by hands
 * Please, don't remove `AUTOGENERATE MARKER`s
 */

const { generateGqlQueries } = require('@condo/domains/common/utils/codegeneration/generate.gql')

const COMMON_FIELDS = 'id dv sender v deletedAt newId createdBy { id name } updatedBy { id name } createdAt updatedAt'

const CONTACT_FIELDS = `{ organization { id } property { id } name phone unitName email ${COMMON_FIELDS} }`
const Contact = generateGqlQueries('Contact', CONTACT_FIELDS)

/* AUTOGENERATE MARKER <CONST> */

module.exports = {
    Contact,
/* AUTOGENERATE MARKER <EXPORTS> */
}
