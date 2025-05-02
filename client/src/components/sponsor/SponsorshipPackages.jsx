import React, { useState, useEffect } from 'react';
import {
    Container,
    Typography,
    Grid,
    Card,
    CardContent,
    Button,
    Box,
    Chip,
    Divider,
    CircularProgress,
    Alert,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    MenuItem,
    FormControl,
    InputLabel,
    Select,
    Stepper,
    Step,
    StepLabel,
    Paper
} from '@mui/material';
import { Check as CheckIcon, ShoppingCart as CartIcon, ArrowBack, ArrowForward } from '@mui/icons-material';
import { sponsorPackageService, sponsorshipService, eventService } from '../../services/api';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { format } from 'date-fns';

const SponsorshipPackages = () => {
    const [packages, setPackages] = useState([]);
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedPackage, setSelectedPackage] = useState(null);
    const [selectedEvent, setSelectedEvent] = useState(null);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [activeStep, setActiveStep] = useState(0);
    const [sponsorshipData, setSponsorshipData] = useState({
        eventId: '',
        packageId: '',
        message: '',
        agreedToTerms: false,
        contractStartDate: null,
        contractEndDate: null
    });
    const [submitting, setSubmitting] = useState(false);
    const [submitSuccess, setSubmitSuccess] = useState(false);
    const [submitError, setSubmitError] = useState(null);

    const navigate = useNavigate();
    const { user } = useAuth();

    useEffect(() => {
        const fetchPackages = async () => {
            try {
                setLoading(true);
                const response = await sponsorPackageService.getAll(true);
                setPackages(response.data.packages || []);

                // Also fetch available events
                const eventsResponse = await eventService.getAll({ status: 'active' });
                setEvents(eventsResponse.data.events || []);
            } catch (err) {
                setError('Failed to load sponsorship packages. Please try again later.');
                console.error('Error fetching packages:', err);
                setPackages([]); // Ensure packages is an array even on error
            } finally {
                setLoading(false);
            }
        };

        fetchPackages();
    }, []);

    const handleSelectPackage = (pkg) => {
        setSelectedPackage(pkg);
        setSponsorshipData({
            ...sponsorshipData,
            packageId: pkg.id
        });
        setDialogOpen(true);
    };

    const handleCloseDialog = () => {
        setDialogOpen(false);
        setActiveStep(0);
        setSubmitSuccess(false);
        setSubmitError(null);
    };

    const handleInputChange = (e) => {
        const { name, value, checked } = e.target;
        setSponsorshipData({
            ...sponsorshipData,
            [name]: name === 'agreedToTerms' ? checked : value
        });

        // If event is selected, automatically set contract dates to match event dates exactly
        if (name === 'eventId' && value) {
            const eventId = value;
            const selectedEvent = events.find(event => event.id == eventId);
            if (selectedEvent) {
                setSelectedEvent(selectedEvent);

                // Set contract dates to match event dates exactly
                const eventStartDate = new Date(selectedEvent.start_date);
                const eventEndDate = new Date(selectedEvent.end_date);

                setSponsorshipData(prev => ({
                    ...prev,
                    eventId,
                    contractStartDate: eventStartDate,
                    contractEndDate: eventEndDate
                }));
            }
        }
    };

    const handleDateChange = (name, date) => {
        // Don't allow manual date changes - we always want the dates to match the event exactly
        // This is left for backward compatibility but won't have any effect
        setSponsorshipData({
            ...sponsorshipData,
            [name]: date
        });
    };

    const handleNext = () => {
        setActiveStep((prevStep) => prevStep + 1);
    };

    const handleBack = () => {
        setActiveStep((prevStep) => prevStep - 1);
    };

    const handleSubmit = async () => {
        if (!sponsorshipData.eventId || !sponsorshipData.packageId) {
            setSubmitError('Please select an event for this sponsorship');
            return;
        }

        if (!sponsorshipData.contractStartDate || !sponsorshipData.contractEndDate) {
            setSubmitError('Please provide contract start and end dates');
            return;
        }

        try {
            setSubmitting(true);
            setSubmitError(null);

            // Get the selected event to compare dates
            const selectedEvent = events.find(event => event.id == sponsorshipData.eventId);

            if (selectedEvent) {
                // Debug information - print dates for troubleshooting
                console.log('Event Info:', {
                    event_start: selectedEvent.start_date,
                    event_end: selectedEvent.end_date,
                    event_start_format: new Date(selectedEvent.start_date).toISOString(),
                    event_end_format: new Date(selectedEvent.end_date).toISOString()
                });

                console.log('Contract Dates Info:', {
                    contract_start_raw: sponsorshipData.contractStartDate,
                    contract_end_raw: sponsorshipData.contractEndDate,
                    contract_start_obj: new Date(sponsorshipData.contractStartDate),
                    contract_end_obj: new Date(sponsorshipData.contractEndDate)
                });

                // Make sure these dates cover the event dates exactly
                const contractStartDate = format(new Date(selectedEvent.start_date), 'yyyy-MM-dd');
                const contractEndDate = format(new Date(selectedEvent.end_date), 'yyyy-MM-dd');

                console.log('Formatted dates being sent to backend:', {
                    contract_start_formatted: contractStartDate,
                    contract_end_formatted: contractEndDate
                });

                // Create sponsorship request with exact event dates
                const response = await sponsorshipService.create({
                    package_id: sponsorshipData.packageId,
                    event_id: sponsorshipData.eventId,
                    contract_start_date: contractStartDate,
                    contract_end_date: contractEndDate,
                    notes: sponsorshipData.message || 'Interested in sponsoring this event'
                });

                setSubmitSuccess(true);
                setActiveStep(2); // Move to confirmation step

                // After 3 seconds, redirect to sponsorships view
                setTimeout(() => {
                    navigate('/sponsor/dashboard');
                }, 3000);
            } else {
                setSubmitError('Selected event not found. Please try again.');
            }
        } catch (error) {
            console.error('Error submitting sponsorship request:', error);
            console.log('Error response:', error.response?.data);

            setSubmitError(
                error.response?.data?.message ||
                'Failed to submit sponsorship request. Please try again.'
            );
        } finally {
            setSubmitting(false);
        }
    };

    // Steps for the sponsorship process
    const steps = ['Select Package', 'Event Details', 'Confirmation'];

    const renderStepContent = (step) => {
        switch (step) {
            case 0:
                return (
                    <Box>
                        <Typography variant="h6" gutterBottom>
                            Package Selected
                        </Typography>

                        {selectedPackage && (
                            <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
                                <Typography variant="h5" gutterBottom>
                                    {selectedPackage.name}
                                </Typography>
                                <Typography variant="h6" color="primary" gutterBottom>
                                    ${selectedPackage.price}
                                </Typography>
                                <Divider sx={{ my: 2 }} />
                                <Typography variant="subtitle1" gutterBottom>
                                    Benefits:
                                </Typography>
                                <Box sx={{ ml: 2 }}>
                                    {selectedPackage.benefits?.split(',').map((benefit, index) => (
                                        <Box key={index} sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                                            <CheckIcon color="success" fontSize="small" sx={{ mr: 1 }} />
                                            <Typography variant="body2">{benefit.trim()}</Typography>
                                        </Box>
                                    ))}
                                </Box>
                            </Paper>
                        )}

                        <Button
                            variant="contained"
                            color="primary"
                            endIcon={<ArrowForward />}
                            onClick={handleNext}
                            fullWidth
                        >
                            Continue to Event Selection
                        </Button>
                    </Box>
                );
            case 1:
                return (
                    <Box>
                        <Typography variant="h6" gutterBottom>
                            Select Event to Sponsor
                        </Typography>

                        <FormControl fullWidth sx={{ mb: 3 }}>
                            <InputLabel id="event-select-label">Event</InputLabel>
                            <Select
                                labelId="event-select-label"
                                id="event-select"
                                name="eventId"
                                value={sponsorshipData.eventId}
                                onChange={handleInputChange}
                                label="Event"
                                required
                            >
                                {events.map((event) => (
                                    <MenuItem key={event.id} value={event.id}>
                                        {event.title || 'Unnamed Event'}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>

                        <LocalizationProvider dateAdapter={AdapterDateFns}>
                            <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
                                <DatePicker
                                    label="Contract Start Date"
                                    value={sponsorshipData.contractStartDate}
                                    onChange={(newDate) => handleDateChange('contractStartDate', newDate)}
                                    sx={{ flex: 1 }}
                                    slotProps={{
                                        textField: {
                                            fullWidth: true,
                                            required: true,
                                            error: submitError && !sponsorshipData.contractStartDate
                                        }
                                    }}
                                />
                                <DatePicker
                                    label="Contract End Date"
                                    value={sponsorshipData.contractEndDate}
                                    onChange={(newDate) => handleDateChange('contractEndDate', newDate)}
                                    sx={{ flex: 1 }}
                                    slotProps={{
                                        textField: {
                                            fullWidth: true,
                                            required: true,
                                            error: submitError && !sponsorshipData.contractEndDate
                                        }
                                    }}
                                />
                            </Box>
                        </LocalizationProvider>

                        <TextField
                            fullWidth
                            label="Message to Organizers (Optional)"
                            name="message"
                            value={sponsorshipData.message}
                            onChange={handleInputChange}
                            multiline
                            rows={4}
                            sx={{ mb: 3 }}
                        />

                        <FormControl fullWidth sx={{ mb: 3 }}>
                            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                                By submitting this request, you agree to our sponsorship terms and conditions.
                                Our team will review your request and contact you with next steps.
                            </Typography>
                        </FormControl>

                        {submitError && (
                            <Alert severity="error" sx={{ mb: 3 }}>
                                {submitError}
                            </Alert>
                        )}

                        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                            <Button
                                onClick={handleBack}
                                startIcon={<ArrowBack />}
                            >
                                Back
                            </Button>
                            <Button
                                variant="contained"
                                color="primary"
                                onClick={handleSubmit}
                                disabled={submitting || !sponsorshipData.eventId || !sponsorshipData.contractStartDate || !sponsorshipData.contractEndDate}
                            >
                                {submitting ? 'Submitting...' : 'Submit Request'}
                            </Button>
                        </Box>
                    </Box>
                );
            case 2:
                return (
                    <Box>
                        {submitSuccess ? (
                            <Box sx={{ textAlign: 'center', py: 2 }}>
                                <CheckIcon color="success" sx={{ fontSize: 60, mb: 2 }} />
                                <Typography variant="h5" gutterBottom>
                                    Sponsorship Request Submitted!
                                </Typography>
                                <Typography variant="body1" sx={{ mb: 3 }}>
                                    Your sponsorship request has been submitted successfully. Our team will review your request and
                                    contact you soon with next steps.
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                    You'll be redirected to your dashboard in a moment...
                                </Typography>
                            </Box>
                        ) : (
                            <Box>
                                <Typography variant="h6" gutterBottom>
                                    Submitting your request...
                                </Typography>
                                <CircularProgress />
                            </Box>
                        )}
                    </Box>
                );
            default:
                return null;
        }
    };

    return (
        <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
            <Typography variant="h4" component="h1" gutterBottom>
                Sponsorship Packages
            </Typography>
            <Typography variant="subtitle1" color="text.secondary" gutterBottom>
                Choose the package that fits your organization's goals
            </Typography>

            {loading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', p: 5 }}>
                    <CircularProgress />
                </Box>
            ) : error ? (
                <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>
            ) : packages.length === 0 ? (
                <Alert severity="info" sx={{ mt: 2 }}>No sponsorship packages are currently available. Please check back later or contact the organizers.</Alert>
            ) : (
                <Grid container spacing={4} sx={{ mt: 1 }}>
                    {packages.map((pkg) => (
                        <Grid item xs={12} md={4} key={pkg.id}>
                            <Card
                                elevation={3}
                                sx={{
                                    height: '100%',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    transition: 'all 0.3s',
                                    '&:hover': {
                                        transform: 'translateY(-5px)',
                                        boxShadow: 6
                                    }
                                }}
                            >
                                <Box
                                    sx={{
                                        backgroundColor: pkg.tier === 'platinum' ? '#e5e4e2' :
                                            pkg.tier === 'gold' ? '#ffd700' :
                                                pkg.tier === 'silver' ? '#c0c0c0' :
                                                    pkg.tier === 'bronze' ? '#cd7f32' : 'primary.main',
                                        py: 2,
                                        textAlign: 'center'
                                    }}
                                >
                                    <Typography variant="h5" component="h2" sx={{ fontWeight: 'bold', color: pkg.tier === 'gold' ? 'text.primary' : 'white' }}>
                                        {pkg.name}
                                    </Typography>
                                </Box>

                                <CardContent sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
                                    <Box sx={{ mb: 2, textAlign: 'center' }}>
                                        <Typography variant="h4" component="p" color="primary" sx={{ fontWeight: 'bold' }}>
                                            ${pkg.price}
                                        </Typography>
                                        {pkg.max_sponsors && (
                                            <Chip
                                                label={`Limited: ${pkg.max_sponsors} slots`}
                                                size="small"
                                                color="warning"
                                                sx={{ mt: 1 }}
                                            />
                                        )}
                                    </Box>

                                    <Divider sx={{ my: 2 }} />

                                    <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 1 }}>
                                        Benefits:
                                    </Typography>

                                    <Box sx={{ mb: 2, flexGrow: 1 }}>
                                        {pkg.benefits && pkg.benefits.split(',').map((benefit, index) => (
                                            <Box key={index} sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                                                <CheckIcon color="success" fontSize="small" sx={{ mr: 1 }} />
                                                <Typography variant="body2">{benefit.trim()}</Typography>
                                            </Box>
                                        ))}

                                        {!pkg.benefits && (
                                            <Typography variant="body2">Contact organizers for package details</Typography>
                                        )}
                                    </Box>

                                    <Box sx={{ mt: 'auto' }}>
                                        <Button
                                            variant="contained"
                                            fullWidth
                                            color="primary"
                                            startIcon={<CartIcon />}
                                            onClick={() => handleSelectPackage(pkg)}
                                        >
                                            Select Package
                                        </Button>
                                    </Box>
                                </CardContent>
                            </Card>
                        </Grid>
                    ))}
                </Grid>
            )}

            <Box sx={{ mt: 4, textAlign: 'center' }}>
                <Typography variant="body1" mb={2}>
                    Looking for a custom sponsorship option? Contact us to discuss your specific needs.
                </Typography>
                <Button
                    variant="outlined"
                    color="primary"
                    onClick={() => navigate('/sponsor/contracts')}
                >
                    Create Custom Sponsorship
                </Button>
            </Box>

            {/* Package Selection Dialog */}
            <Dialog
                open={dialogOpen}
                onClose={handleCloseDialog}
                maxWidth="md"
                fullWidth
            >
                <DialogTitle>
                    Sponsorship Application
                </DialogTitle>
                <DialogContent>
                    <Stepper activeStep={activeStep} sx={{ mb: 4, mt: 2 }}>
                        {steps.map((label) => (
                            <Step key={label}>
                                <StepLabel>{label}</StepLabel>
                            </Step>
                        ))}
                    </Stepper>

                    {renderStepContent(activeStep)}
                </DialogContent>
                {activeStep !== 2 && (
                    <DialogActions>
                        <Button onClick={handleCloseDialog}>Cancel</Button>
                    </DialogActions>
                )}
            </Dialog>
        </Container>
    );
};

export default SponsorshipPackages;