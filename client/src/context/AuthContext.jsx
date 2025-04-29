import { createContext, useContext, useState, useEffect } from 'react';
import { jwtDecode } from 'jwt-decode';
import api, { userService } from '../services/api.js';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const initAuth = async () => {
            const token = localStorage.getItem('token');

            if (token) {
                try {
                    // Verify token is valid
                    const decoded = jwtDecode(token);
                    const currentTime = Date.now() / 1000;

                    if (decoded.exp < currentTime) {
                        // Token expired
                        localStorage.removeItem('token');
                        setUser(null);
                    } else {
                        // Get user data using the token
                        const response = await userService.getProfile();
                        setUser(response.data);
                    }
                } catch (err) {
                    console.error('Authentication error:', err);
                    localStorage.removeItem('token');
                    setError('Session expired. Please login again.');
                }
            }

            setLoading(false);
        };

        initAuth();
    }, []);

    const login = async (credentials) => {
        try {
            setLoading(true);
            const response = await userService.login(credentials);
            const { token, user } = response.data;

            localStorage.setItem('token', token);
            setUser(user);
            setError(null);
            return true;
        } catch (err) {
            setError(err.response?.data?.message || 'Login failed');
            return false;
        } finally {
            setLoading(false);
        }
    };

    const register = async (userData) => {
        try {
            setLoading(true);
            const response = await userService.register(userData);
            const { token, user } = response.data;

            localStorage.setItem('token', token);
            setUser(user);
            setError(null);
            return true;
        } catch (err) {
            setError(err.response?.data?.message || 'Registration failed');
            return false;
        } finally {
            setLoading(false);
        }
    };

    const logout = () => {
        localStorage.removeItem('token');
        setUser(null);
    };

    const value = {
        user,
        loading,
        error,
        login,
        register,
        logout,
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export default AuthProvider;