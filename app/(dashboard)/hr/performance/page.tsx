'use client';

import { useState, useEffect, useCallback } from 'react';
import {
    Typography, Button, Space, Flex, Select, Table, Tag, App, Spin, Card, Input, Drawer, Rate, Descriptions, Row, Col, Divider,
} from 'antd';
import { PlusOutlined, EyeOutlined, TrophyOutlined, BarChartOutlined } from '@ant-design/icons';
import PageHeader from '@/components/shared/PageHeader';
import { useSession } from 'next-auth/react';
import apiClient from '@/lib/apiClient';
import dayjs from 'dayjs';

const { Title, Text, Paragraph } = Typography;

export default function PerformancePage() {
    const { message } = App.useApp();
    const { data: session } = useSession();
    const [loading, setLoading] = useState(true);
    const [reviews, setReviews] = useState<any[]>([]);
    const [employees, setEmployees] = useState<any[]>([]);
    const [month, setMonth] = useState(dayjs().subtract(1, 'month').format('YYYY-MM'));
    const [filterEmployee, setFilterEmployee] = useState<string | undefined>(undefined);
    const [drawerOpen, setDrawerOpen] = useState(false);
    const [selectedReview, setSelectedReview] = useState<any>(null);
    const [isCreating, setIsCreating] = useState(false);

    // Create form state
    const [formEmployeeId, setFormEmployeeId] = useState<string>('');
    const [ratings, setRatings] = useState({ workQuality: 3, punctuality: 3, teamwork: 3, communication: 3, initiative: 3 });
    const [strengths, setStrengths] = useState('');
    const [improvements, setImprovements] = useState('');
    const [goals, setGoals] = useState('');
    const [managerNotes, setManagerNotes] = useState('');
    const [selfRating, setSelfRating] = useState(0);
    const [selfReview, setSelfReview] = useState('');
    const [submitLoading, setSubmitLoading] = useState(false);

    const isManager = session?.user && ((session.user as any).role === 'Super Admin' || (session.user as any).role === 'Manager');

    const fetchReviews = useCallback(async () => {
        setLoading(true);
        try {
            let url = '/hr/performance?limit=50';
            if (month) url += `&month=${month}`;
            if (filterEmployee) url += `&employeeId=${filterEmployee}`;
            const res = await apiClient.get(url);
            if (res.data.success) setReviews(res.data.data);
        } catch { message.error('Failed to load reviews'); } finally { setLoading(false); }
    }, [month, filterEmployee, message]);

    const fetchEmployees = useCallback(async () => {
        try {
            const res = await apiClient.get('/hr/employees?limit=100&status=active');
            if (res.data.success) setEmployees(res.data.data || []);
        } catch { /* ignore */ }
    }, []);

    useEffect(() => { fetchEmployees(); }, [fetchEmployees]);
    useEffect(() => { fetchReviews(); }, [fetchReviews]);

    const overallRating = Math.round(((ratings.workQuality + ratings.punctuality + ratings.teamwork + ratings.communication + ratings.initiative) / 5) * 10) / 10;

    const handleCreate = async () => {
        if (!formEmployeeId) { message.warning('Select an employee'); return; }
        if (!strengths.trim() || !improvements.trim() || !goals.trim()) { message.warning('Fill all required fields'); return; }
        setSubmitLoading(true);
        try {
            const res = await apiClient.post('/hr/performance', {
                employeeId: formEmployeeId,
                month,
                ratings,
                strengths,
                improvements,
                goalsForNextMonth: goals,
                managerNotes,
            });
            if (res.data.success) {
                message.success('Performance review created');
                setDrawerOpen(false);
                resetForm();
                fetchReviews();
            }
        } catch (error: any) {
            message.error(error.response?.data?.error || 'Failed to create review');
        } finally { setSubmitLoading(false); }
    };

    const handlePublish = async (reviewId: string) => {
        try {
            const res = await apiClient.put(`/hr/performance/${reviewId}`, { action: 'publish' });
            if (res.data.success) { message.success('Review published'); fetchReviews(); setDrawerOpen(false); }
        } catch (error: any) { message.error(error.response?.data?.error || 'Failed to publish'); }
    };

    const handleSaveSelfReview = async (reviewId: string) => {
        try {
            const res = await apiClient.put(`/hr/performance/${reviewId}`, { selfRating, selfReview });
            if (res.data.success) { message.success('Self review saved'); fetchReviews(); }
        } catch (error: any) { message.error(error.response?.data?.error || 'Failed to save'); }
    };

    const resetForm = () => {
        setFormEmployeeId('');
        setRatings({ workQuality: 3, punctuality: 3, teamwork: 3, communication: 3, initiative: 3 });
        setStrengths(''); setImprovements(''); setGoals(''); setManagerNotes('');
    };

    const openReview = async (review: any) => {
        setIsCreating(false);
        try {
            const res = await apiClient.get(`/hr/performance/${review._id}`);
            if (res.data.success) {
                setSelectedReview(res.data.data);
                setSelfRating(res.data.data.selfRating || 0);
                setSelfReview(res.data.data.selfReview || '');
                setDrawerOpen(true);
            }
        } catch { message.error('Failed to load review'); }
    };

    const columns = [
        {
            title: 'Employee', key: 'employee',
            render: (_: any, rec: any) => {
                const emp = rec.employeeId;
                return <Text strong>{typeof emp === 'object' ? emp?.fullName : '—'}</Text>;
            },
        },
        { title: 'Month', dataIndex: 'monthName', key: 'monthName' },
        {
            title: 'Task Rate', key: 'taskRate',
            render: (_: any, rec: any) => <Text>{rec.analyticsSnapshot?.taskCompletionRate || 0}%</Text>,
        },
        {
            title: 'On-Time', key: 'onTime',
            render: (_: any, rec: any) => <Text>{rec.analyticsSnapshot?.onTimeDeliveryRate || 0}%</Text>,
        },
        {
            title: 'Overall Rating', key: 'overallRating',
            render: (_: any, rec: any) => <Rate disabled value={rec.ratings?.overallRating || 0} allowHalf style={{ fontSize: 14 }} />,
        },
        { title: 'Status', dataIndex: 'status', key: 'status', render: (s: string) => <Tag color={s === 'published' ? 'green' : 'default'}>{s}</Tag> },
        {
            title: 'Actions', key: 'actions', width: 120,
            render: (_: any, rec: any) => (
                <Space>
                    <Button size="small" icon={<EyeOutlined />} onClick={() => openReview(rec)}>View</Button>
                    {isManager && rec.status === 'draft' && (
                        <Button size="small" type="primary" onClick={() => handlePublish(rec._id)}>Publish</Button>
                    )}
                </Space>
            ),
        },
    ];

    return (
        <div>
            <Flex justify="space-between" align="center" wrap="wrap" gap={16} style={{ marginBottom: 24 }}>
                <PageHeader title="Performance Reviews" subtitle={dayjs(month).format('MMMM YYYY')} />
                <Space>
                    <Input type="month" value={month} onChange={(e) => setMonth(e.target.value)} style={{ width: 180 }} />
                    {isManager && (
                        <Select
                            showSearch allowClear placeholder="Filter Employee" style={{ width: 200 }}
                            value={filterEmployee} onChange={setFilterEmployee}
                            filterOption={(input, option) => (option?.label as string)?.toLowerCase().includes(input.toLowerCase())}
                            options={employees.map(e => ({ label: e.fullName, value: e._id }))}
                        />
                    )}
                    {isManager && (
                        <Button type="primary" icon={<PlusOutlined />} size="large" onClick={() => { resetForm(); setIsCreating(true); setSelectedReview(null); setDrawerOpen(true); }}>
                            Create Review
                        </Button>
                    )}
                </Space>
            </Flex>

            <Table dataSource={reviews} columns={columns} rowKey="_id" loading={loading} pagination={{ pageSize: 10 }} />

            {/* Review Drawer */}
            <Drawer
                title={isCreating ? 'Create Performance Review' : 'Performance Review'}
                open={drawerOpen}
                onClose={() => setDrawerOpen(false)}
                width={640}
                footer={
                    isCreating ? (
                        <Flex gap={8} justify="end">
                            <Button onClick={() => setDrawerOpen(false)}>Cancel</Button>
                            <Button type="primary" loading={submitLoading} onClick={handleCreate}>Save Draft</Button>
                        </Flex>
                    ) : null
                }
            >
                {isCreating ? (
                    <div>
                        <div style={{ marginBottom: 16 }}>
                            <Text strong style={{ display: 'block', marginBottom: 4 }}>Employee *</Text>
                            <Select
                                showSearch style={{ width: '100%' }}
                                value={formEmployeeId || undefined}
                                onChange={setFormEmployeeId}
                                filterOption={(input, option) => (option?.label as string)?.toLowerCase().includes(input.toLowerCase())}
                                options={employees.map(e => ({ label: `${e.fullName} (${e.employeeNumber})`, value: e._id }))}
                                placeholder="Select employee"
                            />
                        </div>

                        <Divider>Ratings (1-5 Stars)</Divider>
                        {(['workQuality', 'punctuality', 'teamwork', 'communication', 'initiative'] as const).map(key => (
                            <Flex key={key} justify="space-between" align="center" style={{ marginBottom: 12 }}>
                                <Text style={{ textTransform: 'capitalize' }}>{key.replace(/([A-Z])/g, ' $1')}</Text>
                                <Rate value={ratings[key]} onChange={(v) => setRatings({ ...ratings, [key]: v })} />
                            </Flex>
                        ))}
                        <Card size="small" style={{ borderRadius: 8, backgroundColor: '#f6ffed', textAlign: 'center', marginBottom: 16 }}>
                            <Text type="secondary">Overall Rating</Text>
                            <div><Rate disabled value={overallRating} allowHalf style={{ fontSize: 20 }} /></div>
                            <Text strong style={{ fontSize: 18 }}>{overallRating}</Text>
                        </Card>

                        <div style={{ marginBottom: 16 }}>
                            <Text strong style={{ display: 'block', marginBottom: 4 }}>Strengths *</Text>
                            <Input.TextArea value={strengths} onChange={(e) => setStrengths(e.target.value)} rows={2} />
                        </div>
                        <div style={{ marginBottom: 16 }}>
                            <Text strong style={{ display: 'block', marginBottom: 4 }}>Areas for Improvement *</Text>
                            <Input.TextArea value={improvements} onChange={(e) => setImprovements(e.target.value)} rows={2} />
                        </div>
                        <div style={{ marginBottom: 16 }}>
                            <Text strong style={{ display: 'block', marginBottom: 4 }}>Goals for Next Month *</Text>
                            <Input.TextArea value={goals} onChange={(e) => setGoals(e.target.value)} rows={2} />
                        </div>
                        <div style={{ marginBottom: 16 }}>
                            <Text strong style={{ display: 'block', marginBottom: 4 }}>Manager Notes</Text>
                            <Input.TextArea value={managerNotes} onChange={(e) => setManagerNotes(e.target.value)} rows={2} />
                        </div>
                    </div>
                ) : selectedReview ? (
                    <div>
                        {/* Analytics Snapshot */}
                        <Card size="small" style={{ borderRadius: 10, marginBottom: 16, backgroundColor: '#f0f5ff' }}>
                            <Flex align="center" gap={8} style={{ marginBottom: 8 }}>
                                <BarChartOutlined style={{ color: '#1890ff' }} />
                                <Text strong>Analytics Snapshot</Text>
                            </Flex>
                            <Row gutter={[8, 8]}>
                                <Col span={8}><Text type="secondary" style={{ fontSize: 11 }}>Tasks Assigned</Text><br /><Text strong>{selectedReview.analyticsSnapshot?.tasksAssigned || 0}</Text></Col>
                                <Col span={8}><Text type="secondary" style={{ fontSize: 11 }}>Tasks Completed</Text><br /><Text strong>{selectedReview.analyticsSnapshot?.tasksCompleted || 0}</Text></Col>
                                <Col span={8}><Text type="secondary" style={{ fontSize: 11 }}>Completion Rate</Text><br /><Text strong>{selectedReview.analyticsSnapshot?.taskCompletionRate || 0}%</Text></Col>
                                <Col span={8}><Text type="secondary" style={{ fontSize: 11 }}>On-Time Rate</Text><br /><Text strong>{selectedReview.analyticsSnapshot?.onTimeDeliveryRate || 0}%</Text></Col>
                                <Col span={8}><Text type="secondary" style={{ fontSize: 11 }}>Content Delivered</Text><br /><Text strong>{selectedReview.analyticsSnapshot?.contentItemsDelivered || 0}</Text></Col>
                                <Col span={8}><Text type="secondary" style={{ fontSize: 11 }}>First Pass Rate</Text><br /><Text strong>{selectedReview.analyticsSnapshot?.approvalFirstPassRate || 0}%</Text></Col>
                            </Row>
                        </Card>

                        {/* Manager Ratings */}
                        <Title level={5}><TrophyOutlined style={{ color: '#faad14' }} /> Ratings</Title>
                        {(['workQuality', 'punctuality', 'teamwork', 'communication', 'initiative'] as const).map(key => (
                            <Flex key={key} justify="space-between" align="center" style={{ marginBottom: 8 }}>
                                <Text style={{ textTransform: 'capitalize' }}>{key.replace(/([A-Z])/g, ' $1')}</Text>
                                <Rate disabled value={selectedReview.ratings?.[key] || 0} />
                            </Flex>
                        ))}
                        <Card size="small" style={{ borderRadius: 8, backgroundColor: '#fffbe6', textAlign: 'center', marginBottom: 16 }}>
                            <Text type="secondary">Overall</Text>
                            <div><Rate disabled value={selectedReview.ratings?.overallRating || 0} allowHalf style={{ fontSize: 20 }} /></div>
                        </Card>

                        {/* Written Review */}
                        {selectedReview.strengths && <Paragraph><Text strong>Strengths:</Text> {selectedReview.strengths}</Paragraph>}
                        {selectedReview.improvements && <Paragraph><Text strong>Improvements:</Text> {selectedReview.improvements}</Paragraph>}
                        {selectedReview.goalsForNextMonth && <Paragraph><Text strong>Goals:</Text> {selectedReview.goalsForNextMonth}</Paragraph>}

                        {/* Self Review */}
                        {selectedReview.status === 'published' && (
                            <>
                                <Divider>Self Review</Divider>
                                <Flex align="center" gap={8} style={{ marginBottom: 8 }}>
                                    <Text strong>Self Rating:</Text>
                                    <Rate value={selfRating} onChange={setSelfRating} />
                                </Flex>
                                <Input.TextArea
                                    value={selfReview}
                                    onChange={(e) => setSelfReview(e.target.value)}
                                    rows={3}
                                    placeholder="Write your self review..."
                                    style={{ marginBottom: 12 }}
                                />
                                <Button type="primary" onClick={() => handleSaveSelfReview(selectedReview._id)}>Save Self Review</Button>
                            </>
                        )}

                        {/* Publish button */}
                        {isManager && selectedReview.status === 'draft' && (
                            <div style={{ marginTop: 16 }}>
                                <Button type="primary" block onClick={() => handlePublish(selectedReview._id)}>Publish Review</Button>
                            </div>
                        )}
                    </div>
                ) : null}
            </Drawer>
        </div>
    );
}
