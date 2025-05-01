import React, { useState, useEffect, useCallback } from 'react';
import {
    Box,
    Typography,
    Grid,
    Paper,
    Card,
    CardContent,
    CardHeader,
    CircularProgress,
    Alert,
    Divider,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Button,
} from '@mui/material';
import {
    Payments as PaymentsIcon,
    Event as EventIcon,
    MonetizationOn as MonetizationOnIcon,
    AttachMoney as AttachMoneyIcon,
    AccountBalance as AccountBalanceIcon
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { format } from 'date-fns';
import { useAuth } from '../../context/AuthContext';
import { analyticsService } from '../../services/api';
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

// Custom colors for the pie chart
const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

// Card component for displaying key metrics
const MetricCard = ({ title, value, icon, color }) => {
    return (
        <Card sx={{ height: '100%' }}>
            <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                    <Typography variant="subtitle2" color="textSecondary">
                        {title}
                    </Typography>
                    <Box sx={{
                        backgroundColor: `${color}.100`,
                        borderRadius: '50%',
                        width: 40,
                        height: 40,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                    }}>
                        {React.cloneElement(icon, { sx: { color: `${color}.main` } })}
                    </Box>
                </Box>
                <Typography variant="h4" component="div" fontWeight="bold">
                    ${value?.toLocaleString() || 0}
                </Typography>
            </CardContent>
        </Card>
    );
};

const FinanceDashboard = () => {
    const { user } = useAuth();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [financialData, setFinancialData] = useState({
        summary: {},
        revenueSources: {},
        revenueByMonth: [],
        eventBreakdown: []
    });
    const [datePeriod, setDatePeriod] = useState('all');
    const [startDate, setStartDate] = useState(null);
    const [endDate, setEndDate] = useState(null);
    const [customDates, setCustomDates] = useState(false);

    // Format for better display
    const formatCurrency = (value) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 2
        }).format(value);
    };

    // Calculate totals for pie chart
    const calculateTotals = (data) => {
        if (!data) return [];

        return [
            { name: 'Registrations', value: data.registrations?.total_amount || 0 },
            { name: 'Sponsorships', value: data.sponsorships?.total_amount || 0 },
            { name: 'Accommodations', value: data.accommodations?.total_amount || 0 }
        ];
    };

    // Prepare data for the monthly revenue chart
    const prepareMonthlyData = (data) => {
        if (!data || !Array.isArray(data)) return [];

        return data.map(item => ({
            month: item.month,
            registrations: item.registration_revenue || 0,
            sponsorships: item.sponsorship_revenue || 0,
            accommodations: item.accommodation_revenue || 0,
            total: item.total_revenue || 0
        }));
    };

    // Fetch financial data based on date filters
    const fetchFinancialData = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);

            const params = {};

            if (customDates) {
                if (startDate) params.startDate = format(startDate, 'yyyy-MM-dd');
                if (endDate) params.endDate = format(endDate, 'yyyy-MM-dd');
            } else {
                const now = new Date();
                if (datePeriod === 'month') {
                    params.startDate = format(new Date(now.getFullYear(), now.getMonth(), 1), 'yyyy-MM-dd');
                    params.endDate = format(now, 'yyyy-MM-dd');
                } else if (datePeriod === 'quarter') {
                    const quarter = Math.floor(now.getMonth() / 3);
                    params.startDate = format(new Date(now.getFullYear(), quarter * 3, 1), 'yyyy-MM-dd');
                    params.endDate = format(now, 'yyyy-MM-dd');
                } else if (datePeriod === 'year') {
                    params.startDate = format(new Date(now.getFullYear(), 0, 1), 'yyyy-MM-dd');
                    params.endDate = format(now, 'yyyy-MM-dd');
                }
            }

            try {
                const response = await analyticsService.getFinancialMetrics(params);
                setFinancialData(response.data);
            } catch (error) {
                console.error("Error fetching financial data:", error);
                // Provide sample data for development or when API fails
                setFinancialData({
                    financialSummary: {
                        total_revenue: 56750,
                        total_expenses: 32400,
                        net_profit: 24350,
                        profit_margin: 0.43
                    },
                    revenueSources: {
                        registrations: { total_amount: 28500, transaction_count: 285 },
                        sponsorships: { total_amount: 22500, transaction_count: 15 },
                        accommodations: { total_amount: 5750, transaction_count: 46 }
                    },
                    revenueByMonth: [
                        { month: '2025-01', registration_revenue: 9500, sponsorship_revenue: 7500, accommodation_revenue: 1750, total_revenue: 18750 },
                        { month: '2025-02', registration_revenue: 10000, sponsorship_revenue: 7500, accommodation_revenue: 2000, total_revenue: 19500 },
                        { month: '2025-03', registration_revenue: 9000, sponsorship_revenue: 7500, accommodation_revenue: 2000, total_revenue: 18500 }
                    ],
                    eventBreakdown: [
                        { event_id: 1, event_title: 'Tech Conference', revenue: 28000, percentage: 49.34 },
                        { event_id: 2, event_title: 'Hackathon', revenue: 18500, percentage: 32.60 },
                        { event_id: 3, event_title: 'Workshop Series', revenue: 10250, percentage: 18.06 }
                    ]
                });
                setError('Could not connect to the analytics API. Showing sample data.');
            }

            setLoading(false);
        } catch (err) {
            console.error("Error in finance dashboard:", err);
            setLoading(false);
            setError('Failed to load financial data');
        }
    }, [customDates, startDate, endDate, datePeriod]);

    useEffect(() => {
        fetchFinancialData();
    }, [fetchFinancialData]);

    const handleDatePeriodChange = (event) => {
        const period = event.target.value;
        setDatePeriod(period);
        setCustomDates(period === 'custom');
    };

    const handleApplyCustomDates = () => {
        fetchFinancialData();
    };

    return (
        <Box sx={{ p: 3 }}>
            <Typography variant="h4" sx={{ mb: 2 }}>Financial Dashboard</Typography>

            {/* Date filter controls */}
            <Paper sx={{ p: 2, mb: 3 }}>
                <Grid container spacing={2} alignItems="center">
                    <Grid item xs={12} md={3}>
                        <FormControl fullWidth size="small">
                            <InputLabel id="date-period-label">Date Period</InputLabel>
                            <Select
                                labelId="date-period-label"
                                value={datePeriod}
                                label="Date Period"
                                onChange={handleDatePeriodChange}
                            >
                                <MenuItem value="all">All Time</MenuItem>
                                <MenuItem value="month">This Month</MenuItem>
                                <MenuItem value="quarter">This Quarter</MenuItem>
                                <MenuItem value="year">This Year</MenuItem>
                                <MenuItem value="custom">Custom Range</MenuItem>
                            </Select>
                        </FormControl>
                    </Grid>

                    {customDates && (
                        <LocalizationProvider dateAdapter={AdapterDateFns}>
                            <Grid item xs={12} md={3}>
                                <DatePicker
                                    label="Start Date"
                                    value={startDate}
                                    onChange={(date) => setStartDate(date)}
                                    renderInput={(params) => <TextField {...params} fullWidth size="small" />}
                                    slotProps={{
                                        textField: { fullWidth: true, size: "small" }
                                    }}
                                />
                            </Grid>
                            <Grid item xs={12} md={3}>
                                <DatePicker
                                    label="End Date"
                                    value={endDate}
                                    onChange={(date) => setEndDate(date)}
                                    minDate={startDate}
                                    slotProps={{
                                        textField: { fullWidth: true, size: "small" }
                                    }}
                                />
                            </Grid>
                            <Grid item xs={12} md={3}>
                                <Button
                                    variant="contained"
                                    onClick={handleApplyCustomDates}
                                    fullWidth
                                >
                                    Apply
                                </Button>
                            </Grid>
                        </LocalizationProvider>
                    )}
                </Grid>
            </Paper>

            {error && (
                <Alert severity="warning" sx={{ mb: 3 }}>
                    {error}
                </Alert>
            )}

            {/* Loading indicator */}
            {loading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', my: 5 }}>
                    <CircularProgress />
                </Box>
            ) : (
                <>
                    {/* Key financial metrics */}
                    <Typography variant="h6" sx={{ mb: 2 }}>Key Financial Metrics</Typography>
                    <Grid container spacing={3} sx={{ mb: 4 }}>
                        <Grid item xs={12} sm={6} md={4}>
                            <MetricCard
                                title="Total Revenue"
                                value={financialData.financialSummary?.total_revenue}
                                icon={<AttachMoneyIcon />}
                                color="success"
                            />
                        </Grid>
                        <Grid item xs={12} sm={6} md={4}>
                            <MetricCard
                                title="Total Expenses"
                                value={financialData.financialSummary?.total_expenses}
                                icon={<PaymentsIcon />}
                                color="error"
                            />
                        </Grid>
                        <Grid item xs={12} sm={6} md={4}>
                            <MetricCard
                                title="Net Profit"
                                value={financialData.financialSummary?.net_profit}
                                icon={<AccountBalanceIcon />}
                                color="info"
                            />
                        </Grid>
                    </Grid>

                    {/* Revenue Sources */}
                    <Grid container spacing={3} sx={{ mb: 4 }}>
                        <Grid item xs={12} md={7}>
                            <Card sx={{ height: '100%' }}>
                                <CardHeader title="Monthly Revenue Trends" />
                                <Divider />
                                <CardContent sx={{ height: 300 }}>
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart
                                            data={prepareMonthlyData(financialData.revenueByMonth)}
                                            margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                                        >
                                            <CartesianGrid strokeDasharray="3 3" />
                                            <XAxis dataKey="month" />
                                            <YAxis />
                                            <Tooltip formatter={(value) => formatCurrency(value)} />
                                            <Legend />
                                            <Bar dataKey="registrations" stackId="a" name="Event Registrations" fill="#0088FE" />
                                            <Bar dataKey="sponsorships" stackId="a" name="Sponsorships" fill="#00C49F" />
                                            <Bar dataKey="accommodations" stackId="a" name="Accommodations" fill="#FFBB28" />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </CardContent>
                            </Card>
                        </Grid>
                        <Grid item xs={12} md={5}>
                            <Card sx={{ height: '100%' }}>
                                <CardHeader title="Revenue Distribution" />
                                <Divider />
                                <CardContent sx={{ height: 300 }}>
                                    <ResponsiveContainer width="100%" height="100%">
                                        <PieChart>
                                            <Pie
                                                data={calculateTotals(financialData.revenueSources)}
                                                cx="50%"
                                                cy="50%"
                                                innerRadius={60}
                                                outerRadius={100}
                                                fill="#8884d8"
                                                paddingAngle={2}
                                                dataKey="value"
                                                nameKey="name"
                                                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(1)}%`}
                                            >
                                                {calculateTotals(financialData.revenueSources).map((entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                                ))}
                                            </Pie>
                                            <Tooltip formatter={(value) => formatCurrency(value)} />
                                        </PieChart>
                                    </ResponsiveContainer>
                                </CardContent>
                            </Card>
                        </Grid>
                    </Grid>

                    {/* Event Revenue Breakdown */}
                    <Typography variant="h6" sx={{ mb: 2 }}>Event Revenue Breakdown</Typography>
                    <TableContainer component={Paper} sx={{ mb: 4 }}>
                        <Table>
                            <TableHead>
                                <TableRow>
                                    <TableCell>Event</TableCell>
                                    <TableCell align="right">Revenue</TableCell>
                                    <TableCell align="right">Percentage</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {financialData.eventBreakdown && financialData.eventBreakdown.length > 0 ? (
                                    financialData.eventBreakdown.map((event) => (
                                        <TableRow key={event.event_id}>
                                            <TableCell>{event.event_title}</TableCell>
                                            <TableCell align="right">{formatCurrency(event.revenue)}</TableCell>
                                            <TableCell align="right">{event.percentage.toFixed(2)}%</TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={3} align="center">No event revenue data available</TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </TableContainer>

                    {/* Revenue Source Details */}
                    <Typography variant="h6" sx={{ mb: 2 }}>Revenue Source Details</Typography>
                    <Grid container spacing={3}>
                        <Grid item xs={12} md={4}>
                            <Card>
                                <CardHeader
                                    title="Event Registrations"
                                    avatar={<EventIcon color="primary" />}
                                />
                                <Divider />
                                <CardContent>
                                    <Typography variant="h5" color="primary" gutterBottom>
                                        {formatCurrency(financialData.revenueSources?.registrations?.total_amount || 0)}
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary">
                                        Total transactions: {financialData.revenueSources?.registrations?.transaction_count || 0}
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary">
                                        Avg. per transaction: {formatCurrency((financialData.revenueSources?.registrations?.total_amount || 0) /
                                            (financialData.revenueSources?.registrations?.transaction_count || 1))}
                                    </Typography>
                                </CardContent>
                            </Card>
                        </Grid>
                        <Grid item xs={12} md={4}>
                            <Card>
                                <CardHeader
                                    title="Sponsorships"
                                    avatar={<MonetizationOnIcon color="secondary" />}
                                />
                                <Divider />
                                <CardContent>
                                    <Typography variant="h5" color="secondary" gutterBottom>
                                        {formatCurrency(financialData.revenueSources?.sponsorships?.total_amount || 0)}
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary">
                                        Total transactions: {financialData.revenueSources?.sponsorships?.transaction_count || 0}
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary">
                                        Avg. per transaction: {formatCurrency((financialData.revenueSources?.sponsorships?.total_amount || 0) /
                                            (financialData.revenueSources?.sponsorships?.transaction_count || 1))}
                                    </Typography>
                                </CardContent>
                            </Card>
                        </Grid>
                        <Grid item xs={12} md={4}>
                            <Card>
                                <CardHeader
                                    title="Accommodations"
                                    avatar={<PaymentsIcon color="warning" />}
                                />
                                <Divider />
                                <CardContent>
                                    <Typography variant="h5" color="warning.main" gutterBottom>
                                        {formatCurrency(financialData.revenueSources?.accommodations?.total_amount || 0)}
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary">
                                        Total transactions: {financialData.revenueSources?.accommodations?.transaction_count || 0}
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary">
                                        Avg. per transaction: {formatCurrency((financialData.revenueSources?.accommodations?.total_amount || 0) /
                                            (financialData.revenueSources?.accommodations?.transaction_count || 1))}
                                    </Typography>
                                </CardContent>
                            </Card>
                        </Grid>
                    </Grid>
                </>
            )}
        </Box>
    );
};

export default FinanceDashboard;