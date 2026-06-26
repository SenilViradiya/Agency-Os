'use client';

import { useState, useEffect } from 'react';
import {
    Box,
    Typography,
    TextField,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Checkbox,
    Button,
    CircularProgress,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
} from '@mui/material';

const modules = [
    'leads', 'clients', 'projects', 'tasks', 'scripts', 'shoots', 'editing',
    'thumbnails', 'captions', 'approvals', 'publishing', 'analytics',
    'users', 'roles', 'hr', 'finance', 'meetings', 'assets', 'vendors'
];

const actions = ['read', 'create', 'update', 'delete'];

interface RoleFormProps {
    open: boolean;
    onClose: () => void;
    onSubmit: (data: any) => void;
    initialData?: any;
    loading: boolean;
}

export default function RoleForm({ open, onClose, onSubmit, initialData, loading }: RoleFormProps) {
    const [name, setName] = useState('');
    const [slug, setSlug] = useState('');
    const [permissions, setPermissions] = useState<any[]>([]);

    useEffect(() => {
        if (initialData) {
            setName(initialData.name);
            setSlug(initialData.slug);
            setPermissions(initialData.permissions || []);
        } else {
            setName('');
            setSlug('');
            setPermissions(modules.map(m => ({ module: m, actions: [] })));
        }
    }, [initialData, open]);

    const handleTogglePermission = (module: string, action: string) => {
        setPermissions(prev => {
            const existing = prev.find(p => p.module === module);
            if (existing) {
                const newActions = existing.actions.includes(action)
                    ? existing.actions.filter((a: string) => a !== action)
                    : [...existing.actions, action];

                return prev.map(p => p.module === module ? { ...p, actions: newActions } : p);
            } else {
                return [...prev, { module, actions: [action] }];
            }
        });
    };

    const handleSave = () => {
        onSubmit({ name, slug, permissions });
    };

    return (
        <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
            <DialogTitle>{initialData ? 'Edit Role' : 'Add New Role'}</DialogTitle>
            <DialogContent>
                <Box sx={{ mt: 2, display: 'flex', gap: 2, mb: 4 }}>
                    <TextField
                        label="Role Name"
                        fullWidth
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        disabled={initialData?.isSystem}
                    />
                    <TextField
                        label="Slug"
                        fullWidth
                        value={slug}
                        onChange={(e) => setSlug(e.target.value)}
                        disabled={initialData} // Slug shouldn't change after creation
                    />
                </Box>

                <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1 }}>
                    Permissions Matrix
                </Typography>
                <TableContainer sx={{ maxHeight: 400 }}>
                    <Table stickyHeader size="small">
                        <TableHead>
                            <TableRow>
                                <TableCell>Module</TableCell>
                                {actions.map(action => (
                                    <TableCell key={action} align="center">{action.toUpperCase()}</TableCell>
                                ))}
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {modules.map(module => {
                                const modulePerm = permissions.find(p => p.module === module);
                                return (
                                    <TableRow key={module}>
                                        <TableCell sx={{ textTransform: 'capitalize' }}>{module}</TableCell>
                                        {actions.map(action => (
                                            <TableCell key={action} align="center">
                                                <Checkbox
                                                    size="small"
                                                    checked={modulePerm?.actions.includes(action) || false}
                                                    onChange={() => handleTogglePermission(module, action)}
                                                // System roles should ideally not have their core permissions removed, 
                                                // but for Phase 1 we allow it if the user wants to customize.
                                                />
                                            </TableCell>
                                        ))}
                                    </TableRow>
                                );
                            })}
                        </TableBody>
                    </Table>
                </TableContainer>
            </DialogContent>
            <DialogActions sx={{ p: 3 }}>
                <Button onClick={onClose}>Cancel</Button>
                <Button
                    variant="contained"
                    onClick={handleSave}
                    disabled={loading || !name || !slug}
                >
                    {loading ? <CircularProgress size={24} /> : 'Save Changes'}
                </Button>
            </DialogActions>
        </Dialog>
    );
}
