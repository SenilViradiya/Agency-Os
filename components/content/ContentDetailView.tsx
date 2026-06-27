'use client';

import { useState, useEffect } from 'react';
import { 
    Typography, 
    Card, 
    Space, 
    Tag, 
    Avatar, 
    Button, 
    Flex, 
    Spin, 
    App, 
    Row, 
    Col, 
    Breadcrumb,
    Divider,
    Popconfirm,
    Modal,
    Form,
    Input,
    DatePicker,
    Select
} from 'antd';
import { 
    EditOutlined, 
    DeleteOutlined, 
    CheckCircleOutlined,
    MinusCircleOutlined,
    RollbackOutlined,
    FileTextOutlined,
    VideoCameraOutlined,
    PictureOutlined,
    MessageOutlined,
    SendOutlined
} from '@ant-design/icons';
import dayjs from 'dayjs';
import PipelineStageBar from './PipelineStageBar';
import StageSection from './StageSection';
import apiClient from '@/lib/apiClient';

const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;

interface ContentDetailViewProps {
    id: string;
}

const STAGE_CONFIG: Record<string, { title: string, icon: any }> = {
    script: { title: 'Script', icon: <FileTextOutlined /> },
    shoot: { title: 'Shoot', icon: <VideoCameraOutlined /> },
    edit: { title: 'Edit', icon: <EditOutlined /> },
    thumbnail: { title: 'Thumbnail', icon: <PictureOutlined /> },
    caption: { title: 'Caption', icon: <MessageOutlined /> },
    approval: { title: 'Approval', icon: <CheckCircleOutlined /> },
    publish: { title: 'Publish', icon: <SendOutlined /> },
};

export default function ContentDetailView({ id }: ContentDetailViewProps) {
    const { message } = App.useApp();
    const [item, setItem] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [editModal, setEditModal] = useState<{ open: boolean, stage: string | null }>({ open: false, stage: null });
    const [form] = Form.useForm();

    const fetchItem = async () => {
        setLoading(true);
        try {
            const res = await apiClient.get(`/content/${id}`);
            if (res.data.success) {
                setItem(res.data.data);
            }
        } catch (error) {
            console.error('Failed to fetch content:', error);
            message.error('Failed to load content details');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (id) fetchItem();
    }, [id]);

    const handleStageAction = async (action: 'advance' | 'skip' | 'revert', stage?: string) => {
        try {
            const res = await apiClient.post(`/content/${id}/stage`, { action, stage });
            if (res.data.success) {
                setItem(res.data.data);
                message.success(`Stage ${action}ed successfully`);
                fetchItem(); // Refresh full data
            }
        } catch (error) {
            message.error('Action failed');
        }
    };

    const handleEditStage = (stage: string) => {
        const stageData = item[`${stage}Data`] || {};
        form.setFieldsValue({
            ...stageData,
            scheduledDate: stageData.scheduledDate ? dayjs(stageData.scheduledDate) : null,
            scheduledAt: stageData.scheduledAt ? dayjs(stageData.scheduledAt) : null,
        });
        setEditModal({ open: true, stage });
    };

    const handleSaveStageData = async () => {
        const values = await form.validateFields();
        const stage = editModal.stage;
        
        // Clean dates
        if (values.scheduledDate) values.scheduledDate = values.scheduledDate.toDate();
        if (values.scheduledAt) values.scheduledAt = values.scheduledAt.toDate();

        try {
            const res = await apiClient.put(`/content/${id}`, { [`${stage}Data`]: values });
            if (res.data.success) {
                setItem(res.data.data);
                setEditModal({ open: false, stage: null });
                message.success('Stage data updated');
            }
        } catch (error) {
            message.error('Update failed');
        }
    };

    if (loading) return <div style={{ textAlign: 'center', padding: '100px 0' }}><Spin size="large" /></div>;
    if (!item) return <div>Content item not found</div>;

    return (
        <div>
            <div style={{ marginBottom: 24 }}>
                <Breadcrumb 
                    items={[
                        { title: 'Dashboard' },
                        { title: 'Content Planner' },
                        { title: item.contentNumber }
                    ]}
                    style={{ marginBottom: 16 }}
                />
                
                <Flex justify="space-between" align="start">
                    <div>
                        <Space align="center" style={{ marginBottom: 8 }}>
                            <Tag color="purple" style={{ borderRadius: 4 }}>{item.contentNumber}</Tag>
                            <Tag style={{ borderRadius: 4 }}>{item.contentType.replace('_', ' ').toUpperCase()}</Tag>
                            <Tag color="blue" style={{ borderRadius: 4 }}>{item.status.toUpperCase()}</Tag>
                        </Space>
                        <Title level={2} style={{ margin: 0 }}>{item.title}</Title>
                        <Space style={{ marginTop: 8 }} split={<Divider type="vertical" />}>
                            <Text type="secondary">{item.projectId?.name}</Text>
                            <Text type="secondary">{item.clientId?.businessName}</Text>
                            <Space>
                                <Avatar size="small" src={item.assignedTo?.avatar} />
                                <Text type="secondary">{item.assignedTo?.name}</Text>
                            </Space>
                        </Space>
                    </div>
                    <Space>
                        <Button icon={<EditOutlined />}>Edit</Button>
                        <Button danger icon={<DeleteOutlined />}>Delete</Button>
                    </Space>
                </Flex>
            </div>

            <PipelineStageBar currentStage={item.currentStage} stageStatuses={item.stageStatuses} />

            <Card style={{ marginBottom: 24, borderRadius: 12 }}>
                <Flex justify="space-between" align="center">
                    <Space size="large">
                        <div>
                            <Text type="secondary" style={{ fontSize: 11, textTransform: 'uppercase', display: 'block' }}>Current Active Stage</Text>
                            <Tag color="blue" icon={STAGE_CONFIG[item.currentStage]?.icon} style={{ fontSize: 16, padding: '4px 12px', marginTop: 4 }}>
                                {item.currentStage.toUpperCase()}
                            </Tag>
                        </div>
                        <div>
                            <Text type="secondary" style={{ fontSize: 11, textTransform: 'uppercase', display: 'block' }}>Publish Date</Text>
                            <Text strong style={{ fontSize: 16 }}>{item.plannedPublishDate ? dayjs(item.plannedPublishDate).format('DD MMM YYYY') : 'Not set'}</Text>
                        </div>
                    </Space>

                    <Space size="middle">
                        <Popconfirm title="Advance to next stage?" onConfirm={() => handleStageAction('advance')}>
                            <Button type="primary" size="large" icon={<CheckCircleOutlined />} style={{ background: '#52c41a' }}>
                                Mark Stage Done
                            </Button>
                        </Popconfirm>
                        <Popconfirm title="Skip this stage?" onConfirm={() => handleStageAction('skip', item.currentStage)}>
                            <Button size="large" icon={<MinusCircleOutlined />}>
                                Skip Stage
                            </Button>
                        </Popconfirm>
                        <Popconfirm title="Revert to previous stage?" onConfirm={() => handleStageAction('revert')}>
                            <Button size="large" danger icon={<RollbackOutlined />}>
                                Revert Stage
                            </Button>
                        </Popconfirm>
                    </Space>
                </Flex>
            </Card>

            <div style={{ marginBottom: 40 }}>
                {Object.entries(STAGE_CONFIG).map(([key, config]) => (
                    <StageSection 
                        key={key}
                        stageKey={key}
                        title={config.title}
                        icon={config.icon}
                        status={item.stageStatuses[key]}
                        data={item[`${key}Data`]}
                        isActive={item.currentStage === key}
                        onEdit={() => handleEditStage(key)}
                    />
                ))}
            </div>

            <Modal
                title={`Edit Stage Data: ${editModal.stage?.toUpperCase()}`}
                open={editModal.open}
                onCancel={() => setEditModal({ open: false, stage: null })}
                onOk={handleSaveStageData}
                width={600}
            >
                <Form form={form} layout="vertical" style={{ marginTop: 24 }}>
                    {editModal.stage === 'script' && (
                        <>
                            <Form.Item name="googleDocLink" label="Google Doc Link">
                                <Input placeholder="https://docs.google.com/..." />
                            </Form.Item>
                            <Form.Item name="scriptText" label="Script Text">
                                <TextArea rows={6} />
                            </Form.Item>
                        </>
                    )}
                    {editModal.stage === 'shoot' && (
                        <>
                            <Form.Item name="scheduledDate" label="Shoot Date">
                                <DatePicker style={{ width: '100%' }} />
                            </Form.Item>
                            <Form.Item name="location" label="Location">
                                <Input />
                            </Form.Item>
                            <Form.Item name="rawFootageLink" label="Raw Footage Link">
                                <Input />
                            </Form.Item>
                        </>
                    )}
                    {(editModal.stage === 'edit' || editModal.stage === 'thumbnail') && (
                        <>
                            <Form.Item name={editModal.stage === 'edit' ? 'draftVideoLink' : 'thumbnailUrl'} label="File/Review Link">
                                <Input />
                            </Form.Item>
                            <Form.Item name={editModal.stage === 'edit' ? 'editNotes' : 'notes'} label="Notes">
                                <TextArea rows={3} />
                            </Form.Item>
                        </>
                    )}
                    {editModal.stage === 'publish' && (
                        <>
                            <Form.Item name="scheduledAt" label="Scheduled Time">
                                <DatePicker showTime style={{ width: '100%' }} />
                            </Form.Item>
                            <Form.Item name="publishedUrl" label="Live URL">
                                <Input />
                            </Form.Item>
                        </>
                    )}
                </Form>
            </Modal>
        </div>
    );
}
