import { useState, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { registerUser, verifyOtp, resendOtp } from '../../api/auth';
import useAuth from '../../hooks/useAuth';
import toast from 'react-hot-toast';

const Register = () => {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [step, setStep] = useState('register'); // 'register' | 'otp'
  const [formData, setFormData] = useState({ email: '', password: '', role: '' });
  const [otp, setOtp] = useState(['', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const otpRefs = [useRef(), useRef(), useRef(), useRef()];
  // separate ref set for the desktop OTP boxes so mobile/desktop DOM nodes don't collide
  const otpRefsDesktop = [useRef(), useRef(), useRef(), useRef()];

  const handleChange = e => setFormData({ ...formData, [e.target.name]: e.target.value });
  const handleRoleSelect = role => setFormData({ ...formData, role });

  // ── Step 1: Register ──
  const handleSubmit = async e => {
    e.preventDefault();
    if (!formData.role) return toast.error('Please select a role');
    setLoading(true);
    try {
      await registerUser(formData);
      toast.success('OTP sent to your email!');
      setStep('otp');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  // ── OTP input handling (shared by mobile + desktop input sets) ──
  const handleOtpChange = (refs, index, value) => {
    if (!/^\d*$/.test(value)) return; // digits only
    const updated = [...otp];
    updated[index] = value.slice(-1); // max 1 digit
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

  // ── Step 2: Verify OTP ──
  const handleVerify = async () => {
    const otpString = otp.join('');
    if (otpString.length !== 4) return toast.error('Enter the 4-digit OTP');
    setLoading(true);
    try {
      const res = await verifyOtp({ email: formData.email, otp: otpString });
      login(res.data.user, res.data.token);
      toast.success('Email verified! Welcome to GoodCreator 🎉');
      navigate('/');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Invalid OTP');
      setOtp(['', '', '', '']);
      otpRefs[0].current?.focus();
      otpRefsDesktop[0].current?.focus();
    } finally {
      setLoading(false);
    }
  };

  // ── Resend OTP ──
  const handleResend = async () => {
    setResending(true);
    try {
      await resendOtp({ email: formData.email });
      toast.success('New OTP sent!');
      setOtp(['', '', '', '']);
      otpRefs[0].current?.focus();
      otpRefsDesktop[0].current?.focus();
    } catch {
      toast.error('Failed to resend OTP');
    } finally {
      setResending(false);
    }
  };

  return (
    <>
      {/* ══════════════════ MOBILE (dark hero + sheet) ══════════════════ */}
      <div className="md:hidden">
        {step === 'register' ? (
          <div style={{ minHeight: '100dvh', backgroundColor: '#101828', display: 'flex', flexDirection: 'column' }}>

            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-end', padding: '48px 24px 32px' }}>
              <div style={{ backgroundColor: 'white', borderRadius: '10px', padding: '6px 14px', marginBottom: '20px', display: 'inline-flex', alignItems: 'center' }}>
                <span style={{ fontSize: '20px', fontWeight: 900, color: '#0B0B0B' }}>Good</span>
                <span style={{ fontSize: '20px', fontWeight: 900, color: '#155DFC' }}>Creator</span>
              </div>
              <h1 style={{ fontSize: '28px', fontWeight: 900, color: 'white', textAlign: 'center', marginBottom: '6px', letterSpacing: '-0.5px' }}>Create Account</h1>
              <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.5)', textAlign: 'center' }}>Join India's Creator Marketplace 🇮🇳</p>
            </div>

            <div style={{ backgroundColor: 'white', borderRadius: '32px 32px 0 0', padding: '32px 24px 40px' }}>

              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#374151', marginBottom: '10px' }}>I am a</label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  {[
                    { role: 'creator', emoji: '🎬', title: 'Creator', desc: 'I create content on Instagram' },
                    { role: 'brand', emoji: '🏷️', title: 'Brand', desc: 'I want to work with creators' },
                  ].map(r => (
                    <button key={r.role} type="button" onClick={() => handleRoleSelect(r.role)}
                      style={{ padding: '14px', borderRadius: '16px', border: '2px solid', borderColor: formData.role === r.role ? '#155DFC' : '#E5E7EB', backgroundColor: formData.role === r.role ? '#EFF6FF' : 'white', textAlign: 'left', cursor: 'pointer', transition: 'all 0.15s' }}>
                      <div style={{ fontSize: '20px', marginBottom: '6px' }}>{r.emoji}</div>
                      <div style={{ fontSize: '13px', fontWeight: 800, color: '#101828', marginBottom: '2px' }}>{r.title}</div>
                      <div style={{ fontSize: '11px', color: '#6B7280' }}>{r.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#374151', marginBottom: '8px' }}>Email</label>
                <input type="email" name="email" value={formData.email} onChange={handleChange} required placeholder="you@example.com"
                  style={{ width: '100%', padding: '14px 16px', borderRadius: '14px', border: '1.5px solid #E5E7EB', fontSize: '16px', outline: 'none', backgroundColor: '#F9FAFB', boxSizing: 'border-box' }}
                  onFocus={e => e.target.style.borderColor = '#155DFC'}
                  onBlur={e => e.target.style.borderColor = '#E5E7EB'} />
              </div>

              <div style={{ marginBottom: '24px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#374151', marginBottom: '8px' }}>Password</label>
                <input type="password" name="password" value={formData.password} onChange={handleChange} required placeholder="Min 6 characters"
                  style={{ width: '100%', padding: '14px 16px', borderRadius: '14px', border: '1.5px solid #E5E7EB', fontSize: '16px', outline: 'none', backgroundColor: '#F9FAFB', boxSizing: 'border-box' }}
                  onFocus={e => e.target.style.borderColor = '#155DFC'}
                  onBlur={e => e.target.style.borderColor = '#E5E7EB'} />
              </div>

              <button onClick={handleSubmit} disabled={loading}
                style={{ width: '100%', padding: '16px', backgroundColor: loading ? '#93B4FD' : '#155DFC', color: 'white', border: 'none', borderRadius: '14px', fontSize: '16px', fontWeight: 900, cursor: loading ? 'not-allowed' : 'pointer', boxShadow: loading ? 'none' : '0 4px 0 0 #0C3EB5', marginBottom: '20px' }}>
                {loading ? 'Sending OTP...' : 'Create Account'}
              </button>

              <div style={{ textAlign: 'center', fontSize: '14px', color: '#6B7280' }}>
                Already have an account?{' '}
                <Link to="/login" style={{ color: '#155DFC', fontWeight: 700, textDecoration: 'none' }}>Log in</Link>
              </div>
            </div>
          </div>
        ) : (
          <div style={{ minHeight: '100dvh', backgroundColor: '#101828', display: 'flex', flexDirection: 'column' }}>

            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-end', padding: '48px 24px 32px' }}>
              <div style={{ backgroundColor: 'white', borderRadius: '10px', padding: '6px 14px', marginBottom: '20px', display: 'inline-flex', alignItems: 'center' }}>
                <span style={{ fontSize: '20px', fontWeight: 900, color: '#0B0B0B' }}>Good</span>
                <span style={{ fontSize: '20px', fontWeight: 900, color: '#155DFC' }}>Creator</span>
              </div>
              <div style={{ fontSize: '36px', marginBottom: '12px' }}>📬</div>
              <h1 style={{ fontSize: '26px', fontWeight: 900, color: 'white', textAlign: 'center', marginBottom: '6px', letterSpacing: '-0.5px' }}>Check your email</h1>
              <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.5)', textAlign: 'center', maxWidth: '280px' }}>
                We sent a 4-digit OTP to<br />
                <span style={{ color: 'white', fontWeight: 700 }}>{formData.email}</span>
              </p>
            </div>

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

              <button onClick={handleVerify} disabled={loading || otp.join('').length !== 4}
                style={{ width: '100%', padding: '16px', backgroundColor: loading || otp.join('').length !== 4 ? '#93B4FD' : '#155DFC', color: 'white', border: 'none', borderRadius: '14px', fontSize: '16px', fontWeight: 900, cursor: loading || otp.join('').length !== 4 ? 'not-allowed' : 'pointer', boxShadow: loading || otp.join('').length !== 4 ? 'none' : '0 4px 0 0 #0C3EB5', marginBottom: '16px' }}>
                {loading ? 'Verifying...' : 'Verify Email'}
              </button>

              <div style={{ textAlign: 'center', fontSize: '14px', color: '#6B7280', marginBottom: '12px' }}>
                Didn't get the OTP?{' '}
                <button onClick={handleResend} disabled={resending}
                  style={{ color: '#155DFC', fontWeight: 700, background: 'none', border: 'none', cursor: resending ? 'not-allowed' : 'pointer', fontSize: '14px', padding: 0 }}>
                  {resending ? 'Sending...' : 'Resend OTP'}
                </button>
              </div>

              <div style={{ textAlign: 'center' }}>
                <button onClick={() => { setStep('register'); setOtp(['', '', '', '']); }}
                  style={{ fontSize: '13px', color: '#9CA3AF', background: 'none', border: 'none', cursor: 'pointer' }}>
                  ← Change email
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ══════════════════ DESKTOP (centered card, old style) ══════════════════ */}
      <div className="hidden md:flex min-h-screen bg-gray-50 items-center justify-center px-4">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 w-full max-w-md p-8">

          {step === 'register' ? (
            <>
              <div className="text-center mb-8">
                <h1 className="text-2xl font-bold text-gray-900">
                  Good<span className="text-blue-600">Creator</span>
                </h1>
                <p className="text-gray-500 text-sm mt-1">Create your account</p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">I am a</label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => handleRoleSelect('creator')}
                      className={`p-4 rounded-xl border-2 text-left transition-all ${
                        formData.role === 'creator'
                          ? 'border-blue-600 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="text-xl mb-1">🎬</div>
                      <div className="font-semibold text-gray-900 text-sm">Creator</div>
                      <div className="text-xs text-gray-500 mt-0.5">
                        I create content on Instagram
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleRoleSelect('brand')}
                      className={`p-4 rounded-xl border-2 text-left transition-all ${
                        formData.role === 'brand'
                          ? 'border-blue-600 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="text-xl mb-1">🏷️</div>
                      <div className="font-semibold text-gray-900 text-sm">Brand</div>
                      <div className="text-xs text-gray-500 mt-0.5">
                        I want to work with creators
                      </div>
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    placeholder="you@example.com"
                    className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                  <input
                    type="password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    required
                    placeholder="Min 6 characters"
                    className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-2.5 bg-blue-600 text-white rounded-lg font-semibold text-sm hover:bg-blue-700 transition-colors disabled:opacity-60 disabled:cursor-not-allowed mt-2"
                >
                  {loading ? 'Sending OTP...' : 'Create account'}
                </button>
              </form>

              <p className="text-center text-sm text-gray-500 mt-6">
                Already have an account?{' '}
                <Link to="/login" className="text-blue-600 font-medium hover:underline">
                  Log in
                </Link>
              </p>
            </>
          ) : (
            <>
              <div className="text-center mb-8">
                <h1 className="text-2xl font-bold text-gray-900">
                  Good<span className="text-blue-600">Creator</span>
                </h1>
                <p className="text-gray-500 text-sm mt-1">
                  Enter the OTP sent to <span className="font-medium text-gray-700">{formData.email}</span>
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
                onClick={handleVerify}
                disabled={loading || otp.join('').length !== 4}
                className="w-full py-2.5 bg-blue-600 text-white rounded-lg font-semibold text-sm hover:bg-blue-700 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {loading ? 'Verifying...' : 'Verify Email'}
              </button>

              <p className="text-center text-sm text-gray-500 mt-6">
                Didn't get the OTP?{' '}
                <button
                  onClick={handleResend}
                  disabled={resending}
                  className="text-blue-600 font-medium hover:underline disabled:opacity-60"
                >
                  {resending ? 'Sending...' : 'Resend OTP'}
                </button>
              </p>

              <p className="text-center mt-3">
                <button
                  onClick={() => { setStep('register'); setOtp(['', '', '', '']); }}
                  className="text-xs text-gray-400 hover:text-gray-600 transition-colors"
                >
                  ← Change email
                </button>
              </p>
            </>
          )}
        </div>
      </div>
    </>
  );
};

export default Register;
