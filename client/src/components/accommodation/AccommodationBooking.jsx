import axios from 'axios';
import React, { useState, useEffect } from 'react';
import {
    Box,
    Typography,
    Grid,
    Card,
    CardContent,
    CardMedia,
    CardActions,
    Button,
    Stepper,
    Step,
    StepLabel,
    TextField,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    FormControlLabel,
    Checkbox,
    CircularProgress,
    Alert,
    Divider,
    Dialog,
    DialogActions,
    DialogContent,
    DialogContentText,
    DialogTitle,
    List,
    ListItem,
    ListItemIcon,
    ListItemText,
    Chip
} from '@mui/material';
import {
    Hotel as HotelIcon,
    Person as PersonIcon,
    CalendarToday as CalendarIcon,
    CreditCard as CreditCardIcon,
    Check as CheckIcon,
    CheckCircle as CheckCircleIcon,
    Wifi as WifiIcon,
    Pool as PoolIcon,
    Restaurant as RestaurantIcon,
    Spa as SpaIcon,
    FitnessCenter as FitnessCenterIcon,
    LocalParking as ParkingIcon,
    AcUnit as AcIcon,
    EmojiEvents as EventIcon
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { format, addDays, differenceInDays } from 'date-fns';
import { useAuth } from '../../context/AuthContext';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { accommodationService, paymentService } from '../../services/api';

// Amenity icon mapping
const amenityIcons = {
    wifi: <WifiIcon />,
    pool: <PoolIcon />,
    restaurant: <RestaurantIcon />,
    spa: <SpaIcon />,
    gym: <FitnessCenterIcon />,
    parking: <ParkingIcon />,
    "air conditioning": <AcIcon />,
    breakfast: <RestaurantIcon />
};

const AccommodationBooking = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const { eventId } = useParams();

    const [activeStep, setActiveStep] = useState(0);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [accommodations, setAccommodations] = useState([]);
    const [selectedAccommodation, setSelectedAccommodation] = useState(null);
    const [availableRooms, setAvailableRooms] = useState([]);
    const [selectedRoom, setSelectedRoom] = useState(null);
    const [checkInDate, setCheckInDate] = useState(null);
    const [checkOutDate, setCheckOutDate] = useState(null);
    const [totalPrice, setTotalPrice] = useState(0);
    const [paymentMethod, setPaymentMethod] = useState('credit_card');
    const [specialRequests, setSpecialRequests] = useState('');
    const [bookingConfirmed, setBookingConfirmed] = useState(false);
    const [bookingId, setBookingId] = useState(null);
    const [eventDetails, setEventDetails] = useState(null);
    const [alert, setAlert] = useState({ open: false, message: '', severity: 'info' });
    const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
    const [showSuccessDialog, setShowSuccessDialog] = useState(false);

    const steps = ['Select Accommodation', 'Choose Room', 'Confirm Booking'];

    // Fetch accommodations
    useEffect(() => {
        const fetchAccommodations = async () => {
            try {
                setLoading(true);
                setError(null);

                // If event ID is provided, fetch accommodations for that event
                const response = await accommodationService.getAll({
                    eventId: eventId || undefined,
                    isActive: true
                });

                if (response && response.data.accommodations) {
                    setAccommodations(response.data.accommodations);
                } else {
                    setAccommodations([]);
                }

                // If event ID is provided, fetch event details
                if (eventId) {
                    try {
                        const eventResponse = await axios.get(`/api/events/${eventId}`, {
                            headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
                        });

                        if (eventResponse && eventResponse.data.event) {
                            setEventDetails(eventResponse.data.event);

                            // Default check-in date to event start date
                            if (eventResponse.data.event.start_date) {
                                const eventStartDate = new Date(eventResponse.data.event.start_date);
                                setCheckInDate(eventStartDate);
                                setCheckOutDate(new Date(eventStartDate.getTime() + (2 * 24 * 60 * 60 * 1000))); // Default 2 days stay
                            }
                        }
                    } catch (eventError) {
                        console.error('Error fetching event details:', eventError);
                    }
                } else {
                    // Default dates if no event ID
                    const today = new Date();
                    setCheckInDate(today);
                    setCheckOutDate(addDays(today, 2));
                }

                setLoading(false);
            } catch (error) {
                console.error('Error fetching accommodations:', error);
                setError('Failed to load accommodations. Please try again.');
                setLoading(false);
            }
        };

        fetchAccommodations();
    }, [eventId]);

    // Calculate total price when dates or room changes
    useEffect(() => {
        if (selectedRoom && checkInDate && checkOutDate) {
            const nights = Math.max(1, differenceInDays(checkOutDate, checkInDate));
            const price = selectedRoom.price_per_night * nights;
            setTotalPrice(price);
        } else {
            setTotalPrice(0);
        }
    }, [selectedRoom, checkInDate, checkOutDate]);

    // Handle accommodation selection
    const handleSelectAccommodation = async (accommodation) => {
        setSelectedAccommodation(accommodation);
        setLoading(true);

        try {
            // Fetch available rooms for the selected accommodation
            const response = await accommodationService.getAvailableRooms(
                accommodation.id,
                format(checkInDate, 'yyyy-MM-dd'),
                format(checkOutDate, 'yyyy-MM-dd')
            );

            if (response && response.data.rooms) {
                setAvailableRooms(response.data.rooms);
            } else {
                setAvailableRooms([]);
                setAlert({
                    open: true,
                    message: 'No available rooms found for the selected dates',
                    severity: 'warning'
                });
            }
            setLoading(false);
            setActiveStep(1);
        } catch (error) {
            console.error('Error fetching available rooms:', error);
            setAlert({
                open: true,
                message: 'Error fetching available rooms. Please try again.',
                severity: 'error'
            });
            setLoading(false);
        }
    };

    // Handle room selection
    const handleSelectRoom = (room) => {
        setSelectedRoom(room);
        setActiveStep(2);
    };

    // Handle date changes
    const handleDateChange = (date, type) => {
        if (type === 'checkIn') {
            setCheckInDate(date);
            // Ensure check-out is after check-in
            if (checkOutDate && date >= checkOutDate) {
                setCheckOutDate(addDays(date, 1));
            }
        } else {
            setCheckOutDate(date);
        }

        // Reset room selection if dates change
        if (selectedAccommodation && activeStep > 0) {
            setSelectedRoom(null);
            setActiveStep(0);
        }
    };

    // Process booking
    const handleBookingSubmit = async () => {
        try {
            setLoading(true);

            const bookingData = {
                event_id: eventId || null,
                room_id: selectedRoom.id,
                check_in_date: format(checkInDate, 'yyyy-MM-dd'),
                check_out_date: format(checkOutDate, 'yyyy-MM-dd'),
                payment_method: paymentMethod,
                special_requests: specialRequests
            };

            const response = await accommodationService.book(
                selectedAccommodation.id,
                bookingData
            );

            if (response && response.data.booking) {
                setBookingId(response.data.booking.id);
                setBookingConfirmed(true);
                setShowSuccessDialog(true);
            }

            setLoading(false);
        } catch (error) {
            console.error('Error submitting booking:', error);
            setAlert({
                open: true,
                message: error.response?.data?.message || 'Error submitting booking. Please try again.',
                severity: 'error'
            });
            setLoading(false);
        }
    };

    // Format dates for display
    const formatDate = (date) => {
        return date ? format(date, 'MMMM d, yyyy') : '';
    };

    // Parse amenities string into array
    const parseAmenities = (amenitiesString) => {
        if (!amenitiesString) return [];
        return amenitiesString.split(',').map(item => item.trim());
    };

    // Handle navigation between steps
    const handleNext = () => {
        setActiveStep(activeStep + 1);
    };

    const handleBack = () => {
        setActiveStep(activeStep - 1);
    };

    const handleBackToAccommodations = () => {
        setSelectedAccommodation(null);
        setSelectedRoom(null);
        setActiveStep(0);
    };

    const handleGoToMyBookings = () => {
        navigate('/user/bookings');
    };

    const renderAccommodationSelection = () => (
        <Box>
            <Typography variant="h6" gutterBottom>
                Select Accommodation
            </Typography>

            {eventDetails && (
                <Alert severity="info" sx={{ mb: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <EventIcon sx={{ mr: 1 }} />
                        <Typography variant="body2">
                            Booking for event: <strong>{eventDetails.title}</strong> ({formatDate(new Date(eventDetails.start_date))} - {formatDate(new Date(eventDetails.end_date))})
                        </Typography>
                    </Box>
                </Alert>
            )}

            <LocalizationProvider dateAdapter={AdapterDateFns}>
                <Grid container spacing={2} sx={{ mb: 4 }}>
                    <Grid item xs={12} sm={6}>
                        <DatePicker
                            label="Check-in Date"
                            value={checkInDate}
                            onChange={(date) => handleDateChange(date, 'checkIn')}
                            minDate={eventDetails ? new Date(eventDetails.start_date) : new Date()}
                            slotProps={{
                                textField: { fullWidth: true, variant: "outlined" }
                            }}
                        />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                        <DatePicker
                            label="Check-out Date"
                            value={checkOutDate}
                            onChange={(date) => handleDateChange(date, 'checkOut')}
                            minDate={checkInDate ? addDays(checkInDate, 1) : addDays(new Date(), 1)}
                            maxDate={eventDetails ? new Date(eventDetails.end_date) : undefined}
                            slotProps={{
                                textField: { fullWidth: true, variant: "outlined" }
                            }}
                        />
                    </Grid>
                </Grid>
            </LocalizationProvider>

            <Grid container spacing={3}>
                {accommodations.map((accommodation) => (
                    <Grid item xs={12} md={6} key={accommodation.id}>
                        <Card sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                            <CardMedia
                                component="img"
                                height="200"
                                image={accommodation.image_url || "https://source.unsplash.com/random?hotel"}
                                alt={accommodation.name}
                            />
                            <CardContent sx={{ flexGrow: 1 }}>
                                <Typography variant="h5" component="div" gutterBottom>
                                    {accommodation.name}
                                </Typography>
                                <Typography variant="body2" color="text.secondary" paragraph>
                                    {accommodation.description || 'No description available.'}
                                </Typography>
                                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                                    <HotelIcon sx={{ color: 'primary.main', mr: 1 }} fontSize="small" />
                                    <Typography variant="body2">
                                        <strong>Location:</strong> {accommodation.location}
                                    </Typography>
                                </Box>
                                <Typography variant="body2" sx={{ mb: 1 }}>
                                    <strong>Price per night:</strong> ${accommodation.price_per_night.toFixed(2)}
                                </Typography>

                                {accommodation.amenities && (
                                    <Box sx={{ mt: 2 }}>
                                        <Typography variant="subtitle2" gutterBottom>
                                            Amenities:
                                        </Typography>
                                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                                            {parseAmenities(accommodation.amenities).map((amenity, index) => {
                                                const icon = amenityIcons[amenity.toLowerCase()] || <CheckIcon />;
                                                return (
                                                    <Chip
                                                        key={index}
                                                        size="small"
                                                        icon={icon}
                                                        label={amenity}
                                                        variant="outlined"
                                                        sx={{ mb: 0.5 }}
                                                    />
                                                );
                                            })}
                                        </Box>
                                    </Box>
                                )}
                            </CardContent>
                            <CardActions>
                                <Button
                                    size="small"
                                    color="primary"
                                    variant="contained"
                                    fullWidth
                                    onClick={() => handleSelectAccommodation(accommodation)}
                                    disabled={!checkInDate || !checkOutDate}
                                >
                                    Select
                                </Button>
                            </CardActions>
                        </Card>
                    </Grid>
                ))}
                {accommodations.length === 0 && !loading && (
                    <Grid item xs={12}>
                        <Alert severity="info">
                            No accommodations found. Please try different dates.
                        </Alert>
                    </Grid>
                )}
            </Grid>
        </Box>
    );

    const renderRoomSelection = () => (
        <Box>
            <Typography variant="h6" gutterBottom>
                Choose a Room at {selectedAccommodation?.name}
            </Typography>

            <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="body2" color="text.secondary">
                    {formatDate(checkInDate)} - {formatDate(checkOutDate)}
                    ({differenceInDays(checkOutDate, checkInDate)} night{differenceInDays(checkOutDate, checkInDate) !== 1 ? 's' : ''})
                </Typography>
                <Button variant="outlined" size="small" onClick={handleBackToAccommodations}>
                    Change Accommodation/Dates
                </Button>
            </Box>

            <Grid container spacing={2}>
                {availableRooms.map((room) => {
                    const nights = differenceInDays(checkOutDate, checkInDate);
                    const totalRoomPrice = room.price_per_night * nights;

                    return (
                        <Grid item xs={12} key={room.id}>
                            <Card sx={{ display: 'flex', height: '100%', flexDirection: { xs: 'column', sm: 'row' } }}>
                                <CardContent sx={{ flex: '1 0 70%' }}>
                                    <Typography variant="h6" gutterBottom>
                                        {room.room_type.charAt(0).toUpperCase() + room.room_type.slice(1)} Room - {room.room_number}
                                    </Typography>
                                    <Box sx={{ mb: 1 }}>
                                        <Typography variant="body2" sx={{ display: 'flex', alignItems: 'center' }} color="text.secondary">
                                            <PersonIcon fontSize="small" sx={{ mr: 1 }} /> Capacity: {room.capacity} person{room.capacity !== 1 ? 's' : ''}
                                        </Typography>
                                    </Box>
                                    <Typography variant="body2" sx={{ mb: 1 }}>
                                        Room Type: {room.room_type.charAt(0).toUpperCase() + room.room_type.slice(1)}
                                    </Typography>
                                </CardContent>

                                <Box sx={{
                                    display: 'flex',
                                    flexDirection: 'column',
                                    justifyContent: 'space-between',
                                    p: 2,
                                    bgcolor: 'background.paper',
                                    borderLeft: { xs: 'none', sm: '1px solid #ddd' },
                                    borderTop: { xs: '1px solid #ddd', sm: 'none' },
                                    flex: '1 0 30%'
                                }}>
                                    <Box>
                                        <Typography variant="h6" color="primary.main">
                                            ${room.price_per_night.toFixed(2)}
                                            <Typography variant="caption" sx={{ ml: 0.5 }}>per night</Typography>
                                        </Typography>
                                        <Typography variant="body2" gutterBottom>
                                            Total: ${totalRoomPrice.toFixed(2)} for {nights} night{nights !== 1 ? 's' : ''}
                                        </Typography>
                                    </Box>
                                    <Button
                                        variant="contained"
                                        color="primary"
                                        sx={{ mt: 2 }}
                                        onClick={() => handleSelectRoom(room)}
                                    >
                                        Select Room
                                    </Button>
                                </Box>
                            </Card>
                        </Grid>
                    );
                })}
                {availableRooms.length === 0 && !loading && (
                    <Grid item xs={12}>
                        <Alert severity="warning">
                            No available rooms found for the selected dates. Please try different dates.
                        </Alert>
                    </Grid>
                )}
            </Grid>
        </Box>
    );

    const renderBookingConfirmation = () => (
        <Box>
            <Typography variant="h6" gutterBottom>
                Confirm Your Booking
            </Typography>

            <Grid container spacing={3}>
                <Grid item xs={12} md={8}>
                    <Card sx={{ mb: 3 }}>
                        <CardContent>
                            <Typography variant="h6" color="primary" gutterBottom>
                                Booking Details
                            </Typography>
                            <Grid container spacing={2}>
                                <Grid item xs={12} sm={6}>
                                    <Typography variant="body2">
                                        <strong>Check-in:</strong> {formatDate(checkInDate)}
                                    </Typography>
                                </Grid>
                                <Grid item xs={12} sm={6}>
                                    <Typography variant="body2">
                                        <strong>Check-out:</strong> {formatDate(checkOutDate)}
                                    </Typography>
                                </Grid>
                                <Grid item xs={12} sm={6}>
                                    <Typography variant="body2">
                                        <strong>Accommodation:</strong> {selectedAccommodation?.name}
                                    </Typography>
                                </Grid>
                                <Grid item xs={12} sm={6}>
                                    <Typography variant="body2">
                                        <strong>Room:</strong> {selectedRoom?.room_type.charAt(0).toUpperCase() + selectedRoom?.room_type.slice(1)} - {selectedRoom?.room_number}
                                    </Typography>
                                </Grid>
                                <Grid item xs={12} sm={6}>
                                    <Typography variant="body2">
                                        <strong>Room Capacity:</strong> {selectedRoom?.capacity} person{selectedRoom?.capacity !== 1 ? 's' : ''}
                                    </Typography>
                                </Grid>
                            </Grid>

                            {eventDetails && (
                                <Box sx={{ mt: 2 }}>
                                    <Divider sx={{ my: 1 }} />
                                    <Typography variant="subtitle2" gutterBottom>
                                        Event Information:
                                    </Typography>
                                    <Typography variant="body2">
                                        <strong>Event:</strong> {eventDetails.title}
                                    </Typography>
                                    <Typography variant="body2">
                                        <strong>Event Dates:</strong> {formatDate(new Date(eventDetails.start_date))} - {formatDate(new Date(eventDetails.end_date))}
                                    </Typography>
                                </Box>
                            )}
                        </CardContent>
                    </Card>

                    <Card>
                        <CardContent>
                            <Typography variant="h6" color="primary" gutterBottom>
                                Payment Information
                            </Typography>
                            <FormControl fullWidth sx={{ mb: 2 }}>
                                <InputLabel id="payment-method-label">Payment Method</InputLabel>
                                <Select
                                    labelId="payment-method-label"
                                    value={paymentMethod}
                                    label="Payment Method"
                                    onChange={(e) => setPaymentMethod(e.target.value)}
                                >
                                    <MenuItem value="credit_card">Credit Card</MenuItem>
                                    <MenuItem value="bank_transfer">Bank Transfer</MenuItem>
                                    <MenuItem value="cash">Cash on Arrival</MenuItem>
                                </Select>
                            </FormControl>

                            <TextField
                                fullWidth
                                multiline
                                rows={3}
                                label="Special Requests (optional)"
                                variant="outlined"
                                value={specialRequests}
                                onChange={(e) => setSpecialRequests(e.target.value)}
                                placeholder="Any special requests or requirements?"
                            />
                        </CardContent>
                    </Card>
                </Grid>

                <Grid item xs={12} md={4}>
                    <Card>
                        <CardContent>
                            <Typography variant="h6" color="primary" gutterBottom>
                                Price Summary
                            </Typography>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                                <Typography variant="body2">
                                    Room Rate:
                                </Typography>
                                <Typography variant="body2">
                                    ${selectedRoom?.price_per_night.toFixed(2)} per night
                                </Typography>
                            </Box>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                                <Typography variant="body2">
                                    Number of Nights:
                                </Typography>
                                <Typography variant="body2">
                                    {differenceInDays(checkOutDate, checkInDate)}
                                </Typography>
                            </Box>
                            <Divider sx={{ my: 1 }} />
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                                <Typography variant="subtitle1" fontWeight="bold">
                                    Total:
                                </Typography>
                                <Typography variant="subtitle1" fontWeight="bold">
                                    ${totalPrice.toFixed(2)}
                                </Typography>
                            </Box>
                            <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 1, mb: 2 }}>
                                * Payment will be processed at check-in unless otherwise specified.
                            </Typography>
                            <Button
                                variant="contained"
                                color="primary"
                                fullWidth
                                size="large"
                                onClick={() => setConfirmDialogOpen(true)}
                                sx={{ mt: 1 }}
                            >
                                Confirm Booking
                            </Button>
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>
        </Box>
    );

    const renderStepContent = (step) => {
        switch (step) {
            case 0:
                return renderAccommodationSelection();
            case 1:
                return renderRoomSelection();
            case 2:
                return renderBookingConfirmation();
            default:
                return <Typography>Unknown step</Typography>;
        }
    };

    return (
        <Box sx={{ p: 3 }}>
            <Typography variant="h4" gutterBottom>
                Book Accommodation
            </Typography>

            {/* Stepper */}
            <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
                {steps.map((label) => (
                    <Step key={label}>
                        <StepLabel>{label}</StepLabel>
                    </Step>
                ))}
            </Stepper>

            {/* Alert messages */}
            {alert.open && (
                <Alert
                    severity={alert.severity}
                    sx={{ mb: 3 }}
                    onClose={() => setAlert({ ...alert, open: false })}
                >
                    {alert.message}
                </Alert>
            )}

            {/* Loading indicator */}
            {loading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', my: 5 }}>
                    <CircularProgress />
                </Box>
            ) : (
                <Box>
                    {renderStepContent(activeStep)}

                    {/* Navigation buttons */}
                    {activeStep > 0 && activeStep < 2 && (
                        <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 3 }}>
                            <Button
                                onClick={handleBack}
                                sx={{ mr: 1 }}
                            >
                                Back
                            </Button>
                        </Box>
                    )}
                </Box>
            )}

            {/* Booking confirmation dialog */}
            <Dialog
                open={confirmDialogOpen}
                onClose={() => setConfirmDialogOpen(false)}
            >
                <DialogTitle>Confirm Booking</DialogTitle>
                <DialogContent>
                    <DialogContentText>
                        Are you sure you want to book this accommodation? This will create a reservation for:
                        <Box component="ul" sx={{ mt: 1 }}>
                            <Box component="li">
                                {selectedAccommodation?.name}, Room {selectedRoom?.room_number}
                            </Box>
                            <Box component="li">
                                Check-in: {formatDate(checkInDate)}
                            </Box>
                            <Box component="li">
                                Check-out: {formatDate(checkOutDate)}
                            </Box>
                            <Box component="li">
                                Total price: ${totalPrice.toFixed(2)}
                            </Box>
                        </Box>
                    </DialogContentText>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setConfirmDialogOpen(false)}>Cancel</Button>
                    <Button
                        onClick={() => {
                            setConfirmDialogOpen(false);
                            handleBookingSubmit();
                        }}
                        variant="contained"
                        color="primary"
                        autoFocus
                    >
                        Confirm
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Success dialog */}
            <Dialog
                open={showSuccessDialog}
                onClose={() => setShowSuccessDialog(false)}
            >
                <DialogTitle>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <CheckCircleIcon color="success" sx={{ mr: 1 }} />
                        Booking Confirmed!
                    </Box>
                </DialogTitle>
                <DialogContent>
                    <DialogContentText>
                        Your accommodation has been successfully booked. Your booking reference number is <strong>#{bookingId}</strong>.
                    </DialogContentText>
                    <Box sx={{ mt: 2 }}>
                        <Typography variant="subtitle2" gutterBottom>
                            Booking Details:
                        </Typography>
                        <Typography variant="body2">
                            {selectedAccommodation?.name}, Room {selectedRoom?.room_number}
                            <br />
                            Check-in: {formatDate(checkInDate)}
                            <br />
                            Check-out: {formatDate(checkOutDate)}
                            <br />
                            Total: ${totalPrice.toFixed(2)}
                        </Typography>
                    </Box>
                    <Alert severity="info" sx={{ mt: 2 }}>
                        A confirmation email has been sent to your registered email address.
                    </Alert>
                </DialogContent>
                <DialogActions>
                    <Button
                        onClick={handleGoToMyBookings}
                        variant="outlined"
                    >
                        View My Bookings
                    </Button>
                    <Button
                        onClick={() => {
                            setShowSuccessDialog(false);
                            navigate('/dashboard');
                        }}
                        variant="contained"
                    >
                        Go to Dashboard
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default AccommodationBooking;