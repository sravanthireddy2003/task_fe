
import React, { useEffect, useState, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { verifyOtp, selectAuthError, selectAuthStatus, resendOtp } from '../redux/slices/authSlice';
import { toast } from 'sonner';
import { useLocation } from 'react-router-dom';
import Button from '../components/Button';
import Textbox from '../components/Textbox';

const VerifyOTP = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { register, handleSubmit, setFocus, watch, setValue } = useForm();
  const status = useSelector(selectAuthStatus);
  const error = useSelector(selectAuthError);
  const tempToken = useSelector((state) => state.auth.tempToken);
  const location = useLocation();
  const locationTempToken = location?.state?.tempToken || location?.state?.temp || null;
  const [countdown, setCountdown] = useState(60);
  const [canResend, setCanResend] = useState(false);
  const [otpDigits, setOtpDigits] = useState(['', '', '', '', '', '']);
  const inputsRef = useRef([]);
  const [friendlyError, setFriendlyError] = useState(null);

  useEffect(() => {
    // If neither Redux nor location state provide a tempToken, redirect to login.
    if (!tempToken && !locationTempToken) {
      navigate('/log-in');
    }
  }, [tempToken, locationTempToken, navigate]);

  useEffect(() => {
    let timer;
    if (countdown > 0) {
      timer = setTimeout(() => setCountdown(countdown - 1), 1000);
    } else {
      setCanResend(true);
    }
    return () => clearTimeout(timer);
  }, [countdown]);

  const handleOtpChange = (index, value) => {
    if (!/^\d*$/.test(value)) return;
    
    const newOtpDigits = [...otpDigits];
    newOtpDigits[index] = value;
    setOtpDigits(newOtpDigits);
    
    if (value && index < 5) {
      inputsRef.current[index + 1]?.focus();
    }
    
    // Join digits for form submission
    setValue('otp', newOtpDigits.join(''));
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otpDigits[index] && index > 0) {
      inputsRef.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pasteData = e.clipboardData.getData('text').slice(0, 6);
    if (/^\d+$/.test(pasteData)) {
      const digits = pasteData.split('');
      const newOtpDigits = [...otpDigits];
      digits.forEach((digit, idx) => {
        if (idx < 6) {
          newOtpDigits[idx] = digit;
        }
      });
      setOtpDigits(newOtpDigits);
      setValue('otp', newOtpDigits.join(''));
      inputsRef.current[Math.min(digits.length, 5)]?.focus();
    }
  };

  const mapOtpError = (err) => {
    const msg = (err && (err.message || err.payload || err))?.toString?.() || String(err);
    const text = msg.toLowerCase();
    if (text.includes('expired') || text.includes('otp expired')) return 'OTP expired — please resend and try the new code.';
    if (text.includes('invalid') || text.includes('invalid token') || text.includes('invalid otp')) return 'Invalid code — check the digits and try again.';
    if (text.includes('too many') || text.includes('attempts')) return 'Too many attempts — please wait a moment and request a new code.';
    return msg || 'Failed to verify code';
  };

  const onSubmit = async (data) => {
    const tokenToUse = tempToken || locationTempToken;
    const payload = { tempToken: tokenToUse, otp: data.otp };
    setFriendlyError(null);
    try {
      await dispatch(verifyOtp(payload)).unwrap();
      navigate('/dashboard');
    } catch (err) {
      const friendly = mapOtpError(err);
      setFriendlyError(friendly);
      toast.error(friendly);
    }
  };

  const handleResendOtp = () => {
    const tokenToUse = tempToken || locationTempToken;
    setFriendlyError(null);
    dispatch(resendOtp({ tempToken: tokenToUse }))
      .unwrap()
      .then(() => {
        toast.success('A new verification code was sent');
        setCountdown(60);
        setCanResend(false);
        setOtpDigits(['', '', '', '', '', '']);
        inputsRef.current[0]?.focus();
      })
      .catch((err) => {
        const friendly = mapOtpError(err);
        setFriendlyError(friendly);
        toast.error(friendly);
      });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo/Brand */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-2xl shadow-lg mb-6">
            <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
              <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Two-Factor Verification</h1>
          <p className="text-gray-600">
            We've sent a verification code to your email
          </p>
          <p className="text-sm text-gray-500 mt-1">
            Enter the 6-digit code to continue
          </p>
        </div>

        {/* OTP Card */}
        <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-200">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
            {/* OTP Input Grid */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-4 text-center">
                Enter verification code
              </label>
              <div className="flex justify-center gap-3 mb-2">
                {otpDigits.map((digit, index) => (
                  <input
                    key={index}
                    ref={(el) => (inputsRef.current[index] = el)}
                    type="text"
                    inputMode="numeric"
                    maxLength="1"
                    value={digit}
                    onChange={(e) => handleOtpChange(index, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(index, e)}
                    onPaste={handlePaste}
                    className="w-14 h-14 text-2xl font-bold text-center bg-gray-50 border-2 border-gray-300 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all duration-200"
                    disabled={status === 'loading'}
                    autoFocus={index === 0}
                  />
                ))}
              </div>
              <input
                type="hidden"
                {...register('otp', { 
                  required: 'Verification code is required',
                  validate: (value) => value.length === 6 || 'Please enter all 6 digits'
                })}
              />
            </div>

            {/* Error Message */}
            {(friendlyError || (status === 'failed' && error)) && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                <div className="flex items-center">
                  <svg className="w-5 h-5 text-red-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                  <span className="text-red-700 text-sm">{friendlyError || error}</span>
                </div>
              </div>
            )}

            {/* Submit Button */}
            <Button
              type="submit"
              disabled={status === 'loading' || otpDigits.join('').length !== 6}
              className={`w-full py-4 px-6 rounded-xl font-semibold text-lg transition-all duration-200 ${
                status === 'loading' || otpDigits.join('').length !== 6
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg hover:shadow-xl'
              }`}
            >
              {status === 'loading' ? (
                <div className="flex items-center justify-center">
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-3"></div>
                  Verifying...
                </div>
              ) : (
                'Verify & Continue'
              )}
            </Button>

            {/* Resend OTP Section */}
            <div className="pt-6 border-t border-gray-200">
              <div className="text-center">
                <p className="text-gray-600 mb-4">
                  {!canResend ? (
                    <>
                      Resend code in{' '}
                      <span className="font-bold text-blue-600">
                        0:{countdown.toString().padStart(2, '0')}
                      </span>
                    </>
                  ) : (
                    "Didn't receive the code?"
                  )}
                </p>
                <button
                  type="button"
                  onClick={handleResendOtp}
                  disabled={!canResend || status === 'loading'}
                  className={`text-sm font-medium transition-colors duration-200 ${
                    canResend
                      ? 'text-blue-600 hover:text-blue-800'
                      : 'text-gray-400 cursor-not-allowed'
                  }`}
                >
                  Resend verification code
                </button>
              </div>
            </div>
          </form>
        </div>

        {/* Help Text */}
        <div className="mt-8 text-center">
          <p className="text-sm text-gray-500">
            This extra step shows it's really you trying to sign in
          </p>
          <button
            type="button"
            onClick={() => navigate('/log-in')}
            className="mt-4 text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors duration-200"
          >
            ← Back to login
          </button>
        </div>
      </div>
    </div>
  );
};

export default VerifyOTP;