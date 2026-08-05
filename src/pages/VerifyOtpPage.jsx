import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { CheckCircle, Mail, ArrowLeft } from 'lucide-react';
import authService from '../services/authService';

const OTP_LENGTH = 6;

const VerifyOtpPage = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // Email signup page se aata hai (navigate state me)
  const email = location.state?.email || '';

  const [digits, setDigits] = useState(Array(OTP_LENGTH).fill(''));
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [resendIn, setResendIn] = useState(60);
  const [countdown, setCountdown] = useState(5);

  const inputRefs = useRef([]);

  // Agar email hi nahi mila to signup pe wapas bhej do
  useEffect(() => {
    if (!email) {
      navigate('/login', { replace: true });
    } else {
      inputRefs.current[0]?.focus();
    }
  }, [email, navigate]);

  // Resend cooldown timer
  useEffect(() => {
    if (resendIn <= 0) return;
    const t = setTimeout(() => setResendIn((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [resendIn]);

  // Success ke baad login pe redirect
  useEffect(() => {
    if (!success) return;
    if (countdown === 0) {
      navigate('/login', { replace: true });
      return;
    }
    const t = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [success, countdown, navigate]);

  const handleChange = (index, value) => {
    const digit = value.replace(/\D/g, '').slice(-1);
    if (!digit && value !== '') return;

    const next = [...digits];
    next[index] = digit;
    setDigits(next);
    setError('');

    if (digit && index < OTP_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !digits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
    if (e.key === 'ArrowLeft' && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
    if (e.key === 'ArrowRight' && index < OTP_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  // Poora OTP ek saath paste karne par
  const handlePaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, OTP_LENGTH);
    if (!pasted) return;

    const next = Array(OTP_LENGTH).fill('');
    pasted.split('').forEach((d, i) => (next[i] = d));
    setDigits(next);
    inputRefs.current[Math.min(pasted.length, OTP_LENGTH - 1)]?.focus();
  };

  const handleVerify = async () => {
    const otp = digits.join('');

    if (otp.length !== OTP_LENGTH) {
      setError('Please enter all 6 digits');
      return;
    }

    setError('');
    setInfo('');
    setLoading(true);

    try {
      const result = await authService.verifyOtp(email, otp);
      if (result.success) {
        setSuccess(true);
      } else {
        setError(result.message || 'Verification failed');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Verification failed. Please try again.');
      setDigits(Array(OTP_LENGTH).fill(''));
      inputRefs.current[0]?.focus();
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setError('');
    setInfo('');
    setLoading(true);

    try {
      const result = await authService.resendOtp(email);
      if (result.success) {
        setInfo('New code sent. Check your inbox.');
        setDigits(Array(OTP_LENGTH).fill(''));
        setResendIn(60);
        inputRefs.current[0]?.focus();
      } else {
        setError(result.message || 'Could not resend code');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Could not resend code');
    } finally {
      setLoading(false);
    }
  };

  // ---------------- SUCCESS SCREEN ----------------
  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-600 via-purple-600 to-pink-500 px-4">
        <div className="bg-white rounded-3xl shadow-2xl p-8 max-w-md w-full text-center">
          <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100 mb-6">
            <CheckCircle className="h-10 w-10 text-green-600" />
          </div>
          <h2 className="text-3xl font-bold text-gray-900 mb-3">Email Verified!</h2>
          <p className="text-gray-600 mb-6">Your account is active. You can log in now.</p>
          <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-6">
            <p className="text-green-800 text-sm">
              Redirecting to login in <span className="font-bold">{countdown}</span> seconds...
            </p>
          </div>
          <button
            onClick={() => navigate('/login', { replace: true })}
            className="w-full py-3 bg-green-600 text-white rounded-xl hover:bg-green-700 font-semibold"
          >
            Go to Login Now
          </button>
        </div>
      </div>
    );
  }

  // ---------------- OTP SCREEN ----------------
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-600 via-purple-600 to-pink-500 px-4 py-12">
      <div className="bg-white rounded-3xl shadow-2xl p-8 max-w-md w-full">
        <div className="text-center mb-8">
          <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-blue-100 mb-4">
            <Mail className="h-8 w-8 text-blue-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Verify your email</h2>
          <p className="text-gray-600 text-sm">
            We sent a 6-digit code to
            <br />
            <span className="font-semibold text-gray-900">{email}</span>
          </p>
        </div>

        {/* OTP boxes */}
        <div className="flex justify-center gap-2 mb-6" onPaste={handlePaste}>
          {digits.map((digit, i) => (
            <input
              key={i}
              ref={(el) => (inputRefs.current[i] = el)}
              type="text"
              inputMode="numeric"
              maxLength={1}
              value={digit}
              onChange={(e) => handleChange(i, e.target.value)}
              onKeyDown={(e) => handleKeyDown(i, e)}
              disabled={loading}
              className="w-12 h-14 text-center text-2xl font-bold border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none disabled:bg-gray-100 transition-colors"
            />
          ))}
        </div>

        {error && (
          <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm mb-4">
            {error}
          </div>
        )}

        {info && (
          <div className="p-3 bg-blue-50 border border-blue-200 text-blue-700 rounded-lg text-sm mb-4">
            {info}
          </div>
        )}

        <button
          onClick={handleVerify}
          disabled={loading || digits.join('').length !== OTP_LENGTH}
          className="w-full py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-semibold mb-4"
        >
          {loading ? 'Verifying...' : 'Verify Email'}
        </button>

        {/* Resend */}
        <div className="text-center text-sm text-gray-600 mb-4">
          {resendIn > 0 ? (
            <span>
              Didn't get the code? Resend in{' '}
              <span className="font-semibold text-gray-900">{resendIn}s</span>
            </span>
          ) : (
            <button
              onClick={handleResend}
              disabled={loading}
              className="text-blue-600 font-semibold hover:underline disabled:opacity-50"
            >
              Resend code
            </button>
          )}
        </div>

        <button
          onClick={() => navigate('/login')}
          className="w-full flex items-center justify-center gap-2 text-gray-500 text-sm hover:text-gray-700"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to login
        </button>

        <p className="text-center text-xs text-gray-400 mt-6">
          The code expires in 10 minutes. Check your spam folder if it hasn't arrived.
        </p>
      </div>
    </div>
  );
};

export default VerifyOtpPage;