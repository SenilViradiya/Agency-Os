'use client';

import { Card, Tag, Typography, Avatar, Space, Progress, Flex, Tooltip } from 'antd';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { CalendarOutlined, CheckSquareOutlined, ClockCircleOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';

const { Text } = Typography;

interface TaskCardProps {
    task: any;
    onClick: (task: any) => void;
}

const ENTITY_COLORS: Record<string, string> = {
    project: 'blue',
    content_item: 'purple',
    lead: 'cyan',
    client: 'geekblue',
    general: 'default'
};

const PRIORITY_COLORS: Record<string, string> = {
    low: 'default',
    medium: 'blue',
    high: 'orange',
    urgent: 'red'
};

export default function TaskCard({ task, onClick }: TaskCardProps) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging
    } = useSortable({ id: task._id });

    const style = {
        transform: CSS.Translate.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
        marginBottom: 12,
        cursor: 'pointer'
    };

    const doneItems = task.checklist?.filter((i: any) => i.isDone).length || 0;
    const totalItems = task.checklist?.length || 0;
    const progress = totalItems > 0 ? Math.round((doneItems / totalItems) * 100) : 0;

    const isOverdue = task.dueDate && dayjs(task.dueDate).isBefore(dayjs()) && task.status !== 'done';

    return (
        <div ref={setNodeRef} style={style} {...attributes} {...listeners} onClick={() => onClick(task)}>
            <Card 
                size="small" 
                hoverable 
                styles={{ body: { padding: 12 } }}
                style={{ borderRadius: 12, border: '1px solid #f0f0f0' }}
            >
                <Flex justify="space-between" align="start" style={{ marginBottom: 8 }}>
                    <Text type="secondary" style={{ fontSize: 10 }}>{task.taskNumber}</Text>
                    <Tag color={PRIORITY_COLORS[task.priority]} style={{ margin: 0, fontSize: 10, borderRadius: 4 }}>
                        {task.priority.toUpperCase()}
                    </Tag>
                </Flex>

                <div style={{ marginBottom: 12 }}>
                    <Text strong style={{ fontSize: 13, lineHeight: 1.4, display: 'block' }}>
                        {task.title}
                    </Text>
                </div>

                <Space size={4} wrap style={{ marginBottom: 12 }}>
                    <Tag color={ENTITY_COLORS[task.entityType]} style={{ fontSize: 10, borderRadius: 4 }}>
                        {task.entityType.replace('_', ' ').toUpperCase()}
                    </Tag>
                    {task.isPipelineTask && (
                        <Tag color="purple" style={{ fontSize: 10, borderRadius: 4 }}>
                            PIPELINE · {task.pipelineStage?.toUpperCase()}
                        </Tag>
                    )}
                </Space>

                {totalItems > 0 && (
                    <div style={{ marginBottom: 12 }}>
                        <Flex justify="space-between" align="center" style={{ marginBottom: 4 }}>
                            <Space size={4}>
                                <CheckSquareOutlined style={{ fontSize: 10, color: '#8c8c8c' }} />
                                <Text style={{ fontSize: 10, color: '#8c8c8c' }}>{doneItems}/{totalItems}</Text>
                            </Space>
                            <Text style={{ fontSize: 10, color: '#8c8c8c' }}>{progress}%</Text>
                        </Flex>
                        <Progress percent={progress} size="small" showInfo={false} strokeColor="#6C63FF" />
                    </div>
                )}

                <Flex justify="space-between" align="center">
                    <Space size={4}>
                        <CalendarOutlined style={{ fontSize: 12, color: isOverdue ? '#ff4d4f' : '#8c8c8c' }} />
                        <Text style={{ fontSize: 11, color: isOverdue ? '#ff4d4f' : '#8c8c8c' }}>
                            {task.dueDate ? dayjs(task.dueDate).format('DD MMM') : 'No date'}
                        </Text>
                    </Space>
                    
                    <Avatar.Group max={{ count: 3 }} size="small">
                        {task.assignedTo?.map((user: any) => (
                            <Tooltip title={user.name} key={user._id}>
                                <Avatar src={user.avatar}>{user.name?.charAt(0)}</Avatar>
                            </Tooltip>
                        ))}
                    </Avatar.Group>
                </Flex>
            </Card>
        </div>
    );
}
