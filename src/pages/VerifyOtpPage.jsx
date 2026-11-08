import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { CheckCircle, Mail, ArrowLeft } from 'lucide-react';
import authService from '../services/authService';
import AuthShell, { AuthCard, Alert, PrimaryButton, ACCENT } from '../components/auth/AuthShell';

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

  // Verify ke baad login par — email bhara hua, aur jahan se aaye the wahi wapas
  const fromState = location.state?.from;
  const goToLogin = useCallback(
    () =>
      navigate('/login', {
        replace: true,
        state: { email, notice: 'Email verified! Please login.', from: fromState },
      }),
    [navigate, email, fromState]
  );

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
      goToLogin();
      return;
    }
    const t = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [success, countdown, goToLogin]);

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
      <AuthShell showBack={false}>
        <AuthCard>
          <div className="text-center">
            <div
              className="mx-auto flex items-center justify-center h-16 w-16 rounded-2xl mb-6"
              style={{ background: `${ACCENT}1A`, border: `1px solid ${ACCENT}40` }}
            >
              <CheckCircle className="h-9 w-9" style={{ color: ACCENT }} />
            </div>
            <h2 className="text-2xl font-bold text-[#F8FAFC] mb-2">Email verified!</h2>
            <p className="text-[#94A3B8] mb-6">Your account is active. You can login now.</p>
            <p className="text-sm text-slate-500 mb-6">
              Redirecting to login in <span className="font-bold text-[#F8FAFC]">{countdown}</span>s...
            </p>
            <PrimaryButton onClick={goToLogin}>Go to login now</PrimaryButton>
          </div>
        </AuthCard>
      </AuthShell>
    );
  }

  // ---------------- OTP SCREEN ----------------
  return (
    <AuthShell showBack={false}>
      <AuthCard>
        <div className="text-center mb-8">
          <div
            className="mx-auto flex items-center justify-center h-14 w-14 rounded-2xl mb-5"
            style={{ background: `${ACCENT}1A`, border: `1px solid ${ACCENT}40` }}
          >
            <Mail className="h-7 w-7" style={{ color: ACCENT }} />
          </div>
          <h2 className="text-2xl font-bold text-[#F8FAFC] mb-2">Verify your email</h2>
          <p className="text-[#94A3B8] text-sm">
            We sent a 6-digit code to
            <br />
            <span className="font-semibold text-[#F8FAFC] break-all">{email}</span>
          </p>
        </div>

        {/* OTP boxes */}
        <div className="flex justify-center gap-2 sm:gap-3 mb-6" onPaste={handlePaste}>
          {digits.map((digit, i) => (
            <input
              key={i}
              ref={(el) => (inputRefs.current[i] = el)}
              type="text"
              inputMode="numeric"
              autoComplete={i === 0 ? "one-time-code" : "off"}
              aria-label={`Digit ${i + 1}`}
              maxLength={1}
              value={digit}
              onChange={(e) => handleChange(i, e.target.value)}
              onKeyDown={(e) => handleKeyDown(i, e)}
              disabled={loading}
              className={`w-11 h-14 sm:w-12 text-center text-2xl font-bold rounded-xl bg-[#05061A]/60 border text-[#F8FAFC] outline-none transition-all focus:border-[#22D3EE]/70 focus:ring-4 focus:ring-[#22D3EE]/10 disabled:opacity-60 ${
                digit ? "border-[#22D3EE]/50" : "border-white/[0.1]"
              }`}
            />
          ))}
        </div>

        <div className="space-y-3 mb-4">
          {error && <Alert>{error}</Alert>}
          {info && <Alert type="info">{info}</Alert>}
        </div>

        <PrimaryButton
          onClick={handleVerify}
          loading={loading}
          disabled={digits.join('').length !== OTP_LENGTH}
        >
          {loading ? 'Verifying...' : 'Verify email'}
        </PrimaryButton>

        {/* Resend */}
        <div className="text-center text-sm text-[#94A3B8] mt-5">
          {resendIn > 0 ? (
            <span>
              Didn't get the code? Resend in{' '}
              <span className="font-semibold text-[#F8FAFC] tabular-nums">{resendIn}s</span>
            </span>
          ) : (
            <button
              onClick={handleResend}
              disabled={loading}
              className="font-semibold hover:underline disabled:opacity-50"
              style={{ color: ACCENT }}
            >
              Resend code
            </button>
          )}
        </div>

        <button
          onClick={() => navigate('/login')}
          className="mt-5 w-full flex items-center justify-center gap-2 text-slate-500 text-sm hover:text-slate-300 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to login
        </button>

        <p className="text-center text-xs text-slate-600 mt-6">
          The code expires in 10 minutes. Check your spam folder if it hasn't arrived.
        </p>
      </AuthCard>
    </AuthShell>
  );
};

export default VerifyOtpPage;