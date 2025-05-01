import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
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
import FinanceDashboard from './components/admin/FinanceDashboard';

// Import Sponsor components
import SponsorDashboard from './components/sponsor/SponsorDashboard';
import SponsorProfile from './components/sponsor/SponsorProfile';
import SponsorReports from './components/sponsor/SponsorReports';
import SponsorshipContracts from './components/sponsor/SponsorshipContracts';
import SponsorshipPackages from './components/sponsor/SponsorshipPackages';

// Import Event Management components
import EventManagement from './components/events/EventManagement';
import EventRoundsManagement from './components/events/EventRoundsManagement';
import EventDetails from './components/events/EventDetails';
import JudgingPanel from './components/events/JudgingPanel';

// Import Team Management components
import TeamManagement from './components/teams/TeamManagement';
import TeamCreation from './components/teams/TeamCreation';
import TeamDetails from './components/teams/TeamDetails';

// Import Accommodation Booking components
import AccommodationBooking from './components/accommodation/AccommodationBooking';

// Debug component to show user role
const UserRoleDebug = () => {
    const { user } = useAuth();

    if (!user) return <div>No user logged in</div>;

    return (
        <div style={{
            position: 'fixed',
            bottom: 10,
            right: 10,
            background: '#f0f0f0',
            padding: '10px',
            borderRadius: '5px',
            zIndex: 9999,
            border: '1px solid black'
        }}>
            {/* <h4>Debug Info:</h4>
            <p>User Name: {user.name}</p>
            <p>User Role: {user.role}</p> */}
        </div>
    );
};

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
                    {/* Add the debug component here */}
                    <UserRoleDebug />
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
                                    <Route path="/admin/finance" element={<FinanceDashboard />} />
                                    <Route path="/admin/events" element={<EventManagement />} />
                                    <Route path="/admin/teams" element={<TeamManagement />} />
                                </Route>

                                {/* Organizer routes */}
                                <Route element={<RoleBasedRoute allowedRoles={['organizer']} />}>
                                    <Route path="/organizer/dashboard" element={<div>Organizer Dashboard</div>} />
                                    <Route path="/organizer/events" element={<EventManagement />} />
                                    <Route path="/organizer/teams" element={<TeamManagement />} />
                                    <Route path="/organizer/finance" element={<FinanceDashboard />} />
                                </Route>

                                {/* Judge routes */}
                                <Route element={<RoleBasedRoute allowedRoles={['judge']} />}>
                                    <Route path="/judge/dashboard" element={<div>Judge Dashboard</div>} />
                                    <Route path="/judge/events" element={<div>Assigned Events</div>} />
                                    <Route path="/judge/rounds/:roundId/scoring" element={<JudgingPanel />} />
                                </Route>

                                {/* Sponsor routes */}
                                <Route element={<RoleBasedRoute allowedRoles={['sponsor']} />}>
                                    <Route path="/sponsor/dashboard" element={<SponsorDashboard />} />
                                    <Route path="/sponsor/profile" element={<SponsorProfile />} />
                                    <Route path="/sponsor/contracts" element={<SponsorshipContracts />} />
                                    <Route path="/sponsor/packages" element={<SponsorshipPackages />} />
                                    <Route path="/sponsor/reports" element={<SponsorReports />} />
                                </Route>

                                {/* Participant routes */}
                                <Route element={<RoleBasedRoute allowedRoles={['participant']} />}>
                                    <Route path="/participant/dashboard" element={<div>Participant Dashboard</div>} />
                                    <Route path="/participant/events" element={<div>Browse Events</div>} />
                                    <Route path="/participant/teams" element={<TeamManagement />} />
                                    <Route path="/participant/bookings" element={<div>My Bookings</div>} />
                                </Route>

                                {/* Common Event Management routes for admin and organizers */}
                                <Route element={<RoleBasedRoute allowedRoles={['admin', 'organizer']} />}>
                                    <Route path="/events/:eventId/rounds" element={<EventRoundsManagement />} />
                                    <Route path="/events/manage" element={<EventManagement />} />
                                    <Route path="/events/create-team-event" element={<EventManagement createTeamEvent={true} />} />
                                </Route>

                                {/* Team Management routes accessible to all authenticated users */}
                                <Route path="/teams" element={<TeamManagement />} />
                                <Route path="/teams/create" element={<TeamCreation />} />
                                <Route path="/teams/:id" element={<TeamDetails />} />

                                {/* Accommodation Booking routes */}
                                <Route path="/accommodations" element={<div>Browse Accommodations</div>} />
                                <Route path="/accommodations/booking" element={<AccommodationBooking />} />
                                <Route path="/accommodations/booking/:eventId" element={<AccommodationBooking />} />
                                <Route path="/user/bookings" element={<div>My Bookings</div>} />

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
