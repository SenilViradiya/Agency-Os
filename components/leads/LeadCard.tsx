'use client';

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Card, CardContent, Typography, Box, Chip, Avatar, Tooltip } from '@mui/material';
import {
    WhatsApp as WhatsAppIcon,
    Group as ReferralIcon,
    Email as EmailIcon,
    Call as CallIcon,
    Instagram as InstagramIcon,
    Language as WebsiteIcon,
    MoreHoriz as OtherIcon,
    DragIndicator as DragIcon
} from '@mui/icons-material';
import dayjs from 'dayjs';

interface LeadCardProps {
    lead: any;
    onClick: (lead: any) => void;
}

const getSourceIcon = (source: string) => {
    switch (source) {
        case 'whatsapp': return <WhatsAppIcon sx={{ fontSize: 14 }} />;
        case 'referral': return <ReferralIcon sx={{ fontSize: 14 }} />;
        case 'cold_email': return <EmailIcon sx={{ fontSize: 14 }} />;
        case 'cold_call': return <CallIcon sx={{ fontSize: 14 }} />;
        case 'instagram': return <InstagramIcon sx={{ fontSize: 14 }} />;
        case 'website': return <WebsiteIcon sx={{ fontSize: 14 }} />;
        default: return <OtherIcon sx={{ fontSize: 14 }} />;
    }
};

const getSourceColor = (source: string) => {
    switch (source) {
        case 'whatsapp': return { bgcolor: '#E3FBE3', color: '#1B5E20' };
        case 'referral': return { bgcolor: '#E3F2FD', color: '#0D47A1' };
        case 'cold_email': return { bgcolor: '#FFF3E0', color: '#E65100' };
        case 'instagram': return { bgcolor: '#FCE4EC', color: '#880E4F' };
        default: return { bgcolor: '#F5F5F5', color: '#424242' };
    }
};

const getPriorityColor = (priority: string) => {
    switch (priority) {
        case 'high': return '#f44336';
        case 'medium': return '#ff9800';
        case 'low': return '#4caf50';
        default: return '#9e9e9e';
    }
};

export default function LeadCard({ lead, onClick }: LeadCardProps) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging
    } = useSortable({ id: lead._id });

    const style = {
        transform: CSS.Translate.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
        cursor: 'default',
    };

    const sourceStyle = getSourceColor(lead.source);
    const isOverdue = lead.followUpDate && dayjs(lead.followUpDate).isBefore(dayjs(), 'day');

    return (
        <Card
            ref={setNodeRef}
            style={style}
            onClick={() => onClick(lead)}
            sx={{
                mb: 2,
                borderRadius: 2,
                boxShadow: isDragging ? '0 8px 30px rgba(0,0,0,0.15)' : '0 2px 8px rgba(0,0,0,0.05)',
                border: '1px solid',
                borderColor: 'divider',
                position: 'relative',
                transition: 'box-shadow 0.2s',
                '&:hover': {
                    boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                }
            }}
        >
            <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1.5 }}>
                    <Typography variant="caption" sx={{ fontWeight: 600, color: 'text.disabled' }}>
                        {lead.leadNumber}
                    </Typography>
                    <Box
                        {...attributes}
                        {...listeners}
                        sx={{ cursor: 'grab', color: 'text.disabled', '&:hover': { color: 'text.primary' } }}
                    >
                        <DragIcon sx={{ fontSize: 18 }} />
                    </Box>
                </Box>

                <Typography variant="subtitle2" sx={{ fontWeight: 800, mb: 0.5, lineHeight: 1.2 }}>
                    {lead.businessName}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5, fontSize: '0.8rem' }}>
                    {lead.name}
                </Typography>

                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
                    <Chip
                        icon={getSourceIcon(lead.source)}
                        label={lead.source.replace('_', ' ')}
                        size="small"
                        sx={{
                            fontSize: '0.7rem',
                            height: 20,
                            textTransform: 'capitalize',
                            ...sourceStyle
                        }}
                    />
                    <Box sx={{ display: 'flex', alignItems: 'center', ml: 'auto' }}>
                        <Box sx={{
                            width: 8,
                            height: 8,
                            borderRadius: '50%',
                            bgcolor: getPriorityColor(lead.priority),
                            mr: 1
                        }} />
                        <Typography variant="caption" sx={{ fontWeight: 700, textTransform: 'uppercase', fontSize: '0.65rem' }}>
                            {lead.priority}
                        </Typography>
                    </Box>
                </Box>

                <Divider sx={{ mb: 1.5, opacity: 0.6 }} />

                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Box>
                        <Typography variant="caption" color="text.secondary" display="block" sx={{ fontSize: '0.65rem', fontWeight: 600 }}>
                            BUDGET
                        </Typography>
                        <Typography variant="body2" sx={{ fontWeight: 800, color: 'primary.main' }}>
                            ₹{lead.budget?.toLocaleString('en-IN')}
                        </Typography>
                    </Box>

                    <Box sx={{ textAlign: 'right' }}>
                        {lead.followUpDate ? (
                            <>
                                <Typography variant="caption" color={isOverdue ? 'error.main' : 'text.secondary'} display="block" sx={{ fontSize: '0.65rem', fontWeight: 600 }}>
                                    FOLLOW-UP
                                </Typography>
                                <Typography variant="body2" sx={{ fontWeight: 700, color: isOverdue ? 'error.main' : 'text.primary' }}>
                                    {dayjs(lead.followUpDate).format('DD MMM')}
                                </Typography>
                            </>
                        ) : (
                            <Tooltip title={lead.assignedTo?.name || 'Unassigned'}>
                                <Avatar
                                    src={lead.assignedTo?.avatar}
                                    sx={{ width: 28, height: 28, fontSize: '0.75rem' }}
                                >
                                    {lead.assignedTo?.name?.charAt(0)}
                                </Avatar>
                            </Tooltip>
                        )}
                    </Box>
                </Box>
            </CardContent>
        </Card>
    );
}

// Helper to make it easier to see imports
import { Divider } from '@mui/material';
