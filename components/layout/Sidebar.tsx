'use client';

import {
    Box,
    Drawer,
    List,
    ListItem,
    ListItemButton,
    ListItemIcon,
    ListItemText,
    Typography,
    Divider,
    Avatar,
    Tooltip,
    IconButton
} from '@mui/material';
import {
    Dashboard as DashboardIcon,
    People as PeopleIcon,
    AdminPanelSettings as AdminPanelSettingsIcon,
    Logout as LogoutIcon,
    ChevronLeft as ChevronLeftIcon,
    Assignment as LeadsIcon,
    Business as ClientsIcon,
    Work as ProjectsIcon,
} from '@mui/icons-material';
import { usePathname, useRouter } from 'next/navigation';
import { signOut, useSession } from 'next-auth/react';

const drawerWidth = 260;

const menuItems = [
    { text: 'Dashboard', icon: <DashboardIcon />, path: '/dashboard', module: 'dashboard', action: 'read' },
    { text: 'Leads', icon: <LeadsIcon />, path: '/leads', module: 'leads', action: 'read' },
    { text: 'Clients', icon: <ClientsIcon />, path: '/clients', module: 'clients', action: 'read' },
    { text: 'Projects', icon: <ProjectsIcon />, path: '/projects', module: 'projects', action: 'read' },
    { text: 'Users', icon: <PeopleIcon />, path: '/users', module: 'users', action: 'read' },
    { text: 'Roles', icon: <AdminPanelSettingsIcon />, path: '/roles', module: 'roles', action: 'read' },
];

const futureModules = [
    { text: 'Finance', path: '#', module: 'finance' },
    { text: 'Meeting', path: '#', module: 'meetings' },
];


export default function Sidebar({ open, toggleDrawer }: { open: boolean, toggleDrawer: () => void }) {
    const pathname = usePathname();
    const router = useRouter();
    const { data: session } = useSession();

    const handleLogout = async () => {
        await signOut({ callbackUrl: '/login' });
    };

    const currentRole = (session?.user as any)?.role;

    const filteredMenuItems = menuItems.filter(item => {
        if (item.path === '/dashboard') return true;
        if (item.path === '/roles' && currentRole !== 'Super Admin') return false;
        // Simple check for now, can be expanded with hasPermission helper
        return true;
    });

    return (
        <Drawer
            variant="permanent"
            sx={{
                width: open ? drawerWidth : 70,
                flexShrink: 0,
                '& .MuiDrawer-paper': {
                    width: open ? drawerWidth : 70,
                    boxSizing: 'border-box',
                    backgroundColor: '#1A1A2E',
                    color: 'white',
                    transition: 'width 0.3s',
                    overflowX: 'hidden',
                    display: 'flex',
                    flexDirection: 'column',
                },
            }}
        >
            <Box sx={{ p: 2, display: 'flex', alignItems: 'center', justifyContent: open ? 'space-between' : 'center', height: 64 }}>
                {open && (
                    <Typography variant="h6" sx={{ fontWeight: 800, color: 'primary.main' }}>
                        AgencyOS
                    </Typography>
                )}
                <IconButton onClick={toggleDrawer} sx={{ color: 'white' }}>
                    <ChevronLeftIcon sx={{ transform: open ? 'rotate(0deg)' : 'rotate(180deg)', transition: 'transform 0.3s' }} />
                </IconButton>
            </Box>

            <Divider sx={{ borderColor: 'rgba(255,255,255,0.1)' }} />

            <List sx={{ px: 1, mt: 1 }}>
                {filteredMenuItems.map((item) => (
                    <ListItem key={item.text} disablePadding sx={{ display: 'block', mb: 0.5 }}>
                        <ListItemButton
                            onClick={() => router.push(item.path)}
                            selected={pathname.startsWith(item.path)}
                            sx={{
                                minHeight: 48,
                                justifyContent: open ? 'initial' : 'center',
                                px: 2.5,
                                borderRadius: 2,
                                '&.Mui-selected': {
                                    backgroundColor: 'primary.main',
                                    '&:hover': {
                                        backgroundColor: 'primary.dark',
                                    },
                                },
                                '&:hover': {
                                    backgroundColor: 'rgba(255,255,255,0.05)',
                                },
                            }}
                        >
                            <ListItemIcon
                                sx={{
                                    minWidth: 0,
                                    mr: open ? 2 : 'auto',
                                    justifyContent: 'center',
                                    color: pathname.startsWith(item.path) ? 'white' : 'rgba(255,255,255,0.7)',
                                }}
                            >
                                {item.icon}
                            </ListItemIcon>
                            <ListItemText
                                primary={item.text}
                                sx={{
                                    opacity: open ? 1 : 0,
                                    '& .MuiListItemText-primary': {
                                        fontWeight: pathname.startsWith(item.path) ? 700 : 500,
                                    }
                                }}
                            />
                        </ListItemButton>
                    </ListItem>
                ))}

                {open && (
                    <Typography variant="overline" sx={{ px: 3, mt: 2, display: 'block', color: 'rgba(255,255,255,0.4)' }}>
                        Coming Soon
                    </Typography>
                )}

                {futureModules.map((item) => (
                    <ListItem key={item.text} disablePadding sx={{ display: 'block', opacity: 0.5 }}>
                        <Tooltip title={!open ? item.text : "Coming Soon"} placement="right">
                            <ListItemButton
                                disabled
                                sx={{
                                    minHeight: 48,
                                    justifyContent: open ? 'initial' : 'center',
                                    px: 2.5,
                                    borderRadius: 2,
                                }}
                            >
                                <ListItemIcon
                                    sx={{
                                        minWidth: 0,
                                        mr: open ? 2 : 'auto',
                                        justifyContent: 'center',
                                        color: 'rgba(255,255,255,0.3)',
                                    }}
                                >
                                    <DashboardIcon />
                                </ListItemIcon>
                                <ListItemText primary={item.text} sx={{ opacity: open ? 1 : 0 }} />
                            </ListItemButton>
                        </Tooltip>
                    </ListItem>
                ))}
            </List>

            <Box sx={{ mt: 'auto', p: 2 }}>
                <Divider sx={{ borderColor: 'rgba(255,255,255,0.1)', mb: 2 }} />
                <Box sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: open ? 'flex-start' : 'center',
                    gap: 2,
                    px: open ? 1 : 0
                }}>
                    <Avatar
                        src={session?.user?.image || undefined}
                        sx={{ width: 40, height: 40, bgcolor: 'primary.main', fontWeight: 700 }}
                    >
                        {session?.user?.name?.charAt(0)}
                    </Avatar>
                    {open && (
                        <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                            <Typography variant="body2" sx={{ fontWeight: 700 }} noWrap>
                                {session?.user?.name}
                            </Typography>
                            <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.5)' }} noWrap>
                                {currentRole}
                            </Typography>
                        </Box>
                    )}
                </Box>
                <ListItemButton
                    onClick={handleLogout}
                    sx={{
                        mt: 2,
                        borderRadius: 2,
                        color: '#FF6584',
                        justifyContent: open ? 'initial' : 'center',
                        px: 2.5,
                        '&:hover': {
                            backgroundColor: 'rgba(255, 101, 132, 0.1)',
                        }
                    }}
                >
                    <ListItemIcon sx={{ minWidth: 0, mr: open ? 2 : 'auto', color: '#FF6584' }}>
                        <LogoutIcon />
                    </ListItemIcon>
                    <ListItemText primary="Logout" sx={{ opacity: open ? 1 : 0 }} />
                </ListItemButton>
            </Box>
        </Drawer>
    );
}
