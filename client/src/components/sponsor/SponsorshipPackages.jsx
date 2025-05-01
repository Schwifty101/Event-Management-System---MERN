import React, { useState, useEffect } from 'react';
import {
    Container,
    Typography,
    Grid,
    Card,
    CardContent,
    Button,
    Box,
    Chip,
    Divider,
    CircularProgress,
    Alert
} from '@mui/material';
import { Check as CheckIcon, ShoppingCart as CartIcon } from '@mui/icons-material';
import { sponsorPackageService } from '../../services/api';
import { useNavigate } from 'react-router-dom';

const SponsorshipPackages = () => {
    const [packages, setPackages] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchPackages = async () => {
            try {
                setLoading(true);
                const response = await sponsorPackageService.getAll(true);
                // Ensure response.data is an array
                if (Array.isArray(response.data)) {
                    setPackages(response.data);
                } else if (response.data && Array.isArray(response.data.packages)) {
                    // If response.data has a nested packages array
                    setPackages(response.data.packages);
                } else {
                    // Fallback to empty array if data is not in expected format
                    console.error('Unexpected data format:', response.data);
                    setPackages([]);
                    setError('Received unexpected data format from server.');
                }
            } catch (err) {
                setError('Failed to load sponsorship packages. Please try again later.');
                console.error('Error fetching packages:', err);
                setPackages([]); // Ensure packages is an array even on error
            } finally {
                setLoading(false);
            }
        };

        fetchPackages();
    }, []);

    const handleSelectPackage = (packageId) => {
        navigate('/sponsor/sponsorships', { state: { selectedPackageId: packageId } });
    };

    return (
        <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
            <Typography variant="h4" component="h1" gutterBottom>
                Sponsorship Packages
            </Typography>
            <Typography variant="subtitle1" color="text.secondary" gutterBottom>
                Choose the package that fits your organization's goals
            </Typography>

            {loading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', p: 5 }}>
                    <CircularProgress />
                </Box>
            ) : error ? (
                <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>
            ) : packages.length === 0 ? (
                <Alert severity="info" sx={{ mt: 2 }}>No sponsorship packages are currently available. Please check back later or contact the organizers.</Alert>
            ) : (
                <Grid container spacing={4} sx={{ mt: 1 }}>
                    {packages.map((pkg) => (
                        <Grid item xs={12} md={4} key={pkg.id}>
                            <Card
                                elevation={3}
                                sx={{
                                    height: '100%',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    transition: 'all 0.3s',
                                    '&:hover': {
                                        transform: 'translateY(-5px)',
                                        boxShadow: 6
                                    }
                                }}
                            >
                                <Box
                                    sx={{
                                        backgroundColor: pkg.tier === 'platinum' ? '#e5e4e2' :
                                            pkg.tier === 'gold' ? '#ffd700' :
                                                pkg.tier === 'silver' ? '#c0c0c0' :
                                                    pkg.tier === 'bronze' ? '#cd7f32' : 'primary.main',
                                        py: 2,
                                        textAlign: 'center'
                                    }}
                                >
                                    <Typography variant="h5" component="h2" sx={{ fontWeight: 'bold', color: pkg.tier === 'gold' ? 'text.primary' : 'white' }}>
                                        {pkg.name}
                                    </Typography>
                                </Box>

                                <CardContent sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
                                    <Box sx={{ mb: 2, textAlign: 'center' }}>
                                        <Typography variant="h4" component="p" color="primary" sx={{ fontWeight: 'bold' }}>
                                            ${pkg.amount}
                                        </Typography>
                                        {pkg.isLimited && (
                                            <Chip
                                                label={`Limited: ${pkg.availableSlots} available`}
                                                size="small"
                                                color="warning"
                                                sx={{ mt: 1 }}
                                            />
                                        )}
                                    </Box>

                                    <Divider sx={{ my: 2 }} />

                                    <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 1 }}>
                                        Benefits:
                                    </Typography>

                                    <Box sx={{ mb: 2, flexGrow: 1 }}>
                                        {pkg.benefits && pkg.benefits.split(',').map((benefit, index) => (
                                            <Box key={index} sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                                                <CheckIcon color="success" fontSize="small" sx={{ mr: 1 }} />
                                                <Typography variant="body2">{benefit.trim()}</Typography>
                                            </Box>
                                        ))}

                                        {!pkg.benefits && (
                                            <Typography variant="body2">Contact organizers for package details</Typography>
                                        )}
                                    </Box>

                                    <Box sx={{ mt: 'auto' }}>
                                        <Button
                                            variant="contained"
                                            fullWidth
                                            color="primary"
                                            startIcon={<CartIcon />}
                                            onClick={() => handleSelectPackage(pkg.id)}
                                        >
                                            Select Package
                                        </Button>
                                    </Box>
                                </CardContent>
                            </Card>
                        </Grid>
                    ))}
                </Grid>
            )}

            <Box sx={{ mt: 4, textAlign: 'center' }}>
                <Typography variant="body1" mb={2}>
                    Looking for a custom sponsorship option? Contact us to discuss your specific needs.
                </Typography>
                <Button
                    variant="outlined"
                    color="primary"
                    onClick={() => navigate('/sponsor/contracts')}
                >
                    Create Custom Sponsorship
                </Button>
            </Box>
        </Container>
    );
};

export default SponsorshipPackages;