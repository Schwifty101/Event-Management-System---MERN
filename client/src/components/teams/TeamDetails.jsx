import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    Box,
    Typography,
    Paper,
    Grid,
    Card,
    CardContent,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Button,
    Chip,
    IconButton,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    TextField,
    CircularProgress,
    Alert,
    Snackbar,
    Divider,
    Tooltip
} from '@mui/material';
import {
    ArrowBack as ArrowBackIcon,
    Edit as EditIcon,
    Delete as DeleteIcon,
    PersonAdd as PersonAddIcon,
    Person as PersonIcon,
    Group as GroupIcon,
    PersonRemove as PersonRemoveIcon
} from '@mui/icons-material';
import { useAuth } from '../../context/AuthContext';
import { teamService } from '../../services/api';

const TeamDetails = () => {
    const { id: teamId } = useParams();
    const { user } = useAuth();
    const navigate = useNavigate();

    const [team, setTeam] = useState(null);
    const [members, setMembers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [alert, setAlert] = useState({ open: false, message: '', severity: 'success' });

    // Dialogs
    const [addMemberDialogOpen, setAddMemberDialogOpen] = useState(false);
    const [removeMemberDialogOpen, setRemoveMemberDialogOpen] = useState(false);
    const [memberToRemove, setMemberToRemove] = useState(null);
    const [newMemberEmail, setNewMemberEmail] = useState('');

    // Check if user is team leader
    const isTeamLeader = team && user && team.leader_id === user.id;
    const isAdmin = user && user.role === 'admin';
    const canManageTeam = isTeamLeader || isAdmin;

    // Fetch team data
    useEffect(() => {
        const fetchTeamData = async () => {
            try {
                setLoading(true);
                const response = await teamService.getById(teamId);

                if (response && response.data) {
                    setTeam(response.data.team);
                    setMembers(response.data.members || []);
                }

                setLoading(false);
            } catch (error) {
                console.error('Error fetching team details:', error);
                setAlert({
                    open: true,
                    message: 'Failed to load team details. Please try again.',
                    severity: 'error'
                });
                setLoading(false);
            }
        };

        if (teamId) {
            fetchTeamData();
        }
    }, [teamId]);

    // Handle adding a new member
    const handleAddMember = async () => {
        if (!newMemberEmail || !newMemberEmail.trim()) {
            setAlert({
                open: true,
                message: 'Please enter a valid email address',
                severity: 'warning'
            });
            return;
        }

        try {
            await teamService.addMember(teamId, newMemberEmail, 'invited');
            setAlert({
                open: true,
                message: 'Team invitation sent successfully',
                severity: 'success'
            });
            setAddMemberDialogOpen(false);
            setNewMemberEmail('');

            // Refresh member list
            const response = await teamService.getById(teamId);
            if (response && response.data) {
                setMembers(response.data.members || []);
            }
        } catch (error) {
            console.error('Error adding team member:', error);
            setAlert({
                open: true,
                message: `Failed to add member: ${error.response?.data?.message || error.message}`,
                severity: 'error'
            });
        }
    };

    // Handle removing a member
    const handleRemoveMember = async () => {
        if (!memberToRemove) return;

        try {
            await teamService.removeMember(teamId, memberToRemove.user_id);
            setAlert({
                open: true,
                message: 'Team member removed successfully',
                severity: 'success'
            });
            setRemoveMemberDialogOpen(false);

            // Refresh member list
            const response = await teamService.getById(teamId);
            if (response && response.data) {
                setMembers(response.data.members || []);
            }
        } catch (error) {
            console.error('Error removing team member:', error);
            setAlert({
                open: true,
                message: `Failed to remove member: ${error.response?.data?.message || error.message}`,
                severity: 'error'
            });
        }
    };

    // Handle transferring team leadership
    const handleTransferLeadership = async (newLeaderId) => {
        try {
            await teamService.transferLeadership(teamId, newLeaderId);
            setAlert({
                open: true,
                message: 'Team leadership transferred successfully',
                severity: 'success'
            });

            // Refresh team data
            const response = await teamService.getById(teamId);
            if (response && response.data) {
                setTeam(response.data.team);
                setMembers(response.data.members || []);
            }
        } catch (error) {
            console.error('Error transferring leadership:', error);
            setAlert({
                open: true,
                message: `Failed to transfer leadership: ${error.response?.data?.message || error.message}`,
                severity: 'error'
            });
        }
    };

    // Handle deleting the team
    const handleDeleteTeam = async () => {
        if (!team) return;

        try {
            await teamService.delete(teamId);
            setAlert({
                open: true,
                message: 'Team deleted successfully',
                severity: 'success'
            });

            // Navigate back to teams list
            navigate('/teams');
        } catch (error) {
            console.error('Error deleting team:', error);
            setAlert({
                open: true,
                message: `Failed to delete team: ${error.response?.data?.message || error.message}`,
                severity: 'error'
            });
        }
    };

    if (loading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
                <CircularProgress />
            </Box>
        );
    }

    if (!team) {
        return (
            <Box sx={{ p: 3 }}>
                <Alert severity="error">Team not found or you don't have permission to view it.</Alert>
                <Button
                    startIcon={<ArrowBackIcon />}
                    sx={{ mt: 2 }}
                    onClick={() => navigate('/teams')}
                >
                    Back to Teams
                </Button>
            </Box>
        );
    }

    return (
        <Box sx={{ p: 3 }}>
            {/* Header with back button */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <IconButton
                        sx={{ mr: 1 }}
                        onClick={() => navigate('/teams')}
                    >
                        <ArrowBackIcon />
                    </IconButton>
                    <Typography variant="h4">Team: {team.name}</Typography>
                </Box>

                {canManageTeam && (
                    <Box>
                        <Button
                            variant="outlined"
                            color="error"
                            startIcon={<DeleteIcon />}
                            onClick={handleDeleteTeam}
                        >
                            Delete Team
                        </Button>
                    </Box>
                )}
            </Box>

            {/* Team info section */}
            <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                    <Paper sx={{ p: 3, mb: 3 }}>
                        <Typography variant="h6" gutterBottom>Team Information</Typography>
                        <Divider sx={{ mb: 2 }} />

                        <Grid container spacing={2}>
                            <Grid item xs={4}>
                                <Typography variant="body2" color="text.secondary">Team Name</Typography>
                            </Grid>
                            <Grid item xs={8}>
                                <Typography variant="body1">{team.name}</Typography>
                            </Grid>

                            <Grid item xs={4}>
                                <Typography variant="body2" color="text.secondary">Event</Typography>
                            </Grid>
                            <Grid item xs={8}>
                                <Typography variant="body1">{team.event_title}</Typography>
                            </Grid>

                            <Grid item xs={4}>
                                <Typography variant="body2" color="text.secondary">Team Leader</Typography>
                            </Grid>
                            <Grid item xs={8}>
                                <Typography variant="body1">{team.leader_name}</Typography>
                            </Grid>

                            <Grid item xs={4}>
                                <Typography variant="body2" color="text.secondary">Created</Typography>
                            </Grid>
                            <Grid item xs={8}>
                                <Typography variant="body1">
                                    {new Date(team.created_at).toLocaleDateString()}
                                </Typography>
                            </Grid>
                        </Grid>
                    </Paper>
                </Grid>

                <Grid item xs={12} md={6}>
                    <Card sx={{ height: '100%' }}>
                        <CardContent sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                            <Typography variant="h6" gutterBottom>Member Count</Typography>
                            <Divider sx={{ mb: 2 }} />

                            <Box sx={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                flexGrow: 1
                            }}>
                                <Box sx={{
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    justifyContent: 'center'
                                }}>
                                    <GroupIcon sx={{ fontSize: 60, color: 'primary.main', mb: 1 }} />
                                    <Typography variant="h4" color="primary.main">
                                        {members.length}
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

            {/* Team members section */}
            <Box sx={{ mt: 4, mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="h6">Team Members</Typography>

                {canManageTeam && (
                    <Button
                        variant="contained"
                        startIcon={<PersonAddIcon />}
                        onClick={() => setAddMemberDialogOpen(true)}
                    >
                        Add Member
                    </Button>
                )}
            </Box>

            <TableContainer component={Paper}>
                <Table>
                    <TableHead>
                        <TableRow>
                            <TableCell>Name</TableCell>
                            <TableCell>Email</TableCell>
                            <TableCell>Status</TableCell>
                            <TableCell>Role</TableCell>
                            {canManageTeam && <TableCell align="right">Actions</TableCell>}
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {members.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={canManageTeam ? 5 : 4} align="center">
                                    No team members found
                                </TableCell>
                            </TableRow>
                        ) : (
                            members.map((member) => (
                                <TableRow key={member.id}>
                                    <TableCell>
                                        {member.name}
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
                                    <TableCell>
                                        {member.user_id === team.leader_id ? (
                                            <Chip
                                                icon={<PersonIcon />}
                                                label="Team Leader"
                                                size="small"
                                                color="primary"
                                            />
                                        ) : (
                                            "Member"
                                        )}
                                    </TableCell>
                                    {canManageTeam && (
                                        <TableCell align="right">
                                            {/* Don't show remove button for team leader */}
                                            {member.user_id !== team.leader_id && (
                                                <Tooltip title="Remove Member">
                                                    <IconButton
                                                        size="small"
                                                        color="error"
                                                        onClick={() => {
                                                            setMemberToRemove(member);
                                                            setRemoveMemberDialogOpen(true);
                                                        }}
                                                    >
                                                        <PersonRemoveIcon />
                                                    </IconButton>
                                                </Tooltip>
                                            )}

                                            {/* Only show transfer leadership button if current user is team leader */}
                                            {isTeamLeader && member.user_id !== team.leader_id && member.status === 'joined' && (
                                                <Tooltip title="Transfer Leadership">
                                                    <IconButton
                                                        size="small"
                                                        color="primary"
                                                        onClick={() => handleTransferLeadership(member.user_id)}
                                                    >
                                                        <EditIcon />
                                                    </IconButton>
                                                </Tooltip>
                                            )}
                                        </TableCell>
                                    )}
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </TableContainer>

            {/* Add Member Dialog */}
            <Dialog
                open={addMemberDialogOpen}
                onClose={() => setAddMemberDialogOpen(false)}
            >
                <DialogTitle>Add Team Member</DialogTitle>
                <DialogContent>
                    <TextField
                        autoFocus
                        margin="dense"
                        label="Member Email"
                        type="email"
                        fullWidth
                        variant="outlined"
                        value={newMemberEmail}
                        onChange={(e) => setNewMemberEmail(e.target.value)}
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setAddMemberDialogOpen(false)}>Cancel</Button>
                    <Button onClick={handleAddMember} variant="contained">Invite</Button>
                </DialogActions>
            </Dialog>

            {/* Remove Member Dialog */}
            <Dialog
                open={removeMemberDialogOpen}
                onClose={() => setRemoveMemberDialogOpen(false)}
            >
                <DialogTitle>Remove Team Member</DialogTitle>
                <DialogContent>
                    Are you sure you want to remove {memberToRemove?.name} from the team?
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setRemoveMemberDialogOpen(false)}>Cancel</Button>
                    <Button onClick={handleRemoveMember} color="error" variant="contained">Remove</Button>
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

export default TeamDetails;