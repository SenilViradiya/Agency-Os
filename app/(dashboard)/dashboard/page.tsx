'use client';

import { Grid, Paper, Typography, Box, Card, CardContent, List } from '@mui/material';
import PageHeader from '@/components/shared/PageHeader';
import {
    PeopleAlt as PeopleIcon,
    Work as ProjectIcon,
    Assignment as TaskIcon,
    Payments as RevenueIcon
} from '@mui/icons-material';
import { useEffect, useState } from 'react';
import apiClient from '@/lib/apiClient';

const StatCard = ({ title, value, icon, color }: any) => (
    <Card sx={{ height: '100%' }}>
        <CardContent sx={{ display: 'flex', alignItems: 'center', p: 3 }}>
            <Box sx={{
                backgroundColor: `${color}15`,
                color: color,
                p: 1.5,
                borderRadius: 3,
                display: 'flex',
                mr: 2
            }}>
                {icon}
            </Box>
            <Box>
                <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>
                    {title}
                </Typography>
                <Typography variant="h5" sx={{ fontWeight: 800 }}>
                    {value}
                </Typography>
            </Box>
        </CardContent>
    </Card>
);

export default function DashboardPage() {
    const [stats, setStats] = useState({
        totalUsers: 0,
        activeProjects: 0,
        pendingTasks: 0,
        monthlyRevenue: '₹0'
    });

    useEffect(() => {
        // Fetch users count
        apiClient.get('/users').then(res => {
            if (res.data.success) {
                setStats(prev => ({ ...prev, totalUsers: res.data.data.length }));
            }
        }).catch(() => { });
    }, []);

    return (
        <>
            <PageHeader
                title="Dashboard Overview"
                subtitle="Welcome back to AgencyOS. Here is what's happening today."
            />

            <Grid container spacing={3} sx={{ mb: 4 }}>
                <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                    <StatCard title="Total Users" value={stats.totalUsers} icon={<PeopleIcon />} color="#6C63FF" />
                </Grid>
                <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                    <StatCard title="Active Projects" value={stats.activeProjects} icon={<ProjectIcon />} color="#4CAF50" />
                </Grid>
                <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                    <StatCard title="Pending Tasks" value={stats.pendingTasks} icon={<TaskIcon />} color="#FF9800" />
                </Grid>
                <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                    <StatCard title="Monthly Revenue" value={stats.monthlyRevenue} icon={<RevenueIcon />} color="#FF6584" />
                </Grid>
            </Grid>

            <Grid container spacing={3}>
                <Grid size={{ xs: 12, md: 8 }}>
                    <Paper sx={{ p: 4, height: 400, display: 'flex', flexDirection: 'column' }}>
                        <Typography variant="h6" sx={{ fontWeight: 700, mb: 3 }}>
                            Recent Activity
                        </Typography>
                        <Box sx={{ flexGrow: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f9f9f9', borderRadius: 2 }}>
                            <Typography color="text.secondary">No recent activity found.</Typography>
                        </Box>
                    </Paper>
                </Grid>
                <Grid size={{ xs: 12, md: 4 }}>
                    <Paper sx={{ p: 4, height: 400, display: 'flex', flexDirection: 'column' }}>
                        <Typography variant="h6" sx={{ fontWeight: 700, mb: 3 }}>
                            Quick Links
                        </Typography>
                        <List>
                            {/* Simplified list for now */}
                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                                <Typography variant="body2" sx={{ cursor: 'pointer', color: 'primary.main', fontWeight: 600 }}>Manage Users</Typography>
                                <Typography variant="body2" sx={{ cursor: 'pointer', color: 'primary.main', fontWeight: 600 }}>Configure Roles</Typography>
                                <Typography variant="body2" sx={{ color: 'text.disabled' }}>Add Lead (Coming Soon)</Typography>
                                <Typography variant="body2" sx={{ color: 'text.disabled' }}>Create Project (Coming Soon)</Typography>
                            </Box>
                        </List>
                    </Paper>
                </Grid>
            </Grid>
        </>
    );
}
