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
    Select,
    Drawer,
    Alert,
    Descriptions
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
    SendOutlined,
    LinkOutlined,
    RocketOutlined,
    ExclamationCircleOutlined
} from '@ant-design/icons';
import dayjs from 'dayjs';
import PipelineStageBar from './PipelineStageBar';
import StageSection from './StageSection';
import apiClient from '@/lib/apiClient';
import { useSession } from 'next-auth/react';
import PublishModal from '../publishing/PublishModal';
import ApprovalModal from '../approvals/ApprovalModal';
import RevisionModal from '../approvals/RevisionModal';

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
    const { data: session } = useSession();
    const { message } = App.useApp();
    const [item, setItem] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);
    
    // UI States
    const [editModal, setEditModal] = useState<{ open: boolean, stage: string | null }>({ open: false, stage: null });
    const [submitDrawerOpen, setSubmitDrawerOpen] = useState(false);
    const [publishModalOpen, setPublishModalOpen] = useState(false);
    const [approveModalOpen, setApproveModalOpen] = useState(false);
    const [revisionModalOpen, setRevisionModalOpen] = useState(false);
    
    const [form] = Form.useForm();
    const [submitForm] = Form.useForm();

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

    const currentRole = (session?.user as any)?.role;
    const isManager = currentRole === 'Manager' || currentRole === 'Super Admin' || currentRole === 'Admin';
    const isOwnerOrAssigned = (session?.user as any).id === item?.assignedTo?._id || isManager;

    const handleStageAction = async (action: 'advance' | 'skip' | 'revert', stage?: string) => {
        try {
            const res = await apiClient.post(`/content/${id}/stage`, { action, stage });
            if (res.data.success) {
                message.success(`Stage ${action}ed successfully`);
                fetchItem();
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

    const onSubmitForReview = async (values: any) => {
        setActionLoading(true);
        try {
            const res = await apiClient.post(`/content/${id}/submit`, values);
            if (res.data.success) {
                message.success('Content submitted for review!');
                setSubmitDrawerOpen(false);
                fetchItem();
            }
        } catch (error: any) {
            message.error(error.response?.data?.error || 'Submission failed');
        } finally {
            setActionLoading(false);
        }
    };

    const onApproveContent = async (values: any) => {
        setActionLoading(true);
        try {
            const res = await apiClient.post(`/approvals/${id}/approve`, values);
            if (res.data.success) {
                message.success('Approved! Content moved to Publish Queue.');
                setApproveModalOpen(false);
                fetchItem();
            }
        } catch (error: any) {
            message.error(error.response?.data?.error || 'Approval failed');
        } finally {
            setActionLoading(false);
        }
    };

    const onRevisionRequested = async (values: any) => {
        setActionLoading(true);
        try {
            const res = await apiClient.post(`/approvals/${id}/revision`, values);
            if (res.data.success) {
                message.warning('Revision requested. Editor has been notified.');
                setRevisionModalOpen(false);
                fetchItem();
            }
        } catch (error: any) {
            message.error(error.response?.data?.error || 'Failed to send revision request');
        } finally {
            setActionLoading(false);
        }
    };

    const onFinalPublish = async (values: any) => {
        setActionLoading(true);
        try {
            const res = await apiClient.post(`/publishing/${id}/publish`, values);
            if (res.data.success) {
                message.success('Published! Content archived in log.');
                setPublishModalOpen(false);
                fetchItem();
            }
        } catch (error: any) {
            message.error(error.response?.data?.error || 'Publish failed');
        } finally {
            setActionLoading(false);
        }
    };

    if (loading) return <div style={{ textAlign: 'center', padding: '100px 0' }}><Spin size="large" /></div>;
    if (!item) return <div>Content item not found</div>;

    const renderApprovalSection = () => {
        const { status, submittedForReviewAt, submittedBy, driveLink, submissionNotes, revisionHistory } = item.approvalData;

        if (status === 'not_submitted') {
            return (
                <div style={{ padding: '24px', backgroundColor: '#f0f7ff', borderRadius: 12 }}>
                    <Alert 
                        message="Ready for Review?" 
                        description="Once you have the final file ready on Google Drive, submit it here for manager approval."
                        type="info" 
                        showIcon 
                        style={{ marginBottom: 16 }}
                    />
                    <Button type="primary" size="large" onClick={() => setSubmitDrawerOpen(true)}>Submit for Review</Button>
                </div>
            );
        }

        if (status === 'pending_review') {
            return (
                <Card style={{ borderRadius: 12, border: '1px solid #faad14', backgroundColor: '#fffbe6' }}>
                    <Flex vertical gap={16}>
                        <Alert 
                            message="Awaiting Manager Review" 
                            type="warning" 
                            showIcon 
                        />
                        <div>
                            <Text strong>Drive Link: </Text>
                            <a href={driveLink} target="_blank" rel="noreferrer">{driveLink}</a>
                        </div>
                        <Text type="secondary">Submitted by {submittedBy?.name} on {dayjs(submittedForReviewAt).format('DD MMM, HH:mm')}</Text>
                        
                        {isManager && (
                            <Space size="middle" style={{ marginTop: 8 }}>
                                <Button type="primary" style={{ backgroundColor: '#52c41a', borderColor: '#52c41a' }} onClick={() => setApproveModalOpen(true)}>Approve Content</Button>
                                <Button danger onClick={() => setRevisionModalOpen(true)}>Request Revision</Button>
                            </Space>
                        )}
                    </Flex>
                </Card>
            );
        }

        if (status === 'revision_requested') {
            const lastRev = revisionHistory[revisionHistory.length - 1];
            return (
                <Card style={{ borderRadius: 12, border: '1px solid #ff4d4f', backgroundColor: '#fff2f0' }}>
                    <Flex vertical gap={16}>
                        <Alert 
                            message="Revision Requested" 
                            description={lastRev?.revisionNotes}
                            type="error" 
                            showIcon 
                        />
                        <Button type="primary" icon={<RollbackOutlined />} onClick={() => setSubmitDrawerOpen(true)}>Resubmit with New Link</Button>
                    </Flex>
                </Card>
            );
        }

        if (status === 'approved') {
            return (
                <Card style={{ borderRadius: 12, border: '1px solid #52c41a', backgroundColor: '#f6ffed' }}>
                    <Flex vertical gap={8}>
                        <Alert message="Approved! ✓" type="success" showIcon />
                        <Text strong>Approved by {item.approvalData.reviewedBy?.name} on {dayjs(item.approvalData.approvedAt).format('DD MMM, HH:mm')}</Text>
                        {item.approvalData.approvalNotes && <Text italic>"{item.approvalData.approvalNotes}"</Text>}
                    </Flex>
                </Card>
            );
        }

        return null;
    };

    const renderPublishSection = () => {
        const { status, publishedAt, publishedBy, publishedUrl, platform } = item.publishData;

        if (status === 'ready_to_publish' || status === 'scheduled') {
            return (
                <div style={{ padding: '24px', backgroundColor: '#f6ffed', borderRadius: 12 }}>
                    <Alert 
                        message="Ready to Publish!" 
                        description="The content has been approved. Once it's live on the platform, log the details here."
                        type="success" 
                        showIcon 
                        style={{ marginBottom: 16 }}
                    />
                    <Button type="primary" size="large" icon={<RocketOutlined />} onClick={() => setPublishModalOpen(true)}>Mark as Published 🚀</Button>
                </div>
            );
        }

        if (status === 'published') {
            return (
                <Card style={{ borderRadius: 12, border: '1px solid #52c41a', backgroundColor: '#f6ffed' }}>
                    <Flex vertical gap={12}>
                        <Title level={4} style={{ color: '#52c41a', margin: 0 }}><RocketOutlined /> Published Live</Title>
                        <Descriptions size="small" column={1} bordered>
                            <Descriptions.Item label="Platform"><Tag>{platform?.toUpperCase()}</Tag></Descriptions.Item>
                            <Descriptions.Item label="Live URL"><a href={publishedUrl} target="_blank" rel="noreferrer">{publishedUrl}</a></Descriptions.Item>
                            <Descriptions.Item label="Published Date">{dayjs(publishedAt).format('DD MMM YYYY, HH:mm')}</Descriptions.Item>
                            <Descriptions.Item label="Logged By">{publishedBy?.name}</Descriptions.Item>
                        </Descriptions>
                    </Flex>
                </Card>
            );
        }

        return <Text type="secondary">Waiting for approval before publishing.</Text>;
    };

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
                        <Space align="center" style={{ marginBottom: 8 }} wrap>
                            <Tag color="purple" style={{ borderRadius: 4 }}>{item.contentNumber}</Tag>
                            <Tag style={{ borderRadius: 4 }}>{item.contentType.replace('_', ' ').toUpperCase()}</Tag>
                            <Tag color="blue" style={{ borderRadius: 4 }}>{item.status.toUpperCase()}</Tag>
                        </Space>
                        <Title level={2} style={{ margin: 0 }}>{item.title}</Title>
                        <Flex gap={8} align="center" style={{ marginTop: 8 }} wrap>
                            <Text type="secondary">{item.projectId?.name}</Text>
                            <span style={{ color: '#d9d9d9' }}>|</span>
                            <Text type="secondary">{item.clientId?.businessName}</Text>
                            <span style={{ color: '#d9d9d9' }}>|</span>
                            <Flex gap={8} align="center">
                                <Avatar size="small" src={item.assignedTo?.avatar} />
                                <Text type="secondary">{item.assignedTo?.name}</Text>
                            </Flex>
                        </Flex>
                    </div>
                    {isOwnerOrAssigned && (
                        <Space>
                            <Button icon={<EditOutlined />}>Edit Core Details</Button>
                            <Button danger icon={<DeleteOutlined />}>Delete</Button>
                        </Space>
                    )}
                </Flex>
            </div>

            <PipelineStageBar currentStage={item.currentStage} stageStatuses={item.stageStatuses} />

            <Card style={{ marginBottom: 24, borderRadius: 12 }}>
                <Flex justify="space-between" align="center" wrap="wrap" gap={16}>
                    <Space size="large">
                        <div>
                            <Text type="secondary" style={{ fontSize: 11, textTransform: 'uppercase', display: 'block' }}>Current Active Stage</Text>
                            <Tag color="blue" icon={STAGE_CONFIG[item.currentStage]?.icon} style={{ fontSize: 16, padding: '4px 12px', marginTop: 4 }}>
                                {item.currentStage.toUpperCase()}
                            </Tag>
                        </div>
                        <div>
                            <Text type="secondary" style={{ fontSize: 11, textTransform: 'uppercase', display: 'block' }}>Publish Target</Text>
                            <Text strong style={{ fontSize: 16 }}>{item.plannedPublishDate ? dayjs(item.plannedPublishDate).format('DD MMM YYYY') : 'Not set'}</Text>
                        </div>
                    </Space>

                    <Space size="middle" wrap>
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
                        status={item.stageStatuses[key as any]}
                        data={item[`${key}Data` as keyof typeof item]}
                        isActive={item.currentStage === key}
                        onEdit={() => handleEditStage(key)}
                        customRender={
                            key === 'approval' ? renderApprovalSection() : 
                            key === 'publish' ? renderPublishSection() : null
                        }
                    />
                ))}
            </div>

            {/* Submit for Review Drawer */}
            <Drawer
                title={item.approvalData.status === 'revision_requested' ? 'Resubmit for Review' : 'Submit for Review'}
                placement="right"
                size={480}
                onClose={() => setSubmitDrawerOpen(false)}
                open={submitDrawerOpen}
                extra={
                    <Space>
                        <Button onClick={() => setSubmitDrawerOpen(false)}>Cancel</Button>
                        <Button type="primary" form="submitForm" key="submit" htmlType="submit" loading={actionLoading}>
                            Submit
                        </Button>
                    </Space>
                }
            >
                {item.approvalData.status === 'revision_requested' && (
                    <Alert
                        message="Revision Feedback"
                        description={item.approvalData.revisionHistory[item.approvalData.revisionHistory.length - 1]?.revisionNotes}
                        type="error"
                        showIcon
                        style={{ marginBottom: 24 }}
                    />
                )}
                <Form 
                    id="submitForm"
                    form={submitForm} 
                    layout="vertical" 
                    onFinish={onSubmitForReview}
                    initialValues={{ driveLink: item.approvalData?.driveLink }}
                >
                    <Form.Item 
                        label="Google Drive Link (Final File)" 
                        name="driveLink"
                        rules={[
                            { required: true, message: 'Drive link is required' },
                            { type: 'url', message: 'Please enter a valid URL' }
                        ]}
                    >
                        <Input prefix={<LinkOutlined />} placeholder="https://drive.google.com/..." />
                    </Form.Item>
                    <Form.Item label="Notes for Manager" name="submissionNotes">
                        <TextArea rows={4} placeholder="Any specific details the manager should know?" />
                    </Form.Item>
                </Form>
            </Drawer>

            {/* Modals */}
            <PublishModal
                open={publishModalOpen}
                onClose={() => setPublishModalOpen(false)}
                onConfirm={onFinalPublish}
                item={item}
                loading={actionLoading}
            />

            <ApprovalModal
                open={approveModalOpen}
                onClose={() => setApproveModalOpen(false)}
                onConfirm={onApproveContent}
                item={item}
                loading={actionLoading}
            />

            <RevisionModal
                open={revisionModalOpen}
                onClose={() => setRevisionModalOpen(false)}
                onConfirm={onRevisionRequested}
                item={item}
                loading={actionLoading}
            />

            {/* Standard Stage Data Edit Modal */}
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
                </Form>
            </Modal>
        </div>
    );
}
