import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import LoadingSpinner from '../common/LoadingSpinner';

const DashboardRouter = () => {
    const { user, loading } = useAuth();

    // Show loading spinner while auth state is loading
    if (loading) {
        return <LoadingSpinner />;
    }

    // Check user role and redirect accordingly
    if (!user) {
        return <Navigate to="/login" replace />;
    }

    // Role-based dashboard redirections
    switch (user.role) {
        case 'admin':
            return <Navigate to="/admin/dashboard" replace />;
        case 'organizer':
            return <Navigate to="/organizer/dashboard" replace />;
        case 'judge':
            return <Navigate to="/judge/dashboard" replace />;
        case 'sponsor':
            return <Navigate to="/sponsor/dashboard" replace />;
        case 'participant':
            return <Navigate to="/participant/dashboard" replace />;
        default:
            return <Navigate to="/unauthorized" replace />;
    }
};

export default DashboardRouter;