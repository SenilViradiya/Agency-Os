'use client';

import { useEffect, useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
    Drawer,
    Box,
    Typography,
    TextField,
    Button,
    IconButton,
    Stack,
    MenuItem,
    Chip,
    Select,
    FormControl,
    InputLabel,
    Grid,
    CircularProgress,
    Divider,
    Tabs,
    Tab,
} from '@mui/material';
import { Close as CloseIcon } from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs from 'dayjs';
import UserSelect from '@/components/shared/UserSelect';

const clientSchema = z.object({
    businessName: z.string().min(2, 'Business Name is required'),
    contactPerson: z.string().min(2, 'Contact Person is required'),
    email: z.string().email('Invalid email address'),
    phone: z.string().min(10, 'Phone must be at least 10 digits'),
    whatsappNumber: z.string().optional(),
    website: z.string().optional(),
    industry: z.string().optional(),
    logo: z.string().optional(),
    status: z.enum(['active', 'inactive', 'churned', 'on_hold']).default('active'),
    tier: z.enum(['standard', 'premium', 'enterprise']).default('standard'),
    services: z.array(z.string()).default([]),
    contractStartDate: z.any().optional(),
    contractEndDate: z.any().optional(),
    monthlyRetainerValue: z.number().min(0).default(0),
    assignedManager: z.string().min(1, 'Please assign a manager'),
    assignedTeam: z.array(z.string()).default([]),
    socialHandles: z.object({
        instagram: z.string().optional(),
        youtube: z.string().optional(),
        linkedin: z.string().optional(),
        twitter: z.string().optional(),
    }),
    address: z.object({
        street: z.string().optional(),
        city: z.string().optional(),
        state: z.string().optional(),
        pincode: z.string().optional(),
        country: z.string().default('India'),
    }),
    notes: z.string().optional(),
});

type ClientFormValues = z.infer<typeof clientSchema>;

interface ClientDrawerProps {
    open: boolean;
    onClose: () => void;
    onSubmit: (data: ClientFormValues) => void;
    initialData?: any;
    loading?: boolean;
}

const SERVICES = ['YouTube Management', 'Reels', 'Shorts', 'Meta Ads', 'Google Ads', 'Graphic Design', 'Video Editing', 'SEO', 'Website Development'];
const TIERS = ['standard', 'premium', 'enterprise'];
const STATUSES = ['active', 'inactive', 'churned', 'on_hold'];

export default function ClientDrawer({ open, onClose, onSubmit, initialData, loading }: ClientDrawerProps) {
    const [tab, setTab] = useState(0);

    const {
        register,
        handleSubmit,
        control,
        reset,
        formState: { errors },
    } = useForm<ClientFormValues>({
        resolver: zodResolver(clientSchema),
        defaultValues: {
            status: 'active',
            tier: 'standard',
            services: [],
            monthlyRetainerValue: 0,
            address: { country: 'India' },
            socialHandles: {},
        },
    });

    useEffect(() => {
        if (initialData) {
            reset({
                ...initialData,
                contractStartDate: initialData.contractStartDate ? dayjs(initialData.contractStartDate) : null,
                contractEndDate: initialData.contractEndDate ? dayjs(initialData.contractEndDate) : null,
                assignedManager: typeof initialData.assignedManager === 'object' ? initialData.assignedManager._id : initialData.assignedManager,
                assignedTeam: initialData.assignedTeam?.map((t: any) => typeof t === 'object' ? t._id : t) || [],
            });
        } else {
            reset({
                status: 'active',
                tier: 'standard',
                services: [],
                monthlyRetainerValue: 0,
                address: { country: 'India' },
                socialHandles: {},
            });
        }
        setTab(0);
    }, [initialData, reset, open]);

    const handleFormSubmit = (data: ClientFormValues) => {
        onSubmit({
            ...data,
            contractStartDate: data.contractStartDate ? data.contractStartDate.toDate() : null,
            contractEndDate: data.contractEndDate ? data.contractEndDate.toDate() : null,
        });
    };

    return (
        <Drawer anchor="right" open={open} onClose={onClose}>
            <Box sx={{ width: 520, display: 'flex', flexDirection: 'column', height: '100%' }}>
                <Box sx={{ p: 3, display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: 1, borderColor: 'divider' }}>
                    <Typography variant="h6" sx={{ fontWeight: 700 }}>
                        {initialData ? 'Edit Client' : 'Add New Client'}
                    </Typography>
                    <IconButton onClick={onClose} size="small">
                        <CloseIcon />
                    </IconButton>
                </Box>

                <Tabs value={tab} onChange={(_, v) => setTab(v)} variant="scrollable" scrollButtons="auto" sx={{ px: 2, borderBottom: 1, borderColor: 'divider' }}>
                    <Tab label="Basic Info" />
                    <Tab label="Contract" />
                    <Tab label="Social" />
                    <Tab label="Team" />
                    <Tab label="Address" />
                </Tabs>

                <Box component="form" onSubmit={handleSubmit(handleFormSubmit)} sx={{ p: 3, flexGrow: 1, overflowY: 'auto' }}>
                    {tab === 0 && (
                        <Grid container spacing={2}>
                            <Grid item xs={12}>
                                <TextField label="Business Name" fullWidth {...register('businessName')} error={!!errors.businessName} helperText={errors.businessName?.message} />
                            </Grid>
                            <Grid item xs={12}>
                                <TextField label="Contact Person" fullWidth {...register('contactPerson')} error={!!errors.contactPerson} helperText={errors.contactPerson?.message} />
                            </Grid>
                            <Grid item xs={12}>
                                <TextField label="Email Address" fullWidth {...register('email')} error={!!errors.email} helperText={errors.email?.message} />
                            </Grid>
                            <Grid item xs={6}>
                                <TextField label="Phone Number" fullWidth {...register('phone')} error={!!errors.phone} helperText={errors.phone?.message} />
                            </Grid>
                            <Grid item xs={6}>
                                <TextField label="WhatsApp (Optional)" fullWidth {...register('whatsappNumber')} />
                            </Grid>
                            <Grid item xs={12}>
                                <TextField label="Website / Linktree" fullWidth {...register('website')} />
                            </Grid>
                            <Grid item xs={12}>
                                <FormControl fullWidth>
                                    <InputLabel>Status</InputLabel>
                                    <Controller
                                        name="status"
                                        control={control}
                                        render={({ field }) => (
                                            <Select {...field} label="Status">
                                                {STATUSES.map(s => <MenuItem key={s} value={s} sx={{ textTransform: 'capitalize' }}>{s.replace('_', ' ')}</MenuItem>)}
                                            </Select>
                                        )}
                                    />
                                </FormControl>
                            </Grid>
                        </Grid>
                    )}

                    {tab === 1 && (
                        <Grid container spacing={2}>
                            <Grid item xs={12}>
                                <FormControl fullWidth>
                                    <InputLabel>Tier</InputLabel>
                                    <Controller
                                        name="tier"
                                        control={control}
                                        render={({ field }) => (
                                            <Select {...field} label="Tier">
                                                {TIERS.map(t => <MenuItem key={t} value={t} sx={{ textTransform: 'capitalize' }}>{t}</MenuItem>)}
                                            </Select>
                                        )}
                                    />
                                </FormControl>
                            </Grid>
                            <Grid item xs={12}>
                                <TextField label="Monthly Retainer (₹)" type="number" fullWidth {...register('monthlyRetainerValue', { valueAsNumber: true })} />
                            </Grid>
                            <Grid item xs={12}>
                                <FormControl fullWidth>
                                    <InputLabel>Services</InputLabel>
                                    <Controller
                                        name="services"
                                        control={control}
                                        render={({ field }) => (
                                            <Select {...field} multiple label="Services" renderValue={(selected) => (
                                                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                                                    {selected.map((value) => <Chip key={value} label={value} size="small" />)}
                                                </Box>
                                            )}>
                                                {SERVICES.map((s) => <MenuItem key={s} value={s}>{s}</MenuItem>)}
                                            </Select>
                                        )}
                                    />
                                </FormControl>
                            </Grid>
                            <Grid item xs={6}>
                                <LocalizationProvider dateAdapter={AdapterDayjs}>
                                    <Controller
                                        name="contractStartDate"
                                        control={control}
                                        render={({ field }) => (
                                            <DatePicker label="Contract Start" sx={{ width: '100%' }} value={field.value} onChange={field.onChange} />
                                        )}
                                    />
                                </LocalizationProvider>
                            </Grid>
                            <Grid item xs={6}>
                                <LocalizationProvider dateAdapter={AdapterDayjs}>
                                    <Controller
                                        name="contractEndDate"
                                        control={control}
                                        render={({ field }) => (
                                            <DatePicker label="Contract End" sx={{ width: '100%' }} value={field.value} onChange={field.onChange} />
                                        )}
                                    />
                                </LocalizationProvider>
                            </Grid>
                        </Grid>
                    )}

                    {tab === 2 && (
                        <Grid container spacing={2}>
                            <Grid item xs={12}>
                                <TextField label="Instagram URL" fullWidth {...register('socialHandles.instagram')} />
                            </Grid>
                            <Grid item xs={12}>
                                <TextField label="YouTube Channel URL" fullWidth {...register('socialHandles.youtube')} />
                            </Grid>
                            <Grid item xs={12}>
                                <TextField label="LinkedIn Profile URL" fullWidth {...register('socialHandles.linkedin')} />
                            </Grid>
                            <Grid item xs={12}>
                                <TextField label="Twitter / X URL" fullWidth {...register('socialHandles.twitter')} />
                            </Grid>
                        </Grid>
                    )}

                    {tab === 3 && (
                        <Grid container spacing={2}>
                            <Grid item xs={12}>
                                <Controller
                                    name="assignedManager"
                                    control={control}
                                    render={({ field }) => (
                                        <UserSelect label="Assigned Manager" value={field.value} onChange={field.onChange} disabled={loading} />
                                    )}
                                />
                            </Grid>
                            <Grid item xs={12}>
                                <Controller
                                    name="assignedTeam"
                                    control={control}
                                    render={({ field }) => (
                                        <UserSelect label="Team Members" multiple value={field.value} onChange={field.onChange} disabled={loading} />
                                    )}
                                />
                            </Grid>
                        </Grid>
                    )}

                    {tab === 4 && (
                        <Grid container spacing={2}>
                            <Grid item xs={12}>
                                <TextField label="Street Address" fullWidth {...register('address.street')} />
                            </Grid>
                            <Grid item xs={6}>
                                <TextField label="City" fullWidth {...register('address.city')} />
                            </Grid>
                            <Grid item xs={6}>
                                <TextField label="State" fullWidth {...register('address.state')} />
                            </Grid>
                            <Grid item xs={6}>
                                <TextField label="Pincode" fullWidth {...register('address.pincode')} />
                            </Grid>
                            <Grid item xs={6}>
                                <TextField label="Country" fullWidth {...register('address.country')} />
                            </Grid>
                        </Grid>
                    )}
                </Box>

                <Box sx={{ p: 3, borderTop: 1, borderColor: 'divider', display: 'flex', gap: 2 }}>
                    <Button fullWidth variant="outlined" onClick={onClose} disabled={loading}>Cancel</Button>
                    <Button fullWidth variant="contained" onClick={handleSubmit(handleFormSubmit)} disabled={loading}>
                        {loading ? <CircularProgress size={24} /> : (initialData ? 'Update Client' : 'Create Client')}
                    </Button>
                </Box>
            </Box>
        </Drawer>
    );
}
