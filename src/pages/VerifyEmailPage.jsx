import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import api from '../services/api'; // ✅ Import api directly instead of authService
import { CheckCircle, XCircle, Mail } from 'lucide-react';
import LoadingSpinner from '../components/common/LoadingSpinner';

const VerifyEmailPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [countdown, setCountdown] = useState(5);

  useEffect(() => {
    verifyEmail();
  }, []);

  // Countdown timer for auto-redirect
  useEffect(() => {
    if (success && countdown > 0) {
      const timer = setTimeout(() => {
        setCountdown(countdown - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else if (success && countdown === 0) {
      navigate('/login');
    }
  }, [success, countdown, navigate]);

  const verifyEmail = async () => {
    const token = searchParams.get('token');
    
    if (!token) {
      setError('Invalid verification link. Please check your email and try again.');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      console.log('🔐 Verifying email with token:', token);
      
      // ✅ DIRECT API CALL - No double /api issue
      const response = await api.post('/users/verify-email', { token });
      console.log('✅ Email verification response:', response.data);
      
      if (response.data.success) {
        setSuccess(true);
      } else {
        setError(response.data.message || 'Email verification failed');
      }
    } catch (err) {
      console.error('❌ Email verification error:', err);
      setError(err.response?.data?.message || 'Email verification failed. The link may have expired.');
    } finally {
      setLoading(false);
    }
  };

  const handleResendVerification = () => {
    // You can implement resend verification logic here
    alert('Resend verification feature coming soon!');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-green-50">
        <div className="text-center">
          <LoadingSpinner message="Verifying your email address..." />
          <p className="text-gray-600 mt-4 text-sm">
            Please wait while we verify your email
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-green-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="bg-white p-8 rounded-2xl shadow-lg border border-gray-100 text-center">
          
          {success ? (
            <>
              {/* Success State */}
              <div className="mb-6">
                <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100">
                  <CheckCircle className="h-10 w-10 text-green-600" />
                </div>
              </div>
              
              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                Email Verified!
              </h2>
              
              <p className="text-gray-600 mb-6 text-lg">
                🎉 Your email has been successfully verified!
              </p>

              <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
                <p className="text-green-800 text-sm">
                  Redirecting to login in <span className="font-bold">{countdown}</span> seconds...
                </p>
              </div>

              <button
                onClick={() => navigate('/login')}
                className="w-full bg-green-600 text-white py-4 rounded-xl hover:bg-green-700 transition-colors font-semibold text-lg shadow-md hover:shadow-lg"
              >
                Go to Login Now
              </button>
            </>
          ) : (
            <>
              {/* Error State */}
              <div className="mb-6">
                <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-red-100">
                  <XCircle className="h-10 w-10 text-red-600" />
                </div>
              </div>
              
              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                Verification Failed
              </h2>
              
              <p className="text-gray-600 mb-6 text-lg">
                {error || 'Unable to verify your email address.'}
              </p>

              <div className="space-y-4">
                <button
                  onClick={() => navigate('/login')}
                  className="w-full bg-blue-600 text-white py-4 rounded-xl hover:bg-blue-700 transition-colors font-semibold text-lg shadow-md hover:shadow-lg"
                >
                  Go to Login
                </button>
                
                <button
                  onClick={() => navigate('/signup')}
                  className="w-full border-2 border-gray-300 text-gray-700 py-4 rounded-xl hover:bg-gray-50 transition-colors font-semibold text-lg"
                >
                  Sign Up Again
                </button>

                <button
                  onClick={handleResendVerification}
                  className="w-full border-2 border-orange-300 text-orange-600 py-4 rounded-xl hover:bg-orange-50 transition-colors font-semibold text-lg flex items-center justify-center gap-2"
                >
                  <Mail className="h-5 w-5" />
                  Resend Verification Email
                </button>
              </div>

              {/* Help Section */}
              <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <h3 className="font-semibold text-yellow-800 mb-2">Need Help?</h3>
                <p className="text-yellow-700 text-sm">
                  • Check if the verification link has expired<br/>
                  • Make sure you're using the latest link from your email<br/>
                  • Contact support if the problem persists
                </p>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="text-center">
          <p className="text-gray-500 text-sm">
            Having trouble?{' '}
            <button 
              onClick={() => navigate('/contact')}
              className="text-blue-600 hover:text-blue-700 font-medium"
            >
              Contact Support
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default VerifyEmailPage;