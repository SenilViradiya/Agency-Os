'use client';

import {
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
    Chip,
    IconButton,
    Tooltip,
} from '@mui/material';
import { Edit as EditIcon, Delete as DeleteIcon, Lock as LockIcon } from '@mui/icons-material';

interface RoleTableProps {
    roles: any[];
    onEdit: (role: any) => void;
    onDelete: (role: any) => void;
}

export default function RoleTable({ roles, onEdit, onDelete }: RoleTableProps) {
    return (
        <TableContainer component={Paper}>
            <Table>
                <TableHead>
                    <TableRow>
                        <TableCell>Role Name</TableCell>
                        <TableCell>Slug</TableCell>
                        <TableCell>Permissions Count</TableCell>
                        <TableCell>Type</TableCell>
                        <TableCell align="right">Actions</TableCell>
                    </TableRow>
                </TableHead>
                <TableBody>
                    {roles.map((role) => (
                        <TableRow key={role._id} hover>
                            <TableCell sx={{ fontWeight: 600 }}>{role.name}</TableCell>
                            <TableCell><code>{role.slug}</code></TableCell>
                            <TableCell>
                                {role.permissions.reduce((acc: number, p: any) => acc + p.actions.length, 0)} actions
                            </TableCell>
                            <TableCell>
                                {role.isSystem ? (
                                    <Chip label="System" size="small" icon={<LockIcon sx={{ fontSize: '14px !important' }} />} />
                                ) : (
                                    <Chip label="Custom" variant="outlined" size="small" />
                                )}
                            </TableCell>
                            <TableCell align="right">
                                <Tooltip title="Edit Permissions">
                                    <IconButton onClick={() => onEdit(role)} size="small" color="primary">
                                        <EditIcon fontSize="small" />
                                    </IconButton>
                                </Tooltip>
                                {!role.isSystem && (
                                    <Tooltip title="Delete">
                                        <IconButton onClick={() => onDelete(role)} size="small" color="error">
                                            <DeleteIcon fontSize="small" />
                                        </IconButton>
                                    </Tooltip>
                                )}
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </TableContainer>
    );
}
