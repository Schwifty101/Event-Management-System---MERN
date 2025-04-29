import React, { useState, useEffect } from 'react';
import {
    Box,
    Typography,
    Paper,
    Grid,
    Card,
    CardContent,
    CardHeader,
    TextField,
    Button,
    Divider,
    CircularProgress,
    Alert,
    Snackbar,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Rating,
    IconButton,
    Tooltip,
    Chip,
} from '@mui/material';
import {
    Save as SaveIcon,
    PresentToAll as PresentationIcon,
    Code as TechnicalIcon,
    Lightbulb as CreativityIcon,
    BuildCircle as ImplementationIcon,
    Send as SubmitIcon,
} from '@mui/icons-material';
import { useAuth } from '../../context/AuthContext';
import axios from 'axios';

const JudgingPanel = ({ roundId, assignmentId }) => {
    const { user } = useAuth();
    const [loading, setLoading] = useState(true);
    const [participants, setParticipants] = useState([]);
    const [scores, setScores] = useState({});
    const [round, setRound] = useState(null);
    const [submitting, setSubmitting] = useState(false);
    const [alert, setAlert] = useState({
        open: false,
        message: '',
        severity: 'success'
    });

    useEffect(() => {
        const fetchDetails = async () => {
            try {
                const response = await axios.get(`/api/rounds/${roundId}`, {
                    headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
                });

                setRound(response.data.round);
            } catch (error) {
                console.error('Error fetching round details:', error);
                setAlert({
                    open: true,
                    message: 'Failed to load round details',
                    severity: 'error'
                });
            }

            await fetchParticipants();
        };
        fetchDetails();
    }, [roundId]);

    const fetchParticipants = async () => {
        try {
            setLoading(true);
            const response = await axios.get(`/api/rounds/${roundId}/participants`, {
                headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
            });

            setParticipants(response.data.participants || []);

            // Initialize scores object
            const initialScores = {};
            response.data.participants.forEach(participant => {
                const id = participant.id;
                initialScores[id] = {
                    participant_id: id,
                    technical_score: 0,
                    presentation_score: 0,
                    creativity_score: 0,
                    implementation_score: 0,
                    judge_comments: ''
                };
            });

            // Check if there are any existing scores
            try {
                const existingScores = await axios.get(`/api/judges/rounds/${roundId}/scores`, {
                    headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
                });

                // Merge existing scores with initialized ones
                if (existingScores.data && existingScores.data.scores) {
                    existingScores.data.scores.forEach(score => {
                        if (initialScores[score.participant_id]) {
                            initialScores[score.participant_id] = {
                                ...initialScores[score.participant_id],
                                ...score
                            };
                        }
                    });
                }
            } catch (error) {
                console.error('Error fetching existing scores:', error);
            }

            setScores(initialScores);
            setLoading(false);
        } catch (error) {
            console.error('Error fetching participants:', error);
            setAlert({
                open: true,
                message: 'Failed to load participants',
                severity: 'error'
            });
            setLoading(false);
        }
    };

    const handleScoreChange = (participantId, category, value) => {
        setScores(prevScores => ({
            ...prevScores,
            [participantId]: {
                ...prevScores[participantId],
                [category]: value
            }
        }));
    };

    const handleCommentsChange = (participantId, value) => {
        setScores(prevScores => ({
            ...prevScores,
            [participantId]: {
                ...prevScores[participantId],
                judge_comments: value
            }
        }));
    };

    const calculateTotalScore = (participantId) => {
        const score = scores[participantId];
        if (!score) return 0;

        return (
            (parseFloat(score.technical_score) || 0) +
            (parseFloat(score.presentation_score) || 0) +
            (parseFloat(score.creativity_score) || 0) +
            (parseFloat(score.implementation_score) || 0)
        ) / 4; // Average score
    };

    const handleSaveScores = async (participantId) => {
        try {
            setSubmitting(true);

            // Format the score data for the API
            const scoreData = {
                ...scores[participantId],
                round_id: roundId,
            };

            // Submit just this participant's score
            await axios.post(`/api/judges/rounds/${roundId}/scores`, {
                scores: [scoreData]
            }, {
                headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
            });

            setAlert({
                open: true,
                message: 'Score saved successfully',
                severity: 'success'
            });

            setSubmitting(false);
        } catch (error) {
            console.error('Error saving score:', error);
            setAlert({
                open: true,
                message: error.response?.data?.message || 'Failed to save score',
                severity: 'error'
            });
            setSubmitting(false);
        }
    };

    const handleSubmitAllScores = async () => {
        try {
            setSubmitting(true);

            // Format all score data for the API
            const allScores = Object.values(scores).map(score => ({
                ...score,
                round_id: roundId
            }));

            // Submit all scores at once
            await axios.post(`/api/judges/rounds/${roundId}/scores`, {
                scores: allScores
            }, {
                headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
            });

            // Update assignment status to completed
            if (assignmentId) {
                await axios.put(`/api/judges/assignments/${assignmentId}/status`, {
                    status: 'completed'
                }, {
                    headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
                });
            }

            setAlert({
                open: true,
                message: 'All scores submitted successfully',
                severity: 'success'
            });

            setSubmitting(false);
        } catch (error) {
            console.error('Error submitting scores:', error);
            setAlert({
                open: true,
                message: error.response?.data?.message || 'Failed to submit scores',
                severity: 'error'
            });
            setSubmitting(false);
        }
    };

    const isScoreComplete = (participantId) => {
        const score = scores[participantId];
        if (!score) return false;

        return (
            score.technical_score > 0 &&
            score.presentation_score > 0 &&
            score.creativity_score > 0 &&
            score.implementation_score > 0
        );
    };

    const isAllScoresComplete = () => {
        return participants.every(p => isScoreComplete(p.id));
    };

    if (loading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 5 }}>
                <CircularProgress />
            </Box>
        );
    }

    return (
        <Box sx={{ p: 3 }}>
            <Paper sx={{ p: 3, mb: 4 }}>
                <Typography variant="h5" gutterBottom>
                    Judging Panel - {round?.name}
                </Typography>
                <Typography variant="subtitle1" color="textSecondary" gutterBottom>
                    Event: {round?.event_title}
                </Typography>
                <Typography variant="body2" gutterBottom>
                    Please score each participant or team based on the following criteria:
                </Typography>
                <Grid container spacing={2} sx={{ mt: 1 }}>
                    <Grid item xs={12} sm={6} md={3}>
                        <Box display="flex" alignItems="center">
                            <TechnicalIcon color="primary" sx={{ mr: 1 }} />
                            <Typography variant="body2">
                                <strong>Technical Merit</strong> - Quality of technical implementation
                            </Typography>
                        </Box>
                    </Grid>
                    <Grid item xs={12} sm={6} md={3}>
                        <Box display="flex" alignItems="center">
                            <PresentationIcon color="secondary" sx={{ mr: 1 }} />
                            <Typography variant="body2">
                                <strong>Presentation</strong> - Communication and presentation skills
                            </Typography>
                        </Box>
                    </Grid>
                    <Grid item xs={12} sm={6} md={3}>
                        <Box display="flex" alignItems="center">
                            <CreativityIcon color="warning" sx={{ mr: 1 }} />
                            <Typography variant="body2">
                                <strong>Creativity</strong> - Innovation and creative approach
                            </Typography>
                        </Box>
                    </Grid>
                    <Grid item xs={12} sm={6} md={3}>
                        <Box display="flex" alignItems="center">
                            <ImplementationIcon color="info" sx={{ mr: 1 }} />
                            <Typography variant="body2">
                                <strong>Implementation</strong> - Completeness and quality of execution
                            </Typography>
                        </Box>
                    </Grid>
                </Grid>
            </Paper>

            <Box sx={{ mb: 3, display: 'flex', justifyContent: 'flex-end' }}>
                <Button
                    variant="contained"
                    disabled={!isAllScoresComplete() || submitting}
                    startIcon={<SubmitIcon />}
                    onClick={handleSubmitAllScores}
                    color="primary"
                >
                    {submitting ? <CircularProgress size={24} /> : 'Submit All Scores'}
                </Button>
            </Box>

            <Grid container spacing={3}>
                {participants.length === 0 ? (
                    <Grid item xs={12}>
                        <Paper sx={{ p: 4, textAlign: 'center' }}>
                            <Typography variant="h6" color="textSecondary">
                                No participants found for this round
                            </Typography>
                        </Paper>
                    </Grid>
                ) : (
                    participants.map((participant) => (
                        <Grid item xs={12} key={participant.id}>
                            <Card>
                                <CardHeader
                                    title={participant.team_name || participant.participant_name || 'Unnamed Participant'}
                                    subheader={
                                        <Box sx={{ display: 'flex', alignItems: 'center', mt: 0.5 }}>
                                            <Chip
                                                size="small"
                                                label={participant.team_id ? 'Team' : 'Individual'}
                                                color={participant.team_id ? 'primary' : 'secondary'}
                                                sx={{ mr: 1 }}
                                            />
                                            <Typography variant="body2" color="text.secondary">
                                                Status: {participant.status}
                                            </Typography>
                                        </Box>
                                    }
                                    action={
                                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                            <Box
                                                sx={{
                                                    mr: 2,
                                                    p: 1,
                                                    borderRadius: 1,
                                                    bgcolor: isScoreComplete(participant.id) ? 'success.light' : 'grey.200',
                                                    color: isScoreComplete(participant.id) ? 'white' : 'text.secondary',
                                                    fontWeight: 'bold'
                                                }}
                                            >
                                                Total: {calculateTotalScore(participant.id).toFixed(1)} / 5
                                            </Box>
                                            <Tooltip title="Save this score">
                                                <span>
                                                    <IconButton
                                                        color="primary"
                                                        onClick={() => handleSaveScores(participant.id)}
                                                        disabled={!isScoreComplete(participant.id) || submitting}
                                                    >
                                                        <SaveIcon />
                                                    </IconButton>
                                                </span>
                                            </Tooltip>
                                        </Box>
                                    }
                                />
                                <Divider />
                                <CardContent>
                                    <Grid container spacing={3}>
                                        <Grid item xs={12} md={8}>
                                            <TableContainer component={Paper} variant="outlined">
                                                <Table size="small">
                                                    <TableHead>
                                                        <TableRow>
                                                            <TableCell width="25%">Criteria</TableCell>
                                                            <TableCell align="center">Score (1-5)</TableCell>
                                                        </TableRow>
                                                    </TableHead>
                                                    <TableBody>
                                                        <TableRow>
                                                            <TableCell>
                                                                <Box display="flex" alignItems="center">
                                                                    <TechnicalIcon color="primary" fontSize="small" sx={{ mr: 1 }} />
                                                                    Technical Merit
                                                                </Box>
                                                            </TableCell>
                                                            <TableCell align="center">
                                                                <Rating
                                                                    name={`technical-${participant.id}`}
                                                                    value={parseFloat(scores[participant.id]?.technical_score) || 0}
                                                                    onChange={(_, value) => handleScoreChange(participant.id, 'technical_score', value)}
                                                                    precision={0.5}
                                                                />
                                                            </TableCell>
                                                        </TableRow>
                                                        <TableRow>
                                                            <TableCell>
                                                                <Box display="flex" alignItems="center">
                                                                    <PresentationIcon color="secondary" fontSize="small" sx={{ mr: 1 }} />
                                                                    Presentation
                                                                </Box>
                                                            </TableCell>
                                                            <TableCell align="center">
                                                                <Rating
                                                                    name={`presentation-${participant.id}`}
                                                                    value={parseFloat(scores[participant.id]?.presentation_score) || 0}
                                                                    onChange={(_, value) => handleScoreChange(participant.id, 'presentation_score', value)}
                                                                    precision={0.5}
                                                                />
                                                            </TableCell>
                                                        </TableRow>
                                                        <TableRow>
                                                            <TableCell>
                                                                <Box display="flex" alignItems="center">
                                                                    <CreativityIcon color="warning" fontSize="small" sx={{ mr: 1 }} />
                                                                    Creativity
                                                                </Box>
                                                            </TableCell>
                                                            <TableCell align="center">
                                                                <Rating
                                                                    name={`creativity-${participant.id}`}
                                                                    value={parseFloat(scores[participant.id]?.creativity_score) || 0}
                                                                    onChange={(_, value) => handleScoreChange(participant.id, 'creativity_score', value)}
                                                                    precision={0.5}
                                                                />
                                                            </TableCell>
                                                        </TableRow>
                                                        <TableRow>
                                                            <TableCell>
                                                                <Box display="flex" alignItems="center">
                                                                    <ImplementationIcon color="info" fontSize="small" sx={{ mr: 1 }} />
                                                                    Implementation
                                                                </Box>
                                                            </TableCell>
                                                            <TableCell align="center">
                                                                <Rating
                                                                    name={`implementation-${participant.id}`}
                                                                    value={parseFloat(scores[participant.id]?.implementation_score) || 0}
                                                                    onChange={(_, value) => handleScoreChange(participant.id, 'implementation_score', value)}
                                                                    precision={0.5}
                                                                />
                                                            </TableCell>
                                                        </TableRow>
                                                    </TableBody>
                                                </Table>
                                            </TableContainer>
                                        </Grid>
                                        <Grid item xs={12} md={4}>
                                            <TextField
                                                label="Comments"
                                                multiline
                                                rows={4}
                                                fullWidth
                                                value={scores[participant.id]?.judge_comments || ''}
                                                onChange={(e) => handleCommentsChange(participant.id, e.target.value)}
                                                placeholder="Add your comments for this participant..."
                                                variant="outlined"
                                            />
                                        </Grid>
                                    </Grid>
                                </CardContent>
                            </Card>
                        </Grid>
                    ))
                )}
            </Grid>

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

export default JudgingPanel;