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
    Spin 
} from 'antd';
import { 
    PlusOutlined, 
    AppstoreOutlined, 
    BarsOutlined, 
    SearchOutlined 
} from '@ant-design/icons';
import LeadTable from '@/components/leads/LeadTable';
import LeadKanban from '@/components/leads/LeadKanban';
import LeadDrawer from '@/components/leads/LeadDrawer';
import ConvertToClientDialog from '@/components/leads/ConvertToClientDialog';
import PageHeader from '@/components/shared/PageHeader';
import apiClient from '@/lib/apiClient';
import { useRouter } from 'next/navigation';

const { Text } = Typography;
const { Option } = Select;

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
        // We'll use window.confirm for now, or AntD Modal.confirm
        if (!window.confirm('Are you sure you want to delete this lead?')) return;
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
        <div>
            <Flex justify="space-between" align="flex-start" style={{ marginBottom: 32 }}>
                <PageHeader
                    title="Leads"
                    subtitle={`Manage your prospects and pipeline. Total ${stats.total} leads found.`}
                />
                <Button
                    type="primary"
                    size="large"
                    icon={<PlusOutlined />}
                    onClick={() => { setSelectedLead(null); setDrawerOpen(true); }}
                    style={{ borderRadius: 8, height: 45, fontWeight: 600 }}
                >
                    Add Lead
                </Button>
            </Flex>

            <Flex justify="space-between" align="center" style={{ marginBottom: 24 }} wrap="wrap" gap={16}>
                <Space size="middle">
                    <Input
                        placeholder="Search leads..."
                        prefix={<SearchOutlined style={{ color: '#bfbfbf' }} />}
                        value={filters.search}
                        onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                        style={{ width: 300, borderRadius: 8 }}
                        size="large"
                    />
                    <Select
                        placeholder="Filter by Status"
                        value={filters.status || undefined}
                        onChange={(val) => setFilters(prev => ({ ...prev, status: val || '' }))}
                        style={{ width: 160 }}
                        size="large"
                        allowClear
                    >
                        <Option value="new">New</Option>
                        <Option value="contacted">Contacted</Option>
                        <Option value="qualified">Qualified</Option>
                        <Option value="proposal_sent">Proposal Sent</Option>
                        <Option value="negotiation">Negotiation</Option>
                        <Option value="won">Won</Option>
                        <Option value="lost">Lost</Option>
                    </Select>
                </Space>

                <Radio.Group 
                    value={view} 
                    onChange={(e) => setView(e.target.value)} 
                    optionType="button"
                    buttonStyle="solid"
                    size="large"
                >
                    <Radio.Button value="kanban">
                        <Space><AppstoreOutlined /> Kanban</Space>
                    </Radio.Button>
                    <Radio.Button value="list">
                        <Space><BarsOutlined /> List</Space>
                    </Radio.Button>
                </Radio.Group>
            </Flex>

            {loading && leads.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '100px 0' }}>
                    <Spin size="large" description="Loading leads..." />
                </div>
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
        </div>
    );
}
