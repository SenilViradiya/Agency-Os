'use client';

import {
    Drawer,
    Box,
    Typography,
    IconButton,
    Divider,
} from '@mui/material';
import { Close as CloseIcon } from '@mui/icons-material';
import UserForm from './UserForm';

interface UserDrawerProps {
    open: boolean;
    onClose: () => void;
    initialData?: any;
    roles: any[];
    onSubmit: (data: any) => void;
    loading: boolean;
}

export default function UserDrawer({
    open,
    onClose,
    initialData,
    roles,
    onSubmit,
    loading,
}: UserDrawerProps) {
    return (
        <Drawer
            anchor="right"
            open={open}
            onClose={onClose}
            slotProps={{
                paper: {
                    sx: { width: { xs: '100%', sm: 500 } }
                }
            }}
        >
            <Box sx={{ p: 3, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Typography variant="h6" sx={{ fontWeight: 700 }}>
                    {initialData ? 'Edit User' : 'Add New User'}
                </Typography>
                <IconButton onClick={onClose} size="small">
                    <CloseIcon />
                </IconButton>
            </Box>
            <Divider />
            <Box sx={{ p: 3 }}>
                <UserForm
                    initialData={initialData}
                    roles={roles}
                    onSubmit={onSubmit}
                    loading={loading}
                    isEdit={!!initialData}
                />
            </Box>
        </Drawer>
    );
}
