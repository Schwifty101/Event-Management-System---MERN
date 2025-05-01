import React, { useState, useEffect } from 'react';
import {
    Box,
    Typography,
    Grid,
    Card,
    CardContent,
    CardActions,
    Button,
    Chip,
    CircularProgress,
    Alert,
    Snackbar,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    TextField,
    Divider,
    Paper,
    List,
    ListItem,
    ListItemIcon,
    ListItemText
} from '@mui/material';
import {
    Check as CheckIcon,
    Event as EventIcon,
    AttachMoney as MoneyIcon,
    Star as StarIcon,
    StarBorder as StarBorderIcon
} from '@mui/icons-material';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import { LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const SponsorshipPackages = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [packages, setPackages] = useState([]);
    const [events, setEvents] = useState([]);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [selectedPackage, setSelectedPackage] = useState(null);
    const [alert, setAlert] = useState({
        open: false,
        message: '',
        severity: 'success'
    });
    const [sponsorshipData, setSponsorshipData] = useState({
        event_id: '',
        contract_start_date: new Date(),
        contract_end_date: new Date(new Date().setMonth(new Date().getMonth() + 3)), // 3 months from now by default
        contract_document: '',
        notes: ''
    });
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                // Fetch sponsorship packages
                const packagesRes = await axios.get('/api/sponsor-packages', {
                    headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
                    params: { isActive: true }
                });

                setPackages(packagesRes.data.packages || []);

                // Fetch available events
                const eventsRes = await axios.get('/api/events', {
                    headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
                    params: { upcoming: true }
                });

                setEvents(eventsRes.data.events || []);
                setLoading(false);
            } catch (error) {
                console.error('Error fetching sponsorship packages:', error);
                setAlert({
                    open: true,
                    message: 'Failed to load sponsorship packages',
                    severity: 'error'
                });
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    const handleOpenDialog = (pkg) => {
        setSelectedPackage(pkg);

        // Reset sponsorship data
        setSponsorshipData({
            event_id: events.length > 0 ? events[0].id : '',
            contract_start_date: new Date(),
            contract_end_date: new Date(new Date().setMonth(new Date().getMonth() + 3)),
            contract_document: '',
            notes: ''
        });

        setDialogOpen(true);
    };

    const handleCloseDialog = () => {
        setDialogOpen(false);
        setSelectedPackage(null);
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setSponsorshipData({
            ...sponsorshipData,
            [name]: value
        });
    };

    const handleDateChange = (name, value) => {
        setSponsorshipData({
            ...sponsorshipData,
            [name]: value
        });
    };

    const handleSubmit = async () => {
        try {
            // Validate form
            if (!sponsorshipData.event_id) {
                setAlert({
                    open: true,
                    message: 'Please select an event to sponsor',
                    severity: 'error'
                });
                return;
            }

            setSubmitting(true);

            const sponsorship = {
                package_id: selectedPackage.id,
                event_id: sponsorshipData.event_id,
                contract_start_date: sponsorshipData.contract_start_date.toISOString(),
                contract_end_date: sponsorshipData.contract_end_date.toISOString(),
                contract_document: sponsorshipData.contract_document,
                notes: sponsorshipData.notes
            };

            const response = await axios.post('/api/sponsorships', sponsorship, {
                headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
            });

            setAlert({
                open: true,
                message: 'Sponsorship application submitted successfully!',
                severity: 'success'
            });

            handleCloseDialog();

            // Navigate to contracts page after short delay
            setTimeout(() => {
                navigate('/sponsor/sponsorships');
            }, 2000);
        } catch (error) {
            console.error('Error submitting sponsorship:', error);
            setAlert({
                open: true,
                message: error.response?.data?.message || 'Failed to submit sponsorship application',
                severity: 'error'
            });
            setSubmitting(false);
        }
    };

    const handleCloseAlert = () => {
        setAlert({
            ...alert,
            open: false
        });
    };

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 0
        }).format(amount);
    };

    const renderBenefits = (benefits) => {
        if (!benefits) return <Typography>No specific benefits listed</Typography>;

        try {
            // Try parsing as JSON if it's a string
            const benefitsList = typeof benefits === 'string' ? JSON.parse(benefits) : benefits;

            if (Array.isArray(benefitsList)) {
                return (
                    <List dense>
                        {benefitsList.map((benefit, index) => (
                            <ListItem key={index} dense>
                                <ListItemIcon sx={{ minWidth: 30 }}>
                                    <CheckIcon color="success" fontSize="small" />
                                </ListItemIcon>
                                <ListItemText primary={benefit} />
                            </ListItem>
                        ))}
                    </List>
                );
            }
        } catch (e) {
            // If not valid JSON, split by newlines or commas
            const benefitsList = benefits.split(/[,\n]+/).filter(b => b.trim());

            if (benefitsList.length > 0) {
                return (
                    <List dense>
                        {benefitsList.map((benefit, index) => (
                            <ListItem key={index} dense>
                                <ListItemIcon sx={{ minWidth: 30 }}>
                                    <CheckIcon color="success" fontSize="small" />
                                </ListItemIcon>
                                <ListItemText primary={benefit.trim()} />
                            </ListItem>
                        ))}
                    </List>
                );
            }
        }

        // Fallback to displaying as regular text
        return <Typography>{benefits}</Typography>;
    };

    const getPackageTierColor = (packageName) => {
        const nameLower = packageName.toLowerCase();

        if (nameLower.includes('title') || nameLower.includes('platinum')) return 'error';
        if (nameLower.includes('gold')) return 'warning';
        if (nameLower.includes('silver')) return 'info';
        if (nameLower.includes('bronze')) return 'secondary';
        return 'default';
    };

    if (loading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
                <CircularProgress />
            </Box>
        );
    }

    if (packages.length === 0) {
        return (
            <Box sx={{ p: 3 }}>
                <Typography variant="h4" gutterBottom>
                    Sponsorship Packages
                </Typography>

                <Paper sx={{ p: 3, textAlign: 'center' }}>
                    <Typography variant="body1" paragraph>
                        There are no sponsorship packages available at the moment.
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        Please check back later or contact the event organizers.
                    </Typography>
                </Paper>
            </Box>
        );
    }

    return (
        <Box sx={{ p: 3 }}>
            <Box sx={{ mb: 4 }}>
                <Typography variant="h4" gutterBottom>
                    Sponsorship Packages
                </Typography>
                <Typography variant="body1" color="text.secondary">
                    Choose a sponsorship package that suits your organization's goals and budget.
                </Typography>
            </Box>

            <Grid container spacing={3}>
                {packages.map((pkg) => (
                    <Grid item xs={12} md={6} lg={4} key={pkg.id}>
                        <Card
                            sx={{
                                height: '100%',
                                display: 'flex',
                                flexDirection: 'column',
                                boxShadow: pkg.name.toLowerCase().includes('title') || pkg.name.toLowerCase().includes('platinum')
                                    ? '0 8px 16px rgba(0, 0, 0, 0.2)'
                                    : undefined
                            }}
                        >
                            <Box
                                sx={{
                                    bgcolor: getPackageTierColor(pkg.name) + '.main',
                                    color: 'white',
                                    p: 1.5,
                                    textAlign: 'center'
                                }}
                            >
                                <Typography variant="h6">
                                    {pkg.name}
                                </Typography>
                            </Box>

                            <CardContent sx={{ flexGrow: 1 }}>
                                <Box sx={{ textAlign: 'center', mb: 2 }}>
                                    <Typography variant="h5" color="primary">
                                        {formatCurrency(pkg.price)}
                                    </Typography>

                                    {pkg.max_sponsors && (
                                        <Typography variant="body2" color="text.secondary">
                                            Limited to {pkg.max_sponsors} sponsors
                                        </Typography>
                                    )}
                                </Box>

                                <Divider sx={{ my: 2 }} />

                                <Typography variant="subtitle1" gutterBottom>
                                    Benefits:
                                </Typography>

                                {renderBenefits(pkg.benefits)}

                                {pkg.description && (
                                    <Typography variant="body2" sx={{ mt: 2, color: 'text.secondary' }}>
                                        {pkg.description}
                                    </Typography>
                                )}
                            </CardContent>

                            <CardActions sx={{ p: 2, pt: 0 }}>
                                <Button
                                    variant="contained"
                                    fullWidth
                                    onClick={() => handleOpenDialog(pkg)}
                                >
                                    Select Package
                                </Button>
                            </CardActions>
                        </Card>
                    </Grid>
                ))}
            </Grid>

            {/* Application Dialog */}
            <Dialog
                open={dialogOpen}
                onClose={handleCloseDialog}
                fullWidth
                maxWidth="md"
            >
                <DialogTitle>
                    Apply for {selectedPackage?.name} Package
                </DialogTitle>

                <DialogContent dividers>
                    <Typography variant="subtitle1" gutterBottom>
                        Package Price: {selectedPackage && formatCurrency(selectedPackage.price)}
                    </Typography>

                    <Grid container spacing={3} sx={{ mt: 1 }}>
                        <Grid item xs={12}>
                            <FormControl fullWidth required>
                                <InputLabel>Select Event to Sponsor</InputLabel>
                                <Select
                                    name="event_id"
                                    value={sponsorshipData.event_id}
                                    onChange={handleInputChange}
                                    disabled={submitting}
                                >
                                    {events.map((event) => (
                                        <MenuItem key={event.id} value={event.id}>
                                            {event.title}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        </Grid>

                        <Grid item xs={12} md={6}>
                            <LocalizationProvider dateAdapter={AdapterDateFns}>
                                <DateTimePicker
                                    label="Contract Start Date"
                                    value={sponsorshipData.contract_start_date}
                                    onChange={(newValue) => handleDateChange('contract_start_date', newValue)}
                                    renderInput={(params) => <TextField {...params} fullWidth />}
                                    disabled={submitting}
                                />
                            </LocalizationProvider>
                        </Grid>

                        <Grid item xs={12} md={6}>
                            <LocalizationProvider dateAdapter={AdapterDateFns}>
                                <DateTimePicker
                                    label="Contract End Date"
                                    value={sponsorshipData.contract_end_date}
                                    onChange={(newValue) => handleDateChange('contract_end_date', newValue)}
                                    renderInput={(params) => <TextField {...params} fullWidth />}
                                    disabled={submitting}
                                />
                            </LocalizationProvider>
                        </Grid>

                        <Grid item xs={12}>
                            <TextField
                                fullWidth
                                label="Contract Document URL (Optional)"
                                name="contract_document"
                                value={sponsorshipData.contract_document}
                                onChange={handleInputChange}
                                disabled={submitting}
                                placeholder="Link to your contract proposal document"
                            />
                        </Grid>

                        <Grid item xs={12}>
                            <TextField
                                fullWidth
                                label="Additional Notes (Optional)"
                                name="notes"
                                value={sponsorshipData.notes}
                                onChange={handleInputChange}
                                disabled={submitting}
                                multiline
                                rows={3}
                                placeholder="Any additional information or special requests"
                            />
                        </Grid>
                    </Grid>

                    <Box sx={{ mt: 3, bgcolor: 'action.hover', p: 2, borderRadius: 1 }}>
                        <Typography variant="subtitle2" gutterBottom>
                            What happens next?
                        </Typography>
                        <Typography variant="body2">
                            After submission, your sponsorship application will be reviewed by the event organizers.
                            Once approved, you'll be able to make payments and track your sponsorship details
                            through the Sponsorships tab.
                        </Typography>
                    </Box>
                </DialogContent>

                <DialogActions>
                    <Button
                        onClick={handleCloseDialog}
                        disabled={submitting}
                    >
                        Cancel
                    </Button>
                    <Button
                        variant="contained"
                        onClick={handleSubmit}
                        disabled={submitting}
                    >
                        {submitting ? 'Submitting...' : 'Submit Application'}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Alert Snackbar */}
            <Snackbar
                open={alert.open}
                autoHideDuration={6000}
                onClose={handleCloseAlert}
                anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
            >
                <Alert onClose={handleCloseAlert} severity={alert.severity} sx={{ width: '100%' }}>
                    {alert.message}
                </Alert>
            </Snackbar>
        </Box>
    );
};

export default SponsorshipPackages;