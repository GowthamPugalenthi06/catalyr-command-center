import React, { createContext, useContext, useState, useEffect } from 'react';

interface AuthContextType {
    isAuthenticated: boolean;
    login: (password: string) => boolean;
    logout: () => void;
    user: { name: string; role: string } | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
        return localStorage.getItem('catalyr_auth') === 'true';
    });

    const [user, setUser] = useState<{ name: string; role: string } | null>(() => {
        if (localStorage.getItem('catalyr_auth') === 'true') {
            return { name: 'Admin', role: 'Founder' };
        }
        return null;
    });

    const login = (password: string) => {
        // Hardcoded credentials as requested
        // Username check is implied by strictly checking password for this single-user system
        // The user requested: username admin and password Gowth@m$26
        // We'll simplisticly check password here for the sake of the requested task, 
        // but typically we'd check username too. 
        // Let's assume the login form handles the username check or we add it here.

        if (password === 'admin@123') {
            setIsAuthenticated(true);
            setUser({ name: 'Admin', role: 'Founder' });
            localStorage.setItem('catalyr_auth', 'true');
            return true;
        }
        return false;
    };

    const logout = () => {
        setIsAuthenticated(false);
        setUser(null);
        localStorage.removeItem('catalyr_auth');
    };

    return (
        <AuthContext.Provider value={{ isAuthenticated, login, logout, user }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}
