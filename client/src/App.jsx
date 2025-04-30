import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ProtectedRoute, RoleBasedRoute } from './components/common/ProtectedRoute';
import MainLayout from './components/layout/MainLayout';
import LoginForm from './components/auth/LoginForm';
import RegisterForm from './components/auth/RegisterForm';
import DashboardRouter from './components/dashboard/DashboardRouter';
import LoadingSpinner from './components/common/LoadingSpinner';
import { createTheme, ThemeProvider, CssBaseline } from '@mui/material';

// Import Admin components
import AdminDashboard from './components/admin/AdminDashboard';
import UserManagement from './components/admin/UserManagement';
import RolePermissionManagement from './components/admin/RolePermissionManagement';
import AnalyticsDashboard from './components/admin/AnalyticsDashboard';

// Import Event Management components
import EventManagement from './components/events/EventManagement';
import EventRoundsManagement from './components/events/EventRoundsManagement'; import EventDetails from './components/events/EventDetails';
import JudgingPanel from './components/events/JudgingPanel';

// Create a theme
const theme = createTheme({
    palette: {
        primary: {
            main: '#1976d2',
        },
        secondary: {
            main: '#dc004e',
        },
        background: {
            default: '#f5f5f5',
        },
    },
    typography: {
        fontFamily: [
            '-apple-system',
            'BlinkMacSystemFont',
            '"Segoe UI"',
            'Roboto',
            '"Helvetica Neue"',
            'Arial',
            'sans-serif',
            '"Apple Color Emoji"',
            '"Segoe UI Emoji"',
            '"Segoe UI Symbol"',
        ].join(','),
    },
    components: {
        MuiCssBaseline: {
            styleOverrides: {
                body: {
                    backgroundColor: '#f5f5f5',
                },
            },
        },
    },
});

function App() {
    return (
        <ThemeProvider theme={theme}>
            <CssBaseline />
            <AuthProvider>
                <BrowserRouter>
                    <Routes>
                        {/* Public routes */}
                        <Route path="/login" element={<LoginForm />} />
                        <Route path="/register" element={<RegisterForm />} />
                        <Route path="/loading" element={<LoadingSpinner />} />

                        {/* Dashboard router */}
                        <Route path="/dashboard" element={<DashboardRouter />} />

                        {/* Protected routes with main layout */}
                        <Route element={<ProtectedRoute />}>
                            <Route element={<MainLayout />}>
                                {/* Admin routes */}
                                <Route element={<RoleBasedRoute allowedRoles={['admin']} />}>
                                    <Route path="/admin/dashboard" element={<AdminDashboard />} />
                                    <Route path="/admin/users" element={<UserManagement />} />
                                    <Route path="/admin/permissions" element={<RolePermissionManagement />} />
                                    <Route path="/admin/analytics" element={<AnalyticsDashboard />} />
                                    <Route path="/admin/events" element={<EventManagement />} />
                                    <Route path="/admin/teams" element={<div>Manage Teams</div>} />
                                </Route>

                                {/* Organizer routes */}
                                <Route element={<RoleBasedRoute allowedRoles={['organizer']} />}>
                                    <Route path="/organizer/dashboard" element={<div>Organizer Dashboard</div>} />
                                    <Route path="/organizer/events" element={<EventManagement />} />
                                </Route>

                                {/* Judge routes */}
                                <Route element={<RoleBasedRoute allowedRoles={['judge']} />}>
                                    <Route path="/judge/dashboard" element={<div>Judge Dashboard</div>} />
                                    <Route path="/judge/events" element={<div>Assigned Events</div>} />
                                    <Route path="/judge/rounds/:roundId/scoring" element={<JudgingPanel />} />
                                </Route>

                                {/* Sponsor routes */}
                                <Route element={<RoleBasedRoute allowedRoles={['sponsor']} />}>
                                    <Route path="/sponsor/dashboard" element={<div>Sponsor Dashboard</div>} />
                                    <Route path="/sponsor/sponsorships" element={<div>Manage Sponsorships</div>} />
                                </Route>

                                {/* Participant routes */}
                                <Route element={<RoleBasedRoute allowedRoles={['participant']} />}>
                                    <Route path="/participant/dashboard" element={<div>Participant Dashboard</div>} />
                                    <Route path="/participant/events" element={<div>Browse Events</div>} />
                                    <Route path="/participant/team" element={<div>Team Management</div>} />
                                </Route>

                                {/* Common Event Management routes for admin and organizers */}
                                <Route element={<RoleBasedRoute allowedRoles={['admin', 'organizer']} />}>
                                    <Route path="/events/:eventId/rounds" element={<EventRoundsManagement />} />
                                </Route>

                                {/* Routes accessible to all authenticated users */}
                                <Route path="/events" element={<div>All Events</div>} />
                                <Route path="/events/:eventId" element={<EventDetails />} />

                                {/* Common protected routes */}
                                <Route path="/profile" element={<div>User Profile</div>} />
                                <Route path="/unauthorized" element={<div>Access Denied</div>} />
                            </Route>
                        </Route>

                        {/* Redirect to dashboard from root */}
                        <Route path="/" element={<Navigate to="/dashboard" replace />} />

                        {/* 404 Not Found */}
                        <Route path="*" element={<div>Page Not Found</div>} />
                    </Routes>
                </BrowserRouter>
            </AuthProvider>
        </ThemeProvider>
    );
}

export default App;
