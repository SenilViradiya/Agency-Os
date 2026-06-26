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
    Tooltip,
} from '@mui/material';
import {
    Visibility as ViewIcon,
    Edit as EditIcon,
    Delete as DeleteIcon,
    PersonAdd as ConvertIcon,
} from '@mui/icons-material';
import StatusChip from '@/components/shared/StatusChip';
import PriorityChip from '@/components/shared/PriorityChip';
import dayjs from 'dayjs';
import { useRouter } from 'next/navigation';

interface LeadTableProps {
    leads: any[];
    onEdit: (lead: any) => void;
    onDelete: (id: string) => void;
    onConvert: (lead: any) => void;
}

export default function LeadTable({ leads, onEdit, onDelete, onConvert }: LeadTableProps) {
    const router = useRouter();

    return (
        <TableContainer component={Paper} sx={{ borderRadius: 2, boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}>
            <Table>
                <TableHead sx={{ bgcolor: 'grey.50' }}>
                    <TableRow>
                        <TableCell sx={{ fontWeight: 700 }}>Lead#</TableCell>
                        <TableCell sx={{ fontWeight: 700 }}>Business Name</TableCell>
                        <TableCell sx={{ fontWeight: 700 }}>Contact</TableCell>
                        <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
                        <TableCell sx={{ fontWeight: 700 }}>Priority</TableCell>
                        <TableCell sx={{ fontWeight: 700 }}>Budget</TableCell>
                        <TableCell sx={{ fontWeight: 700 }}>Follow-up</TableCell>
                        <TableCell sx={{ fontWeight: 700 }}>Assigned</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 700 }}>Actions</TableCell>
                    </TableRow>
                </TableHead>
                <TableBody>
                    {leads.map((lead) => (
                        <TableRow key={lead._id} hover>
                            <TableCell>
                                <Typography variant="body2" sx={{ fontWeight: 600, color: 'text.secondary' }}>
                                    {lead.leadNumber}
                                </Typography>
                            </TableCell>
                            <TableCell>
                                <Typography variant="body2" sx={{ fontWeight: 700 }}>
                                    {lead.businessName}
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                    {lead.industry}
                                </Typography>
                            </TableCell>
                            <TableCell>
                                <Typography variant="body2">{lead.name}</Typography>
                                <Typography variant="caption" color="text.secondary">{lead.email}</Typography>
                            </TableCell>
                            <TableCell>
                                <StatusChip status={lead.status} />
                            </TableCell>
                            <TableCell>
                                <PriorityChip priority={lead.priority} />
                            </TableCell>
                            <TableCell>
                                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                    ₹{lead.budget?.toLocaleString('en-IN')}
                                </Typography>
                            </TableCell>
                            <TableCell>
                                <Typography variant="body2" color={dayjs(lead.followUpDate).isBefore(dayjs()) ? 'error.main' : 'inherit'}>
                                    {lead.followUpDate ? dayjs(lead.followUpDate).format('DD MMM YYYY') : '-'}
                                </Typography>
                            </TableCell>
                            <TableCell>
                                <Tooltip title={lead.assignedTo?.name}>
                                    <Avatar
                                        src={lead.assignedTo?.avatar}
                                        sx={{ width: 32, height: 32 }}
                                    >
                                        {lead.assignedTo?.name?.charAt(0)}
                                    </Avatar>
                                </Tooltip>
                            </TableCell>
                            <TableCell align="right">
                                <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 0.5 }}>
                                    <IconButton size="small" onClick={() => router.push(`/leads/${lead._id}`)}>
                                        <ViewIcon fontSize="small" />
                                    </IconButton>
                                    <IconButton size="small" color="primary" onClick={() => onEdit(lead)}>
                                        <EditIcon fontSize="small" />
                                    </IconButton>
                                    {lead.status === 'won' && !lead.convertedToClient && (
                                        <IconButton size="small" color="success" onClick={() => onConvert(lead)}>
                                            <ConvertIcon fontSize="small" />
                                        </IconButton>
                                    )}
                                    <IconButton size="small" color="error" onClick={() => onDelete(lead._id)} disabled={lead.convertedToClient}>
                                        <DeleteIcon fontSize="small" />
                                    </IconButton>
                                </Box>
                            </TableCell>
                        </TableRow>
                    ))}
                    {leads.length === 0 && (
                        <TableRow>
                            <TableCell colSpan={9} align="center" sx={{ py: 8 }}>
                                <Typography color="text.secondary">No leads found.</Typography>
                            </TableCell>
                        </TableRow>
                    )}
                </TableBody>
            </Table>
        </TableContainer>
    );
}
