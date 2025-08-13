
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Check, Mail } from 'lucide-react';
import { apiService } from '../../services/api';

const PasswordRecovery: React.FC = () => {
  const [email, setEmail] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!email) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = 'Email format is invalid';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setIsLoading(true);
    
    try {
      const data = await apiService.forgotPassword(email);
      
      if (data.success) {
        setShowSuccess(true);
      } else {
        // Handle error
        setErrors({ email: data.message || 'Failed to send reset link' });
      }
    } catch (error) {
      console.error('Error sending reset link:', error);
      setErrors({ email: 'Network error. Please try again.' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEmail(e.target.value);
    if (errors.email) {
      setErrors({});
    }
  };

  if (showSuccess) {
    return (
      <div className="min-h-screen w-screen flex items-center justify-center px-4 sm:px-6 lg:px-8 relative" style={{ width: '100vw', margin: 0, padding: 0, backgroundColor: '#bd7880' }}>
        {/* Removed background image and overlay for solid color */}
        <div className="max-w-lg w-full z-10 flex flex-col items-center justify-center">
          <div className="w-full bg-black bg-opacity-80 rounded-2xl shadow-2xl p-8 flex flex-col items-center">
            <div className="max-w-md w-full">
              <div className="p-8 text-center animate-fade-in bg-gray-800 bg-opacity-70 rounded-xl shadow-2xl">
                <div className="w-16 h-16 bg-gray-700 bg-opacity-70 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Check size={32} className="text-white" />
                </div>
                <h2 className="text-2xl font-bold text-white mb-2">Check Your Email</h2>
                <p className="text-gray-100 mb-6">
                  We've sent a password reset link to <strong>{email}</strong>
                </p>
                <div className="space-y-4">
                  <p className="text-sm text-gray-300">
                    Didn't receive the email? Check your spam folder or try again.
                  </p>
                  <div className="space-y-2">
                    <button
                      onClick={() => setShowSuccess(false)}
                      className="w-full bg-gray-900 bg-opacity-80 text-white font-bold rounded-lg py-3 shadow-md border border-white hover:bg-gray-700 transition-colors"
                    >
                      Try Another Email
                    </button>
                    <Link
                      to="/login"
                      className="block w-full text-center bg-gray-900 bg-opacity-80 text-white font-bold rounded-lg py-3 shadow-md border border-white hover:bg-gray-700 transition-colors"
                    >
                      Back to Login
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-screen flex items-center justify-center px-4 sm:px-6 lg:px-8 relative" style={{ width: '100vw', margin: 0, padding: 0, backgroundColor: '#bd7880' }}>
      {/* Removed background image and overlay for solid color */}
      <div className="max-w-lg w-full z-10 flex flex-col items-center justify-center">
        <div className="w-full bg-black bg-opacity-80 rounded-2xl shadow-2xl p-8 flex flex-col items-center">
          {/* Logo and subtitle */}
          <div className="text-center mb-8 w-full">
            <div className="text-4xl font-bold mb-2 text-white">Eventra</div>
            <p className="text-gray-200">Reset your password</p>
          </div>
          {/* Password Recovery Form */}
          <div className="max-w-md w-full">
            <div className="p-8 animate-fade-in bg-gray-800 bg-opacity-70 rounded-xl shadow-2xl">
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-gray-700 bg-opacity-70 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Mail size={32} className="text-white" />
                </div>
                <h2 className="text-2xl font-bold text-white">Forgot Password?</h2>
                <p className="text-gray-200 mt-2">
                  Enter your email address and we'll send you a link to reset your password.
                </p>
              </div>
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Email */}
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-white mb-2">
                    Email Address
                  </label>
                  <input
                    type="email"
                    id="email"
                    value={email}
                    onChange={handleChange}
                    className={`w-full rounded-xl bg-gray-900 bg-opacity-80 border border-gray-500 text-white placeholder:text-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 px-4 py-3 text-base font-semibold shadow-none outline-none ${errors.email ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : ''}`}
                    placeholder="Enter your university email"
                  />
                  {errors.email && <p className="mt-1 text-sm text-red-400">{errors.email}</p>}
                </div>
                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={isLoading}
                  className={`w-full bg-gray-900 bg-opacity-80 text-white font-bold rounded-lg py-3 shadow-md border border-white hover:bg-gray-700 transition-colors ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  {isLoading ? 'Sending Reset Link...' : 'Send Reset Link'}
                </button>
              </form>
              {/* Links */}
              <div className="mt-6 text-center">
                <div className="text-sm text-gray-200">
                  Remember your password?{' '}
                  <Link to="/login" className="text-white underline font-bold">
                    Back to Login
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PasswordRecovery;
