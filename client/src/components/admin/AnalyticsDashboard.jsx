import React, { useState, useEffect } from 'react';
import {
    Box,
    Typography,
    Paper,
    Grid,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Button,
    Card,
    CardContent,
    CardHeader,
    Divider,
    CircularProgress,
    Alert,
    Stack,
    Tabs,
    Tab
} from '@mui/material';
import { DownloadOutlined, PictureAsPdf, InsertDriveFile } from '@mui/icons-material';
import axios from 'axios';
// Note: Chart library would need to be installed
// npm install recharts
import {
    LineChart,
    Line,
    BarChart,
    Bar,
    PieChart,
    Pie,
    Cell,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer
} from 'recharts';

// Chart color palette
const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

const AnalyticsDashboard = () => {
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState(0);
    const [timeRange, setTimeRange] = useState('month');
    const [analyticsData, setAnalyticsData] = useState({
        participationStats: [],
        venueUtilization: [],
        financialMetrics: {
            revenue: [],
            expenses: [],
            summary: { totalRevenue: 0, totalExpenses: 0, profit: 0 }
        },
        accommodationMetrics: [],
        demographicMetrics: {
            genderDistribution: [],
            ageDistribution: [],
            locationDistribution: []
        }
    });

    useEffect(() => {
        fetchAnalyticsData();
    }, [timeRange]);

    const fetchAnalyticsData = async () => {
        try {
            setLoading(true);

            // Fetch data from multiple endpoints in parallel
            const [participationResponse, venueResponse, financialResponse, accommodationResponse, demographicResponse] =
                await Promise.all([
                    axios.get(`/api/analytics/participation?timeRange=${timeRange}`, {
                        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
                    }),
                    axios.get(`/api/analytics/venues?timeRange=${timeRange}`, {
                        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
                    }),
                    axios.get(`/api/analytics/financials?timeRange=${timeRange}`, {
                        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
                    }),
                    axios.get(`/api/analytics/accommodations?timeRange=${timeRange}`, {
                        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
                    }),
                    axios.get(`/api/analytics/demographics?timeRange=${timeRange}`, {
                        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
                    })
                ]);

            // Update state with fetched data
            setAnalyticsData({
                participationStats: participationResponse.data,
                venueUtilization: venueResponse.data,
                financialMetrics: financialResponse.data,
                accommodationMetrics: accommodationResponse.data,
                demographicMetrics: demographicResponse.data
            });

            setLoading(false);
        } catch (error) {
            console.error('Error fetching analytics data:', error);
            setLoading(false);
            // In a real app, handle the error state
        }
    };

    const handleTabChange = (event, newValue) => {
        setActiveTab(newValue);
    };

    const handleTimeRangeChange = (event) => {
        setTimeRange(event.target.value);
    };

    const handleExportData = async (format) => {
        try {
            const response = await axios.get(`/api/analytics/export?format=${format}&timeRange=${timeRange}`, {
                headers: {
                    Authorization: `Bearer ${localStorage.getItem('token')}`,
                    'Accept': format === 'pdf' ? 'application/pdf' : 'application/json'
                },
                responseType: format === 'pdf' ? 'blob' : 'json'
            });

            if (format === 'pdf' || format === 'excel') {
                // Create download link for file
                const url = window.URL.createObjectURL(new Blob([response.data]));
                const link = document.createElement('a');
                link.href = url;
                link.setAttribute('download', `analytics-report.${format === 'pdf' ? 'pdf' : 'xlsx'}`);
                document.body.appendChild(link);
                link.click();
                link.remove();
            } else {
                // For JSON, just display success message
                console.log('Data exported successfully:', response.data);
            }
        } catch (error) {
            console.error('Error exporting data:', error);
        }
    };

    // Generate demo data for charts when actual API isn't available
    const getDemoData = () => {
        // This would be replaced by actual API data
        return {
            participationStats: [
                { name: 'Tech Events', participants: 240 },
                { name: 'Business Events', participants: 180 },
                { name: 'Art Events', participants: 120 },
                { name: 'Sports Events', participants: 160 },
                { name: 'Academic Events', participants: 200 }
            ],
            revenueOverTime: [
                { month: 'Jan', revenue: 4000 },
                { month: 'Feb', revenue: 3000 },
                { month: 'Mar', revenue: 2000 },
                { month: 'Apr', revenue: 2780 },
                { month: 'May', revenue: 1890 },
                { month: 'Jun', revenue: 2390 }
            ],
            demographicMetrics: {
                genderDistribution: [
                    { name: 'Male', value: 65 },
                    { name: 'Female', value: 30 },
                    { name: 'Non-binary', value: 5 }
                ]
            },
            accommodationOccupancy: [
                { name: 'Dorm A', total: 100, occupied: 75 },
                { name: 'Dorm B', total: 80, occupied: 65 },
                { name: 'Dorm C', total: 60, occupied: 45 },
                { name: 'Dorm D', total: 40, occupied: 20 }
            ]
        };
    };

    // Sample data for demonstration
    const demoData = getDemoData();

    // Render the participation statistics chart
    const renderParticipationChart = () => {
        const data = demoData.participationStats;

        return (
            <Card sx={{ height: '100%' }}>
                <CardHeader title="Event Participation" />
                <Divider />
                <CardContent sx={{ height: 300 }}>
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                            data={data}
                            margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                        >
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="name" />
                            <YAxis />
                            <Tooltip />
                            <Legend />
                            <Bar dataKey="participants" fill="#8884d8" name="Participants" />
                        </BarChart>
                    </ResponsiveContainer>
                </CardContent>
            </Card>
        );
    };

    // Render the financial metrics chart
    const renderFinancialChart = () => {
        const data = demoData.revenueOverTime;

        return (
            <Card sx={{ height: '100%' }}>
                <CardHeader title="Revenue Over Time" />
                <Divider />
                <CardContent sx={{ height: 300 }}>
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart
                            data={data}
                            margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                        >
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="month" />
                            <YAxis />
                            <Tooltip formatter={(value) => `$${value}`} />
                            <Legend />
                            <Line type="monotone" dataKey="revenue" stroke="#8884d8" activeDot={{ r: 8 }} name="Revenue ($)" />
                        </LineChart>
                    </ResponsiveContainer>
                </CardContent>
            </Card>
        );
    };

    // Render the demographic metrics chart
    const renderDemographicChart = () => {
        const data = demoData.demographicMetrics.genderDistribution;

        return (
            <Card sx={{ height: '100%' }}>
                <CardHeader title="Gender Distribution" />
                <Divider />
                <CardContent sx={{ height: 300 }}>
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie
                                data={data}
                                cx="50%"
                                cy="50%"
                                labelLine={false}
                                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                                outerRadius={90}
                                fill="#8884d8"
                                dataKey="value"
                            >
                                {data.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                            </Pie>
                            <Tooltip formatter={(value) => `${value}%`} />
                            <Legend />
                        </PieChart>
                    </ResponsiveContainer>
                </CardContent>
            </Card>
        );
    };

    // Render the accommodation occupancy chart
    const renderAccommodationChart = () => {
        const data = demoData.accommodationOccupancy;

        return (
            <Card sx={{ height: '100%' }}>
                <CardHeader title="Accommodation Occupancy" />
                <Divider />
                <CardContent sx={{ height: 300 }}>
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                            data={data}
                            margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                        >
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="name" />
                            <YAxis />
                            <Tooltip />
                            <Legend />
                            <Bar dataKey="total" fill="#8884d8" name="Total Capacity" />
                            <Bar dataKey="occupied" fill="#82ca9d" name="Occupied" />
                        </BarChart>
                    </ResponsiveContainer>
                </CardContent>
            </Card>
        );
    };

    const renderParticipationTab = () => (
        <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
                {renderParticipationChart()}
            </Grid>
            <Grid item xs={12} md={6}>
                <Card sx={{ height: '100%' }}>
                    <CardHeader title="Participation Summary" />
                    <Divider />
                    <CardContent>
                        <Typography variant="body1" gutterBottom>
                            Total Participants: <b>900</b>
                        </Typography>
                        <Typography variant="body1" gutterBottom>
                            Most Popular Event Type: <b>Tech Events</b>
                        </Typography>
                        <Typography variant="body1" gutterBottom>
                            Participation Growth: <b>+15%</b> compared to previous period
                        </Typography>
                        <Typography variant="body1" gutterBottom>
                            Average Team Size: <b>4.2</b> members
                        </Typography>
                    </CardContent>
                </Card>
            </Grid>
        </Grid>
    );

    const renderFinancialTab = () => (
        <Grid container spacing={3}>
            <Grid item xs={12} md={8}>
                {renderFinancialChart()}
            </Grid>
            <Grid item xs={12} md={4}>
                <Card sx={{ height: '100%' }}>
                    <CardHeader title="Financial Summary" />
                    <Divider />
                    <CardContent>
                        <Typography variant="body1" gutterBottom>
                            Total Revenue: <b>$14,060</b>
                        </Typography>
                        <Typography variant="body1" gutterBottom>
                            Total Expenses: <b>$8,230</b>
                        </Typography>
                        <Typography variant="body1" gutterBottom>
                            Net Profit: <b>$5,830</b>
                        </Typography>
                        <Typography variant="body1" gutterBottom>
                            Profit Margin: <b>41.5%</b>
                        </Typography>
                        <Typography variant="body1" gutterBottom>
                            Average Registration Fee: <b>$45</b>
                        </Typography>
                        <Typography variant="body1" gutterBottom>
                            Sponsorship Income: <b>$6,500</b>
                        </Typography>
                    </CardContent>
                </Card>
            </Grid>
        </Grid>
    );

    const renderDemographicTab = () => (
        <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
                {renderDemographicChart()}
            </Grid>
            <Grid item xs={12} md={6}>
                <Card sx={{ height: '100%' }}>
                    <CardHeader title="Demographic Insights" />
                    <Divider />
                    <CardContent>
                        <Typography variant="body1" gutterBottom>
                            Average Age: <b>24.5 years</b>
                        </Typography>
                        <Typography variant="body1" gutterBottom>
                            Most Common Location: <b>Karachi (42%)</b>
                        </Typography>
                        <Typography variant="body1" gutterBottom>
                            International Participants: <b>15%</b>
                        </Typography>
                        <Typography variant="body1" gutterBottom>
                            First-time Participants: <b>65%</b>
                        </Typography>
                        <Typography variant="body1" gutterBottom>
                            Educational Background: <b>78% University Students</b>
                        </Typography>
                    </CardContent>
                </Card>
            </Grid>
        </Grid>
    );

    const renderAccommodationTab = () => (
        <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
                {renderAccommodationChart()}
            </Grid>
            <Grid item xs={12} md={6}>
                <Card sx={{ height: '100%' }}>
                    <CardHeader title="Accommodation Summary" />
                    <Divider />
                    <CardContent>
                        <Typography variant="body1" gutterBottom>
                            Total Capacity: <b>280 beds</b>
                        </Typography>
                        <Typography variant="body1" gutterBottom>
                            Current Occupancy Rate: <b>73.2%</b>
                        </Typography>
                        <Typography variant="body1" gutterBottom>
                            Most Requested Accommodation: <b>Dorm A</b>
                        </Typography>
                        <Typography variant="body1" gutterBottom>
                            Average Stay Duration: <b>3.2 days</b>
                        </Typography>
                        <Typography variant="body1" gutterBottom>
                            Total Accommodation Revenue: <b>$4,350</b>
                        </Typography>
                    </CardContent>
                </Card>
            </Grid>
        </Grid>
    );

    // Render tab content based on active tab
    const renderTabContent = () => {
        switch (activeTab) {
            case 0: return renderParticipationTab();
            case 1: return renderFinancialTab();
            case 2: return renderDemographicTab();
            case 3: return renderAccommodationTab();
            default: return renderParticipationTab();
        }
    };

    return (
        <Box sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3, alignItems: 'center', flexWrap: 'wrap' }}>
                <Typography variant="h4">Analytics Dashboard</Typography>

                <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', mt: { xs: 2, sm: 0 } }}>
                    <FormControl size="small" sx={{ minWidth: 150 }}>
                        <InputLabel id="time-range-label">Time Range</InputLabel>
                        <Select
                            labelId="time-range-label"
                            value={timeRange}
                            label="Time Range"
                            onChange={handleTimeRangeChange}
                        >
                            <MenuItem value="week">This Week</MenuItem>
                            <MenuItem value="month">This Month</MenuItem>
                            <MenuItem value="quarter">This Quarter</MenuItem>
                            <MenuItem value="year">This Year</MenuItem>
                            <MenuItem value="all">All Time</MenuItem>
                        </Select>
                    </FormControl>

                    <Button
                        variant="outlined"
                        startIcon={<DownloadOutlined />}
                        onClick={() => handleExportData('json')}
                    >
                        Export Data
                    </Button>

                    <Button
                        variant="outlined"
                        startIcon={<PictureAsPdf />}
                        onClick={() => handleExportData('pdf')}
                    >
                        PDF Report
                    </Button>

                    <Button
                        variant="outlined"
                        startIcon={<InsertDriveFile />}
                        onClick={() => handleExportData('excel')}
                    >
                        Excel
                    </Button>
                </Box>
            </Box>

            <Paper sx={{ mb: 3 }}>
                <Tabs
                    value={activeTab}
                    onChange={handleTabChange}
                    variant="fullWidth"
                    indicatorColor="primary"
                    textColor="primary"
                >
                    <Tab label="Event Participation" />
                    <Tab label="Financial Analysis" />
                    <Tab label="Demographics" />
                    <Tab label="Accommodation" />
                </Tabs>
            </Paper>

            {loading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 300 }}>
                    <CircularProgress />
                </Box>
            ) : (
                renderTabContent()
            )}

            <Box sx={{ mt: 4 }}>
                <Typography variant="h6" gutterBottom>Saved Reports</Typography>
                <Grid container spacing={2}>
                    <Grid item xs={12} sm={6} md={3}>
                        <Card>
                            <CardContent>
                                <Typography variant="h6">March 2025 Event Summary</Typography>
                                <Typography variant="body2" color="text.secondary">
                                    Generated on March 31, 2025
                                </Typography>
                                <Button
                                    variant="text"
                                    sx={{ mt: 1 }}
                                    startIcon={<PictureAsPdf />}
                                >
                                    Download PDF
                                </Button>
                            </CardContent>
                        </Card>
                    </Grid>
                    <Grid item xs={12} sm={6} md={3}>
                        <Card>
                            <CardContent>
                                <Typography variant="h6">Q1 2025 Financial Analysis</Typography>
                                <Typography variant="body2" color="text.secondary">
                                    Generated on April 5, 2025
                                </Typography>
                                <Button
                                    variant="text"
                                    sx={{ mt: 1 }}
                                    startIcon={<PictureAsPdf />}
                                >
                                    Download PDF
                                </Button>
                            </CardContent>
                        </Card>
                    </Grid>
                </Grid>
            </Box>
        </Box>
    );
};

export default AnalyticsDashboard;