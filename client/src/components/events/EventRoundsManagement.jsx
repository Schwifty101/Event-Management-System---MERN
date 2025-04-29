import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import {
    Box,
    Typography,
    Paper,
    Button,
    Grid,
    Card,
    CardContent,
    CardActions,
    TextField,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Snackbar,
    Alert,
    IconButton,
    CircularProgress,
    Divider,
    Chip,
    Tooltip,
    List,
    ListItem,
    ListItemText,
    ListItemSecondaryAction
} from '@mui/material';
import {
    Add as AddIcon,
    Delete as DeleteIcon,
    Edit as EditIcon,
    People as PeopleIcon,
    Assignment as AssignmentIcon,
    EmojiEvents as TrophyIcon,
} from '@mui/icons-material';
import { useAuth } from '../../context/AuthContext';
import axios from 'axios';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import { LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import JudgingPanel from './JudgingPanel';

const EventRoundsManagement = () => {
    const { eventId } = useParams();
    const { user } = useAuth();
    const [loading, setLoading] = useState(true);
    const [event, setEvent] = useState(null);
    const [rounds, setRounds] = useState([]);
    const [roundDialogOpen, setRoundDialogOpen] = useState(false);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [judgeDialogOpen, setJudgeDialogOpen] = useState(false);
    const [participantsDialogOpen, setParticipantsDialogOpen] = useState(false);
    const [winnerDialogOpen, setWinnerDialogOpen] = useState(false);
    const [selectedRound, setSelectedRound] = useState(null);
    const [currentRound, setCurrentRound] = useState({
        name: '',
        description: '',
        round_type: 'preliminary',
        start_time: new Date(),
        end_time: new Date(new Date().getTime() + 3 * 60 * 60 * 1000), // 3 hours later
        location: '',
        max_participants: 0,
        status: 'upcoming'
    });
    const [dialogMode, setDialogMode] = useState('add');
    const [alert, setAlert] = useState({
        open: false,
        message: '',
        severity: 'success'
    });
    const [judges, setJudges] = useState([]);
    const [selectedJudge, setSelectedJudge] = useState('');
    const [participants, setParticipants] = useState([]);
    const [roundJudges, setRoundJudges] = useState([]);
    const [winners, setWinners] = useState([]);
    const [selectedWinners, setSelectedWinners] = useState([]);
    const [nextRound, setNextRound] = useState('');
    const [availableNextRounds, setAvailableNextRounds] = useState([]);

    useEffect(() => {
        fetchEventDetails();
        fetchRounds();
        fetchJudges();
    }, [eventId]);

    const fetchEventDetails = async () => {
        try {
            setLoading(true);
            const response = await axios.get(`/api/events/${eventId}`, {
                headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
            });

            setEvent(response.data.event);
        } catch (error) {
            console.error('Error fetching event details:', error);
            setAlert({
                open: true,
                message: 'Failed to load event details',
                severity: 'error'
            });
        }
    };

    const fetchRounds = async () => {
        try {
            setLoading(true);
            const response = await axios.get(`/api/rounds/event/${eventId}`, {
                headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
            });

            setRounds(response.data.rounds || []);
            setLoading(false);
        } catch (error) {
            console.error('Error fetching rounds:', error);
            setAlert({
                open: true,
                message: 'Failed to load rounds',
                severity: 'error'
            });
            setLoading(false);
        }
    };

    const fetchJudges = async () => {
        try {
            const response = await axios.get('/api/users?role=judge', {
                headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
            });

            setJudges(response.data.users || []);
        } catch (error) {
            console.error('Error fetching judges:', error);
        }
    };

    const fetchRoundJudges = async (roundId) => {
        try {
            const response = await axios.get(`/api/judges/rounds/${roundId}`, {
                headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
            });

            setRoundJudges(response.data.assignments || []);
        } catch (error) {
            console.error('Error fetching round judges:', error);
        }
    };

    const fetchRoundParticipants = async (roundId) => {
        try {
            const response = await axios.get(`/api/rounds/${roundId}/participants`, {
                headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
            });

            setParticipants(response.data.participants || []);
        } catch (error) {
            console.error('Error fetching round participants:', error);
        }
    };

    const handleAddRound = () => {
        setCurrentRound({
            name: '',
            description: '',
            round_type: 'preliminary',
            start_time: new Date(),
            end_time: new Date(new Date().getTime() + 3 * 60 * 60 * 1000), // 3 hours later
            location: event?.location || '',
            max_participants: 0,
            status: 'upcoming'
        });
        setDialogMode('add');
        setRoundDialogOpen(true);
    };

    const handleEditRound = (round) => {
        setCurrentRound({
            id: round.id,
            name: round.name,
            description: round.description || '',
            round_type: round.round_type,
            start_time: new Date(round.start_time),
            end_time: new Date(round.end_time),
            location: round.location,
            max_participants: round.max_participants || 0,
            status: round.status
        });
        setDialogMode('edit');
        setRoundDialogOpen(true);
    };

    const handleDeleteRound = (round) => {
        setSelectedRound(round);
        setDeleteDialogOpen(true);
    };

    const handleJudgeAssignment = (round) => {
        setSelectedRound(round);
        fetchRoundJudges(round.id);
        setJudgeDialogOpen(true);
    };

    const handleParticipants = (round) => {
        setSelectedRound(round);
        fetchRoundParticipants(round.id);
        setParticipantsDialogOpen(true);
    };

    const handleDeclareWinners = (round) => {
        setSelectedRound(round);
        fetchRoundParticipants(round.id);

        // Get available next rounds (rounds of this event with later dates)
        const laterRounds = rounds.filter(r =>
            r.id !== round.id &&
            new Date(r.start_time) > new Date(round.end_time)
        );

        setAvailableNextRounds(laterRounds);
        setSelectedWinners([]);
        setNextRound('');
        setWinnerDialogOpen(true);
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setCurrentRound({
            ...currentRound,
            [name]: value
        });
    };

    const handleDateChange = (name, value) => {
        setCurrentRound({
            ...currentRound,
            [name]: value
        });
    };

    const handleSubmitRound = async () => {
        try {
            // Form validation
            if (!currentRound.name || !currentRound.location) {
                setAlert({
                    open: true,
                    message: 'Please fill in all required fields',
                    severity: 'error'
                });
                return;
            }

            // Format data for API
            const roundData = {
                ...currentRound,
                event_id: eventId,
                start_time: currentRound.start_time.toISOString(),
                end_time: currentRound.end_time.toISOString()
            };

            let response;
            if (dialogMode === 'add') {
                response = await axios.post('/api/rounds', roundData, {
                    headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
                });
                setAlert({
                    open: true,
                    message: 'Round created successfully',
                    severity: 'success'
                });
            } else {
                response = await axios.put(`/api/rounds/${currentRound.id}`, roundData, {
                    headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
                });
                setAlert({
                    open: true,
                    message: 'Round updated successfully',
                    severity: 'success'
                });
            }

            // Close dialog and refresh rounds
            setRoundDialogOpen(false);
            fetchRounds();
        } catch (error) {
            console.error('Error submitting round:', error);
            setAlert({
                open: true,
                message: error.response?.data?.message || 'Failed to save round',
                severity: 'error'
            });
        }
    };

    const handleConfirmDelete = async () => {
        try {
            await axios.delete(`/api/rounds/${selectedRound.id}`, {
                headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
            });

            setAlert({
                open: true,
                message: 'Round deleted successfully',
                severity: 'success'
            });

            setDeleteDialogOpen(false);
            fetchRounds();
        } catch (error) {
            console.error('Error deleting round:', error);
            setAlert({
                open: true,
                message: 'Failed to delete round',
                severity: 'error'
            });
        }
    };

    const handleAssignJudge = async () => {
        try {
            if (!selectedJudge) {
                setAlert({
                    open: true,
                    message: 'Please select a judge',
                    severity: 'error'
                });
                return;
            }

            await axios.post('/api/judges/assign', {
                event_id: eventId,
                round_id: selectedRound.id,
                judge_id: selectedJudge
            }, {
                headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
            });

            setAlert({
                open: true,
                message: 'Judge assigned successfully',
                severity: 'success'
            });

            // Refresh judges list for this round
            fetchRoundJudges(selectedRound.id);
            setSelectedJudge('');
        } catch (error) {
            console.error('Error assigning judge:', error);
            setAlert({
                open: true,
                message: error.response?.data?.message || 'Failed to assign judge',
                severity: 'error'
            });
        }
    };

    const handleRemoveJudge = async (assignmentId) => {
        try {
            await axios.delete(`/api/judges/assignments/${assignmentId}`, {
                headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
            });

            setAlert({
                open: true,
                message: 'Judge removed successfully',
                severity: 'success'
            });

            // Refresh judges list for this round
            fetchRoundJudges(selectedRound.id);
        } catch (error) {
            console.error('Error removing judge:', error);
            setAlert({
                open: true,
                message: 'Failed to remove judge',
                severity: 'error'
            });
        }
    };

    const handleDeclareWinnersSubmit = async () => {
        try {
            if (selectedWinners.length === 0) {
                setAlert({
                    open: true,
                    message: 'Please select at least one winner',
                    severity: 'error'
                });
                return;
            }

            const payload = {
                winnerIds: selectedWinners,
                nextRoundId: nextRound || undefined
            };

            await axios.post(`/api/judges/rounds/${selectedRound.id}/declare-winners`, payload, {
                headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
            });

            setAlert({
                open: true,
                message: 'Winners declared successfully',
                severity: 'success'
            });

            setWinnerDialogOpen(false);
        } catch (error) {
            console.error('Error declaring winners:', error);
            setAlert({
                open: true,
                message: error.response?.data?.message || 'Failed to declare winners',
                severity: 'error'
            });
        }
    };

    const handleToggleWinner = (participantId) => {
        setSelectedWinners(prev => {
            if (prev.includes(participantId)) {
                return prev.filter(id => id !== participantId);
            } else {
                return [...prev, participantId];
            }
        });
    };

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

    const getRoundTypeName = (type) => {
        switch (type) {
            case 'preliminary': return 'Preliminary Round';
            case 'semifinal': return 'Semi-Final';
            case 'final': return 'Final Round';
            case 'other': return 'Special Round';
            default: return type;
        }
    };

    // Main component rendering
    if (loading && !event) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 5 }}>
                <CircularProgress />
            </Box>
        );
    }

    return (
        <Box sx={{ p: 3 }}>
            <Box sx={{ mb: 3 }}>
                <Typography variant="h4" component="h1">
                    {event?.title} - Rounds Management
                </Typography>
                <Typography variant="subtitle1" color="textSecondary">
                    Manage rounds, judges, and participants
                </Typography>
            </Box>

            <Box sx={{ mb: 3, display: 'flex', justifyContent: 'flex-end' }}>
                <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={handleAddRound}
                >
                    Add Round
                </Button>
            </Box>

            {loading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', p: 5 }}>
                    <CircularProgress />
                </Box>
            ) : (
                <Grid container spacing={3}>
                    {rounds.length === 0 ? (
                        <Grid item xs={12}>
                            <Paper sx={{ p: 4, textAlign: 'center' }}>
                                <Typography variant="h6" color="textSecondary">
                                    No rounds created yet
                                </Typography>
                                <Typography variant="body2" color="textSecondary" sx={{ mt: 1, mb: 2 }}>
                                    Create rounds to organize your event schedule
                                </Typography>
                                <Button
                                    variant="contained"
                                    startIcon={<AddIcon />}
                                    onClick={handleAddRound}
                                >
                                    Add First Round
                                </Button>
                            </Paper>
                        </Grid>
                    ) : (
                        rounds.map((round) => (
                            <Grid item xs={12} md={6} key={round.id}>
                                <Card>
                                    <CardContent>
                                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                                            <Typography variant="h5" component="h2">
                                                {round.name}
                                            </Typography>
                                            {getRoundStatusChip(round.status)}
                                        </Box>

                                        <Typography variant="subtitle1" color="primary" gutterBottom>
                                            {getRoundTypeName(round.round_type)}
                                        </Typography>

                                        {round.description && (
                                            <Typography variant="body2" paragraph>
                                                {round.description}
                                            </Typography>
                                        )}

                                        <Grid container spacing={2}>
                                            <Grid item xs={12} sm={6}>
                                                <Typography variant="body2">
                                                    <strong>Location:</strong> {round.location}
                                                </Typography>
                                            </Grid>
                                            <Grid item xs={12} sm={6}>
                                                <Typography variant="body2">
                                                    <strong>Capacity:</strong> {round.max_participants || 'Unlimited'}
                                                </Typography>
                                            </Grid>
                                            <Grid item xs={12} sm={6}>
                                                <Typography variant="body2">
                                                    <strong>Start:</strong> {new Date(round.start_time).toLocaleString()}
                                                </Typography>
                                            </Grid>
                                            <Grid item xs={12} sm={6}>
                                                <Typography variant="body2">
                                                    <strong>End:</strong> {new Date(round.end_time).toLocaleString()}
                                                </Typography>
                                            </Grid>
                                        </Grid>
                                    </CardContent>
                                    <Divider />
                                    <CardActions>
                                        <Button
                                            size="small"
                                            startIcon={<PeopleIcon />}
                                            onClick={() => handleParticipants(round)}
                                        >
                                            Participants
                                        </Button>
                                        <Button
                                            size="small"
                                            startIcon={<AssignmentIcon />}
                                            onClick={() => handleJudgeAssignment(round)}
                                        >
                                            Judges
                                        </Button>
                                        {round.status !== 'cancelled' && (
                                            <Button
                                                size="small"
                                                color="primary"
                                                startIcon={<TrophyIcon />}
                                                onClick={() => handleDeclareWinners(round)}
                                            >
                                                Winners
                                            </Button>
                                        )}
                                        <Box sx={{ flexGrow: 1 }} />
                                        <IconButton size="small" onClick={() => handleEditRound(round)}>
                                            <EditIcon fontSize="small" />
                                        </IconButton>
                                        <IconButton size="small" color="error" onClick={() => handleDeleteRound(round)}>
                                            <DeleteIcon fontSize="small" />
                                        </IconButton>
                                    </CardActions>
                                </Card>
                            </Grid>
                        ))
                    )}
                </Grid>
            )}

            {/* Round Form Dialog */}
            <LocalizationProvider dateAdapter={AdapterDateFns}>
                <Dialog
                    open={roundDialogOpen}
                    onClose={() => setRoundDialogOpen(false)}
                    maxWidth="md"
                    fullWidth
                >
                    <DialogTitle>
                        {dialogMode === 'add' ? 'Create New Round' : 'Edit Round'}
                    </DialogTitle>
                    <DialogContent>
                        <Grid container spacing={2} sx={{ mt: 1 }}>
                            <Grid item xs={12}>
                                <TextField
                                    name="name"
                                    label="Round Name"
                                    fullWidth
                                    value={currentRound.name}
                                    onChange={handleInputChange}
                                    required
                                />
                            </Grid>
                            <Grid item xs={12}>
                                <TextField
                                    name="description"
                                    label="Description"
                                    fullWidth
                                    multiline
                                    rows={2}
                                    value={currentRound.description}
                                    onChange={handleInputChange}
                                />
                            </Grid>
                            <Grid item xs={12} md={6}>
                                <FormControl fullWidth required>
                                    <InputLabel>Round Type</InputLabel>
                                    <Select
                                        name="round_type"
                                        value={currentRound.round_type}
                                        onChange={handleInputChange}
                                        label="Round Type"
                                    >
                                        <MenuItem value="preliminary">Preliminary</MenuItem>
                                        <MenuItem value="semifinal">Semi-Final</MenuItem>
                                        <MenuItem value="final">Final</MenuItem>
                                        <MenuItem value="other">Other</MenuItem>
                                    </Select>
                                </FormControl>
                            </Grid>
                            <Grid item xs={12} md={6}>
                                <FormControl fullWidth required>
                                    <InputLabel>Status</InputLabel>
                                    <Select
                                        name="status"
                                        value={currentRound.status}
                                        onChange={handleInputChange}
                                        label="Status"
                                    >
                                        <MenuItem value="upcoming">Upcoming</MenuItem>
                                        <MenuItem value="ongoing">Ongoing</MenuItem>
                                        <MenuItem value="completed">Completed</MenuItem>
                                        <MenuItem value="cancelled">Cancelled</MenuItem>
                                    </Select>
                                </FormControl>
                            </Grid>
                            <Grid item xs={12} md={6}>
                                <DateTimePicker
                                    label="Start Time"
                                    value={currentRound.start_time}
                                    onChange={(newValue) => handleDateChange('start_time', newValue)}
                                    renderInput={(params) => <TextField {...params} fullWidth required />}
                                />
                            </Grid>
                            <Grid item xs={12} md={6}>
                                <DateTimePicker
                                    label="End Time"
                                    value={currentRound.end_time}
                                    onChange={(newValue) => handleDateChange('end_time', newValue)}
                                    renderInput={(params) => <TextField {...params} fullWidth required />}
                                />
                            </Grid>
                            <Grid item xs={12} md={6}>
                                <TextField
                                    name="location"
                                    label="Location"
                                    fullWidth
                                    value={currentRound.location}
                                    onChange={handleInputChange}
                                    required
                                />
                            </Grid>
                            <Grid item xs={12} md={6}>
                                <TextField
                                    name="max_participants"
                                    label="Maximum Participants"
                                    type="number"
                                    fullWidth
                                    value={currentRound.max_participants}
                                    onChange={handleInputChange}
                                    helperText="Leave as 0 for unlimited"
                                />
                            </Grid>
                        </Grid>
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={() => setRoundDialogOpen(false)}>Cancel</Button>
                        <Button onClick={handleSubmitRound} variant="contained" color="primary">
                            {dialogMode === 'add' ? 'Create Round' : 'Save Changes'}
                        </Button>
                    </DialogActions>
                </Dialog>
            </LocalizationProvider>

            {/* Delete Confirmation Dialog */}
            <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
                <DialogTitle>Confirm Delete</DialogTitle>
                <DialogContent>
                    <Typography>
                        Are you sure you want to delete the round "{selectedRound?.name}"? This action cannot be undone.
                    </Typography>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
                    <Button onClick={handleConfirmDelete} variant="contained" color="error">
                        Delete
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Judge Assignment Dialog */}
            <Dialog
                open={judgeDialogOpen}
                onClose={() => setJudgeDialogOpen(false)}
                maxWidth="sm"
                fullWidth
            >
                <DialogTitle>Manage Judges - {selectedRound?.name}</DialogTitle>
                <DialogContent>
                    <Box sx={{ mb: 3, mt: 1 }}>
                        <Typography variant="subtitle2" gutterBottom>
                            Assign New Judge
                        </Typography>
                        <Grid container spacing={2}>
                            <Grid item xs={8}>
                                <FormControl fullWidth>
                                    <InputLabel>Select Judge</InputLabel>
                                    <Select
                                        value={selectedJudge}
                                        onChange={(e) => setSelectedJudge(e.target.value)}
                                        label="Select Judge"
                                    >
                                        {judges.map(judge => (
                                            <MenuItem key={judge.id} value={judge.id}>
                                                {judge.name}
                                            </MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>
                            </Grid>
                            <Grid item xs={4}>
                                <Button
                                    variant="contained"
                                    onClick={handleAssignJudge}
                                    fullWidth
                                    sx={{ height: '100%' }}
                                >
                                    Assign
                                </Button>
                            </Grid>
                        </Grid>
                    </Box>

                    <Divider sx={{ my: 2 }} />

                    <Typography variant="subtitle2" gutterBottom>
                        Current Judges
                    </Typography>

                    {roundJudges.length === 0 ? (
                        <Typography variant="body2" color="textSecondary" align="center">
                            No judges assigned to this round yet
                        </Typography>
                    ) : (
                        <List>
                            {roundJudges.map(assignment => (
                                <ListItem key={assignment.id} divider>
                                    <ListItemText
                                        primary={assignment.judge_name}
                                        secondary={`Assignment Status: ${assignment.status || 'Pending'}`}
                                    />
                                    <ListItemSecondaryAction>
                                        <IconButton
                                            edge="end"
                                            size="small"
                                            color="error"
                                            onClick={() => handleRemoveJudge(assignment.id)}
                                        >
                                            <DeleteIcon />
                                        </IconButton>
                                    </ListItemSecondaryAction>
                                </ListItem>
                            ))}
                        </List>
                    )}
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setJudgeDialogOpen(false)}>Close</Button>
                </DialogActions>
            </Dialog>

            {/* Participants Dialog */}
            <Dialog
                open={participantsDialogOpen}
                onClose={() => setParticipantsDialogOpen(false)}
                maxWidth="md"
                fullWidth
            >
                <DialogTitle>Participants - {selectedRound?.name}</DialogTitle>
                <DialogContent>
                    {participants.length === 0 ? (
                        <Typography variant="body2" color="textSecondary" align="center" sx={{ my: 3 }}>
                            No participants registered for this round yet
                        </Typography>
                    ) : (
                        <Box sx={{ mt: 2 }}>
                            <Grid container spacing={1}>
                                <Grid item xs={4}><Typography variant="subtitle2">Participant</Typography></Grid>
                                <Grid item xs={2}><Typography variant="subtitle2">Type</Typography></Grid>
                                <Grid item xs={2}><Typography variant="subtitle2">Status</Typography></Grid>
                                <Grid item xs={2}><Typography variant="subtitle2">Score</Typography></Grid>
                                <Grid item xs={2}><Typography variant="subtitle2">Actions</Typography></Grid>
                            </Grid>
                            <Divider sx={{ my: 1 }} />

                            {participants.map(participant => (
                                <Grid container spacing={1} key={participant.id} sx={{ py: 1 }}>
                                    <Grid item xs={4}>
                                        <Typography>
                                            {participant.team_name || participant.participant_name || 'Unknown'}
                                        </Typography>
                                    </Grid>
                                    <Grid item xs={2}>
                                        <Chip
                                            size="small"
                                            label={participant.team_id ? 'Team' : 'Individual'}
                                            color={participant.team_id ? 'primary' : 'secondary'}
                                        />
                                    </Grid>
                                    <Grid item xs={2}>
                                        <Chip
                                            size="small"
                                            label={participant.status}
                                            color={
                                                participant.status === 'advanced' ? 'success' :
                                                    participant.status === 'eliminated' ? 'error' :
                                                        participant.status === 'checked_in' ? 'info' :
                                                            'default'
                                            }
                                        />
                                    </Grid>
                                    <Grid item xs={2}>
                                        <Typography>
                                            {participant.score !== null ? participant.score : 'N/A'}
                                        </Typography>
                                    </Grid>
                                    <Grid item xs={2}>
                                        <Button size="small" variant="outlined">
                                            View Detail
                                        </Button>
                                    </Grid>
                                </Grid>
                            ))}
                        </Box>
                    )}
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setParticipantsDialogOpen(false)}>Close</Button>
                </DialogActions>
            </Dialog>

            {/* Declare Winners Dialog */}
            <Dialog
                open={winnerDialogOpen}
                onClose={() => setWinnerDialogOpen(false)}
                maxWidth="md"
                fullWidth
            >
                <DialogTitle>Declare Winners - {selectedRound?.name}</DialogTitle>
                <DialogContent>
                    {participants.length === 0 ? (
                        <Typography variant="body2" color="textSecondary" align="center" sx={{ my: 3 }}>
                            No participants available to select as winners
                        </Typography>
                    ) : (
                        <>
                            <Typography variant="body2" color="textSecondary" sx={{ mt: 1, mb: 2 }}>
                                Select participants to declare as winners. Winners can be advanced to the next round.
                            </Typography>

                            <Box sx={{ mb: 3 }}>
                                <Grid container spacing={1}>
                                    <Grid item xs={1}><Typography variant="subtitle2">Select</Typography></Grid>
                                    <Grid item xs={4}><Typography variant="subtitle2">Participant</Typography></Grid>
                                    <Grid item xs={2}><Typography variant="subtitle2">Type</Typography></Grid>
                                    <Grid item xs={2}><Typography variant="subtitle2">Status</Typography></Grid>
                                    <Grid item xs={3}><Typography variant="subtitle2">Score</Typography></Grid>
                                </Grid>
                                <Divider sx={{ my: 1 }} />

                                {participants
                                    .sort((a, b) => (b.score || 0) - (a.score || 0)) // Sort by score descending
                                    .map(participant => {
                                        const participantId = participant.team_id || participant.user_id;
                                        return (
                                            <Grid
                                                container
                                                spacing={1}
                                                key={participant.id}
                                                sx={{
                                                    py: 1,
                                                    bgcolor: selectedWinners.includes(participantId) ? 'rgba(76, 175, 80, 0.1)' : 'transparent',
                                                    '&:hover': { bgcolor: 'rgba(0, 0, 0, 0.04)' }
                                                }}
                                                onClick={() => handleToggleWinner(participantId)}
                                            >
                                                <Grid item xs={1}>
                                                    <Checkbox
                                                        checked={selectedWinners.includes(participantId)}
                                                        onChange={() => handleToggleWinner(participantId)}
                                                    />
                                                </Grid>
                                                <Grid item xs={4}>
                                                    <Typography>
                                                        {participant.team_name || participant.participant_name || 'Unknown'}
                                                    </Typography>
                                                </Grid>
                                                <Grid item xs={2}>
                                                    <Chip
                                                        size="small"
                                                        label={participant.team_id ? 'Team' : 'Individual'}
                                                        color={participant.team_id ? 'primary' : 'secondary'}
                                                    />
                                                </Grid>
                                                <Grid item xs={2}>
                                                    <Chip size="small" label={participant.status} />
                                                </Grid>
                                                <Grid item xs={3}>
                                                    <Typography fontWeight="bold">
                                                        {participant.score !== null ? participant.score : 'N/A'}
                                                    </Typography>
                                                </Grid>
                                            </Grid>
                                        );
                                    })}
                            </Box>

                            {availableNextRounds.length > 0 && (
                                <Box sx={{ mt: 3 }}>
                                    <Typography variant="subtitle2" gutterBottom>
                                        Advance winners to next round (optional)
                                    </Typography>
                                    <FormControl fullWidth>
                                        <InputLabel>Select Next Round</InputLabel>
                                        <Select
                                            value={nextRound}
                                            onChange={(e) => setNextRound(e.target.value)}
                                            label="Select Next Round"
                                        >
                                            <MenuItem value="">
                                                <em>Don't advance to next round</em>
                                            </MenuItem>
                                            {availableNextRounds.map(round => (
                                                <MenuItem key={round.id} value={round.id}>
                                                    {round.name} ({getRoundTypeName(round.round_type)})
                                                </MenuItem>
                                            ))}
                                        </Select>
                                    </FormControl>
                                </Box>
                            )}
                        </>
                    )}
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setWinnerDialogOpen(false)}>Cancel</Button>
                    <Button
                        onClick={handleDeclareWinnersSubmit}
                        variant="contained"
                        color="primary"
                        disabled={participants.length === 0 || selectedWinners.length === 0}
                    >
                        Declare Winners
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

export default EventRoundsManagement;