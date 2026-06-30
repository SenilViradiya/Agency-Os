'use client';

import { useState, useEffect, useCallback } from 'react';
import { 
    Button, 
    Input, 
    Select, 
    Radio, 
    Space, 
    Typography, 
    Flex, 
    Spin,
    Row,
    Col 
} from 'antd';
import { 
    PlusOutlined, 
    AppstoreOutlined, 
    BarsOutlined, 
    SearchOutlined 
} from '@ant-design/icons';
import ClientTable from '@/components/clients/ClientTable';
import ClientCard from '@/components/clients/ClientCard';
import ClientDrawer from '@/components/clients/ClientDrawer';
import PageHeader from '@/components/shared/PageHeader';
import apiClient from '@/lib/apiClient';
import { useRouter } from 'next/navigation';

const { Text } = Typography;
const { Option } = Select;

export default function ClientsPage() {
    const router = useRouter();
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
        if (!window.confirm('Are you sure you want to delete (deactivate) this client?')) return;
        try {
            const res = await apiClient.delete(`/clients/${id}`);
            if (res.data.success) {
                fetchClients();
            }
        } catch (error: any) {
            alert(error.response?.data?.error || 'Failed to delete client');
        }
    };

    return (
        <div>
            <Flex justify="space-between" align="flex-start" style={{ marginBottom: 32 }}>
                <PageHeader
                    title="Clients"
                    subtitle={`Manage your active partnerships. Total ${stats.total} clients.`}
                />
                <Space>
                    <Button
                        size="large"
                        onClick={() => router.push('/clients/portal-access')}
                        style={{ height: 45, borderRadius: 8 }}
                    >
                        Portal Access Manager
                    </Button>
                    <Button
                        type="primary"
                        size="large"
                        icon={<PlusOutlined />}
                        onClick={() => { setSelectedClient(null); setDrawerOpen(true); }}
                        style={{ height: 45, fontWeight: 600, borderRadius: 8 }}
                    >
                        Add Client
                    </Button>
                </Space>
            </Flex>

            <Flex justify="space-between" align="center" style={{ marginBottom: 24 }} wrap="wrap" gap={16}>
                <Space size="middle">
                    <Input
                        placeholder="Search clients..."
                        prefix={<SearchOutlined style={{ color: '#bfbfbf' }} />}
                        value={filters.search}
                        onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                        style={{ width: 300, borderRadius: 8 }}
                        size="large"
                    />
                    <Select
                        placeholder="All Tiers"
                        value={filters.tier || undefined}
                        onChange={(val) => setFilters(prev => ({ ...prev, tier: val || '' }))}
                        style={{ width: 160 }}
                        size="large"
                        allowClear
                    >
                        <Option value="standard">Standard</Option>
                        <Option value="premium">Premium</Option>
                        <Option value="enterprise">Enterprise</Option>
                    </Select>
                </Space>

                <Radio.Group 
                    value={view} 
                    onChange={(e) => setView(e.target.value)} 
                    optionType="button"
                    buttonStyle="solid"
                    size="large"
                >
                    <Radio.Button value="grid">
                        <Space><AppstoreOutlined /> Grid</Space>
                    </Radio.Button>
                    <Radio.Button value="table">
                        <Space><BarsOutlined /> Table</Space>
                    </Radio.Button>
                </Radio.Group>
            </Flex>

            {loading && clients.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '100px 0' }}>
                    <Spin size="large" description="Loading clients..." />
                </div>
            ) : (
                view === 'grid' ? (
                    <Row gutter={[24, 24]}>
                        {clients.map((client) => (
                            <Col xs={24} sm={12} md={8} xl={6} key={client._id}>
                                <ClientCard client={client} />
                            </Col>
                        ))}
                    </Row>
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
        </div>
    );
}
