// Authentication Context Provider
import React, { createContext, useContext, useState, useEffect } from 'react';
import {
    subscribeToAuthState,
    signInWithGoogle,
    signOut,
    initializeDefaultRoles,
} from '../services/firebase';

// Create Auth Context
const AuthContext = createContext(null);

// Auth Provider Component
export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        // Initialize default roles on first load
        initializeDefaultRoles().catch(console.error);

        // Subscribe to auth state changes
        const unsubscribe = subscribeToAuthState((userData) => {
            setUser(userData);
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    // Handle Google sign in
    const handleSignInWithGoogle = async () => {
        try {
            setError(null);
            setLoading(true);
            const userData = await signInWithGoogle();
            setUser(userData);
        } catch (err) {
            console.error('Sign in error:', err);
            setError(err.message || '登入失敗，請稍後再試');
        } finally {
            setLoading(false);
        }
    };

    // Handle sign out
    const handleSignOut = async () => {
        try {
            setLoading(true);
            await signOut();
            setUser(null);
        } catch (err) {
            console.error('Sign out error:', err);
            setError(err.message || '登出失敗');
        } finally {
            setLoading(false);
        }
    };

    // Check if user can access a page
    const canAccessPage = (pageId) => {
        if (!user) return false;
        return user.allowedPages?.includes(pageId) || false;
    };

    // Context value
    const value = {
        user,
        loading,
        error,
        isAuthenticated: !!user,
        role: user?.role || null,
        allowedPages: user?.allowedPages || [],
        roleLevel: user?.roleLevel || 0,
        signInWithGoogle: handleSignInWithGoogle,
        signOut: handleSignOut,
        canAccessPage,
        clearError: () => setError(null),
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};

// Custom hook to use Auth Context
export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

export default AuthContext;
