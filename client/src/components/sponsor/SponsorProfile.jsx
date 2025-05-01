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
        companyName: '',
        industry: '',
        contactEmail: '',
        contactPhone: '',
        website: '',
        description: '',
        logoUrl: '',
    });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                setLoading(true);
                const response = await sponsorProfileService.getMyProfile();
                if (response.data && response.data.profile) {
                    // Map backend field names to frontend field names
                    setProfile({
                        companyName: response.data.profile.organization_name || '',
                        industry: response.data.profile.industry || '',
                        contactEmail: response.data.profile.contact_email || '',
                        contactPhone: response.data.profile.contact_phone || '',
                        website: response.data.profile.website || '',
                        description: response.data.profile.organization_description || '',
                        logoUrl: response.data.profile.logo_url || '',
                    });
                }
            } catch (err) {
                if (err.response && err.response.status !== 404) {
                    setError('Failed to load profile. Please try again later.');
                    console.error('Error fetching profile:', err);
                }
                // 404 is expected if no profile exists yet, so no error message needed
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

            // Map frontend field names back to backend field names
            const backendProfile = {
                organization_name: profile.companyName,
                organization_description: profile.description,
                industry: profile.industry,
                contact_email: profile.contactEmail,
                contact_phone: profile.contactPhone,
                website: profile.website,
                logo_url: profile.logoUrl
            };

            await sponsorProfileService.createOrUpdateProfile(backendProfile);
            setSuccess('Profile saved successfully!');
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
                                    src={profile.logoUrl || '/assets/default-company-logo.png'}
                                    alt={profile.companyName || 'Company Logo'}
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
                                            name="companyName"
                                            label="Company Name"
                                            value={profile.companyName}
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
                                            name="contactEmail"
                                            label="Contact Email"
                                            value={profile.contactEmail}
                                            onChange={handleChange}
                                            fullWidth
                                            required
                                            type="email"
                                        />
                                    </Grid>
                                    <Grid item xs={12} sm={6}>
                                        <TextField
                                            name="contactPhone"
                                            label="Contact Phone"
                                            value={profile.contactPhone}
                                            onChange={handleChange}
                                            fullWidth
                                        />
                                    </Grid>
                                    <Grid item xs={12}>
                                        <TextField
                                            name="description"
                                            label="Company Description"
                                            value={profile.description}
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
                                    {saving ? 'Saving...' : 'Save Profile'}
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