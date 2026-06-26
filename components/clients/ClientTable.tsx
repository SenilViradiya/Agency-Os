'use client';

import {
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
    IconButton,
    Typography,
    Box,
    Avatar,
    Chip,
} from '@mui/material';
import {
    Visibility as ViewIcon,
    Edit as EditIcon,
    Delete as DeleteIcon,
} from '@mui/icons-material';
import StatusChip from '@/components/shared/StatusChip';
import dayjs from 'dayjs';
import { useRouter } from 'next/navigation';

interface ClientTableProps {
    clients: any[];
    onEdit: (client: any) => void;
    onDelete: (id: string) => void;
}

export default function ClientTable({ clients, onEdit, onDelete }: ClientTableProps) {
    const router = useRouter();

    return (
        <TableContainer component={Paper} sx={{ borderRadius: 3, boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}>
            <Table>
                <TableHead sx={{ bgcolor: 'grey.50' }}>
                    <TableRow>
                        <TableCell sx={{ fontWeight: 700 }}>Client</TableCell>
                        <TableCell sx={{ fontWeight: 700 }}>Contact</TableCell>
                        <TableCell sx={{ fontWeight: 700 }}>Tier</TableCell>
                        <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
                        <TableCell sx={{ fontWeight: 700 }}>Services</TableCell>
                        <TableCell sx={{ fontWeight: 700 }}>Retainer</TableCell>
                        <TableCell sx={{ fontWeight: 700 }}>Manager</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 700 }}>Actions</TableCell>
                    </TableRow>
                </TableHead>
                <TableBody>
                    {clients.map((client) => (
                        <TableRow key={client._id} hover>
                            <TableCell>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                    <Avatar src={client.logo} variant="rounded" sx={{ width: 36, height: 36 }}>
                                        {client.businessName.charAt(0)}
                                    </Avatar>
                                    <Box>
                                        <Typography variant="body2" sx={{ fontWeight: 700 }}>{client.businessName}</Typography>
                                        <Typography variant="caption" color="text.secondary">{client.clientNumber}</Typography>
                                    </Box>
                                </Box>
                            </TableCell>
                            <TableCell>
                                <Typography variant="body2">{client.contactPerson}</Typography>
                                <Typography variant="caption" color="text.secondary">{client.email}</Typography>
                            </TableCell>
                            <TableCell>
                                <Chip
                                    label={client.tier}
                                    size="small"
                                    sx={{
                                        textTransform: 'capitalize',
                                        fontWeight: 700,
                                        bgcolor: client.tier === 'enterprise' ? 'warning.light' : client.tier === 'premium' ? 'secondary.light' : 'grey.200'
                                    }}
                                />
                            </TableCell>
                            <TableCell>
                                <StatusChip status={client.status} />
                            </TableCell>
                            <TableCell>
                                <Typography variant="caption">{client.services?.length || 0} services</Typography>
                            </TableCell>
                            <TableCell>
                                <Typography variant="body2" sx={{ fontWeight: 700 }}>₹{client.monthlyRetainerValue?.toLocaleString('en-IN')}</Typography>
                            </TableCell>
                            <TableCell>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <Avatar src={client.assignedManager?.avatar} sx={{ width: 24, height: 24 }}>
                                        {client.assignedManager?.name?.charAt(0)}
                                    </Avatar>
                                    <Typography variant="caption">{client.assignedManager?.name}</Typography>
                                </Box>
                            </TableCell>
                            <TableCell align="right">
                                <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 0.5 }}>
                                    <IconButton size="small" onClick={() => router.push(`/clients/${client._id}`)}>
                                        <ViewIcon fontSize="small" />
                                    </IconButton>
                                    <IconButton size="small" color="primary" onClick={() => onEdit(client)}>
                                        <EditIcon fontSize="small" />
                                    </IconButton>
                                    <IconButton size="small" color="error" onClick={() => onDelete(client._id)}>
                                        <DeleteIcon fontSize="small" />
                                    </IconButton>
                                </Box>
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </TableContainer>
    );
}
