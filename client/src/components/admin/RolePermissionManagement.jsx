import React, { useState, useEffect } from 'react';
import {
    Box,
    Typography,
    Paper,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    FormControlLabel,
    Switch,
    Button,
    Chip,
    Snackbar,
    Alert,
    CircularProgress,
    Divider,
    Card,
    CardContent,
    CardHeader,
    Grid,
    Tooltip,
    IconButton
} from '@mui/material';
import { InfoOutlined, Save, Refresh } from '@mui/icons-material';
import axios from 'axios';

// Define the roles and features for the permission matrix
const roles = ['admin', 'organizer', 'judge', 'sponsor', 'participant'];
const modulePermissions = {
    events: ['view', 'create', 'update', 'delete'],
    users: ['view', 'create', 'update', 'delete'],
    teams: ['view', 'create', 'update', 'delete'],
    sponsors: ['view', 'create', 'update', 'delete'],
    accommodations: ['view', 'create', 'update', 'delete'],
    payments: ['view', 'create', 'update', 'delete'],
    reports: ['view', 'export'],
    analytics: ['view'],
    judges: ['view', 'assign', 'evaluate']
};

const RolePermissionManagement = () => {
    const [permissions, setPermissions] = useState({});
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [alert, setAlert] = useState({ open: false, message: '', severity: 'success' });
    const [permissionsChanged, setPermissionsChanged] = useState(false);

    // Fetch permissions on component mount
    useEffect(() => {
        fetchPermissions();
    }, []);

    // Fetch permissions from the API
    const fetchPermissions = async () => {
        try {
            setLoading(true);
            // In a real implementation, this would call the API to get current permissions
            const response = await axios.get('/api/admin/permissions', {
                headers: {
                    Authorization: `Bearer ${localStorage.getItem('token')}`
                }
            });

            // If API isn't implemented yet, use default permissions based on roles
            const fetchedPermissions = response.data?.permissions || generateDefaultPermissions();
            setPermissions(fetchedPermissions);
            setPermissionsChanged(false);
            setLoading(false);
        } catch (error) {
            console.error('Error fetching permissions:', error);
            // If API fails, use default permissions
            setPermissions(generateDefaultPermissions());
            setAlert({
                open: true,
                message: 'Failed to fetch current permissions. Showing defaults instead.',
                severity: 'warning'
            });
            setLoading(false);
        }
    };

    // Generate default permissions for each role
    const generateDefaultPermissions = () => {
        const defaultPermissions = {};

        roles.forEach(role => {
            defaultPermissions[role] = {};

            Object.keys(modulePermissions).forEach(module => {
                defaultPermissions[role][module] = {};

                modulePermissions[module].forEach(action => {
                    // Set default permissions based on role
                    if (role === 'admin') {
                        // Admins have all permissions
                        defaultPermissions[role][module][action] = true;
                    } else if (role === 'organizer') {
                        // Organizers can view everything, manage most things except users/admin functions
                        defaultPermissions[role][module][action] = (
                            action === 'view' ||
                            (module !== 'users' && module !== 'analytics' && action !== 'delete') ||
                            (module === 'analytics' && action === 'view')
                        );
                    } else if (role === 'judge') {
                        // Judges can view events, teams, and perform evaluations
                        defaultPermissions[role][module][action] = (
                            (module === 'events' && action === 'view') ||
                            (module === 'teams' && action === 'view') ||
                            (module === 'judges' && (action === 'view' || action === 'evaluate'))
                        );
                    } else if (role === 'sponsor') {
                        // Sponsors can view events and manage their sponsorship profiles
                        defaultPermissions[role][module][action] = (
                            (module === 'events' && action === 'view') ||
                            (module === 'sponsors' && (action === 'view' || action === 'update'))
                        );
                    } else {
                        // Participants can view events, manage their team
                        defaultPermissions[role][module][action] = (
                            (module === 'events' && action === 'view') ||
                            (module === 'teams' && (action === 'view' || action === 'create' || action === 'update')) ||
                            (module === 'accommodations' && action === 'view')
                        );
                    }
                });
            });
        });

        return defaultPermissions;
    };

    // Handle permission toggle
    const handlePermissionChange = (role, module, action) => {
        setPermissions(prevPermissions => {
            const newPermissions = { ...prevPermissions };
            newPermissions[role][module][action] = !newPermissions[role][module][action];
            setPermissionsChanged(true);
            return newPermissions;
        });
    };

    // Save permissions
    const savePermissions = async () => {
        try {
            setSaving(true);
            // In a real implementation, this would call the API to save permissions
            await axios.put('/api/admin/permissions', { permissions }, {
                headers: {
                    Authorization: `Bearer ${localStorage.getItem('token')}`
                }
            });

            setAlert({
                open: true,
                message: 'Permissions saved successfully!',
                severity: 'success'
            });
            setPermissionsChanged(false);
            setSaving(false);
        } catch (error) {
            console.error('Error saving permissions:', error);
            setAlert({
                open: true,
                message: 'Failed to save permissions. Please try again.',
                severity: 'error'
            });
            setSaving(false);
        }
    };

    // Reset permissions to defaults
    const resetToDefaults = () => {
        setPermissions(generateDefaultPermissions());
        setPermissionsChanged(true);
        setAlert({
            open: true,
            message: 'Permissions reset to defaults. Click Save to apply changes.',
            severity: 'info'
        });
    };

    // Get permission description
    const getPermissionDescription = (module, action) => {
        const descriptions = {
            events: {
                view: 'View event details and listings',
                create: 'Create new events',
                update: 'Modify existing events',
                delete: 'Remove events from the system'
            },
            users: {
                view: 'View user profiles and listings',
                create: 'Create new user accounts',
                update: 'Modify user information',
                delete: 'Delete user accounts'
            },
            // Add descriptions for other modules...
        };

        return descriptions[module]?.[action] || `${action} ${module}`;
    };

    return (
        <Box sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3, alignItems: 'center' }}>
                <Typography variant="h4">Role Permission Management</Typography>

                <Box>
                    <Button
                        variant="outlined"
                        color="primary"
                        startIcon={<Refresh />}
                        onClick={resetToDefaults}
                        sx={{ mr: 2 }}
                        disabled={loading || saving}
                    >
                        Reset to Defaults
                    </Button>

                    <Button
                        variant="contained"
                        color="primary"
                        startIcon={<Save />}
                        onClick={savePermissions}
                        disabled={!permissionsChanged || loading || saving}
                    >
                        {saving ? 'Saving...' : 'Save Changes'}
                    </Button>
                </Box>
            </Box>

            <Typography variant="body1" sx={{ mb: 3 }}>
                Manage what each user role can access and modify in the system. Changes will affect all users with the specified role.
            </Typography>

            {loading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', my: 5 }}>
                    <CircularProgress />
                </Box>
            ) : (
                <Grid container spacing={3}>
                    {Object.keys(modulePermissions).map((module) => (
                        <Grid item xs={12} key={module}>
                            <Card>
                                <CardHeader
                                    title={
                                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                            <Typography variant="h6" sx={{ textTransform: 'capitalize' }}>
                                                {module} Management
                                            </Typography>
                                            <Tooltip title={`Permissions for the ${module} module`}>
                                                <IconButton size="small">
                                                    <InfoOutlined fontSize="small" />
                                                </IconButton>
                                            </Tooltip>
                                        </Box>
                                    }
                                />
                                <Divider />
                                <CardContent sx={{ p: 0 }}>
                                    <TableContainer>
                                        <Table size="small">
                                            <TableHead>
                                                <TableRow>
                                                    <TableCell sx={{ fontWeight: 'bold' }}>Permission</TableCell>
                                                    {roles.map((role) => (
                                                        <TableCell key={role} align="center" sx={{ fontWeight: 'bold' }}>
                                                            <Chip
                                                                label={role.charAt(0).toUpperCase() + role.slice(1)}
                                                                color={
                                                                    role === 'admin'
                                                                        ? 'error'
                                                                        : role === 'organizer'
                                                                            ? 'primary'
                                                                            : role === 'judge'
                                                                                ? 'secondary'
                                                                                : role === 'sponsor'
                                                                                    ? 'warning'
                                                                                    : 'default'
                                                                }
                                                                size="small"
                                                                sx={{ textTransform: 'capitalize' }}
                                                            />
                                                        </TableCell>
                                                    ))}
                                                </TableRow>
                                            </TableHead>
                                            <TableBody>
                                                {modulePermissions[module].map((action) => (
                                                    <TableRow key={`${module}-${action}`}>
                                                        <TableCell>
                                                            <Tooltip title={getPermissionDescription(module, action)}>
                                                                <Typography
                                                                    variant="body2"
                                                                    sx={{ textTransform: 'capitalize', display: 'flex', alignItems: 'center' }}
                                                                >
                                                                    {action} {module}
                                                                </Typography>
                                                            </Tooltip>
                                                        </TableCell>
                                                        {roles.map((role) => (
                                                            <TableCell key={`${role}-${module}-${action}`} align="center">
                                                                <FormControlLabel
                                                                    control={
                                                                        <Switch
                                                                            checked={permissions[role]?.[module]?.[action] || false}
                                                                            onChange={() => handlePermissionChange(role, module, action)}
                                                                            disabled={role === 'admin' && module === 'users' && (action === 'view' || action === 'update')}
                                                                            size="small"
                                                                        />
                                                                    }
                                                                    label=""
                                                                />
                                                            </TableCell>
                                                        ))}
                                                    </TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>
                                    </TableContainer>
                                </CardContent>
                            </Card>
                        </Grid>
                    ))}
                </Grid>
            )}

            {/* Alert Snackbar */}
            <Snackbar
                open={alert.open}
                autoHideDuration={6000}
                onClose={() => setAlert({ ...alert, open: false })}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
            >
                <Alert
                    onClose={() => setAlert({ ...alert, open: false })}
                    severity={alert.severity}
                    variant="filled"
                >
                    {alert.message}
                </Alert>
            </Snackbar>
        </Box>
    );
};

export default RolePermissionManagement;