'use client';

import { useState, useEffect } from 'react';
import { Button } from '@mui/material';
import { Add as AddIcon } from '@mui/icons-material';
import PageHeader from '@/components/shared/PageHeader';
import RoleTable from '@/components/roles/RoleTable';
import RoleForm from '@/components/roles/RoleForm';
import ConfirmDialog from '@/components/shared/ConfirmDialog';
import apiClient from '@/lib/apiClient';

export default function RolesPage() {
    const [roles, setRoles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [formOpen, setFormOpen] = useState(false);
    const [selectedRole, setSelectedRole] = useState<any>(null);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
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
        setSelectedRole(role);
        setDeleteDialogOpen(true);
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

    const confirmDelete = async () => {
        setActionLoading(true);
        try {
            await apiClient.delete(`/roles/${selectedRole._id}`);
            setDeleteDialogOpen(false);
            fetchRoles();
        } catch (error) {
            console.error('Failed to delete role:', error);
        } finally {
            setActionLoading(false);
        }
    };

    return (
        <>
            <PageHeader
                title="Role Management"
                subtitle="Define roles and set granular permissions for each module."
                action={
                    <Button
                        variant="contained"
                        startIcon={<AddIcon />}
                        onClick={handleAddRole}
                    >
                        Add Role
                    </Button>
                }
            />

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

            <ConfirmDialog
                open={deleteDialogOpen}
                title="Delete Role"
                message={`Are you sure you want to delete the "${selectedRole?.name}" role? This cannot be undone.`}
                onConfirm={confirmDelete}
                onCancel={() => setDeleteDialogOpen(false)}
                loading={actionLoading}
            />
        </>
    );
}
