import React, { useState, useEffect } from 'react';
import {
    Box, Typography, Button, Container, Paper, Table, TableBody, TableCell,
    TableContainer, TableHead, TableRow, IconButton, Chip, Dialog, DialogTitle,
    DialogContent, DialogActions, TextField, FormControl, InputLabel, Select,
    MenuItem, CircularProgress, Tabs, Tab, Grid, Card, CardContent, Alert
} from '@mui/material';
import {
    Add as AddIcon,
    Edit as EditIcon,
    Delete as DeleteIcon,
    Refresh as RefreshIcon,
    CheckCircle as CheckCircleIcon,
    Cancel as CancelIcon,
    Room as RoomIcon,
    Hotel as HotelIcon
} from '@mui/icons-material';
import { accommodationService } from '../../services/api';

const TabPanel = (props) => {
    const { children, value, index, ...other } = props;
    return (
        <div
            role="tabpanel"
            hidden={value !== index}
            id={`accommodation-tabpanel-${index}`}
            aria-labelledby={`accommodation-tab-${index}`}
            {...other}
        >
            {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
        </div>
    );
};

const AdminAccommodationManagement = () => {
    const [loading, setLoading] = useState(true);
    const [accommodations, setAccommodations] = useState([]);
    const [selectedAccommodation, setSelectedAccommodation] = useState(null);
    const [rooms, setRooms] = useState([]);
    const [tabValue, setTabValue] = useState(0);
    const [openAccommodationDialog, setOpenAccommodationDialog] = useState(false);
    const [openRoomDialog, setOpenRoomDialog] = useState(false);
    const [formData, setFormData] = useState({});
    const [error, setError] = useState(null);

    // Load accommodations on component mount
    useEffect(() => {
        fetchAccommodations();
    }, []);

    // Fetch accommodations from API
    const fetchAccommodations = async () => {
        try {
            setLoading(true);
            setError(null);
            const response = await accommodationService.getAll();
            setAccommodations(response.data.accommodations || []);
            setLoading(false);
        } catch (err) {
            console.error('Error fetching accommodations:', err);
            setError('Failed to load accommodations. Please try again.');
            setLoading(false);
        }
    };

    // Fetch rooms for a selected accommodation
    const fetchRooms = async (accommodationId) => {
        try {
            setLoading(true);
            const response = await accommodationService.getById(accommodationId);
            if (response.data && response.data.accommodation) {
                setSelectedAccommodation(response.data.accommodation);
                setRooms(response.data.accommodation.rooms || []);
            }
            setLoading(false);
        } catch (err) {
            console.error('Error fetching rooms:', err);
            setError('Failed to load rooms. Please try again.');
            setLoading(false);
        }
    };

    // Handle tab change
    const handleTabChange = (event, newValue) => {
        setTabValue(newValue);
    };

    // Handle accommodation form open
    const handleAddAccommodation = () => {
        setFormData({
            name: '',
            location: '',
            description: '',
            total_rooms: '',
            price_per_night: '',
            amenities: '',
            image_url: '',
            is_active: true
        });
        setOpenAccommodationDialog(true);
    };

    // Handle accommodation edit
    const handleEditAccommodation = (accommodation) => {
        setFormData({
            id: accommodation.id,
            name: accommodation.name,
            location: accommodation.location,
            description: accommodation.description || '',
            total_rooms: accommodation.total_rooms,
            price_per_night: accommodation.price_per_night,
            amenities: accommodation.amenities || '',
            image_url: accommodation.image_url || '',
            is_active: accommodation.is_active
        });
        setOpenAccommodationDialog(true);
    };

    // Handle room form open
    const handleAddRoom = () => {
        if (!selectedAccommodation) {
            setError('Please select an accommodation first');
            return;
        }
        setFormData({
            accommodation_id: selectedAccommodation.id,
            room_number: '',
            room_type: 'standard',
            capacity: 1,
            is_available: true
        });
        setOpenRoomDialog(true);
    };

    // Handle room edit
    const handleEditRoom = (room) => {
        setFormData({
            id: room.id,
            accommodation_id: room.accommodation_id,
            room_number: room.room_number,
            room_type: room.room_type,
            capacity: room.capacity,
            is_available: room.is_available
        });
        setOpenRoomDialog(true);
    };

    // Handle accommodation delete
    const handleDeleteAccommodation = async (id) => {
        if (!window.confirm('Are you sure you want to delete this accommodation?')) {
            return;
        }

        try {
            setLoading(true);
            await accommodationService.delete(id);
            fetchAccommodations();
            setLoading(false);
        } catch (err) {
            console.error('Error deleting accommodation:', err);
            setError('Failed to delete accommodation. Please try again.');
            setLoading(false);
        }
    };

    // Handle room delete
    const handleDeleteRoom = async (id) => {
        if (!window.confirm('Are you sure you want to delete this room?')) {
            return;
        }

        try {
            setLoading(true);
            await accommodationService.deleteRoom(id);
            fetchRooms(selectedAccommodation.id);
            setLoading(false);
        } catch (err) {
            console.error('Error deleting room:', err);
            setError('Failed to delete room. Please try again.');
            setLoading(false);
        }
    };

    // Handle input change for forms
    const handleFormChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData({
            ...formData,
            [name]: type === 'checkbox' ? checked : value
        });
    };

    // Handle accommodation form submit
    const handleAccommodationSubmit = async () => {
        try {
            setLoading(true);
            if (formData.id) {
                // Update existing accommodation
                await accommodationService.update(formData.id, formData);
            } else {
                // Create new accommodation
                await accommodationService.create(formData);
            }
            setOpenAccommodationDialog(false);
            fetchAccommodations();
        } catch (err) {
            console.error('Error saving accommodation:', err);
            setError('Failed to save accommodation. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    // Handle room form submit
    const handleRoomSubmit = async () => {
        try {
            setLoading(true);
            if (formData.id) {
                // Update existing room
                await accommodationService.updateRoom(formData.id, formData);
            } else {
                // Create new room
                await accommodationService.addRoom(formData.accommodation_id, formData);
            }
            setOpenRoomDialog(false);
            fetchRooms(selectedAccommodation.id);
        } catch (err) {
            console.error('Error saving room:', err);
            setError('Failed to save room. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    // Handle accommodation selection for viewing rooms
    const handleSelectAccommodation = (accommodation) => {
        fetchRooms(accommodation.id);
        setTabValue(1); // Switch to Rooms tab
    };

    return (
        <Container maxWidth="xl">
            <Box sx={{ mb: 4 }}>
                <Typography variant="h4" gutterBottom>
                    Accommodation Management
                </Typography>
                <Typography variant="subtitle1" color="text.secondary">
                    Manage accommodation options and rooms for event attendees
                </Typography>
            </Box>

            {error && (
                <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
                    {error}
                </Alert>
            )}

            <Paper sx={{ mb: 3 }}>
                <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
                    <Tabs value={tabValue} onChange={handleTabChange} aria-label="accommodation tabs">
                        <Tab label="Accommodations" />
                        <Tab label="Rooms" disabled={!selectedAccommodation} />
                        <Tab label="Bookings" />
                    </Tabs>
                </Box>

                {/* Accommodations Tab */}
                <TabPanel value={tabValue} index={0}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                        <Button
                            variant="contained"
                            startIcon={<RefreshIcon />}
                            onClick={fetchAccommodations}
                        >
                            Refresh
                        </Button>
                        <Button
                            variant="contained"
                            color="primary"
                            startIcon={<AddIcon />}
                            onClick={handleAddAccommodation}
                        >
                            Add Accommodation
                        </Button>
                    </Box>

                    {loading ? (
                        <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}>
                            <CircularProgress />
                        </Box>
                    ) : accommodations.length === 0 ? (
                        <Box sx={{ p: 3, textAlign: 'center' }}>
                            <Typography variant="h6" color="text.secondary">
                                No accommodations found
                            </Typography>
                            <Typography variant="body2" sx={{ mt: 1 }}>
                                Add an accommodation to get started
                            </Typography>
                        </Box>
                    ) : (
                        <TableContainer>
                            <Table>
                                <TableHead>
                                    <TableRow>
                                        <TableCell>Name</TableCell>
                                        <TableCell>Location</TableCell>
                                        <TableCell>Price/Night</TableCell>
                                        <TableCell>Total Rooms</TableCell>
                                        <TableCell>Status</TableCell>
                                        <TableCell>Actions</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {accommodations.map((accommodation) => (
                                        <TableRow key={accommodation.id}>
                                            <TableCell>
                                                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                                    <HotelIcon sx={{ mr: 1, color: 'primary.main' }} />
                                                    {accommodation.name}
                                                </Box>
                                            </TableCell>
                                            <TableCell>{accommodation.location}</TableCell>
                                            <TableCell>${typeof accommodation.price_per_night === 'number'
                                                ? accommodation.price_per_night.toFixed(2)
                                                : Number(accommodation.price_per_night).toFixed(2) || '0.00'}</TableCell>
                                            <TableCell>{accommodation.total_rooms}</TableCell>
                                            <TableCell>
                                                <Chip
                                                    label={accommodation.is_active ? 'Active' : 'Inactive'}
                                                    color={accommodation.is_active ? 'success' : 'default'}
                                                    size="small"
                                                />
                                            </TableCell>
                                            <TableCell>
                                                <IconButton
                                                    color="primary"
                                                    onClick={() => handleSelectAccommodation(accommodation)}
                                                    title="View Rooms"
                                                >
                                                    <RoomIcon />
                                                </IconButton>
                                                <IconButton
                                                    color="primary"
                                                    onClick={() => handleEditAccommodation(accommodation)}
                                                    title="Edit"
                                                >
                                                    <EditIcon />
                                                </IconButton>
                                                <IconButton
                                                    color="error"
                                                    onClick={() => handleDeleteAccommodation(accommodation.id)}
                                                    title="Delete"
                                                >
                                                    <DeleteIcon />
                                                </IconButton>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    )}
                </TabPanel>

                {/* Rooms Tab */}
                <TabPanel value={tabValue} index={1}>
                    {selectedAccommodation && (
                        <>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                                <Typography variant="h6">
                                    Rooms for: {selectedAccommodation.name}
                                </Typography>
                                <Button
                                    variant="contained"
                                    color="primary"
                                    startIcon={<AddIcon />}
                                    onClick={handleAddRoom}
                                >
                                    Add Room
                                </Button>
                            </Box>

                            {loading ? (
                                <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}>
                                    <CircularProgress />
                                </Box>
                            ) : rooms.length === 0 ? (
                                <Box sx={{ p: 3, textAlign: 'center' }}>
                                    <Typography variant="h6" color="text.secondary">
                                        No rooms found
                                    </Typography>
                                    <Typography variant="body2" sx={{ mt: 1 }}>
                                        Add rooms to this accommodation
                                    </Typography>
                                </Box>
                            ) : (
                                <Grid container spacing={2}>
                                    {rooms.map((room) => (
                                        <Grid item xs={12} md={4} key={room.id}>
                                            <Card>
                                                <CardContent>
                                                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                                        <Typography variant="h6">
                                                            Room {room.room_number}
                                                        </Typography>
                                                        <Chip
                                                            label={room.is_available ? 'Available' : 'Unavailable'}
                                                            color={room.is_available ? 'success' : 'error'}
                                                            size="small"
                                                        />
                                                    </Box>
                                                    <Typography variant="body2" sx={{ mt: 1 }}>
                                                        Type: {room.room_type.charAt(0).toUpperCase() + room.room_type.slice(1)}
                                                    </Typography>
                                                    <Typography variant="body2">
                                                        Capacity: {room.capacity} person{room.capacity !== 1 ? 's' : ''}
                                                    </Typography>
                                                    <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end' }}>
                                                        <IconButton
                                                            color="primary"
                                                            onClick={() => handleEditRoom(room)}
                                                            size="small"
                                                        >
                                                            <EditIcon />
                                                        </IconButton>
                                                        <IconButton
                                                            color="error"
                                                            onClick={() => handleDeleteRoom(room.id)}
                                                            size="small"
                                                        >
                                                            <DeleteIcon />
                                                        </IconButton>
                                                    </Box>
                                                </CardContent>
                                            </Card>
                                        </Grid>
                                    ))}
                                </Grid>
                            )}
                        </>
                    )}
                </TabPanel>

                {/* Bookings Tab */}
                <TabPanel value={tabValue} index={2}>
                    <Typography variant="h6">Booking Management</Typography>
                    <Typography variant="body2" sx={{ mt: 1 }}>
                        Booking management functionality will be displayed here.
                    </Typography>
                </TabPanel>
            </Paper>

            {/* Accommodation Dialog */}
            <Dialog open={openAccommodationDialog} onClose={() => setOpenAccommodationDialog(false)} maxWidth="md" fullWidth>
                <DialogTitle>
                    {formData.id ? 'Edit Accommodation' : 'Add Accommodation'}
                </DialogTitle>
                <DialogContent>
                    <Grid container spacing={2} sx={{ mt: 1 }}>
                        <Grid item xs={12} md={6}>
                            <TextField
                                fullWidth
                                label="Name"
                                name="name"
                                value={formData.name || ''}
                                onChange={handleFormChange}
                                required
                            />
                        </Grid>
                        <Grid item xs={12} md={6}>
                            <TextField
                                fullWidth
                                label="Location"
                                name="location"
                                value={formData.location || ''}
                                onChange={handleFormChange}
                                required
                            />
                        </Grid>
                        <Grid item xs={12} md={6}>
                            <TextField
                                fullWidth
                                label="Price per Night"
                                name="price_per_night"
                                type="number"
                                inputProps={{ min: 0, step: 0.01 }}
                                value={formData.price_per_night || ''}
                                onChange={handleFormChange}
                                required
                            />
                        </Grid>
                        <Grid item xs={12} md={6}>
                            <TextField
                                fullWidth
                                label="Total Rooms"
                                name="total_rooms"
                                type="number"
                                inputProps={{ min: 0 }}
                                value={formData.total_rooms || ''}
                                onChange={handleFormChange}
                                required
                            />
                        </Grid>
                        <Grid item xs={12}>
                            <TextField
                                fullWidth
                                label="Description"
                                name="description"
                                multiline
                                rows={3}
                                value={formData.description || ''}
                                onChange={handleFormChange}
                            />
                        </Grid>
                        <Grid item xs={12} md={6}>
                            <TextField
                                fullWidth
                                label="Amenities (comma separated)"
                                name="amenities"
                                value={formData.amenities || ''}
                                onChange={handleFormChange}
                                placeholder="WiFi, Pool, Breakfast"
                            />
                        </Grid>
                        <Grid item xs={12} md={6}>
                            <TextField
                                fullWidth
                                label="Image URL"
                                name="image_url"
                                value={formData.image_url || ''}
                                onChange={handleFormChange}
                            />
                        </Grid>
                        <Grid item xs={12}>
                            <FormControl component="fieldset">
                                <label>
                                    <input
                                        type="checkbox"
                                        name="is_active"
                                        checked={formData.is_active}
                                        onChange={handleFormChange}
                                    />
                                    Active
                                </label>
                            </FormControl>
                        </Grid>
                    </Grid>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setOpenAccommodationDialog(false)}>Cancel</Button>
                    <Button
                        onClick={handleAccommodationSubmit}
                        variant="contained"
                        color="primary"
                        disabled={loading}
                    >
                        {loading ? <CircularProgress size={24} /> : 'Save'}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Room Dialog */}
            <Dialog open={openRoomDialog} onClose={() => setOpenRoomDialog(false)} maxWidth="sm" fullWidth>
                <DialogTitle>
                    {formData.id ? 'Edit Room' : 'Add Room'}
                </DialogTitle>
                <DialogContent>
                    <Grid container spacing={2} sx={{ mt: 1 }}>
                        <Grid item xs={12}>
                            <TextField
                                fullWidth
                                label="Room Number"
                                name="room_number"
                                value={formData.room_number || ''}
                                onChange={handleFormChange}
                                required
                            />
                        </Grid>
                        <Grid item xs={12}>
                            <FormControl fullWidth>
                                <InputLabel>Room Type</InputLabel>
                                <Select
                                    name="room_type"
                                    value={formData.room_type || 'standard'}
                                    onChange={handleFormChange}
                                    label="Room Type"
                                >
                                    <MenuItem value="single">Single</MenuItem>
                                    <MenuItem value="double">Double</MenuItem>
                                    <MenuItem value="suite">Suite</MenuItem>
                                    <MenuItem value="dormitory">Dormitory</MenuItem>
                                </Select>
                            </FormControl>
                        </Grid>
                        <Grid item xs={12}>
                            <TextField
                                fullWidth
                                label="Capacity"
                                name="capacity"
                                type="number"
                                inputProps={{ min: 1 }}
                                value={formData.capacity || 1}
                                onChange={handleFormChange}
                            />
                        </Grid>
                        <Grid item xs={12}>
                            <FormControl component="fieldset">
                                <label>
                                    <input
                                        type="checkbox"
                                        name="is_available"
                                        checked={formData.is_available}
                                        onChange={handleFormChange}
                                    />
                                    Available
                                </label>
                            </FormControl>
                        </Grid>
                    </Grid>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setOpenRoomDialog(false)}>Cancel</Button>
                    <Button
                        onClick={handleRoomSubmit}
                        variant="contained"
                        color="primary"
                        disabled={loading}
                    >
                        {loading ? <CircularProgress size={24} /> : 'Save'}
                    </Button>
                </DialogActions>
            </Dialog>
        </Container>
    );
};

export default AdminAccommodationManagement;