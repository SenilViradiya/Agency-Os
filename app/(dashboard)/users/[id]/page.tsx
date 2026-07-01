'use client';

import { useState, useEffect, useCallback } from 'react';
import {
    Typography, Button, Space, Flex, Spin, Card, Row, Col, Badge, Avatar, Descriptions, App, Result, Tag
} from 'antd';
import {
    ArrowLeftOutlined, EditOutlined, LockOutlined, PhoneOutlined, MailOutlined, UserOutlined
} from '@ant-design/icons';
import { useSession } from 'next-auth/react';
import apiClient from '@/lib/apiClient';
import { useRouter, useParams } from 'next/navigation';
import UserDrawer from '@/components/users/UserDrawer';
import ResetPasswordModal from '@/components/shared/ResetPasswordModal';

const { Title, Text } = Typography;

export default function UserDetailPage() {
    const router = useRouter();
    const params = useParams();
    const { message } = App.useApp();
    const { data: session } = useSession();
    const userId = params.id as string;

    const [loading, setLoading] = useState(true);
    const [user, setUser] = useState<any>(null);
    const [roles, setRoles] = useState<any[]>([]);
    const [drawerOpen, setDrawerOpen] = useState(false);
    const [resetModalOpen, setResetModalOpen] = useState(false);
    const [actionLoading, setActionLoading] = useState(false);

    const currentUserRole = (session?.user as any)?.role;
    const currentUserId = (session?.user as any)?.id;

    // RBAC: Super Admin and Manager only can reset passwords
    const canReset = currentUserRole === 'Super Admin' || currentUserRole === 'Manager';
    const isSelf = currentUserId === userId;
    const targetIsSuperAdmin = user?.role?.name === 'Super Admin';
    const isManagerTargetSuperAdmin = currentUserRole === 'Manager' && targetIsSuperAdmin;

    // Determine if reset button should be disabled
    const isResetDisabled = isSelf || isManagerTargetSuperAdmin;

    const fetchUser = useCallback(async () => {
        setLoading(true);
        try {
            const res = await apiClient.get(`/users/${userId}`);
            if (res.data.success) {
                setUser(res.data.data);
            }
        } catch (error) {
            message.error('Failed to load user details');
        } finally {
            setLoading(false);
        }
    }, [userId, message]);

    const fetchRoles = useCallback(async () => {
        try {
            const res = await apiClient.get('/roles');
            setRoles(res.data.data);
        } catch (error) {
            console.error('Failed to fetch roles:', error);
        }
    }, []);

    useEffect(() => {
        fetchUser();
        fetchRoles();
    }, [fetchUser, fetchRoles]);

    const handleFormSubmit = async (data: any) => {
        setActionLoading(true);
        try {
            const res = await apiClient.put(`/users/${userId}`, data);
            if (res.data.success) {
                message.success('User updated successfully');
                setDrawerOpen(false);
                fetchUser();
            }
        } catch (error: any) {
            message.error(error.response?.data?.error || 'Failed to update user');
        } finally {
            setActionLoading(false);
        }
    };

    if (loading) return <div style={{ textAlign: 'center', padding: '100px 0' }}><Spin size="large" /></div>;
    if (!user) return <Result status="404" title="User not found" />;

    const statusColors: Record<string, string> = { active: 'green', inactive: 'orange', suspended: 'red' };

    return (
        <div>
            <Flex align="center" gap={12} style={{ marginBottom: 24 }}>
                <Button icon={<ArrowLeftOutlined />} onClick={() => router.push('/users')} />
                <Title level={3} style={{ margin: 0 }}>User Profile</Title>
            </Flex>

            {/* Header Card */}
            <Card style={{ borderRadius: 12, marginBottom: 24, boxShadow: '0 4px 12px rgba(0,0,0,0.03)' }}>
                <Flex align="center" justify="space-between" wrap="wrap" gap={16}>
                    <Flex align="center" gap={16}>
                        <Avatar src={user.avatar} size={72} style={{ backgroundColor: '#6C63FF', fontSize: 28 }}>
                            {user.name?.charAt(0)}
                        </Avatar>
                        <div>
                            <Flex align="center" gap={8}>
                                <Title level={3} style={{ margin: 0 }}>{user.name}</Title>
                                <Badge status={statusColors[user.status] as any} text={user.status?.toUpperCase()} />
                            </Flex>
                            <Text type="secondary" style={{ fontSize: 13 }}>{user.email}</Text>
                            <Flex gap={6} style={{ marginTop: 4 }}>
                                <Text>{user.designation}</Text>
                                <Tag>{user.department}</Tag>
                                <Tag color="blue">{user.role?.name || 'User'}</Tag>
                            </Flex>
                        </div>
                    </Flex>
                    <Space>
                        {canReset && (
                            <Button 
                                icon={<LockOutlined />} 
                                danger
                                disabled={isResetDisabled}
                                onClick={() => setResetModalOpen(true)}
                            >
                                Reset Password
                            </Button>
                        )}
                        {(currentUserRole === 'Super Admin' || currentUserRole === 'Manager') && (
                            <Button icon={<EditOutlined />} type="primary" onClick={() => setDrawerOpen(true)}>
                                Edit Profile
                            </Button>
                        )}
                    </Space>
                </Flex>
            </Card>

            {/* Details Card */}
            <Card style={{ borderRadius: 12 }}>
                <Row gutter={[24, 24]}>
                    <Col xs={24} md={12}>
                        <Descriptions title="Account Information" bordered column={1} size="small">
                            <Descriptions.Item label="Full Name">{user.name}</Descriptions.Item>
                            <Descriptions.Item label="Email">{user.email}</Descriptions.Item>
                            <Descriptions.Item label="Phone">{user.phone || '—'}</Descriptions.Item>
                            <Descriptions.Item label="Role">{user.role?.name || '—'}</Descriptions.Item>
                            <Descriptions.Item label="Status">{user.status?.toUpperCase()}</Descriptions.Item>
                        </Descriptions>
                    </Col>
                    <Col xs={24} md={12}>
                        <Descriptions title="Organizational Details" bordered column={1} size="small">
                            <Descriptions.Item label="Department">{user.department}</Descriptions.Item>
                            <Descriptions.Item label="Designation">{user.designation}</Descriptions.Item>
                            <Descriptions.Item label="Last Login">{user.lastLogin ? new Date(user.lastLogin).toLocaleString() : 'Never'}</Descriptions.Item>
                        </Descriptions>
                    </Col>
                </Row>
            </Card>

            <UserDrawer
                open={drawerOpen}
                onClose={() => setDrawerOpen(false)}
                onSubmit={handleFormSubmit}
                initialData={user}
                roles={roles}
                loading={actionLoading}
            />

            <ResetPasswordModal
                open={resetModalOpen}
                onClose={() => setResetModalOpen(false)}
                userId={userId}
                userName={user.name}
                apiEndpoint="/api/users/[id]/reset-password"
                context="team"
            />
        </div>
    );
}
