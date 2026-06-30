'use client';

import React from 'react';
import { Card, Avatar, Descriptions, Row, Col, Typography, Tag, Space, Divider, Spin } from 'antd';
import { UserOutlined, ContactsOutlined, SolutionOutlined, InfoCircleOutlined } from '@ant-design/icons';
import { usePortal } from '@/components/portal/PortalContext';
import dayjs from 'dayjs';

const { Title, Text } = Typography;

export default function PortalProfilePage() {
    const { client, user, loading } = usePortal();

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

    return (
        <div>
            <div style={{ marginBottom: 24 }}>
                <Title level={3} style={{ margin: 0, fontWeight: 700 }}>Client Account & profile</Title>
                <Text type="secondary">Review credentials, contact details, and account representatives.</Text>
            </div>

            <Row gutter={[24, 24]}>
                <Col xs={24} md={12}>
                    <Card 
                        title={<Space><UserOutlined style={{ color: '#FF6584' }} /> <span style={{ fontWeight: 600 }}>Your Stakeholder Account</span></Space>}
                        style={{ borderRadius: 12, height: '100%', boxShadow: '0 4px 12px rgba(0,0,0,0.03)' }}
                    >
                        <Descriptions column={1} bordered>
                            <Descriptions.Item label="Contact Name"><strong>{user?.name}</strong></Descriptions.Item>
                            <Descriptions.Item label="Login Email">{user?.email}</Descriptions.Item>
                            <Descriptions.Item label="Designation">{user?.designation || 'Client Stakeholder'}</Descriptions.Item>
                            <Descriptions.Item label="Phone Line">{user?.phone || 'Not provided'}</Descriptions.Item>
                            <Descriptions.Item label="Last Login">{user?.lastLogin ? dayjs(user.lastLogin).format('DD MMM YYYY, hh:mm A') : 'N/A'}</Descriptions.Item>
                            <Descriptions.Item label="Login Sessions">{user?.loginCount || 0}</Descriptions.Item>
                        </Descriptions>
                    </Card>
                </Col>

                <Col xs={24} md={12}>
                    <Card
                        title={<Space><ContactsOutlined style={{ color: '#FF6584' }} /> <span style={{ fontWeight: 600 }}>Business Profile</span></Space>}
                        style={{ borderRadius: 12, height: '100%', boxShadow: '0 4px 12px rgba(0,0,0,0.03)' }}
                    >
                        <Descriptions column={1} bordered>
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
