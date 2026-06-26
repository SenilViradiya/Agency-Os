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
} from '@mui/material';
import { Close as CloseIcon } from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs from 'dayjs';
import UserSelect from '@/components/shared/UserSelect';

const leadSchema = z.object({
    name: z.string().min(2, 'Name is required'),
    businessName: z.string().min(2, 'Business Name is required'),
    email: z.string().email('Invalid email address'),
    phone: z.string().min(10, 'Phone number must be at least 10 digits'),
    whatsappNumber: z.string().optional(),
    source: z.enum(['whatsapp', 'referral', 'cold_email', 'cold_call', 'instagram', 'website', 'other']),
    referredBy: z.string().optional(),
    industry: z.string().optional(),
    services: z.array(z.string()).default([]),
    priority: z.enum(['low', 'medium', 'high']).default('medium'),
    budget: z.number().min(0, 'Budget must be at least 0').default(0),
    assignedTo: z.string().min(1, 'Please assign a user'),
    followUpDate: z.any().optional(),
    notes: z.string().optional(),
});

type LeadFormValues = z.infer<typeof leadSchema>;

interface LeadDrawerProps {
    open: boolean;
    onClose: () => void;
    onSubmit: (data: LeadFormValues) => void;
    initialData?: any;
    loading?: boolean;
}

const SOURCES = ['whatsapp', 'referral', 'cold_email', 'cold_call', 'instagram', 'website', 'other'];
const SERVICES = ['YouTube Management', 'Reels', 'Shorts', 'Meta Ads', 'Google Ads', 'Graphic Design', 'Video Editing', 'SEO', 'Website Development'];
const PRIORITIES = ['low', 'medium', 'high'];

export default function LeadDrawer({ open, onClose, onSubmit, initialData, loading }: LeadDrawerProps) {
    const {
        register,
        handleSubmit,
        control,
        watch,
        reset,
        formState: { errors },
    } = useForm<LeadFormValues>({
        resolver: zodResolver(leadSchema),
        defaultValues: {
            source: 'whatsapp',
            priority: 'medium',
            budget: 0,
            services: [],
        },
    });

    const sourceValue = watch('source');

    useEffect(() => {
        if (initialData) {
            reset({
                ...initialData,
                followUpDate: initialData.followUpDate ? dayjs(initialData.followUpDate) : null,
                assignedTo: typeof initialData.assignedTo === 'object' ? initialData.assignedTo._id : initialData.assignedTo,
            });
        } else {
            reset({
                source: 'whatsapp',
                priority: 'medium',
                budget: 0,
                services: [],
                name: '',
                businessName: '',
                email: '',
                phone: '',
            });
        }
    }, [initialData, reset, open]);

    const handleFormSubmit = (data: LeadFormValues) => {
        onSubmit({
            ...data,
            followUpDate: data.followUpDate ? data.followUpDate.toDate() : null,
        });
    };

    return (
        <Drawer anchor="right" open={open} onClose={onClose}>
            <Box sx={{ width: 480, p: 0 }}>
                <Box sx={{ p: 3, display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: 1, borderColor: 'divider' }}>
                    <Typography variant="h6" sx={{ fontWeight: 700 }}>
                        {initialData ? 'Edit Lead' : 'Add New Lead'}
                    </Typography>
                    <IconButton onClick={onClose} size="small">
                        <CloseIcon />
                    </IconButton>
                </Box>

                <Box component="form" onSubmit={handleSubmit(handleFormSubmit)} sx={{ p: 3 }}>
                    <Stack spacing={3}>
                        <Box>
                            <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 700, color: 'primary.main' }}>
                                1. Contact Information
                            </Typography>
                            <Grid container spacing={2}>
                                <Grid item xs={12}>
                                    <TextField
                                        label="Contact Name"
                                        fullWidth
                                        {...register('name')}
                                        error={!!errors.name}
                                        helperText={errors.name?.message}
                                    />
                                </Grid>
                                <Grid item xs={12}>
                                    <TextField
                                        label="Business Name"
                                        fullWidth
                                        {...register('businessName')}
                                        error={!!errors.businessName}
                                        helperText={errors.businessName?.message}
                                    />
                                </Grid>
                                <Grid item xs={12}>
                                    <TextField
                                        label="Email Address"
                                        fullWidth
                                        {...register('email')}
                                        error={!!errors.email}
                                        helperText={errors.email?.message}
                                    />
                                </Grid>
                                <Grid item xs={6}>
                                    <TextField
                                        label="Phone Number"
                                        fullWidth
                                        {...register('phone')}
                                        error={!!errors.phone}
                                        helperText={errors.phone?.message}
                                    />
                                </Grid>
                                <Grid item xs={6}>
                                    <TextField
                                        label="WhatsApp (Optional)"
                                        fullWidth
                                        {...register('whatsappNumber')}
                                    />
                                </Grid>
                            </Grid>
                        </Box>

                        <Divider />

                        <Box>
                            <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 700, color: 'primary.main' }}>
                                2. Lead Information
                            </Typography>
                            <Grid container spacing={2}>
                                <Grid item xs={6}>
                                    <FormControl fullWidth error={!!errors.source}>
                                        <InputLabel>Source</InputLabel>
                                        <Controller
                                            name="source"
                                            control={control}
                                            render={({ field }) => (
                                                <Select {...field} label="Source">
                                                    {SOURCES.map(source => (
                                                        <MenuItem key={source} value={source} sx={{ textTransform: 'capitalize' }}>
                                                            {source.replace('_', ' ')}
                                                        </MenuItem>
                                                    ))}
                                                </Select>
                                            )}
                                        />
                                    </FormControl>
                                </Grid>
                                <Grid item xs={6}>
                                    <TextField
                                        label="Referred By"
                                        fullWidth
                                        disabled={sourceValue !== 'referral'}
                                        {...register('referredBy')}
                                    />
                                </Grid>
                                <Grid item xs={6}>
                                    <TextField
                                        label="Industry"
                                        fullWidth
                                        {...register('industry')}
                                    />
                                </Grid>
                                <Grid item xs={6}>
                                    <TextField
                                        label="Budget (₹)"
                                        type="number"
                                        fullWidth
                                        {...register('budget', { valueAsNumber: true })}
                                        error={!!errors.budget}
                                    />
                                </Grid>
                                <Grid item xs={12}>
                                    <FormControl fullWidth>
                                        <InputLabel>Services</InputLabel>
                                        <Controller
                                            name="services"
                                            control={control}
                                            render={({ field }) => (
                                                <Select
                                                    {...field}
                                                    multiple
                                                    label="Services"
                                                    renderValue={(selected) => (
                                                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                                                            {selected.map((value) => (
                                                                <Chip key={value} label={value} size="small" />
                                                            ))}
                                                        </Box>
                                                    )}
                                                >
                                                    {SERVICES.map((service) => (
                                                        <MenuItem key={service} value={service}>
                                                            {service}
                                                        </MenuItem>
                                                    ))}
                                                </Select>
                                            )}
                                        />
                                    </FormControl>
                                </Grid>
                                <Grid item xs={12}>
                                    <FormControl fullWidth>
                                        <InputLabel>Priority</InputLabel>
                                        <Controller
                                            name="priority"
                                            control={control}
                                            render={({ field }) => (
                                                <Select {...field} label="Priority">
                                                    {PRIORITIES.map(p => (
                                                        <MenuItem key={p} value={p} sx={{ textTransform: 'capitalize' }}>
                                                            {p}
                                                        </MenuItem>
                                                    ))}
                                                </Select>
                                            )}
                                        />
                                    </FormControl>
                                </Grid>
                            </Grid>
                        </Box>

                        <Divider />

                        <Box>
                            <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 700, color: 'primary.main' }}>
                                3. Assignment & Follow-up
                            </Typography>
                            <Grid container spacing={2}>
                                <Grid item xs={12}>
                                    <Controller
                                        name="assignedTo"
                                        control={control}
                                        render={({ field }) => (
                                            <UserSelect
                                                label="Assign To"
                                                value={field.value}
                                                onChange={field.onChange}
                                                error={!!errors.assignedTo}
                                                helperText={errors.assignedTo?.message}
                                            />
                                        )}
                                    />
                                </Grid>
                                <Grid item xs={12}>
                                    <LocalizationProvider dateAdapter={AdapterDayjs}>
                                        <Controller
                                            name="followUpDate"
                                            control={control}
                                            render={({ field }) => (
                                                <DatePicker
                                                    label="Next Follow-up"
                                                    sx={{ width: '100%' }}
                                                    value={field.value}
                                                    onChange={field.onChange}
                                                />
                                            )}
                                        />
                                    </LocalizationProvider>
                                </Grid>
                            </Grid>
                        </Box>

                        <Divider />

                        <Box>
                            <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 700, color: 'primary.main' }}>
                                4. Additional Notes
                            </Typography>
                            <TextField
                                label="Notes"
                                multiline
                                rows={4}
                                fullWidth
                                {...register('notes')}
                            />
                        </Box>

                        <Box sx={{ pt: 2, pb: 4, display: 'flex', gap: 2 }}>
                            <Button fullWidth variant="outlined" onClick={onClose} disabled={loading}>
                                Cancel
                            </Button>
                            <Button fullWidth variant="contained" type="submit" disabled={loading}>
                                {loading ? <CircularProgress size={24} /> : (initialData ? 'Update Lead' : 'Create Lead')}
                            </Button>
                        </Box>
                    </Stack>
                </Box>
            </Box>
        </Drawer>
    );
}
