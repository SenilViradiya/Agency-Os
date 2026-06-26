'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button, Typography, Space, Flex, Spin, Result } from 'antd';
import { ArrowLeftOutlined } from '@ant-design/icons';
import LeadDetailView from '@/components/leads/LeadDetailView';
import ConvertToClientDialog from '@/components/leads/ConvertToClientDialog';
import apiClient from '@/lib/apiClient';
import { useParams, useRouter } from 'next/navigation';

const { Title, Text } = Typography;

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
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
                <Spin size="large" description="Loading lead details..." />
            </div>
        );
    }

    if (!lead) {
        return (
            <Result
                status="404"
                title="Lead Not Found"
                subTitle="Sorry, the lead you are looking for does not exist."
                extra={
                    <Button type="primary" onClick={() => router.push('/leads')}>
                        Back to Leads
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
                    onClick={() => router.push('/leads')} 
                />
                <Title level={3} style={{ margin: 0, fontWeight: 800 }}>Lead Details</Title>
            </Flex>

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
        </div>
    );
}
