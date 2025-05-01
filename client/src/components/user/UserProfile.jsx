import React, { useState, useEffect } from 'react';
import {
    Box,
    Typography,
    Paper,
    Grid,
    TextField,
    Button,
    CircularProgress,
    Alert,
    Snackbar,
    Avatar,
    IconButton,
    Divider,
    Card,
    CardContent,
    Tab,
    Tabs,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions
} from '@mui/material';
import {
    Save as SaveIcon,
    Edit as EditIcon,
    Key as KeyIcon,
    Person as PersonIcon
} from '@mui/icons-material';
import { useAuth } from '../../context/AuthContext';
import { userService } from '../../services/api';

const UserProfile = () => {
    const { user, updateUser } = useAuth();
    const [loading, setLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [tabValue, setTabValue] = useState(0);
    const [passwordDialog, setPasswordDialog] = useState(false);

    const [profile, setProfile] = useState({
        name: '',
        email: '',
        role: ''
    });

    const [passwordData, setPasswordData] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
    });

    const [alert, setAlert] = useState({
        open: false,
        message: '',
        severity: 'success'
    });

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                setLoading(true);
                const response = await userService.getProfile();

                const profileData = response.data.user;
                setProfile({
                    name: profileData.name || '',
                    email: profileData.email || '',
                    role: profileData.role || ''
                });

                setLoading(false);
            } catch (error) {
                console.error('Error fetching user profile:', error);
                setAlert({
                    open: true,
                    message: 'Failed to load user profile',
                    severity: 'error'
                });
                setLoading(false);
            }
        };

        if (user) {
            fetchProfile();
        }
    }, [user]);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setProfile(prevProfile => ({
            ...prevProfile,
            [name]: value
        }));
    };

    const handlePasswordInputChange = (e) => {
        const { name, value } = e.target;
        setPasswordData(prevData => ({
            ...prevData,
            [name]: value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!profile.name || !profile.email) {
            setAlert({
                open: true,
                message: 'Name and email are required',
                severity: 'error'
            });
            return;
        }

        try {
            setIsSaving(true);
            await userService.updateProfile(profile);

            // Update local user context
            updateUser({
                ...user,
                name: profile.name,
                email: profile.email
            });

            setIsEditing(false);
            setAlert({
                open: true,
                message: 'Profile updated successfully',
                severity: 'success'
            });
        } catch (error) {
            console.error('Error saving user profile:', error);
            setAlert({
                open: true,
                message: error.response?.data?.message || 'Failed to update profile',
                severity: 'error'
            });
        } finally {
            setIsSaving(false);
        }
    };

    const handleChangePassword = async (e) => {
        e.preventDefault();

        // Validate password fields
        if (!passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmPassword) {
            setAlert({
                open: true,
                message: 'All password fields are required',
                severity: 'error'
            });
            return;
        }

        if (passwordData.newPassword !== passwordData.confirmPassword) {
            setAlert({
                open: true,
                message: 'New passwords do not match',
                severity: 'error'
            });
            return;
        }

        if (passwordData.newPassword.length < 6) {
            setAlert({
                open: true,
                message: 'New password must be at least 6 characters',
                severity: 'error'
            });
            return;
        }

        try {
            setIsSaving(true);
            await userService.changePassword({
                currentPassword: passwordData.currentPassword,
                newPassword: passwordData.newPassword
            });

            setPasswordDialog(false);
            setPasswordData({
                currentPassword: '',
                newPassword: '',
                confirmPassword: ''
            });

            setAlert({
                open: true,
                message: 'Password changed successfully',
                severity: 'success'
            });
        } catch (error) {
            console.error('Error changing password:', error);
            setAlert({
                open: true,
                message: error.response?.data?.message || 'Failed to change password',
                severity: 'error'
            });
        } finally {
            setIsSaving(false);
        }
    };

    const handleToggleEdit = () => {
        setIsEditing(!isEditing);
    };

    const handleCloseAlert = () => {
        setAlert({
            ...alert,
            open: false
        });
    };

    const handleTabChange = (event, newValue) => {
        setTabValue(newValue);
    };

    const getRoleLabel = (role) => {
        switch (role) {
            case 'admin': return 'Administrator';
            case 'organizer': return 'Event Organizer';
            case 'judge': return 'Event Judge';
            case 'sponsor': return 'Event Sponsor';
            case 'participant': return 'Event Participant';
            default: return role;
        }
    };

    if (loading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
                <CircularProgress />
            </Box>
        );
    }

    return (
        <Box sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h4">My Profile</Typography>

                {!isEditing && (
                    <Box>
                        <Button
                            variant="outlined"
                            startIcon={<EditIcon />}
                            onClick={handleToggleEdit}
                            sx={{ mr: 2 }}
                        >
                            Edit Profile
                        </Button>
                        <Button
                            variant="outlined"
                            color="secondary"
                            startIcon={<KeyIcon />}
                            onClick={() => setPasswordDialog(true)}
                        >
                            Change Password
                        </Button>
                    </Box>
                )}
            </Box>

            <Paper sx={{ mb: 3 }}>
                <Tabs
                    value={tabValue}
                    onChange={handleTabChange}
                    sx={{ borderBottom: 1, borderColor: 'divider' }}
                >
                    <Tab label="Profile Details" icon={<PersonIcon />} iconPosition="start" />
                </Tabs>

                <Box sx={{ p: 3 }}>
                    {tabValue === 0 && (
                        <>
                            {!isEditing ? (
                                <Card>
                                    <CardContent>
                                        <Grid container spacing={2}>
                                            <Grid item xs={12} md={3} sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', flexDirection: 'column' }}>
                                                <Avatar
                                                    sx={{
                                                        width: 120,
                                                        height: 120,
                                                        fontSize: '3rem',
                                                        bgcolor: 'primary.main',
                                                        mb: 2
                                                    }}
                                                >
                                                    {profile.name ? profile.name.charAt(0).toUpperCase() : 'U'}
                                                </Avatar>
                                                <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center' }}>
                                                    {getRoleLabel(profile.role)}
                                                </Typography>
                                            </Grid>

                                            <Grid item xs={12} md={9}>
                                                <Grid container spacing={2}>
                                                    <Grid item xs={12}>
                                                        <Typography variant="h5" gutterBottom>
                                                            {profile.name}
                                                        </Typography>
                                                        <Divider sx={{ mb: 2 }} />
                                                    </Grid>

                                                    <Grid item xs={12} sm={6}>
                                                        <Typography variant="subtitle2" color="text.secondary">
                                                            Email Address
                                                        </Typography>
                                                        <Typography variant="body1" gutterBottom>
                                                            {profile.email}
                                                        </Typography>
                                                    </Grid>

                                                    <Grid item xs={12} sm={6}>
                                                        <Typography variant="subtitle2" color="text.secondary">
                                                            Role
                                                        </Typography>
                                                        <Typography variant="body1" gutterBottom>
                                                            {getRoleLabel(profile.role)}
                                                        </Typography>
                                                    </Grid>
                                                </Grid>
                                            </Grid>
                                        </Grid>
                                    </CardContent>
                                </Card>
                            ) : (
                                <form onSubmit={handleSubmit}>
                                    <Grid container spacing={3}>
                                        <Grid item xs={12}>
                                            <Typography variant="h6" gutterBottom>
                                                Personal Information
                                            </Typography>
                                            <Divider sx={{ mb: 2 }} />
                                        </Grid>

                                        <Grid item xs={12} sm={6}>
                                            <TextField
                                                required
                                                fullWidth
                                                id="name"
                                                name="name"
                                                label="Full Name"
                                                value={profile.name}
                                                onChange={handleInputChange}
                                                disabled={isSaving}
                                            />
                                        </Grid>

                                        <Grid item xs={12} sm={6}>
                                            <TextField
                                                required
                                                fullWidth
                                                id="email"
                                                name="email"
                                                label="Email Address"
                                                type="email"
                                                value={profile.email}
                                                onChange={handleInputChange}
                                                disabled={isSaving}
                                            />
                                        </Grid>

                                        <Grid item xs={12} sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end' }}>
                                            <Button
                                                onClick={handleToggleEdit}
                                                disabled={isSaving}
                                                sx={{ mr: 2 }}
                                            >
                                                Cancel
                                            </Button>
                                            <Button
                                                type="submit"
                                                variant="contained"
                                                color="primary"
                                                startIcon={<SaveIcon />}
                                                disabled={isSaving}
                                            >
                                                {isSaving ? 'Saving...' : 'Save Changes'}
                                            </Button>
                                        </Grid>
                                    </Grid>
                                </form>
                            )}
                        </>
                    )}
                </Box>
            </Paper>

            {/* Change Password Dialog */}
            <Dialog
                open={passwordDialog}
                onClose={() => setPasswordDialog(false)}
                maxWidth="sm"
                fullWidth
            >
                <DialogTitle>Change Password</DialogTitle>
                <DialogContent>
                    <Grid container spacing={2} sx={{ mt: 1 }}>
                        <Grid item xs={12}>
                            <TextField
                                required
                                fullWidth
                                margin="dense"
                                id="currentPassword"
                                name="currentPassword"
                                label="Current Password"
                                type="password"
                                value={passwordData.currentPassword}
                                onChange={handlePasswordInputChange}
                                disabled={isSaving}
                            />
                        </Grid>
                        <Grid item xs={12}>
                            <TextField
                                required
                                fullWidth
                                margin="dense"
                                id="newPassword"
                                name="newPassword"
                                label="New Password"
                                type="password"
                                value={passwordData.newPassword}
                                onChange={handlePasswordInputChange}
                                disabled={isSaving}
                            />
                        </Grid>
                        <Grid item xs={12}>
                            <TextField
                                required
                                fullWidth
                                margin="dense"
                                id="confirmPassword"
                                name="confirmPassword"
                                label="Confirm New Password"
                                type="password"
                                value={passwordData.confirmPassword}
                                onChange={handlePasswordInputChange}
                                disabled={isSaving}
                            />
                        </Grid>
                    </Grid>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setPasswordDialog(false)} disabled={isSaving}>
                        Cancel
                    </Button>
                    <Button
                        onClick={handleChangePassword}
                        variant="contained"
                        color="primary"
                        disabled={isSaving}
                    >
                        {isSaving ? 'Changing...' : 'Change Password'}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Alert Snackbar */}
            <Snackbar
                open={alert.open}
                autoHideDuration={6000}
                onClose={handleCloseAlert}
                anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
            >
                <Alert onClose={handleCloseAlert} severity={alert.severity} sx={{ width: '100%' }}>
                    {alert.message}
                </Alert>
            </Snackbar>
        </Box>
    );
};

export default UserProfile;