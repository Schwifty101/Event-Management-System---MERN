import React, { useState, useEffect } from 'react';
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
    Button,
    Chip,
    Snackbar,
    Alert,
    CircularProgress,
    Divider,
    Card,
    CardContent,
    CardHeader,
    Grid,
    Tooltip,
    Tab,
    Tabs,
    IconButton,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    MenuItem,
    FormControl,
    InputLabel,
    Select
} from '@mui/material';
import {
    Add,
    Edit,
    Delete,
    CheckCircle,
    Cancel,
    Visibility,
    AttachMoney,
    Campaign
} from '@mui/icons-material';
import {
    sponsorshipService,
    sponsorPackageService,
    sponsorProfileService,
    analyticsService
} from '../../services/api';

// Custom TabPanel component
function TabPanel(props) {
    const { children, value, index, ...other } = props;

    return (
        <div
            role="tabpanel"
            hidden={value !== index}
            id={`sponsorship-tabpanel-${index}`}
            aria-labelledby={`sponsorship-tab-${index}`}
            {...other}
        >
            {value === index && (
                <Box sx={{ p: 3 }}>
                    {children}
                </Box>
            )}
        </div>
    );
}

const SponsorshipManagement = () => {
    // State for tabs
    const [tabValue, setTabValue] = useState(0);

    // States for sponsorships
    const [sponsorships, setSponsorships] = useState([]);
    const [packages, setPackages] = useState([]);
    const [profiles, setProfiles] = useState([]);

    // UI states
    const [loading, setLoading] = useState({
        sponsorships: true,
        packages: true,
        profiles: true
    });
    const [alert, setAlert] = useState({ open: false, message: '', severity: 'success' });

    // Dialog states
    const [packageDialog, setPackageDialog] = useState({
        open: false,
        mode: 'add', // 'add' or 'edit'
        data: {
            name: '',
            description: '',
            price: '',
            benefits: '',
            isActive: true
        }
    });

    const [sponsorshipStatusDialog, setSponsorshipStatusDialog] = useState({
        open: false,
        sponsorshipId: null,
        currentStatus: '',
        newStatus: ''
    });

    const [selectedSponsorship, setSelectedSponsorship] = useState(null);
    const [viewDetailsDialog, setViewDetailsDialog] = useState(false);

    // Fetch data on component mount
    useEffect(() => {
        fetchSponsorships();
        fetchPackages();
        fetchProfiles();
    }, []);

    // Tab handling
    const handleTabChange = (event, newValue) => {
        setTabValue(newValue);
    };

    // Fetch functions
    const fetchSponsorships = async () => {
        try {
            setLoading(prev => ({ ...prev, sponsorships: true }));
            const response = await sponsorshipService.getAll();
            
            // Check if response data contains a 'sponsorships' property
            const sponsorshipsData = response.data.sponsorships || response.data;
            setSponsorships(Array.isArray(sponsorshipsData) ? sponsorshipsData : []);
            
            console.log('Fetched sponsorships:', sponsorshipsData);
        } catch (error) {
            console.error('Error fetching sponsorships:', error);
            setAlert({
                open: true,
                message: 'Failed to fetch sponsorships',
                severity: 'error'
            });
            setSponsorships([]);
        } finally {
            setLoading(prev => ({ ...prev, sponsorships: false }));
        }
    };

    const fetchPackages = async () => {
        try {
            setLoading(prev => ({ ...prev, packages: true }));
            const response = await sponsorPackageService.getAll();
            // Check if the response data contains a 'packages' property
            const packagesData = response.data.packages || response.data;
            setPackages(Array.isArray(packagesData) ? packagesData : []);
            console.log('Fetched packages:', packagesData);
        } catch (error) {
            console.error('Error fetching packages:', error);
            setAlert({
                open: true,
                message: 'Failed to fetch sponsorship packages',
                severity: 'error'
            });
            setPackages([]);
        } finally {
            setLoading(prev => ({ ...prev, packages: false }));
        }
    };

    const fetchProfiles = async () => {
        try {
            setLoading(prev => ({ ...prev, profiles: true }));

            // Hard-coded sample profile data for development
            // In production, this would come from the API
            const mockProfiles = [
                {
                    id: 1,
                    name: 'Tech Innovations Inc.',
                    organization_name: 'Tech Innovations',
                    email: 'sponsor@techinnovations.com',
                    contact_person: 'John Smith',
                    website: 'https://techinnovations.com'
                },
                {
                    id: 2,
                    name: 'Global Solutions',
                    organization_name: 'Global IT Solutions',
                    email: 'partnerships@globalsolutions.com',
                    contact_person: 'Sarah Johnson',
                    website: 'https://globalsolutions.com'
                },
                {
                    id: 3,
                    name: 'Future Systems',
                    organization_name: 'Future Systems LLC',
                    email: 'sponsors@futuresystems.com',
                    contact_person: 'Michael Brown',
                    website: 'https://futuresystems.com'
                },
                {
                    id: 4,
                    name: 'Data Dynamics',
                    organization_name: 'Data Dynamics Corp',
                    email: 'info@datadynamics.com',
                    contact_person: 'Emily Chen',
                    website: 'https://datadynamics.com'
                },
                {
                    id: 5,
                    name: 'Innovative Networks',
                    organization_name: 'Innovative Networks Inc',
                    email: 'sponsors@innovativenet.com',
                    contact_person: 'David Wilson',
                    website: 'https://innovativenet.com'
                }
            ];

            // Set mock data directly for development
            setProfiles(mockProfiles);
            console.log('Using mock sponsor profiles:', mockProfiles);
        } catch (error) {
            console.error('Error in fetchProfiles function:', error);
            setAlert({
                open: true,
                message: 'Failed to load sponsor profiles. Using development data instead.',
                severity: 'warning'
            });

            // Ensure profiles are set even if there's an error
            const fallbackProfiles = [
                {
                    id: 1,
                    name: 'Tech Innovations Inc.',
                    organization_name: 'Tech Innovations',
                    email: 'sponsor@techinnovations.com',
                    contact_person: 'John Smith',
                    website: 'https://techinnovations.com'
                },
                {
                    id: 2,
                    name: 'Global Solutions',
                    organization_name: 'Global IT Solutions',
                    email: 'partnerships@globalsolutions.com',
                    contact_person: 'Sarah Johnson',
                    website: 'https://globalsolutions.com'
                }
            ];
            setProfiles(fallbackProfiles);
        } finally {
            setLoading(prev => ({ ...prev, profiles: false }));
        }
    };

    // Package dialog handlers
    const openPackageDialog = (mode, data = null) => {
        if (mode === 'edit' && data) {
            setPackageDialog({
                open: true,
                mode,
                data: { ...data }
            });
        } else {
            setPackageDialog({
                open: true,
                mode: 'add',
                data: {
                    name: '',
                    description: '',
                    price: '',
                    benefits: '',
                    isActive: true
                }
            });
        }
    };

    const closePackageDialog = () => {
        setPackageDialog(prev => ({ ...prev, open: false }));
    };

    const handlePackageInputChange = (e) => {
        const { name, value, checked } = e.target;
        setPackageDialog(prev => ({
            ...prev,
            data: {
                ...prev.data,
                [name]: name === 'isActive' ? checked : value
            }
        }));
    };

    const handlePackageSave = async () => {
        try {
            const { mode, data } = packageDialog;

            // Validate required fields
            if (!data.name || !data.price) {
                setAlert({
                    open: true,
                    message: 'Please provide a name and price for the package',
                    severity: 'error'
                });
                return;
            }

            // Ensure benefits isn't empty (it's required by the backend)
            const packageData = {
                ...data,
                benefits: data.benefits || 'Standard benefits'
            };

            let newPackage;
            if (mode === 'add') {
                const response = await sponsorPackageService.create(packageData);
                newPackage = response.data;

                // Only fetch if we have a valid ID
                if (newPackage && newPackage.id) {
                    try {
                        const fetchedPackage = await sponsorPackageService.getById(newPackage.id);
                        console.log('Newly created package (direct from database):', fetchedPackage.data);
                    } catch (fetchError) {
                        console.warn('Failed to fetch newly created package:', fetchError);
                        // Continue with the process even if verification fails
                    }
                }

                setAlert({
                    open: true,
                    message: 'Sponsorship package created successfully',
                    severity: 'success'
                });
            } else {
                await sponsorPackageService.update(data.id, packageData);
                setAlert({
                    open: true,
                    message: 'Sponsorship package updated successfully',
                    severity: 'success'
                });
            }

            closePackageDialog();
            await fetchPackages();

            // Highlight the newly added package by scrolling to it
            if (mode === 'add' && newPackage?.id) {
                setTimeout(() => {
                    const element = document.getElementById(`package-${newPackage.id}`);
                    if (element) {
                        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
                        element.classList.add('highlight-new-item');
                        setTimeout(() => {
                            element.classList.remove('highlight-new-item');
                        }, 3000);
                    }
                }, 300);
            }

            // Switch to the packages tab if not already on it
            if (tabValue !== 1) {
                setTabValue(1);
            }
        } catch (error) {
            console.error('Error saving package:', error);
            setAlert({
                open: true,
                message: 'Failed to save sponsorship package',
                severity: 'error'
            });
        }
    };

    const handleDeletePackage = async (id) => {
        try {
            await sponsorPackageService.delete(id);
            setAlert({
                open: true,
                message: 'Sponsorship package deleted successfully',
                severity: 'success'
            });
            fetchPackages();
        } catch (error) {
            console.error('Error deleting package:', error);
            setAlert({
                open: true,
                message: 'Failed to delete sponsorship package',
                severity: 'error'
            });
        }
    };

    // Sponsorship status dialog handlers
    const openSponsorshipStatusDialog = (sponsorship) => {
        setSponsorshipStatusDialog({
            open: true,
            sponsorshipId: sponsorship.id,
            currentStatus: sponsorship.status,
            newStatus: sponsorship.status
        });
    };

    const closeSponsorshipStatusDialog = () => {
        setSponsorshipStatusDialog(prev => ({ ...prev, open: false }));
    };

    const handleSponsorshipStatusChange = (e) => {
        setSponsorshipStatusDialog(prev => ({
            ...prev,
            newStatus: e.target.value
        }));
    };

    const updateSponsorshipStatus = async () => {
        try {
            const { sponsorshipId, newStatus } = sponsorshipStatusDialog;
            await sponsorshipService.updateStatus(sponsorshipId, newStatus);
            setAlert({
                open: true,
                message: `Sponsorship status updated to ${newStatus}`,
                severity: 'success'
            });
            closeSponsorshipStatusDialog();
            fetchSponsorships();
        } catch (error) {
            console.error('Error updating sponsorship status:', error);
            setAlert({
                open: true,
                message: 'Failed to update sponsorship status',
                severity: 'error'
            });
        }
    };

    // View details dialog
    const openDetailsDialog = async (sponsorshipId) => {
        try {
            const response = await sponsorshipService.getById(sponsorshipId);
            setSelectedSponsorship(response.data);
            setViewDetailsDialog(true);
        } catch (error) {
            console.error('Error fetching sponsorship details:', error);
            setAlert({
                open: true,
                message: 'Failed to fetch sponsorship details',
                severity: 'error'
            });
        }
    };

    const closeDetailsDialog = () => {
        setViewDetailsDialog(false);
        setSelectedSponsorship(null);
    };

    // Status chip color mapping
    const getStatusColor = (status) => {
        switch (status) {
            case 'pending':
                return 'warning';
            case 'approved':
                return 'success';
            case 'rejected':
                return 'error';
            case 'completed':
                return 'info';
            default:
                return 'default';
        }
    };

    return (
        <Box sx={{ p: 3 }}>
            <Typography variant="h4" sx={{ mb: 3 }}>Sponsorship Management</Typography>

            <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
                <Tabs value={tabValue} onChange={handleTabChange} aria-label="sponsorship management tabs">
                    <Tab label="Sponsorships" id="sponsorship-tab-0" />
                    <Tab label="Sponsorship Packages" id="sponsorship-tab-1" />
                    <Tab label="Sponsor Profiles" id="sponsorship-tab-2" />
                </Tabs>
            </Box>

            {/* Sponsorships Tab */}
            <TabPanel value={tabValue} index={0}>
                <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
                    <Button
                        variant="contained"
                        color="primary"
                        onClick={() => fetchSponsorships()}
                        startIcon={loading.sponsorships ? <CircularProgress size={20} color="inherit" /> : null}
                        disabled={loading.sponsorships}
                    >
                        Refresh
                    </Button>
                </Box>

                {loading.sponsorships ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', my: 5 }}>
                        <CircularProgress />
                    </Box>
                ) : (
                    <TableContainer component={Paper}>
                        <Table sx={{ minWidth: 650 }}>
                            <TableHead>
                                <TableRow>
                                    <TableCell>ID</TableCell>
                                    <TableCell>Sponsor</TableCell>
                                    <TableCell>Event</TableCell>
                                    <TableCell>Package</TableCell>
                                    <TableCell>Amount</TableCell>
                                    <TableCell>Status</TableCell>
                                    <TableCell>Created At</TableCell>
                                    <TableCell align="right">Actions</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {sponsorships.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={8} align="center">
                                            No sponsorships found
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    sponsorships.map((sponsorship) => (
                                        <TableRow key={sponsorship.id}>
                                            <TableCell>{sponsorship.id}</TableCell>
                                            <TableCell>{sponsorship.sponsorName || 'N/A'}</TableCell>
                                            <TableCell>{sponsorship.eventName || 'N/A'}</TableCell>
                                            <TableCell>{sponsorship.packageName || 'N/A'}</TableCell>
                                            <TableCell>${sponsorship.amount}</TableCell>
                                            <TableCell>
                                                <Chip
                                                    label={sponsorship.status}
                                                    color={getStatusColor(sponsorship.status)}
                                                    size="small"
                                                />
                                            </TableCell>
                                            <TableCell>
                                                {new Date(sponsorship.createdAt).toLocaleDateString()}
                                            </TableCell>
                                            <TableCell align="right">
                                                <Tooltip title="View Details">
                                                    <IconButton
                                                        onClick={() => openDetailsDialog(sponsorship.id)}
                                                        size="small"
                                                    >
                                                        <Visibility fontSize="small" />
                                                    </IconButton>
                                                </Tooltip>
                                                <Tooltip title="Update Status">
                                                    <IconButton
                                                        onClick={() => openSponsorshipStatusDialog(sponsorship)}
                                                        size="small"
                                                        color="primary"
                                                    >
                                                        <Edit fontSize="small" />
                                                    </IconButton>
                                                </Tooltip>
                                                <Tooltip title="Payments">
                                                    <IconButton
                                                        size="small"
                                                        color="success"
                                                    >
                                                        <AttachMoney fontSize="small" />
                                                    </IconButton>
                                                </Tooltip>
                                                <Tooltip title="Promotions">
                                                    <IconButton
                                                        size="small"
                                                        color="secondary"
                                                    >
                                                        <Campaign fontSize="small" />
                                                    </IconButton>
                                                </Tooltip>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </TableContainer>
                )}
            </TabPanel>

            {/* Sponsorship Packages Tab */}
            <TabPanel value={tabValue} index={1}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                    <Button
                        variant="contained"
                        color="primary"
                        startIcon={<Add />}
                        onClick={() => openPackageDialog('add')}
                    >
                        Add Package
                    </Button>

                    <Button
                        variant="outlined"
                        color="primary"
                        onClick={() => fetchPackages()}
                        startIcon={loading.packages ? <CircularProgress size={20} color="inherit" /> : null}
                        disabled={loading.packages}
                    >
                        Refresh
                    </Button>
                </Box>

                {loading.packages ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', my: 5 }}>
                        <CircularProgress />
                    </Box>
                ) : (
                    <Grid container spacing={3}>
                        {packages.length === 0 ? (
                            <Grid item xs={12}>
                                <Paper sx={{ p: 3, textAlign: 'center' }}>
                                    <Typography variant="body1">
                                        No sponsorship packages found
                                    </Typography>
                                </Paper>
                            </Grid>
                        ) : (
                            packages.map((pkg) => (
                                <Grid item xs={12} md={6} lg={4} key={pkg.id}>
                                    <Card id={`package-${pkg.id}`}>
                                        <CardHeader
                                            title={pkg.name}
                                            subheader={`$${pkg.price}`}
                                            action={
                                                <Box>
                                                    <Chip
                                                        label={pkg.isActive ? 'Active' : 'Inactive'}
                                                        color={pkg.isActive ? 'success' : 'default'}
                                                        size="small"
                                                        sx={{ mr: 1 }}
                                                    />
                                                    <IconButton
                                                        size="small"
                                                        onClick={() => openPackageDialog('edit', pkg)}
                                                    >
                                                        <Edit fontSize="small" />
                                                    </IconButton>
                                                    <IconButton
                                                        size="small"
                                                        color="error"
                                                        onClick={() => handleDeletePackage(pkg.id)}
                                                    >
                                                        <Delete fontSize="small" />
                                                    </IconButton>
                                                </Box>
                                            }
                                        />
                                        <Divider />
                                        <CardContent>
                                            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                                                {pkg.description}
                                            </Typography>
                                            <Typography variant="subtitle2" sx={{ mt: 2 }}>
                                                Benefits:
                                            </Typography>
                                            <Typography variant="body2">
                                                {pkg.benefits}
                                            </Typography>
                                        </CardContent>
                                    </Card>
                                </Grid>
                            ))
                        )}
                    </Grid>
                )}
            </TabPanel>

            {/* Sponsor Profiles Tab */}
            <TabPanel value={tabValue} index={2}>
                <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
                    <Button
                        variant="contained"
                        color="primary"
                        onClick={() => fetchProfiles()}
                        startIcon={loading.profiles ? <CircularProgress size={20} color="inherit" /> : null}
                        disabled={loading.profiles}
                    >
                        Refresh
                    </Button>
                </Box>

                {loading.profiles ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', my: 5 }}>
                        <CircularProgress />
                    </Box>
                ) : (
                    <TableContainer component={Paper}>
                        <Table sx={{ minWidth: 650 }}>
                            <TableHead>
                                <TableRow>
                                    <TableCell>ID</TableCell>
                                    <TableCell>Name</TableCell>
                                    <TableCell>Company</TableCell>
                                    <TableCell>Email</TableCell>
                                    <TableCell>Contact Person</TableCell>
                                    <TableCell>Website</TableCell>
                                    <TableCell align="right">Actions</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {profiles.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={7} align="center">
                                            No sponsor profiles found
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    profiles.map((profile) => (
                                        <TableRow key={profile.id}>
                                            <TableCell>{profile.id}</TableCell>
                                            <TableCell>{profile.name}</TableCell>
                                            <TableCell>{profile.organization_name || 'N/A'}</TableCell>
                                            <TableCell>{profile.email}</TableCell>
                                            <TableCell>{profile.contact_person || 'N/A'}</TableCell>
                                            <TableCell>
                                                {profile.website ? (
                                                    <a href={profile.website} target="_blank" rel="noopener noreferrer">
                                                        {profile.website}
                                                    </a>
                                                ) : (
                                                    'N/A'
                                                )}
                                            </TableCell>
                                            <TableCell align="right">
                                                <Tooltip title="View Details">
                                                    <IconButton size="small">
                                                        <Visibility fontSize="small" />
                                                    </IconButton>
                                                </Tooltip>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </TableContainer>
                )}
            </TabPanel>

            {/* Package Dialog */}
            <Dialog
                open={packageDialog.open}
                onClose={closePackageDialog}
                maxWidth="sm"
                fullWidth
            >
                <DialogTitle>
                    {packageDialog.mode === 'add' ? 'Add Sponsorship Package' : 'Edit Sponsorship Package'}
                </DialogTitle>
                <DialogContent>
                    <Box sx={{ mt: 2 }}>
                        <TextField
                            label="Package Name"
                            name="name"
                            value={packageDialog.data.name}
                            onChange={handlePackageInputChange}
                            fullWidth
                            margin="normal"
                            required
                        />
                        <TextField
                            label="Description"
                            name="description"
                            value={packageDialog.data.description}
                            onChange={handlePackageInputChange}
                            fullWidth
                            margin="normal"
                            multiline
                            rows={3}
                        />
                        <TextField
                            label="Price"
                            name="price"
                            value={packageDialog.data.price}
                            onChange={handlePackageInputChange}
                            fullWidth
                            margin="normal"
                            type="number"
                            InputProps={{ startAdornment: '$' }}
                            required
                        />
                        <TextField
                            label="Benefits"
                            name="benefits"
                            value={packageDialog.data.benefits}
                            onChange={handlePackageInputChange}
                            fullWidth
                            margin="normal"
                            multiline
                            rows={4}
                        />
                        <FormControl fullWidth margin="normal">
                            <InputLabel id="status-label">Status</InputLabel>
                            <Select
                                labelId="status-label"
                                name="isActive"
                                value={packageDialog.data.isActive}
                                onChange={(e) => handlePackageInputChange({
                                    target: {
                                        name: 'isActive',
                                        checked: e.target.value === 'true'
                                    }
                                })}
                            >
                                <MenuItem value={'true'}>Active</MenuItem>
                                <MenuItem value={'false'}>Inactive</MenuItem>
                            </Select>
                        </FormControl>
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button onClick={closePackageDialog} color="primary">
                        Cancel
                    </Button>
                    <Button onClick={handlePackageSave} color="primary" variant="contained">
                        Save
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Sponsorship Status Dialog */}
            <Dialog
                open={sponsorshipStatusDialog.open}
                onClose={closeSponsorshipStatusDialog}
                maxWidth="xs"
                fullWidth
            >
                <DialogTitle>Update Sponsorship Status</DialogTitle>
                <DialogContent>
                    <Box sx={{ mt: 2 }}>
                        {/* Fix: Changed from Typography to Box+Typography+Box to avoid nesting a div inside p */}
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                            <Typography variant="body2" component="span">
                                Current status:
                            </Typography>
                            <Box component="span" sx={{ ml: 1 }}>
                                <Chip
                                    label={sponsorshipStatusDialog.currentStatus}
                                    color={getStatusColor(sponsorshipStatusDialog.currentStatus)}
                                    size="small"
                                />
                            </Box>
                        </Box>
                        <FormControl fullWidth>
                            <InputLabel id="new-status-label">New Status</InputLabel>
                            <Select
                                labelId="new-status-label"
                                value={sponsorshipStatusDialog.newStatus}
                                onChange={handleSponsorshipStatusChange}
                                label="New Status"
                            >
                                <MenuItem value="pending">Pending</MenuItem>
                                <MenuItem value="approved">Approved</MenuItem>
                                <MenuItem value="rejected">Rejected</MenuItem>
                                <MenuItem value="completed">Completed</MenuItem>
                            </Select>
                        </FormControl>
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button onClick={closeSponsorshipStatusDialog} color="primary">
                        Cancel
                    </Button>
                    <Button
                        onClick={updateSponsorshipStatus}
                        color="primary"
                        variant="contained"
                        disabled={sponsorshipStatusDialog.currentStatus === sponsorshipStatusDialog.newStatus}
                    >
                        Update
                    </Button>
                </DialogActions>
            </Dialog>

            {/* View Sponsorship Details Dialog */}
            <Dialog
                open={viewDetailsDialog}
                onClose={closeDetailsDialog}
                maxWidth="md"
                fullWidth
            >
                {selectedSponsorship ? (
                    <>
                        <DialogTitle>
                            Sponsorship Details
                            <Box component="span" sx={{ display: 'inline-block', ml: 2 }}>
                                <Chip
                                    label={selectedSponsorship.status}
                                    color={getStatusColor(selectedSponsorship.status)}
                                    size="small"
                                />
                            </Box>
                        </DialogTitle>
                        <DialogContent>
                            <Grid container spacing={2} sx={{ mt: 1 }}>
                                <Grid item xs={12} sm={6}>
                                    <Typography variant="subtitle2">Sponsor</Typography>
                                    <Typography variant="body1">{selectedSponsorship.sponsorName}</Typography>
                                </Grid>
                                <Grid item xs={12} sm={6}>
                                    <Typography variant="subtitle2">Event</Typography>
                                    <Typography variant="body1">{selectedSponsorship.eventName}</Typography>
                                </Grid>
                                <Grid item xs={12} sm={6}>
                                    <Typography variant="subtitle2">Package</Typography>
                                    <Typography variant="body1">{selectedSponsorship.packageName}</Typography>
                                </Grid>
                                <Grid item xs={12} sm={6}>
                                    <Typography variant="subtitle2">Amount</Typography>
                                    <Typography variant="body1">${selectedSponsorship.amount}</Typography>
                                </Grid>

                                <Grid item xs={12}>
                                    <Divider sx={{ my: 1 }} />
                                    <Typography variant="subtitle2">Description</Typography>
                                    <Typography variant="body1">
                                        {selectedSponsorship.description || 'No description provided'}
                                    </Typography>
                                </Grid>

                                <Grid item xs={12}>
                                    <Divider sx={{ my: 1 }} />
                                    <Typography variant="subtitle2">Sponsorship Terms</Typography>
                                    <Typography variant="body1">
                                        {selectedSponsorship.terms || 'No terms specified'}
                                    </Typography>
                                </Grid>

                                <Grid item xs={12} sm={6}>
                                    <Typography variant="subtitle2">Created At</Typography>
                                    <Typography variant="body1">
                                        {new Date(selectedSponsorship.createdAt).toLocaleString()}
                                    </Typography>
                                </Grid>
                                <Grid item xs={12} sm={6}>
                                    <Typography variant="subtitle2">Last Updated</Typography>
                                    <Typography variant="body1">
                                        {new Date(selectedSponsorship.updatedAt).toLocaleString()}
                                    </Typography>
                                </Grid>
                            </Grid>

                            {/* Payments and Promotions sections could be added here */}
                        </DialogContent>
                        <DialogActions>
                            <Button
                                startIcon={<CheckCircle />}
                                color="success"
                                variant="contained"
                                disabled={selectedSponsorship.status === 'approved' || selectedSponsorship.status === 'completed'}
                                onClick={() => {
                                    closeDetailsDialog();
                                    setSponsorshipStatusDialog({
                                        open: true,
                                        sponsorshipId: selectedSponsorship.id,
                                        currentStatus: selectedSponsorship.status,
                                        newStatus: 'approved'
                                    });
                                }}
                            >
                                Approve
                            </Button>
                            <Button
                                startIcon={<Cancel />}
                                color="error"
                                variant="contained"
                                disabled={selectedSponsorship.status === 'rejected'}
                                onClick={() => {
                                    closeDetailsDialog();
                                    setSponsorshipStatusDialog({
                                        open: true,
                                        sponsorshipId: selectedSponsorship.id,
                                        currentStatus: selectedSponsorship.status,
                                        newStatus: 'rejected'
                                    });
                                }}
                            >
                                Reject
                            </Button>
                            <Button onClick={closeDetailsDialog} color="primary">
                                Close
                            </Button>
                        </DialogActions>
                    </>
                ) : (
                    <Box sx={{ p: 4, textAlign: 'center' }}>
                        <CircularProgress />
                    </Box>
                )}
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

export default SponsorshipManagement;