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
    Radio
} from 'antd';
import { CloseOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import UserSelect from '@/components/shared/UserSelect';
import apiClient from '@/lib/apiClient';

const { Title, Text } = Typography;
const { Option } = Select;
const { TextArea } = Input;

interface ProjectDrawerProps {
    open: boolean;
    onClose: () => void;
    onSubmit: (values: any) => void;
    initialData?: any;
    loading?: boolean;
}

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

export default function ProjectDrawer({ open, onClose, onSubmit, initialData, loading }: ProjectDrawerProps) {
    const [form] = Form.useForm();
    const [clients, setClients] = useState<any[]>([]);
    const projectType = Form.useWatch('type', form);

    useEffect(() => {
        apiClient.get('/clients?limit=100').then(res => {
            if (res.data.success) setClients(res.data.data);
        });
    }, []);

    useEffect(() => {
        if (open) {
            if (initialData) {
                form.setFieldsValue({
                    ...initialData,
                    clientId: typeof initialData.clientId === 'object' ? initialData.clientId._id : initialData.clientId,
                    projectManager: typeof initialData.projectManager === 'object' ? initialData.projectManager._id : initialData.projectManager,
                    teamMembers: initialData.teamMembers?.map((t: any) => typeof t === 'object' ? t._id : t) || [],
                    deadline: initialData.deadline ? dayjs(initialData.deadline) : null,
                    startDate: initialData.startDate ? dayjs(initialData.startDate) : null,
                });
            } else {
                form.resetFields();
                form.setFieldsValue({
                    type: 'retainer',
                    status: 'planning',
                    priority: 'medium',
                    contentQuota: { youtubeVideos: 0, reels: 0, shorts: 0, posts: 0, stories: 0, other: 0 },
                    startDate: dayjs(),
                    totalTasks: 0,
                    completedTasks: 0,
                });
            }
        }
    }, [initialData, open, form]);

    const onFinish = (values: any) => {
        onSubmit({
            ...values,
            startDate: values.startDate ? values.startDate.toDate() : new Date(),
            deadline: values.deadline ? values.deadline.toDate() : null,
        });
    };

    return (
        <Drawer
            title={initialData ? 'Edit Project' : 'Launch New Project'}
            placement="right"
            onClose={onClose}
            open={open}
            size="default"
            extra={<Button type="text" icon={<CloseOutlined />} onClick={onClose} />}
            footer={
                <div style={{ textAlign: 'right', padding: '10px 0' }}>
                    <Space>
                        <Button onClick={onClose} disabled={loading}>Cancel</Button>
                        <Button type="primary" onClick={() => form.submit()} loading={loading}>
                            {initialData ? 'Update Project' : 'Launch Project'}
                        </Button>
                    </Space>
                </div>
            }
        >
            <Form
                form={form}
                layout="vertical"
                onFinish={onFinish}
                requiredMark="optional"
            >
                <div style={{ marginBottom: 24 }}>
                    <Text strong style={{ color: '#6C63FF', textTransform: 'uppercase', fontSize: 12 }}>
                        1. Project Type & Client
                    </Text>
                    <Divider style={{ margin: '8px 0 16px 0' }} />
                    
                    <Form.Item name="type" label="Project Type">
                        <Radio.Group buttonStyle="solid" style={{ width: '100%' }}>
                            <Radio.Button value="retainer" style={{ width: '50%', textAlign: 'center' }}>Retainer</Radio.Button>
                            <Radio.Button value="campaign" style={{ width: '50%', textAlign: 'center' }}>Campaign</Radio.Button>
                        </Radio.Group>
                    </Form.Item>

                    <Form.Item 
                        name="clientId" 
                        label="Select Client" 
                        rules={[{ required: true, message: 'Please select a client' }]}
                    >
                        <Select placeholder="Choose client">
                            {clients.map(c => (
                                <Option key={c._id} value={c._id}>{c.businessName}</Option>
                            ))}
                        </Select>
                    </Form.Item>

                    <Form.Item 
                        name="name" 
                        label="Project Name" 
                        rules={[{ required: true, message: 'Please enter project name' }]}
                    >
                        <Input placeholder="e.g. YouTube Content Pipeline" />
                    </Form.Item>

                    <Form.Item 
                        name="startDate" 
                        label="Project Start Date" 
                        rules={[{ required: true, message: 'Start date is required' }]}
                    >
                        <DatePicker style={{ width: '100%' }} format="DD MMM YYYY" />
                    </Form.Item>
                </div>

                <div style={{ marginBottom: 24 }}>
                    <Text strong style={{ color: '#6C63FF', textTransform: 'uppercase', fontSize: 12 }}>
                        2. Configuration
                    </Text>
                    <Divider style={{ margin: '8px 0 16px 0' }} />
                    
                    <Row gutter={16}>
                        <Col span={24} style={{ marginBottom: 24 }}>
                            <Form.Item name="projectManager" rules={[{ required: true }]}>
                                <UserSelect label="Project Manager" />
                            </Form.Item>
                        </Col>
                        <Col span={24} style={{ marginBottom: 24 }}>
                            <Form.Item name="teamMembers">
                                <UserSelect multiple label="Team Members" />
                            </Form.Item>
                        </Col>

                        {projectType === 'retainer' ? (
                            <>
                                <Col span={24}>
                                    <Form.Item name="retainerMonth" label="Retainer Month">
                                        <Select placeholder="Select month">
                                            {MONTHS.map(m => <Option key={m} value={m}>{m}</Option>)}
                                        </Select>
                                    </Form.Item>
                                </Col>
                                <Col span={8}>
                                    <Form.Item name={['contentQuota', 'youtubeVideos']} label="YouTube">
                                        <InputNumber style={{ width: '100%' }} min={0} />
                                    </Form.Item>
                                </Col>
                                <Col span={8}>
                                    <Form.Item name={['contentQuota', 'reels']} label="Reels">
                                        <InputNumber style={{ width: '100%' }} min={0} />
                                    </Form.Item>
                                </Col>
                                <Col span={8}>
                                    <Form.Item name={['contentQuota', 'shorts']} label="Shorts">
                                        <InputNumber style={{ width: '100%' }} min={0} />
                                    </Form.Item>
                                </Col>
                                <Col span={8}>
                                    <Form.Item name={['contentQuota', 'posts']} label="Static Posts">
                                        <InputNumber style={{ width: '100%' }} min={0} />
                                    </Form.Item>
                                </Col>
                                <Col span={8}>
                                    <Form.Item name={['contentQuota', 'stories']} label="Stories">
                                        <InputNumber style={{ width: '100%' }} min={0} />
                                    </Form.Item>
                                </Col>
                                <Col span={8}>
                                    <Form.Item name={['contentQuota', 'other']} label="Other">
                                        <InputNumber style={{ width: '100%' }} min={0} />
                                    </Form.Item>
                                </Col>
                            </>
                        ) : (
                            <>
                                <Col span={24}>
                                    <Form.Item name="campaignObjective" label="Campaign Objective">
                                        <TextArea rows={2} placeholder="What is the goal of this campaign?" />
                                    </Form.Item>
                                </Col>
                                <Col span={24}>
                                    <Form.Item name="deadline" label="Campaign Deadline">
                                        <DatePicker style={{ width: '100%' }} format="DD MMM YYYY" />
                                    </Form.Item>
                                </Col>
                            </>
                        )}
                    </Row>
                </div>

                <div style={{ marginBottom: 24 }}>
                    <Text strong style={{ color: '#6C63FF', textTransform: 'uppercase', fontSize: 12 }}>
                        3. Status & Tasks
                    </Text>
                    <Divider style={{ margin: '8px 0 16px 0' }} />
                    <Row gutter={16}>
                        <Col span={12}>
                            <Form.Item name="status" label="Status" rules={[{ required: true }]}>
                                <Select>
                                    <Option value="planning">Planning</Option>
                                    <Option value="active">Active</Option>
                                    <Option value="on_hold">On Hold</Option>
                                    <Option value="completed">Completed</Option>
                                    <Option value="cancelled">Cancelled</Option>
                                </Select>
                            </Form.Item>
                        </Col>
                        <Col span={12}>
                            <Form.Item name="priority" label="Priority" rules={[{ required: true }]}>
                                <Select>
                                    <Option value="low">Low</Option>
                                    <Option value="medium">Medium</Option>
                                    <Option value="high">High</Option>
                                </Select>
                            </Form.Item>
                        </Col>
                        <Col span={12}>
                            <Form.Item name="totalTasks" label="Total Tasks">
                                <InputNumber style={{ width: '100%' }} min={0} />
                            </Form.Item>
                        </Col>
                        <Col span={12}>
                            <Form.Item name="completedTasks" label="Completed">
                                <InputNumber style={{ width: '100%' }} min={0} />
                            </Form.Item>
                        </Col>
                    </Row>
                </div>
            </Form>
        </Drawer>
    );
}
