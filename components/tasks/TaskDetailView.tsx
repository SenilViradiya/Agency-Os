'use client';

import { useState, useEffect } from 'react';
import { 
    Layout, 
    Typography, 
    Card, 
    Space, 
    Tag, 
    Avatar, 
    Divider, 
    Select, 
    Checkbox, 
    Input,
    Progress, 
    Descriptions, 
    Button, 
    Flex,
    Spin,
    Timeline,
    App
} from 'antd';
import { 
    CalendarOutlined, 
    UserOutlined, 
    ProjectOutlined, 
    CheckOutlined,
    ClockCircleOutlined,
    EditOutlined,
    PlusOutlined,
    DeleteOutlined
} from '@ant-design/icons';
import dayjs from 'dayjs';
import TaskComments from './TaskComments';
import apiClient from '@/lib/apiClient';

const { Content, Sider } = Layout;
const { Title, Text, Paragraph } = Typography;
const { Option } = Select;

interface TaskDetailViewProps {
    taskId: string;
}

const STATUS_OPTIONS = [
    { value: 'todo', label: 'To Do', color: 'default' },
    { value: 'in_progress', label: 'In Progress', color: 'blue' },
    { value: 'in_review', label: 'In Review', color: 'orange' },
    { value: 'done', label: 'Done', color: 'green' },
    { value: 'blocked', label: 'Blocked', color: 'red' },
];

const PRIORITY_COLORS: Record<string, string> = {
    low: 'default',
    medium: 'blue',
    high: 'orange',
    urgent: 'red'
};

export default function TaskDetailView({ taskId }: TaskDetailViewProps) {
    const { message } = App.useApp();
    const [task, setTask] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [newChecklistItem, setNewChecklistItem] = useState('');

    const fetchTask = async () => {
        setLoading(true);
        try {
            const res = await apiClient.get(`/tasks/${taskId}`);
            if (res.data.success) {
                setTask(res.data.data);
            }
        } catch (error) {
            console.error('Failed to fetch task:', error);
            message.error('Failed to load task details');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (taskId) fetchTask();
    }, [taskId]);

    const handleUpdateTask = async (data: any) => {
        try {
            const res = await apiClient.put(`/tasks/${taskId}`, data);
            if (res.data.success) {
                setTask(res.data.data);
                message.success('Task updated');
            }
        } catch (error) {
            message.error('Update failed');
        }
    };

    const handleToggleChecklist = (itemId: string, isDone: boolean) => {
        const newChecklist = task.checklist.map((item: any) => 
            item._id === itemId ? { ...item, isDone, completedAt: isDone ? new Date() : null } : item
        );
        handleUpdateTask({ checklist: newChecklist });
    };

    const handleAddChecklistItem = () => {
        if (!newChecklistItem.trim()) return;
        const newItem = { text: newChecklistItem, isDone: false };
        handleUpdateTask({ checklist: [...(task.checklist || []), newItem] });
        setNewChecklistItem('');
    };

    const handleRowRemoval = (itemId: string) => {
        const newChecklist = task.checklist.filter((item: any) => item._id !== itemId);
        handleUpdateTask({ checklist: newChecklist });
    };

    if (loading) return <div style={{ textAlign: 'center', padding: '100px 0' }}><Spin size="large" /></div>;
    if (!task) return <div>Task not found</div>;

    const doneCount = task.checklist?.filter((i: any) => i.isDone).length || 0;
    const totalCount = task.checklist?.length || 0;
    const progressPercent = totalCount > 0 ? Math.round((doneCount / totalCount) * 100) : 0;

    return (
        <Layout style={{ background: 'transparent' }}>
            <Content style={{ paddingRight: 24 }}>
                <div style={{ marginBottom: 24 }}>
                    <Flex justify="space-between" align="start">
                        <div>
                            <Space align="center" style={{ marginBottom: 12 }}>
                                <Text type="secondary">{task.taskNumber}</Text>
                                <Tag color={PRIORITY_COLORS[task.priority]} style={{ textTransform: 'uppercase' }}>
                                    {task.priority}
                                </Tag>
                                {task.isPipelineTask && (
                                    <Tag color="purple">PIPELINE · {task.pipelineStage?.toUpperCase()}</Tag>
                                )}
                            </Space>
                            <Title level={2} editable={{ onChange: (v) => handleUpdateTask({ title: v }) }} style={{ margin: 0 }}>
                                {task.title}
                            </Title>
                        </div>
                        <Select 
                            value={task.status} 
                            style={{ width: 160 }} 
                            onChange={(v) => handleUpdateTask({ status: v })}
                            size="large"
                        >
                            {STATUS_OPTIONS.map(opt => (
                                <Option key={opt.value} value={opt.value}>
                                    <Tag color={opt.color} style={{ border: 'none', background: 'transparent', margin: 0 }}>
                                        {opt.label.toUpperCase()}
                                    </Tag>
                                </Option>
                            ))}
                        </Select>
                    </Flex>
                </div>

                <Card title="Description" style={{ marginBottom: 24, borderRadius: 12 }}>
                    <Paragraph editable={{ onChange: (v) => handleUpdateTask({ description: v }) }}>
                        {task.description || 'No description provided.'}
                    </Paragraph>
                </Card>

                <Card 
                    title={
                        <Flex justify="space-between" align="center" style={{ width: '100%' }}>
                            <span>Checklist</span>
                            <Text type="secondary" style={{ fontSize: 13, fontWeight: 'normal' }}>
                                {doneCount}/{totalCount} Completed
                            </Text>
                        </Flex>
                    }
                    style={{ marginBottom: 24, borderRadius: 12 }}
                >
                    <Progress percent={progressPercent} strokeColor="#6C63FF" style={{ marginBottom: 24 }} />
                    <Space orientation="vertical" style={{ width: '100%' }} size="middle">
                        {task.checklist?.map((item: any) => (
                            <Flex key={item._id} justify="space-between" align="center">
                                <Checkbox 
                                    checked={item.isDone} 
                                    onChange={(e) => handleToggleChecklist(item._id, e.target.checked)}
                                >
                                    <Text delete={item.isDone} style={{ fontSize: 15 }}>{item.text}</Text>
                                </Checkbox>
                                <Button type="text" danger icon={<DeleteOutlined />} onClick={() => handleRowRemoval(item._id)} />
                            </Flex>
                        ))}
                        <Flex gap={8} style={{ marginTop: 8 }}>
                            <Input 
                                placeholder="Add an item..." 
                                value={newChecklistItem}
                                onChange={(e) => setNewChecklistItem(e.target.value)}
                                onPressEnter={handleAddChecklistItem}
                            />
                            <Button type="primary" icon={<PlusOutlined />} onClick={handleAddChecklistItem}>Add</Button>
                        </Flex>
                    </Space>
                </Card>

                <Card title="Comments" style={{ borderRadius: 12 }}>
                    <TaskComments 
                        taskId={task._id} 
                        comments={task.comments || []} 
                        onCommentAdded={(c) => setTask({ ...task, comments: [...task.comments, c] })} 
                    />
                </Card>
            </Content>

            <Sider width={320} style={{ background: 'transparent' }}>
                <Card title="Task Info" style={{ borderRadius: 12 }}>
                    <Descriptions column={1} size="small" bordered>
                        <Descriptions.Item label={<Space><UserOutlined /> Assigned To</Space>}>
                            <Avatar.Group max={{ count: 2 }}>
                                {task.assignedTo?.map((u: any) => (
                                    <Avatar key={u._id} src={u.avatar}>{u.name?.charAt(0)}</Avatar>
                                ))}
                            </Avatar.Group>
                        </Descriptions.Item>
                        <Descriptions.Item label={<Space><CalendarOutlined /> Due Date</Space>}>
                            {task.dueDate ? dayjs(task.dueDate).format('DD MMM YYYY') : 'None'}
                        </Descriptions.Item>
                        <Descriptions.Item label={<Space><ClockCircleOutlined /> Est. Hours</Space>}>
                            {task.estimatedHours}h
                        </Descriptions.Item>
                        <Descriptions.Item label={<Space><ProjectOutlined /> Related To</Space>}>
                            <Tag color="blue">{task.entityType.toUpperCase()}</Tag>
                        </Descriptions.Item>
                    </Descriptions>

                    <Divider />

                    <Title level={5} style={{ fontSize: 13, color: '#8c8c8c' }}>TIMELINE</Title>
                    <Timeline 
                        mode="start"
                        items={[
                            { title: dayjs(task.createdAt).format('DD MMM'), content: 'Task Created' },
                            ...(task.completedAt ? [{ title: dayjs(task.completedAt).format('DD MMM'), content: 'Task Completed', color: 'green' }] : []),
                        ]}
                    />
                </Card>

                <Card title="Tags" style={{ marginTop: 24, borderRadius: 12 }}>
                    <Space wrap>
                        {task.tags?.map((tag: string) => (
                            <Tag key={tag} color="geekblue">{tag}</Tag>
                        ))}
                    </Space>
                </Card>
            </Sider>
        </Layout>
    );
}
