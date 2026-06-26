'use client';

import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    Grid,
    TextField,
    Typography,
    Box,
    MenuItem,
    FormControl,
    InputLabel,
    Select,
    CircularProgress,
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs from 'dayjs';
import UserSelect from '@/components/shared/UserSelect';

const convertSchema = z.object({
    contractStartDate: z.any().optional(),
    contractEndDate: z.any().optional(),
    monthlyRetainerValue: z.number().min(0).default(0),
    tier: z.enum(['standard', 'premium', 'enterprise']).default('standard'),
    assignedManager: z.string().min(1, 'Please assign a manager'),
    assignedTeam: z.array(z.string()).default([]),
});

type ConvertFormValues = z.infer<typeof convertSchema>;

interface ConvertToClientDialogProps {
    open: boolean;
    onClose: () => void;
    onConvert: (data: ConvertFormValues) => void;
    lead: any;
    loading: boolean;
}

export default function ConvertToClientDialog({ open, onClose, onConvert, lead, loading }: ConvertToClientDialogProps) {
    const {
        register,
        handleSubmit,
        control,
        formState: { errors },
    } = useForm<ConvertFormValues>({
        resolver: zodResolver(convertSchema),
        defaultValues: {
            monthlyRetainerValue: lead?.budget || 0,
            tier: 'standard',
            assignedManager: lead?.assignedTo?._id || lead?.assignedTo || '',
            assignedTeam: [],
        },
    });

    const handleFormSubmit = (data: ConvertFormValues) => {
        onConvert({
            ...data,
            contractStartDate: data.contractStartDate ? data.contractStartDate.toDate() : null,
            contractEndDate: data.contractEndDate ? data.contractEndDate.toDate() : null,
        });
    };

    if (!lead) return null;

    return (
        <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
            <DialogTitle sx={{ fontWeight: 800, textAlign: 'center', pt: 4 }}>
                Convert Lead to Client 🎉
            </DialogTitle>
            <DialogContent>
                <Box sx={{ mb: 4, p: 2, bgcolor: 'grey.50', borderRadius: 2 }}>
                    <Typography variant="body2" color="text.secondary">Business Name</Typography>
                    <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1 }}>{lead.businessName}</Typography>
                    <Typography variant="body2" color="text.secondary">Contact Person</Typography>
                    <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>{lead.name}</Typography>
                </Box>

                <Box component="form" sx={{ mt: 2 }}>
                    <Grid container spacing={3}>
                        <Grid item xs={12}>
                            <TextField
                                label="Monthly Retainer Value (₹)"
                                type="number"
                                fullWidth
                                {...register('monthlyRetainerValue', { valueAsNumber: true })}
                                error={!!errors.monthlyRetainerValue}
                            />
                        </Grid>
                        <Grid item xs={12}>
                            <FormControl fullWidth>
                                <InputLabel>Client Tier</InputLabel>
                                <Controller
                                    name="tier"
                                    control={control}
                                    render={({ field }) => (
                                        <Select {...field} label="Client Tier">
                                            <MenuItem value="standard">Standard</MenuItem>
                                            <MenuItem value="premium">Premium</MenuItem>
                                            <MenuItem value="enterprise">Enterprise</MenuItem>
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
                                        <DatePicker
                                            label="Contract Start"
                                            sx={{ width: '100%' }}
                                            value={field.value}
                                            onChange={field.onChange}
                                        />
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
                                        <DatePicker
                                            label="Contract End"
                                            sx={{ width: '100%' }}
                                            value={field.value}
                                            onChange={field.onChange}
                                        />
                                    )}
                                />
                            </LocalizationProvider>
                        </Grid>
                        <Grid item xs={12}>
                            <Controller
                                name="assignedManager"
                                control={control}
                                render={({ field }) => (
                                    <UserSelect
                                        label="Assigned Manager"
                                        value={field.value}
                                        onChange={field.onChange}
                                        error={!!errors.assignedManager}
                                        helperText={errors.assignedManager?.message}
                                    />
                                )}
                            />
                        </Grid>
                        <Grid item xs={12}>
                            <Controller
                                name="assignedTeam"
                                control={control}
                                render={({ field }) => (
                                    <UserSelect
                                        label="Project Team Members"
                                        value={field.value}
                                        onChange={field.onChange}
                                        multiple
                                    />
                                )}
                            />
                        </Grid>
                    </Grid>
                </Box>
            </DialogContent>
            <DialogActions sx={{ p: 4, pt: 0 }}>
                <Button onClick={onClose} disabled={loading}>Cancel</Button>
                <Button
                    variant="contained"
                    onClick={handleSubmit(handleFormSubmit)}
                    disabled={loading}
                    sx={{ px: 4 }}
                >
                    {loading ? <CircularProgress size={24} color="inherit" /> : 'Convert & Create Client →'}
                </Button>
            </DialogActions>
        </Dialog>
    );
}
