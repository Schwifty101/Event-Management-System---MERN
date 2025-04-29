import React, { useState } from 'react';
import {
    Box,
    Paper,
    Typography,
    Card,
    CardContent,
    Grid,
    Button,
    Chip,
    Stack,
    Divider
} from '@mui/material';
import {
    Event as EventIcon,
    LocationOn as LocationIcon,
    Group as GroupIcon,
    AttachMoney as MoneyIcon,
    Category as CategoryIcon
} from '@mui/icons-material';

const EventCalendar = ({ events = [] }) => {
    const [currentMonth, setCurrentMonth] = useState(new Date());

    if (events.length === 0) {
        return (
            <Paper sx={{ p: 4, textAlign: 'center' }}>
                <Typography variant="h6" color="textSecondary">
                    No events scheduled yet
                </Typography>
                <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
                    Create an event to see it on the calendar
                </Typography>
            </Paper>
        );
    }

    // Get the first and last day of the current month
    const firstDayOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
    const lastDayOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0);

    // Filter events for the current month
    const eventsInMonth = events.filter(event => {
        const eventDate = new Date(event.start_date);
        return eventDate >= firstDayOfMonth && eventDate <= lastDayOfMonth;
    });

    // Group events by date
    const groupedEvents = eventsInMonth.reduce((groups, event) => {
        const date = new Date(event.start_date).toDateString();
        if (!groups[date]) {
            groups[date] = [];
        }
        groups[date].push(event);
        return groups;
    }, {});

    // Get month name
    const monthNames = ["January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"];
    const currentMonthName = monthNames[currentMonth.getMonth()];
    const currentYear = currentMonth.getFullYear();

    // Navigation functions
    const goToPreviousMonth = () => {
        setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
    };

    const goToNextMonth = () => {
        setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
    };

    const goToCurrentMonth = () => {
        setCurrentMonth(new Date());
    };

    // Get category color
    const getCategoryColor = (category) => {
        switch (category) {
            case 'Tech Events':
                return '#2196f3';
            case 'Business Competitions':
                return '#4caf50';
            case 'Gaming Tournaments':
                return '#ff9800';
            case 'General Events':
                return '#9c27b0';
            default:
                return '#1976d2';
        }
    };

    // Format date for display
    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            weekday: 'short',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    return (
        <Paper sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
                <Button onClick={goToPreviousMonth} variant="outlined">Previous</Button>
                <Typography variant="h5" component="h2">
                    {`${currentMonthName} ${currentYear}`}
                </Typography>
                <Stack direction="row" spacing={1}>
                    <Button onClick={goToCurrentMonth} variant="outlined">Today</Button>
                    <Button onClick={goToNextMonth} variant="outlined">Next</Button>
                </Stack>
            </Box>

            {Object.keys(groupedEvents).length === 0 ? (
                <Box sx={{ py: 4, textAlign: 'center' }}>
                    <Typography variant="subtitle1" color="textSecondary">
                        No events scheduled for {currentMonthName} {currentYear}
                    </Typography>
                </Box>
            ) : (
                Object.entries(groupedEvents)
                    .sort(([dateA], [dateB]) => new Date(dateA) - new Date(dateB))
                    .map(([date, dateEvents]) => (
                        <Card key={date} sx={{ mb: 2, borderLeft: '4px solid #1976d2' }}>
                            <CardContent>
                                <Typography variant="h6" gutterBottom>
                                    {new Date(date).toLocaleDateString('en-US', {
                                        weekday: 'long',
                                        month: 'long',
                                        day: 'numeric'
                                    })}
                                </Typography>
                                <Divider sx={{ mb: 2 }} />
                                <Grid container spacing={2}>
                                    {dateEvents.map(event => (
                                        <Grid item xs={12} md={6} lg={4} key={event.id}>
                                            <Card variant="outlined" sx={{ height: '100%' }}>
                                                <CardContent>
                                                    <Box sx={{
                                                        display: 'flex',
                                                        justifyContent: 'space-between',
                                                        alignItems: 'flex-start',
                                                        mb: 1
                                                    }}>
                                                        <Typography variant="subtitle1" component="h3" fontWeight="bold">
                                                            {event.title}
                                                        </Typography>
                                                        <Chip
                                                            size="small"
                                                            label={event.category}
                                                            sx={{
                                                                backgroundColor: getCategoryColor(event.category),
                                                                color: 'white'
                                                            }}
                                                        />
                                                    </Box>
                                                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                                                        <EventIcon fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />
                                                        <Typography variant="body2" color="text.secondary">
                                                            {formatDate(event.start_date)}
                                                        </Typography>
                                                    </Box>
                                                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                                                        <LocationIcon fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />
                                                        <Typography variant="body2" color="text.secondary">
                                                            {event.location}
                                                        </Typography>
                                                    </Box>
                                                    {event.team_event && (
                                                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                                                            <GroupIcon fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />
                                                            <Typography variant="body2" color="text.secondary">
                                                                Team Event ({event.min_team_size}-{event.max_team_size} members)
                                                            </Typography>
                                                        </Box>
                                                    )}
                                                    {event.registration_fee > 0 && (
                                                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                                                            <MoneyIcon fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />
                                                            <Typography variant="body2" color="text.secondary">
                                                                Registration Fee: ${event.registration_fee}
                                                            </Typography>
                                                        </Box>
                                                    )}
                                                </CardContent>
                                            </Card>
                                        </Grid>
                                    ))}
                                </Grid>
                            </CardContent>
                        </Card>
                    ))
            )}
        </Paper>
    );
};

export default EventCalendar;