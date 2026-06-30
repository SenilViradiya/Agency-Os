'use client';

import { Card, Tag, Avatar, Button, Flex, Typography, Descriptions, Collapse, Space, Tooltip } from 'antd';
import { 
    CheckCircleFilled, 
    ClockCircleFilled, 
    MinusCircleFilled,
    EditOutlined,
    UserOutlined,
    LinkOutlined
} from '@ant-design/icons';

const { Text } = Typography;
const { Panel } = Collapse;

interface StageSectionProps {
    title: string;
    stageKey: string;
    icon: any;
    status: 'pending' | 'in_progress' | 'done' | 'skipped';
    assignedTo?: any;
    data: any;
    isActive: boolean;
    onEdit: () => void;
    customRender?: React.ReactNode;
}

const STATUS_CONFIG: any = {
    pending: { color: 'default', label: 'Pending', icon: <ClockCircleFilled style={{ color: '#bfbfbf' }} /> },
    in_progress: { color: 'blue', label: 'In Progress', icon: <ClockCircleFilled style={{ color: '#1677ff' }} /> },
    done: { color: 'green', label: 'Completed', icon: <CheckCircleFilled style={{ color: '#52c41a' }} /> },
    skipped: { color: 'default', label: 'Skipped', icon: <MinusCircleFilled style={{ color: '#bfbfbf' }} /> },
};

export default function StageSection({ title, stageKey, icon, status, assignedTo, data, isActive, onEdit, customRender }: StageSectionProps) {
    const config = STATUS_CONFIG[status] || STATUS_CONFIG.pending;
    const isExpanded = status === 'in_progress' || status === 'done' || isActive;

    const renderData = () => {
        if (!data || Object.keys(data).length === 0) {
            return <Text type="secondary" italic>No data recorded for this stage yet.</Text>;
        }

        const items = Object.entries(data).filter(([key]) => key !== '_id' && key !== 'version').map(([key, value]: [string, any]) => {
            let content = value;
            if (typeof value === 'string' && (value.startsWith('http') || value.includes('docs.google.com'))) {
                content = <a href={value} target="_blank" rel="noopener noreferrer"><Space size={4}><LinkOutlined /> Link</Space></a>;
            } else if (value instanceof Date || (typeof value === 'string' && !isNaN(Date.parse(value)) && value.length > 10)) {
                content = new Date(value).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
            } else if (value && typeof value === 'object' && value.name) {
                content = value.name;
            }

            return {
                key,
                label: key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase()),
                children: content || '-',
            };
        });

        return <Descriptions column={{ xs: 1, sm: 2 }} size="small" items={items} />;
    };

    return (
        <Card 
            size="small"
            title={
                <Flex justify="space-between" align="center" style={{ width: '100%' }}>
                    <Space size="middle">
                        <span style={{ fontSize: 18, color: isActive ? '#6C63FF' : '#8c8c8c' }}>{icon}</span>
                        <Text strong style={{ fontSize: 15, color: isActive ? '#6C63FF' : 'inherit' }}>
                            {title.toUpperCase()}
                        </Text>
                        <Tag color={config.color} icon={config.icon} style={{ borderRadius: 12, padding: '0 10px' }}>
                            {config.label.toUpperCase()}
                        </Tag>
                    </Space>
                    <Space>
                        {assignedTo && (
                            <Tooltip title={`Assigned: ${assignedTo.name}`}>
                                <Avatar size="small" src={assignedTo.avatar} icon={<UserOutlined />} />
                            </Tooltip>
                        )}
                        <Button type="text" icon={<EditOutlined />} onClick={(e) => { e.stopPropagation(); onEdit(); }} />
                    </Space>
                </Flex>
            }
            styles={{ body: { padding: isExpanded ? '16px 24px' : 0 } }}
            style={{ 
                marginBottom: 16, 
                borderRadius: 12, 
                border: isActive ? '2px solid #6C63FF' : '1px solid #f0f0f0',
                boxShadow: isActive ? '0 4px 12px rgba(108, 99, 255, 0.1)' : 'none'
            }}
        >
            {isExpanded && (customRender || renderData())}
        </Card>
    );
}
