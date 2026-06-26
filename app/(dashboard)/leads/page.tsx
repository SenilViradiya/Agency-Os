'use client';

import { useState, useEffect, useCallback } from 'react';
import {
    Box,
    Typography,
    Button,
    Stack,
    ToggleButtonGroup,
    ToggleButton,
    TextField,
    InputAdornment,
    IconButton,
    MenuItem,
    FormControl,
    Select,
} from '@mui/material';
import {
    Add as AddIcon,
    ViewKanban as KanbanIcon,
    List as ListIcon,
    Search as SearchIcon,
    FilterList as FilterIcon,
} from '@mui/icons-material';
import LeadTable from '@/components/leads/LeadTable';
import LeadKanban from '@/components/leads/LeadKanban';
import LeadDrawer from '@/components/leads/LeadDrawer';
import ConvertToClientDialog from '@/components/leads/ConvertToClientDialog';
import PageHeader from '@/components/shared/PageHeader';
import apiClient from '@/lib/apiClient';
import { useRouter } from 'next/navigation';

export default function LeadsPage() {
    const router = useRouter();
    const [view, setView] = useState<'kanban' | 'list'>('kanban');
    const [leads, setLeads] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [drawerOpen, setDrawerOpen] = useState(false);
    const [selectedLead, setSelectedLead] = useState<any>(null);
    const [convertDialogOpen, setConvertDialogOpen] = useState(false);
    const [stats, setStats] = useState({ total: 0 });

    const [filters, setFilters] = useState({
        search: '',
        status: '',
        priority: '',
        source: '',
    });

    const fetchLeads = useCallback(async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            if (filters.search) params.append('search', filters.search);
            if (filters.status) params.append('status', filters.status);
            if (filters.priority) params.append('priority', filters.priority);
            if (filters.source) params.append('source', filters.source);
            params.append('limit', '100');

            const res = await apiClient.get(`/leads?${params.toString()}`);
            if (res.data.success) {
                setLeads(res.data.data);
                setStats({ total: res.data.pagination.total });
            }
        } catch (error) {
            console.error('Failed to fetch leads:', error);
        } finally {
            setLoading(false);
        }
    }, [filters]);

    useEffect(() => {
        const timer = setTimeout(fetchLeads, 500);
        return () => clearTimeout(timer);
    }, [fetchLeads]);

    const handleCreateLead = async (data: any) => {
        setLoading(true);
        try {
            const res = await apiClient.post('/leads', data);
            if (res.data.success) {
                setDrawerOpen(false);
                fetchLeads();
            }
        } catch (error) {
            console.error('Failed to create lead:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateLead = async (id: string, data: any) => {
        try {
            const res = await apiClient.put(`/leads/${id}`, data);
            if (res.data.success) {
                fetchLeads();
                if (res.data.needsConversion) {
                    setSelectedLead(res.data.data);
                    setConvertDialogOpen(true);
                }
            }
        } catch (error) {
            console.error('Failed to update lead:', error);
        }
    };

    const handleDeleteLead = async (id: string) => {
        if (!confirm('Are you sure you want to delete this lead?')) return;
        try {
            const res = await apiClient.delete(`/leads/${id}`);
            if (res.data.success) {
                fetchLeads();
            }
        } catch (error) {
            console.error('Failed to delete lead:', error);
        }
    };

    const handleStatusChange = (leadId: string, newStatus: string) => {
        handleUpdateLead(leadId, { status: newStatus });
    };

    const handleConvertLead = async (data: any) => {
        setLoading(true);
        try {
            const res = await apiClient.post(`/leads/${selectedLead._id}/convert`, data);
            if (res.data.success) {
                setConvertDialogOpen(false);
                router.push(`/clients/${res.data.data.client._id}`);
            }
        } catch (error) {
            console.error('Failed to convert lead:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 4 }}>
                <PageHeader
                    title="Leads"
                    subtitle={`Manage your prospects and pipeline. Total ${stats.total} leads found.`}
                />
                <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={() => { setSelectedLead(null); setDrawerOpen(true); }}
                >
                    Add Lead
                </Button>
            </Box>

            <Box sx={{ mb: 3, display: 'flex', flexWrap: 'wrap', gap: 2, alignItems: 'center', justifyContent: 'space-between' }}>
                <Stack direction="row" spacing={2} sx={{ flexGrow: 1 }}>
                    <TextField
                        placeholder="Search leads..."
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
                    <FormControl size="small" sx={{ minWidth: 120 }}>
                        <Select
                            displayEmpty
                            value={filters.status}
                            onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
                        >
                            <MenuItem value="">All Status</MenuItem>
                            <MenuItem value="new">New</MenuItem>
                            <MenuItem value="contacted">Contacted</MenuItem>
                            <MenuItem value="won">Won</MenuItem>
                            <MenuItem value="lost">Lost</MenuItem>
                        </Select>
                    </FormControl>
                </Stack>

                <ToggleButtonGroup
                    value={view}
                    exclusive
                    onChange={(_, v) => v && setView(v)}
                    size="small"
                    color="primary"
                >
                    <ToggleButton value="kanban">
                        <KanbanIcon sx={{ mr: 1 }} fontSize="small" /> Kanban
                    </ToggleButton>
                    <ToggleButton value="list">
                        <ListIcon sx={{ mr: 1 }} fontSize="small" /> List
                    </ToggleButton>
                </ToggleButtonGroup>
            </Box>

            {loading && leads.length === 0 ? (
                <Box sx={{ textAlign: 'center', py: 8 }}>
                    <Typography color="text.secondary">Loading leads...</Typography>
                </Box>
            ) : (
                view === 'kanban' ? (
                    <LeadKanban
                        leads={leads}
                        onStatusChange={handleStatusChange}
                        onCardClick={(lead) => { setSelectedLead(lead); setDrawerOpen(true); }}
                    />
                ) : (
                    <LeadTable
                        leads={leads}
                        onEdit={(lead) => { setSelectedLead(lead); setDrawerOpen(true); }}
                        onDelete={handleDeleteLead}
                        onConvert={(lead) => { setSelectedLead(lead); setConvertDialogOpen(true); }}
                    />
                )
            )}

            <LeadDrawer
                open={drawerOpen}
                onClose={() => setDrawerOpen(false)}
                onSubmit={(data) => selectedLead ? handleUpdateLead(selectedLead._id, data) : handleCreateLead(data)}
                initialData={selectedLead}
                loading={loading}
            />

            <ConvertToClientDialog
                open={convertDialogOpen}
                onClose={() => setConvertDialogOpen(false)}
                onConvert={handleConvertLead}
                lead={selectedLead}
                loading={loading}
            />
        </Box>
    );
}
