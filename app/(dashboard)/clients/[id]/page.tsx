'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button, Typography, Space, Flex, Spin, Result } from 'antd';
import { ArrowLeftOutlined } from '@ant-design/icons';
import ClientDetailView from '@/components/clients/ClientDetailView';
import ClientDrawer from '@/components/clients/ClientDrawer';
import apiClient from '@/lib/apiClient';
import { useParams, useRouter } from 'next/navigation';

const { Title, Text } = Typography;

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
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
                <Spin size="large" description="Loading client details..." />
            </div>
        );
    }

    if (!client) {
        return (
            <Result
                status="404"
                title="Client Not Found"
                subTitle="Sorry, the client you are looking for does not exist."
                extra={
                    <Button type="primary" onClick={() => router.push('/clients')}>
                        Back to Clients
                    </Button>
                }
            />
        );
    }

    return (
        <div>
            <Flex align="center" gap={16} style={{ marginBottom: 32 }}>
                <Button 
                    shape="circle" 
                    icon={<ArrowLeftOutlined />} 
                    onClick={() => router.push('/clients')} 
                />
                <Title level={3} style={{ margin: 0, fontWeight: 800 }}>Client Details</Title>
            </Flex>

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
        </div>
    );
}
