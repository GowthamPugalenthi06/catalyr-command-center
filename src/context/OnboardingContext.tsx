import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

interface OnboardingStatus {
    isComplete: boolean;
    selectedAgents: string[];
    companyName: string;
    pdfFilename: string;
    hasPdf: boolean;
}

interface OnboardingContextType {
    status: OnboardingStatus;
    isLoading: boolean;
    refresh: () => Promise<void>;
}

const defaultStatus: OnboardingStatus = {
    isComplete: false,
    selectedAgents: [],
    companyName: '',
    pdfFilename: '',
    hasPdf: false,
};

const OnboardingContext = createContext<OnboardingContextType | undefined>(undefined);

const API_URL = '/api/onboarding';

export function OnboardingProvider({ children }: { children: React.ReactNode }) {
    const [status, setStatus] = useState<OnboardingStatus>(() => {
        // Quick check localStorage for cached status
        const cached = localStorage.getItem('catalyr_onboarding');
        if (cached) {
            try {
                return JSON.parse(cached);
            } catch { /* ignore */ }
        }
        return defaultStatus;
    });
    const [isLoading, setIsLoading] = useState(true);

    const refresh = useCallback(async () => {
        try {
            setIsLoading(true);
            const res = await fetch(`${API_URL}/status`);
            if (res.ok) {
                const data = await res.json();
                setStatus(data);
                localStorage.setItem('catalyr_onboarding', JSON.stringify(data));
            }
        } catch (error) {
            console.error('Failed to fetch onboarding status:', error);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        refresh();
    }, [refresh]);

    return (
        <OnboardingContext.Provider value={{ status, isLoading, refresh }}>
            {children}
        </OnboardingContext.Provider>
    );
}

export function useOnboarding() {
    const context = useContext(OnboardingContext);
    if (context === undefined) {
        throw new Error('useOnboarding must be used within an OnboardingProvider');
    }
    return context;
}
