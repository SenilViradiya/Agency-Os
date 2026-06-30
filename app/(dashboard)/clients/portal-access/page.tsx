'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { Table, Button, Card, Typography, Tag, Space, Modal, Form, Input, Select, Switch, App, Flex, Spin } from 'antd';
import { PlusOutlined, EditOutlined, UserDeleteOutlined, KeyOutlined } from '@ant-design/icons';
import { useRouter } from 'next/navigation';
import apiClient from '@/lib/apiClient';
import PageHeader from '@/components/shared/PageHeader';
import dayjs from 'dayjs';

const { Title, Text } = Typography;
const { Option } = Select;

export default function PortalAccessPage() {
    const { message: msg } = App.useApp();
    const router = useRouter();

    const [loading, setLoading] = useState(true);
    const [users, setUsers] = useState<any[]>([]);
    const [clients, setClients] = useState<any[]>([]);

    // Modal state
    const [modalOpen, setModalOpen] = useState(false);
    const [modalLoading, setModalLoading] = useState(false);
    const [editingUser, setEditingUser] = useState<any>(null);
    const [form] = Form.useForm();

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const [usersRes, clientsRes] = await Promise.all([
                apiClient.get('/api/admin/client-portal-users?limit=100'),
                apiClient.get('/clients?limit=200')
            ]);
            
            if (usersRes.data?.success) setUsers(usersRes.data.data);
            if (clientsRes.data?.success) setClients(clientsRes.data.data);
        } catch (err) {
            console.error('Failed to load portal credentials list', err);
            msg.error('Failed to load portal accounts list.');
        } finally {
            setLoading(false);
        }
    }, [msg]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleOpenModal = (user: any = null) => {
        setEditingUser(user);
        form.resetFields();
        if (user) {
            form.setFieldsValue({
                clientId: user.clientId?._id || user.clientId,
                name: user.name,
                email: user.email,
                designation: user.designation,
                phone: user.phone,
                status: user.status === 'active',
            });
        }
        setModalOpen(true);
    };

    const handleFormSubmit = async (values: any) => {
        setModalLoading(true);
        try {
            const payload = {
                ...values,
                status: values.status === false ? 'inactive' : 'active',
            };

            if (editingUser) {
                // Update
                if (values.password) {
                    payload.newPassword = values.password;
                }
                const res = await apiClient.put(`/api/admin/client-portal-users/${editingUser._id}`, payload);
                if (res.data?.success) {
                    msg.success('Portal access credentials updated successfully.');
                    setModalOpen(false);
                    fetchData();
                }
            } else {
                // Create
                const res = await apiClient.post('/api/admin/client-portal-users', payload);
                if (res.data?.success) {
                    msg.success('New client portal user added.');
                    setModalOpen(false);
                    fetchData();
                }
            }
        } catch (err: any) {
            console.error(err);
            msg.error(err.response?.data?.error || 'Failed to save credentials.');
        } finally {
            setModalLoading(false);
        }
    };

    const handleDeactivate = async (id: string) => {
        if (!window.confirm('Are you sure you want to deactivate (block) this portal stakeholder/client? They will be immediately blocked from logging in or using the APIs.')) return;
        try {
            const res = await apiClient.delete(`/api/admin/client-portal-users/${id}`);
            if (res.data?.success) {
                msg.success('Portal user deactivated successfully.');
                fetchData();
            }
        } catch (err: any) {
            msg.error(err.response?.data?.error || 'Failed to deactivate portal user.');
        }
    };

    const columns = [
        {
            title: 'Contact Name',
            dataIndex: 'name',
            key: 'name',
            render: (text: string) => <strong>{text}</strong>
        },
        {
            title: 'Linked Association',
            dataIndex: ['clientId', 'businessName'],
            key: 'businessName',
            render: (name: string, record: any) => (
                <Space direction="vertical" size={2}>
                    <Text strong>{name || record.clientId?.businessName || 'N/A'}</Text>
                    <Text type="secondary" style={{ fontSize: 11 }}>#{record.clientId?.clientNumber || '—'}</Text>
                </Space>
            )
        },
        {
            title: 'Designation',
            dataIndex: 'designation',
            key: 'designation',
        },
        {
            title: 'Email Address',
            dataIndex: 'email',
            key: 'email',
        },
        {
            title: 'Phone Line',
            dataIndex: 'phone',
            key: 'phone',
            render: (text: string) => text || <Text type="secondary">—</Text>
        },
        {
            title: 'Session Metrics',
            key: 'metrics',
            render: (_: any, record: any) => (
                <Space direction="vertical" size={2}>
                    <Text type="secondary" style={{ fontSize: 11 }}>Count: {record.loginCount || 0}</Text>
                    <Text type="secondary" style={{ fontSize: 11 }}>
                        Last: {record.lastLogin ? dayjs(record.lastLogin).format('DD MMM, YYYY') : 'Never'}
                    </Text>
                </Space>
            )
        },
        {
            title: 'Access Control',
            dataIndex: 'status',
            key: 'status',
            render: (status: string) => (
                <Tag color={status === 'active' ? 'success' : 'error'}>
                    {status.toUpperCase()}
                </Tag>
            )
        },
        {
            title: 'Action',
            key: 'action',
            render: (_: any, record: any) => (
                <Space>
                    <Button 
                        type="text" 
                        icon={<EditOutlined />} 
                        onClick={() => handleOpenModal(record)} 
                    />
                    {record.status === 'active' && (
                        <Button 
                            type="text" 
                            danger 
                            icon={<UserDeleteOutlined />} 
                            onClick={() => handleDeactivate(record._id)} 
                        />
                    )}
                </Space>
            )
        }
    ];

    return (
        <div>
            <Flex justify="space-between" align="center" style={{ marginBottom: 32 }}>
                <PageHeader
                    title="Client Portal Logins"
                    subtitle="Provision and manage secure access credentials for partners to track their projects."
                />
                
                <Space>
                    <Button 
                        onClick={() => router.push('/clients')}
                        style={{ height: 45, borderRadius: 8 }}
                    >
                        Back to Client List
                    </Button>
                    <Button
                        type="primary"
                        icon={<PlusOutlined />}
                        onClick={() => handleOpenModal()}
                        style={{ height: 45, fontWeight: 600, borderRadius: 8 }}
                    >
                        Add Portal User
                    </Button>
                </Space>
            </Flex>

            {loading ? (
                <div style={{ textAlign: 'center', padding: '100px 0' }}>
                    <Spin size="large" tip="Loading credentials..." />
                </div>
            ) : (
                <Card style={{ borderRadius: 12, boxShadow: '0 4px 12px rgba(0,0,0,0.03)' }}>
                    <Table 
                        dataSource={users} 
                        columns={columns} 
                        rowKey="_id"
                        pagination={{ pageSize: 12 }}
                    />
                </Card>
            )}

            {/* Creation / Editing Modal */}
            <Modal
                title={editingUser ? 'Modify Portal Access Credentials' : 'Provision Secure Client Login'}
                open={modalOpen}
                onCancel={() => setModalOpen(false)}
                okText={editingUser ? 'Update Credentials' : 'Create Access'}
                confirmLoading={modalLoading}
                onOk={() => form.submit()}
                destroyOnClose
            >
                <div style={{ padding: '12px 0' }}>
                    <Form
                        form={form}
                        layout="vertical"
                        onFinish={handleFormSubmit}
                        requiredMark={false}
                    >
                        {!editingUser && (
                            <Form.Item
                                name="clientId"
                                label="Target Corporate client"
                                rules={[{ required: true, message: 'Please select which client this user is related to' }]}
                            >
                                <Select placeholder="Select client relation" size="large">
                                    {clients.map(c => (
                                        <Option key={c._id} value={c._id}>{c.businessName} ({c.contactPerson})</Option>
                                    ))}
                                </Select>
                            </Form.Item>
                        )}

                        <Form.Item
                            name="name"
                            label="Stakeholder Name"
                            rules={[{ required: true, message: 'Stakeholder name is required' }]}
                        >
                            <Input placeholder="e.g. John Miller" size="large" />
                        </Form.Item>

                        <Form.Item
                            name="email"
                            label="Login Email Address"
                            rules={[
                                { required: true, message: 'User email is required' },
                                { type: 'email', message: 'Email address must be valid' }
                            ]}
                        >
                            <Input placeholder="e.g. john@business.com" size="large" disabled={!!editingUser} />
                        </Form.Item>

                        <Form.Item
                            name="designation"
                            label="Stakeholder Designation"
                        >
                            <Input placeholder="e.g. Marketing Lead" size="large" />
                        </Form.Item>

                        <Form.Item
                            name="phone"
                            label="Stakeholder Phone"
                        >
                            <Input placeholder="e.g. +91 9876543210" size="large" />
                        </Form.Item>

                        <Form.Item
                            name="password"
                            label={editingUser ? "Reset Password (Leave blank to keep unchanged)" : "Credential Password"}
                            rules={[{ required: !editingUser, message: 'Password is required' }]}
                        >
                            <Input.Password placeholder="Secure password" size="large" prefix={<KeyOutlined />} />
                        </Form.Item>

                        {editingUser && (
                            <Form.Item
                                name="status"
                                label="Access Active"
                                valuePropName="checked"
                            >
                                <Switch checkedChildren="Active" unCheckedChildren="Inactive" />
                            </Form.Item>
                        )}
                    </Form>
                </div>
            </Modal>
        </div>
    );
}
export const dynamic = 'force-dynamic';
