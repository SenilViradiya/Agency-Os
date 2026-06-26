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
    Select,
    FormControl,
    InputLabel,
    Grid,
    CircularProgress,
    Divider,
    ToggleButtonGroup,
    ToggleButton,
} from '@mui/material';
import { Close as CloseIcon } from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs from 'dayjs';
import UserSelect from '@/components/shared/UserSelect';
import apiClient from '@/lib/apiClient';

const projectSchema = z.object({
    clientId: z.string().min(1, 'Client is required'),
    name: z.string().min(2, 'Project Name is required'),
    type: z.enum(['retainer', 'campaign']).default('retainer'),
    projectManager: z.string().min(1, 'Manager is required'),
    teamMembers: z.array(z.string()).default([]),
    description: z.string().optional(),
    status: z.enum(['planning', 'active', 'on_hold', 'completed', 'cancelled']).default('planning'),
    priority: z.enum(['low', 'medium', 'high']).default('medium'),
    deadline: z.any().optional(),
    // Retainer specific
    retainerMonth: z.string().optional(),
    contentQuota: z.object({
        videos: z.number().min(0).default(0),
        reels: z.number().min(0).default(0),
        posts: z.number().min(0).default(0),
    }).optional(),
    // Campaign specific
    campaignObjective: z.string().optional(),
    // Progress
    totalTasks: z.number().min(0).default(0),
    completedTasks: z.number().min(0).default(0),
});

type ProjectFormValues = z.infer<typeof projectSchema>;

interface ProjectDrawerProps {
    open: boolean;
    onClose: () => void;
    onSubmit: (data: ProjectFormValues) => void;
    initialData?: any;
    loading?: boolean;
}

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

export default function ProjectDrawer({ open, onClose, onSubmit, initialData, loading }: ProjectDrawerProps) {
    const [clients, setClients] = useState<any[]>([]);

    const {
        register,
        handleSubmit,
        control,
        watch,
        reset,
        formState: { errors },
    } = useForm<ProjectFormValues>({
        resolver: zodResolver(projectSchema),
        defaultValues: {
            type: 'retainer',
            status: 'planning',
            priority: 'medium',
            contentQuota: { videos: 0, reels: 0, posts: 0 },
            totalTasks: 0,
            completedTasks: 0,
        },
    });

    const projectType = watch('type');

    useEffect(() => {
        apiClient.get('/clients?limit=100').then(res => {
            if (res.data.success) setClients(res.data.data);
        });
    }, []);

    useEffect(() => {
        if (initialData) {
            reset({
                ...initialData,
                clientId: typeof initialData.clientId === 'object' ? initialData.clientId._id : initialData.clientId,
                projectManager: typeof initialData.projectManager === 'object' ? initialData.projectManager._id : initialData.projectManager,
                teamMembers: initialData.teamMembers?.map((t: any) => typeof t === 'object' ? t._id : t) || [],
                deadline: initialData.deadline ? dayjs(initialData.deadline) : null,
            });
        } else {
            reset({
                type: 'retainer',
                status: 'planning',
                priority: 'medium',
                contentQuota: { videos: 0, reels: 0, posts: 0 },
                totalTasks: 0,
                completedTasks: 0,
                name: '',
                description: '',
            });
        }
    }, [initialData, reset, open]);

    const handleFormSubmit = (data: ProjectFormValues) => {
        onSubmit({
            ...data,
            deadline: data.deadline ? data.deadline.toDate() : null,
        });
    };

    return (
        <Drawer anchor="right" open={open} onClose={onClose}>
            <Box sx={{ width: 500, p: 0 }}>
                <Box sx={{ p: 3, display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: 1, borderColor: 'divider' }}>
                    <Typography variant="h6" sx={{ fontWeight: 700 }}>
                        {initialData ? 'Edit Project' : 'Launch New Project'}
                    </Typography>
                    <IconButton onClick={onClose} size="small">
                        <CloseIcon />
                    </IconButton>
                </Box>

                <Box component="form" onSubmit={handleSubmit(handleFormSubmit)} sx={{ p: 3 }}>
                    <Stack spacing={3}>
                        <Box>
                            <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 700, color: 'primary.main' }}>
                                1. Project Type & Client
                            </Typography>
                            <Stack spacing={2}>
                                <FormControl fullWidth>
                                    <Controller
                                        name="type"
                                        control={control}
                                        render={({ field }) => (
                                            <ToggleButtonGroup
                                                fullWidth
                                                value={field.value}
                                                exclusive
                                                onChange={(_, v) => v && field.onChange(v)}
                                                color="primary"
                                                size="small"
                                            >
                                                <ToggleButton value="retainer">Retainer</ToggleButton>
                                                <ToggleButton value="campaign">Campaign</ToggleButton>
                                            </ToggleButtonGroup>
                                        )}
                                    />
                                </FormControl>
                                <FormControl fullWidth error={!!errors.clientId}>
                                    <InputLabel>Select Client</InputLabel>
                                    <Controller
                                        name="clientId"
                                        control={control}
                                        render={({ field }) => (
                                            <Select {...field} label="Select Client">
                                                {clients.map(c => (
                                                    <MenuItem key={c._id} value={c._id}>{c.businessName}</MenuItem>
                                                ))}
                                            </Select>
                                        )}
                                    />
                                </FormControl>
                                <TextField label="Project Name" fullWidth {...register('name')} error={!!errors.name} helperText={errors.name?.message} />
                            </Stack>
                        </Box>

                        <Divider />

                        <Box>
                            <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 700, color: 'primary.main' }}>
                                2. Configuration
                            </Typography>
                            <Grid container spacing={2}>
                                <Grid item xs={12}>
                                    <Controller
                                        name="projectManager"
                                        control={control}
                                        render={({ field }) => (
                                            <UserSelect label="Project Manager" value={field.value} onChange={field.onChange} error={!!errors.projectManager} helperText={errors.projectManager?.message} />
                                        )}
                                    />
                                </Grid>
                                <Grid item xs={12}>
                                    <Controller
                                        name="teamMembers"
                                        control={control}
                                        render={({ field }) => <UserSelect label="Team Members" multiple value={field.value} onChange={field.onChange} />}
                                    />
                                </Grid>

                                {projectType === 'retainer' ? (
                                    <>
                                        <Grid item xs={12}>
                                            <FormControl fullWidth>
                                                <InputLabel>Retainer Month</InputLabel>
                                                <Controller
                                                    name="retainerMonth"
                                                    control={control}
                                                    render={({ field }) => (
                                                        <Select {...field} label="Retainer Month">
                                                            {MONTHS.map(m => <MenuItem key={m} value={m}>{m}</MenuItem>)}
                                                        </Select>
                                                    )}
                                                />
                                            </FormControl>
                                        </Grid>
                                        <Grid item xs={4}>
                                            <TextField type="number" label="Videos" fullWidth {...register('contentQuota.videos', { valueAsNumber: true })} />
                                        </Grid>
                                        <Grid item xs={4}>
                                            <TextField type="number" label="Reels" fullWidth {...register('contentQuota.reels', { valueAsNumber: true })} />
                                        </Grid>
                                        <Grid item xs={4}>
                                            <TextField type="number" label="Posts" fullWidth {...register('contentQuota.posts', { valueAsNumber: true })} />
                                        </Grid>
                                    </>
                                ) : (
                                    <>
                                        <Grid item xs={12}>
                                            <TextField label="Campaign Objective" multiline rows={2} fullWidth {...register('campaignObjective')} />
                                        </Grid>
                                        <Grid item xs={12}>
                                            <LocalizationProvider dateAdapter={AdapterDayjs}>
                                                <Controller
                                                    name="deadline"
                                                    control={control}
                                                    render={({ field }) => (
                                                        <DatePicker label="Campaign Deadline" sx={{ width: '100%' }} value={field.value} onChange={field.onChange} />
                                                    )}
                                                />
                                            </LocalizationProvider>
                                        </Grid>
                                    </>
                                )}
                            </Grid>
                        </Box>

                        <Divider />

                        <Box>
                            <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 700, color: 'primary.main' }}>
                                3. Status & Tasks
                            </Typography>
                            <Grid container spacing={2}>
                                <Grid item xs={6}>
                                    <FormControl fullWidth>
                                        <InputLabel>Status</InputLabel>
                                        <Controller
                                            name="status"
                                            control={control}
                                            render={({ field }) => (
                                                <Select {...field} label="Status">
                                                    <MenuItem value="planning">Planning</MenuItem>
                                                    <MenuItem value="active">Active</MenuItem>
                                                    <MenuItem value="on_hold">On Hold</MenuItem>
                                                    <MenuItem value="completed">Completed</MenuItem>
                                                    <MenuItem value="cancelled">Cancelled</MenuItem>
                                                </Select>
                                            )}
                                        />
                                    </FormControl>
                                </Grid>
                                <Grid item xs={6}>
                                    <FormControl fullWidth>
                                        <InputLabel>Priority</InputLabel>
                                        <Controller
                                            name="priority"
                                            control={control}
                                            render={({ field }) => (
                                                <Select {...field} label="Priority">
                                                    <MenuItem value="low">Low</MenuItem>
                                                    <MenuItem value="medium">Medium</MenuItem>
                                                    <MenuItem value="high">High</MenuItem>
                                                </Select>
                                            )}
                                        />
                                    </FormControl>
                                </Grid>
                                <Grid item xs={6}>
                                    <TextField type="number" label="Total Tasks" fullWidth {...register('totalTasks', { valueAsNumber: true })} />
                                </Grid>
                                <Grid item xs={6}>
                                    <TextField type="number" label="Completed" fullWidth {...register('completedTasks', { valueAsNumber: true })} />
                                </Grid>
                            </Grid>
                        </Box>

                        <Box sx={{ pt: 2, pb: 4, display: 'flex', gap: 2 }}>
                            <Button fullWidth variant="outlined" onClick={onClose} disabled={loading}>Cancel</Button>
                            <Button fullWidth variant="contained" type="submit" disabled={loading}>
                                {loading ? <CircularProgress size={24} /> : (initialData ? 'Update Project' : 'Launch Project')}
                            </Button>
                        </Box>
                    </Stack>
                </Box>
            </Box>
        </Drawer>
    );
}
