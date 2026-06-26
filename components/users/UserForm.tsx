'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
    Box,
    Button,
    TextField,
    MenuItem,
    Grid,
    CircularProgress,
} from '@mui/material';
import { useEffect } from 'react';

const userSchema = z.object({
    name: z.string().min(2, 'Name is required'),
    email: z.string().email('Invalid email address'),
    password: z.string().min(6, 'Password must be at least 6 characters').optional().or(z.literal('')),
    phone: z.string().optional(),
    role: z.string().min(1, 'Role is required'),
    department: z.string().min(1, 'Department is required'),
    designation: z.string().min(1, 'Designation is required'),
    status: z.enum(['active', 'inactive', 'suspended']),
});

type UserFormValues = z.infer<typeof userSchema>;

interface UserFormProps {
    initialData?: any;
    roles: any[];
    onSubmit: (data: UserFormValues) => void;
    loading: boolean;
    isEdit?: boolean;
}

export default function UserForm({ initialData, roles, onSubmit, loading, isEdit }: UserFormProps) {
    const {
        register,
        handleSubmit,
        reset,
        formState: { errors },
    } = useForm<UserFormValues>({
        resolver: zodResolver(userSchema),
        defaultValues: {
            status: 'active',
        },
    });

    useEffect(() => {
        if (initialData) {
            reset({
                ...initialData,
                role: initialData.role?._id || initialData.role,
                password: '', // Don't populate password
            });
        }
    }, [initialData, reset]);

    return (
        <form onSubmit={handleSubmit(onSubmit)}>
            <Grid container spacing={2}>
                <Grid size={{ xs: 12 }}>
                    <TextField
                        label="Full Name"
                        {...register('name')}
                        error={!!errors.name}
                        helperText={errors.name?.message}
                    />
                </Grid>
                <Grid size={{ xs: 12 }}>
                    <TextField
                        label="Email Address"
                        {...register('email')}
                        error={!!errors.email}
                        helperText={errors.email?.message}
                        disabled={isEdit}
                    />
                </Grid>
                {!isEdit && (
                    <Grid size={{ xs: 12 }}>
                        <TextField
                            label="Password"
                            type="password"
                            {...register('password')}
                            error={!!errors.password}
                            helperText={errors.password?.message}
                        />
                    </Grid>
                )}
                <Grid size={{ xs: 12, sm: 6 }}>
                    <TextField
                        label="Phone"
                        {...register('phone')}
                        error={!!errors.phone}
                        helperText={errors.phone?.message}
                    />
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                    <TextField
                        select
                        label="Role"
                        defaultValue=""
                        {...register('role')}
                        error={!!errors.role}
                        helperText={errors.role?.message}
                    >
                        {roles.map((role) => (
                            <MenuItem key={role._id} value={role._id}>
                                {role.name}
                            </MenuItem>
                        ))}
                    </TextField>
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                    <TextField
                        label="Department"
                        {...register('department')}
                        error={!!errors.department}
                        helperText={errors.department?.message}
                    />
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                    <TextField
                        label="Designation"
                        {...register('designation')}
                        error={!!errors.designation}
                        helperText={errors.designation?.message}
                    />
                </Grid>
                <Grid size={{ xs: 12 }}>
                    <TextField
                        select
                        label="Status"
                        {...register('status')}
                        error={!!errors.status}
                        helperText={errors.status?.message}
                    >
                        <MenuItem value="active">Active</MenuItem>
                        <MenuItem value="inactive">Inactive</MenuItem>
                        <MenuItem value="suspended">Suspended</MenuItem>
                    </TextField>
                </Grid>
            </Grid>

            <Box sx={{ mt: 4, display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
                <Button
                    type="submit"
                    variant="contained"
                    disabled={loading}
                    sx={{ minWidth: 120 }}
                >
                    {loading ? <CircularProgress size={24} /> : isEdit ? 'Update User' : 'Create User'}
                </Button>
            </Box>
        </form>
    );
}
