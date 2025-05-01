import React, { useState, useEffect, useCallback } from 'react';
import {
    Box,
    Typography,
    Paper,
    Button,
    Grid,
    Card,
    CardContent,
    CardActions,
    Tabs,
    Tab,
    TextField,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    FormControlLabel,
    Checkbox,
    Snackbar,
    Alert,
    IconButton,
    InputAdornment,
    CircularProgress
} from '@mui/material';
import {
    Add as AddIcon,
    Event as EventIcon,
    Edit as EditIcon,
    Delete as DeleteIcon,
    CalendarMonth as CalendarIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import axios from 'axios';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import { LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import EventCalendar from './EventCalendar';

const EventManagement = ({ createTeamEvent }) => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [events, setEvents] = useState([]);
    const [tabValue, setTabValue] = useState(0);
    const [eventDialogOpen, setEventDialogOpen] = useState(false);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [currentEvent, setCurrentEvent] = useState({
        title: '',
        description: '',
        rules: '',
        location: '',
        start_date: new Date(),
        end_date: new Date(new Date().getTime() + 24 * 60 * 60 * 1000), // Next day
        capacity: 100,
        max_participants: 50,
        registration_fee: 0,
        team_event: createTeamEvent || false,
        min_team_size: createTeamEvent ? 2 : 1,
        max_team_size: createTeamEvent ? 5 : 1,
        category: 'Tech Events'
    });
    const [eventToDelete, setEventToDelete] = useState(null);
    const [dialogMode, setDialogMode] = useState('add');
    const [alert, setAlert] = useState({
        open: false,
        message: '',
        severity: 'success'
    });
    const [categories, setCategories] = useState([]);

    const fetchEvents = useCallback(async () => {
        try {
            setLoading(true);
            let url = '/api/events';

            if (user.role !== 'admin') {
                // Filter by organizer if not admin
                url = `/api/events/organizer/${user.id}`;
            }

            const response = await axios.get(url, {
                headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
            });

            setEvents(response.data.events || []);
            setLoading(false);
        } catch (error) {
            console.error('Error fetching events:', error);
            setAlert({
                open: true,
                message: 'Failed to load events',
                severity: 'error'
            });
            setLoading(false);
        }
    }, [user.role, user.id]);

    const fetchCategories = useCallback(async () => {
        try {
            const response = await axios.get('/api/categories', {
                headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
            });

            setCategories(response.data.categories || []);
        } catch (error) {
            console.error('Error fetching categories:', error);
        }
    }, []);

    useEffect(() => {
        fetchEvents();
        fetchCategories();
    }, [fetchEvents, fetchCategories]);

    const handleTabChange = (event, newValue) => {
        setTabValue(newValue);
    };

    const handleAddEvent = () => {
        setCurrentEvent({
            title: '',
            description: '',
            rules: '',
            location: '',
            start_date: new Date(),
            end_date: new Date(new Date().getTime() + 24 * 60 * 60 * 1000), // Next day
            capacity: 100,
            max_participants: 50,
            registration_fee: 0,
            team_event: createTeamEvent || false,
            min_team_size: createTeamEvent ? 2 : 1,
            max_team_size: createTeamEvent ? 5 : 1,
            category: 'Tech Events'
        });
        setDialogMode('add');
        setEventDialogOpen(true);
    };

    const handleEditEvent = (event) => {
        setCurrentEvent({
            id: event.id,
            title: event.title,
            description: event.description,
            rules: event.rules || '',
            location: event.location,
            start_date: new Date(event.start_date),
            end_date: new Date(event.end_date),
            capacity: event.capacity,
            max_participants: event.max_participants,
            registration_fee: event.registration_fee || 0,
            team_event: event.team_event || false,
            min_team_size: event.min_team_size || 1,
            max_team_size: event.max_team_size || 1,
            category: event.category
        });
        setDialogMode('edit');
        setEventDialogOpen(true);
    };

    const handleDeleteDialog = (event) => {
        setEventToDelete(event);
        setDeleteDialogOpen(true);
    };

    const handleInputChange = (e) => {
        const { name, value, type, checked } = e.target;
        setCurrentEvent({
            ...currentEvent,
            [name]: type === 'checkbox' ? checked : value
        });
    };

    const handleDateChange = (name, value) => {
        setCurrentEvent({
            ...currentEvent,
            [name]: value
        });
    };

    const handleSubmitEvent = async () => {
        try {
            // Form validation
            if (!currentEvent.title || !currentEvent.description || !currentEvent.location) {
                setAlert({
                    open: true,
                    message: 'Please fill in all required fields',
                    severity: 'error'
                });
                return;
            }

            // Format data for API
            const eventData = {
                ...currentEvent,
                start_date: currentEvent.start_date.toISOString(),
                end_date: currentEvent.end_date.toISOString()
            };

            // Log the event data being sent to server - for debugging
            console.log('Submitting event with data:', eventData);

            let response;
            if (dialogMode === 'add') {
                response = await axios.post('/api/events', eventData, {
                    headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
                });
                setAlert({
                    open: true,
                    message: 'Event created successfully',
                    severity: 'success'
                });
            } else {
                response = await axios.put(`/api/events/${currentEvent.id}`, eventData, {
                    headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
                });
                setAlert({
                    open: true,
                    message: 'Event updated successfully',
                    severity: 'success'
                });
            }

            // Close dialog and refresh events
            setEventDialogOpen(false);
            fetchEvents();
        } catch (error) {
            console.error('Error submitting event:', error);
            setAlert({
                open: true,
                message: error.response?.data?.message || 'Failed to save event',
                severity: 'error'
            });
        }
    };

    const handleDeleteEvent = async () => {
        try {
            await axios.delete(`/api/events/${eventToDelete.id}`, {
                headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
            });

            setAlert({
                open: true,
                message: 'Event deleted successfully',
                severity: 'success'
            });

            setDeleteDialogOpen(false);
            fetchEvents();
        } catch (error) {
            console.error('Error deleting event:', error);
            setAlert({
                open: true,
                message: 'Failed to delete event',
                severity: 'error'
            });
        }
    };

    const handleViewEvent = (event) => {
        navigate(`/events/${event.id}`);
    };

    const handleManageRounds = (event) => {
        navigate(`/events/${event.id}/rounds`);
    };

    // Render event list
    const renderEventList = () => {
        if (loading) {
            return (
                <Box sx={{ display: 'flex', justifyContent: 'center', p: 5 }}>
                    <CircularProgress />
                </Box>
            );
        }

        if (events.length === 0) {
            return (
                <Paper sx={{ p: 4, textAlign: 'center' }}>
                    <Typography variant="h6" color="textSecondary">
                        No events found
                    </Typography>
                    <Button
                        variant="contained"
                        startIcon={<AddIcon />}
                        onClick={handleAddEvent}
                        sx={{ mt: 2 }}
                    >
                        Create your first event
                    </Button>
                </Paper>
            );
        }

        return (
            <Grid container spacing={3}>
                {events.map((event) => (
                    <Grid key={event.id} md={4} sm={6} xs={12}>
                        <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                            <CardContent sx={{ flexGrow: 1 }}>
                                <Typography variant="h5" component="h2" gutterBottom>
                                    {event.title}
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                    {event.description.length > 100
                                        ? `${event.description.substring(0, 100)}...`
                                        : event.description}
                                </Typography>
                                <Box sx={{ mt: 2 }}>
                                    <Typography variant="body2">
                                        <strong>Category:</strong> {event.category}
                                    </Typography>
                                    <Typography variant="body2">
                                        <strong>Location:</strong> {event.location}
                                    </Typography>
                                    <Typography variant="body2">
                                        <strong>Date:</strong> {new Date(event.start_date).toLocaleDateString()}
                                    </Typography>
                                    <Typography variant="body2">
                                        <strong>Type:</strong> {event.team_event ? 'Team Event' : 'Individual Event'}
                                    </Typography>
                                    {event.team_event && (
                                        <Typography variant="body2">
                                            <strong>Team Size:</strong> {event.min_team_size}-{event.max_team_size} members
                                        </Typography>
                                    )}
                                </Box>
                            </CardContent>
                            <CardActions>
                                <Button size="small" onClick={() => handleViewEvent(event)}>View</Button>
                                <Button size="small" onClick={() => handleEditEvent(event)}>Edit</Button>
                                <Button size="small" color="primary" onClick={() => handleManageRounds(event)}>Rounds</Button>
                                <IconButton
                                    size="small"
                                    color="error"
                                    onClick={() => handleDeleteDialog(event)}
                                >
                                    <DeleteIcon />
                                </IconButton>
                            </CardActions>
                        </Card>
                    </Grid>
                ))}
            </Grid>
        );
    };

    // Render event calendar view
    const renderEventCalendar = () => {
        return <EventCalendar events={events} />;
    };

    return (
        <Box sx={{ p: 3 }}>
            <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="h4" component="h1">
                    Event Management
                </Typography>
                <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={handleAddEvent}
                >
                    Create Event
                </Button>
            </Box>

            <Paper sx={{ mb: 3 }}>
                <Tabs
                    value={tabValue}
                    onChange={handleTabChange}
                    indicatorColor="primary"
                    textColor="primary"
                >
                    <Tab icon={<EventIcon />} label="List View" />
                    <Tab icon={<CalendarIcon />} label="Calendar View" />
                </Tabs>
            </Paper>

            {tabValue === 0 && renderEventList()}
            {tabValue === 1 && renderEventCalendar()}

            {/* Event Form Dialog */}
            <LocalizationProvider dateAdapter={AdapterDateFns}>
                <Dialog
                    open={eventDialogOpen}
                    onClose={() => setEventDialogOpen(false)}
                    maxWidth="md"
                    fullWidth
                >
                    <DialogTitle>{dialogMode === 'add' ? 'Create Event' : 'Edit Event'}</DialogTitle>
                    <DialogContent>
                        <Grid container spacing={2} sx={{ mt: 1 }}>
                            <Grid md={12}>
                                <TextField
                                    name="title"
                                    label="Event Title"
                                    fullWidth
                                    value={currentEvent.title}
                                    onChange={handleInputChange}
                                    required
                                />
                            </Grid>
                            <Grid md={12}>
                                <TextField
                                    name="description"
                                    label="Description"
                                    fullWidth
                                    multiline
                                    rows={3}
                                    value={currentEvent.description}
                                    onChange={handleInputChange}
                                    required
                                />
                            </Grid>
                            <Grid md={12}>
                                <TextField
                                    name="rules"
                                    label="Rules"
                                    fullWidth
                                    multiline
                                    rows={3}
                                    value={currentEvent.rules}
                                    onChange={handleInputChange}
                                    helperText="Specify event rules and guidelines"
                                />
                            </Grid>
                            <Grid md={6}>
                                <FormControl fullWidth required>
                                    <InputLabel>Category</InputLabel>
                                    <Select
                                        name="category"
                                        value={currentEvent.category}
                                        onChange={handleInputChange}
                                        label="Category"
                                    >
                                        {categories.map((category) => (
                                            <MenuItem key={category.name} value={category.name}>
                                                {category.name}
                                            </MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>
                            </Grid>
                            <Grid md={6}>
                                <TextField
                                    name="location"
                                    label="Venue/Location"
                                    fullWidth
                                    value={currentEvent.location}
                                    onChange={handleInputChange}
                                    required
                                />
                            </Grid>
                            <Grid md={6}>
                                <DateTimePicker
                                    label="Start Date & Time"
                                    value={currentEvent.start_date}
                                    onChange={(newValue) => handleDateChange('start_date', newValue)}
                                    slotProps={{
                                        textField: {
                                            fullWidth: true
                                        }
                                    }}
                                />
                            </Grid>
                            <Grid md={6}>
                                <DateTimePicker
                                    label="End Date & Time"
                                    value={currentEvent.end_date}
                                    onChange={(newValue) => handleDateChange('end_date', newValue)}
                                    slotProps={{
                                        textField: {
                                            fullWidth: true
                                        }
                                    }}
                                />
                            </Grid>
                            <Grid md={6}>
                                <TextField
                                    name="capacity"
                                    label="Venue Capacity"
                                    type="number"
                                    fullWidth
                                    value={currentEvent.capacity}
                                    onChange={handleInputChange}
                                    InputProps={{
                                        inputProps: { min: 0 }
                                    }}
                                />
                            </Grid>
                            <Grid md={6}>
                                <TextField
                                    name="max_participants"
                                    label="Max Participants"
                                    type="number"
                                    fullWidth
                                    value={currentEvent.max_participants}
                                    onChange={handleInputChange}
                                    InputProps={{
                                        inputProps: { min: 0 }
                                    }}
                                />
                            </Grid>
                            <Grid md={6}>
                                <TextField
                                    name="registration_fee"
                                    label="Registration Fee"
                                    type="number"
                                    fullWidth
                                    value={currentEvent.registration_fee}
                                    onChange={handleInputChange}
                                    InputProps={{
                                        startAdornment: <InputAdornment position="start">$</InputAdornment>,
                                        inputProps: { min: 0, step: 0.01 }
                                    }}
                                />
                            </Grid>
                            <Grid md={12}>
                                <FormControlLabel
                                    control={
                                        <Checkbox
                                            name="team_event"
                                            checked={currentEvent.team_event}
                                            onChange={handleInputChange}
                                        />
                                    }
                                    label="This is a team event"
                                />
                            </Grid>
                            {currentEvent.team_event && (
                                <>
                                    <Grid md={6}>
                                        <TextField
                                            name="min_team_size"
                                            label="Min Team Size"
                                            type="number"
                                            fullWidth
                                            value={currentEvent.min_team_size}
                                            onChange={handleInputChange}
                                            InputProps={{
                                                inputProps: { min: 1 }
                                            }}
                                        />
                                    </Grid>
                                    <Grid md={6}>
                                        <TextField
                                            name="max_team_size"
                                            label="Max Team Size"
                                            type="number"
                                            fullWidth
                                            value={currentEvent.max_team_size}
                                            onChange={handleInputChange}
                                            InputProps={{
                                                inputProps: { min: currentEvent.min_team_size }
                                            }}
                                        />
                                    </Grid>
                                </>
                            )}
                        </Grid>
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={() => setEventDialogOpen(false)}>Cancel</Button>
                        <Button onClick={handleSubmitEvent} variant="contained" color="primary">
                            {dialogMode === 'add' ? 'Create Event' : 'Save Changes'}
                        </Button>
                    </DialogActions>
                </Dialog>
            </LocalizationProvider>

            {/* Delete Confirmation Dialog */}
            <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
                <DialogTitle>Confirm Delete</DialogTitle>
                <DialogContent>
                    <Typography>
                        Are you sure you want to delete the event "{eventToDelete?.title}"? This action cannot be undone.
                    </Typography>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
                    <Button onClick={handleDeleteEvent} variant="contained" color="error">
                        Delete
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Alert Snackbar */}
            <Snackbar
                open={alert.open}
                autoHideDuration={6000}
                onClose={() => setAlert({ ...alert, open: false })}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
            >
                <Alert
                    onClose={() => setAlert({ ...alert, open: false })}
                    severity={alert.severity}
                    variant="filled"
                >
                    {alert.message}
                </Alert>
            </Snackbar>
        </Box>
    );
};

export default EventManagement;