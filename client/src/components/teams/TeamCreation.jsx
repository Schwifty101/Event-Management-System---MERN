import React, { useState, useEffect } from 'react';
import {
    Box,
    Typography,
    Paper,
    TextField,
    Button,
    CircularProgress,
    Alert,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Card,
    CardContent,
    Grid,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { eventService, teamService } from '../../services/api';

const TeamCreation = () => {
    const { user } = useAuth();
    const navigate = useNavigate();

    const [teamName, setTeamName] = useState('');
    const [eventId, setEventId] = useState('');
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(false);
    const [fetchingEvents, setFetchingEvents] = useState(true);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);

    // Fetch team events for dropdown
    useEffect(() => {
        const fetchTeamEvents = async () => {
            try {
                setFetchingEvents(true);
                console.log('Fetching team events...');

                // First, fetch ALL events to see if any team events exist
                const allEventsResponse = await eventService.getAll();
                console.log('All events response:', allEventsResponse.data);

                // Check if any team events exist in the database at all
                // MySQL returns 1 for boolean true, so we need to check for both true and 1
                const teamEventsExist = allEventsResponse.data.events.some(event =>
                    event.team_event === true || event.team_event === 1
                );
                console.log('Team events exist in database:', teamEventsExist);

                if (!teamEventsExist) {
                    console.warn('No team events found in the database. Please create at least one team event.');
                }

                // Now try to fetch team events specifically
                const response = await eventService.getAll({ team_event: 'true' });
                console.log('Team events filtered response:', response.data);

                if (response.data && response.data.events) {
                    // Double check with client-side filtering as backup
                    // MySQL returns 1 for boolean true, so we need to check for both true and 1
                    const teamEvents = response.data.events.filter(event =>
                        event.team_event === true || event.team_event === 1
                    );
                    console.log('Client-filtered team events:', teamEvents);

                    setEvents(teamEvents);

                    if (teamEvents.length === 0) {
                        console.warn('No team events available for team creation');
                    }
                } else {
                    setEvents([]);
                    console.error('No events returned from API or invalid response structure');
                }
            } catch (error) {
                console.error('Error fetching team events:', error);
                setError('Failed to load team events. Please try again later.');
            } finally {
                setFetchingEvents(false);
            }
        };

        fetchTeamEvents();
    }, []); // No dependencies needed as this should only run on mount

    const handleSubmit = async (e) => {
        e.preventDefault();

        // Validation
        if (!teamName.trim()) {
            setError('Please enter a team name');
            return;
        }

        if (!eventId) {
            setError('Please select an event');
            return;
        }

        setLoading(true);
        setError('');

        try {
            const result = await teamService.create({
                name: teamName,
                event_id: eventId
            });

            setSuccess(true);

            // Redirect after a short delay
            setTimeout(() => {
                navigate(`/teams/${result.data.team.id}`);
            }, 1500);

        } catch (error) {
            console.error('Error creating team:', error);
            setError(error.response?.data?.message || 'Failed to create team. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Box sx={{ p: 3 }}>
            <Typography variant="h4" gutterBottom>
                Create a Team
            </Typography>

            <Grid container spacing={3}>
                <Grid item xs={12} md={8}>
                    <Paper sx={{ p: 3, mb: 3 }}>
                        {success ? (
                            <Alert severity="success" sx={{ mb: 2 }}>
                                Team created successfully! Redirecting...
                            </Alert>
                        ) : error ? (
                            <Alert severity="error" sx={{ mb: 2 }}>
                                {error}
                            </Alert>
                        ) : null}

                        <form onSubmit={handleSubmit}>
                            <TextField
                                label="Team Name"
                                fullWidth
                                margin="normal"
                                value={teamName}
                                onChange={(e) => setTeamName(e.target.value)}
                                required
                                disabled={loading}
                            />

                            <FormControl fullWidth margin="normal">
                                <InputLabel id="event-select-label">Select Event</InputLabel>
                                <Select
                                    labelId="event-select-label"
                                    value={eventId}
                                    label="Select Event"
                                    onChange={(e) => setEventId(e.target.value)}
                                    disabled={loading || fetchingEvents}
                                    required
                                >
                                    {fetchingEvents ? (
                                        <MenuItem value="">
                                            <CircularProgress size={20} sx={{ mr: 1 }} /> Loading events...
                                        </MenuItem>
                                    ) : events.length === 0 ? (
                                        <MenuItem value="" disabled>
                                            No team events available
                                        </MenuItem>
                                    ) : (
                                        events.map((event) => (
                                            <MenuItem key={event.id} value={event.id}>
                                                {event.title}
                                            </MenuItem>
                                        ))
                                    )}
                                </Select>
                                {events.length === 0 && !fetchingEvents && (
                                    <Box sx={{ mt: 1 }}>
                                        <Alert severity="info" sx={{ mb: 1 }}>
                                            You need a team event before you can create a team.
                                        </Alert>
                                        {user.role === 'admin' || user.role === 'organizer' ? (
                                            <Button
                                                variant="outlined"
                                                size="small"
                                                onClick={() => {
                                                    // Log authentication info for debugging
                                                    console.log('Current user role:', user.role);
                                                    console.log('Token exists:', !!localStorage.getItem('token'));
                                                    navigate('/events/create-team-event');
                                                }}
                                                fullWidth
                                            >
                                                Create a team event
                                            </Button>
                                        ) : (
                                            <Typography variant="caption" color="text.secondary">
                                                Please contact an event organizer to create a team event.
                                            </Typography>
                                        )}
                                    </Box>
                                )}
                            </FormControl>

                            <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
                                <Button
                                    variant="outlined"
                                    sx={{ mr: 1 }}
                                    onClick={() => navigate('/teams')}
                                    disabled={loading}
                                >
                                    Cancel
                                </Button>
                                <Button
                                    type="submit"
                                    variant="contained"
                                    disabled={loading || fetchingEvents}
                                    startIcon={loading && <CircularProgress size={20} color="inherit" />}
                                >
                                    {loading ? 'Creating...' : 'Create Team'}
                                </Button>
                            </Box>
                        </form>
                    </Paper>
                </Grid>

                <Grid item xs={12} md={4}>
                    <Card>
                        <CardContent>
                            <Typography variant="h6" gutterBottom>
                                About Team Creation
                            </Typography>
                            <Typography variant="body2" paragraph>
                                Creating a team allows you to participate in team-based events with your colleagues or friends.
                            </Typography>
                            <Typography variant="body2" paragraph>
                                You'll be automatically assigned as the team leader, which gives you the ability to:
                            </Typography>
                            <ul>
                                <li>
                                    <Typography variant="body2">
                                        Invite others to join your team
                                    </Typography>
                                </li>
                                <li>
                                    <Typography variant="body2">
                                        Remove team members
                                    </Typography>
                                </li>
                                <li>
                                    <Typography variant="body2">
                                        Transfer leadership to another member
                                    </Typography>
                                </li>
                                <li>
                                    <Typography variant="body2">
                                        Register your team for event rounds
                                    </Typography>
                                </li>
                            </ul>
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>
        </Box>
    );
};

export default TeamCreation;