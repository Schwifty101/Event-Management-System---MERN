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
    TablePagination,
    Button,
    IconButton,
    TextField,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Chip,
    Snackbar,
    Alert,
    Tooltip,
    CircularProgress
} from '@mui/material';
import { Edit, Delete, Add, Search, Refresh } from '@mui/icons-material';
import axios from 'axios';

const UserManagement = () => {
    // State for users data
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const [totalUsers, setTotalUsers] = useState(0);
    const [searchQuery, setSearchQuery] = useState('');

    // State for role filter
    const [roleFilter, setRoleFilter] = useState('');

    // State for user dialog
    const [userDialogOpen, setUserDialogOpen] = useState(false);
    const [dialogMode, setDialogMode] = useState('add'); // 'add' or 'edit'
    const [currentUser, setCurrentUser] = useState({
        name: '',
        email: '',
        role: 'participant',
        password: '' // Only used for new users
    });

    // State for delete confirmation
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [userToDelete, setUserToDelete] = useState(null);

    // State for alerts
    const [alert, setAlert] = useState({ open: false, message: '', severity: 'success' });

    // Fetch users on component mount and when filters change
    useEffect(() => {
        fetchUsers();
    }, [page, rowsPerPage, roleFilter]);

    // Fetch users from the API
    const fetchUsers = async () => {
        try {
            setLoading(true);
            const params = new URLSearchParams({
                page: page + 1, // API uses 1-based indexing
                limit: rowsPerPage
            });

            if (roleFilter) {
                params.append('role', roleFilter);
            }

            if (searchQuery) {
                params.append('search', searchQuery);
            }

            const response = await axios.get(`/api/users?${params}`, {
                headers: {
                    Authorization: `Bearer ${localStorage.getItem('token')}`
                }
            });

            setUsers(response.data.users);
            setTotalUsers(response.data.meta.total || response.data.users.length);
            setLoading(false);
        } catch (error) {
            console.error('Error fetching users:', error);
            setAlert({
                open: true,
                message: 'Failed to fetch users. Please try again.',
                severity: 'error'
            });
            setLoading(false);
        }
    };

    // Handle search
    const handleSearch = () => {
        setPage(0); // Reset to first page when searching
        fetchUsers();
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

    // Open dialog for adding a new user
    const handleAddUser = () => {
        setCurrentUser({
            name: '',
            email: '',
            role: 'participant',
            password: ''
        });
        setDialogMode('add');
        setUserDialogOpen(true);
    };

    // Open dialog for editing a user
    const handleEditUser = (user) => {
        setCurrentUser({
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role
        });
        setDialogMode('edit');
        setUserDialogOpen(true);
    };

    // Open dialog for deleting a user
    const handleDeleteDialog = (user) => {
        setUserToDelete(user);
        setDeleteDialogOpen(true);
    };

    // Handle form input changes
    const handleInputChange = (e) => {
        setCurrentUser({
            ...currentUser,
            [e.target.name]: e.target.value
        });
    };

    // Submit user form (add or edit)
    const handleUserSubmit = async () => {
        try {
            if (dialogMode === 'add') {
                // Create new user
                await axios.post('/api/users', currentUser, {
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem('token')}`
                    }
                });
                setAlert({
                    open: true,
                    message: 'User created successfully!',
                    severity: 'success'
                });
            } else {
                // Edit existing user
                await axios.put(`/api/users/${currentUser.id}`, currentUser, {
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem('token')}`
                    }
                });
                setAlert({
                    open: true,
                    message: 'User updated successfully!',
                    severity: 'success'
                });
            }
            setUserDialogOpen(false);
            fetchUsers(); // Refresh user list
        } catch (error) {
            console.error('Error saving user:', error);
            setAlert({
                open: true,
                message: `Failed to ${dialogMode === 'add' ? 'create' : 'update'} user: ${error.response?.data?.message || error.message}`,
                severity: 'error'
            });
        }
    };

    // Delete a user
    const handleDeleteUser = async () => {
        try {
            await axios.delete(`/api/users/${userToDelete.id}`, {
                headers: {
                    Authorization: `Bearer ${localStorage.getItem('token')}`
                }
            });
            setAlert({
                open: true,
                message: 'User deleted successfully!',
                severity: 'success'
            });
            setDeleteDialogOpen(false);
            fetchUsers(); // Refresh user list
        } catch (error) {
            console.error('Error deleting user:', error);
            setAlert({
                open: true,
                message: `Failed to delete user: ${error.response?.data?.message || error.message}`,
                severity: 'error'
            });
        }
    };

    // Get color for role chip
    const getRoleColor = (role) => {
        switch (role) {
            case 'admin': return 'error';
            case 'organizer': return 'primary';
            case 'judge': return 'secondary';
            case 'sponsor': return 'warning';
            default: return 'default';
        }
    };

    return (
        <Box sx={{ p: 3 }}>
            <Typography variant="h4" sx={{ mb: 3 }}>User Management</Typography>

            {/* Search and filter controls */}
            <Paper sx={{ p: 2, mb: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
                    <TextField
                        label="Search users"
                        variant="outlined"
                        size="small"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        sx={{ flexGrow: 1, maxWidth: 300 }}
                        onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                    />

                    <FormControl size="small" sx={{ minWidth: 150 }}>
                        <InputLabel id="role-filter-label">Filter by Role</InputLabel>
                        <Select
                            labelId="role-filter-label"
                            value={roleFilter}
                            label="Filter by Role"
                            onChange={(e) => setRoleFilter(e.target.value)}
                        >
                            <MenuItem value="">All Roles</MenuItem>
                            <MenuItem value="admin">Admin</MenuItem>
                            <MenuItem value="organizer">Organizer</MenuItem>
                            <MenuItem value="judge">Judge</MenuItem>
                            <MenuItem value="sponsor">Sponsor</MenuItem>
                            <MenuItem value="participant">Participant</MenuItem>
                        </Select>
                    </FormControl>

                    <Button
                        variant="contained"
                        startIcon={<Search />}
                        onClick={handleSearch}
                        size="medium"
                    >
                        Search
                    </Button>

                    <Button
                        variant="outlined"
                        startIcon={<Refresh />}
                        onClick={() => {
                            setSearchQuery('');
                            setRoleFilter('');
                            setPage(0);
                            fetchUsers();
                        }}
                        size="medium"
                    >
                        Reset
                    </Button>

                    <Button
                        variant="contained"
                        color="primary"
                        startIcon={<Add />}
                        onClick={handleAddUser}
                        sx={{ ml: 'auto' }}
                        size="medium"
                    >
                        Add User
                    </Button>
                </Box>
            </Paper>

            {/* Users table */}
            <Paper>
                <TableContainer>
                    <Table>
                        <TableHead>
                            <TableRow>
                                <TableCell>ID</TableCell>
                                <TableCell>Name</TableCell>
                                <TableCell>Email</TableCell>
                                <TableCell>Role</TableCell>
                                <TableCell>Created At</TableCell>
                                <TableCell align="center">Actions</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {loading ? (
                                <TableRow>
                                    <TableCell colSpan={6} align="center">
                                        <CircularProgress size={24} />
                                        <Typography variant="body2" sx={{ ml: 1 }}>Loading users...</Typography>
                                    </TableCell>
                                </TableRow>
                            ) : users.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6} align="center">
                                        No users found
                                    </TableCell>
                                </TableRow>
                            ) : (
                                users.map((user) => (
                                    <TableRow key={user.id}>
                                        <TableCell>{user.id}</TableCell>
                                        <TableCell>{user.name}</TableCell>
                                        <TableCell>{user.email}</TableCell>
                                        <TableCell>
                                            <Chip
                                                label={user.role}
                                                color={getRoleColor(user.role)}
                                                size="small"
                                            />
                                        </TableCell>
                                        <TableCell>
                                            {new Date(user.created_at).toLocaleDateString()}
                                        </TableCell>
                                        <TableCell align="center">
                                            <Tooltip title="Edit User">
                                                <IconButton
                                                    size="small"
                                                    color="primary"
                                                    onClick={() => handleEditUser(user)}
                                                >
                                                    <Edit />
                                                </IconButton>
                                            </Tooltip>
                                            <Tooltip title="Delete User">
                                                <IconButton
                                                    size="small"
                                                    color="error"
                                                    onClick={() => handleDeleteDialog(user)}
                                                    disabled={user.role === 'admin'} // Prevent deleting admins
                                                >
                                                    <Delete />
                                                </IconButton>
                                            </Tooltip>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </TableContainer>

                <TablePagination
                    rowsPerPageOptions={[5, 10, 25]}
                    component="div"
                    count={totalUsers}
                    rowsPerPage={rowsPerPage}
                    page={page}
                    onPageChange={handleChangePage}
                    onRowsPerPageChange={handleChangeRowsPerPage}
                />
            </Paper>

            {/* Add/Edit User Dialog */}
            <Dialog open={userDialogOpen} onClose={() => setUserDialogOpen(false)} maxWidth="sm" fullWidth>
                <DialogTitle>
                    {dialogMode === 'add' ? 'Add New User' : 'Edit User'}
                </DialogTitle>
                <DialogContent>
                    <Box component="form" sx={{ mt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
                        <TextField
                            name="name"
                            label="Full Name"
                            fullWidth
                            value={currentUser.name}
                            onChange={handleInputChange}
                            required
                        />
                        <TextField
                            name="email"
                            label="Email Address"
                            type="email"
                            fullWidth
                            value={currentUser.email}
                            onChange={handleInputChange}
                            required
                        />
                        {dialogMode === 'add' && (
                            <TextField
                                name="password"
                                label="Password"
                                type="password"
                                fullWidth
                                value={currentUser.password}
                                onChange={handleInputChange}
                                required
                            />
                        )}
                        <FormControl fullWidth>
                            <InputLabel id="user-role-label">Role</InputLabel>
                            <Select
                                labelId="user-role-label"
                                name="role"
                                value={currentUser.role}
                                label="Role"
                                onChange={handleInputChange}
                            >
                                <MenuItem value="admin">Admin</MenuItem>
                                <MenuItem value="organizer">Organizer</MenuItem>
                                <MenuItem value="judge">Judge</MenuItem>
                                <MenuItem value="sponsor">Sponsor</MenuItem>
                                <MenuItem value="participant">Participant</MenuItem>
                            </Select>
                        </FormControl>
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setUserDialogOpen(false)}>Cancel</Button>
                    <Button onClick={handleUserSubmit} variant="contained" color="primary">
                        {dialogMode === 'add' ? 'Add User' : 'Save Changes'}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Delete Confirmation Dialog */}
            <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
                <DialogTitle>Confirm Delete</DialogTitle>
                <DialogContent>
                    <Typography>
                        Are you sure you want to delete the user "{userToDelete?.name}"? This action cannot be undone.
                    </Typography>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
                    <Button onClick={handleDeleteUser} variant="contained" color="error">
                        Delete
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

export default UserManagement;