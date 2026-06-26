'use client';

import {
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
    IconButton,
    Typography,
    Box,
    Avatar,
    LinearProgress,
} from '@mui/material';
import {
    Visibility as ViewIcon,
    Edit as EditIcon,
    Delete as DeleteIcon,
} from '@mui/icons-material';
import StatusChip from '@/components/shared/StatusChip';
import PriorityChip from '@/components/shared/PriorityChip';
import dayjs from 'dayjs';
import { useRouter } from 'next/navigation';

interface ProjectTableProps {
    projects: any[];
    onEdit: (project: any) => void;
    onDelete: (id: string) => void;
}

export default function ProjectTable({ projects, onEdit, onDelete }: ProjectTableProps) {
    const router = useRouter();

    return (
        <TableContainer component={Paper} sx={{ borderRadius: 3, boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}>
            <Table>
                <TableHead sx={{ bgcolor: 'grey.50' }}>
                    <TableRow>
                        <TableCell sx={{ fontWeight: 700 }}>Project</TableCell>
                        <TableCell sx={{ fontWeight: 700 }}>Client</TableCell>
                        <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
                        <TableCell sx={{ fontWeight: 700 }}>Priority</TableCell>
                        <TableCell sx={{ fontWeight: 700 }}>Progress</TableCell>
                        <TableCell sx={{ fontWeight: 700 }}>Deadline</TableCell>
                        <TableCell sx={{ fontWeight: 700 }}>Manager</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 700 }}>Actions</TableCell>
                    </TableRow>
                </TableHead>
                <TableBody>
                    {projects.map((project) => (
                        <TableRow key={project._id} hover>
                            <TableCell>
                                <Typography variant="body2" sx={{ fontWeight: 700 }}>{project.name}</Typography>
                                <Typography variant="caption" color="text.secondary">{project.projectNumber} • {project.type}</Typography>
                            </TableCell>
                            <TableCell>
                                <Typography variant="body2">{project.clientId?.businessName}</Typography>
                            </TableCell>
                            <TableCell>
                                <StatusChip status={project.status} />
                            </TableCell>
                            <TableCell>
                                <PriorityChip priority={project.priority} />
                            </TableCell>
                            <TableCell sx={{ minWidth: 150 }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <Box sx={{ flexGrow: 1 }}>
                                        <LinearProgress
                                            variant="determinate"
                                            value={project.completionPercentage}
                                            sx={{ height: 6, borderRadius: 3 }}
                                        />
                                    </Box>
                                    <Typography variant="caption" sx={{ fontWeight: 700 }}>{project.completionPercentage}%</Typography>
                                </Box>
                                <Typography variant="caption" color="text.secondary">
                                    {project.completedTasks}/{project.totalTasks} Tasks
                                </Typography>
                            </TableCell>
                            <TableCell>
                                <Typography variant="body2">
                                    {project.deadline ? dayjs(project.deadline).format('DD MMM YYYY') : '-'}
                                </Typography>
                            </TableCell>
                            <TableCell>
                                <Avatar
                                    src={project.projectManager?.avatar}
                                    sx={{ width: 28, height: 28 }}
                                >
                                    {project.projectManager?.name?.charAt(0)}
                                </Avatar>
                            </TableCell>
                            <TableCell align="right">
                                <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 0.5 }}>
                                    <IconButton size="small" onClick={() => router.push(`/projects/${project._id}`)}>
                                        <ViewIcon fontSize="small" />
                                    </IconButton>
                                    <IconButton size="small" color="primary" onClick={() => onEdit(project)}>
                                        <EditIcon fontSize="small" />
                                    </IconButton>
                                    <IconButton size="small" color="error" onClick={() => onDelete(project._id)}>
                                        <DeleteIcon fontSize="small" />
                                    </IconButton>
                                </Box>
                            </TableCell>
                        </TableRow>
                    ))}
                    {projects.length === 0 && (
                        <TableRow>
                            <TableCell colSpan={8} align="center" sx={{ py: 8 }}>
                                <Typography color="text.secondary">No projects discovered.</Typography>
                            </TableCell>
                        </TableRow>
                    )}
                </TableBody>
            </Table>
        </TableContainer>
    );
}
