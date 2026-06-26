'use client';

import { useState, useEffect, useCallback, Suspense } from 'react';
import {
    Box,
    Typography,
    Button,
    Stack,
    TextField,
    InputAdornment,
    CircularProgress,
    MenuItem,
    FormControl,
    Select,
    InputLabel,
} from '@mui/material';
import {
    Add as AddIcon,
    Search as SearchIcon,
} from '@mui/icons-material';
import ProjectTable from '@/components/projects/ProjectTable';
import ProjectDrawer from '@/components/projects/ProjectDrawer';
import PageHeader from '@/components/shared/PageHeader';
import apiClient from '@/lib/apiClient';
import { useSearchParams } from 'next/navigation';

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
        if (!confirm('Are you sure you want to cancel this project?')) return;
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
        <Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 4 }}>
                <PageHeader 
                    title="Projects" 
                    subtitle={`Track delivery and progress. Total ${stats.total} projects.`} 
                />
                <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={() => { setSelectedProject(null); setDrawerOpen(true); }}
                >
                    New Project
                </Button>
            </Box>

            <Box sx={{ mb: 3, display: 'flex', flexWrap: 'wrap', gap: 2, alignItems: 'center', justifyContent: 'space-between' }}>
                <Stack direction="row" spacing={2} sx={{ flexGrow: 1 }}>
                    <TextField
                        placeholder="Search projects..."
                        size="small"
                        value={filters.search}
                        onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                        sx={{ minWidth: 250 }}
                        InputProps={{
                            startAdornment: (
                                <InputAdornment position="start">
                                    <SearchIcon fontSize="small" />
                                </InputAdornment>
                            ),
                        }}
                    />
                    <FormControl size="small" sx={{ minWidth: 150 }}>
                        <InputLabel>All Status</InputLabel>
                        <Select
                            value={filters.status}
                            label="All Status"
                            onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
                        >
                            <MenuItem value="">All Status</MenuItem>
                            <MenuItem value="planning">Planning</MenuItem>
                            <MenuItem value="active">Active</MenuItem>
                            <MenuItem value="completed">Completed</MenuItem>
                        </Select>
                    </FormControl>
                </Stack>
            </Box>

            {loading && projects.length === 0 ? (
                <Box sx={{ textAlign: 'center', py: 8 }}>
                    <CircularProgress />
                    <Typography sx={{ mt: 2 }} color="text.secondary">Loading projects...</Typography>
                </Box>
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
        </Box>
    );
}

export default function ProjectsPage() {
    return (
        <Suspense fallback={<CircularProgress />}>
            <ProjectsContent />
        </Suspense>
    );
}
