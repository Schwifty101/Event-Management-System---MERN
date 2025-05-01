import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    Box,
    Typography,
    Paper,
    Grid,
    Card,
    CardContent,
    CardHeader,
    Button,
    Chip,
    List,
    ListItem,
    ListItemText,
    ListItemIcon,
    CircularProgress,
    Alert,
    Tab,
    Tabs,
    Avatar,
    Stack
} from '@mui/material';
import {
    CalendarMonth as CalendarIcon,
    LocationOn as LocationIcon,
    Group as GroupIcon,
    Category as CategoryIcon,
    Money as MoneyIcon,
    Description as DescriptionIcon,
    Rule as RuleIcon,
    Person as PersonIcon,
    EventNote as EventNoteIcon,
    ArrowBack as ArrowBackIcon,
    Settings as SettingsIcon
} from '@mui/icons-material';
import { useAuth } from '../../context/AuthContext';
import axios from 'axios';
import { format } from 'date-fns';

const EventDetails = () => {
    const { eventId } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();
    const [event, setEvent] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [tabValue, setTabValue] = useState(0);
    const [rounds, setRounds] = useState([]);
    const [registrations, setRegistrations] = useState([]);

    // Fetch event details
    useEffect(() => {
        const fetchEventRounds = async () => {
            try {
                const response = await axios.get(`/api/rounds/event/${eventId}`, {
                    headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
                });
                setRounds(response.data.rounds || []);
            } catch (err) {
                console.error('Error fetching rounds:', err);
            }
        };

        const fetchRegistrations = async () => {
            try {
                const response = await axios.get(`/api/events/${eventId}/registrations`, {
                    headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
                });
                setRegistrations(response.data.registrations || []);
            } catch (err) {
                console.error('Error fetching registrations:', err);
            }
        };

        const isOrganizer = () => {
            return user && (user.role === 'admin' || (event && event.organizer_id === user.id));
        };

        const fetchEventDetails = async () => {
            try {
                setLoading(true);
                const response = await axios.get(`/api/events/${eventId}`, {
                    headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
                });
                setEvent(response.data.event);

                // After fetching the event, get related data
                fetchEventRounds();
                if (isOrganizer()) {
                    fetchRegistrations();
                }
            } catch (err) {
                console.error('Error fetching event:', err);
                setError('Failed to load event details. Please try again later.');
            } finally {
                setLoading(false);
            }
        };

        fetchEventDetails();
    }, [eventId, user, event]);

    // Check if current user is event organizer or admin
    const isOrganizer = () => {
        return user && (user.role === 'admin' || (event && event.organizer_id === user.id));
    };

    const handleTabChange = (event, newValue) => {
        setTabValue(newValue);
    };

    // Navigate back to events page
    const handleBack = () => {
        if (user?.role === 'admin' || user?.role === 'organizer') {
            navigate('/organizer/events');
        } else {
            navigate('/events');
        }
    };

    // Navigate to rounds management page
    const handleManageRounds = () => {
        navigate(`/events/${eventId}/rounds`);
    };

    // Navigate to edit event page
    const handleEditEvent = () => {
        navigate(`/events/${eventId}/edit`);
    };

    if (loading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
                <CircularProgress />
            </Box>
        );
    }

    if (error || !event) {
        return (
            <Box sx={{ p: 3 }}>
                <Alert severity="error">{error || 'Event not found'}</Alert>
                <Button
                    variant="outlined"
                    startIcon={<ArrowBackIcon />}
                    onClick={handleBack}
                    sx={{ mt: 2 }}
                >
                    Back to Events
                </Button>
            </Box>
        );
    }

    // Format dates for display
    const formatDate = (dateString) => {
        return format(new Date(dateString), 'PPP');
    };

    const formatDateTime = (dateString) => {
        return format(new Date(dateString), 'PPP p');
    };

    // Get round status chip
    const getRoundStatusChip = (status) => {
        let color = 'default';

        switch (status) {
            case 'upcoming':
                color = 'info';
                break;
            case 'ongoing':
                color = 'warning';
                break;
            case 'completed':
                color = 'success';
                break;
            case 'cancelled':
                color = 'error';
                break;
            default:
                color = 'default';
        }

        return <Chip size="small" label={status} color={color} />;
    };

    return (
        <Box sx={{ p: 3 }}>
            {/* Header with back button */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Button
                    variant="outlined"
                    startIcon={<ArrowBackIcon />}
                    onClick={handleBack}
                >
                    Back to Events
                </Button>

                {/* Admin/Organizer Actions */}
                {isOrganizer() && (
                    <Stack direction="row" spacing={2}>
                        <Button
                            variant="outlined"
                            startIcon={<SettingsIcon />}
                            onClick={handleEditEvent}
                        >
                            Edit Event
                        </Button>
                        <Button
                            variant="contained"
                            color="primary"
                            onClick={handleManageRounds}
                        >
                            Manage Rounds
                        </Button>
                    </Stack>
                )}
            </Box>

            {/* Event header */}
            <Paper sx={{ p: 3, mb: 3 }}>
                <Grid container spacing={2}>
                    <Grid item xs={12} md={8}>
                        <Typography variant="h4" component="h1" gutterBottom>
                            {event.title}
                        </Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1, flexWrap: 'wrap', gap: 2 }}>
                            <Chip
                                icon={<CategoryIcon />}
                                label={event.category}
                                color="primary"
                                variant="outlined"
                            />
                            <Chip
                                icon={<CalendarIcon />}
                                label={`${formatDate(event.start_date)} - ${formatDate(event.end_date)}`}
                                variant="outlined"
                            />
                            <Chip
                                icon={<GroupIcon />}
                                label={event.team_event ? 'Team Event' : 'Individual Event'}
                                variant="outlined"
                            />
                            {event.registration_fee > 0 && (
                                <Chip
                                    icon={<MoneyIcon />}
                                    label={`Fee: $${event.registration_fee}`}
                                    variant="outlined"
                                />
                            )}
                        </Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                            <LocationIcon sx={{ mr: 1, color: 'text.secondary' }} />
                            <Typography variant="body1" color="text.secondary">
                                {event.location}
                            </Typography>
                        </Box>
                    </Grid>
                    <Grid item xs={12} md={4}>
                        <Box sx={{ border: '1px solid #eee', borderRadius: 1, p: 2 }}>
                            <Typography variant="subtitle1" gutterBottom>
                                <strong>Organized by:</strong>
                            </Typography>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <Avatar>
                                    {event.organizer_name ? event.organizer_name.charAt(0) : '?'}
                                </Avatar>
                                <Box>
                                    <Typography variant="body1">
                                        {event.organizer_name || 'Event Organizer'}
                                    </Typography>
                                </Box>
                            </Box>
                        </Box>
                    </Grid>
                </Grid>
            </Paper>

            {/* Tabs for different event sections */}
            <Box sx={{ mb: 3 }}>
                <Paper sx={{ mb: 2 }}>
                    <Tabs
                        value={tabValue}
                        onChange={handleTabChange}
                        variant="fullWidth"
                        indicatorColor="primary"
                        textColor="primary"
                    >
                        <Tab label="Details" icon={<DescriptionIcon />} iconPosition="start" />
                        <Tab label="Rounds" icon={<EventNoteIcon />} iconPosition="start" />
                        {isOrganizer() && (
                            <Tab label="Registrations" icon={<GroupIcon />} iconPosition="start" />
                        )}
                    </Tabs>
                </Paper>

                {/* Details Tab */}
                {tabValue === 0 && (
                    <Grid container spacing={3}>
                        <Grid item xs={12} md={8}>
                            <Paper sx={{ p: 3 }}>
                                <Typography variant="h6" gutterBottom>
                                    About this Event
                                </Typography>
                                <Typography variant="body1" paragraph>
                                    {event.description}
                                </Typography>

                                {event.rules && (
                                    <>
                                        <Typography variant="h6" gutterBottom sx={{ mt: 4 }}>
                                            Rules & Guidelines
                                        </Typography>
                                        <Typography variant="body1" sx={{ whiteSpace: 'pre-line' }}>
                                            {event.rules}
                                        </Typography>
                                    </>
                                )}
                            </Paper>
                        </Grid>
                        <Grid item xs={12} md={4}>
                            <Paper sx={{ p: 3 }}>
                                <Typography variant="h6" gutterBottom>
                                    Event Details
                                </Typography>
                                <List dense>
                                    <ListItem>
                                        <ListItemIcon>
                                            <CalendarIcon />
                                        </ListItemIcon>
                                        <ListItemText
                                            primary="Start Date"
                                            secondary={formatDateTime(event.start_date)}
                                        />
                                    </ListItem>
                                    <ListItem>
                                        <ListItemIcon>
                                            <CalendarIcon />
                                        </ListItemIcon>
                                        <ListItemText
                                            primary="End Date"
                                            secondary={formatDateTime(event.end_date)}
                                        />
                                    </ListItem>
                                    <ListItem>
                                        <ListItemIcon>
                                            <LocationIcon />
                                        </ListItemIcon>
                                        <ListItemText
                                            primary="Location"
                                            secondary={event.location}
                                        />
                                    </ListItem>
                                    <ListItem>
                                        <ListItemIcon>
                                            <GroupIcon />
                                        </ListItemIcon>
                                        <ListItemText
                                            primary="Venue Capacity"
                                            secondary={event.capacity || 'Unlimited'}
                                        />
                                    </ListItem>
                                    <ListItem>
                                        <ListItemIcon>
                                            <PersonIcon />
                                        </ListItemIcon>
                                        <ListItemText
                                            primary="Max Participants"
                                            secondary={event.max_participants || 'Unlimited'}
                                        />
                                    </ListItem>
                                    {event.team_event && (
                                        <ListItem>
                                            <ListItemIcon>
                                                <GroupIcon />
                                            </ListItemIcon>
                                            <ListItemText
                                                primary="Team Size"
                                                secondary={`${event.min_team_size} - ${event.max_team_size} members`}
                                            />
                                        </ListItem>
                                    )}
                                    <ListItem>
                                        <ListItemIcon>
                                            <MoneyIcon />
                                        </ListItemIcon>
                                        <ListItemText
                                            primary="Registration Fee"
                                            secondary={event.registration_fee ? `$${event.registration_fee}` : 'Free'}
                                        />
                                    </ListItem>
                                </List>

                                {/* Registration Button */}
                                {user?.role === 'participant' && (
                                    <Box sx={{ mt: 2 }}>
                                        <Button
                                            variant="contained"
                                            color="primary"
                                            fullWidth
                                        >
                                            Register for this Event
                                        </Button>
                                    </Box>
                                )}
                            </Paper>
                        </Grid>
                    </Grid>
                )}

                {/* Rounds Tab */}
                {tabValue === 1 && (
                    <Paper sx={{ p: 3 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                            <Typography variant="h6">
                                Event Rounds
                            </Typography>

                            {isOrganizer() && (
                                <Button
                                    variant="outlined"
                                    color="primary"
                                    onClick={handleManageRounds}
                                >
                                    Manage Rounds
                                </Button>
                            )}
                        </Box>

                        {rounds.length === 0 ? (
                            <Typography color="text.secondary">
                                No rounds have been scheduled for this event yet.
                            </Typography>
                        ) : (
                            <Grid container spacing={2}>
                                {rounds.map((round) => (
                                    <Grid item key={round.id} xs={12} md={6} lg={4}>
                                        <Card>
                                            <CardHeader
                                                title={round.name}
                                                subheader={round.round_type.charAt(0).toUpperCase() + round.round_type.slice(1)}
                                                action={getRoundStatusChip(round.status)}
                                            />
                                            <CardContent>
                                                {round.description && (
                                                    <Typography variant="body2" color="text.secondary" paragraph>
                                                        {round.description}
                                                    </Typography>
                                                )}
                                                <List dense>
                                                    <ListItem>
                                                        <ListItemIcon>
                                                            <CalendarIcon fontSize="small" />
                                                        </ListItemIcon>
                                                        <ListItemText
                                                            primary={formatDateTime(round.start_time)}
                                                        />
                                                    </ListItem>
                                                    <ListItem>
                                                        <ListItemIcon>
                                                            <LocationIcon fontSize="small" />
                                                        </ListItemIcon>
                                                        <ListItemText
                                                            primary={round.location}
                                                        />
                                                    </ListItem>
                                                    <ListItem>
                                                        <ListItemIcon>
                                                            <GroupIcon fontSize="small" />
                                                        </ListItemIcon>
                                                        <ListItemText
                                                            primary={`${round.participant_count || 0} participants`}
                                                        />
                                                    </ListItem>
                                                </List>
                                            </CardContent>
                                        </Card>
                                    </Grid>
                                ))}
                            </Grid>
                        )}
                    </Paper>
                )}

                {/* Registrations Tab (for organizers only) */}
                {tabValue === 2 && isOrganizer() && (
                    <Paper sx={{ p: 3 }}>
                        <Typography variant="h6" gutterBottom>
                            Registered Participants
                        </Typography>

                        {registrations.length === 0 ? (
                            <Typography color="text.secondary">
                                No one has registered for this event yet.
                            </Typography>
                        ) : (
                            <List>
                                {registrations.map((reg) => (
                                    <ListItem key={reg.id} divider>
                                        <ListItemIcon>
                                            {reg.team_id ? (
                                                <GroupIcon />
                                            ) : (
                                                <PersonIcon />
                                            )}
                                        </ListItemIcon>
                                        <ListItemText
                                            primary={reg.team_name || reg.name}
                                            secondary={
                                                <>
                                                    {reg.team_id ? 'Team Registration' : 'Individual Registration'} •
                                                    {' ' + format(new Date(reg.registration_date), 'PPp')}
                                                </>
                                            }
                                        />
                                        <Chip
                                            label={reg.payment_status}
                                            color={reg.payment_status === 'completed' ? 'success' : 'warning'}
                                            size="small"
                                        />
                                    </ListItem>
                                ))}
                            </List>
                        )}
                    </Paper>
                )}
            </Box>
        </Box>
    );
};

export default EventDetails;