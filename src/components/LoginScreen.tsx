import React, { useState } from 'react';
import { signInWithGoogle } from '../services/authService';

interface LoginScreenProps {
    onLoginSuccess: () => void;
}

const LoginScreen: React.FC<LoginScreenProps> = ({ onLoginSuccess }) => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleGoogleLogin = async () => {
        setLoading(true);
        setError(null);
        try {
            await signInWithGoogle();
            onLoginSuccess();
        } catch (err: any) {
            setError(err.message || 'Failed to sign in');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center p-6">
            <div className="glass-card p-12 rounded-[50px] max-w-md w-full text-center space-y-8 border-l-[12px] border-blue-600">
                {/* Logo */}
                <div className="space-y-4">
                    <div className="w-24 h-24 mx-auto bg-gradient-to-br from-blue-500 to-cyan-400 rounded-3xl flex items-center justify-center shadow-2xl">
                        <svg className="w-14 h-14 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z" />
                        </svg>
                    </div>
                    <h1 className="text-4xl font-black text-slate-900 tracking-tight">PureAir Pro</h1>
                    <p className="text-slate-500 font-medium">Smart Environmental OS</p>
                </div>

                {/* Features */}
                <div className="space-y-3 text-left bg-slate-50 p-6 rounded-3xl">
                    <div className="flex items-center gap-3">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        <span className="text-sm text-slate-700">Real-time AQI monitoring</span>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                        <span className="text-sm text-slate-700">AI-powered health insights</span>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                        <span className="text-sm text-slate-700">Personal exposure tracking</span>
                    </div>
                </div>

                {/* Error message */}
                {error && (
                    <div className="bg-red-100 text-red-700 px-4 py-3 rounded-2xl text-sm font-medium">
                        {error}
                    </div>
                )}

                {/* Google Sign In Button */}
                <button
                    onClick={handleGoogleLogin}
                    disabled={loading}
                    className="w-full flex items-center justify-center gap-4 bg-white border-2 border-slate-200 hover:border-blue-500 px-8 py-5 rounded-2xl font-bold text-slate-800 transition-all hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {loading ? (
                        <div className="w-6 h-6 border-3 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                    ) : (
                        <>
                            <svg className="w-6 h-6" viewBox="0 0 24 24">
                                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                            </svg>
                            <span>Continue with Google</span>
                        </>
                    )}
                </button>

                <p className="text-xs text-slate-400">
                    By signing in, you agree to our Terms of Service
                </p>
            </div>
        </div>
    );
};

export default LoginScreen;
