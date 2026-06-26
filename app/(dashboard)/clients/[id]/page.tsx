'use client';

import { useState, useEffect, useCallback } from 'react';
import { Box, Typography, Button, IconButton, CircularProgress } from '@mui/material';
import { ArrowBack as BackIcon } from '@mui/icons-material';
import ClientDetailView from '@/components/clients/ClientDetailView';
import ClientDrawer from '@/components/clients/ClientDrawer';
import apiClient from '@/lib/apiClient';
import { useParams, useRouter } from 'next/navigation';

export default function ClientDetailPage() {
    const params = useParams();
    const router = useRouter();
    const id = params.id as string;

    const [client, setClient] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [drawerOpen, setDrawerOpen] = useState(false);

    const fetchClient = useCallback(async () => {
        setLoading(true);
        try {
            const res = await apiClient.get(`/clients/${id}`);
            if (res.data.success) {
                setClient(res.data.data);
            }
        } catch (error) {
            console.error('Failed to fetch client:', error);
        } finally {
            setLoading(false);
        }
    }, [id]);

    useEffect(() => {
        fetchClient();
    }, [fetchClient]);

    const handleUpdate = async (data: any) => {
        setLoading(true);
        try {
            const res = await apiClient.put(`/clients/${id}`, data);
            if (res.data.success) {
                setDrawerOpen(false);
                fetchClient();
            }
        } catch (error) {
            console.error('Failed to update client:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading && !client) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
                <CircularProgress />
            </Box>
        );
    }

    if (!client) {
        return (
            <Box sx={{ py: 10, textAlign: 'center' }}>
                <Typography color="error">Client not found.</Typography>
                <Button sx={{ mt: 2 }} onClick={() => router.push('/clients')}>Back to Clients</Button>
            </Box>
        );
    }

    return (
        <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 4 }}>
                <IconButton onClick={() => router.push('/clients')}>
                    <BackIcon />
                </IconButton>
                <Typography variant="h5" sx={{ fontWeight: 800 }}>Client Details</Typography>
            </Box>

            <ClientDetailView 
                client={client} 
                onEdit={() => setDrawerOpen(true)} 
            />

            <ClientDrawer
                open={drawerOpen}
                onClose={() => setDrawerOpen(false)}
                onSubmit={handleUpdate}
                initialData={client}
                loading={loading}
            />
        </Box>
    );
}
