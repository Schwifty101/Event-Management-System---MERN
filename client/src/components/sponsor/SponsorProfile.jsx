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
    InputAdornment,
    Card,
    CardContent,
    CardMedia,
    Divider
} from '@mui/material';
import {
    PhotoCamera as PhotoCameraIcon,
    Save as SaveIcon,
    Edit as EditIcon
} from '@mui/icons-material';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const SponsorProfile = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [profileExists, setProfileExists] = useState(false);
    const [profile, setProfile] = useState({
        organization_name: '',
        organization_description: '',
        logo_url: '',
        website: '',
        industry: '',
        contact_person: user?.name || '',
        contact_email: user?.email || '',
        contact_phone: ''
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
                const response = await axios.get('/api/sponsors/profile', {
                    headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
                });

                const profileData = response.data.profile;
                setProfile({
                    organization_name: profileData.organization_name || '',
                    organization_description: profileData.organization_description || '',
                    logo_url: profileData.logo_url || '',
                    website: profileData.website || '',
                    industry: profileData.industry || '',
                    contact_person: profileData.contact_person || user?.name || '',
                    contact_email: profileData.contact_email || user?.email || '',
                    contact_phone: profileData.contact_phone || ''
                });
                setProfileExists(true);
                setIsEditing(false);
                setLoading(false);
            } catch (error) {
                if (error.response && error.response.status === 404) {
                    // Profile doesn't exist yet
                    setProfileExists(false);
                    setIsEditing(true);
                    setLoading(false);
                } else {
                    console.error('Error fetching sponsor profile:', error);
                    setAlert({
                        open: true,
                        message: 'Failed to load sponsor profile',
                        severity: 'error'
                    });
                    setLoading(false);
                }
            }
        };

        fetchProfile();
    }, [user]);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setProfile(prevProfile => ({
            ...prevProfile,
            [name]: value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        // Validate required fields
        if (!profile.organization_name) {
            setAlert({
                open: true,
                message: 'Organization name is required',
                severity: 'error'
            });
            return;
        }

        try {
            setIsSaving(true);

            const response = await axios.post('/api/sponsors/profile', profile, {
                headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
            });

            setProfileExists(true);
            setIsEditing(false);
            setAlert({
                open: true,
                message: profileExists
                    ? 'Sponsor profile updated successfully'
                    : 'Sponsor profile created successfully',
                severity: 'success'
            });

            // If this is a new profile, redirect to packages page after a delay
            if (!profileExists) {
                setTimeout(() => {
                    navigate('/sponsor/packages');
                }, 2000);
            }
        } catch (error) {
            console.error('Error saving sponsor profile:', error);
            setAlert({
                open: true,
                message: error.response?.data?.message || 'Failed to save sponsor profile',
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
                <Typography variant="h4">
                    {profileExists ? 'Sponsor Profile' : 'Create Sponsor Profile'}
                </Typography>

                {profileExists && !isEditing && (
                    <Button
                        variant="outlined"
                        startIcon={<EditIcon />}
                        onClick={handleToggleEdit}
                    >
                        Edit Profile
                    </Button>
                )}
            </Box>

            {profileExists && !isEditing && (
                <Card sx={{ mb: 4 }}>
                    <Grid container>
                        <Grid item xs={12} md={4}>
                            <Box sx={{ p: 2, display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
                                {profile.logo_url ? (
                                    <CardMedia
                                        component="img"
                                        image={profile.logo_url}
                                        alt={profile.organization_name}
                                        sx={{
                                            maxWidth: '100%',
                                            maxHeight: 200,
                                            objectFit: 'contain'
                                        }}
                                    />
                                ) : (
                                    <Avatar
                                        sx={{
                                            width: 150,
                                            height: 150,
                                            fontSize: '3rem',
                                            bgcolor: 'primary.main'
                                        }}
                                    >
                                        {profile.organization_name.charAt(0)}
                                    </Avatar>
                                )}
                            </Box>
                        </Grid>
                        <Grid item xs={12} md={8}>
                            <CardContent>
                                <Typography variant="h5" gutterBottom>
                                    {profile.organization_name}
                                </Typography>

                                <Typography variant="body1" paragraph>
                                    {profile.organization_description || 'No description provided'}
                                </Typography>

                                <Grid container spacing={2} sx={{ mt: 2 }}>
                                    <Grid item xs={12} sm={6}>
                                        <Typography variant="subtitle2" color="text.secondary">
                                            Industry
                                        </Typography>
                                        <Typography variant="body2">
                                            {profile.industry || 'Not specified'}
                                        </Typography>
                                    </Grid>

                                    <Grid item xs={12} sm={6}>
                                        <Typography variant="subtitle2" color="text.secondary">
                                            Website
                                        </Typography>
                                        <Typography variant="body2">
                                            {profile.website ? (
                                                <a href={profile.website} target="_blank" rel="noopener noreferrer">
                                                    {profile.website}
                                                </a>
                                            ) : (
                                                'Not provided'
                                            )}
                                        </Typography>
                                    </Grid>

                                    <Grid item xs={12} sm={6}>
                                        <Typography variant="subtitle2" color="text.secondary">
                                            Contact Person
                                        </Typography>
                                        <Typography variant="body2">
                                            {profile.contact_person}
                                        </Typography>
                                    </Grid>

                                    <Grid item xs={12} sm={6}>
                                        <Typography variant="subtitle2" color="text.secondary">
                                            Contact Email
                                        </Typography>
                                        <Typography variant="body2">
                                            {profile.contact_email}
                                        </Typography>
                                    </Grid>

                                    {profile.contact_phone && (
                                        <Grid item xs={12} sm={6}>
                                            <Typography variant="subtitle2" color="text.secondary">
                                                Contact Phone
                                            </Typography>
                                            <Typography variant="body2">
                                                {profile.contact_phone}
                                            </Typography>
                                        </Grid>
                                    )}
                                </Grid>
                            </CardContent>
                        </Grid>
                    </Grid>
                </Card>
            )}

            {/* Profile editing form */}
            {(isEditing || !profileExists) && (
                <Paper sx={{ p: 3 }}>
                    <form onSubmit={handleSubmit}>
                        <Grid container spacing={3}>
                            <Grid item xs={12}>
                                <Typography variant="h6" gutterBottom>
                                    Organization Information
                                </Typography>
                                <Divider sx={{ mb: 2 }} />
                            </Grid>

                            <Grid item xs={12} sm={6}>
                                <TextField
                                    required
                                    fullWidth
                                    id="organization_name"
                                    name="organization_name"
                                    label="Organization Name"
                                    value={profile.organization_name}
                                    onChange={handleInputChange}
                                    disabled={isSaving}
                                />
                            </Grid>

                            <Grid item xs={12} sm={6}>
                                <TextField
                                    fullWidth
                                    id="industry"
                                    name="industry"
                                    label="Industry"
                                    value={profile.industry}
                                    onChange={handleInputChange}
                                    disabled={isSaving}
                                    placeholder="e.g., Technology, Education, Healthcare"
                                />
                            </Grid>

                            <Grid item xs={12}>
                                <TextField
                                    fullWidth
                                    id="organization_description"
                                    name="organization_description"
                                    label="Organization Description"
                                    value={profile.organization_description}
                                    onChange={handleInputChange}
                                    disabled={isSaving}
                                    multiline
                                    rows={4}
                                    placeholder="Brief description of your organization"
                                />
                            </Grid>

                            <Grid item xs={12}>
                                <TextField
                                    fullWidth
                                    id="logo_url"
                                    name="logo_url"
                                    label="Logo URL"
                                    value={profile.logo_url}
                                    onChange={handleInputChange}
                                    disabled={isSaving}
                                    placeholder="https://example.com/logo.png"
                                    InputProps={{
                                        endAdornment: profile.logo_url && (
                                            <InputAdornment position="end">
                                                <Avatar
                                                    src={profile.logo_url}
                                                    alt="Logo preview"
                                                    sx={{ width: 24, height: 24 }}
                                                />
                                            </InputAdornment>
                                        )
                                    }}
                                />
                            </Grid>

                            <Grid item xs={12}>
                                <TextField
                                    fullWidth
                                    id="website"
                                    name="website"
                                    label="Website"
                                    value={profile.website}
                                    onChange={handleInputChange}
                                    disabled={isSaving}
                                    placeholder="https://www.example.com"
                                />
                            </Grid>

                            <Grid item xs={12}>
                                <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
                                    Contact Information
                                </Typography>
                                <Divider sx={{ mb: 2 }} />
                            </Grid>

                            <Grid item xs={12} sm={6}>
                                <TextField
                                    required
                                    fullWidth
                                    id="contact_person"
                                    name="contact_person"
                                    label="Contact Person Name"
                                    value={profile.contact_person}
                                    onChange={handleInputChange}
                                    disabled={isSaving}
                                />
                            </Grid>

                            <Grid item xs={12} sm={6}>
                                <TextField
                                    required
                                    fullWidth
                                    id="contact_email"
                                    name="contact_email"
                                    label="Contact Email"
                                    type="email"
                                    value={profile.contact_email}
                                    onChange={handleInputChange}
                                    disabled={isSaving}
                                />
                            </Grid>

                            <Grid item xs={12} sm={6}>
                                <TextField
                                    fullWidth
                                    id="contact_phone"
                                    name="contact_phone"
                                    label="Contact Phone"
                                    value={profile.contact_phone}
                                    onChange={handleInputChange}
                                    disabled={isSaving}
                                    placeholder="e.g., +1 (555) 123-4567"
                                />
                            </Grid>

                            <Grid item xs={12} sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end' }}>
                                {profileExists && (
                                    <Button
                                        onClick={handleToggleEdit}
                                        disabled={isSaving}
                                        sx={{ mr: 2 }}
                                    >
                                        Cancel
                                    </Button>
                                )}
                                <Button
                                    type="submit"
                                    variant="contained"
                                    color="primary"
                                    startIcon={<SaveIcon />}
                                    disabled={isSaving}
                                >
                                    {isSaving ? 'Saving...' : (profileExists ? 'Save Changes' : 'Create Profile')}
                                </Button>
                            </Grid>
                        </Grid>
                    </form>
                </Paper>
            )}

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

export default SponsorProfile;