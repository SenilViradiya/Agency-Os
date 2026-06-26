'use client';

import { useState } from 'react';
import {
    Box,
    Grid,
    Paper,
    Typography,
    Tabs,
    Tab,
    Stack,
    Divider,
    Button,
    Card,
    CardContent,
    Avatar,
    IconButton,
    Chip,
    List,
    ListItem,
    ListItemText,
    ListItemIcon,
} from '@mui/material';
import {
    Business as BusinessIcon,
    Email as EmailIcon,
    Phone as PhoneIcon,
    Language as WebIcon,
    Instagram as InstagramIcon,
    YouTube as YouTubeIcon,
    LinkedIn as LinkedInIcon,
    Twitter as TwitterIcon,
    AssignmentOutlined as ProjectIcon,
    Payments as RevenueIcon,
    CalendarMonth as DateIcon,
    Edit as EditIcon,
} from '@mui/icons-material';
import StatusChip from '@/components/shared/StatusChip';
import dayjs from 'dayjs';
import { useRouter } from 'next/navigation';

interface ClientDetailViewProps {
    client: any;
    onEdit: () => void;
}

export default function ClientDetailView({ client, onEdit }: ClientDetailViewProps) {
    const [tab, setTab] = useState(0);
    const router = useRouter();

    const contractEnd = client.contractEndDate ? dayjs(client.contractEndDate) : null;
    const daysRemaining = contractEnd ? contractEnd.diff(dayjs(), 'days') : Infinity;

    const getRemainingDaysColor = () => {
        if (daysRemaining > 90) return 'success.main';
        if (daysRemaining > 30) return 'warning.main';
        return 'error.main';
    };

    return (
        <Box>
            {/* Header Section */}
            <Paper sx={{ p: 3, mb: 4, borderRadius: 3, border: '1px solid', borderColor: 'grey.100' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                        <Avatar src={client.logo} variant="rounded" sx={{ width: 80, height: 80, borderRadius: 3, bgcolor: 'primary.light' }}>
                            {client.businessName.charAt(0)}
                        </Avatar>
                        <Box>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 0.5 }}>
                                <Typography variant="h4" sx={{ fontWeight: 800 }}>{client.businessName}</Typography>
                                <Chip
                                    label={client.tier}
                                    size="small"
                                    sx={{
                                        textTransform: 'capitalize',
                                        fontWeight: 800,
                                        bgcolor: client.tier === 'enterprise' ? 'warning.light' : client.tier === 'premium' ? 'secondary.light' : 'grey.200'
                                    }}
                                />
                            </Box>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                <StatusChip status={client.status} />
                                <Typography variant="body2" color="text.secondary">{client.clientNumber} • Part since {dayjs(client.createdAt).format('MMM YYYY')}</Typography>
                            </Box>
                        </Box>
                    </Box>
                    <Button variant="outlined" startIcon={<EditIcon />} onClick={onEdit}>Edit Client</Button>
                </Box>

                <Grid container spacing={2}>
                    <Grid item xs={12} sm={6} md={3}>
                        <StatCard label="Active Projects" value={client.projects?.filter((p: any) => p.status === 'active').length || 0} icon={<ProjectIcon color="primary" />} />
                    </Grid>
                    <Grid item xs={12} sm={6} md={3}>
                        <StatCard label="Total Revenue" value={`₹${client.totalRevenue?.toLocaleString('en-IN')}`} icon={<RevenueIcon color="success" />} />
                    </Grid>
                    <Grid item xs={12} sm={6} md={3}>
                        <StatCard label="Monthly Retainer" value={`₹${client.monthlyRetainerValue?.toLocaleString('en-IN')}`} icon={<RevenueIcon color="info" />} />
                    </Grid>
                    <Grid item xs={12} sm={6} md={3}>
                        <StatCard
                            label="Contract Remaining"
                            value={daysRemaining === Infinity ? 'Lifetime' : `${daysRemaining} Days`}
                            icon={<DateIcon sx={{ color: getRemainingDaysColor() }} />}
                            color={getRemainingDaysColor()}
                        />
                    </Grid>
                </Grid>
            </Paper>

            <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mb: 3, borderBottom: 1, borderColor: 'divider' }}>
                <Tab label="Overview" />
                <Tab label="Projects" />
                <Tab label="Activity" />
            </Tabs>

            {tab === 0 && (
                <Grid container spacing={3}>
                    <Grid item xs={12} md={7}>
                        <Paper sx={{ p: 3, borderRadius: 3 }}>
                            <Typography variant="subtitle1" sx={{ fontWeight: 800, mb: 3 }}>General Information</Typography>
                            <Grid container spacing={4}>
                                <Grid item xs={12} sm={6}>
                                    <Stack spacing={3}>
                                        <InfoItem label="Contact Person" value={client.contactPerson} />
                                        <InfoItem label="Email" value={client.email} />
                                        <InfoItem label="Phone" value={client.phone} />
                                        <InfoItem label="WhatsApp" value={client.whatsappNumber || '-'} />
                                    </Stack>
                                </Grid>
                                <Grid item xs={12} sm={6}>
                                    <Stack spacing={3}>
                                        <InfoItem label="Industry" value={client.industry || '-'} />
                                        <InfoItem label="Website" value={client.website || '-'} isLink />
                                        <InfoItem label="Contract Start" value={client.contractStartDate ? dayjs(client.contractStartDate).format('DD MMM YYYY') : '-'} />
                                        <InfoItem label="Contract End" value={client.contractEndDate ? dayjs(client.contractEndDate).format('DD MMM YYYY') : '-'} />
                                    </Stack>
                                </Grid>
                            </Grid>
                            <Divider sx={{ my: 4 }} />
                            <Typography variant="subtitle2" sx={{ fontWeight: 800, mb: 2 }}>Services Included</Typography>
                            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                                {client.services?.map((s: string) => <Chip key={s} label={s} size="small" variant="outlined" />)}
                            </Box>
                        </Paper>
                    </Grid>

                    <Grid item xs={12} md={5}>
                        <Stack spacing={3}>
                            <Paper sx={{ p: 3, borderRadius: 3 }}>
                                <Typography variant="subtitle1" sx={{ fontWeight: 800, mb: 3 }}>Assigned Team</Typography>
                                <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.secondary', display: 'block', mb: 1 }}>ACCOUNT MANAGER</Typography>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
                                    <Avatar src={client.assignedManager?.avatar} sx={{ width: 48, height: 48 }}>{client.assignedManager?.name?.charAt(0)}</Avatar>
                                    <Box>
                                        <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>{client.assignedManager?.name}</Typography>
                                        <Typography variant="caption" color="text.secondary">{client.assignedManager?.email}</Typography>
                                    </Box>
                                </Box>
                                <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.secondary', display: 'block', mb: 1 }}>TEAM MEMBERS ({client.assignedTeam?.length || 0})</Typography>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    {client.assignedTeam?.map((member: any) => (
                                        <Tooltip key={member._id} title={member.name}>
                                            <Avatar src={member.avatar} sx={{ width: 32, height: 32 }}>{member.name.charAt(0)}</Avatar>
                                        </Tooltip>
                                    ))}
                                </Box>
                            </Paper>

                            <Paper sx={{ p: 3, borderRadius: 3 }}>
                                <Typography variant="subtitle1" sx={{ fontWeight: 800, mb: 3 }}>Social Presence</Typography>
                                <Stack spacing={2}>
                                    <SocialLink icon={<InstagramIcon />} label="Instagram" value={client.socialHandles?.instagram} />
                                    <SocialLink icon={<YouTubeIcon />} label="YouTube" value={client.socialHandles?.youtube} />
                                    <SocialLink icon={<LinkedInIcon />} label="LinkedIn" value={client.socialHandles?.linkedin} />
                                    <SocialLink icon={<TwitterIcon />} label="Twitter / X" value={client.socialHandles?.twitter} />
                                </Stack>
                            </Paper>
                        </Stack>
                    </Grid>
                </Grid>
            )}

            {tab === 1 && (
                <Paper sx={{ p: 3, borderRadius: 3 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                        <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>Project History</Typography>
                        <Button variant="contained" size="small" onClick={() => router.push(`/projects?clientId=${client._id}&drawer=new`)}>+ New Project</Button>
                    </Box>
                    <List sx={{ pt: 0 }}>
                        {client.projects?.map((project: any) => (
                            <ListItem
                                key={project._id}
                                sx={{
                                    px: 2, mb: 2,
                                    border: '1px solid', borderColor: 'grey.100',
                                    borderRadius: 2,
                                    cursor: 'pointer',
                                    '&:hover': { bgcolor: 'grey.50' }
                                }}
                                onClick={() => router.push(`/projects/${project._id}`)}
                            >
                                <ListItemIcon>
                                    <ProjectIcon color={project.type === 'retainer' ? 'primary' : 'warning'} />
                                </ListItemIcon>
                                <ListItemText
                                    primary={
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                            <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>{project.name}</Typography>
                                            <Chip label={project.type} size="small" sx={{ height: 18, fontSize: '0.65rem', textTransform: 'capitalize' }} />
                                            <StatusChip status={project.status} />
                                        </Box>
                                    }
                                    secondary={`Project #${project.projectNumber} • Progress: ${project.completionPercentage}% • Deadline: ${project.deadline ? dayjs(project.deadline).format('DD MMM YYYY') : 'N/A'}`}
                                />
                                <Box sx={{ width: 150, ml: 2 }}>
                                    <Box sx={{ height: 6, width: '100%', bgcolor: 'grey.100', borderRadius: 3, overflow: 'hidden' }}>
                                        <Box sx={{ height: '100%', width: `${project.completionPercentage}%`, bgcolor: 'primary.main' }} />
                                    </Box>
                                </Box>
                            </ListItem>
                        ))}
                        {(!client.projects || client.projects.length === 0) && (
                            <Typography align="center" color="text.secondary" sx={{ py: 4 }}>No projects found for this client.</Typography>
                        )}
                    </List>
                </Paper>
            )}
        </Box>
    );
}

function StatCard({ label, value, icon, color }: any) {
    return (
        <Box sx={{ p: 2, borderRadius: 2, bgcolor: 'grey.50', display: 'flex', alignItems: 'center', gap: 2 }}>
            <Box sx={{ bgcolor: 'white', p: 1.5, borderRadius: 2, display: 'flex', boxShadow: '0 2px 8px rgba(0,0,0,0.03)' }}>
                {icon}
            </Box>
            <Box>
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700 }}>{label}</Typography>
                <Typography variant="h6" sx={{ fontWeight: 800, color: color || 'text.primary', lineHeight: 1.2 }}>{value}</Typography>
            </Box>
        </Box>
    );
}

function InfoItem({ label, value, isLink }: any) {
    return (
        <Box>
            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, textTransform: 'uppercase' }}>{label}</Typography>
            <Typography
                variant="body1"
                sx={{
                    fontWeight: 700,
                    color: isLink ? 'primary.main' : 'text.primary',
                    wordBreak: 'break-all'
                }}
            >
                {value}
            </Typography>
        </Box>
    );
}

function SocialLink({ icon, label, value }: any) {
    return (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Box sx={{ color: value ? 'primary.main' : 'text.disabled', display: 'flex' }}>
                {icon}
            </Box>
            <Typography variant="body2" sx={{ color: value ? 'text.primary' : 'text.disabled', fontWeight: value ? 700 : 400 }}>
                {value || `${label} not connected`}
            </Typography>
        </Box>
    );
}

import { Tooltip } from '@mui/material';
