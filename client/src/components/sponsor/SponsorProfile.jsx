import React, { useState, useEffect } from 'react';
import {
    Container,
    Typography,
    Grid,
    TextField,
    Button,
    Paper,
    Box,
    Avatar,
    Alert,
    CircularProgress
} from '@mui/material';
import { Save, Upload } from '@mui/icons-material';
import { sponsorProfileService } from '../../services/api';

const SponsorProfile = () => {
    const [profile, setProfile] = useState({
        organization_name: '',
        industry: '',
        contact_email: '',
        contact_phone: '',
        website: '',
        organization_description: '',
        logo_url: '',
    });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);
    const [isNewProfile, setIsNewProfile] = useState(false);
    const [userInfo, setUserInfo] = useState({});

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                setLoading(true);
                const response = await sponsorProfileService.getMyProfile();
                console.log("API Response:", response.data);

                if (response.data && response.data.success) {
                    const profileData = response.data.data;

                    // Check if profile exists or not
                    setIsNewProfile(!profileData.exists);

                    // Set user info
                    setUserInfo({
                        user_id: profileData.user_id,
                        name: profileData.name,
                        email: profileData.email
                    });

                    // Set profile data
                    setProfile({
                        organization_name: profileData.organization_name || '',
                        industry: profileData.industry || '',
                        contact_email: profileData.contact_email || profileData.email || '',
                        contact_phone: profileData.contact_phone || '',
                        website: profileData.website || '',
                        organization_description: profileData.organization_description || '',
                        logo_url: profileData.logo_url || '',
                    });

                    // Show message if needed
                    if (!profileData.exists) {
                        setSuccess(response.data.message);
                    }
                }
            } catch (err) {
                console.log("API Error:", err);
                setError('Failed to load profile. Please try again later.');
                console.error('Error fetching profile:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchProfile();
    }, []);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setProfile(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            setSaving(true);
            setError(null);
            setSuccess(null);

            // Use the exact field names as expected by the backend
            const response = await sponsorProfileService.createOrUpdateProfile(profile);
            setSuccess('Profile saved successfully!');
            setIsNewProfile(false);

            if (response.data && response.data.data) {
                console.log("Save Response:", response.data);
            }
        } catch (err) {
            setError('Failed to save profile. Please try again later.');
            console.error('Error saving profile:', err);
        } finally {
            setSaving(false);
        }
    };

    return (
        <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
            <Typography variant="h4" component="h1" gutterBottom>
                Sponsor Profile
            </Typography>

            {isNewProfile && (
                <Alert severity="info" sx={{ mb: 3 }}>
                    Welcome {userInfo.name || 'Sponsor'}! Please complete your organization profile to proceed with sponsorship opportunities.
                </Alert>
            )}

            <Paper elevation={3} sx={{ p: 3 }}>
                {loading ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                        <CircularProgress />
                    </Box>
                ) : (
                    <form onSubmit={handleSubmit}>
                        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
                        {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}

                        <Grid container spacing={3}>
                            <Grid item xs={12} md={4} sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                <Avatar
                                    src={profile.logo_url || '/assets/default-company-logo.png'}
                                    alt={profile.organization_name || 'Company Logo'}
                                    sx={{ width: 150, height: 150, mb: 2 }}
                                />
                                <Button
                                    variant="outlined"
                                    component="label"
                                    startIcon={<Upload />}
                                >
                                    Upload Logo
                                    <input type="file" hidden />
                                </Button>
                                <Typography variant="caption" sx={{ mt: 1, textAlign: 'center' }}>
                                    Recommended size: 300x300 pixels. Max file size: 2MB
                                </Typography>
                            </Grid>

                            <Grid item xs={12} md={8}>
                                <Grid container spacing={2}>
                                    <Grid item xs={12}>
                                        <TextField
                                            name="organization_name"
                                            label="Company Name"
                                            value={profile.organization_name}
                                            onChange={handleChange}
                                            fullWidth
                                            required
                                        />
                                    </Grid>
                                    <Grid item xs={12} sm={6}>
                                        <TextField
                                            name="industry"
                                            label="Industry"
                                            value={profile.industry}
                                            onChange={handleChange}
                                            fullWidth
                                        />
                                    </Grid>
                                    <Grid item xs={12} sm={6}>
                                        <TextField
                                            name="website"
                                            label="Website"
                                            value={profile.website}
                                            onChange={handleChange}
                                            fullWidth
                                            placeholder="https://example.com"
                                        />
                                    </Grid>
                                    <Grid item xs={12} sm={6}>
                                        <TextField
                                            name="contact_email"
                                            label="Contact Email"
                                            value={profile.contact_email}
                                            onChange={handleChange}
                                            fullWidth
                                            required
                                            type="email"
                                        />
                                    </Grid>
                                    <Grid item xs={12} sm={6}>
                                        <TextField
                                            name="contact_phone"
                                            label="Contact Phone"
                                            value={profile.contact_phone}
                                            onChange={handleChange}
                                            fullWidth
                                        />
                                    </Grid>
                                    <Grid item xs={12}>
                                        <TextField
                                            name="organization_description"
                                            label="Company Description"
                                            value={profile.organization_description}
                                            onChange={handleChange}
                                            fullWidth
                                            multiline
                                            rows={4}
                                        />
                                    </Grid>
                                </Grid>
                            </Grid>

                            <Grid item xs={12} sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                                <Button
                                    type="submit"
                                    variant="contained"
                                    color="primary"
                                    startIcon={<Save />}
                                    disabled={saving}
                                >
                                    {saving ? 'Saving...' : isNewProfile ? 'Create Profile' : 'Update Profile'}
                                </Button>
                            </Grid>
                        </Grid>
                    </form>
                )}
            </Paper>
        </Container>
    );
};

export default SponsorProfile;