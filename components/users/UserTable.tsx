'use client';

import {
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
    Avatar,
    Box,
    Typography,
    IconButton,
    Tooltip,
    Skeleton
} from '@mui/material';
import { Edit as EditIcon, Delete as DeleteIcon, Block as BlockIcon } from '@mui/icons-material';
import StatusChip from '@/components/shared/StatusChip';

interface UserTableProps {
    users: any[];
    loading: boolean;
    onEdit: (user: any) => void;
    onDelete: (user: any) => void;
    onDeactivate: (user: any) => void;
}

export default function UserTable({ users, loading, onEdit, onDelete, onDeactivate }: UserTableProps) {
    if (loading) {
        return (
            <TableContainer component={Paper}>
                <Table>
                    <TableHead>
                        <TableRow>
                            <TableCell>User</TableCell>
                            <TableCell>Email</TableCell>
                            <TableCell>Role</TableCell>
                            <TableCell>Department</TableCell>
                            <TableCell>Status</TableCell>
                            <TableCell align="right">Actions</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {[...Array(5)].map((_, index) => (
                            <TableRow key={index}>
                                <TableCell>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                        <Skeleton variant="circular" width={40} height={40} />
                                        <Skeleton width={100} />
                                    </Box>
                                </TableCell>
                                <TableCell><Skeleton width={150} /></TableCell>
                                <TableCell><Skeleton width={80} /></TableCell>
                                <TableCell><Skeleton width={100} /></TableCell>
                                <TableCell><Skeleton width={60} /></TableCell>
                                <TableCell align="right"><Skeleton width={100} /></TableCell>
                            </TableRow>
                        ))}StatusChip
                    </TableBody>
                </Table>
            </TableContainer>
        );
    }

    return (
        <TableContainer component={Paper}>
            <Table>
                <TableHead>
                    <TableRow>
                        <TableCell>User</TableCell>
                        <TableCell>Email</TableCell>
                        <TableCell>Role</TableCell>
                        <TableCell>Department</TableCell>
                        <TableCell>Status</TableCell>
                        <TableCell align="right">Actions</TableCell>
                    </TableRow>
                </TableHead>
                <TableBody>
                    {users.map((user) => (
                        <TableRow key={user._id} hover>
                            <TableCell>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                    <Avatar src={user.avatar} sx={{ bgcolor: 'secondary.main' }}>
                                        {user.name.charAt(0)}
                                    </Avatar>
                                    <Box>
                                        <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                                            {user.name}
                                        </Typography>
                                        <Typography variant="caption" color="text.secondary">
                                            {user.designation}
                                        </Typography>
                                    </Box>
                                </Box>
                            </TableCell>
                            <TableCell>{user.email}</TableCell>
                            <TableCell>
                                <Typography variant="body2">{user.role?.name || 'N/A'}</Typography>
                            </TableCell>
                            <TableCell>{user.department}</TableCell>
                            <TableCell>
                                <StatusChip status={user.status} />
                            </TableCell>
                            <TableCell align="right">
                                <Tooltip title="Edit">
                                    <IconButton onClick={() => onEdit(user)} size="small" color="primary">
                                        <EditIcon fontSize="small" />
                                    </IconButton>
                                </Tooltip>
                                <Tooltip title="Deactivate">
                                    <IconButton
                                        onClick={() => onDeactivate(user)}
                                        size="small"
                                        color="warning"
                                        disabled={user.status === 'inactive'}
                                    >
                                        <BlockIcon fontSize="small" />
                                    </IconButton>
                                </Tooltip>
                                <Tooltip title="Delete">
                                    <IconButton onClick={() => onDelete(user)} size="small" color="error">
                                        <DeleteIcon fontSize="small" />
                                    </IconButton>
                                </Tooltip>
                            </TableCell>
                        </TableRow>
                    ))}
                    {users.length === 0 && (
                        <TableRow>
                            <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                                <Typography color="text.secondary">No users found.</Typography>
                            </TableCell>
                        </TableRow>
                    )}
                </TableBody>
            </Table>
        </TableContainer>
    );
}
