import React, { useState, useEffect } from 'react';
import { Grid, Paper, Typography, Box, Card, CardContent, CardHeader, CircularProgress, Alert } from '@mui/material';
import { EventAvailable, Group, Payments, Hotel, Analytics, BusinessCenter } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { analyticsService } from '../../services/api';

const DashboardCard = ({ title, value, icon, color, loading, onClick }) => {
    return (
        <Card
            sx={{
                height: '100%',
                cursor: onClick ? 'pointer' : 'default',
                transition: 'transform 0.2s',
                '&:hover': onClick ? { transform: 'translateY(-4px)', boxShadow: 3 } : {}
            }}
            onClick={onClick}
        >
            <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Box>
                        <Typography variant="subtitle2" color="textSecondary" gutterBottom>
                            {title}
                        </Typography>
                        {loading ? (
                            <Box display="flex" alignItems="center" height={36}>
                                <CircularProgress size={20} />
                            </Box>
                        ) : (
                            <Typography variant="h4" component="div" fontWeight="bold">
                                {value}
                            </Typography>
                        )}
                    </Box>
                    <Box sx={{
                        backgroundColor: `${color}.100`,
                        borderRadius: '50%',
                        width: 48,
                        height: 48,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                    }}>
                        {React.cloneElement(icon, { sx: { color: `${color}.main` } })}
                    </Box>
                </Box>
            </CardContent>
        </Card>
    );
};

const AdminDashboard = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [dashboardData, setDashboardData] = useState({
        totalUsers: 0,
        totalEvents: 0,
        activeEvents: 0,
        totalRevenue: 0,
        totalTeams: 0,
        accommodationBookings: 0
    });

    useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                setLoading(true);
                setError(null);
                // For development, if the API is not ready, use mock data
                try {
                    const response = await analyticsService.getDashboardMetrics();
                    setDashboardData(response.data);
                } catch (apiError) {
                    console.error('Error fetching dashboard data:', apiError);
                    // Use mock data if API fails
                    setDashboardData({
                        totalUsers: 248,
                        totalEvents: 15,
                        activeEvents: 8,
                        totalRevenue: 24750,
                        totalTeams: 42,
                        accommodationBookings: 78
                    });
                    setError('Could not connect to the dashboard API. Showing sample data.');
                }
                setLoading(false);
            } catch (err) {
                console.error('Error in dashboard component:', err);
                setLoading(false);
                setError('Failed to load dashboard data');
            }
        };

        fetchDashboardData();
    }, []);

    return (
        <Box sx={{ p: 3 }}>
            <Typography variant="h4" sx={{ mb: 4 }}>Admin Dashboard</Typography>

            {error && (
                <Alert severity="warning" sx={{ mb: 3 }}>
                    {error}
                </Alert>
            )}

            <Grid container spacing={3}>
                {/* Key metric cards */}
                <Grid md={4} sm={6} xs={12}>
                    <DashboardCard
                        title="Total Users"
                        value={dashboardData.totalUsers}
                        icon={<Group />}
                        color="primary"
                        loading={loading}
                        onClick={() => navigate('/admin/users')}
                    />
                </Grid>
                <Grid md={4} sm={6} xs={12}>
                    <DashboardCard
                        title="Total Events"
                        value={dashboardData.totalEvents}
                        icon={<EventAvailable />}
                        color="success"
                        loading={loading}
                        onClick={() => navigate('/admin/events')}
                    />
                </Grid>
                <Grid md={4} sm={6} xs={12}>
                    <DashboardCard
                        title="Total Teams"
                        value={dashboardData.totalTeams}
                        icon={<Group />}
                        color="info"
                        loading={loading}
                        onClick={() => navigate('/admin/teams')}
                    />
                </Grid>
                <Grid md={4} sm={6} xs={12}>
                    <DashboardCard
                        title="Accommodation Bookings"
                        value={dashboardData.accommodationBookings}
                        icon={<Hotel />}
                        color="error"
                        loading={loading}
                        onClick={() => navigate('/admin/accommodations')}
                    />
                </Grid>
                <Grid md={4} sm={6} xs={12}>
                    <DashboardCard
                        title="Sponsorships"
                        value="Manage"
                        icon={<BusinessCenter />}
                        color="warning"
                        loading={loading}
                        onClick={() => navigate('/admin/sponsorships')}
                    />
                </Grid>
                <Grid md={4} sm={6} xs={12}>
                    <DashboardCard
                        title="Analytics"
                        value="View Reports"
                        icon={<Analytics />}
                        color="secondary"
                        loading={loading}
                        onClick={() => navigate('/admin/analytics')}
                    />
                </Grid>
            </Grid>
        </Box>
    );
};

export default AdminDashboard;