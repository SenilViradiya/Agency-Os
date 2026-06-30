'use client';

import { useEffect, useState } from 'react';
import { 
    Drawer, 
    Form, 
    Input, 
    Button, 
    Select, 
    DatePicker, 
    Space, 
    Typography, 
    Divider, 
    Row, 
    Col,
    message
} from 'antd';
import { CloseOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import UserSelect from '@/components/shared/UserSelect';
import apiClient from '@/lib/apiClient';

const { Text } = Typography;
const { Option } = Select;
const { TextArea } = Input;

interface ContentDrawerProps {
    open: boolean;
    onClose: () => void;
    onSubmit: (values: any) => void;
    initialData?: any;
    loading?: boolean;
}

const CONTENT_TYPES = [
    { value: 'youtube_video', label: 'YouTube Video' },
    { value: 'reel', label: 'Instagram Reel' },
    { value: 'short', label: 'YouTube Short' },
    { value: 'static_post', label: 'Static Post' },
    { value: 'carousel', label: 'Carousel' },
    { value: 'story', label: 'Story' },
    { value: 'podcast', label: 'Podcast' },
    { value: 'blog', label: 'Blog Post' },
    { value: 'other', label: 'Other' },
];

const PLATFORMS = ['YouTube', 'Instagram', 'LinkedIn', 'Facebook', 'TikTok', 'Twitter', 'Pinterest'];
const PRIORITIES = ['low', 'medium', 'high'];

export default function ContentDrawer({ open, onClose, onSubmit, initialData, loading }: ContentDrawerProps) {
    const [form] = Form.useForm();
    const [projects, setProjects] = useState<any[]>([]);

    useEffect(() => {
        apiClient.get('/projects?limit=100').then(res => {
            if (res.data.success) setProjects(res.data.data);
        });
    }, []);

    useEffect(() => {
        if (open) {
            if (initialData) {
                form.setFieldsValue({
                    ...initialData,
                    plannedPublishDate: initialData.plannedPublishDate ? dayjs(initialData.plannedPublishDate) : null,
                    projectId: typeof initialData.projectId === 'object' ? initialData.projectId._id : initialData.projectId,
                    clientId: typeof initialData.clientId === 'object' ? initialData.clientId.businessName : '',
                    assignedTo: typeof initialData.assignedTo === 'object' ? initialData.assignedTo._id : initialData.assignedTo,
                });
            } else {
                form.resetFields();
                form.setFieldsValue({
                    contentType: 'youtube_video',
                    priority: 'medium',
                    platforms: ['YouTube'],
                });
            }
        }
    }, [initialData, open, form]);

    const onFinish = (values: any) => {
        const selectedProject = projects.find(p => p._id === values.projectId);
        onSubmit({
            ...values,
            clientId: selectedProject?.clientId?._id || selectedProject?.clientId,
            plannedPublishDate: values.plannedPublishDate ? values.plannedPublishDate.toDate() : null,
        });
    };

    const handleProjectChange = (projectId: string) => {
        const project = projects.find(p => p._id === projectId);
        if (project) {
            form.setFieldsValue({
                clientId: project.clientId?.businessName || 'Selected Client'
            });
        }
    };

    return (
        <Drawer
            title={initialData ? 'Edit Content Item' : 'New Content Item'}
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
                            {initialData ? 'Update Item' : 'Create Item'}
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
                <div>
                   <Text strong style={{ color: '#6C63FF', textTransform: 'uppercase', fontSize: 12 }}>1. Concept</Text>
                   <Divider style={{ margin: '8px 0 16px 0' }} />
                   <Form.Item name="title" label="Content Title" rules={[{ required: true }]}>
                       <Input placeholder="e.g. 5 Growth Hacks for 2025" />
                   </Form.Item>
                   <Form.Item name="description" label="Brief/Description">
                       <TextArea rows={3} placeholder="What is this content about?" />
                   </Form.Item>
                   <Row gutter={16}>
                       <Col span={12}>
                           <Form.Item name="contentType" label="Content Type" rules={[{ required: true }]}>
                               <Select>
                                   {CONTENT_TYPES.map(t => <Option key={t.value} value={t.value}>{t.label}</Option>)}
                               </Select>
                           </Form.Item>
                       </Col>
                       <Col span={12}>
                           <Form.Item name="platforms" label="Platforms">
                               <Select mode="multiple">
                                   {PLATFORMS.map(p => <Option key={p} value={p}>{p}</Option>)}
                               </Select>
                           </Form.Item>
                       </Col>
                   </Row>
                </div>

                <div style={{ marginTop: 24 }}>
                   <Text strong style={{ color: '#6C63FF', textTransform: 'uppercase', fontSize: 12 }}>2. Context</Text>
                   <Divider style={{ margin: '8px 0 16px 0' }} />
                   <Row gutter={16}>
                       <Col span={12}>
                           <Form.Item name="projectId" label="Related Project" rules={[{ required: true }]}>
                               <Select showSearch placeholder="Select project" onChange={handleProjectChange}>
                                   {projects.map(p => <Option key={p._id} value={p._id}>{p.name}</Option>)}
                               </Select>
                           </Form.Item>
                       </Col>
                       <Col span={12}>
                           <Form.Item name="clientId" label="Client (Auto)">
                               <Input readOnly placeholder="Client name" style={{ background: '#f5f5f5' }} />
                           </Form.Item>
                       </Col>
                   </Row>
                </div>

                <div style={{ marginTop: 24 }}>
                   <Text strong style={{ color: '#6C63FF', textTransform: 'uppercase', fontSize: 12 }}>3. Planning</Text>
                   <Divider style={{ margin: '8px 0 16px 0' }} />
                   <Row gutter={16}>
                       <Col span={24}>
                            <Form.Item name="assignedTo" rules={[{ required: true }]}>
                                <UserSelect label="Assign Main Owner" />
                            </Form.Item>
                       </Col>
                       <Col span={12}>
                           <Form.Item name="plannedPublishDate" label="Planned Publish Date">
                               <DatePicker style={{ width: '100%' }} format="DD MMM YYYY" />
                           </Form.Item>
                       </Col>
                       <Col span={12}>
                           <Form.Item name="priority" label="Priority">
                               <Select>
                                   {PRIORITIES.map(p => <Option key={p} value={p} style={{ textTransform: 'capitalize' }}>{p}</Option>)}
                               </Select>
                           </Form.Item>
                       </Col>
                   </Row>
                </div>

                <div style={{ marginTop: 24 }}>
                   <Text strong style={{ color: '#6C63FF', textTransform: 'uppercase', fontSize: 12 }}>4. Meta</Text>
                   <Divider style={{ margin: '8px 0 16px 0' }} />
                   <Form.Item name="tags" label="Tags">
                       <Select mode="tags" placeholder="Add tags..." />
                   </Form.Item>
                </div>
            </Form>
        </Drawer>
    );
}
