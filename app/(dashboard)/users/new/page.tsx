'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button, Card, Flex, Spin, Typography } from 'antd';
import { ArrowLeftOutlined } from '@ant-design/icons';
import PageHeader from '@/components/shared/PageHeader';
import UserForm from '@/components/users/UserForm';
import apiClient from '@/lib/apiClient';

const { Title, Text } = Typography;

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
            // We could use antd message.error here
            alert(error.response?.data?.error || 'Failed to create user');
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', marginTop: 100 }}>
                <Spin size="large" description="Loading configuration..." />
            </div>
        );
    }

    return (
        <div style={{ maxWidth: 800, margin: '0 auto' }}>
            <Button
                type="text"
                icon={<ArrowLeftOutlined />}
                onClick={() => router.back()}
                style={{ marginBottom: 16 }}
            >
                Back to Users
            </Button>

            <PageHeader
                title="Create New User"
                subtitle="Fill in the details to add a new member to your agency."
            />

            <Card style={{ marginTop: 24, borderRadius: 12, boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}>
                <UserForm
                    roles={roles}
                    onSubmit={handleSubmit}
                    loading={submitting}
                />
            </Card>
        </div>
    );
}
