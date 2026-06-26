'use client';

import { Card, CardContent, Typography, Box, Chip, Avatar, Button, Divider, IconButton, Tooltip } from '@mui/material';
import {
    Visibility as ViewIcon,
    Stars as TierIcon,
    AssignmentOutlined as ProjectIcon,
    CalendarMonth as CalendarIcon
} from '@mui/icons-material';
import StatusChip from '@/components/shared/StatusChip';
import dayjs from 'dayjs';
import { useRouter } from 'next/navigation';

interface ClientCardProps {
    client: any;
}

const getTierColor = (tier: string) => {
    switch (tier) {
        case 'enterprise': return { color: '#FFD700', bg: '#FFF9C4', label: 'Gold' };
        case 'premium': return { color: '#9C27B0', bg: '#F3E5F5', label: 'Purple' };
        default: return { color: '#757575', bg: '#F5F5F5', label: 'Standard' };
    }
};

export default function ClientCard({ client }: ClientCardProps) {
    const router = useRouter();
    const tierStyle = getTierColor(client.tier);
    const contractEnd = client.contractEndDate ? dayjs(client.contractEndDate) : null;
    const isExpiringSoon = contractEnd && contractEnd.diff(dayjs(), 'days') <= 30;

    return (
        <Card sx={{
            borderRadius: 3,
            boxShadow: '0 4px 15px rgba(0,0,0,0.05)',
            border: '1px solid',
            borderColor: 'grey.100',
            transition: 'transform 0.2s, box-shadow 0.2s',
            '&:hover': {
                transform: 'translateY(-4px)',
                boxShadow: '0 8px 25px rgba(0,0,0,0.1)',
            }
        }}>
            <CardContent sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Avatar
                            src={client.logo}
                            sx={{ width: 48, height: 48, borderRadius: 2, bgcolor: 'primary.light' }}
                            variant="rounded"
                        >
                            {client.businessName.charAt(0)}
                        </Avatar>
                        <Box>
                            <Typography variant="subtitle1" sx={{ fontWeight: 800, lineHeight: 1.2 }}>
                                {client.businessName}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                                {client.contactPerson}
                            </Typography>
                        </Box>
                    </Box>
                    <StatusChip status={client.status} />
                </Box>

                <Box sx={{ display: 'flex', gap: 1, mb: 2.5 }}>
                    <Chip
                        icon={<TierIcon sx={{ fontSize: '1rem !important', color: tierStyle.color }} />}
                        label={client.tier}
                        size="small"
                        sx={{
                            textTransform: 'capitalize',
                            fontWeight: 700,
                            bgcolor: tierStyle.bg,
                            color: tierStyle.color,
                            height: 24
                        }}
                    />
                    <Chip
                        icon={<ProjectIcon sx={{ fontSize: '1rem !important' }} />}
                        label={`${client.activeProjectsCount || 0} Active`}
                        size="small"
                        color="primary"
                        variant="outlined"
                        sx={{ fontWeight: 700, height: 24 }}
                    />
                </Box>

                <Divider sx={{ mb: 2, opacity: 0.6 }} />

                <Grid container spacing={2} sx={{ mb: 2 }}>
                    <Grid item xs={6}>
                        <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, display: 'block' }}>RETAINER</Typography>
                        <Typography variant="body2" sx={{ fontWeight: 800 }}>₹{client.monthlyRetainerValue?.toLocaleString('en-IN')}</Typography>
                    </Grid>
                    <Grid item xs={6}>
                        <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, display: 'block' }}>EXPIRY</Typography>
                        <Typography variant="body2" sx={{ fontWeight: 800, color: isExpiringSoon ? 'error.main' : 'text.primary' }}>
                            {contractEnd ? contractEnd.format('DD MMM, YYYY') : 'Lifetime'}
                        </Typography>
                    </Grid>
                </Grid>

                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mt: 'auto' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Tooltip title={`Manager: ${client.assignedManager?.name}`}>
                            <Avatar
                                src={client.assignedManager?.avatar}
                                sx={{ width: 24, height: 24 }}
                            >
                                {client.assignedManager?.name?.charAt(0)}
                            </Avatar>
                        </Tooltip>
                        <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                            {client.assignedManager?.name?.split(' ')[0]}
                        </Typography>
                    </Box>
                    <Button
                        size="small"
                        variant="soft"
                        startIcon={<ViewIcon />}
                        onClick={() => router.push(`/clients/${client._id}`)}
                    >
                        View
                    </Button>
                </Box>
            </CardContent>
        </Card>
    );
}

import { Grid } from '@mui/material';
