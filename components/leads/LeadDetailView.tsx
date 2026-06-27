'use client';

import { useState } from 'react';
import {
    Row,
    Col,
    Card,
    Typography,
    Tabs,
    Divider,
    Button,
    Avatar,
    Select,
    Input,
    Timeline,
    Space,
    Flex,
    List,
} from 'antd';
import {
    HistoryOutlined,
    WalletOutlined,
    GlobalOutlined,
    CalendarOutlined,
    CheckCircleOutlined,
    UserOutlined,
} from '@ant-design/icons';
import StatusChip from '@/components/shared/StatusChip';
import PriorityChip from '@/components/shared/PriorityChip';
import dayjs from 'dayjs';

const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;

interface LeadDetailViewProps {
    lead: any;
    onUpdate: (data: any) => void;
    onConvert: () => void;
}

export default function LeadDetailView({ lead, onUpdate, onConvert }: LeadDetailViewProps) {
    const [notes, setNotes] = useState(lead.notes || '');

    const handleSaveNotes = () => {
        onUpdate({ notes });
    };

    const overviewContent = (
        <Row gutter={[40, 24]}>
            <Col span={12}>
                <Space orientation="vertical" size="large" style={{ width: '100%' }}>
                    <InfoItem label="Contact Person" value={lead.name} />
                    <InfoItem label="Email" value={lead.email} />
                    <InfoItem label="Phone" value={lead.phone} />
                    <InfoItem label="WhatsApp" value={lead.whatsappNumber || '-'} />
                </Space>
            </Col>
            <Col span={12}>
                <Space orientation="vertical" size="large" style={{ width: '100%' }}>
                    <InfoItem label="Source" value={lead.source} style={{ textTransform: 'capitalize' }} />
                    <InfoItem label="Industry" value={lead.industry || '-'} />
                    <InfoItem label="Services" value={lead.services?.join(', ') || '-'} />
                    <InfoItem label="Referred By" value={lead.referredBy || '-'} />
                </Space>
            </Col>
        </Row>
    );

    const timelineContent = (
        <Timeline
            style={{ marginTop: 16 }}
            mode="start"
            items={lead.timeline?.slice().reverse().map((item: any, i: number) => ({
                color: '#6C63FF',
                content: (
                    <div key={i}>
                        <Text strong style={{ display: 'block' }}>{item.action}</Text>
                        {item.note && <Paragraph style={{ fontSize: 13, marginBottom: 4 }}>{item.note}</Paragraph>}
                        <Text type="secondary" style={{ fontSize: 11 }}>
                            {item.performedBy?.name || 'System'} • {dayjs(item.createdAt).format('DD MMM, hh:mm A')}
                        </Text>
                    </div>
                ),
            }))}
        />
    );

    const notesContent = (
        <div style={{ marginTop: 8 }}>
            <TextArea
                rows={10}
                placeholder="Add detailed internal notes about this lead..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                style={{ backgroundColor: '#fcfcfc', marginBottom: 16 }}
            />
            <Button type="primary" onClick={handleSaveNotes}>
                Save Notes
            </Button>
        </div>
    );

    const tabsItems = [
        { key: '1', label: 'Overview', children: overviewContent },
        { key: '2', label: 'Timeline', children: timelineContent },
        { key: '3', label: 'Notes', children: notesContent },
    ];

    return (
        <Row gutter={24}>
            {/* Left Column - 65% */}
            <Col xs={24} md={16}>
                <Card style={{ borderRadius: 12, overflow: 'hidden' }} styles={{ body: { padding: 0 } }}>
                    <div style={{ padding: '24px 32px', backgroundColor: '#fafafa', borderBottom: '1px solid #f0f0f0' }}>
                        <Flex justify="space-between" align="center">
                            <Space size="large">
                                <div>
                                    <Title level={3} style={{ margin: 0, fontWeight: 800 }}>{lead.businessName}</Title>
                                    <Text type="secondary" style={{ fontSize: 12 }}>
                                        {lead.leadNumber} • Created {dayjs(lead.createdAt).format('DD MMM YYYY')}
                                    </Text>
                                </div>
                                <StatusChip status={lead.status} />
                            </Space>
                            <PriorityChip priority={lead.priority} />
                        </Flex>
                    </div>

                    <div style={{ padding: '0 32px 32px 32px' }}>
                        <Tabs defaultActiveKey="1" items={tabsItems} />
                    </div>
                </Card>
            </Col>

            {/* Right Column - 35% */}
            <Col xs={24} md={8}>
                <Space orientation="vertical" size="large" style={{ width: '100%' }}>
                    <Card size="small" title={<Text strong style={{ fontSize: 12, color: '#8c8c8c' }}>QUICK ACTIONS</Text>} style={{ borderRadius: 12 }}>
                        <Space orientation="vertical" style={{ width: '100%', paddingTop: 8 }} size="middle">
                            <div>
                                <Text type="secondary" style={{ fontSize: 12, display: 'block', marginBottom: 8 }}>Change Status</Text>
                                <Select
                                    value={lead.status}
                                    style={{ width: '100%' }}
                                    onChange={(val) => onUpdate({ status: val })}
                                    options={[
                                        { value: 'new', label: 'New' },
                                        { value: 'contacted', label: 'Contacted' },
                                        { value: 'qualified', label: 'Qualified' },
                                        { value: 'proposal_sent', label: 'Proposal Sent' },
                                        { value: 'negotiation', label: 'Negotiation' },
                                        { value: 'won', label: 'Won' },
                                        { value: 'lost', label: 'Lost' },
                                    ]}
                                />
                            </div>

                            <Button
                                block
                                type="primary"
                                style={{ backgroundColor: '#52c41a', border: 'none', height: 40, fontWeight: 700 }}
                                icon={<CheckCircleOutlined />}
                                disabled={lead.status !== 'won' || lead.convertedToClient}
                                onClick={onConvert}
                            >
                                {lead.convertedToClient ? 'Converted to Client' : 'Convert to Client'}
                            </Button>
                        </Space>
                    </Card>

                    <Card size="small" title={<Text strong style={{ fontSize: 12, color: '#8c8c8c' }}>LEAD STATS</Text>} style={{ borderRadius: 12 }}>
                        <Space orientation="vertical" style={{ width: '100%', paddingTop: 8 }} size="large">
                            <StatItem label="Budget" value={`₹${lead.budget?.toLocaleString('en-IN')}`} icon={<WalletOutlined style={{ color: '#6C63FF' }} />} />
                            <StatItem label="Lead Source" value={lead.source} icon={<GlobalOutlined style={{ color: '#6C63FF' }} />} />
                            <StatItem label="Follow-up" value={lead.followUpDate ? dayjs(lead.followUpDate).format('DD MMM YYYY') : 'Not Set'} icon={<CalendarOutlined style={{ color: '#ff4d4f' }} />} />
                        </Space>
                    </Card>

                    <Card size="small" style={{ borderRadius: 12 }}>
                        <Text strong style={{ fontSize: 12, color: '#8c8c8c', display: 'block', marginBottom: 16 }}>ASSIGNED TO</Text>
                        <Flex gap={12} align="center">
                            <Avatar size={48} src={lead.assignedTo?.avatar} icon={<UserOutlined />} style={{ backgroundColor: '#6C63FF' }} />
                            <div>
                                <Text strong style={{ display: 'block' }}>{lead.assignedTo?.name}</Text>
                                <Text type="secondary" style={{ fontSize: 12 }}>{lead.assignedTo?.email}</Text>
                            </div>
                        </Flex>
                    </Card>
                </Space>
            </Col>
        </Row>
    );
}

function InfoItem({ label, value, style }: any) {
    return (
        <div style={style}>
            <Text type="secondary" style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', display: 'block', marginBottom: 2 }}>
                {label}
            </Text>
            <Text strong style={{ fontSize: 15 }}>{value}</Text>
        </div>
    );
}

function StatItem({ label, value, icon }: any) {
    return (
        <Flex gap={16} align="center">
            <div style={{ backgroundColor: '#f0f2f5', padding: 8, borderRadius: 8, display: 'flex' }}>
                {icon}
            </div>
            <div>
                <Text type="secondary" style={{ fontSize: 11, fontWeight: 600, display: 'block' }}>{label}</Text>
                <Text strong style={{ fontSize: 13, textTransform: 'capitalize' }}>{value}</Text>
            </div>
        </Flex>
    );
}
