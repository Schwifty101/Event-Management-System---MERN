import React, { useState, useEffect } from 'react';
import {
    Container,
    Typography,
    Grid,
    Paper,
    Box,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    CircularProgress,
    Alert,
    Card,
    CardContent
} from '@mui/material';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell
} from 'recharts';
import { sponsorshipService } from '../../services/api';

// Chart colors
const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

const SponsorReports = () => {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [report, setReport] = useState({
        sponsorshipsByStatus: [],
        sponsorshipsByEvent: [],
        paymentSummary: { total: 0, paid: 0, pending: 0 },
        sponsorshipsByMonth: []
    });

    useEffect(() => {
        const fetchReport = async () => {
            try {
                setLoading(true);
                const response = await sponsorshipService.getMySponsorships();

                // Process the data for reporting
                let sponsorships = [];

                // Check if response.data is an array or if sponsorships are nested in the response
                if (Array.isArray(response.data)) {
                    sponsorships = response.data;
                } else if (response.data && Array.isArray(response.data.sponsorships)) {
                    sponsorships = response.data.sponsorships;
                } else if (response.data && typeof response.data === 'object') {
                    // If data is not an array but an object, display an error
                    console.error('Unexpected API response format:', response.data);
                    setError('Received unexpected data format from the server.');
                    setLoading(false);
                    return;
                }

                // Continue only if we have an array of sponsorships
                if (sponsorships.length === 0) {
                    // No sponsorships yet
                    setReport({
                        sponsorshipsByStatus: [],
                        sponsorshipsByEvent: [],
                        paymentSummary: { total: 0, paid: 0, pending: 0 },
                        sponsorshipsByMonth: []
                    });
                    setLoading(false);
                    return;
                }

                // Sponsorships by status
                const statusCounts = {};
                sponsorships.forEach(item => {
                    statusCounts[item.status] = (statusCounts[item.status] || 0) + 1;
                });

                const sponsorshipsByStatus = Object.entries(statusCounts).map(([status, count]) => ({
                    name: status.charAt(0).toUpperCase() + status.slice(1),
                    value: count
                }));

                // Sponsorships by event
                const eventCounts = {};
                sponsorships.forEach(item => {
                    eventCounts[item.eventName] = (eventCounts[item.eventName] || 0) + item.amount;
                });

                const sponsorshipsByEvent = Object.entries(eventCounts).map(([event, amount]) => ({
                    name: event,
                    amount: amount
                }));

                // Payment summary
                let totalAmount = 0;
                let paidAmount = 0;

                sponsorships.forEach(item => {
                    totalAmount += item.amount;

                    if (item.payments) {
                        item.payments.forEach(payment => {
                            if (payment.status === 'completed') {
                                paidAmount += payment.amount;
                            }
                        });
                    }
                });

                const paymentSummary = {
                    total: totalAmount,
                    paid: paidAmount,
                    pending: totalAmount - paidAmount
                };

                // Sponsorships by month
                const monthData = {};
                sponsorships.forEach(item => {
                    const date = new Date(item.createdAt);
                    const monthYear = `${date.getMonth() + 1}/${date.getFullYear()}`;

                    monthData[monthYear] = (monthData[monthYear] || 0) + 1;
                });

                const sponsorshipsByMonth = Object.entries(monthData)
                    .map(([month, count]) => ({
                        month,
                        count
                    }))
                    .sort((a, b) => {
                        const [aMonth, aYear] = a.month.split('/').map(Number);
                        const [bMonth, bYear] = b.month.split('/').map(Number);

                        if (aYear !== bYear) return aYear - bYear;
                        return aMonth - bMonth;
                    });

                setReport({
                    sponsorshipsByStatus,
                    sponsorshipsByEvent,
                    paymentSummary,
                    sponsorshipsByMonth
                });

            } catch (err) {
                setError('Failed to load sponsorship report data. Please try again later.');
                console.error('Error fetching report data:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchReport();
    }, []);

    return (
        <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
            <Typography variant="h4" component="h1" gutterBottom>
                Sponsorship Reports
            </Typography>

            {loading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', p: 5 }}>
                    <CircularProgress />
                </Box>
            ) : error ? (
                <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>
            ) : (
                <Grid container spacing={3}>
                    {/* Summary Cards */}
                    <Grid item xs={12} md={4}>
                        <Card elevation={3}>
                            <CardContent>
                                <Typography variant="h6" gutterBottom>Total Amount</Typography>
                                <Typography variant="h4" color="primary">${report.paymentSummary.total.toFixed(2)}</Typography>
                            </CardContent>
                        </Card>
                    </Grid>
                    <Grid item xs={12} md={4}>
                        <Card elevation={3}>
                            <CardContent>
                                <Typography variant="h6" gutterBottom>Paid Amount</Typography>
                                <Typography variant="h4" color="success.main">${report.paymentSummary.paid.toFixed(2)}</Typography>
                            </CardContent>
                        </Card>
                    </Grid>
                    <Grid item xs={12} md={4}>
                        <Card elevation={3}>
                            <CardContent>
                                <Typography variant="h6" gutterBottom>Pending Amount</Typography>
                                <Typography variant="h4" color="warning.main">${report.paymentSummary.pending.toFixed(2)}</Typography>
                            </CardContent>
                        </Card>
                    </Grid>

                    {/* Status Distribution Chart */}
                    <Grid item xs={12} md={6}>
                        <Paper
                            elevation={3}
                            sx={{ p: 2, display: 'flex', flexDirection: 'column', height: 350 }}
                        >
                            <Typography variant="h6" gutterBottom>Sponsorship Status Distribution</Typography>
                            <Box sx={{ flexGrow: 1 }}>
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={report.sponsorshipsByStatus}
                                            cx="50%"
                                            cy="50%"
                                            labelLine={true}
                                            outerRadius={80}
                                            fill="#8884d8"
                                            dataKey="value"
                                            label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                                        >
                                            {report.sponsorshipsByStatus.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                            ))}
                                        </Pie>
                                        <Tooltip />
                                        <Legend />
                                    </PieChart>
                                </ResponsiveContainer>
                            </Box>
                        </Paper>
                    </Grid>

                    {/* Event Distribution Chart */}
                    <Grid item xs={12} md={6}>
                        <Paper
                            elevation={3}
                            sx={{ p: 2, display: 'flex', flexDirection: 'column', height: 350 }}
                        >
                            <Typography variant="h6" gutterBottom>Sponsorship Amount by Event</Typography>
                            <Box sx={{ flexGrow: 1 }}>
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart
                                        data={report.sponsorshipsByEvent}
                                        margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                                    >
                                        <CartesianGrid strokeDasharray="3 3" />
                                        <XAxis dataKey="name" />
                                        <YAxis />
                                        <Tooltip formatter={(value) => [`$${value}`, 'Amount']} />
                                        <Legend />
                                        <Bar dataKey="amount" name="Sponsorship Amount ($)" fill="#8884d8" />
                                    </BarChart>
                                </ResponsiveContainer>
                            </Box>
                        </Paper>
                    </Grid>

                    {/* Monthly Trend Chart */}
                    <Grid item xs={12}>
                        <Paper
                            elevation={3}
                            sx={{ p: 2, display: 'flex', flexDirection: 'column', height: 350 }}
                        >
                            <Typography variant="h6" gutterBottom>Sponsorship Trend (Monthly)</Typography>
                            <Box sx={{ flexGrow: 1 }}>
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart
                                        data={report.sponsorshipsByMonth}
                                        margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                                    >
                                        <CartesianGrid strokeDasharray="3 3" />
                                        <XAxis dataKey="month" />
                                        <YAxis />
                                        <Tooltip />
                                        <Legend />
                                        <Bar dataKey="count" name="Number of Sponsorships" fill="#82ca9d" />
                                    </BarChart>
                                </ResponsiveContainer>
                            </Box>
                        </Paper>
                    </Grid>

                    {/* Detail Table */}
                    <Grid item xs={12}>
                        <Paper elevation={3} sx={{ p: 2 }}>
                            <Typography variant="h6" gutterBottom>Payment Summary</Typography>
                            <TableContainer>
                                <Table>
                                    <TableHead>
                                        <TableRow>
                                            <TableCell>Category</TableCell>
                                            <TableCell align="right">Amount ($)</TableCell>
                                            <TableCell align="right">Percentage</TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        <TableRow>
                                            <TableCell>Total Sponsorship</TableCell>
                                            <TableCell align="right">${report.paymentSummary.total.toFixed(2)}</TableCell>
                                            <TableCell align="right">100%</TableCell>
                                        </TableRow>
                                        <TableRow>
                                            <TableCell>Paid Amount</TableCell>
                                            <TableCell align="right">${report.paymentSummary.paid.toFixed(2)}</TableCell>
                                            <TableCell align="right">
                                                {report.paymentSummary.total > 0
                                                    ? `${((report.paymentSummary.paid / report.paymentSummary.total) * 100).toFixed(1)}%`
                                                    : '0%'}
                                            </TableCell>
                                        </TableRow>
                                        <TableRow>
                                            <TableCell>Pending Amount</TableCell>
                                            <TableCell align="right">${report.paymentSummary.pending.toFixed(2)}</TableCell>
                                            <TableCell align="right">
                                                {report.paymentSummary.total > 0
                                                    ? `${((report.paymentSummary.pending / report.paymentSummary.total) * 100).toFixed(1)}%`
                                                    : '0%'}
                                            </TableCell>
                                        </TableRow>
                                    </TableBody>
                                </Table>
                            </TableContainer>
                        </Paper>
                    </Grid>
                </Grid>
            )}
        </Container>
    );
};

export default SponsorReports;