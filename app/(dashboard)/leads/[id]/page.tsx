'use client';

import { useState, useEffect, useCallback, use } from 'react';
import { Box, Typography, Button, IconButton, CircularProgress } from '@mui/material';
import { ArrowBack as BackIcon } from '@mui/icons-material';
import LeadDetailView from '@/components/leads/LeadDetailView';
import ConvertToClientDialog from '@/components/leads/ConvertToClientDialog';
import apiClient from '@/lib/apiClient';
import { useParams, useRouter } from 'next/navigation';

export default function LeadDetailPage() {
    const params = useParams();
    const router = useRouter();
    const id = params.id as string;

    const [lead, setLead] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [convertDialogOpen, setConvertDialogOpen] = useState(false);

    const fetchLead = useCallback(async () => {
        setLoading(true);
        try {
            const res = await apiClient.get(`/leads/${id}`);
            if (res.data.success) {
                setLead(res.data.data);
            }
        } catch (error) {
            console.error('Failed to fetch lead:', error);
        } finally {
            setLoading(false);
        }
    }, [id]);

    useEffect(() => {
        fetchLead();
    }, [fetchLead]);

    const handleUpdate = async (data: any) => {
        try {
            const res = await apiClient.put(`/leads/${id}`, data);
            if (res.data.success) {
                setLead(res.data.data);
                if (res.data.needsConversion) {
                    setConvertDialogOpen(true);
                }
            }
        } catch (error) {
            console.error('Failed to update lead:', error);
        }
    };

    const handleConvert = async (data: any) => {
        setLoading(true);
        try {
            const res = await apiClient.post(`/leads/${id}/convert`, data);
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

    if (loading && !lead) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
                <CircularProgress />
            </Box>
        );
    }

    if (!lead) {
        return (
            <Box sx={{ py: 10, textAlign: 'center' }}>
                <Typography color="error">Lead not found.</Typography>
                <Button sx={{ mt: 2 }} onClick={() => router.push('/leads')}>Back to Leads</Button>
            </Box>
        );
    }

    return (
        <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 4 }}>
                <IconButton onClick={() => router.push('/leads')}>
                    <BackIcon />
                </IconButton>
                <Typography variant="h5" sx={{ fontWeight: 800 }}>Lead Details</Typography>
            </Box>

            <LeadDetailView
                lead={lead}
                onUpdate={handleUpdate}
                onConvert={() => setConvertDialogOpen(true)}
            />

            <ConvertToClientDialog
                open={convertDialogOpen}
                onClose={() => setConvertDialogOpen(false)}
                onConvert={handleConvert}
                lead={lead}
                loading={loading}
            />
        </Box>
    );
}
