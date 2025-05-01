import React, { useState, useEffect, useCallback } from 'react';
import {
    Box,
    Typography,
    Paper,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    TablePagination,
    Button,
    IconButton,
    Dialog,
    DialogActions,
    DialogContent,
    DialogContentText,
    DialogTitle,
    TextField,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Chip,
    CircularProgress,
    Alert,
    Snackbar,
    Grid,
    Card,
    CardContent,
    CardActions,
    Divider,
    Tooltip
} from '@mui/material';
import {
    Delete as DeleteIcon,
    Person as PersonIcon,
    Group as GroupIcon,
    Search as SearchIcon,
    Refresh as RefreshIcon,
    Add as AddIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { eventService, teamService } from '../../services/api';

const TeamManagement = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [teams, setTeams] = useState([]);
    const [filteredTeams, setFilteredTeams] = useState([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const [searchQuery, setSearchQuery] = useState('');
    const [eventFilter, setEventFilter] = useState('');
    const [events, setEvents] = useState([]);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [teamToDelete, setTeamToDelete] = useState(null);
    const [viewTeamDialogOpen, setViewTeamDialogOpen] = useState(false);
    const [selectedTeam, setSelectedTeam] = useState(null);
    const [teamMembers, setTeamMembers] = useState([]);
    const [alert, setAlert] = useState({ open: false, message: '', severity: 'success' });

    // Fetch teams data
    const fetchTeams = useCallback(async () => {
        try {
            setLoading(true);
            let response;

            // Different endpoint based on user role
            if (user.role === 'admin') {
                // For admins, we need to fetch all teams from all events
                // We'll use the existing getByEventId method to fetch teams for each event
                const eventsResponse = await eventService.getAll();
                const teamEvents = eventsResponse.data.events.filter(event => event.team_event);

                // Get teams for each event and flatten the array
                const teamsPromises = teamEvents.map(event =>
                    teamService.getByEventId(event.id)
                        .then(resp => resp.data.teams || [])
                        .catch(err => {
                            console.error(`Error fetching teams for event ${event.id}:`, err);
                            return [];
                        })
                );

                const teamsArrays = await Promise.all(teamsPromises);
                const allTeams = teamsArrays.flat();

                response = { data: { teams: allTeams } };
            } else if (user.role === 'participant') {
                response = await teamService.getMyTeams();
            } else if (user.role === 'organizer') {
                // For organizers, fetch teams for events they organize
                // This is a custom endpoint we need to handle differently
                response = await fetch('/api/teams/organizer', {
                    headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
                }).then(res => res.json());
            }

            if (response && response.data && response.data.teams) {
                setTeams(response.data.teams);
                setFilteredTeams(response.data.teams);
            } else {
                // Handle case where response doesn't have expected structure
                console.warn('Unexpected response format:', response);
                setTeams([]);
                setFilteredTeams([]);
            }
            setLoading(false);
        } catch (error) {
            console.error('Error fetching teams:', error);
            setAlert({
                open: true,
                message: 'Failed to load teams. Please try again.',
                severity: 'error'
            });
            setLoading(false);
        }
    }, [user.role]);

    // Fetch events for filtering
    const fetchEvents = useCallback(async () => {
        try {
            const response = await eventService.getAll();

            if (response && response.data.events) {
                // Filter to only show team events in the dropdown
                const teamEvents = response.data.events.filter(event => event.team_event);
                setEvents(teamEvents);
            } else {
                setEvents([]);
            }
        } catch (error) {
            console.error('Error fetching events:', error);
        }
    }, []);

    useEffect(() => {
        fetchTeams();
        fetchEvents();
    }, [fetchTeams, fetchEvents]);

    // Filter teams based on search query and event filter
    useEffect(() => {
        let result = teams;

        // Apply search filter
        if (searchQuery) {
            const lowercasedQuery = searchQuery.toLowerCase();
            result = result.filter(team =>
                team.name.toLowerCase().includes(lowercasedQuery) ||
                team.event_title?.toLowerCase().includes(lowercasedQuery) ||
                team.leader_name?.toLowerCase().includes(lowercasedQuery)
            );
        }

        // Apply event filter
        if (eventFilter) {
            result = result.filter(team => team.event_id === parseInt(eventFilter));
        }

        setFilteredTeams(result);
        setPage(0); // Reset to first page when filters change
    }, [searchQuery, eventFilter, teams]);

    // Handle team deletion
    const handleDeleteTeam = async () => {
        try {
            await teamService.delete(teamToDelete.id);

            setAlert({
                open: true,
                message: 'Team deleted successfully',
                severity: 'success'
            });

            setDeleteDialogOpen(false);
            fetchTeams(); // Refresh teams list
        } catch (error) {
            console.error('Error deleting team:', error);
            setAlert({
                open: true,
                message: `Failed to delete team: ${error.response?.data?.message || error.message}`,
                severity: 'error'
            });
        }
    };

    // Fetch team members
    const fetchTeamMembers = async (teamId) => {
        try {
            const response = await teamService.getTeamMembers(teamId);

            if (response && response.data.members) {
                setTeamMembers(response.data.members);
            } else {
                setTeamMembers([]);
            }
        } catch (error) {
            console.error('Error fetching team members:', error);
            setAlert({
                open: true,
                message: 'Failed to load team members',
                severity: 'error'
            });
        }
    };

    // Handle view team details
    const handleViewTeam = async (team) => {
        navigate(`/teams/${team.id}`);
    };

    // Handle create new team
    const handleCreateTeam = () => {
        navigate('/teams/create');
    };

    // Handle page change
    const handleChangePage = (event, newPage) => {
        setPage(newPage);
    };

    // Handle rows per page change
    const handleChangeRowsPerPage = (event) => {
        setRowsPerPage(parseInt(event.target.value, 10));
        setPage(0);
    };

    return (
        <Box sx={{ p: 3 }}>
            <Typography variant="h4" sx={{ mb: 3 }}>Team Management</Typography>

            {/* Search and filter controls */}
            <Paper sx={{ p: 2, mb: 3 }}>
                <Grid container spacing={2} alignItems="center">
                    <Grid item xs={12} sm={4}>
                        <TextField
                            fullWidth
                            label="Search Teams"
                            variant="outlined"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            size="small"
                        />
                    </Grid>
                    <Grid item xs={12} sm={3}>
                        <FormControl fullWidth size="small">
                            <InputLabel id="event-filter-label">Filter by Event</InputLabel>
                            <Select
                                labelId="event-filter-label"
                                value={eventFilter}
                                label="Filter by Event"
                                onChange={(e) => setEventFilter(e.target.value)}
                            >
                                <MenuItem value="">All Events</MenuItem>
                                {events.map((event) => (
                                    <MenuItem key={event.id} value={event.id}>{event.title}</MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                    </Grid>
                    <Grid item xs={12} sm={5} sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
                        <Button
                            variant="outlined"
                            startIcon={<RefreshIcon />}
                            onClick={() => {
                                setSearchQuery('');
                                setEventFilter('');
                                fetchTeams();
                            }}
                        >
                            Reset
                        </Button>
                        <Button
                            variant="contained"
                            startIcon={<AddIcon />}
                            onClick={handleCreateTeam}
                        >
                            Create Team
                        </Button>
                    </Grid>
                </Grid>
            </Paper>

            {/* Teams table */}
            <Paper>
                <TableContainer>
                    <Table>
                        <TableHead>
                            <TableRow>
                                <TableCell>Team Name</TableCell>
                                <TableCell>Event</TableCell>
                                <TableCell>Leader</TableCell>
                                <TableCell>Members</TableCell>
                                <TableCell>Created</TableCell>
                                <TableCell align="center">Actions</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {loading ? (
                                <TableRow>
                                    <TableCell colSpan={6} align="center">
                                        <CircularProgress size={24} sx={{ my: 2 }} />
                                    </TableCell>
                                </TableRow>
                            ) : filteredTeams.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6} align="center">
                                        No teams found
                                    </TableCell>
                                </TableRow>
                            ) : (
                                filteredTeams
                                    .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                                    .map((team) => (
                                        <TableRow key={team.id}>
                                            <TableCell>{team.name}</TableCell>
                                            <TableCell>{team.event_title}</TableCell>
                                            <TableCell>{team.leader_name}</TableCell>
                                            <TableCell>
                                                <Chip
                                                    icon={<GroupIcon fontSize="small" />}
                                                    label={team.member_count || 0}
                                                    size="small"
                                                    color="primary"
                                                    variant="outlined"
                                                />
                                            </TableCell>
                                            <TableCell>
                                                {new Date(team.created_at).toLocaleDateString()}
                                            </TableCell>
                                            <TableCell align="center">
                                                <Tooltip title="View Details">
                                                    <IconButton
                                                        size="small"
                                                        color="primary"
                                                        onClick={() => handleViewTeam(team)}
                                                    >
                                                        <SearchIcon />
                                                    </IconButton>
                                                </Tooltip>
                                                {/* Only show delete button for team leaders or admins */}
                                                {(user.role === 'admin' || user.id === team.leader_id) && (
                                                    <Tooltip title="Delete Team">
                                                        <IconButton
                                                            size="small"
                                                            color="error"
                                                            onClick={() => {
                                                                setTeamToDelete(team);
                                                                setDeleteDialogOpen(true);
                                                            }}
                                                        >
                                                            <DeleteIcon />
                                                        </IconButton>
                                                    </Tooltip>
                                                )}
                                            </TableCell>
                                        </TableRow>
                                    ))
                            )}
                        </TableBody>
                    </Table>
                </TableContainer>
                <TablePagination
                    component="div"
                    count={filteredTeams.length}
                    page={page}
                    onPageChange={handleChangePage}
                    rowsPerPage={rowsPerPage}
                    onRowsPerPageChange={handleChangeRowsPerPage}
                    rowsPerPageOptions={[5, 10, 25]}
                />
            </Paper>

            {/* Delete Confirmation Dialog */}
            <Dialog
                open={deleteDialogOpen}
                onClose={() => setDeleteDialogOpen(false)}
            >
                <DialogTitle>Confirm Team Deletion</DialogTitle>
                <DialogContent>
                    <DialogContentText>
                        Are you sure you want to delete the team "{teamToDelete?.name}"? This action cannot be undone.
                    </DialogContentText>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
                    <Button onClick={handleDeleteTeam} color="error" variant="contained">
                        Delete
                    </Button>
                </DialogActions>
            </Dialog>

            {/* View Team Dialog */}
            <Dialog
                open={viewTeamDialogOpen}
                onClose={() => setViewTeamDialogOpen(false)}
                maxWidth="md"
                fullWidth
            >
                <DialogTitle>
                    Team Details: {selectedTeam?.name}
                </DialogTitle>
                <DialogContent>
                    {selectedTeam && (
                        <Box>
                            <Grid container spacing={2}>
                                <Grid item xs={12} md={6}>
                                    <Card variant="outlined" sx={{ mb: 2 }}>
                                        <CardContent>
                                            <Typography variant="h6" gutterBottom>
                                                Team Information
                                            </Typography>
                                            <Typography variant="body2">
                                                <strong>Event:</strong> {selectedTeam.event_title}
                                            </Typography>
                                            <Typography variant="body2">
                                                <strong>Leader:</strong> {selectedTeam.leader_name}
                                            </Typography>
                                            <Typography variant="body2">
                                                <strong>Created:</strong> {new Date(selectedTeam.created_at).toLocaleDateString()}
                                            </Typography>
                                        </CardContent>
                                    </Card>
                                </Grid>
                                <Grid item xs={12} md={6}>
                                    <Card variant="outlined" sx={{ height: '100%' }}>
                                        <CardContent sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                                            <Typography variant="h6" gutterBottom>
                                                Member Count
                                            </Typography>
                                            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flexGrow: 1 }}>
                                                <Box sx={{
                                                    display: 'flex',
                                                    flexDirection: 'column',
                                                    alignItems: 'center',
                                                    justifyContent: 'center'
                                                }}>
                                                    <GroupIcon sx={{ fontSize: 60, color: 'primary.main', mb: 1 }} />
                                                    <Typography variant="h4" color="primary.main">
                                                        {teamMembers.length}
                                                    </Typography>
                                                    <Typography variant="subtitle2" color="text.secondary">
                                                        Team Members
                                                    </Typography>
                                                </Box>
                                            </Box>
                                        </CardContent>
                                    </Card>
                                </Grid>
                            </Grid>

                            <Typography variant="h6" sx={{ mt: 3, mb: 1 }}>
                                Team Members
                            </Typography>
                            <TableContainer component={Paper} variant="outlined">
                                <Table size="small">
                                    <TableHead>
                                        <TableRow>
                                            <TableCell width="40%">Name</TableCell>
                                            <TableCell width="40%">Email</TableCell>
                                            <TableCell width="20%">Status</TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {teamMembers.length === 0 ? (
                                            <TableRow>
                                                <TableCell colSpan={3} align="center">
                                                    No team members found
                                                </TableCell>
                                            </TableRow>
                                        ) : (
                                            teamMembers.map((member) => (
                                                <TableRow key={member.id}>
                                                    <TableCell>
                                                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                                            {member.user_id === selectedTeam.leader_id && (
                                                                <Tooltip title="Team Leader">
                                                                    <PersonIcon color="primary" sx={{ mr: 1 }} />
                                                                </Tooltip>
                                                            )}
                                                            {member.name}
                                                        </Box>
                                                    </TableCell>
                                                    <TableCell>{member.email}</TableCell>
                                                    <TableCell>
                                                        <Chip
                                                            label={member.status}
                                                            size="small"
                                                            color={
                                                                member.status === 'joined' ? 'success' :
                                                                    member.status === 'invited' ? 'warning' :
                                                                        member.status === 'declined' ? 'error' :
                                                                            'default'
                                                            }
                                                        />
                                                    </TableCell>
                                                </TableRow>
                                            ))
                                        )}
                                    </TableBody>
                                </Table>
                            </TableContainer>
                        </Box>
                    )}
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setViewTeamDialogOpen(false)}>Close</Button>
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

export default TeamManagement;