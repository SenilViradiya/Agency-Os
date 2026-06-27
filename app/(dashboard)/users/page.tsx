'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
    Button, 
    Input, 
    Select, 
    Space, 
    Typography, 
    Flex, 
    Modal 
} from 'antd';
import { 
    PlusOutlined, 
    SearchOutlined 
} from '@ant-design/icons';
import PageHeader from '@/components/shared/PageHeader';
import UserTable from '@/components/users/UserTable';
import UserDrawer from '@/components/users/UserDrawer';
import apiClient from '@/lib/apiClient';

const { Text } = Typography;
const { Option } = Select;

export default function UsersPage() {
    const router = useRouter();
    const [users, setUsers] = useState([]);
    const [roles, setRoles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [drawerOpen, setDrawerOpen] = useState(false);
    const [selectedUser, setSelectedUser] = useState<any>(null);
    const [actionLoading, setActionLoading] = useState(false);

    // Filters
    const [search, setSearch] = useState('');
    const [roleFilter, setRoleFilter] = useState('');
    const [statusFilter, setStatusFilter] = useState('');

    const fetchUsers = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            if (search) params.append('search', search);
            if (roleFilter) params.append('role', roleFilter);
            if (statusFilter) params.append('status', statusFilter);

            const res = await apiClient.get(`/users?${params.toString()}`);
            setUsers(res.data.data);
        } catch (error) {
            console.error('Failed to fetch users:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchRoles = async () => {
        try {
            const res = await apiClient.get('/roles');
            setRoles(res.data.data);
        } catch (error) {
            console.error('Failed to fetch roles:', error);
        }
    };

    useEffect(() => {
        fetchUsers();
        fetchRoles();
    }, [roleFilter, statusFilter]);

    const handleSearch = () => {
        fetchUsers();
    };

    const handleAddUser = () => {
        setSelectedUser(null);
        setDrawerOpen(true);
    };

    const handleEditUser = (user: any) => {
        setSelectedUser(user);
        setDrawerOpen(true);
    };

    const handleDeleteClick = (user: any) => {
        Modal.confirm({
            title: 'Confirm Deactivation',
            content: `Are you sure you want to deactivate ${user.name}? They will no longer be able to log in.`,
            okText: 'Deactivate',
            okType: 'danger',
            cancelText: 'Cancel',
            onOk: async () => {
                try {
                    await apiClient.delete(`/users/${user._id}`);
                    fetchUsers();
                } catch (error) {
                    console.error('Failed to delete user:', error);
                }
            }
        });
    };

    const handleFormSubmit = async (data: any) => {
        setActionLoading(true);
        try {
            if (selectedUser) {
                await apiClient.put(`/users/${selectedUser._id}`, data);
            } else {
                await apiClient.post('/users', data);
            }
            setDrawerOpen(false);
            fetchUsers();
        } catch (error) {
            console.error('Failed to save user:', error);
        } finally {
            setActionLoading(false);
        }
    };

    return (
        <div>
            <Flex justify="space-between" align="flex-start" style={{ marginBottom: 32 }}>
                <PageHeader
                    title="Users Management"
                    subtitle="Manage agency members, their roles and access levels."
                />
                <Button
                    type="primary"
                    size="large"
                    icon={<PlusOutlined />}
                    onClick={handleAddUser}
                    style={{ height: 45, fontWeight: 600, borderRadius: 8 }}
                >
                    Add User
                </Button>
            </Flex>

            <Flex justify="space-between" align="center" style={{ marginBottom: 24 }} wrap="wrap" gap={16}>
                <Space size="middle">
                    <Input
                        placeholder="Search name or email..."
                        prefix={<SearchOutlined style={{ color: '#bfbfbf' }} />}
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        onPressEnter={handleSearch}
                        style={{ width: 300, borderRadius: 8 }}
                        size="large"
                    />
                    <Select
                        placeholder="Filter by Role"
                        value={roleFilter || undefined}
                        onChange={(val) => setRoleFilter(val || '')}
                        style={{ width: 160 }}
                        size="large"
                        allowClear
                    >
                        {roles.map((role: any) => (
                            <Option key={role._id} value={role._id}>{role.name}</Option>
                        ))}
                    </Select>
                    <Select
                        placeholder="Status"
                        value={statusFilter || undefined}
                        onChange={(val) => setStatusFilter(val || '')}
                        style={{ width: 140 }}
                        size="large"
                        allowClear
                    >
                        <Option value="active">Active</Option>
                        <Option value="inactive">Inactive</Option>
                        <Option value="suspended">Suspended</Option>
                    </Select>
                </Space>
                <Button size="large" onClick={fetchUsers}>Apply Filters</Button>
            </Flex>

            <UserTable
                users={users}
                loading={loading}
                onEdit={handleEditUser}
                onDelete={handleDeleteClick}
                onDeactivate={handleDeleteClick}
            />

            <UserDrawer
                open={drawerOpen}
                onClose={() => setDrawerOpen(false)}
                initialData={selectedUser}
                roles={roles}
                onSubmit={handleFormSubmit}
                loading={actionLoading}
            />
        </div>
    );
}
