'use client';

import { useState } from 'react';
import { MessageCircle, Mail, ArrowLeft } from 'lucide-react';

export default function SignIn() {
  const [method, setMethod] = useState<'whatsapp' | 'email'>('whatsapp');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState<'phone' | 'otp'>('phone');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [countryCode, setCountryCode] = useState('+91');

  const countries = [
    { code: '+91', flag: '🇮🇳', name: 'India' },
    { code: '+1', flag: '🇺🇸', name: 'USA' },
    { code: '+44', flag: '🇬🇧', name: 'UK' },
    { code: '+61', flag: '🇦🇺', name: 'Australia' },
    { code: '+81', flag: '🇯🇵', name: 'Japan' },
    { code: '+49', flag: '🇩🇪', name: 'Germany' },
    { code: '+33', flag: '🇫🇷', name: 'France' },
    { code: '+86', flag: '🇨🇳', name: 'China' },
    { code: '+55', flag: '🇧🇷', name: 'Brazil' },
    { code: '+971', flag: '🇦🇪', name: 'UAE' },
  ];

  const [showCountryPicker, setShowCountryPicker] = useState(false);

  const handleSendOtp = async () => {
    if (phoneNumber.length < 6) {
      setMessage('Please enter a valid phone number');
      return;
    }
    setLoading(true);
    setMessage('');

    try {
      const res = await fetch('/api/auth/whatsapp/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phoneNumber: `${countryCode}${phoneNumber}`,
        }),
      });
      const data = await res.json();

      if (res.ok) {
        setStep('otp');
        setMessage(data.developmentOtp ? `Dev OTP: ${data.developmentOtp}` : 'OTP sent! Check your WhatsApp.');
      } else {
        setMessage(data.error || 'Failed to send OTP');
      }
    } catch {
      setMessage('Network error. Please try again.');
    }
    setLoading(false);
  };

  const handleVerifyOtp = async () => {
    if (otp.length !== 6) {
      setMessage('Please enter the 6-digit OTP');
      return;
    }
    setLoading(true);
    setMessage('');

    try {
      const res = await fetch('/api/auth/whatsapp/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phoneNumber: `${countryCode}${phoneNumber}`,
          otp,
        }),
      });
      const data = await res.json();

      if (res.ok) {
        // Store session token and redirect
        localStorage.setItem('sessionToken', data.sessionToken);
        localStorage.setItem('phoneNumber', data.phoneNumber);
        // Redirect to home
        window.location.href = '/';
      } else {
        setMessage(data.error || 'Invalid OTP');
      }
    } catch {
      setMessage('Network error. Please try again.');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-indigo-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800 flex flex-col">
      {/* Header */}
      <div className="px-4 py-4">
        <button className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors">
          <ArrowLeft className="w-5 h-5" />
          <span className="text-sm font-medium">Back</span>
        </button>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 max-w-md mx-auto w-full">
        {/* Logo */}
        <div className="w-16 h-16 bg-gradient-to-br from-purple-600 to-indigo-600 rounded-2xl flex items-center justify-center mb-6 shadow-lg shadow-purple-500/20">
          <span className="text-white text-2xl font-bold">M</span>
        </div>

        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          Welcome to MovieChoice
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-8 text-center">
          Sign in to get personalized movie recommendations
        </p>

        {/* Method toggle */}
        <div className="flex bg-gray-100 dark:bg-gray-800 rounded-xl p-1 mb-6 w-full">
          <button
            onClick={() => setMethod('whatsapp')}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold transition-all ${
              method === 'whatsapp'
                ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                : 'text-gray-500 dark:text-gray-400'
            }`}
          >
            <MessageCircle className="w-4 h-4 text-green-600" />
            WhatsApp
          </button>
          <button
            onClick={() => setMethod('email')}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold transition-all ${
              method === 'email'
                ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                : 'text-gray-500 dark:text-gray-400'
            }`}
          >
            <Mail className="w-4 h-4 text-blue-600" />
            Email
          </button>
        </div>

        {/* WhatsApp OTP flow */}
        {method === 'whatsapp' && (
          <div className="w-full space-y-4">
            {step === 'phone' ? (
              <>
                {/* Country + Phone */}
                <div className="relative">
                  <label className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5 block">
                    WhatsApp Number
                  </label>
                  <div className="flex gap-2">
                    {/* Country picker */}
                    <div className="relative">
                      <button
                        onClick={() => setShowCountryPicker(!showCountryPicker)}
                        className="flex items-center gap-1.5 px-3 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm"
                      >
                        <span className="text-lg">{countries.find((c) => c.code === countryCode)?.flag}</span>
                        <span className="text-gray-700 dark:text-gray-300 font-medium">{countryCode}</span>
                      </button>
                      {showCountryPicker && (
                        <>
                          <div className="fixed inset-0 z-10" onClick={() => setShowCountryPicker(false)} />
                          <div className="absolute top-full mt-1 left-0 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-xl z-20 w-56 max-h-64 overflow-y-auto">
                            {countries.map((c) => (
                              <button
                                key={c.code}
                                onClick={() => {
                                  setCountryCode(c.code);
                                  setShowCountryPicker(false);
                                }}
                                className="w-full flex items-center gap-2 px-3 py-2 hover:bg-gray-50 dark:hover:bg-gray-700 text-sm"
                              >
                                <span className="text-lg">{c.flag}</span>
                                <span className="text-gray-700 dark:text-gray-300">{c.name}</span>
                                <span className="text-gray-400 ml-auto">{c.code}</span>
                              </button>
                            ))}
                          </div>
                        </>
                      )}
                    </div>
                    {/* Phone input */}
                    <input
                      type="tel"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value.replace(/\D/g, ''))}
                      placeholder="Enter your number"
                      className="flex-1 px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:ring-2 focus:ring-purple-500 dark:text-white"
                    />
                  </div>
                </div>

                <p className="text-xs text-gray-500 dark:text-gray-400">
                  You will receive an OTP on WhatsApp at this number.
                </p>

                <button
                  onClick={handleSendOtp}
                  disabled={loading}
                  className="w-full py-3.5 bg-blue-600 text-white rounded-xl font-semibold text-sm hover:bg-blue-700 transition-colors disabled:opacity-50"
                >
                  {loading ? 'Sending...' : 'Send OTP'}
                </button>
              </>
            ) : (
              <>
                {/* OTP input */}
                <label className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5 block">
                  Enter OTP
                </label>
                <input
                  type="text"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="Enter 6-digit OTP"
                  maxLength={6}
                  className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-center text-2xl font-bold tracking-widest focus:ring-2 focus:ring-purple-500 dark:text-white mb-2"
                />

                {message && (
                  <p className={`text-xs text-center ${message.startsWith('Dev') ? 'text-green-600' : 'text-red-500'}`}>
                    {message}
                  </p>
                )}

                <button
                  onClick={handleVerifyOtp}
                  disabled={loading}
                  className="w-full py-3.5 bg-blue-600 text-white rounded-xl font-semibold text-sm hover:bg-blue-700 transition-colors disabled:opacity-50"
                >
                  {loading ? 'Verifying...' : 'Verify'}
                </button>

                <button
                  onClick={() => setStep('phone')}
                  className="w-full text-sm text-purple-600 dark:text-purple-400 font-medium py-2"
                >
                  Change number
                </button>
              </>
            )}

            {/* Divider */}
            <div className="flex items-center gap-3 my-4">
              <div className="flex-1 h-px bg-gray-200 dark:bg-gray-700" />
              <span className="text-xs text-gray-400">OR</span>
              <div className="flex-1 h-px bg-gray-200 dark:bg-gray-700" />
            </div>

            {/* Google sign in */}
            <button className="w-full flex items-center justify-center gap-3 py-3.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl font-semibold text-sm hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
              </svg>
              Sign in with Google
            </button>
          </div>
        )}

        {/* Email flow */}
        {method === 'email' && (
          <div className="w-full space-y-4">
            <input
              type="email"
              placeholder="Enter your email"
              className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:ring-2 focus:ring-purple-500 dark:text-white"
            />
            <button className="w-full py-3.5 bg-blue-600 text-white rounded-xl font-semibold text-sm hover:bg-blue-700 transition-colors">
              Send Magic Link
            </button>
            <div className="flex items-center gap-3 my-4">
              <div className="flex-1 h-px bg-gray-200 dark:bg-gray-700" />
              <span className="text-xs text-gray-400">OR</span>
              <div className="flex-1 h-px bg-gray-200 dark:bg-gray-700" />
            </div>
            <button className="w-full flex items-center justify-center gap-3 py-3.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl font-semibold text-sm hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
              </svg>
              Sign in with Google
            </button>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="px-6 pb-6 text-center">
        <p className="text-xs text-gray-400 dark:text-gray-500">
          By signing in, you agree to our{' '}
          <a href="#" className="text-purple-600 dark:text-purple-400 underline">Terms</a>
          {' '}and{' '}
          <a href="#" className="text-purple-600 dark:text-purple-400 underline">Privacy Policy</a>
        </p>
      </div>
    </div>
  );
}
