'use client';

import { useState, useEffect } from 'react';
import { Button, Flex, Modal } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import PageHeader from '@/components/shared/PageHeader';
import RoleTable from '@/components/roles/RoleTable';
import RoleForm from '@/components/roles/RoleForm';
import apiClient from '@/lib/apiClient';

export default function RolesPage() {
    const [roles, setRoles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [formOpen, setFormOpen] = useState(false);
    const [selectedRole, setSelectedRole] = useState<any>(null);
    const [actionLoading, setActionLoading] = useState(false);

    const fetchRoles = async () => {
        setLoading(true);
        try {
            const res = await apiClient.get('/roles');
            setRoles(res.data.data);
        } catch (error) {
            console.error('Failed to fetch roles:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchRoles();
    }, []);

    const handleAddRole = () => {
        setSelectedRole(null);
        setFormOpen(true);
    };

    const handleEditRole = (role: any) => {
        setSelectedRole(role);
        setFormOpen(true);
    };

    const handleDeleteClick = (role: any) => {
        Modal.confirm({
            title: 'Delete Role',
            content: `Are you sure you want to delete the "${role.name}" role? This cannot be undone.`,
            okText: 'Delete',
            okType: 'danger',
            cancelText: 'Cancel',
            onOk: async () => {
                try {
                    await apiClient.delete(`/roles/${role._id}`);
                    fetchRoles();
                } catch (error) {
                    console.error('Failed to delete role:', error);
                }
            }
        });
    };

    const handleFormSubmit = async (data: any) => {
        setActionLoading(true);
        try {
            if (selectedRole) {
                await apiClient.put(`/roles/${selectedRole._id}`, data);
            } else {
                await apiClient.post('/roles', data);
            }
            setFormOpen(false);
            fetchRoles();
        } catch (error) {
            console.error('Failed to save role:', error);
        } finally {
            setActionLoading(false);
        }
    };

    return (
        <div>
            <Flex justify="space-between" align="flex-start" style={{ marginBottom: 32 }}>
                <PageHeader
                    title="Role Management"
                    subtitle="Define roles and set granular permissions for each module."
                />
                <Button
                    type="primary"
                    size="large"
                    icon={<PlusOutlined />}
                    onClick={handleAddRole}
                    style={{ height: 45, fontWeight: 600, borderRadius: 8 }}
                >
                    Add Role
                </Button>
            </Flex>

            <RoleTable
                roles={roles}
                onEdit={handleEditRole}
                onDelete={handleDeleteClick}
            />

            <RoleForm
                open={formOpen}
                onClose={() => setFormOpen(false)}
                initialData={selectedRole}
                onSubmit={handleFormSubmit}
                loading={actionLoading}
            />
        </div>
    );
}
