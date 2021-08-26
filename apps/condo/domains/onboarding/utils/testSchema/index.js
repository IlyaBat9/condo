/**
 * Generated by `createschema onboarding.OnBoarding 'completed:Checkbox; stepsTransitions:Json;'`
 * In most cases you should not change it by hands
 * Please, don't remove `AUTOGENERATE MARKER`s
 */
const faker = require('faker')

const { generateGQLTestUtils, throwIfError } = require('@condo/domains/common/utils/codegeneration/generate.test.utils')

const { OnBoarding: OnBoardingGQL } = require('@condo/domains/onboarding/gql')
const { OnBoardingStep: OnBoardingStepGQL } = require('@condo/domains/onboarding/gql')
const { CREATE_ON_BOARDING_MUTATION } = require('@condo/domains/onboarding/gql')
/* AUTOGENERATE MARKER <IMPORT> */

const OnBoarding = generateGQLTestUtils(OnBoardingGQL)
const OnBoardingStep = generateGQLTestUtils(OnBoardingStepGQL)
/* AUTOGENERATE MARKER <CONST> */

async function createTestOnBoarding (client, extraAttrs = {}) {
    if (!client) throw new Error('no client')
    const sender = { dv: 1, fingerprint: faker.random.alphaNumeric(8) }

    // TODO(codegen): write createTestOnBoarding logic for generate fields

    const attrs = {
        dv: 1,
        sender,
        ...extraAttrs,
    }
    const obj = await OnBoarding.create(client, attrs)
    return [obj, attrs]
}

async function updateTestOnBoarding (client, id, extraAttrs = {}) {
    if (!client) throw new Error('no client')
    if (!id) throw new Error('no id')
    const sender = { dv: 1, fingerprint: faker.random.alphaNumeric(8) }

    const attrs = {
        dv: 1,
        sender,
        ...extraAttrs,
    }
    const obj = await OnBoarding.update(client, id, attrs)
    return [obj, attrs]
}

async function createTestOnBoardingStep (client, onBoarding, extraAttrs = {}) {
    if (!client) throw new Error('no client')
    if (!onBoarding || !onBoarding.id) throw new Error('no onBoarding.id')
    const sender = { dv: 1, fingerprint: faker.random.alphaNumeric(8) }

    // TODO(codegen): write createTestOnBoardingStep logic for generate fields

    const attrs = {
        dv: 1,
        sender,
        onBoarding: { connect: { id: onBoarding.id } },
        ...extraAttrs,
    }
    const obj = await OnBoardingStep.create(client, attrs)
    return [obj, attrs]
}

async function updateTestOnBoardingStep (client, id, extraAttrs = {}) {
    if (!client) throw new Error('no client')
    if (!id) throw new Error('no id')
    const sender = { dv: 1, fingerprint: faker.random.alphaNumeric(8) }

    // TODO(codegen): check the updateTestOnBoardingStep logic for generate fields

    const attrs = {
        dv: 1,
        sender,
        ...extraAttrs,
    }
    const obj = await OnBoardingStep.update(client, id, attrs)
    return [obj, attrs]
}

async function createOnBoardingByTestClient(client, extraAttrs = {}) {
    if (!client) throw new Error('no client')
    const sender = { dv: 1, fingerprint: faker.random.alphaNumeric(8) }

    const attrs = {
        dv: 1,
        sender,
        ...extraAttrs,
    }
    const { data, errors } = await client.mutate(CREATE_ON_BOARDING_MUTATION, { data: attrs })
    throwIfError(data, errors)
    return [data.result, attrs]
}
/* AUTOGENERATE MARKER <FACTORY> */

module.exports = {
    OnBoarding, createTestOnBoarding, updateTestOnBoarding,
    OnBoardingStep, createTestOnBoardingStep, updateTestOnBoardingStep,
    createOnBoardingByTestClient,
/* AUTOGENERATE MARKER <EXPORTS> */
}
