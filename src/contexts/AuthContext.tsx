import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User } from 'firebase/auth';
import { onAuthChange, getUserProfile, saveUserProfile } from '../services/authService';
import { UserProfile } from '../types';

interface AuthContextType {
    user: User | null;
    profile: UserProfile | null;
    loading: boolean;
    setProfile: (profile: UserProfile | null) => void;
    updateAndSaveProfile: (profile: UserProfile) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

interface AuthProviderProps {
    children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const unsubscribe = onAuthChange(async (firebaseUser) => {
            setUser(firebaseUser);

            if (firebaseUser) {
                // User is signed in, try to load their profile
                try {
                    const savedProfile = await getUserProfile(firebaseUser.uid);
                    setProfile(savedProfile);
                } catch (error) {
                    console.error('Error loading profile:', error);
                }
            } else {
                setProfile(null);
            }

            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    const updateAndSaveProfile = async (newProfile: UserProfile) => {
        if (!user) throw new Error('No user logged in');
        await saveUserProfile(user.uid, newProfile);
        setProfile(newProfile);
    };

    return (
        <AuthContext.Provider value={{ user, profile, loading, setProfile, updateAndSaveProfile }}>
            {children}
        </AuthContext.Provider>
    );
};
