// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
import styled from '@emotion/styled'
import { useImmer } from 'use-immer'
import { Button, Input, Modal, Form, InputNumber, Select } from 'antd'
import { useState, useRef, useEffect } from 'react'
import { useIntl } from '@core/next/intl'
import { addNewBBuildingUnitToSectionData, BBuildingData, createNewBBuildingSectionData, updateUnitsLabels } from './BBuildingData'

// TODO(pahaz): translation!

const BPanel = styled.div`
  background: #fbfbfb;
  padding: 20px 30px 20px;
  margin: 0;
`

const BContainer = styled.div`
  padding: 50px 0 50px 30px;
  position: relative;
`

const BAxisY = styled.div`
  left: 20px;
  top: 100px;
  bottom: 0;
  font-size: 11px;
  text-transform: uppercase;
  color: #a6a6a6;
  position: absolute;
  text-align: center;
  letter-spacing: 2px;

  & .bb-text {
    transform: rotate(-90deg);
    display: block;
    text-align: center;
    position: absolute;
    vertical-align: middle;
    top: 26px;
    left: -134px;
    white-space: nowrap;
    width: 200px;
  }
`

const BAxisX = styled.div`
  left: 70px;
  top: 20px;
  right: 0;
  padding-bottom: 30px;
  font-size: 11px;
  text-transform: uppercase;
  color: #a6a6a6;
  position: absolute;
  text-align: center;
  letter-spacing: 2px;

  & .bb-text {
    font-size: 11px;
    text-transform: uppercase;
    color: #a6a6a6;
    position: absolute;
    text-align: center;
    letter-spacing: 2px;
  }
`

const BPlane = styled(BBasePlane)`
  overflow-x: scroll;
  position: relative;
  padding: 0;
  margin: 0;
  left: 0;
  outline: none;

  ::-webkit-scrollbar {
    -webkit-appearance: none;
    width: 7px;
  }
  ::-webkit-scrollbar-thumb {
    border-radius: 4px;
    background-color: rgba(0, 0, 0, .5);
    -webkit-box-shadow: 0 0 1px rgba(255, 255, 255, .5);
  }
`

const BFloor = styled.div`
  white-space: nowrap;
  font-size: 0;
  position: relative;
  padding: 0;
  margin: 0;
  min-height: 32px;
  height: 32px;
  vertical-align: middle;
  display: table;

  &:hover {
    background: #fbfbfb45;
    box-shadow: 0 -1px 0 #eaeaea, 0 1px 0 #eaeaea;
  }
`

const BSection = styled.div`
  display: inline-block;
  vertical-align: inherit;
  margin: 1px 16px 1px 0;

  .section-names & {
    margin: 1px 15px 1px 1px;
  }

  .section-names &:hover {
    outline: 2px solid #ff343a;
    outline-offset: 2px;
    outline-offset: -1px;
  }

  .floor-names & {
    margin: 1px
  }
`

const BCellWrapper = styled.div`
  display: inline-block;
  vertical-align: inherit;
  font-size: 15px;
  margin: 2px;
  height: 26px;
  width: 26px;

  .auto {
    color: #ffffff80;
  }

  .small {
    font-size: 10px;
  }
`

const BUnit = styled.div`
  background-color: #63cba5;
  color: #fff;
  font-size: 13px;
  line-height: 24px;
  text-align: center;
  width: 24px;
  height: 24px;
  margin: 1px;
  transform: scale(1, 1);
  user-select: none;
  position: relative;

  :hover {
    outline: 2px solid #ff343a;
    outline-offset: 2px;
  }
`

const BAxisYLabels = styled.div`
  width: 28px;
  position: absolute;
  top: 50px;
  left: 0;
  vertical-align: top;
  text-align: center;
`

function BBasePlane ({ className, matrix, onUnitClick, onSectionClick }) {
    let key = 0
    return <div className={className} key={key++}>
        <BFloor className='section-names' key={key++}>
            {
                matrix.sections.map((section) => {
                    return <BSection key={key++} onClick={() => onSectionClick({ section })}>
                        <BCellWrapper style={{ width: `${30 * section.size - 2 * 2}px` }}>{section.name}</BCellWrapper>
                    </BSection>
                })
            }
        </BFloor>
        {matrix.floors.map(floor => {
            return <BFloor key={key++}>
                {floor.sections.map(section => {
                    return <BSection key={key++}>
                        {section.units.map(unit => {
                            return <BCellWrapper key={key++}>
                                {
                                    unit.type === 'unit'
                                        ? <BUnit
                                            className={`${unit.isNameAutoGenerated ? ' auto' : ''}${(unit.name && unit.name.length > 3) ? ' small' : ''}`}
                                            onClick={() => onUnitClick({ section, floor, unit })}
                                            key={unit.id}>{unit.name}</BUnit>
                                        : null
                                }
                            </BCellWrapper>
                        })}
                    </BSection>
                })}
            </BFloor>
        })}
    </div>
}

function useBBuildingMatrixData (data) {
    const [state, setState] = useImmer(data)
    const bBuildingData = new BBuildingData(state)
    const matrix = bBuildingData.getVisualMatrix()
    const createUnit = function createUnit (props) {
        setState(draft => {
            // TODO(pahaz): refactor! looks strange =/
            const { sectionPos, floorPos, unitName } = props
            const [s] = sectionPos.split('-')
            const [fs, ff] = floorPos.split('-')
            addNewBBuildingUnitToSectionData(draft.sections[s], draft.sections[fs].floors[ff].index, { name: unitName })
        })
    }
    const updateUnit = function updateUnit (unit, values) {
        setState(draft => {
            const [s, f, i] = unit.pos
            Object.assign(draft.sections[s].floors[f].units[i], values)
        })
    }
    const deleteUnit = function deleteUnit (unit) {
        setState(draft => {
            const [s, f, i] = unit.pos
            draft.sections[s].floors[f].units.splice(i, 1)
        })
    }
    const createSection = function createSection (props) {
        setState(draft => {
            const section = createNewBBuildingSectionData(props)
            draft.sections.push(section)
        })
    }
    const updateSection = function updateSection (section, values) {
        setState(draft => {
            const [s] = section.pos
            Object.assign(draft.sections[s], values)
        })
    }
    const deleteSection = function deleteSection (section) {
        setState(draft => {
            const [s] = section.pos
            draft.sections.splice(s, 1)
        })
    }
    return [matrix, state, { createUnit, updateUnit, deleteUnit, createSection, updateSection, deleteSection }]
}

// reset form fields when modal is form, closed
const useResetFormOnCloseModal = ({ form, visible }) => {
    const prevVisibleRef = useRef()
    useEffect(() => {
        prevVisibleRef.current = visible
    }, [visible])
    const prevVisible = prevVisibleRef.current
    useEffect(() => {
        if (!visible && prevVisible) {
            form.resetFields()
        }
    }, [visible])
}

const ChangeUnitModalForm = ({ unit, visible, onCancel, onFinish }) => {
    const [form] = Form.useForm()
    useEffect(() => {
        if (visible) form.setFields([{ name: 'name', value: unit.name }])
    }, [form, unit])
    useResetFormOnCloseModal({
        form,
        visible,
    })

    const intl = useIntl()
    const DeleteMsg = intl.formatMessage({ id: 'Delete' })
    const CancelMsg = intl.formatMessage({ id: 'Cancel' })
    const SaveMsg = intl.formatMessage({ id: 'Save' })
    const FieldIsRequiredMsg = intl.formatMessage({ id: 'FieldIsRequired' })

    const handleOk = () => {
        form.submit()
    }

    const handleFinish = values => {
        onFinish(unit, { action: 'change', ...values })
    }

    const handleDelete = () => {
        onFinish(unit, { action: 'delete' })
    }

    return (
        <Modal title={'Изменить помещение'} visible={visible} onCancel={onCancel} footer={[
            <Button key="delete" type="danger" onClick={handleDelete} style={{ float: 'left' }}>{DeleteMsg}</Button>,
            <Button key="back" onClick={onCancel}>{CancelMsg}</Button>,
            <Button key="submit" type="primary" onClick={handleOk}>{SaveMsg}</Button>,
        ]}>
            <Form form={form} layout="vertical" name="change-unit-form" onFinish={handleFinish}>
                <Form.Item
                    name="name"
                    label={'Номер помещения'}
                    rules={[{ required: true, message: FieldIsRequiredMsg }]}
                >
                    <Input/>
                </Form.Item>
            </Form>
        </Modal>
    )
}

const ChangeSectionModalForm = ({ section, visible, onCancel, onFinish }) => {
    const [form] = Form.useForm()
    useEffect(() => {
        if (visible) form.setFields([{ name: 'name', value: section.name }])
    }, [form, section])
    useResetFormOnCloseModal({
        form,
        visible,
    })

    const intl = useIntl()
    const DeleteMsg = intl.formatMessage({ id: 'Delete' })
    const CancelMsg = intl.formatMessage({ id: 'Cancel' })
    const SaveMsg = intl.formatMessage({ id: 'Save' })
    const FieldIsRequiredMsg = intl.formatMessage({ id: 'FieldIsRequired' })

    const handleOk = () => {
        form.submit()
    }

    const handleFinish = values => {
        onFinish(section, { action: 'change', ...values })
    }

    const handleDelete = () => {
        onFinish(section, { action: 'delete' })
    }

    return (
        <Modal title={'Изменить подъезд'} visible={visible} onCancel={onCancel} footer={[
            <Button key="delete" type="danger" onClick={handleDelete} style={{ float: 'left' }}>{DeleteMsg}</Button>,
            <Button key="back" onClick={onCancel}>{CancelMsg}</Button>,
            <Button key="submit" type="primary" onClick={handleOk}>{SaveMsg}</Button>,
        ]}>
            <Form form={form} layout="vertical" name="change-section-form" onFinish={handleFinish}>
                <Form.Item
                    name="name"
                    label={'Подъезд'}
                    rules={[{ required: true, message: FieldIsRequiredMsg }]}
                >
                    <Input/>
                </Form.Item>
            </Form>
        </Modal>
    )
}

export function NewSectionForm ({ onFinish }) {
    const [form] = Form.useForm()

    const intl = useIntl()
    const FieldIsRequiredMsg = intl.formatMessage({ id: 'FieldIsRequired' })

    const handleFinish = values => {
        onFinish(values)
    }

    return <Form form={form} onFinish={handleFinish}>
        <Input.Group compact>
            <Form.Item name='sectionName' rules={[{ required: true, message: FieldIsRequiredMsg }]}>
                <Input size="small" style={{ width: 100, textAlign: 'center' }} placeholder={'Подъезд'}/>
            </Form.Item>
            <Form.Item name='minFloor' rules={[{ required: true, message: FieldIsRequiredMsg }]}>
                <InputNumber size="small" style={{ width: 100, textAlign: 'center' }} placeholder={'Мин.этаж'}/>
            </Form.Item>
            <Form.Item name='maxFloor' rules={[{ required: true, message: FieldIsRequiredMsg }]}>
                <InputNumber size="small" style={{ width: 100, textAlign: 'center' }} placeholder={'Макс.этаж'}/>
            </Form.Item>
            <Form.Item name='unitsPerFloor' rules={[{ required: true, message: FieldIsRequiredMsg }]}>
                <InputNumber min={1} size="small" name='flatsPerFloor' style={{ width: 150, textAlign: 'center' }}
                    placeholder={'Квартир на этаже'}/>
            </Form.Item>
            <Form.Item><Button size="small" htmlType='submit'>+ {'Добавить подъезд'}</Button></Form.Item>
        </Input.Group>
    </Form>

}

export function NewUnitForm ({ sections, floors, onFinish }) {
    const [form] = Form.useForm()
    const handleFinish = values => {
        onFinish(values)
    }

    const intl = useIntl()
    const FieldIsRequiredMsg = intl.formatMessage({ id: 'FieldIsRequired' })

    return <Form form={form} onFinish={handleFinish}>
        <Input.Group compact>
            <Form.Item name='unitName'>
                <Input size="small" style={{ width: 100, textAlign: 'center' }} placeholder={'Номер'}/>
            </Form.Item>
            <Form.Item name='sectionPos' rules={[{ required: true, message: FieldIsRequiredMsg }]}>
                <Select size='small' placeholder={'Подъезд'} allowClear>
                    {sections.map((section) => {
                        const v = section.pos.join('-')
                        return <Select.Option key={v} value={v}>{section.name}</Select.Option>
                    })}
                </Select>
            </Form.Item>
            <Form.Item name='floorPos' rules={[{ required: true, message: FieldIsRequiredMsg }]}>
                <Select size='small' placeholder={'Этаж'} allowClear>
                    {floors.map((floor) => {
                        const v = floor.pos.join('-')
                        return <Select.Option key={v} value={v}>{floor.name}</Select.Option>
                    })}
                </Select>
            </Form.Item>
            <Form.Item><Button size="small" htmlType='submit'>+ {'Добавить помещение'}</Button></Form.Item>
        </Input.Group>
    </Form>

}

export function BBuilder ({ onChangeState, onSaveState, state }) {
    const [stateSnapshot, setStateSnapshot] = useState(JSON.stringify(state))
    const [isChangeUnitModalOpen, setIsChangeUnitModalOpen] = useState(false)
    const [selectedUnit, setSelectedUnit] = useState({})

    const [isChangeSectionModalOpen, setIsChangeSectionModalOpen] = useState(false)
    const [selectedSection, setSelectedSection] = useState({})

    const [matrix, data, { createUnit, updateUnit, deleteUnit, createSection, updateSection, deleteSection }] = useBBuildingMatrixData(state)
    let key = 0

    useEffect(() => {
        const dataSnapshot = JSON.stringify(data)
        if (onChangeState && stateSnapshot !== dataSnapshot) {
            setStateSnapshot(dataSnapshot)
            onChangeState(JSON.parse(dataSnapshot))
        }
    })

    const handleAddNewUnit = (values) => {
        createUnit(values)
    }

    const handleClickUnit = ({ section, floor, unit }) => {
        setSelectedUnit(unit)
        setIsChangeUnitModalOpen(true)
    }

    const handleCloseChangeUnitForm = () => {
        setSelectedUnit({})
        setIsChangeUnitModalOpen(false)
    }

    const handleFinishChangeUnitForm = (unit, values) => {
        if (values.action === 'delete') {
            deleteUnit(unit)
        } else if (values.action === 'change') {
            updateUnit(unit, values)
        }
        setIsChangeUnitModalOpen(false)
    }

    const handleAddNewSection = (values) => {
        createSection(values)
    }

    const handleClickSection = ({ section }) => {
        setSelectedSection(section)
        setIsChangeSectionModalOpen(true)
    }

    const handleCloseChangeSectionForm = () => {
        setSelectedSection({})
        setIsChangeSectionModalOpen(false)
    }

    const handleFinishChangeSectionForm = (section, values) => {
        if (values.action === 'delete') {
            deleteSection(section)
        } else if (values.action === 'change') {
            updateSection(section, values)
        }
        setIsChangeSectionModalOpen(false)
    }

    function handleSave () {
        if (onSaveState) {
            const dataWithUpdatedLabels = updateUnitsLabels(data)
            onSaveState(dataWithUpdatedLabels)
        }
    }

    return <>
        <BPanel>
            <NewSectionForm onFinish={handleAddNewSection}/>
            <NewUnitForm sections={matrix.sections} floors={matrix.floors} onFinish={handleAddNewUnit}/>
            <Button htmlType='submit' onClick={handleSave}>{'Сохранить изменения'}</Button>
            <ChangeUnitModalForm visible={isChangeUnitModalOpen} onCancel={handleCloseChangeUnitForm}
                onFinish={handleFinishChangeUnitForm} unit={selectedUnit}
            />
            <ChangeSectionModalForm visible={isChangeSectionModalOpen} onCancel={handleCloseChangeSectionForm}
                onFinish={handleFinishChangeSectionForm} section={selectedSection}
            />
        </BPanel>
        <BContainer>
            <BPlane matrix={matrix} onUnitClick={handleClickUnit} onSectionClick={handleClickSection}/>
            <BAxisY>
                <div className="bb-text">этажи</div>
            </BAxisY>
            <BAxisX>
                <div className="bb-text">секции / подъезды</div>
            </BAxisX>
            <BAxisYLabels className='floor-names'>
                <BFloor key={key++}/>
                {
                    matrix.floors.map(floor => {
                        return <BFloor key={key++}><BSection><BCellWrapper>
                            {floor.name}
                        </BCellWrapper></BSection></BFloor>
                    })
                }
            </BAxisYLabels>
        </BContainer>
    </>
}
