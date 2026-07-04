'use client';

import React, { useState, useEffect } from 'react';
import { Card, Avatar, Descriptions, Row, Col, Typography, Tag, Space, Divider, Spin, Form, Input, Button, Alert, App as AntdApp } from 'antd';
import { UserOutlined, ContactsOutlined, SolutionOutlined, InfoCircleOutlined, LockOutlined, SaveOutlined } from '@ant-design/icons';
import { usePortal } from '@/components/portal/PortalContext';
import dayjs from 'dayjs';
import axios from 'axios';

const { Title, Text } = Typography;

export default function PortalProfilePage() {
    const { client, user, loading, refresh } = usePortal();
    const { message: msg } = AntdApp.useApp();
    const [submitting, setSubmitting] = useState(false);
    const [form] = Form.useForm();

    useEffect(() => {
        if (user) {
            form.setFieldsValue({
                name: user.name,
                email: user.email,
                phone: user.phone || '',
            });
        }
    }, [user, form]);

    if (loading) {
        return (
            <div style={{ textAlign: 'center', padding: '100px 0' }}>
                <Spin size="large" tip="Loading profiles..." />
            </div>
        );
    }

    const addressStr = client?.address ? [
        client.address.street,
        client.address.city,
        client.address.state,
        client.address.pincode,
        client.address.country
    ].filter(Boolean).join(', ') : 'No address set';

    const onFinish = async (values: any) => {
        setSubmitting(true);
        try {
            // Password client-side validation for unmatched confirm
            if ((values.newPassword || values.currentPassword) && (values.newPassword !== values.confirmPassword)) {
                form.setFields([{
                    name: 'confirmPassword',
                    errors: ['New passwords do not match']
                }]);
                msg.error('New passwords do not match');
                setSubmitting(false);
                return;
            }

            const payload: any = {
                name: values.name,
                phone: values.phone,
            };

            if (values.currentPassword && values.newPassword) {
                payload.currentPassword = values.currentPassword;
                payload.newPassword = values.newPassword;
            }

            const response = await axios.put('/api/portal/me', payload);

            if (response.data.success) {
                msg.success('Success! Profile settings updated.');
                form.resetFields(['currentPassword', 'newPassword', 'confirmPassword']);
                await refresh(); // Updates PortalContext user
            } else {
                msg.error(response.data.error || 'Failed to update profile.');
            }
        } catch (err: any) {
            const errMsg = err.response?.data?.error || 'An error occurred during save.';
            // Set field errors on mismatch or status issue
            if (errMsg.includes('current password')) {
                form.setFields([{
                    name: 'currentPassword',
                    errors: [errMsg]
                }]);
            } else {
                msg.error(errMsg);
            }
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div>
            <div style={{ marginBottom: 24 }}>
                <Title level={3} style={{ margin: 0, fontWeight: 700 }}>Client Account & profile</Title>
                <Text type="secondary">Review credentials, contact details, and account representatives.</Text>
            </div>

            <Row gutter={[24, 24]}>
                <Col xs={24} lg={12}>
                    <Card
                        title={<Space><UserOutlined style={{ color: '#FF6584' }} /> <span style={{ fontWeight: 600 }}>Manage Your Account Info</span></Space>}
                        style={{ borderRadius: 12, boxShadow: '0 4px 12px rgba(0,0,0,0.03)' }}
                    >
                        <Form
                            form={form}
                            layout="vertical"
                            onFinish={onFinish}
                            requiredMark={false}
                        >
                            <Form.Item
                                name="name"
                                label="Full Name"
                                rules={[{ required: true, message: 'Please enter your name' }]}
                            >
                                <Input placeholder="Enter your full name" style={{ height: 40, borderRadius: 6 }} />
                            </Form.Item>

                            <Form.Item
                                name="email"
                                label="Email Address"
                            >
                                <Input disabled style={{ height: 40, borderRadius: 6 }} />
                            </Form.Item>

                            <Form.Item
                                name="phone"
                                label="Phone Number"
                            >
                                <Input placeholder="Enter contact phone number" style={{ height: 40, borderRadius: 6 }} />
                            </Form.Item>

                            <Divider style={{ margin: '24px 0' }} />
                            <Text strong style={{ fontSize: 13, display: 'block', marginBottom: 16 }}>
                                Update Account Password
                            </Text>

                            <Form.Item
                                name="currentPassword"
                                label="Current Password"
                            >
                                <Input.Password 
                                    prefix={<LockOutlined style={{ color: '#d9d9d9' }} />} 
                                    placeholder="Enter current password" 
                                    style={{ height: 40, borderRadius: 6 }} 
                                />
                            </Form.Item>

                            <Form.Item
                                name="newPassword"
                                label="New Password"
                                rules={[
                                    ({ getFieldValue }) => ({
                                        validator(_, value) {
                                            if (value && value.length < 6) {
                                                return Promise.reject(new Error('Password must be at least 6 characters'));
                                            }
                                            return Promise.resolve();
                                        },
                                    }),
                                ]}
                            >
                                <Input.Password 
                                    prefix={<LockOutlined style={{ color: '#d9d9d9' }} />} 
                                    placeholder="Min 6 characters" 
                                    style={{ height: 40, borderRadius: 6 }} 
                                />
                            </Form.Item>

                            <Form.Item
                                name="confirmPassword"
                                label="Confirm New Password"
                            >
                                <Input.Password 
                                    prefix={<LockOutlined style={{ color: '#d9d9d9' }} />} 
                                    placeholder="Repeat new password" 
                                    style={{ height: 40, borderRadius: 6 }} 
                                />
                            </Form.Item>

                            <Form.Item style={{ margin: 0 }}>
                                <Button
                                    type="primary"
                                    htmlType="submit"
                                    icon={<SaveOutlined />}
                                    loading={submitting}
                                    style={{
                                        height: 40,
                                        borderRadius: 6,
                                        fontWeight: 600,
                                        backgroundColor: '#FF6584',
                                        borderColor: '#FF6584'
                                    }}
                                >
                                    Save Profile Settings
                                </Button>
                            </Form.Item>
                        </Form>
                    </Card>
                </Col>

                <Col xs={24} lg={12}>
                    <Row gutter={[24, 24]}>
                        <Col xs={24}>
                            <Card 
                                title={<Space><SolutionOutlined style={{ color: '#FF6584' }} /> <span style={{ fontWeight: 600 }}>Your Stakeholder Account Data</span></Space>}
                                style={{ borderRadius: 12, boxShadow: '0 4px 12px rgba(0,0,0,0.03)' }}
                            >
                                <Descriptions column={1} bordered size="small">
                                    <Descriptions.Item label="Contact Name"><strong>{user?.name}</strong></Descriptions.Item>
                                    <Descriptions.Item label="Login Email">{user?.email}</Descriptions.Item>
                                    <Descriptions.Item label="Designation">{user?.designation || 'Client Stakeholder'}</Descriptions.Item>
                                    <Descriptions.Item label="Last Login">{user?.lastLogin ? dayjs(user.lastLogin).format('DD MMM YYYY, hh:mm A') : 'N/A'}</Descriptions.Item>
                                    <Descriptions.Item label="Login Sessions">{user?.loginCount || 0}</Descriptions.Item>
                                </Descriptions>
                            </Card>
                        </Col>

                        <Col xs={24}>
                            <Card
                                title={<Space><ContactsOutlined style={{ color: '#FF6584' }} /> <span style={{ fontWeight: 600 }}>Business Profile</span></Space>}
                                style={{ borderRadius: 12, boxShadow: '0 4px 12px rgba(0,0,0,0.03)' }}
                            >
                                <Descriptions column={1} bordered size="small">
                                    <Descriptions.Item label="Business Name"><strong>{client?.businessName}</strong></Descriptions.Item>
                                    <Descriptions.Item label="Corporate Email">{client?.email}</Descriptions.Item>
                                    <Descriptions.Item label="Corporate Phone">{client?.phone}</Descriptions.Item>
                                    <Descriptions.Item label="Business Website">{client?.website ? <a href={client.website} target="_blank" rel="noreferrer">{client.website}</a> : 'Not listed'}</Descriptions.Item>
                                    <Descriptions.Item label="Industry Sector">{client?.industry || 'Not selected'}</Descriptions.Item>
                                    <Descriptions.Item label="Registered Address">{addressStr}</Descriptions.Item>
                                    <Descriptions.Item label="Client ID Number">{client?.clientNumber}</Descriptions.Item>
                                    <Descriptions.Item label="Service Tier"><Tag color="cyan">{client?.tier?.toUpperCase() || 'STANDARD'}</Tag></Descriptions.Item>
                                </Descriptions>
                            </Card>
                        </Col>
                    </Row>
                </Col>

                {client?.assignedManager && (
                    <Col xs={24}>
                        <Card 
                            title={<Space><SolutionOutlined style={{ color: '#FF6584' }} /> <span style={{ fontWeight: 600 }}>Your Account Manager</span></Space>}
                            style={{ borderRadius: 12, boxShadow: '0 4px 12px rgba(0,0,0,0.03)' }}
                        >
                            <Row gutter={24} align="middle">
                                <Col xs={24} sm={4} style={{ textAlign: 'center' }}>
                                    <Avatar 
                                        size={90} 
                                        src={client.assignedManager.avatar}
                                        icon={<UserOutlined />}
                                        style={{ backgroundColor: '#6C63FF' }}
                                    />
                                </Col>
                                <Col xs={24} sm={20}>
                                    <Title level={4} style={{ margin: 0, fontWeight: 700 }}>
                                        {client.assignedManager.name}
                                    </Title>
                                    <Text type="secondary" style={{ fontSize: 13, display: 'block', marginBottom: 12 }}>
                                        {client.assignedManager.designation || 'Account Relationship Manager'}
                                    </Text>
                                    
                                    <Row gutter={[16, 8]}>
                                        <Col xs={24} sm={12}>
                                            <Text type="secondary">Email: </Text>
                                            <a href={`mailto:${client.assignedManager.email}`}>{client.assignedManager.email}</a>
                                        </Col>
                                        {client.assignedManager.phone && (
                                            <Col xs={24} sm={12}>
                                                <Text type="secondary">Direct Phone: </Text>
                                                <Text>{client.assignedManager.phone}</Text>
                                            </Col>
                                        )}
                                    </Row>
                                    
                                    <Divider style={{ margin: '16px 0' }} />
                                    <Space size={8}>
                                        <InfoCircleOutlined style={{ color: '#faad14' }} />
                                        <Text type="secondary" style={{ fontSize: 12 }}>
                                            If you have feedback or wish to adjust quotas, contact your manager directly.
                                        </Text>
                                    </Space>
                                </Col>
                            </Row>
                        </Card>
                    </Col>
                )}
            </Row>
        </div>
    );
}
export const dynamic = 'force-dynamic';
