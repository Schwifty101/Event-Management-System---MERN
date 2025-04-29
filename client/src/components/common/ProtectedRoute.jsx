import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import LoadingSpinner from './LoadingSpinner';

// Component to protect routes that require authentication
export const ProtectedRoute = () => {
    const { user, loading } = useAuth();

    if (loading) {
        return <LoadingSpinner />;
    }

    return user ? <Outlet /> : <Navigate to="/login" replace />;
};

// Component to protect routes based on specific roles
export const RoleBasedRoute = ({ allowedRoles }) => {
    const { user, loading } = useAuth();

    if (loading) {
        return <LoadingSpinner />;
    }

    if (!user) {
        return <Navigate to="/login" replace />;
    }

    return allowedRoles.includes(user.role) ? <Outlet /> : <Navigate to="/unauthorized" replace />;
};

export default ProtectedRoute;