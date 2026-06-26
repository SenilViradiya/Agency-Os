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
    Grid,
    CircularProgress,
    MenuItem,
    FormControl,
    Select,
} from '@mui/material';
import {
    Add as AddIcon,
    GridView as GridIcon,
    List as ListIcon,
    Search as SearchIcon,
} from '@mui/icons-material';
import ClientTable from '@/components/clients/ClientTable';
import ClientCard from '@/components/clients/ClientCard';
import ClientDrawer from '@/components/clients/ClientDrawer';
import PageHeader from '@/components/shared/PageHeader';
import apiClient from '@/lib/apiClient';

export default function ClientsPage() {
    const [view, setView] = useState<'grid' | 'table'>('grid');
    const [clients, setClients] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [drawerOpen, setDrawerOpen] = useState(false);
    const [selectedClient, setSelectedClient] = useState<any>(null);
    const [stats, setStats] = useState({ total: 0 });

    const [filters, setFilters] = useState({
        search: '',
        status: '',
        tier: '',
    });

    const fetchClients = useCallback(async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            if (filters.search) params.append('search', filters.search);
            if (filters.status) params.append('status', filters.status);
            if (filters.tier) params.append('tier', filters.tier);
            params.append('limit', '100');

            const res = await apiClient.get(`/clients?${params.toString()}`);
            if (res.data.success) {
                setClients(res.data.data);
                setStats({ total: res.data.pagination.total });
            }
        } catch (error) {
            console.error('Failed to fetch clients:', error);
        } finally {
            setLoading(false);
        }
    }, [filters]);

    useEffect(() => {
        const timer = setTimeout(fetchClients, 500);
        return () => clearTimeout(timer);
    }, [fetchClients]);

    const handleCreateClient = async (data: any) => {
        setLoading(true);
        try {
            const res = await apiClient.post('/clients', data);
            if (res.data.success) {
                setDrawerOpen(false);
                fetchClients();
            }
        } catch (error) {
            console.error('Failed to create client:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateClient = async (id: string, data: any) => {
        setLoading(true);
        try {
            const res = await apiClient.put(`/clients/${id}`, data);
            if (res.data.success) {
                setDrawerOpen(false);
                fetchClients();
            }
        } catch (error) {
            console.error('Failed to update client:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteClient = async (id: string) => {
        if (!confirm('Are you sure you want to delete (deactivate) this client?')) return;
        try {
            const res = await apiClient.delete(`/clients/${id}`);
            if (res.data.success) {
                fetchClients();
            }
        } catch (error) {
            alert(error.response?.data?.error || 'Failed to delete client');
        }
    };

    return (
        <Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 4 }}>
                <PageHeader
                    title="Clients"
                    subtitle={`Manage your active partnerships. Total ${stats.total} clients.`}
                />
                <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={() => { setSelectedClient(null); setDrawerOpen(true); }}
                >
                    Add Client
                </Button>
            </Box>

            <Box sx={{ mb: 3, display: 'flex', flexWrap: 'wrap', gap: 2, alignItems: 'center', justifyContent: 'space-between' }}>
                <Stack direction="row" spacing={2} sx={{ flexGrow: 1 }}>
                    <TextField
                        placeholder="Search clients..."
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
                            value={filters.tier}
                            onChange={(e) => setFilters(prev => ({ ...prev, tier: e.target.value }))}
                        >
                            <MenuItem value="">All Tiers</MenuItem>
                            <MenuItem value="standard">Standard</MenuItem>
                            <MenuItem value="premium">Premium</MenuItem>
                            <MenuItem value="enterprise">Enterprise</MenuItem>
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
                    <ToggleButton value="grid">
                        <GridIcon sx={{ mr: 1 }} fontSize="small" /> Grid
                    </ToggleButton>
                    <ToggleButton value="table">
                        <ListIcon sx={{ mr: 1 }} fontSize="small" /> Table
                    </ToggleButton>
                </ToggleButtonGroup>
            </Box>

            {loading && clients.length === 0 ? (
                <Box sx={{ textAlign: 'center', py: 8 }}>
                    <CircularProgress />
                    <Typography sx={{ mt: 2 }} color="text.secondary">Loading clients...</Typography>
                </Box>
            ) : (
                view === 'grid' ? (
                    <Grid container spacing={3}>
                        {clients.map((client) => (
                            <Grid item xs={12} sm={6} md={4} key={client._id}>
                                <ClientCard client={client} />
                            </Grid>
                        ))}
                    </Grid>
                ) : (
                    <ClientTable
                        clients={clients}
                        onEdit={(client) => { setSelectedClient(client); setDrawerOpen(true); }}
                        onDelete={handleDeleteClient}
                    />
                )
            )}

            <ClientDrawer
                open={drawerOpen}
                onClose={() => setDrawerOpen(false)}
                onSubmit={(data) => selectedClient ? handleUpdateClient(selectedClient._id, data) : handleCreateClient(data)}
                initialData={selectedClient}
                loading={loading}
            />
        </Box>
    );
}
