import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import {
    AppBar,
    Box,
    CssBaseline,
    Drawer,
    IconButton,
    Toolbar,
    Typography,
    List,
    ListItem,
    ListItemIcon,
    ListItemText,
    Container,
    Divider,
    Button
} from '@mui/material';
import {
    Menu as MenuIcon,
    Dashboard as DashboardIcon,
    Event as EventIcon,
    People as TeamIcon,
    AccountCircle as ProfileIcon,
    Logout as LogoutIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

// Drawer width for desktop
const drawerWidth = 240;

const MainLayout = () => {
    const [mobileOpen, setMobileOpen] = useState(false);
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    // Handle drawer toggle
    const handleDrawerToggle = () => {
        setMobileOpen(!mobileOpen);
    };

    // Handle logout
    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    // Get navigation items based on user role
    const getNavItems = () => {
        const baseItems = [
            { text: 'Dashboard', icon: <DashboardIcon />, path: `/${user?.role}/dashboard` },
            { text: 'Profile', icon: <ProfileIcon />, path: '/profile' },
        ];

        // Add role-specific menu items
        switch (user?.role) {
            case 'admin':
                return [
                    ...baseItems,
                    { text: 'Events', icon: <EventIcon />, path: '/admin/events' },
                    { text: 'Teams', icon: <TeamIcon />, path: '/admin/teams' },
                ];
            case 'organizer':
                return [
                    ...baseItems,
                    { text: 'Events', icon: <EventIcon />, path: '/organizer/events' },
                ];
            case 'judge':
                return [
                    ...baseItems,
                    { text: 'Assigned Events', icon: <EventIcon />, path: '/judge/events' },
                ];
            case 'sponsor':
                return [
                    ...baseItems,
                    { text: 'Sponsorships', icon: <EventIcon />, path: '/sponsor/sponsorships' },
                ];
            case 'participant':
                return [
                    ...baseItems,
                    { text: 'Events', icon: <EventIcon />, path: '/participant/events' },
                    { text: 'My Team', icon: <TeamIcon />, path: '/participant/team' },
                ];
            default:
                return baseItems;
        }
    };

    const drawer = (
        <div>
            <Toolbar>
                <Typography variant="h6" noWrap component="div">
                    Event Management
                </Typography>
            </Toolbar>
            <Divider />
            <List>
                {getNavItems().map((item) => (
                    <ListItem
                        key={item.text}
                        onClick={() => navigate(item.path)}
                        component="div"
                        sx={{ cursor: 'pointer' }}
                    >
                        <ListItemIcon>{item.icon}</ListItemIcon>
                        <ListItemText primary={item.text} />
                    </ListItem>
                ))}
                <Divider />
                <ListItem
                    onClick={handleLogout}
                    component="div"
                    sx={{ cursor: 'pointer' }}
                >
                    <ListItemIcon><LogoutIcon /></ListItemIcon>
                    <ListItemText primary="Logout" />
                </ListItem>
            </List>
        </div>
    );

    return (
        <Box sx={{ display: 'flex' }}>
            <CssBaseline />
            <AppBar
                position="fixed"
                sx={{
                    width: { sm: `calc(100% - ${drawerWidth}px)` },
                    ml: { sm: `${drawerWidth}px` },
                }}
            >
                <Toolbar>
                    <IconButton
                        color="inherit"
                        aria-label="open drawer"
                        edge="start"
                        onClick={handleDrawerToggle}
                        sx={{ mr: 2, display: { sm: 'none' } }}
                    >
                        <MenuIcon />
                    </IconButton>
                    <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1 }}>
                        {user?.role?.charAt(0).toUpperCase() + user?.role?.slice(1)} Dashboard
                    </Typography>
                    <Box sx={{ display: { xs: 'none', sm: 'block' } }}>
                        <Button color="inherit" onClick={handleLogout}>
                            Logout
                        </Button>
                    </Box>
                </Toolbar>
            </AppBar>
            <Box
                component="nav"
                sx={{ width: { sm: drawerWidth }, flexShrink: { sm: 0 } }}
            >
                {/* Mobile drawer */}
                <Drawer
                    variant="temporary"
                    open={mobileOpen}
                    onClose={handleDrawerToggle}
                    ModalProps={{
                        keepMounted: true, // Better mobile performance
                    }}
                    sx={{
                        display: { xs: 'block', sm: 'none' },
                        '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
                    }}
                >
                    {drawer}
                </Drawer>

                {/* Desktop drawer */}
                <Drawer
                    variant="permanent"
                    sx={{
                        display: { xs: 'none', sm: 'block' },
                        '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
                    }}
                    open
                >
                    {drawer}
                </Drawer>
            </Box>

            {/* Main content */}
            <Box
                component="main"
                sx={{
                    flexGrow: 1,
                    p: 3,
                    width: { sm: `calc(100% - ${drawerWidth}px)` },
                    marginTop: '64px',
                }}
            >
                <Container maxWidth="lg">
                    <Outlet />
                </Container>
            </Box>
        </Box>
    );
};

export default MainLayout;