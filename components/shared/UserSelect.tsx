import { useState, useEffect } from 'react';
import { FormControl, InputLabel, Select, MenuItem, Avatar, Box, Typography, CircularProgress } from '@mui/material';
import apiClient from '@/lib/apiClient';

interface UserSelectProps {
    value: string | string[];
    onChange: (value: any) => void;
    label: string;
    multiple?: boolean;
    error?: boolean;
    helperText?: string;
    disabled?: boolean;
}

export default function UserSelect({ value, onChange, label, multiple = false, error, helperText, disabled }: UserSelectProps) {
    const [users, setUsers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        apiClient.get('/users?limit=100').then(res => {
            if (res.data.success) {
                setUsers(res.data.data);
            }
        }).catch(err => {
            console.error('Failed to fetch users:', err);
        }).finally(() => {
            setLoading(false);
        });
    }, []);

    return (
        <FormControl fullWidth error={error} disabled={disabled || loading}>
            <InputLabel>{label}</InputLabel>
            <Select
                value={value}
                label={label}
                multiple={multiple}
                onChange={(e) => onChange(e.target.value)}
                renderValue={(selected: any) => {
                    if (multiple) {
                        const selectedUsers = users.filter(u => (selected as string[]).includes(u._id));
                        return (
                            <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                                {selectedUsers.map(user => (
                                    <Avatar key={user._id} src={user.avatar} sx={{ width: 24, height: 24 }}>
                                        {user.name.charAt(0)}
                                    </Avatar>
                                ))}
                            </Box>
                        );
                    }
                    const user = users.find(u => u._id === selected);
                    return user ? (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Avatar src={user.avatar} sx={{ width: 24, height: 24 }}>
                                {user.name.charAt(0)}
                            </Avatar>
                            <Typography variant="body2">{user.name}</Typography>
                        </Box>
                    ) : selected;
                }}
            >
                {loading ? (
                    <MenuItem disabled>
                        <CircularProgress size={20} sx={{ mr: 1 }} />
                        Loading users...
                    </MenuItem>
                ) : (
                    users.map((user) => (
                        <MenuItem key={user._id} value={user._id}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <Avatar src={user.avatar} sx={{ width: 32, height: 32 }}>
                                    {user.name.charAt(0)}
                                </Avatar>
                                <Box>
                                    <Typography variant="body2" sx={{ fontWeight: 600 }}>{user.name}</Typography>
                                    <Typography variant="caption" color="text.secondary">{user.email}</Typography>
                                </Box>
                            </Box>
                        </MenuItem>
                    ))
                )}
            </Select>
            {helperText && <Typography variant="caption" color="error" sx={{ mt: 0.5, ml: 1.5 }}>{helperText}</Typography>}
        </FormControl>
    );
}
