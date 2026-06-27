'use client';

import { useState, useEffect, useCallback, Suspense } from 'react';
import { 
    Button, 
    Input, 
    Select, 
    Space, 
    Typography, 
    Flex, 
    Spin 
} from 'antd';
import { 
    PlusOutlined, 
    SearchOutlined 
} from '@ant-design/icons';
import ProjectTable from '@/components/projects/ProjectTable';
import ProjectDrawer from '@/components/projects/ProjectDrawer';
import PageHeader from '@/components/shared/PageHeader';
import apiClient from '@/lib/apiClient';
import { useSearchParams } from 'next/navigation';

const { Text } = Typography;
const { Option } = Select;

function ProjectsContent() {
    const searchParams = useSearchParams();
    const [projects, setProjects] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [drawerOpen, setDrawerOpen] = useState(false);
    const [selectedProject, setSelectedProject] = useState<any>(null);
    const [stats, setStats] = useState({ total: 0 });

    const [filters, setFilters] = useState({
        search: '',
        status: '',
        type: '',
        clientId: searchParams.get('clientId') || '',
    });

    const fetchProjects = useCallback(async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            if (filters.search) params.append('search', filters.search);
            if (filters.status) params.append('status', filters.status);
            if (filters.type) params.append('type', filters.type);
            if (filters.clientId) params.append('clientId', filters.clientId);
            params.append('limit', '100');

            const res = await apiClient.get(`/projects?${params.toString()}`);
            if (res.data.success) {
                setProjects(res.data.data);
                setStats({ total: res.data.pagination.total });
            }
        } catch (error) {
            console.error('Failed to fetch projects:', error);
        } finally {
            setLoading(false);
        }
    }, [filters]);

    useEffect(() => {
        const timer = setTimeout(fetchProjects, 500);
        return () => clearTimeout(timer);
    }, [fetchProjects]);

    useEffect(() => {
        if (searchParams.get('drawer') === 'new') {
            setDrawerOpen(true);
        }
    }, [searchParams]);

    const handleCreateProject = async (data: any) => {
        setLoading(true);
        try {
            const res = await apiClient.post('/projects', data);
            if (res.data.success) {
                setDrawerOpen(false);
                fetchProjects();
            }
        } catch (error) {
            console.error('Failed to create project:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateProject = async (id: string, data: any) => {
        setLoading(true);
        try {
            const res = await apiClient.put(`/projects/${id}`, data);
            if (res.data.success) {
                setDrawerOpen(false);
                fetchProjects();
            }
        } catch (error) {
            console.error('Failed to update project:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteProject = async (id: string) => {
        if (!window.confirm('Are you sure you want to cancel this project?')) return;
        try {
            const res = await apiClient.delete(`/projects/${id}`);
            if (res.data.success) {
                fetchProjects();
            }
        } catch (error: any) {
            alert(error.response?.data?.error || 'Failed to delete project');
        }
    };

    return (
        <div>
            <Flex justify="space-between" align="flex-start" style={{ marginBottom: 32 }}>
                <PageHeader 
                    title="Projects" 
                    subtitle={`Track delivery and progress. Total ${stats.total} projects.`} 
                />
                <Button
                    type="primary"
                    size="large"
                    icon={<PlusOutlined />}
                    onClick={() => { setSelectedProject(null); setDrawerOpen(true); }}
                    style={{ height: 45, fontWeight: 600, borderRadius: 8 }}
                >
                    New Project
                </Button>
            </Flex>

            <Flex justify="space-between" align="center" style={{ marginBottom: 24 }} wrap="wrap" gap={16}>
                <Space size="middle">
                    <Input
                        placeholder="Search projects..."
                        prefix={<SearchOutlined style={{ color: '#bfbfbf' }} />}
                        value={filters.search}
                        onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                        style={{ width: 300, borderRadius: 8 }}
                        size="large"
                    />
                    <Select
                        placeholder="All Status"
                        value={filters.status || undefined}
                        onChange={(val) => setFilters(prev => ({ ...prev, status: val || '' }))}
                        style={{ width: 160 }}
                        size="large"
                        allowClear
                    >
                        <Option value="planning">Planning</Option>
                        <Option value="active">Active</Option>
                        <Option value="completed">Completed</Option>
                        <Option value="on_hold">On Hold</Option>
                        <Option value="cancelled">Cancelled</Option>
                    </Select>
                </Space>
            </Flex>

            {loading && projects.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '100px 0' }}>
                    <Spin size="large" description="Loading projects..." />
                </div>
            ) : (
                <ProjectTable 
                    projects={projects} 
                    onEdit={(project) => { setSelectedProject(project); setDrawerOpen(true); }}
                    onDelete={handleDeleteProject}
                />
            )}

            <ProjectDrawer
                open={drawerOpen}
                onClose={() => setDrawerOpen(false)}
                onSubmit={(data) => selectedProject ? handleUpdateProject(selectedProject._id, data) : handleCreateProject(data)}
                initialData={selectedProject}
                loading={loading}
            />
        </div>
    );
}

export default function ProjectsPage() {
    return (
        <Suspense fallback={<div style={{ textAlign: 'center', padding: '100px 0' }}><Spin size="large" /></div>}>
            <ProjectsContent />
        </Suspense>
    );
}
