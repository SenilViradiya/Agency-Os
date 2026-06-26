'use client';

import { useState, useEffect } from 'react';
import { Button, Box, TextField, InputAdornment, MenuItem } from '@mui/material';
import { Add as AddIcon, Search as SearchIcon } from '@mui/icons-material';
import PageHeader from '@/components/shared/PageHeader';
import UserTable from '@/components/users/UserTable';
import UserDrawer from '@/components/users/UserDrawer';
import ConfirmDialog from '@/components/shared/ConfirmDialog';
import apiClient from '@/lib/apiClient';

export default function UsersPage() {
    const [users, setUsers] = useState([]);
    const [roles, setRoles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [drawerOpen, setDrawerOpen] = useState(false);
    const [selectedUser, setSelectedUser] = useState<any>(null);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
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

    const handleSearchKeyPress = (e: any) => {
        if (e.key === 'Enter') {
            fetchUsers();
        }
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
        setSelectedUser(user);
        setDeleteDialogOpen(true);
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

    const confirmDelete = async () => {
        setActionLoading(true);
        try {
            await apiClient.delete(`/users/${selectedUser._id}`);
            setDeleteDialogOpen(false);
            fetchUsers();
        } catch (error) {
            console.error('Failed to delete user:', error);
        } finally {
            setActionLoading(false);
        }
    };

    return (
        <>
            <PageHeader
                title="Users Management"
                subtitle="Manage agency members, their roles and access levels."
                action={
                    <Button
                        variant="contained"
                        startIcon={<AddIcon />}
                        onClick={handleAddUser}
                    >
                        Add User
                    </Button>
                }
            />

            <Box sx={{ mb: 4, display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                <TextField
                    placeholder="Search name or email..."
                    size="small"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    onKeyDown={handleSearchKeyPress}
                    sx={{ flexGrow: 1, maxWidth: 400 }}
                    slotProps={{
                        input: {
                            startAdornment: (
                                <InputAdornment position="start">
                                    <SearchIcon fontSize="small" />
                                </InputAdornment>
                            ),
                        }
                    }}
                />
                <TextField
                    select
                    label="Role"
                    size="small"
                    value={roleFilter}
                    onChange={(e) => setRoleFilter(e.target.value)}
                    sx={{ minWidth: 150 }}
                >
                    <MenuItem value="">All Roles</MenuItem>
                    {roles.map((role: any) => (
                        <MenuItem key={role._id} value={role._id}>{role.name}</MenuItem>
                    ))}
                </TextField>
                <TextField
                    select
                    label="Status"
                    size="small"
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    sx={{ minWidth: 150 }}
                >
                    <MenuItem value="">All Status</MenuItem>
                    <MenuItem value="active">Active</MenuItem>
                    <MenuItem value="inactive">Inactive</MenuItem>
                    <MenuItem value="suspended">Suspended</MenuItem>
                </TextField>
                <Button variant="outlined" onClick={fetchUsers}>Apply</Button>
            </Box>

            <UserTable
                users={users}
                loading={loading}
                onEdit={handleEditUser}
                onDelete={handleDeleteClick}
                onDeactivate={handleDeleteClick} // Same for now: soft delete/inactive
            />

            <UserDrawer
                open={drawerOpen}
                onClose={() => setDrawerOpen(false)}
                initialData={selectedUser}
                roles={roles}
                onSubmit={handleFormSubmit}
                loading={actionLoading}
            />

            <ConfirmDialog
                open={deleteDialogOpen}
                title="Confirm Deactivation"
                message={`Are you sure you want to deactivate ${selectedUser?.name}? They will no longer be able to log in.`}
                onConfirm={confirmDelete}
                onCancel={() => setDeleteDialogOpen(false)}
                loading={actionLoading}
            />
        </>
    );
}
