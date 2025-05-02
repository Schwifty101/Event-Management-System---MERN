import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
    Container,
    Typography,
    Grid,
    Card,
    CardContent,
    Button,
    Box,
    Paper,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Chip
} from '@mui/material';
import {
    MonetizationOn,
    Person,
    BarChart,
    Inventory
} from '@mui/icons-material';
import { sponsorshipService } from '../../services/api';

const SponsorDashboard = () => {
    const [sponsorships, setSponsorships] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchSponsorships = async () => {
            try {
                setLoading(true);
                const response = await sponsorshipService.getMySponsorships();
                setSponsorships(response.data.sponsorships || []);
            } catch (err) {
                setError('Failed to load sponsorships. Please try again later.');
                console.error('Error fetching sponsorships:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchSponsorships();
    }, []);

    const getStatusChipColor = (status) => {
        switch (status) {
            case 'pending': return 'warning';
            case 'approved': return 'success';
            case 'rejected': return 'error';
            case 'completed': return 'info';
            default: return 'default';
        }
    };

    return (
        <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
            <Typography variant="h4" component="h1" gutterBottom>
                Sponsor Dashboard
            </Typography>

            <Grid container spacing={3}>
                {/* Quick links */}
                <Grid item xs={12}>
                    <Paper elevation={3} sx={{ p: 2, display: 'flex', flexDirection: 'column' }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                            <Typography variant="h6" component="h2">
                                Quick Actions
                            </Typography>
                        </Box>
                        <Grid container spacing={2}>
                            <Grid item xs={6} sm={4}>
                                <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', p: 2 }}>
                                    <Person sx={{ fontSize: 40, color: 'primary.main', mb: 1 }} />
                                    <Button
                                        component={Link}
                                        to="/sponsor/profile"
                                        variant="outlined"
                                        color="primary"
                                        fullWidth
                                    >
                                        Profile
                                    </Button>
                                </Card>
                            </Grid>
                            <Grid item xs={6} sm={4}>
                                <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', p: 2 }}>
                                    <Inventory sx={{ fontSize: 40, color: 'primary.main', mb: 1 }} />
                                    <Button
                                        component={Link}
                                        to="/sponsor/packages"
                                        variant="outlined"
                                        color="primary"
                                        fullWidth
                                    >
                                        Packages
                                    </Button>
                                </Card>
                            </Grid>
                            <Grid item xs={6} sm={4}>
                                <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', p: 2 }}>
                                    <BarChart sx={{ fontSize: 40, color: 'primary.main', mb: 1 }} />
                                    <Button
                                        component={Link}
                                        to="/sponsor/reports"
                                        variant="outlined"
                                        color="primary"
                                        fullWidth
                                    >
                                        Reports
                                    </Button>
                                </Card>
                            </Grid>
                        </Grid>
                    </Paper>
                </Grid>

                {/* Recent Sponsorships */}
                <Grid item xs={12}>
                    <Paper elevation={3} sx={{ p: 2, display: 'flex', flexDirection: 'column' }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                            <Typography variant="h6" component="h2">
                                My Sponsorships
                            </Typography>
                            <Button
                                component={Link}
                                to="/sponsor/packages"
                                variant="contained"
                                color="primary"
                                startIcon={<MonetizationOn />}
                            >
                                View Sponsorship Packages
                            </Button>
                        </Box>

                        {loading ? (
                            <Typography>Loading sponsorships...</Typography>
                        ) : error ? (
                            <Typography color="error">{error}</Typography>
                        ) : sponsorships.length === 0 ? (
                            <Typography>You don't have any sponsorships yet. View available packages to start supporting events!</Typography>
                        ) : (
                            <TableContainer>
                                <Table>
                                    <TableHead>
                                        <TableRow>
                                            <TableCell>Event</TableCell>
                                            <TableCell>Package</TableCell>
                                            <TableCell>Amount</TableCell>
                                            <TableCell>Status</TableCell>
                                            <TableCell>Actions</TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {sponsorships.slice(0, 5).map((sponsorship) => (
                                            <TableRow key={sponsorship.id}>
                                                <TableCell>{sponsorship.eventName || 'Unknown Event'}</TableCell>
                                                <TableCell>{sponsorship.packageName || 'Custom Package'}</TableCell>
                                                <TableCell>${sponsorship.amount}</TableCell>
                                                <TableCell>
                                                    <Chip
                                                        label={sponsorship.status}
                                                        color={getStatusChipColor(sponsorship.status)}
                                                        size="small"
                                                    />
                                                </TableCell>
                                                <TableCell>
                                                    <Button
                                                        component={Link}
                                                        to={`/sponsor/packages`}
                                                        variant="outlined"
                                                        size="small"
                                                    >
                                                        View Packages
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </TableContainer>
                        )}
                    </Paper>
                </Grid>
            </Grid>
        </Container>
    );
};

export default SponsorDashboard;