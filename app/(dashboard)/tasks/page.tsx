'use client';

import { useState, useEffect, useCallback, Suspense } from 'react';
import { 
    Typography, 
    Button, 
    Space, 
    Segmented, 
    Radio, 
    Flex, 
    Select, 
    App,
    Badge,
    Spin,
    Card
} from 'antd';
import { 
    PlusOutlined, 
    AppstoreOutlined, 
    UnorderedListOutlined,
    FilterOutlined
} from '@ant-design/icons';
import PageHeader from '@/components/shared/PageHeader';
import TaskBoard from '@/components/tasks/TaskBoard';
import TaskTable from '@/components/tasks/TaskTable';
import TaskDrawer from '@/components/tasks/TaskDrawer';
import TaskDetailView from '@/components/tasks/TaskDetailView';
import { useSession } from 'next-auth/react';
import apiClient from '@/lib/apiClient';
import { useRouter, useSearchParams } from 'next/navigation';

const { Title } = Typography;
const { Option } = Select;

export function TasksContent() {
    const { message } = App.useApp();
    const { data: session } = useSession();
    const router = useRouter();
    
    const [view, setView] = useState<'board' | 'list'>('board');
    const [scope, setScope] = useState<'my' | 'all'>('my');
    const [tasks, setTasks] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [drawerOpen, setDrawerOpen] = useState(false);
    const [selectedTask, setSelectedTask] = useState<any>(null);
    
    const [filters, setFilters] = useState({
        status: undefined,
        priority: undefined,
        type: undefined,
    });

    const fetchTasks = useCallback(async () => {
        setLoading(true);
        try {
            let url = '/tasks?limit=100';
            if (scope === 'my' && session?.user) {
                url += `&assignedTo=${(session.user as any).id}`;
            }
            if (filters.status) url += `&status=${filters.status}`;
            if (filters.priority) url += `&priority=${filters.priority}`;
            if (filters.type) url += `&type=${filters.type}`;

            const res = await apiClient.get(url);
            if (res.data.success) {
                setTasks(res.data.data);
            }
        } catch (error) {
            console.error('Failed to fetch tasks:', error);
            message.error('Failed to load tasks');
        } finally {
            setLoading(false);
        }
    }, [scope, session, filters, message]);

    useEffect(() => {
        fetchTasks();
    }, [fetchTasks]);

    const handleCreateTask = async (values: any) => {
        try {
            const res = await apiClient.post('/tasks', values);
            if (res.data.success) {
                message.success('Task created successfully');
                setDrawerOpen(false);
                fetchTasks();
            }
        } catch (error) {
            message.error('Failed to create task');
        }
    };

    const handleStatusChange = async (taskId: string, newStatus: string) => {
        try {
            const res = await apiClient.put(`/tasks/${taskId}`, { status: newStatus });
            if (res.data.success) {
                fetchTasks();
            }
        } catch (error) {
            message.error('Update failed');
        }
    };

    const handleDeleteTask = async (id: string) => {
        try {
            await apiClient.delete(`/tasks/${id}`);
            message.success('Task deleted');
            fetchTasks();
        } catch (error: any) {
            message.error(error.response?.data?.error || 'Delete failed');
        }
    };

    return (
        <div>
            <Flex justify="space-between" align="center" style={{ marginBottom: 24 }}>
                <Space size="middle">
                    <Title level={2} style={{ margin: 0 }}>Tasks <Badge count={tasks.length} offset={[10, 0]} color="#6C63FF" /></Title>
                    <Segmented
                        options={[
                            { label: 'My Tasks', value: 'my' },
                            { label: 'All Tasks', value: 'all' }
                        ]}
                        value={scope}
                        onChange={(v) => setScope(v as any)}
                        style={{ background: '#f0f0f0', borderRadius: 8 }}
                    />
                </Space>
                <Space>
                    <Radio.Group value={view} onChange={(e) => setView(e.target.value)} buttonStyle="solid">
                        <Radio.Button value="board"><AppstoreOutlined /> Board</Radio.Button>
                        <Radio.Button value="list"><UnorderedListOutlined /> List</Radio.Button>
                    </Radio.Group>
                    <Button type="primary" icon={<PlusOutlined />} onClick={() => { setSelectedTask(null); setDrawerOpen(true); }} size="large">
                        Add Task
                    </Button>
                </Space>
            </Flex>

            <Card style={{ marginBottom: 24, borderRadius: 12 }}>
                <Flex gap={16} align="center">
                    <FilterOutlined style={{ color: '#8c8c8c' }} />
                    <Select 
                        placeholder="Status" 
                        style={{ width: 150 }} 
                        allowClear 
                        onChange={(v) => setFilters({ ...filters, status: v })}
                    >
                        <Option value="todo">To Do</Option>
                        <Option value="in_progress">In Progress</Option>
                        <Option value="in_review">In Review</Option>
                        <Option value="done">Done</Option>
                    </Select>
                    <Select 
                        placeholder="Priority" 
                        style={{ width: 120 }} 
                        allowClear
                        onChange={(v) => setFilters({ ...filters, priority: v })}
                    >
                        <Option value="low">Low</Option>
                        <Option value="medium">Medium</Option>
                        <Option value="high">High</Option>
                        <Option value="urgent">Urgent</Option>
                    </Select>
                    <Select 
                        placeholder="Type" 
                        style={{ width: 150 }} 
                        allowClear
                        onChange={(v) => setFilters({ ...filters, type: v })}
                    >
                        <Option value="script">Script</Option>
                        <Option value="shoot">Shoot</Option>
                        <Option value="edit">Edit</Option>
                        <Option value="approval">Approval</Option>
                    </Select>
                </Flex>
            </Card>

            {loading ? (
                <div style={{ textAlign: 'center', padding: '100px 0' }}><Spin size="large" /></div>
            ) : view === 'board' ? (
                <TaskBoard 
                    tasks={tasks} 
                    onStatusChange={handleStatusChange} 
                    onTaskClick={(t) => router.push(`/tasks/${t._id}`)} 
                />
            ) : (
                <TaskTable 
                    tasks={tasks} 
                    loading={loading} 
                    onEdit={(t) => { setSelectedTask(t); setDrawerOpen(true); }} 
                    onDelete={handleDeleteTask}
                    onView={(id) => router.push(`/tasks/${id}`)}
                />
            )}

            <TaskDrawer
                open={drawerOpen}
                onClose={() => setDrawerOpen(false)}
                onSubmit={handleCreateTask}
                initialData={selectedTask}
                loading={false}
            />
        </div>
    );
}

export default function TasksPage() {
    return (
        <Suspense fallback={<div style={{ textAlign: 'center', padding: '100px 0' }}><Spin size="large" /></div>}>
            <TasksContent />
        </Suspense>
    );
}
