import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    Container,
    Typography,
    Grid,
    Paper,
    Button,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Chip,
    Box,
    Dialog,
    DialogActions,
    DialogContent,
    DialogContentText,
    DialogTitle,
    TextField,
    MenuItem,
    FormControl,
    InputLabel,
    Select,
    CircularProgress,
    Alert,
    Tabs,
    Tab
} from '@mui/material';
import {
    Add as AddIcon,
    Edit as EditIcon,
    Delete as DeleteIcon,
    Visibility as ViewIcon,
    Payment as PaymentIcon
} from '@mui/icons-material';
import { sponsorshipService, eventService, sponsorPackageService } from '../../services/api';

const SponsorshipContracts = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [sponsorships, setSponsorships] = useState([]);
    const [events, setEvents] = useState([]);
    const [packages, setPackages] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [openDialog, setOpenDialog] = useState(false);
    const [openPaymentDialog, setOpenPaymentDialog] = useState(false);
    const [currentSponsorship, setCurrentSponsorship] = useState(null);
    const [tabValue, setTabValue] = useState(0);
    const [isEditing, setIsEditing] = useState(false);
    const [paymentDetails, setPaymentDetails] = useState({
        amount: '',
        paymentDate: new Date().toISOString().split('T')[0],
        paymentMethod: 'bank_transfer',
        notes: ''
    });

    const [newSponsorship, setNewSponsorship] = useState({
        eventId: '',
        packageId: '',
        customAmount: '',
        notes: '',
        startDate: new Date().toISOString().split('T')[0],
        endDate: new Date(new Date().setMonth(new Date().getMonth() + 3)).toISOString().split('T')[0]
    });

    // Fetch all data
    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);

                // Fetch user's sponsorships
                const sponsorshipsRes = await sponsorshipService.getMySponsorships();
                setSponsorships(sponsorshipsRes.data.sponsorships || []);

                // Fetch events for dropdown
                const eventsRes = await eventService.getAll();
                setEvents(eventsRes.data.events || []);

                // Fetch packages for dropdown
                const packagesRes = await sponsorPackageService.getAll(true);
                setPackages(packagesRes.data.packages || []);

                // If id is provided, fetch that specific sponsorship
                if (id) {
                    const specificSponsorshipRes = await sponsorshipService.getById(id);
                    setCurrentSponsorship(specificSponsorshipRes.data.sponsorship || specificSponsorshipRes.data);
                    setTabValue(1); // Switch to detail view
                }

            } catch (err) {
                setError('Failed to load data. Please try again later.');
                console.error('Error fetching data:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [id]);

    const handleTabChange = (event, newValue) => {
        setTabValue(newValue);
    };

    const handleOpenDialog = (edit = false, sponsorship = null) => {
        if (edit && sponsorship) {
            setIsEditing(true);
            setNewSponsorship({
                id: sponsorship.id,
                eventId: sponsorship.eventId,
                packageId: sponsorship.packageId || '',
                customAmount: sponsorship.amount,
                notes: sponsorship.notes || '',
                startDate: sponsorship.startDate || new Date().toISOString().split('T')[0],
                endDate: sponsorship.endDate || new Date(new Date().setMonth(new Date().getMonth() + 3)).toISOString().split('T')[0]
            });
        } else {
            setIsEditing(false);
            setNewSponsorship({
                eventId: '',
                packageId: '',
                customAmount: '',
                notes: '',
                startDate: new Date().toISOString().split('T')[0],
                endDate: new Date(new Date().setMonth(new Date().getMonth() + 3)).toISOString().split('T')[0]
            });
        }
        setOpenDialog(true);
    };

    const handleCloseDialog = () => {
        setOpenDialog(false);
    };

    const handleOpenPaymentDialog = (sponsorship) => {
        setCurrentSponsorship(sponsorship);
        setOpenPaymentDialog(true);
    };

    const handleClosePaymentDialog = () => {
        setOpenPaymentDialog(false);
    };

    const handleNewSponsorshipChange = (e) => {
        const { name, value } = e.target;
        setNewSponsorship(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handlePaymentDetailsChange = (e) => {
        const { name, value } = e.target;
        setPaymentDetails(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSaveSponsorship = async () => {
        try {
            setLoading(true);

            let response;
            if (isEditing) {
                response = await sponsorshipService.update(newSponsorship.id, {
                    eventId: newSponsorship.eventId,
                    packageId: newSponsorship.packageId || null,
                    amount: newSponsorship.customAmount,
                    notes: newSponsorship.notes,
                    startDate: newSponsorship.startDate,
                    endDate: newSponsorship.endDate
                });
            } else {
                response = await sponsorshipService.create({
                    eventId: newSponsorship.eventId,
                    packageId: newSponsorship.packageId || null,
                    amount: newSponsorship.customAmount,
                    notes: newSponsorship.notes,
                    startDate: newSponsorship.startDate,
                    endDate: newSponsorship.endDate
                });
            }

            // Update the list of sponsorships
            const sponsorshipsRes = await sponsorshipService.getMySponsorships();
            setSponsorships(sponsorshipsRes.data);

            handleCloseDialog();
        } catch (err) {
            setError('Failed to save sponsorship. Please try again later.');
            console.error('Error saving sponsorship:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmitPayment = async () => {
        try {
            setLoading(true);

            await sponsorshipService.addPayment(currentSponsorship.id, {
                amount: paymentDetails.amount,
                paymentDate: paymentDetails.paymentDate,
                paymentMethod: paymentDetails.paymentMethod,
                notes: paymentDetails.notes
            });

            handleClosePaymentDialog();

            // Refresh the current sponsorship data
            if (currentSponsorship) {
                const specificSponsorshipRes = await sponsorshipService.getById(currentSponsorship.id);
                setCurrentSponsorship(specificSponsorshipRes.data);
            }
        } catch (err) {
            setError('Failed to submit payment. Please try again later.');
            console.error('Error submitting payment:', err);
        } finally {
            setLoading(false);
        }
    };

    const getStatusChipColor = (status) => {
        switch (status) {
            case 'pending': return 'warning';
            case 'approved': return 'success';
            case 'rejected': return 'error';
            case 'completed': return 'info';
            default: return 'default';
        }
    };

    // Render functions
    const renderSponsorshipList = () => (
        <Paper elevation={3} sx={{ p: 2 }}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                <Typography variant="h6">My Sponsorships</Typography>
                <Button
                    variant="contained"
                    color="primary"
                    startIcon={<AddIcon />}
                    onClick={() => handleOpenDialog()}
                >
                    New Sponsorship
                </Button>
            </Box>

            {sponsorships.length === 0 ? (
                <Typography>You don't have any sponsorships yet.</Typography>
            ) : (
                <TableContainer>
                    <Table>
                        <TableHead>
                            <TableRow>
                                <TableCell>Event</TableCell>
                                <TableCell>Package</TableCell>
                                <TableCell>Amount</TableCell>
                                <TableCell>Status</TableCell>
                                <TableCell>Start Date</TableCell>
                                <TableCell>End Date</TableCell>
                                <TableCell>Actions</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {sponsorships.map((item) => (
                                <TableRow key={item.id}>
                                    <TableCell>{item.eventName || 'Unknown Event'}</TableCell>
                                    <TableCell>{item.packageName || 'Custom Package'}</TableCell>
                                    <TableCell>${item.amount}</TableCell>
                                    <TableCell>
                                        <Chip
                                            label={item.status}
                                            color={getStatusChipColor(item.status)}
                                            size="small"
                                        />
                                    </TableCell>
                                    <TableCell>{new Date(item.startDate).toLocaleDateString()}</TableCell>
                                    <TableCell>{new Date(item.endDate).toLocaleDateString()}</TableCell>
                                    <TableCell>
                                        <Button
                                            color="primary"
                                            size="small"
                                            onClick={() => navigate(`/sponsor/sponsorships/${item.id}`)}
                                            startIcon={<ViewIcon />}
                                            sx={{ mr: 1 }}
                                        >
                                            View
                                        </Button>
                                        {item.status === 'approved' && (
                                            <Button
                                                color="secondary"
                                                size="small"
                                                onClick={() => handleOpenPaymentDialog(item)}
                                                startIcon={<PaymentIcon />}
                                            >
                                                Pay
                                            </Button>
                                        )}
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>
            )}
        </Paper>
    );

    const renderSponsorshipDetail = () => {
        if (!currentSponsorship) return <Typography>Please select a sponsorship to view details</Typography>;

        return (
            <Paper elevation={3} sx={{ p: 3 }}>
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
                    <Typography variant="h6">Sponsorship Details</Typography>
                    <Box>
                        <Button
                            variant="outlined"
                            color="primary"
                            startIcon={<EditIcon />}
                            onClick={() => handleOpenDialog(true, currentSponsorship)}
                            sx={{ mr: 1 }}
                            disabled={currentSponsorship.status !== 'pending'}
                        >
                            Edit
                        </Button>
                        {currentSponsorship.status === 'approved' && (
                            <Button
                                variant="contained"
                                color="secondary"
                                startIcon={<PaymentIcon />}
                                onClick={() => handleOpenPaymentDialog(currentSponsorship)}
                            >
                                Make Payment
                            </Button>
                        )}
                    </Box>
                </Box>

                <Grid container spacing={3}>
                    <Grid item xs={12} md={6}>
                        <Typography variant="subtitle1">Event Details</Typography>
                        <Paper variant="outlined" sx={{ p: 2, mt: 1 }}>
                            <Typography variant="body1"><strong>Event:</strong> {currentSponsorship.eventName}</Typography>
                            <Typography variant="body1"><strong>Status:</strong>
                                <Chip
                                    label={currentSponsorship.status}
                                    color={getStatusChipColor(currentSponsorship.status)}
                                    size="small"
                                    sx={{ ml: 1 }}
                                />
                            </Typography>
                            <Typography variant="body1"><strong>Package:</strong> {currentSponsorship.packageName || 'Custom Package'}</Typography>
                            <Typography variant="body1"><strong>Amount:</strong> ${currentSponsorship.amount}</Typography>
                            <Typography variant="body1"><strong>Start Date:</strong> {new Date(currentSponsorship.startDate).toLocaleDateString()}</Typography>
                            <Typography variant="body1"><strong>End Date:</strong> {new Date(currentSponsorship.endDate).toLocaleDateString()}</Typography>
                            {currentSponsorship.notes && (
                                <Typography variant="body1"><strong>Notes:</strong> {currentSponsorship.notes}</Typography>
                            )}
                        </Paper>
                    </Grid>

                    <Grid item xs={12} md={6}>
                        <Typography variant="subtitle1">Payment History</Typography>
                        <Paper variant="outlined" sx={{ p: 2, mt: 1 }}>
                            {!currentSponsorship.payments || currentSponsorship.payments.length === 0 ? (
                                <Typography>No payments made yet.</Typography>
                            ) : (
                                <TableContainer>
                                    <Table size="small">
                                        <TableHead>
                                            <TableRow>
                                                <TableCell>Date</TableCell>
                                                <TableCell>Amount</TableCell>
                                                <TableCell>Method</TableCell>
                                                <TableCell>Status</TableCell>
                                            </TableRow>
                                        </TableHead>
                                        <TableBody>
                                            {currentSponsorship.payments.map((payment) => (
                                                <TableRow key={payment.id}>
                                                    <TableCell>{new Date(payment.paymentDate).toLocaleDateString()}</TableCell>
                                                    <TableCell>${payment.amount}</TableCell>
                                                    <TableCell>{payment.paymentMethod}</TableCell>
                                                    <TableCell>
                                                        <Chip
                                                            label={payment.status}
                                                            color={payment.status === 'completed' ? 'success' : 'warning'}
                                                            size="small"
                                                        />
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </TableContainer>
                            )}
                        </Paper>
                    </Grid>

                    <Grid item xs={12}>
                        <Typography variant="subtitle1">Promotions & Benefits</Typography>
                        <Paper variant="outlined" sx={{ p: 2, mt: 1 }}>
                            {!currentSponsorship.promotions || currentSponsorship.promotions.length === 0 ? (
                                <Typography>No promotions available yet.</Typography>
                            ) : (
                                <TableContainer>
                                    <Table size="small">
                                        <TableHead>
                                            <TableRow>
                                                <TableCell>Type</TableCell>
                                                <TableCell>Description</TableCell>
                                                <TableCell>Status</TableCell>
                                            </TableRow>
                                        </TableHead>
                                        <TableBody>
                                            {currentSponsorship.promotions.map((promo, index) => (
                                                <TableRow key={promo.id || index}>
                                                    <TableCell>{promo.type}</TableCell>
                                                    <TableCell>{promo.description}</TableCell>
                                                    <TableCell>
                                                        <Chip
                                                            label={promo.status}
                                                            color={promo.status === 'completed' ? 'success' : 'info'}
                                                            size="small"
                                                        />
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
            </Paper>
        );
    };

    return (
        <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
            <Typography variant="h4" component="h1" gutterBottom>
                Sponsorship Management
            </Typography>

            {loading && !openDialog && !openPaymentDialog ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                    <CircularProgress />
                </Box>
            ) : error ? (
                <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>
            ) : (
                <>
                    <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
                        <Tabs
                            value={tabValue}
                            onChange={handleTabChange}
                            aria-label="sponsorship tabs"
                        >
                            <Tab label="All Sponsorships" id="tab-0" />
                            <Tab label="Sponsorship Details" id="tab-1" disabled={!currentSponsorship} />
                        </Tabs>
                    </Box>

                    {tabValue === 0 && renderSponsorshipList()}
                    {tabValue === 1 && renderSponsorshipDetail()}
                </>
            )}

            {/* New/Edit Sponsorship Dialog */}
            <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
                <DialogTitle>{isEditing ? 'Edit Sponsorship' : 'New Sponsorship'}</DialogTitle>
                <DialogContent>
                    <DialogContentText sx={{ mb: 2 }}>
                        {isEditing
                            ? 'Update the sponsorship details below.'
                            : 'Fill in the details below to create a new sponsorship.'}
                    </DialogContentText>

                    <Grid container spacing={2}>
                        <Grid item xs={12} sm={6}>
                            <FormControl fullWidth margin="normal">
                                <InputLabel id="event-label">Event</InputLabel>
                                <Select
                                    labelId="event-label"
                                    name="eventId"
                                    value={newSponsorship.eventId}
                                    onChange={handleNewSponsorshipChange}
                                    label="Event"
                                    required
                                >
                                    {events.map((event) => (
                                        <MenuItem key={event.id} value={event.id}>
                                            {event.name}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        </Grid>

                        <Grid item xs={12} sm={6}>
                            <FormControl fullWidth margin="normal">
                                <InputLabel id="package-label">Sponsorship Package</InputLabel>
                                <Select
                                    labelId="package-label"
                                    name="packageId"
                                    value={newSponsorship.packageId}
                                    onChange={handleNewSponsorshipChange}
                                    label="Sponsorship Package"
                                >
                                    <MenuItem value="">Custom Package</MenuItem>
                                    {packages.map((pkg) => (
                                        <MenuItem key={pkg.id} value={pkg.id}>
                                            {pkg.name} - ${pkg.amount}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        </Grid>

                        <Grid item xs={12} sm={6}>
                            <TextField
                                name="customAmount"
                                label="Sponsorship Amount"
                                type="number"
                                fullWidth
                                margin="normal"
                                value={newSponsorship.customAmount}
                                onChange={handleNewSponsorshipChange}
                                required
                                helperText="Enter the amount in USD"
                            />
                        </Grid>

                        <Grid item xs={12} sm={6}>
                            <TextField
                                name="notes"
                                label="Notes"
                                fullWidth
                                margin="normal"
                                value={newSponsorship.notes}
                                onChange={handleNewSponsorshipChange}
                                multiline
                                rows={1}
                            />
                        </Grid>

                        <Grid item xs={12} sm={6}>
                            <TextField
                                name="startDate"
                                label="Start Date"
                                type="date"
                                fullWidth
                                margin="normal"
                                value={newSponsorship.startDate}
                                onChange={handleNewSponsorshipChange}
                                InputLabelProps={{ shrink: true }}
                            />
                        </Grid>

                        <Grid item xs={12} sm={6}>
                            <TextField
                                name="endDate"
                                label="End Date"
                                type="date"
                                fullWidth
                                margin="normal"
                                value={newSponsorship.endDate}
                                onChange={handleNewSponsorshipChange}
                                InputLabelProps={{ shrink: true }}
                            />
                        </Grid>
                    </Grid>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleCloseDialog}>Cancel</Button>
                    <Button onClick={handleSaveSponsorship} variant="contained" color="primary">
                        {isEditing ? 'Update' : 'Create'}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Payment Dialog */}
            <Dialog open={openPaymentDialog} onClose={handleClosePaymentDialog} maxWidth="sm" fullWidth>
                <DialogTitle>Make a Payment</DialogTitle>
                <DialogContent>
                    <DialogContentText sx={{ mb: 2 }}>
                        Enter payment details for sponsorship of {currentSponsorship?.eventName}.
                    </DialogContentText>

                    <Grid container spacing={2}>
                        <Grid item xs={12}>
                            <TextField
                                name="amount"
                                label="Payment Amount"
                                type="number"
                                fullWidth
                                margin="normal"
                                value={paymentDetails.amount}
                                onChange={handlePaymentDetailsChange}
                                required
                                helperText={`Total amount: $${currentSponsorship?.amount || 0}`}
                            />
                        </Grid>

                        <Grid item xs={12} sm={6}>
                            <TextField
                                name="paymentDate"
                                label="Payment Date"
                                type="date"
                                fullWidth
                                margin="normal"
                                value={paymentDetails.paymentDate}
                                onChange={handlePaymentDetailsChange}
                                InputLabelProps={{ shrink: true }}
                            />
                        </Grid>

                        <Grid item xs={12} sm={6}>
                            <FormControl fullWidth margin="normal">
                                <InputLabel id="payment-method-label">Payment Method</InputLabel>
                                <Select
                                    labelId="payment-method-label"
                                    name="paymentMethod"
                                    value={paymentDetails.paymentMethod}
                                    onChange={handlePaymentDetailsChange}
                                    label="Payment Method"
                                >
                                    <MenuItem value="bank_transfer">Bank Transfer</MenuItem>
                                    <MenuItem value="credit_card">Credit Card</MenuItem>
                                    <MenuItem value="check">Check</MenuItem>
                                    <MenuItem value="cash">Cash</MenuItem>
                                    <MenuItem value="other">Other</MenuItem>
                                </Select>
                            </FormControl>
                        </Grid>

                        <Grid item xs={12}>
                            <TextField
                                name="notes"
                                label="Payment Notes"
                                fullWidth
                                margin="normal"
                                value={paymentDetails.notes}
                                onChange={handlePaymentDetailsChange}
                                multiline
                                rows={2}
                                placeholder="e.g., Transaction ID, Reference Number"
                            />
                        </Grid>
                    </Grid>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleClosePaymentDialog}>Cancel</Button>
                    <Button onClick={handleSubmitPayment} variant="contained" color="primary">
                        Submit Payment
                    </Button>
                </DialogActions>
            </Dialog>
        </Container>
    );
};

export default SponsorshipContracts;