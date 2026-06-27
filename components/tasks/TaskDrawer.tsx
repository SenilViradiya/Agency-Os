'use client';

import { useEffect, useState } from 'react';
import { 
    Drawer, 
    Form, 
    Input, 
    Button, 
    Select, 
    DatePicker, 
    InputNumber, 
    Space, 
    Typography, 
    Divider, 
    Row, 
    Col,
    List
} from 'antd';
import { CloseOutlined, PlusOutlined, DeleteOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import UserSelect from '@/components/shared/UserSelect';
import apiClient from '@/lib/apiClient';

const { Title, Text } = Typography;
const { Option } = Select;
const { TextArea } = Input;

interface TaskDrawerProps {
    open: boolean;
    onClose: () => void;
    onSubmit: (values: any) => void;
    initialData?: any;
    loading?: boolean;
}

const TASK_TYPES = ['script', 'shoot', 'edit', 'thumbnail', 'caption', 'approval', 'publish', 'review', 'research', 'meeting', 'admin', 'other'];
const PRIORITIES = ['low', 'medium', 'high', 'urgent'];
const STATUSES = ['todo', 'in_progress', 'in_review', 'done', 'blocked'];

export default function TaskDrawer({ open, onClose, onSubmit, initialData, loading }: TaskDrawerProps) {
    const [form] = Form.useForm();
    const [entityType, setEntityType] = useState('general');
    const [entities, setEntities] = useState<any[]>([]);

    useEffect(() => {
        if (open) {
            if (initialData) {
                setEntityType(initialData.entityType || 'general');
                form.setFieldsValue({
                    ...initialData,
                    startDate: initialData.startDate ? dayjs(initialData.startDate) : null,
                    dueDate: initialData.dueDate ? dayjs(initialData.dueDate) : null,
                    assignedTo: initialData.assignedTo?.map((u: any) => typeof u === 'object' ? u._id : u) || [],
                });
            } else {
                form.resetFields();
                form.setFieldsValue({
                    type: 'other',
                    priority: 'medium',
                    status: 'todo',
                    entityType: 'general',
                    startDate: dayjs(),
                });
            }
        }
    }, [initialData, open, form]);

    useEffect(() => {
        if (entityType && entityType !== 'general') {
            const endpoint = entityType === 'content_item' ? '/content' : `/${entityType}s`;
            apiClient.get(`${endpoint}?limit=100`).then(res => {
                if (res.data.success) {
                    setEntities(res.data.data);
                }
            });
        } else {
            setEntities([]);
        }
    }, [entityType]);

    const onFinish = (values: any) => {
        onSubmit({
            ...values,
            startDate: values.startDate ? values.startDate.toDate() : null,
            dueDate: values.dueDate ? values.dueDate.toDate() : null,
        });
    };

    return (
        <Drawer
            title={initialData ? 'Edit Task' : 'Add New Task'}
            placement="right"
            onClose={onClose}
            open={open}
            size="large"
            extra={<Button type="text" icon={<CloseOutlined />} onClick={onClose} />}
            footer={
                <div style={{ textAlign: 'right', padding: '10px 0' }}>
                    <Space>
                        <Button onClick={onClose} disabled={loading}>Cancel</Button>
                        <Button type="primary" onClick={() => form.submit()} loading={loading}>
                            {initialData ? 'Update Task' : 'Create Task'}
                        </Button>
                    </Space>
                </div>
            }
        >
            <Form
                form={form}
                layout="vertical"
                onFinish={onFinish}
                onValuesChange={(changed) => {
                    if (changed.entityType) setEntityType(changed.entityType);
                }}
                requiredMark="optional"
            >
                <div>
                   <Text strong style={{ color: '#6C63FF', textTransform: 'uppercase', fontSize: 12 }}>1. Basic Info</Text>
                   <Divider style={{ margin: '8px 0 16px 0' }} />
                   <Form.Item name="title" label="Task Title" rules={[{ required: true }]}>
                       <Input placeholder="What needs to be done?" />
                   </Form.Item>
                   <Form.Item name="description" label="Description">
                       <TextArea rows={4} placeholder="Add more details..." />
                   </Form.Item>
                   <Row gutter={16}>
                       <Col span={12}>
                           <Form.Item name="type" label="Type">
                               <Select>
                                   {TASK_TYPES.map(t => <Option key={t} value={t} style={{ textTransform: 'capitalize' }}>{t.replace('_', ' ')}</Option>)}
                               </Select>
                           </Form.Item>
                       </Col>
                       <Col span={12}>
                           <Form.Item name="priority" label="Priority">
                               <Select>
                                   {PRIORITIES.map(p => <Option key={p} value={p} style={{ textTransform: 'capitalize' }}>{p}</Option>)}
                               </Select>
                           </Form.Item>
                       </Col>
                       <Col span={24}>
                           <Form.Item name="status" label="Status">
                               <Select>
                                   {STATUSES.map(s => <Option key={s} value={s} style={{ textTransform: 'capitalize' }}>{s.replace('_', ' ')}</Option>)}
                               </Select>
                           </Form.Item>
                       </Col>
                   </Row>
                </div>

                <div style={{ marginTop: 24 }}>
                   <Text strong style={{ color: '#6C63FF', textTransform: 'uppercase', fontSize: 12 }}>2. Linking</Text>
                   <Divider style={{ margin: '8px 0 16px 0' }} />
                   <Row gutter={16}>
                       <Col span={12}>
                           <Form.Item name="entityType" label="Related To">
                               <Select>
                                   <Option value="general">General</Option>
                                   <Option value="project">Project</Option>
                                   <Option value="content_item">Content Item</Option>
                                   <Option value="client">Client</Option>
                                   <Option value="lead">Lead</Option>
                               </Select>
                           </Form.Item>
                       </Col>
                       <Col span={12}>
                           <Form.Item name="entityId" label="Select Item">
                               <Select disabled={entityType === 'general'} placeholder="Choose...">
                                   {entities.map(e => (
                                       <Option key={e._id} value={e._id}>
                                           {e.name || e.title || e.businessName || e.businessName}
                                       </Option>
                                   ))}
                               </Select>
                           </Form.Item>
                       </Col>
                   </Row>
                </div>

                <div style={{ marginTop: 24 }}>
                   <Text strong style={{ color: '#6C63FF', textTransform: 'uppercase', fontSize: 12 }}>3. Assignment & Timing</Text>
                   <Divider style={{ margin: '8px 0 16px 0' }} />
                   <Form.Item name="assignedTo" rules={[{ required: true, message: 'At least one assignee is required' }]}>
                       <UserSelect multiple label="Assigned To" />
                   </Form.Item>
                   <Row gutter={16}>
                       <Col span={12}>
                           <Form.Item name="startDate" label="Start Date">
                               <DatePicker style={{ width: '100%' }} format="DD MMM YYYY" />
                           </Form.Item>
                       </Col>
                       <Col span={12}>
                           <Form.Item name="dueDate" label="Due Date">
                               <DatePicker style={{ width: '100%' }} format="DD MMM YYYY" />
                           </Form.Item>
                       </Col>
                       <Col span={12}>
                           <Form.Item name="estimatedHours" label="Est. Hours">
                               <InputNumber style={{ width: '100%' }} min={0} step={0.5} />
                           </Form.Item>
                       </Col>
                   </Row>
                </div>

                <div style={{ marginTop: 24 }}>
                   <Text strong style={{ color: '#6C63FF', textTransform: 'uppercase', fontSize: 12 }}>4. Checklist</Text>
                   <Divider style={{ margin: '8px 0 16px 0' }} />
                   <Form.List name="checklist">
                       {(fields, { add, remove }) => (
                           <>
                               {fields.map(({ key, name, ...restField }) => (
                                   <Space key={key} style={{ display: 'flex', marginBottom: 8 }} align="baseline">
                                       <Form.Item
                                           {...restField}
                                           name={[name, 'text']}
                                           rules={[{ required: true, message: 'Missing item text' }]}
                                           style={{ marginBottom: 0, width: 350 }}
                                       >
                                           <Input placeholder="Checklist item..." />
                                       </Form.Item>
                                       <DeleteOutlined onClick={() => remove(name)} style={{ color: '#ff4d4f' }} />
                                   </Space>
                               ))}
                               <Button type="dashed" onClick={() => add()} block icon={<PlusOutlined />}>
                                   Add Checklist Item
                               </Button>
                           </>
                       )}
                   </Form.List>
                </div>

                <div style={{ marginTop: 24 }}>
                   <Text strong style={{ color: '#6C63FF', textTransform: 'uppercase', fontSize: 12 }}>5. Meta</Text>
                   <Divider style={{ margin: '8px 0 16px 0' }} />
                   <Form.Item name="tags" label="Tags">
                       <Select mode="tags" placeholder="Add tags..." />
                   </Form.Item>
                </div>
            </Form>
        </Drawer>
    );
}
