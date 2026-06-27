'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { 
    Tabs, 
    Row, 
    Col, 
    Card, 
    Statistic, 
    Flex, 
    Space, 
    Select, 
    Empty, 
    Spin, 
    App as AntdApp,
    Typography,
    Divider
} from 'antd';
import { 
    ClockCircleOutlined, 
    CheckCircleOutlined, 
    ExclamationCircleOutlined, 
    FileSearchOutlined,
    UserOutlined
} from '@ant-design/icons';
import PageHeader from '@/components/shared/PageHeader';
import ApprovalCard from '@/components/approvals/ApprovalCard';
import ApprovalDetailDrawer from '@/components/approvals/ApprovalDetailDrawer';
import ApprovalModal from '@/components/approvals/ApprovalModal';
import RevisionModal from '@/components/approvals/RevisionModal';
import apiClient from '@/lib/apiClient';
import { useSession } from 'next-auth/react';

const { Text } = Typography;
const { Option } = Select;

export default function ApprovalsPage() {
    const { data: session } = useSession();
    const { message } = AntdApp.useApp();
    
    const [activeTab, setActiveTab] = useState('pending_review');
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);
    const [items, setItems] = useState<any[]>([]);
    const [stats, setStats] = useState({ pending: 0, approvedToday: 0, revisionsSent: 0, avgReviewTime: 'N/A' });
    
    // Filters
    const [clients, setClients] = useState<any[]>([]);
    const [projects, setProjects] = useState<any[]>([]);
    const [users, setUsers] = useState<any[]>([]);
    const [selectedClient, setSelectedClient] = useState<string | null>(null);
    const [selectedProject, setSelectedProject] = useState<string | null>(null);
    const [selectedUser, setSelectedUser] = useState<string | null>(null);

    // Modal/Drawer States
    const [selectedItem, setSelectedItem] = useState<any>(null);
    const [drawerOpen, setDrawerOpen] = useState(false);
    const [approveModalOpen, setApproveModalOpen] = useState(false);
    const [revisionModalOpen, setRevisionModalOpen] = useState(false);

    const currentRole = (session?.user as any)?.role;
    const isManager = currentRole === 'Manager' || currentRole === 'Super Admin' || currentRole === 'Admin';

    const fetchItems = useCallback(async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            if (activeTab !== 'all') params.append('status', activeTab);
            if (selectedClient) params.append('clientId', selectedClient);
            if (selectedProject) params.append('projectId', selectedProject);
            if (selectedUser) params.append('submittedBy', selectedUser);
            
            // For editors, we only show their submissions
            if (!isManager) {
                params.append('submittedBy', (session?.user as any).id);
            }

            const res = await apiClient.get(`/approvals?${params.toString()}`);
            if (res.data.success) {
                setItems(res.data.data);
                
                // If it's the pending tab, update the pending count in stats
                if (activeTab === 'pending_review') {
                    setStats(prev => ({ ...prev, pending: res.data.pagination.total }));
                }
            }
        } catch (error) {
            console.error('Failed to fetch approvals:', error);
            message.error('Failed to load approval queue');
        } finally {
            setLoading(false);
        }
    }, [activeTab, selectedClient, selectedProject, selectedUser, isManager, session?.user, message]);

    const fetchFilters = async () => {
        try {
            const [cRes, uRes] = await Promise.all([
                apiClient.get('/clients'),
                apiClient.get('/users'),
            ]);
            setClients(cRes.data.data);
            setUsers(uRes.data.data);
        } catch (error) {
            console.error('Failed to fetch filters:', error);
        }
    };

    useEffect(() => {
        if (session) {
            fetchItems();
        }
    }, [fetchItems, session]);

    useEffect(() => {
        fetchFilters();
    }, []);

    const handleApprove = async (values: any) => {
        setActionLoading(true);
        try {
            const res = await apiClient.post(`/approvals/${selectedItem._id}/approve`, values);
            if (res.data.success) {
                message.success('Content approved successfully');
                setApproveModalOpen(false);
                fetchItems();
            }
        } catch (error: any) {
            message.error(error.response?.data?.error || 'Failed to approve content');
        } finally {
            setActionLoading(false);
        }
    };

    const handleRevision = async (values: any) => {
        setActionLoading(true);
        try {
            const res = await apiClient.post(`/approvals/${selectedItem._id}/revision`, values);
            if (res.data.success) {
                message.warning('Revision requested. Editor has been notified.');
                setRevisionModalOpen(false);
                fetchItems();
            }
        } catch (error: any) {
            message.error(error.response?.data?.error || 'Failed to send revision request');
        } finally {
            setActionLoading(false);
        }
    };

    const tabItems = [
        { key: 'pending_review', label: `Pending Review ${stats.pending > 0 ? `(${stats.pending})` : ''}` },
        { key: 'approved', label: 'Approved' },
        { key: 'revision_requested', label: 'Revision Requested' },
        { key: 'all', label: 'All' },
    ];

    return (
        <div>
            <Flex justify="space-between" align="flex-start" style={{ marginBottom: 32 }}>
                <PageHeader
                    title="Approvals"
                    subtitle={isManager ? "Centralized review queue for pending content submissions." : "Track the status of your submitted content and reviews."}
                />
            </Flex>

            {isManager && (
                <Row gutter={[24, 24]} style={{ marginBottom: 32 }}>
                    <Col xs={24} sm={12} lg={6}>
                        <Card styles={{ body: { padding: 20 } }} style={{ borderRadius: 12 }}>
                            <Statistic title="Pending Review" value={stats.pending} prefix={<ClockCircleOutlined />} styles={{ content: { color: '#faad14' } }} />
                        </Card>
                    </Col>
                    <Col xs={24} sm={12} lg={6}>
                        <Card styles={{ body: { padding: 20 } }} style={{ borderRadius: 12 }}>
                            <Statistic title="Approved Today" value={stats.approvedToday} prefix={<CheckCircleOutlined />} styles={{ content: { color: '#52c41a' } }} />
                        </Card>
                    </Col>
                    <Col xs={24} sm={12} lg={6}>
                        <Card styles={{ body: { padding: 20 } }} style={{ borderRadius: 12 }}>
                            <Statistic title="Revisions Sent" value={stats.revisionsSent} prefix={<ExclamationCircleOutlined />} styles={{ content: { color: '#ff4d4f' } }} />
                        </Card>
                    </Col>
                    <Col xs={24} sm={12} lg={6}>
                        <Card styles={{ body: { padding: 20 } }} style={{ borderRadius: 12 }}>
                            <Statistic title="Avg Review Time" value={stats.avgReviewTime} prefix={<FileSearchOutlined />} />
                        </Card>
                    </Col>
                </Row>
            )}

            <Card style={{ borderRadius: 12, marginBottom: 24 }}>
                <Flex justify="space-between" align="center" wrap="wrap" gap={16}>
                    <Tabs 
                        activeKey={activeTab} 
                        onChange={setActiveTab} 
                        items={tabItems}
                        style={{ marginBottom: 0 }}
                    />
                    
                    <Space wrap>
                        <Select 
                            placeholder="Client" 
                            style={{ width: 160 }} 
                            allowClear 
                            onChange={setSelectedClient}
                        >
                            {clients.map(c => <Option key={c._id} value={c._id}>{c.businessName}</Option>)}
                        </Select>
                        <Select 
                            placeholder="Submitted By" 
                            style={{ width: 160 }} 
                            allowClear 
                            onChange={setSelectedUser}
                            disabled={!isManager}
                        >
                            {users.map(u => <Option key={u._id} value={u._id}>{u.name}</Option>)}
                        </Select>
                    </Space>
                </Flex>
            </Card>

            {loading ? (
                <div style={{ textAlign: 'center', padding: '100px 0' }}><Spin size="large" /></div>
            ) : items.length > 0 ? (
                <div style={{ maxWidth: 1000 }}>
                    {items.map(item => (
                        <ApprovalCard 
                            key={item._id} 
                            item={item} 
                            isEditor={!isManager}
                            onApprove={(item) => { setSelectedItem(item); setApproveModalOpen(true); }}
                            onRevision={(item) => { setSelectedItem(item); setRevisionModalOpen(true); }}
                            onViewDetail={(item) => { setSelectedItem(item); setDrawerOpen(true); }}
                        />
                    ))}
                </div>
            ) : (
                <Card style={{ borderRadius: 12, padding: '60px 0', textAlign: 'center' }}>
                    <Empty 
                        description={
                            <Space direction="vertical" size={4}>
                                <Text strong>No content found in this queue</Text>
                                <Text type="secondary">All clear! No pending items match your filters.</Text>
                            </Space>
                        } 
                    />
                </Card>
            )}

            <ApprovalDetailDrawer 
                open={drawerOpen} 
                onClose={() => setDrawerOpen(false)} 
                item={selectedItem} 
            />

            <ApprovalModal
                open={approveModalOpen}
                onClose={() => setApproveModalOpen(false)}
                onConfirm={handleApprove}
                item={selectedItem}
                loading={actionLoading}
            />

            <RevisionModal
                open={revisionModalOpen}
                onClose={() => setRevisionModalOpen(false)}
                onConfirm={handleRevision}
                item={selectedItem}
                loading={actionLoading}
            />
        </div>
    );
}
