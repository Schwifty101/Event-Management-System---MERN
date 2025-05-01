import React, { useState, useEffect } from 'react';
import {
    Box,
    Typography,
    Grid,
    Paper,
    Card,
    CardContent,
    CardActionArea,
    Button,
    Divider,
    List,
    ListItem,
    ListItemIcon,
    ListItemText,
    Chip,
    CircularProgress
} from '@mui/material';
import {
    Business as BusinessIcon,
    Payments as PaymentsIcon,
    Assignment as AssignmentIcon,
    BarChart as ChartIcon,
    EventNote as EventIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { sponsorProfileService, sponsorshipService } from '../../services/api';

const SponsorDashboard = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [profile, setProfile] = useState(null);
    const [sponsorships, setSponsorships] = useState([]);
    const [stats, setStats] = useState({
        totalSponsored: 0,
        activeContracts: 0,
        pendingPayments: 0
    });

    useEffect(() => {
        const fetchSponsorData = async () => {
            try {
                setLoading(true);

                // Fetch sponsor profile
                const profileRes = await sponsorProfileService.getMyProfile();
                setProfile(profileRes.data.profile);

                // Fetch sponsorships
                const sponsorshipsRes = await sponsorshipService.getMySponsorships();
                setSponsorships(sponsorshipsRes.data.sponsorships || []);

                // Calculate stats
                const active = sponsorshipsRes.data.sponsorships?.filter(s =>
                    s.status === 'active' || s.status === 'approved').length || 0;

                const total = sponsorshipsRes.data.sponsorships?.reduce(
                    (sum, s) => sum + parseFloat(s.total_amount), 0) || 0;

                setStats({
                    totalSponsored: total,
                    activeContracts: active,
                    pendingPayments: sponsorshipsRes.data.sponsorships?.filter(s =>
                        s.status === 'approved').length || 0
                });

            } catch (error) {
                console.error('Error fetching sponsor data:', error);
                // If no profile exists, user needs to create one
                if (error.response && error.response.status === 404) {
                    setProfile(null);
                }
            } finally {
                setLoading(false);
            }
        };

        fetchSponsorData();
    }, []);

    const handleNavigate = (path) => {
        navigate(path);
    };

    if (loading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
                <CircularProgress />
            </Box>
        );
    }

    // If no profile exists, prompt user to create one
    if (!profile) {
        return (
            <Box sx={{ p: 3 }}>
                <Paper sx={{ p: 3, textAlign: 'center' }}>
                    <BusinessIcon sx={{ fontSize: 60, color: 'primary.main', mb: 2 }} />
                    <Typography variant="h5" gutterBottom>
                        Welcome to Sponsorship Management
                    </Typography>
                    <Typography variant="body1" paragraph>
                        To get started as a sponsor, you need to create your organization profile first.
                    </Typography>
                    <Button
                        variant="contained"
                        color="primary"
                        onClick={() => navigate('/sponsor/profile/create')}
                    >
                        Create Sponsor Profile
                    </Button>
                </Paper>
            </Box>
        );
    }

    return (
        <Box sx={{ p: 3 }}>
            <Typography variant="h4" gutterBottom>
                Sponsor Dashboard
            </Typography>
            <Typography variant="subtitle1" color="textSecondary" paragraph>
                Welcome back, {profile.organization_name}
            </Typography>

            {/* Stats Cards */}
            <Grid container spacing={3} sx={{ mb: 4 }}>
                <Grid item xs={12} md={4}>
                    <Paper sx={{ p: 2 }}>
                        <Typography variant="subtitle1" color="textSecondary">
                            Total Sponsored Amount
                        </Typography>
                        <Typography variant="h4">
                            ${stats.totalSponsored.toLocaleString()}
                        </Typography>
                    </Paper>
                </Grid>
                <Grid item xs={12} md={4}>
                    <Paper sx={{ p: 2 }}>
                        <Typography variant="subtitle1" color="textSecondary">
                            Active Contracts
                        </Typography>
                        <Typography variant="h4">
                            {stats.activeContracts}
                        </Typography>
                    </Paper>
                </Grid>
                <Grid item xs={12} md={4}>
                    <Paper sx={{ p: 2 }}>
                        <Typography variant="subtitle1" color="textSecondary">
                            Pending Payments
                        </Typography>
                        <Typography variant="h4">
                            {stats.pendingPayments}
                        </Typography>
                    </Paper>
                </Grid>
            </Grid>

            {/* Quick Actions */}
            <Typography variant="h6" gutterBottom>
                Quick Actions
            </Typography>
            <Grid container spacing={3} sx={{ mb: 4 }}>
                <Grid item xs={12} md={3}>
                    <Card>
                        <CardActionArea onClick={() => handleNavigate('/sponsor/profile')}>
                            <CardContent sx={{ textAlign: 'center' }}>
                                <BusinessIcon sx={{ fontSize: 40, color: 'primary.main', mb: 1 }} />
                                <Typography variant="h6">
                                    Organization Profile
                                </Typography>
                            </CardContent>
                        </CardActionArea>
                    </Card>
                </Grid>
                <Grid item xs={12} md={3}>
                    <Card>
                        <CardActionArea onClick={() => handleNavigate('/sponsor/packages')}>
                            <CardContent sx={{ textAlign: 'center' }}>
                                <AssignmentIcon sx={{ fontSize: 40, color: 'primary.main', mb: 1 }} />
                                <Typography variant="h6">
                                    Sponsorship Packages
                                </Typography>
                            </CardContent>
                        </CardActionArea>
                    </Card>
                </Grid>
                <Grid item xs={12} md={3}>
                    <Card>
                        <CardActionArea onClick={() => handleNavigate('/sponsor/sponsorships')}>
                            <CardContent sx={{ textAlign: 'center' }}>
                                <PaymentsIcon sx={{ fontSize: 40, color: 'primary.main', mb: 1 }} />
                                <Typography variant="h6">
                                    My Sponsorships
                                </Typography>
                            </CardContent>
                        </CardActionArea>
                    </Card>
                </Grid>
                <Grid item xs={12} md={3}>
                    <Card>
                        <CardActionArea onClick={() => handleNavigate('/sponsor/reports')}>
                            <CardContent sx={{ textAlign: 'center' }}>
                                <ChartIcon sx={{ fontSize: 40, color: 'primary.main', mb: 1 }} />
                                <Typography variant="h6">
                                    Reports & Analytics
                                </Typography>
                            </CardContent>
                        </CardActionArea>
                    </Card>
                </Grid>
            </Grid>

            {/* Recent Sponsorships */}
            <Typography variant="h6" gutterBottom>
                Recent Sponsorships
            </Typography>
            <Paper sx={{ p: 2 }}>
                {sponsorships.length > 0 ? (
                    <List>
                        {sponsorships.slice(0, 5).map((sponsorship) => (
                            <React.Fragment key={sponsorship.id}>
                                <ListItem
                                    button
                                    onClick={() => navigate(`/sponsor/sponsorships/${sponsorship.id}`)}
                                >
                                    <ListItemIcon>
                                        <EventIcon />
                                    </ListItemIcon>
                                    <ListItemText
                                        primary={sponsorship.event_title}
                                        secondary={`Package: ${sponsorship.package_name}`}
                                    />
                                    <Box>
                                        <Chip
                                            label={sponsorship.status.toUpperCase()}
                                            color={
                                                sponsorship.status === 'active' ? 'success' :
                                                    sponsorship.status === 'approved' ? 'primary' :
                                                        sponsorship.status === 'pending' ? 'warning' : 'default'
                                            }
                                            size="small"
                                        />
                                        <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
                                            ${parseFloat(sponsorship.total_amount).toLocaleString()}
                                        </Typography>
                                    </Box>
                                </ListItem>
                                <Divider />
                            </React.Fragment>
                        ))}
                    </List>
                ) : (
                    <Box sx={{ p: 2, textAlign: 'center' }}>
                        <Typography variant="body1" color="textSecondary">
                            You haven't made any sponsorships yet.
                        </Typography>
                        <Button
                            variant="contained"
                            color="primary"
                            sx={{ mt: 2 }}
                            onClick={() => navigate('/sponsor/packages')}
                        >
                            Browse Sponsorship Packages
                        </Button>
                    </Box>
                )}
            </Paper>
        </Box>
    );
};

export default SponsorDashboard;