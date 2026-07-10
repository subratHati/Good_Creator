import { useState, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { forgotPassword, resetPassword } from '../../api/auth';
import toast from 'react-hot-toast';

const ForgotPassword = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState('email'); // 'email' | 'otp' | 'reset'
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState(['', '', '', '']);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const otpRefs = [useRef(), useRef(), useRef(), useRef()];
  // separate ref set for the desktop OTP boxes so mobile/desktop DOM nodes don't collide
  const otpRefsDesktop = [useRef(), useRef(), useRef(), useRef()];

  // ── Step 1: Send OTP ──
  const handleSendOtp = async e => {
    e.preventDefault();
    if (!email) return toast.error('Enter your email');
    setLoading(true);
    try {
      await forgotPassword({ email });
      toast.success('OTP sent if email exists');
      setStep('otp');
    } catch {
      toast.error('Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  // ── OTP handlers (shared by mobile + desktop input sets) ──
  const handleOtpChange = (refs, index, value) => {
    if (!/^\d*$/.test(value)) return;
    const updated = [...otp];
    updated[index] = value.slice(-1);
    setOtp(updated);
    if (value && index < 3) refs[index + 1].current?.focus();
  };

  const handleOtpKeyDown = (refs, index, e) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      refs[index - 1].current?.focus();
    }
  };

  const handleOtpPaste = (refs, e) => {
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 4);
    if (pasted.length === 4) {
      setOtp(pasted.split(''));
      refs[3].current?.focus();
    }
  };

  // ── Step 2: Verify OTP → go to reset ──
  const handleVerifyOtp = () => {
    if (otp.join('').length !== 4) return toast.error('Enter the 4-digit OTP');
    setStep('reset');
  };

  // ── Step 3: Reset password ──
  const handleReset = async e => {
    e.preventDefault();
    if (newPassword.length < 6) return toast.error('Password must be at least 6 characters');
    if (newPassword !== confirmPassword) return toast.error('Passwords do not match');
    setLoading(true);
    try {
      await resetPassword({ email, otp: otp.join(''), newPassword });
      toast.success('Password reset successfully!');
      navigate('/login');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Reset failed');
    } finally {
      setLoading(false);
    }
  };

  const darkTop = (emoji, title, subtitle) => (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-end', padding: '48px 24px 32px' }}>
      <div style={{ backgroundColor: 'white', borderRadius: '10px', padding: '6px 14px', marginBottom: '20px', display: 'inline-flex', alignItems: 'center' }}>
        <span style={{ fontSize: '20px', fontWeight: 900, color: '#0B0B0B' }}>Good</span>
        <span style={{ fontSize: '20px', fontWeight: 900, color: '#155DFC' }}>Creator</span>
      </div>
      {emoji && <div style={{ fontSize: '36px', marginBottom: '12px' }}>{emoji}</div>}
      <h1 style={{ fontSize: '26px', fontWeight: 900, color: 'white', textAlign: 'center', marginBottom: '6px', letterSpacing: '-0.5px' }}>{title}</h1>
      <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.5)', textAlign: 'center', maxWidth: '280px', lineHeight: 1.5 }}>{subtitle}</p>
    </div>
  );

  return (
    <>
      {/* ══════════════════ MOBILE (dark hero + sheet) ══════════════════ */}
      <div className="md:hidden flex flex-col" style={{ minHeight: '100dvh', backgroundColor: '#101828' }}>

        {/* STEP 1 — EMAIL */}
        {step === 'email' && (
          <>
            {darkTop('🔑', 'Forgot Password?', 'Enter your email and we\'ll send you an OTP to reset your password.')}
            <div style={{ backgroundColor: 'white', borderRadius: '32px 32px 0 0', padding: '32px 24px 40px' }}>
              <div style={{ marginBottom: '24px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#374151', marginBottom: '8px' }}>Email address</label>
                <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" required
                  style={{ width: '100%', padding: '14px 16px', borderRadius: '14px', border: '1.5px solid #E5E7EB', fontSize: '16px', outline: 'none', backgroundColor: '#F9FAFB', boxSizing: 'border-box' }}
                  onFocus={e => e.target.style.borderColor = '#155DFC'}
                  onBlur={e => e.target.style.borderColor = '#E5E7EB'} />
              </div>
              <button onClick={handleSendOtp} disabled={loading}
                style={{ width: '100%', padding: '16px', backgroundColor: loading ? '#93B4FD' : '#155DFC', color: 'white', border: 'none', borderRadius: '14px', fontSize: '16px', fontWeight: 900, cursor: loading ? 'not-allowed' : 'pointer', boxShadow: loading ? 'none' : '0 4px 0 0 #0C3EB5', marginBottom: '20px' }}>
                {loading ? 'Sending OTP...' : 'Send OTP'}
              </button>
              <div style={{ textAlign: 'center' }}>
                <Link to="/login" style={{ fontSize: '14px', color: '#155DFC', fontWeight: 700, textDecoration: 'none' }}>← Back to login</Link>
              </div>
            </div>
          </>
        )}

        {/* STEP 2 — OTP */}
        {step === 'otp' && (
          <>
            {darkTop('📬', 'Check your email', `We sent a 4-digit OTP to ${email}`)}
            <div style={{ backgroundColor: 'white', borderRadius: '32px 32px 0 0', padding: '32px 24px 40px' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#374151', marginBottom: '16px', textAlign: 'center' }}>Enter OTP</label>
              <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', marginBottom: '28px' }} onPaste={e => handleOtpPaste(otpRefs, e)}>
                {otp.map((digit, index) => (
                  <input key={index} ref={otpRefs[index]} type="text" inputMode="numeric" maxLength={1} value={digit}
                    onChange={e => handleOtpChange(otpRefs, index, e.target.value)}
                    onKeyDown={e => handleOtpKeyDown(otpRefs, index, e)}
                    style={{ width: '64px', height: '64px', textAlign: 'center', fontSize: '28px', fontWeight: 900, color: '#101828', border: '2px solid', borderColor: digit ? '#155DFC' : '#E5E7EB', borderRadius: '16px', outline: 'none', backgroundColor: digit ? '#EFF6FF' : '#F9FAFB', transition: 'all 0.15s' }} />
                ))}
              </div>
              <button onClick={handleVerifyOtp} disabled={otp.join('').length !== 4}
                style={{ width: '100%', padding: '16px', backgroundColor: otp.join('').length !== 4 ? '#93B4FD' : '#155DFC', color: 'white', border: 'none', borderRadius: '14px', fontSize: '16px', fontWeight: 900, cursor: otp.join('').length !== 4 ? 'not-allowed' : 'pointer', boxShadow: '0 4px 0 0 #0C3EB5', marginBottom: '16px' }}>
                Continue
              </button>
              <div style={{ textAlign: 'center' }}>
                <button onClick={() => setStep('email')}
                  style={{ fontSize: '13px', color: '#9CA3AF', background: 'none', border: 'none', cursor: 'pointer' }}>
                  ← Change email
                </button>
              </div>
            </div>
          </>
        )}

        {/* STEP 3 — NEW PASSWORD */}
        {step === 'reset' && (
          <>
            {darkTop('🔒', 'Set New Password', 'Choose a strong password for your account.')}
            <div style={{ backgroundColor: 'white', borderRadius: '32px 32px 0 0', padding: '32px 24px 40px' }}>
              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#374151', marginBottom: '8px' }}>New Password</label>
                <input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} placeholder="Min 6 characters"
                  style={{ width: '100%', padding: '14px 16px', borderRadius: '14px', border: '1.5px solid #E5E7EB', fontSize: '16px', outline: 'none', backgroundColor: '#F9FAFB', boxSizing: 'border-box' }}
                  onFocus={e => e.target.style.borderColor = '#155DFC'}
                  onBlur={e => e.target.style.borderColor = '#E5E7EB'} />
              </div>
              <div style={{ marginBottom: '24px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#374151', marginBottom: '8px' }}>Confirm Password</label>
                <input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} placeholder="Repeat password"
                  style={{ width: '100%', padding: '14px 16px', borderRadius: '14px', border: '1.5px solid #E5E7EB', fontSize: '16px', outline: 'none', backgroundColor: '#F9FAFB', boxSizing: 'border-box' }}
                  onFocus={e => e.target.style.borderColor = '#155DFC'}
                  onBlur={e => e.target.style.borderColor = '#E5E7EB'} />
              </div>
              <button onClick={handleReset} disabled={loading}
                style={{ width: '100%', padding: '16px', backgroundColor: loading ? '#93B4FD' : '#155DFC', color: 'white', border: 'none', borderRadius: '14px', fontSize: '16px', fontWeight: 900, cursor: loading ? 'not-allowed' : 'pointer', boxShadow: loading ? 'none' : '0 4px 0 0 #0C3EB5' }}>
                {loading ? 'Resetting...' : 'Reset Password'}
              </button>
            </div>
          </>
        )}

      </div>

      {/* ══════════════════ DESKTOP (centered card, matches Login/Register) ══════════════════ */}
      <div className="hidden md:flex min-h-screen bg-gray-50 items-center justify-center px-4">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 w-full max-w-md p-8">

          {/* STEP 1 — EMAIL */}
          {step === 'email' && (
            <>
              <div className="text-center mb-8">
                <h1 className="text-2xl font-bold text-gray-900">
                  Good<span className="text-blue-600">Creator</span>
                </h1>
                <p className="text-gray-500 text-sm mt-1">Forgot your password?</p>
              </div>

              <form onSubmit={handleSendOtp} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email address</label>
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    required
                    className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-2.5 bg-blue-600 text-white rounded-lg font-semibold text-sm hover:bg-blue-700 transition-colors disabled:opacity-60 disabled:cursor-not-allowed mt-2"
                >
                  {loading ? 'Sending OTP...' : 'Send OTP'}
                </button>
              </form>

              <p className="text-center text-sm text-gray-500 mt-6">
                <Link to="/login" className="text-blue-600 font-medium hover:underline">
                  ← Back to login
                </Link>
              </p>
            </>
          )}

          {/* STEP 2 — OTP */}
          {step === 'otp' && (
            <>
              <div className="text-center mb-8">
                <h1 className="text-2xl font-bold text-gray-900">
                  Good<span className="text-blue-600">Creator</span>
                </h1>
                <p className="text-gray-500 text-sm mt-1">
                  Enter the OTP sent to <span className="font-medium text-gray-700">{email}</span>
                </p>
              </div>

              <div className="flex gap-3 justify-center mb-6" onPaste={e => handleOtpPaste(otpRefsDesktop, e)}>
                {otp.map((digit, index) => (
                  <input
                    key={index}
                    ref={otpRefsDesktop[index]}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={e => handleOtpChange(otpRefsDesktop, index, e.target.value)}
                    onKeyDown={e => handleOtpKeyDown(otpRefsDesktop, index, e)}
                    className="w-12 h-12 text-center text-lg font-bold rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                ))}
              </div>

              <button
                onClick={handleVerifyOtp}
                disabled={otp.join('').length !== 4}
                className="w-full py-2.5 bg-blue-600 text-white rounded-lg font-semibold text-sm hover:bg-blue-700 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
              >
                Continue
              </button>

              <p className="text-center mt-4">
                <button
                  onClick={() => setStep('email')}
                  className="text-xs text-gray-400 hover:text-gray-600 transition-colors"
                >
                  ← Change email
                </button>
              </p>
            </>
          )}

          {/* STEP 3 — NEW PASSWORD */}
          {step === 'reset' && (
            <>
              <div className="text-center mb-8">
                <h1 className="text-2xl font-bold text-gray-900">
                  Good<span className="text-blue-600">Creator</span>
                </h1>
                <p className="text-gray-500 text-sm mt-1">Set a new password</p>
              </div>

              <form onSubmit={handleReset} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={e => setNewPassword(e.target.value)}
                    placeholder="Min 6 characters"
                    className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Confirm Password</label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)}
                    placeholder="Repeat password"
                    className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-2.5 bg-blue-600 text-white rounded-lg font-semibold text-sm hover:bg-blue-700 transition-colors disabled:opacity-60 disabled:cursor-not-allowed mt-2"
                >
                  {loading ? 'Resetting...' : 'Reset Password'}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </>
  );
};

export default ForgotPassword;
