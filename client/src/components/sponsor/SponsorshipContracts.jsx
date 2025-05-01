import React, { useState, useEffect } from 'react';
import {
    Box,
    Typography,
    Paper,
    Grid,
    Card,
    CardContent,
    CardActions,
    Button,
    Chip,
    CircularProgress,
    Alert,
    Snackbar,
    Tabs,
    Tab,
    Divider,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    MenuItem,
    FormControl,
    InputLabel,
    Select,
    List,
    ListItem,
    ListItemText,
    ListItemSecondaryAction,
    IconButton,
    Tooltip,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow
} from '@mui/material';
import {
    Receipt as ReceiptIcon,
    MonetizationOn as PaymentIcon,
    Visibility as ViewIcon,
    Description as ContractIcon,
    CheckCircle as ApprovedIcon,
    Cancel as CancelIcon,
    Pending as PendingIcon,
    EventAvailable as EventIcon,
    AttachMoney as MoneyIcon,
    Add as AddIcon,
    Delete as DeleteIcon
} from '@mui/icons-material';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import { LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { useAuth } from '../../context/AuthContext';
import { format } from 'date-fns';
import axios from 'axios';

const SponsorshipContracts = () => {
    const { user } = useAuth();
    const [loading, setLoading] = useState(true);
    const [sponsorships, setSponsorships] = useState([]);
    const [tabValue, setTabValue] = useState(0);
    const [selectedSponsorship, setSelectedSponsorship] = useState(null);
    const [detailsOpen, setDetailsOpen] = useState(false);
    const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
    const [alert, setAlert] = useState({
        open: false,
        message: '',
        severity: 'success'
    });
    const [payments, setPayments] = useState([]);
    const [promotions, setPromotions] = useState([]);
    const [paymentData, setPaymentData] = useState({
        amount: '',
        payment_date: new Date(),
        payment_method: 'bank_transfer',
        reference_number: '',
        notes: '',
        receipt_url: ''
    });
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        fetchSponsorships();
    }, []);

    const fetchSponsorships = async () => {
        try {
            setLoading(true);
            const response = await axios.get('/api/sponsorships/my', {
                headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
            });

            setSponsorships(response.data.sponsorships || []);
            setLoading(false);
        } catch (error) {
            console.error('Error fetching sponsorships:', error);
            setAlert({
                open: true,
                message: 'Failed to load your sponsorships',
                severity: 'error'
            });
            setLoading(false);
        }
    };

    const handleTabChange = (event, newValue) => {
        setTabValue(newValue);
    };

    const handleViewDetails = async (sponsorship) => {
        try {
            setSelectedSponsorship(sponsorship);

            // Fetch payments and promotions
            const response = await axios.get(`/api/sponsorships/${sponsorship.id}?details=true`, {
                headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
            });

            setPayments(response.data.payments || []);
            setPromotions(response.data.promotions || []);
            setDetailsOpen(true);
        } catch (error) {
            console.error('Error fetching sponsorship details:', error);
            setAlert({
                open: true,
                message: 'Failed to load sponsorship details',
                severity: 'error'
            });
        }
    };

    const handleCloseDetails = () => {
        setDetailsOpen(false);
        setSelectedSponsorship(null);
    };

    const handleOpenPaymentDialog = (sponsorship) => {
        setSelectedSponsorship(sponsorship);
        setPaymentData({
            amount: sponsorship.total_amount,
            payment_date: new Date(),
            payment_method: 'bank_transfer',
            reference_number: '',
            notes: '',
            receipt_url: ''
        });
        setPaymentDialogOpen(true);
    };

    const handleClosePaymentDialog = () => {
        setPaymentDialogOpen(false);
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setPaymentData({
            ...paymentData,
            [name]: value
        });
    };

    const handleDateChange = (name, value) => {
        setPaymentData({
            ...paymentData,
            [name]: value
        });
    };

    const handleSubmitPayment = async () => {
        try {
            // Validate form
            if (!paymentData.amount || !paymentData.payment_method) {
                setAlert({
                    open: true,
                    message: 'Please fill in all required fields',
                    severity: 'error'
                });
                return;
            }

            setSubmitting(true);

            const payment = {
                amount: parseFloat(paymentData.amount),
                payment_date: paymentData.payment_date.toISOString(),
                payment_method: paymentData.payment_method,
                reference_number: paymentData.reference_number,
                notes: paymentData.notes,
                receipt_url: paymentData.receipt_url
            };

            await axios.post(`/api/sponsorships/${selectedSponsorship.id}/payments`, payment, {
                headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
            });

            setAlert({
                open: true,
                message: 'Payment recorded successfully!',
                severity: 'success'
            });

            handleClosePaymentDialog();
            fetchSponsorships();

        } catch (error) {
            console.error('Error submitting payment:', error);
            setAlert({
                open: true,
                message: error.response?.data?.message || 'Failed to record payment',
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

    const getStatusChip = (status) => {
        let color;
        let icon;

        switch (status) {
            case 'pending':
                color = 'default';
                icon = <PendingIcon fontSize="small" />;
                break;
            case 'approved':
                color = 'info';
                icon = <ApprovedIcon fontSize="small" />;
                break;
            case 'active':
                color = 'success';
                icon = <CheckCircle fontSize="small" />;
                break;
            case 'completed':
                color = 'secondary';
                icon = <CheckCircle fontSize="small" />;
                break;
            case 'cancelled':
                color = 'error';
                icon = <CancelIcon fontSize="small" />;
                break;
            default:
                color = 'default';
                icon = <PendingIcon fontSize="small" />;
        }

        return (
            <Chip
                icon={icon}
                label={status}
                color={color}
                size="small"
                sx={{ textTransform: 'capitalize' }}
            />
        );
    };

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 0
        }).format(amount);
    };

    const formatDate = (dateString) => {
        return format(new Date(dateString), 'MMM d, yyyy');
    };

    const formatDateTime = (dateString) => {
        return format(new Date(dateString), 'MMM d, yyyy h:mm a');
    };

    const calculateTotalPaid = (sponsorshipId) => {
        const sponsorshipPayments = payments.filter(
            payment => payment.sponsorship_id === selectedSponsorship.id
        );

        return sponsorshipPayments.reduce((sum, payment) => sum + parseFloat(payment.amount), 0);
    };

    const renderSponsorship = (sponsorship) => {
        return (
            <Card key={sponsorship.id} sx={{ mb: 2 }}>
                <CardContent>
                    <Grid container spacing={2}>
                        <Grid item xs={12} md={6}>
                            <Typography variant="h6">
                                {sponsorship.event_title}
                            </Typography>
                            <Typography variant="subtitle1" color="text.secondary" gutterBottom>
                                {sponsorship.package_name}
                            </Typography>

                            <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                                <Typography variant="body2" sx={{ mr: 1 }}>Status:</Typography>
                                {getStatusChip(sponsorship.status)}
                            </Box>
                        </Grid>

                        <Grid item xs={12} md={6} sx={{ display: 'flex', flexDirection: 'column', alignItems: { xs: 'flex-start', md: 'flex-end' } }}>
                            <Typography variant="h6" color="primary">
                                {formatCurrency(sponsorship.total_amount)}
                            </Typography>

                            <Box sx={{ display: 'flex', mt: 1 }}>
                                <Chip
                                    icon={<EventIcon />}
                                    label={`${formatDate(sponsorship.contract_start_date)} - ${formatDate(sponsorship.contract_end_date)}`}
                                    variant="outlined"
                                    size="small"
                                    sx={{ mr: 1 }}
                                />
                            </Box>
                        </Grid>
                    </Grid>

                    {sponsorship.notes && (
                        <Box sx={{ mt: 2 }}>
                            <Typography variant="body2" color="text.secondary">
                                {sponsorship.notes}
                            </Typography>
                        </Box>
                    )}
                </CardContent>

                <CardActions sx={{ justifyContent: 'flex-end', p: 2, pt: 0 }}>
                    <Button
                        size="small"
                        startIcon={<ViewIcon />}
                        onClick={() => handleViewDetails(sponsorship)}
                    >
                        Details
                    </Button>

                    {(sponsorship.status === 'approved' || sponsorship.status === 'active') && (
                        <Button
                            size="small"
                            startIcon={<PaymentIcon />}
                            color="primary"
                            onClick={() => handleOpenPaymentDialog(sponsorship)}
                        >
                            Record Payment
                        </Button>
                    )}
                </CardActions>
            </Card>
        );
    };

    const filterSponsorships = (status) => {
        if (status === 'all') {
            return sponsorships;
        }
        return sponsorships.filter(s => s.status === status);
    };

    if (loading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
                <CircularProgress />
            </Box>
        );
    }

    return (
        <Box sx={{ p: 3 }}>
            <Typography variant="h4" gutterBottom>
                My Sponsorships
            </Typography>

            {sponsorships.length === 0 ? (
                <Paper sx={{ p: 3, textAlign: 'center' }}>
                    <Typography variant="body1" paragraph>
                        You haven't applied for any sponsorships yet.
                    </Typography>
                    <Button
                        variant="contained"
                        href="/sponsor/sponsorship-packages"
                    >
                        Browse Sponsorship Packages
                    </Button>
                </Paper>
            ) : (
                <>
                    <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
                        <Tabs value={tabValue} onChange={handleTabChange}>
                            <Tab label="All" />
                            <Tab label="Pending" />
                            <Tab label="Approved/Active" />
                            <Tab label="Completed" />
                        </Tabs>
                    </Box>

                    {tabValue === 0 && sponsorships.map(renderSponsorship)}
                    {tabValue === 1 && filterSponsorships('pending').map(renderSponsorship)}
                    {tabValue === 2 && [...filterSponsorships('approved'), ...filterSponsorships('active')].map(renderSponsorship)}
                    {tabValue === 3 && [...filterSponsorships('completed'), ...filterSponsorships('cancelled')].map(renderSponsorship)}
                </>
            )}

            {/* Sponsorship Details Dialog */}
            <Dialog
                open={detailsOpen}
                onClose={handleCloseDetails}
                fullWidth
                maxWidth="md"
            >
                {selectedSponsorship && (
                    <>
                        <DialogTitle>
                            {selectedSponsorship.event_title} - {selectedSponsorship.package_name} Sponsorship
                        </DialogTitle>

                        <DialogContent dividers>
                            <Grid container spacing={3}>
                                <Grid item xs={12} md={6}>
                                    <Typography variant="subtitle2">Status</Typography>
                                    <Box sx={{ my: 1 }}>
                                        {getStatusChip(selectedSponsorship.status)}
                                    </Box>

                                    <Typography variant="subtitle2" sx={{ mt: 2 }}>Contract Period</Typography>
                                    <Typography variant="body2">
                                        {formatDate(selectedSponsorship.contract_start_date)} - {formatDate(selectedSponsorship.contract_end_date)}
                                    </Typography>

                                    {selectedSponsorship.notes && (
                                        <>
                                            <Typography variant="subtitle2" sx={{ mt: 2 }}>Notes</Typography>
                                            <Typography variant="body2">
                                                {selectedSponsorship.notes}
                                            </Typography>
                                        </>
                                    )}

                                    {selectedSponsorship.contract_document && (
                                        <Button
                                            variant="outlined"
                                            startIcon={<ContractIcon />}
                                            href={selectedSponsorship.contract_document}
                                            target="_blank"
                                            sx={{ mt: 2 }}
                                            size="small"
                                        >
                                            View Contract Document
                                        </Button>
                                    )}
                                </Grid>

                                <Grid item xs={12} md={6}>
                                    <Typography variant="subtitle2">Financial Summary</Typography>
                                    <TableContainer component={Paper} variant="outlined" sx={{ mt: 1 }}>
                                        <Table size="small">
                                            <TableBody>
                                                <TableRow>
                                                    <TableCell>Total Amount</TableCell>
                                                    <TableCell align="right">
                                                        <Typography variant="body2" fontWeight="bold">
                                                            {formatCurrency(selectedSponsorship.total_amount)}
                                                        </Typography>
                                                    </TableCell>
                                                </TableRow>
                                                <TableRow>
                                                    <TableCell>Paid Amount</TableCell>
                                                    <TableCell align="right">
                                                        <Typography variant="body2" color="success.main" fontWeight="bold">
                                                            {formatCurrency(calculateTotalPaid())}
                                                        </Typography>
                                                    </TableCell>
                                                </TableRow>
                                                <TableRow>
                                                    <TableCell>Remaining</TableCell>
                                                    <TableCell align="right">
                                                        <Typography variant="body2" color="error.main" fontWeight="bold">
                                                            {formatCurrency(selectedSponsorship.total_amount - calculateTotalPaid())}
                                                        </Typography>
                                                    </TableCell>
                                                </TableRow>
                                            </TableBody>
                                        </Table>
                                    </TableContainer>
                                </Grid>

                                <Grid item xs={12}>
                                    <Divider sx={{ my: 2 }} />

                                    <Typography variant="h6" gutterBottom>
                                        Payment History
                                    </Typography>

                                    {payments.length === 0 ? (
                                        <Typography variant="body2" color="text.secondary">
                                            No payments recorded yet
                                        </Typography>
                                    ) : (
                                        <TableContainer component={Paper} variant="outlined">
                                            <Table>
                                                <TableHead>
                                                    <TableRow>
                                                        <TableCell>Date</TableCell>
                                                        <TableCell>Amount</TableCell>
                                                        <TableCell>Method</TableCell>
                                                        <TableCell>Reference</TableCell>
                                                        <TableCell>Notes</TableCell>
                                                        <TableCell align="right">Receipt</TableCell>
                                                    </TableRow>
                                                </TableHead>
                                                <TableBody>
                                                    {payments.map((payment) => (
                                                        <TableRow key={payment.id}>
                                                            <TableCell>{formatDate(payment.payment_date)}</TableCell>
                                                            <TableCell>{formatCurrency(payment.amount)}</TableCell>
                                                            <TableCell sx={{ textTransform: 'capitalize' }}>
                                                                {payment.payment_method.replace('_', ' ')}
                                                            </TableCell>
                                                            <TableCell>{payment.reference_number || '-'}</TableCell>
                                                            <TableCell>{payment.notes || '-'}</TableCell>
                                                            <TableCell align="right">
                                                                {payment.receipt_url ? (
                                                                    <IconButton
                                                                        size="small"
                                                                        href={payment.receipt_url}
                                                                        target="_blank"
                                                                    >
                                                                        <ReceiptIcon fontSize="small" />
                                                                    </IconButton>
                                                                ) : (
                                                                    '-'
                                                                )}
                                                            </TableCell>
                                                        </TableRow>
                                                    ))}
                                                </TableBody>
                                            </Table>
                                        </TableContainer>
                                    )}
                                </Grid>

                                <Grid item xs={12}>
                                    <Divider sx={{ my: 2 }} />

                                    <Typography variant="h6" gutterBottom>
                                        Brand Promotions
                                    </Typography>

                                    {promotions.length === 0 ? (
                                        <Typography variant="body2" color="text.secondary">
                                            No promotional activities scheduled yet
                                        </Typography>
                                    ) : (
                                        <TableContainer component={Paper} variant="outlined">
                                            <Table>
                                                <TableHead>
                                                    <TableRow>
                                                        <TableCell>Type</TableCell>
                                                        <TableCell>Description</TableCell>
                                                        <TableCell>Location</TableCell>
                                                        <TableCell>Date</TableCell>
                                                        <TableCell>Status</TableCell>
                                                    </TableRow>
                                                </TableHead>
                                                <TableBody>
                                                    {promotions.map((promo) => (
                                                        <TableRow key={promo.id}>
                                                            <TableCell sx={{ textTransform: 'capitalize' }}>
                                                                {promo.promotion_type.replace('_', ' ')}
                                                            </TableCell>
                                                            <TableCell>{promo.description}</TableCell>
                                                            <TableCell>{promo.location || '-'}</TableCell>
                                                            <TableCell>
                                                                {promo.start_date ? (
                                                                    <>
                                                                        {formatDate(promo.start_date)}
                                                                        {promo.end_date && ` - ${formatDate(promo.end_date)}`}
                                                                    </>
                                                                ) : (
                                                                    'TBD'
                                                                )}
                                                            </TableCell>
                                                            <TableCell>
                                                                <Chip
                                                                    label={promo.status}
                                                                    size="small"
                                                                    color={
                                                                        promo.status === 'completed' ? 'success' :
                                                                            promo.status === 'in_progress' ? 'warning' :
                                                                                'default'
                                                                    }
                                                                    sx={{ textTransform: 'capitalize' }}
                                                                />
                                                            </TableCell>
                                                        </TableRow>
                                                    ))}
                                                </TableBody>
                                            </Table>
                                        </TableContainer>
                                    )}
                                </Grid>
                            </Grid>
                        </DialogContent>

                        <DialogActions>
                            <Button onClick={handleCloseDetails}>
                                Close
                            </Button>

                            {(selectedSponsorship.status === 'approved' || selectedSponsorship.status === 'active') && (
                                <Button
                                    variant="contained"
                                    startIcon={<PaymentIcon />}
                                    onClick={() => {
                                        handleCloseDetails();
                                        handleOpenPaymentDialog(selectedSponsorship);
                                    }}
                                >
                                    Record Payment
                                </Button>
                            )}
                        </DialogActions>
                    </>
                )}
            </Dialog>

            {/* Payment Dialog */}
            <Dialog
                open={paymentDialogOpen}
                onClose={handleClosePaymentDialog}
                fullWidth
                maxWidth="sm"
            >
                <DialogTitle>Record Payment</DialogTitle>

                <DialogContent dividers>
                    {selectedSponsorship && (
                        <Grid container spacing={3}>
                            <Grid item xs={12}>
                                <Typography variant="subtitle2">
                                    Event: {selectedSponsorship.event_title}
                                </Typography>
                                <Typography variant="subtitle2">
                                    Package: {selectedSponsorship.package_name}
                                </Typography>
                                <Typography variant="subtitle2" color="primary">
                                    Total Amount: {formatCurrency(selectedSponsorship.total_amount)}
                                </Typography>
                            </Grid>

                            <Grid item xs={12}>
                                <TextField
                                    fullWidth
                                    required
                                    label="Payment Amount"
                                    name="amount"
                                    type="number"
                                    value={paymentData.amount}
                                    onChange={handleInputChange}
                                    InputProps={{
                                        startAdornment: <MoneyIcon sx={{ color: 'action.active', mr: 1 }} />,
                                    }}
                                />
                            </Grid>

                            <Grid item xs={12}>
                                <LocalizationProvider dateAdapter={AdapterDateFns}>
                                    <DateTimePicker
                                        label="Payment Date"
                                        value={paymentData.payment_date}
                                        onChange={(newValue) => handleDateChange('payment_date', newValue)}
                                        renderInput={(params) => <TextField {...params} fullWidth />}
                                    />
                                </LocalizationProvider>
                            </Grid>

                            <Grid item xs={12}>
                                <FormControl fullWidth required>
                                    <InputLabel>Payment Method</InputLabel>
                                    <Select
                                        name="payment_method"
                                        value={paymentData.payment_method}
                                        onChange={handleInputChange}
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
                                    fullWidth
                                    label="Reference Number"
                                    name="reference_number"
                                    value={paymentData.reference_number}
                                    onChange={handleInputChange}
                                    placeholder="Transaction ID, Check Number, etc."
                                />
                            </Grid>

                            <Grid item xs={12}>
                                <TextField
                                    fullWidth
                                    label="Receipt URL (Optional)"
                                    name="receipt_url"
                                    value={paymentData.receipt_url}
                                    onChange={handleInputChange}
                                    placeholder="Link to payment receipt/documentation"
                                />
                            </Grid>

                            <Grid item xs={12}>
                                <TextField
                                    fullWidth
                                    label="Additional Notes (Optional)"
                                    name="notes"
                                    value={paymentData.notes}
                                    onChange={handleInputChange}
                                    multiline
                                    rows={2}
                                />
                            </Grid>
                        </Grid>
                    )}
                </DialogContent>

                <DialogActions>
                    <Button onClick={handleClosePaymentDialog} disabled={submitting}>
                        Cancel
                    </Button>
                    <Button
                        variant="contained"
                        onClick={handleSubmitPayment}
                        disabled={submitting}
                    >
                        {submitting ? 'Submitting...' : 'Record Payment'}
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

export default SponsorshipContracts;