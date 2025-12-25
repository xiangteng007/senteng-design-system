// Login Page Component
import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';

const LoginPage = () => {
    const { signInWithGoogle, loading, error, clearError } = useAuth();
    const [isHovered, setIsHovered] = useState(null);

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 via-gray-100 to-gray-200 flex items-center justify-center p-4">
            {/* Background decoration */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-gray-300/20 rounded-full blur-3xl" />
                <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-gray-400/20 rounded-full blur-3xl" />
            </div>

            {/* Login Card */}
            <div className="relative z-10 w-full max-w-md">
                <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/50 p-8 md:p-10">
                    {/* Logo */}
                    <div className="text-center mb-8">
                        <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-gray-800 to-gray-700 rounded-2xl shadow-lg mb-4">
                            <span className="text-2xl font-bold text-white">S</span>
                        </div>
                        <h1 className="text-2xl font-bold text-gray-800 tracking-tight">SENTENG</h1>
                        <p className="text-sm text-gray-500 mt-1">Design System 登入</p>
                    </div>

                    {/* Divider */}
                    <div className="relative mb-8">
                        <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t border-gray-200" />
                        </div>
                        <div className="relative flex justify-center text-sm">
                            <span className="px-4 bg-white/80 text-gray-400">選擇登入方式</span>
                        </div>
                    </div>

                    {/* Error Message */}
                    {error && (
                        <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-xl">
                            <p className="text-sm text-red-600 text-center">{error}</p>
                            <button
                                onClick={clearError}
                                className="mt-2 text-xs text-red-400 hover:text-red-600 w-full text-center"
                            >
                                關閉
                            </button>
                        </div>
                    )}

                    {/* Login Buttons */}
                    <div className="space-y-4">
                        {/* Google Login Button */}
                        <button
                            onClick={signInWithGoogle}
                            disabled={loading}
                            onMouseEnter={() => setIsHovered('google')}
                            onMouseLeave={() => setIsHovered(null)}
                            className={`
                w-full flex items-center justify-center gap-3 px-6 py-4 rounded-xl
                bg-white border-2 border-gray-200 
                text-gray-700 font-medium
                transition-all duration-300 ease-out
                hover:border-gray-300 hover:shadow-lg hover:scale-[1.02]
                disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100
                ${isHovered === 'google' ? 'shadow-lg' : 'shadow-sm'}
              `}
                        >
                            {loading ? (
                                <div className="w-5 h-5 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin" />
                            ) : (
                                <svg width="20" height="20" viewBox="0 0 24 24">
                                    <path
                                        fill="#4285F4"
                                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                                    />
                                    <path
                                        fill="#34A853"
                                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                                    />
                                    <path
                                        fill="#FBBC05"
                                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                                    />
                                    <path
                                        fill="#EA4335"
                                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                                    />
                                </svg>
                            )}
                            <span>使用 Google 登入</span>
                        </button>

                        {/* LINE Login Button (placeholder for future implementation) */}
                        <button
                            disabled={true}
                            onMouseEnter={() => setIsHovered('line')}
                            onMouseLeave={() => setIsHovered(null)}
                            className={`
                w-full flex items-center justify-center gap-3 px-6 py-4 rounded-xl
                bg-[#00B900] border-2 border-[#00B900]
                text-white font-medium
                transition-all duration-300 ease-out
                opacity-50 cursor-not-allowed
              `}
                        >
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="white">
                                <path d="M12 2C6.48 2 2 5.64 2 10.14c0 2.22 1.1 4.28 2.91 5.89.23.2.37.48.37.78l-.07 2.87c-.02.39.34.68.71.56l3.28-1.09c.17-.06.35-.07.53-.03 1.09.25 2.22.38 3.37.38 5.52 0 10-3.64 10-8.14S17.52 2 12 2zm-3 10.5c0 .28-.22.5-.5.5H6c-.28 0-.5-.22-.5-.5v-5c0-.28.22-.5.5-.5s.5.22.5.5v4.5h2c.28 0 .5.22.5.5zm2 0c0 .28-.22.5-.5.5s-.5-.22-.5-.5v-5c0-.28.22-.5.5-.5s.5.22.5.5v5zm5 0c0 .23-.15.42-.36.49-.05.01-.1.01-.14.01-.16 0-.31-.08-.41-.21L13 10.2v2.3c0 .28-.22.5-.5.5s-.5-.22-.5-.5v-5c0-.23.15-.42.36-.49.21-.07.44.02.55.2L15 9.8V7.5c0-.28.22-.5.5-.5s.5.22.5.5v5zm3-.5h-2v-4.5c0-.28-.22-.5-.5-.5s-.5.22-.5.5v5c0 .28.22.5.5.5h2.5c.28 0 .5-.22.5-.5s-.22-.5-.5-.5z" />
                            </svg>
                            <span>使用 LINE 登入（即將開放）</span>
                        </button>
                    </div>

                    {/* Footer */}
                    <div className="mt-8 text-center">
                        <p className="text-xs text-gray-400">
                            登入即表示您同意我們的服務條款與隱私政策
                        </p>
                    </div>
                </div>

                {/* Version */}
                <div className="text-center mt-6">
                    <span className="text-xs text-gray-400">v3.2.0 Premium</span>
                </div>
            </div>
        </div>
    );
};

export default LoginPage;
