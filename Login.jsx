import { useState, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { loginUser, verifyOtp, resendOtp } from '../../api/auth';
import useAuth from '../../hooks/useAuth';
import toast from 'react-hot-toast';

const Login = () => {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [step, setStep] = useState('login'); // 'login' | 'otp'
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [otp, setOtp] = useState(['', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const otpRefs = [useRef(), useRef(), useRef(), useRef()];

  const handleChange = e => setFormData({ ...formData, [e.target.name]: e.target.value });

  // ── Login ──
  const handleSubmit = async e => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await loginUser(formData);
      login(res.data.user, res.data.token);
      toast.success('Welcome back!');
      navigate('/');
    } catch (error) {
      const data = error.response?.data;
      if (data?.requiresVerification) {
        toast.error('Please verify your email first');
        setStep('otp');
      } else {
        toast.error(data?.message || 'Login failed');
      }
    } finally {
      setLoading(false);
    }
  };

  // ── OTP handlers ──
  const handleOtpChange = (index, value) => {
    if (!/^\d*$/.test(value)) return;
    const updated = [...otp];
    updated[index] = value.slice(-1);
    setOtp(updated);
    if (value && index < 3) otpRefs[index + 1].current?.focus();
  };

  const handleOtpKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      otpRefs[index - 1].current?.focus();
    }
  };

  const handleOtpPaste = e => {
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 4);
    if (pasted.length === 4) {
      setOtp(pasted.split(''));
      otpRefs[3].current?.focus();
    }
  };

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
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setResending(true);
    try {
      await resendOtp({ email: formData.email });
      toast.success('New OTP sent!');
      setOtp(['', '', '', '']);
      otpRefs[0].current?.focus();
    } catch {
      toast.error('Failed to resend OTP');
    } finally {
      setResending(false);
    }
  };

  // ── LOGIN STEP ──
  if (step === 'login') return (
    <div style={{ minHeight: '100dvh', backgroundColor: '#101828', display: 'flex', flexDirection: 'column' }}>

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-end', padding: '48px 24px 32px' }}>
        <div style={{ backgroundColor: 'white', borderRadius: '10px', padding: '6px 14px', marginBottom: '20px', display: 'inline-flex', alignItems: 'center' }}>
          <span style={{ fontSize: '20px', fontWeight: 900, color: '#0B0B0B' }}>Good</span>
          <span style={{ fontSize: '20px', fontWeight: 900, color: '#155DFC' }}>Creator</span>
        </div>
        <h1 style={{ fontSize: '28px', fontWeight: 900, color: 'white', textAlign: 'center', marginBottom: '6px', letterSpacing: '-0.5px' }}>Welcome Back 👋</h1>
        <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.5)', textAlign: 'center' }}>India's Creator Marketplace 🇮🇳</p>
      </div>

      <div style={{ backgroundColor: 'white', borderRadius: '32px 32px 0 0', padding: '32px 24px 40px' }}>

        <div style={{ marginBottom: '14px' }}>
          <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#374151', marginBottom: '8px' }}>Email</label>
          <input type="email" name="email" value={formData.email} onChange={handleChange} required placeholder="you@example.com"
            style={{ width: '100%', padding: '14px 16px', borderRadius: '14px', border: '1.5px solid #E5E7EB', fontSize: '16px', outline: 'none', backgroundColor: '#F9FAFB', boxSizing: 'border-box' }}
            onFocus={e => e.target.style.borderColor = '#155DFC'}
            onBlur={e => e.target.style.borderColor = '#E5E7EB'} />
        </div>

        <div style={{ marginBottom: '8px' }}>
          <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#374151', marginBottom: '8px' }}>Password</label>
          <input type="password" name="password" value={formData.password} onChange={handleChange} required placeholder="Your password"
            style={{ width: '100%', padding: '14px 16px', borderRadius: '14px', border: '1.5px solid #E5E7EB', fontSize: '16px', outline: 'none', backgroundColor: '#F9FAFB', boxSizing: 'border-box' }}
            onFocus={e => e.target.style.borderColor = '#155DFC'}
            onBlur={e => e.target.style.borderColor = '#E5E7EB'} />
        </div>

        <div style={{ textAlign: 'right', marginBottom: '24px' }}>
          <Link to="/forgot-password" style={{ fontSize: '13px', color: '#155DFC', fontWeight: 600, textDecoration: 'none' }}>
            Forgot Password?
          </Link>
        </div>

        <button onClick={handleSubmit} disabled={loading}
          style={{ width: '100%', padding: '16px', backgroundColor: loading ? '#93B4FD' : '#155DFC', color: 'white', border: 'none', borderRadius: '14px', fontSize: '16px', fontWeight: 900, cursor: loading ? 'not-allowed' : 'pointer', boxShadow: loading ? 'none' : '0 4px 0 0 #0C3EB5', marginBottom: '20px' }}>
          {loading ? 'Logging in...' : 'Log In'}
        </button>

        <div style={{ textAlign: 'center', fontSize: '14px', color: '#6B7280' }}>
          Don't have an account?{' '}
          <Link to="/register" style={{ color: '#155DFC', fontWeight: 700, textDecoration: 'none' }}>Sign up</Link>
        </div>
      </div>
    </div>
  );

  // ── OTP STEP (unverified email) ──
  return (
    <div style={{ minHeight: '100dvh', backgroundColor: '#101828', display: 'flex', flexDirection: 'column' }}>

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-end', padding: '48px 24px 32px' }}>
        <div style={{ backgroundColor: 'white', borderRadius: '10px', padding: '6px 14px', marginBottom: '20px', display: 'inline-flex', alignItems: 'center' }}>
          <span style={{ fontSize: '20px', fontWeight: 900, color: '#0B0B0B' }}>Good</span>
          <span style={{ fontSize: '20px', fontWeight: 900, color: '#155DFC' }}>Creator</span>
        </div>
        <div style={{ fontSize: '36px', marginBottom: '12px' }}>📬</div>
        <h1 style={{ fontSize: '26px', fontWeight: 900, color: 'white', textAlign: 'center', marginBottom: '6px' }}>Verify your email</h1>
        <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.5)', textAlign: 'center', maxWidth: '280px' }}>
          A new OTP was sent to<br />
          <span style={{ color: 'white', fontWeight: 700 }}>{formData.email}</span>
        </p>
      </div>

      <div style={{ backgroundColor: 'white', borderRadius: '32px 32px 0 0', padding: '32px 24px 40px' }}>

        <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#374151', marginBottom: '16px', textAlign: 'center' }}>Enter OTP</label>

        <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', marginBottom: '28px' }} onPaste={handleOtpPaste}>
          {otp.map((digit, index) => (
            <input key={index} ref={otpRefs[index]} type="text" inputMode="numeric" maxLength={1} value={digit}
              onChange={e => handleOtpChange(index, e.target.value)}
              onKeyDown={e => handleOtpKeyDown(index, e)}
              style={{ width: '64px', height: '64px', textAlign: 'center', fontSize: '28px', fontWeight: 900, color: '#101828', border: '2px solid', borderColor: digit ? '#155DFC' : '#E5E7EB', borderRadius: '16px', outline: 'none', backgroundColor: digit ? '#EFF6FF' : '#F9FAFB', transition: 'all 0.15s' }} />
          ))}
        </div>

        <button onClick={handleVerify} disabled={loading || otp.join('').length !== 4}
          style={{ width: '100%', padding: '16px', backgroundColor: loading || otp.join('').length !== 4 ? '#93B4FD' : '#155DFC', color: 'white', border: 'none', borderRadius: '14px', fontSize: '16px', fontWeight: 900, cursor: 'pointer', boxShadow: '0 4px 0 0 #0C3EB5', marginBottom: '16px' }}>
          {loading ? 'Verifying...' : 'Verify Email'}
        </button>

        <div style={{ textAlign: 'center', fontSize: '14px', color: '#6B7280' }}>
          Didn't get the OTP?{' '}
          <button onClick={handleResend} disabled={resending}
            style={{ color: '#155DFC', fontWeight: 700, background: 'none', border: 'none', cursor: 'pointer', fontSize: '14px', padding: 0 }}>
            {resending ? 'Sending...' : 'Resend OTP'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Login;
