'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Box, Paper, Button, Typography, CircularProgress } from '@mui/material';
import { ArrowBack as BackIcon } from '@mui/icons-material';
import PageHeader from '@/components/shared/PageHeader';
import UserForm from '@/components/users/UserForm';
import apiClient from '@/lib/apiClient';

export default function NewUserPage() {
    const router = useRouter();
    const [roles, setRoles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        const fetchRoles = async () => {
            try {
                const res = await apiClient.get('/roles');
                setRoles(res.data.data);
            } catch (error) {
                console.error('Failed to fetch roles:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchRoles();
    }, []);

    const handleSubmit = async (data: any) => {
        setSubmitting(true);
        try {
            const res = await apiClient.post('/users', data);
            if (res.data.success) {
                router.push('/users');
            }
        } catch (error: any) {
            console.error('Failed to create user:', error);
            alert(error.response?.data?.error || 'Failed to create user');
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 10 }}>
                <CircularProgress />
            </Box>
        );
    }

    return (
        <Box sx={{ maxWidth: 800, mx: 'auto' }}>
            <Button 
                startIcon={<BackIcon />} 
                onClick={() => router.back()} 
                sx={{ mb: 2 }}
            >
                Back to Users
            </Button>
            
            <PageHeader 
                title="Create New User" 
                subtitle="Fill in the details to add a new member to your agency."
            />

            <Paper sx={{ p: 4, mt: 2, borderRadius: 3 }}>
                <UserForm 
                    roles={roles} 
                    onSubmit={handleSubmit} 
                    loading={submitting} 
                />
            </Paper>
        </Box>
    );
}
