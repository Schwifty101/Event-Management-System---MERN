import React, { useState, useEffect, useCallback } from 'react';
import {
    Box,
    Typography,
    Paper,
    Grid,
    Card,
    CardContent,
    Button,
    CircularProgress,
    Alert,
    Divider,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Chip,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    TextField,
    Stack
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
import {
    DownloadOutlined,
    PictureAsPdfOutlined,
    InsertChartOutlined as ChartIcon
} from '@mui/icons-material';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';

const SponsorReports = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [loadingChart, setLoadingChart] = useState(false);
    const [error, setError] = useState(null);
    const [sponsorships, setSponsorships] = useState([]);
    const [payments, setPayments] = useState([]);
    const [promotions, setPromotions] = useState([]);
    const [metrics, setMetrics] = useState({
        totalSponsored: 0,
        activeContracts: 0,
        totalPaid: 0,
        remainingBalance: 0
    });

    // Filter states
    const [filters, setFilters] = useState({
        startDate: null,
        endDate: null,
        eventId: 'all',
        status: 'all'
    });

    // Chart data
    const [eventDistribution, setEventDistribution] = useState([]);
    const [paymentTimeline, setPaymentTimeline] = useState([]);
    const [packageDistribution, setPackageDistribution] = useState([]);

    // Available filter options
    const [events, setEvents] = useState([]);
    const [packageTypes, setPackageTypes] = useState([]);

    // Chart colors
    const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

    const processChartData = useCallback(async (sponsorships, payments) => {
        // Process event distribution chart
        const eventData = {};
        sponsorships.forEach(s => {
            if (!eventData[s.event_title]) {
                eventData[s.event_title] = { name: s.event_title, amount: 0 };
            }
            eventData[s.event_title].amount += parseFloat(s.total_amount);
        });
        setEventDistribution(Object.values(eventData));

        // Process payment timeline
        const timeline = {};
        payments.forEach(p => {
            const date = new Date(p.payment_date).toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
            if (!timeline[date]) {
                timeline[date] = { date, amount: 0 };
            }
            timeline[date].amount += parseFloat(p.amount);
        });

        // Sort by date
        const sortedTimeline = Object.values(timeline).sort((a, b) => {
            return new Date(a.date) - new Date(b.date);
        });

        setPaymentTimeline(sortedTimeline);

        // Process package distribution
        const packageData = {};
        sponsorships.forEach(s => {
            if (!packageData[s.package_name]) {
                packageData[s.package_name] = { name: s.package_name, value: 0, count: 0 };
            }
            packageData[s.package_name].value += parseFloat(s.total_amount);
            packageData[s.package_name].count += 1;
        });
        setPackageDistribution(Object.values(packageData));
    }, []);

    const calculateMetrics = useCallback((sponsorships, payments) => {
        // Calculate total sponsored amount
        const totalSponsored = sponsorships.reduce(
            (sum, s) => sum + parseFloat(s.total_amount),
            0
        );

        // Calculate active contracts
        const activeContracts = sponsorships.filter(
            s => s.status === 'active' || s.status === 'approved'
        ).length;

        // Calculate total paid amount
        const totalPaid = payments.reduce(
            (sum, p) => sum + parseFloat(p.amount),
            0
        );

        // Calculate remaining balance
        const remainingBalance = totalSponsored - totalPaid;

        setMetrics({
            totalSponsored,
            activeContracts,
            totalPaid,
            remainingBalance
        });
    }, []);

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);

                // Fetch all sponsorships for the user
                const sponsorshipsRes = await axios.get('/api/sponsorships/my', {
                    headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
                });

                const userSponsorships = sponsorshipsRes.data.sponsorships || [];
                setSponsorships(userSponsorships);

                // Extract events and package types for filters
                if (userSponsorships.length > 0) {
                    // Get unique events
                    const uniqueEvents = Array.from(
                        new Set(userSponsorships.map(s => s.event_id))
                    ).map(eventId => {
                        const sponsorship = userSponsorships.find(s => s.event_id === eventId);
                        return {
                            id: eventId,
                            title: sponsorship.event_title
                        };
                    });
                    setEvents(uniqueEvents);

                    // Get unique package types
                    const uniquePackages = Array.from(
                        new Set(userSponsorships.map(s => s.package_name))
                    );
                    setPackageTypes(uniquePackages);

                    // Fetch all payments and promotions
                    const allPayments = [];
                    const allPromotions = [];

                    for (const sponsorship of userSponsorships) {
                        try {
                            const detailRes = await axios.get(`/api/sponsorships/${sponsorship.id}?details=true`, {
                                headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
                            });

                            if (detailRes.data.payments) {
                                allPayments.push(...detailRes.data.payments.map(p => ({
                                    ...p,
                                    event_title: sponsorship.event_title,
                                    package_name: sponsorship.package_name,
                                    sponsorship_id: sponsorship.id
                                })));
                            }

                            if (detailRes.data.promotions) {
                                allPromotions.push(...detailRes.data.promotions.map(p => ({
                                    ...p,
                                    event_title: sponsorship.event_title,
                                    package_name: sponsorship.package_name,
                                    sponsorship_id: sponsorship.id
                                })));
                            }
                        } catch (error) {
                            console.error(`Error fetching details for sponsorship ${sponsorship.id}:`, error);
                        }
                    }

                    setPayments(allPayments);
                    setPromotions(allPromotions);
                }

                await processChartData(userSponsorships, payments);
                calculateMetrics(userSponsorships, payments);

                setLoading(false);
            } catch (error) {
                console.error('Error fetching sponsor report data:', error);
                setError('Failed to load report data. Please try again.');
                setLoading(false);
            }
        };

        fetchData();
    }, [payments, processChartData, calculateMetrics]);

    const applyFilters = useCallback(async () => {
        setLoadingChart(true);

        // Filter sponsorships based on current filters
        let filteredSponsorships = [...sponsorships];

        if (filters.eventId !== 'all') {
            filteredSponsorships = filteredSponsorships.filter(s => s.event_id === parseInt(filters.eventId));
        }

        if (filters.status !== 'all') {
            filteredSponsorships = filteredSponsorships.filter(s => s.status === filters.status);
        }

        if (filters.startDate) {
            filteredSponsorships = filteredSponsorships.filter(s =>
                new Date(s.contract_start_date) >= filters.startDate
            );
        }

        if (filters.endDate) {
            filteredSponsorships = filteredSponsorships.filter(s =>
                new Date(s.contract_end_date) <= filters.endDate
            );
        }

        // Filter payments based on sponsorship IDs
        const sponsorshipIds = filteredSponsorships.map(s => s.id);
        const filteredPayments = payments.filter(p => sponsorshipIds.includes(p.sponsorship_id));

        // Update charts and metrics
        await processChartData(filteredSponsorships, filteredPayments);
        calculateMetrics(filteredSponsorships, filteredPayments);

        setLoadingChart(false);
    }, [filters, sponsorships, payments, processChartData, calculateMetrics]);

    useEffect(() => {
        if (sponsorships.length > 0 && payments.length > 0) {
            // Apply filters and recalculate metrics when filters change
            applyFilters();
        }
    }, [filters, sponsorships, payments, applyFilters]);

    const handleFilterChange = (name, value) => {
        setFilters({
            ...filters,
            [name]: value
        });
    };

    const resetFilters = () => {
        setFilters({
            startDate: null,
            endDate: null,
            eventId: 'all',
            status: 'all'
        });
    };

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 0
        }).format(amount);
    };

    // Function to export report as PDF (mock function)
    const exportAsPDF = () => {
        alert('Export as PDF functionality would be implemented here.');
        // In a real implementation, you would use a library like jsPDF or react-pdf
        // to generate a PDF document with the current report data
    };

    // Function to export report as CSV (mock function)
    const exportAsCSV = () => {
        alert('Export as CSV functionality would be implemented here.');
        // In a real implementation, you would generate a CSV string of the current
        // report data and trigger a download
    };

    if (loading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
                <CircularProgress />
            </Box>
        );
    }

    if (error) {
        return (
            <Box sx={{ p: 3 }}>
                <Alert severity="error">{error}</Alert>
                <Button
                    variant="contained"
                    sx={{ mt: 2 }}
                    onClick={() => navigate('/sponsor')}
                >
                    Back to Dashboard
                </Button>
            </Box>
        );
    }

    if (sponsorships.length === 0) {
        return (
            <Box sx={{ p: 3 }}>
                <Typography variant="h4" gutterBottom>
                    Sponsorship Reports
                </Typography>

                <Paper sx={{ p: 3, textAlign: 'center' }}>
                    <Typography variant="body1" paragraph>
                        You don't have any sponsorship data to generate reports.
                    </Typography>
                    <Button
                        variant="contained"
                        color="primary"
                        onClick={() => navigate('/sponsor/packages')}
                    >
                        Browse Available Packages
                    </Button>
                </Paper>
            </Box>
        );
    }

    return (
        <Box sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3 }}>
                <Typography variant="h4">
                    Sponsorship Reports
                </Typography>

                <Stack direction="row" spacing={2}>
                    <Button
                        variant="outlined"
                        startIcon={<DownloadOutlined />}
                        onClick={exportAsCSV}
                    >
                        Export CSV
                    </Button>
                    <Button
                        variant="outlined"
                        startIcon={<PictureAsPdfOutlined />}
                        onClick={exportAsPDF}
                    >
                        Export PDF
                    </Button>
                </Stack>
            </Box>

            {/* Filters Section */}
            <Paper sx={{ p: 3, mb: 4 }}>
                <Typography variant="h6" gutterBottom>
                    Filters
                </Typography>
                <Divider sx={{ mb: 2 }} />

                <Grid container spacing={2} alignItems="center">
                    <Grid item xs={12} md={3}>
                        <FormControl fullWidth>
                            <InputLabel>Event</InputLabel>
                            <Select
                                value={filters.eventId}
                                label="Event"
                                onChange={(e) => handleFilterChange('eventId', e.target.value)}
                                size="small"
                            >
                                <MenuItem value="all">All Events</MenuItem>
                                {events.map((event) => (
                                    <MenuItem key={event.id} value={event.id}>
                                        {event.title}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                    </Grid>

                    <Grid item xs={12} md={3}>
                        <FormControl fullWidth>
                            <InputLabel>Status</InputLabel>
                            <Select
                                value={filters.status}
                                label="Status"
                                onChange={(e) => handleFilterChange('status', e.target.value)}
                                size="small"
                            >
                                <MenuItem value="all">All Statuses</MenuItem>
                                <MenuItem value="pending">Pending</MenuItem>
                                <MenuItem value="approved">Approved</MenuItem>
                                <MenuItem value="active">Active</MenuItem>
                                <MenuItem value="completed">Completed</MenuItem>
                                <MenuItem value="cancelled">Cancelled</MenuItem>
                            </Select>
                        </FormControl>
                    </Grid>

                    <Grid item xs={12} md={2}>
                        <LocalizationProvider dateAdapter={AdapterDateFns}>
                            <DatePicker
                                label="From Date"
                                value={filters.startDate}
                                onChange={(newValue) => handleFilterChange('startDate', newValue)}
                                renderInput={(params) => <TextField size="small" {...params} fullWidth />}
                            />
                        </LocalizationProvider>
                    </Grid>

                    <Grid item xs={12} md={2}>
                        <LocalizationProvider dateAdapter={AdapterDateFns}>
                            <DatePicker
                                label="To Date"
                                value={filters.endDate}
                                onChange={(newValue) => handleFilterChange('endDate', newValue)}
                                renderInput={(params) => <TextField size="small" {...params} fullWidth />}
                            />
                        </LocalizationProvider>
                    </Grid>

                    <Grid item xs={12} md={2}>
                        <Button
                            fullWidth
                            variant="outlined"
                            onClick={resetFilters}
                        >
                            Reset Filters
                        </Button>
                    </Grid>
                </Grid>
            </Paper>

            {/* Summary Cards */}
            <Grid container spacing={3} sx={{ mb: 4 }}>
                <Grid item xs={12} sm={6} md={3}>
                    <Card>
                        <CardContent>
                            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                                Total Sponsored
                            </Typography>
                            <Typography variant="h4">
                                {formatCurrency(metrics.totalSponsored)}
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>

                <Grid item xs={12} sm={6} md={3}>
                    <Card>
                        <CardContent>
                            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                                Active Contracts
                            </Typography>
                            <Typography variant="h4">
                                {metrics.activeContracts}
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>

                <Grid item xs={12} sm={6} md={3}>
                    <Card>
                        <CardContent>
                            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                                Total Paid
                            </Typography>
                            <Typography variant="h4" color="success.main">
                                {formatCurrency(metrics.totalPaid)}
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>

                <Grid item xs={12} sm={6} md={3}>
                    <Card>
                        <CardContent>
                            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                                Remaining Balance
                            </Typography>
                            <Typography variant="h4" color={metrics.remainingBalance > 0 ? "warning.main" : "success.main"}>
                                {formatCurrency(metrics.remainingBalance)}
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>

            {/* Charts */}
            {loadingChart ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', my: 5 }}>
                    <CircularProgress />
                </Box>
            ) : (
                <Grid container spacing={3}>
                    {/* Sponsorship by Event */}
                    <Grid item xs={12} md={6}>
                        <Paper sx={{ p: 3, height: '100%' }}>
                            <Typography variant="h6" gutterBottom>
                                Sponsorship by Event
                            </Typography>
                            <Divider sx={{ mb: 2 }} />

                            {eventDistribution.length === 0 ? (
                                <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 300 }}>
                                    <Typography variant="body1" color="text.secondary">
                                        No data available
                                    </Typography>
                                </Box>
                            ) : (
                                <ResponsiveContainer width="100%" height={300}>
                                    <BarChart
                                        data={eventDistribution}
                                        margin={{ top: 20, right: 30, left: 20, bottom: 70 }}
                                    >
                                        <CartesianGrid strokeDasharray="3 3" />
                                        <XAxis
                                            dataKey="name"
                                            angle={-45}
                                            textAnchor="end"
                                            height={70}
                                            tick={{ fontSize: 12 }}
                                        />
                                        <YAxis />
                                        <Tooltip formatter={(value) => formatCurrency(value)} />
                                        <Legend />
                                        <Bar dataKey="amount" name="Amount" fill="#8884d8" />
                                    </BarChart>
                                </ResponsiveContainer>
                            )}
                        </Paper>
                    </Grid>

                    {/* Package Distribution */}
                    <Grid item xs={12} md={6}>
                        <Paper sx={{ p: 3, height: '100%' }}>
                            <Typography variant="h6" gutterBottom>
                                Package Distribution
                            </Typography>
                            <Divider sx={{ mb: 2 }} />

                            {packageDistribution.length === 0 ? (
                                <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 300 }}>
                                    <Typography variant="body1" color="text.secondary">
                                        No data available
                                    </Typography>
                                </Box>
                            ) : (
                                <ResponsiveContainer width="100%" height={300}>
                                    <PieChart>
                                        <Pie
                                            data={packageDistribution}
                                            cx="50%"
                                            cy="50%"
                                            labelLine={false}
                                            outerRadius={100}
                                            fill="#8884d8"
                                            dataKey="value"
                                            nameKey="name"
                                            label={(entry) => `${entry.name}: ${formatCurrency(entry.value)}`}
                                        >
                                            {packageDistribution.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                            ))}
                                        </Pie>
                                        <Tooltip formatter={(value) => formatCurrency(value)} />
                                        <Legend />
                                    </PieChart>
                                </ResponsiveContainer>
                            )}
                        </Paper>
                    </Grid>

                    {/* Payment Timeline */}
                    <Grid item xs={12}>
                        <Paper sx={{ p: 3 }}>
                            <Typography variant="h6" gutterBottom>
                                Payment Timeline
                            </Typography>
                            <Divider sx={{ mb: 2 }} />

                            {paymentTimeline.length === 0 ? (
                                <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 300 }}>
                                    <Typography variant="body1" color="text.secondary">
                                        No payment data available
                                    </Typography>
                                </Box>
                            ) : (
                                <ResponsiveContainer width="100%" height={300}>
                                    <BarChart
                                        data={paymentTimeline}
                                        margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                                    >
                                        <CartesianGrid strokeDasharray="3 3" />
                                        <XAxis dataKey="date" />
                                        <YAxis />
                                        <Tooltip formatter={(value) => formatCurrency(value)} />
                                        <Legend />
                                        <Bar dataKey="amount" name="Amount Paid" fill="#82ca9d" />
                                    </BarChart>
                                </ResponsiveContainer>
                            )}
                        </Paper>
                    </Grid>

                    {/* Payments Table */}
                    <Grid item xs={12}>
                        <Paper sx={{ p: 3 }}>
                            <Typography variant="h6" gutterBottom>
                                Payment History
                            </Typography>
                            <Divider sx={{ mb: 2 }} />

                            {payments.length === 0 ? (
                                <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}>
                                    <Typography variant="body1" color="text.secondary">
                                        No payment records available
                                    </Typography>
                                </Box>
                            ) : (
                                <TableContainer>
                                    <Table size="small">
                                        <TableHead>
                                            <TableRow>
                                                <TableCell>Date</TableCell>
                                                <TableCell>Event</TableCell>
                                                <TableCell>Package</TableCell>
                                                <TableCell>Method</TableCell>
                                                <TableCell align="right">Amount</TableCell>
                                                <TableCell>Reference</TableCell>
                                            </TableRow>
                                        </TableHead>
                                        <TableBody>
                                            {payments
                                                .sort((a, b) => new Date(b.payment_date) - new Date(a.payment_date))
                                                .slice(0, 10) // Show only the 10 most recent payments
                                                .map((payment) => (
                                                    <TableRow key={payment.id}>
                                                        <TableCell>
                                                            {new Date(payment.payment_date).toLocaleDateString()}
                                                        </TableCell>
                                                        <TableCell>{payment.event_title}</TableCell>
                                                        <TableCell>{payment.package_name}</TableCell>
                                                        <TableCell>{payment.payment_method}</TableCell>
                                                        <TableCell align="right">{formatCurrency(payment.amount)}</TableCell>
                                                        <TableCell>{payment.reference_number || '-'}</TableCell>
                                                    </TableRow>
                                                ))}
                                        </TableBody>
                                    </Table>
                                </TableContainer>
                            )}

                            {payments.length > 10 && (
                                <Box sx={{ mt: 2, textAlign: 'right' }}>
                                    <Typography variant="caption" color="text.secondary">
                                        Showing the 10 most recent payments out of {payments.length} total payments.
                                    </Typography>
                                </Box>
                            )}
                        </Paper>
                    </Grid>
                </Grid>
            )}
        </Box>
    );
};

export default SponsorReports;