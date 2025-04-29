import React, { useState, useEffect } from 'react';
import { Grid, Paper, Typography, Box, Card, CardContent, CardHeader, CircularProgress } from '@mui/material';
import { EventAvailable, Group, Payments, Hotel, Analytics } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

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
                const response = await axios.get('/api/analytics/dashboard', {
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem('token')}`
                    }
                });

                setDashboardData(response.data);
                setLoading(false);
            } catch (error) {
                console.error('Error fetching dashboard data:', error);
                setLoading(false);
            }
        };

        fetchDashboardData();
    }, []);

    return (
        <Box sx={{ p: 3 }}>
            <Typography variant="h4" sx={{ mb: 4 }}>Admin Dashboard</Typography>

            <Grid container spacing={3}>
                {/* Key metric cards */}
                <Grid item xs={12} md={4}>
                    <DashboardCard
                        title="Total Users"
                        value={dashboardData.totalUsers}
                        icon={<Group />}
                        color="primary"
                        loading={loading}
                        onClick={() => navigate('/admin/users')}
                    />
                </Grid>
                <Grid item xs={12} md={4}>
                    <DashboardCard
                        title="Total Events"
                        value={dashboardData.totalEvents}
                        icon={<EventAvailable />}
                        color="success"
                        loading={loading}
                        onClick={() => navigate('/admin/events')}
                    />
                </Grid>
                <Grid item xs={12} md={4}>
                    <DashboardCard
                        title="Total Revenue"
                        value={`$${dashboardData.totalRevenue?.toLocaleString() || 0}`}
                        icon={<Payments />}
                        color="warning"
                        loading={loading}
                        onClick={() => navigate('/admin/finances')}
                    />
                </Grid>
                <Grid item xs={12} md={4}>
                    <DashboardCard
                        title="Total Teams"
                        value={dashboardData.totalTeams}
                        icon={<Group />}
                        color="info"
                        loading={loading}
                        onClick={() => navigate('/admin/teams')}
                    />
                </Grid>
                <Grid item xs={12} md={4}>
                    <DashboardCard
                        title="Accommodation Bookings"
                        value={dashboardData.accommodationBookings}
                        icon={<Hotel />}
                        color="error"
                        loading={loading}
                        onClick={() => navigate('/admin/accommodations')}
                    />
                </Grid>
                <Grid item xs={12} md={4}>
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

            {/* Additional widgets and reports would go here */}
            <Grid container spacing={3} sx={{ mt: 2 }}>
                <Grid item xs={12}>
                    <Paper sx={{ p: 3 }}>
                        <Typography variant="h6" gutterBottom>Recent Activity</Typography>
                        {/* Activity log or recent actions would go here */}
                        <Typography variant="body2" color="text.secondary">
                            Recent system activities will be displayed here.
                        </Typography>
                    </Paper>
                </Grid>
            </Grid>
        </Box>
    );
};

export default AdminDashboard;