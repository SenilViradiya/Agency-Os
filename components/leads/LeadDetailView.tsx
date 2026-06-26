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
    MenuItem,
    Select,
    FormControl,
    InputLabel,
    TextField,
    List,
    ListItem,
    ListItemText,
    ListItemIcon,
} from '@mui/material';
import {
    AccessTime as TimeIcon,
    History as HistoryIcon,
    Notes as NotesIcon,
    AccountBalance as BudgetIcon,
    Work as IndustryIcon,
    Campaign as SourceIcon,
    Event as FollowUpIcon,
    CheckCircle as WonIcon,
} from '@mui/icons-material';
import StatusChip from '@/components/shared/StatusChip';
import PriorityChip from '@/components/shared/PriorityChip';
import dayjs from 'dayjs';

interface LeadDetailViewProps {
    lead: any;
    onUpdate: (data: any) => void;
    onConvert: () => void;
}

export default function LeadDetailView({ lead, onUpdate, onConvert }: LeadDetailViewProps) {
    const [tab, setTab] = useState(0);
    const [notes, setNotes] = useState(lead.notes || '');

    const handleSaveNotes = () => {
        onUpdate({ notes });
    };

    return (
        <Grid container spacing={3}>
            {/* Left Column - 65% */}
            <Grid item xs={12} md={8}>
                <Paper sx={{ mb: 3, borderRadius: 3, overflow: 'hidden' }}>
                    <Box sx={{ p: 3, bgcolor: 'grey.50', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                            <Box>
                                <Typography variant="h5" sx={{ fontWeight: 800 }}>{lead.businessName}</Typography>
                                <Typography variant="body2" color="text.secondary">{lead.leadNumber} • Created {dayjs(lead.createdAt).format('DD MMM YYYY')}</Typography>
                            </Box>
                            <StatusChip status={lead.status} />
                        </Box>
                        <Box>
                            <PriorityChip priority={lead.priority} />
                        </Box>
                    </Box>

                    <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ px: 3, borderBottom: 1, borderColor: 'divider' }}>
                        <Tab label="Overview" />
                        <Tab label="Timeline" />
                        <Tab label="Notes" />
                    </Tabs>

                    <Box sx={{ p: 3 }}>
                        {tab === 0 && (
                            <Grid container spacing={4}>
                                <Grid item xs={12} sm={6}>
                                    <Stack spacing={3}>
                                        <InfoItem label="Contact Person" value={lead.name} icon={<TimeIcon fontSize="small" />} />
                                        <InfoItem label="Email" value={lead.email} />
                                        <InfoItem label="Phone" value={lead.phone} />
                                        <InfoItem label="WhatsApp" value={lead.whatsappNumber || '-'} />
                                    </Stack>
                                </Grid>
                                <Grid item xs={12} sm={6}>
                                    <Stack spacing={3}>
                                        <InfoItem label="Source" value={lead.source} sx={{ textTransform: 'capitalize' }} />
                                        <InfoItem label="Industry" value={lead.industry || '-'} />
                                        <InfoItem label="Services" value={lead.services?.join(', ') || '-'} />
                                        <InfoItem label="Referred By" value={lead.referredBy || '-'} />
                                    </Stack>
                                </Grid>
                            </Grid>
                        )}

                        {tab === 1 && (
                            <List sx={{ pt: 0 }}>
                                {lead.timeline?.slice().reverse().map((item: any, i: number) => (
                                    <ListItem key={i} sx={{ px: 0, alignItems: 'flex-start' }}>
                                        <ListItemIcon sx={{ minWidth: 40, mt: 0.5 }}>
                                            <HistoryIcon color="primary" fontSize="small" />
                                        </ListItemIcon>
                                        <ListItemText
                                            primary={<Typography variant="subtitle2" sx={{ fontWeight: 700 }}>{item.action}</Typography>}
                                            secondary={
                                                <Box>
                                                    {item.note && <Typography variant="body2" sx={{ mt: 0.5 }}>{item.note}</Typography>}
                                                    <Typography variant="caption" color="text.secondary">
                                                        {item.performedBy?.name || 'System'} • {dayjs(item.createdAt).format('DD MMM, hh:mm A')}
                                                    </Typography>
                                                </Box>
                                            }
                                        />
                                    </ListItem>
                                ))}
                            </List>
                        )}

                        {tab === 2 && (
                            <Box>
                                <TextField
                                    multiline
                                    rows={10}
                                    fullWidth
                                    placeholder="Add detailed internal notes about this lead..."
                                    value={notes}
                                    onChange={(e) => setNotes(e.target.value)}
                                    sx={{ bgcolor: 'grey.50' }}
                                />
                                <Button
                                    variant="contained"
                                    sx={{ mt: 2 }}
                                    onClick={handleSaveNotes}
                                >
                                    Save Notes
                                </Button>
                            </Box>
                        )}
                    </Box>
                </Paper>
            </Grid>

            {/* Right Column - 35% */}
            <Grid item xs={12} md={4}>
                <Stack spacing={3}>
                    <Card sx={{ borderRadius: 3 }}>
                        <CardContent sx={{ p: 3 }}>
                            <Typography variant="subtitle2" sx={{ fontWeight: 800, mb: 3 }}>QUICK ACTIONS</Typography>
                            <Stack spacing={2.5}>
                                <FormControl fullWidth size="small">
                                    <InputLabel>Change Status</InputLabel>
                                    <Select
                                        value={lead.status}
                                        label="Change Status"
                                        onChange={(e) => onUpdate({ status: e.target.value })}
                                    >
                                        <MenuItem value="new">New</MenuItem>
                                        <MenuItem value="contacted">Contacted</MenuItem>
                                        <MenuItem value="qualified">Qualified</MenuItem>
                                        <MenuItem value="won">Won</MenuItem>
                                        <MenuItem value="lost">Lost</MenuItem>
                                    </Select>
                                </FormControl>

                                <Button
                                    fullWidth
                                    variant="contained"
                                    color="success"
                                    startIcon={<WonIcon />}
                                    disabled={lead.status !== 'won' || lead.convertedToClient}
                                    onClick={onConvert}
                                    sx={{ py: 1.2, fontWeight: 700 }}
                                >
                                    {lead.convertedToClient ? 'Converted to Client' : 'Convert to Client'}
                                </Button>
                            </Stack>
                        </CardContent>
                    </Card>

                    <Card sx={{ borderRadius: 3 }}>
                        <CardContent sx={{ p: 3 }}>
                            <Typography variant="subtitle2" sx={{ fontWeight: 800, mb: 3 }}>LEAD STATS</Typography>
                            <Stack spacing={2.5}>
                                <StatItem label="Budget" value={`₹${lead.budget?.toLocaleString('en-IN')}`} icon={<BudgetIcon color="primary" />} />
                                <StatItem label="Lead Source" value={lead.source} icon={<SourceIcon color="primary" />} />
                                <StatItem label="Industry" value={lead.industry || 'Unknown'} icon={<IndustryIcon color="primary" />} />
                                <StatItem label="Follow-up" value={lead.followUpDate ? dayjs(lead.followUpDate).format('DD MMM YYYY') : 'Not Set'} icon={<FollowUpIcon color="error" />} />
                            </Stack>
                        </CardContent>
                    </Card>

                    <Paper sx={{ p: 3, borderRadius: 3 }}>
                        <Typography variant="subtitle2" sx={{ fontWeight: 800, mb: 2 }}>ASSIGNED TO</Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                            <Avatar src={lead.assignedTo?.avatar} sx={{ width: 48, height: 48 }}>
                                {lead.assignedTo?.name?.charAt(0)}
                            </Avatar>
                            <Box>
                                <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>{lead.assignedTo?.name}</Typography>
                                <Typography variant="caption" color="text.secondary">{lead.assignedTo?.email}</Typography>
                            </Box>
                        </Box>
                    </Paper>
                </Stack>
            </Grid>
        </Grid>
    );
}

function InfoItem({ label, value, icon, sx }: any) {
    return (
        <Box sx={sx}>
            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, textTransform: 'uppercase' }}>
                {label}
            </Typography>
            <Typography variant="body1" sx={{ fontWeight: 700 }}>{value}</Typography>
        </Box>
    );
}

function StatItem({ label, value, icon }: any) {
    return (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Box sx={{ bgcolor: 'grey.100', p: 1, borderRadius: 2, display: 'flex' }}>
                {icon}
            </Box>
            <Box>
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>{label}</Typography>
                <Typography variant="body2" sx={{ fontWeight: 800, textTransform: 'capitalize' }}>{value}</Typography>
            </Box>
        </Box>
    );
}
