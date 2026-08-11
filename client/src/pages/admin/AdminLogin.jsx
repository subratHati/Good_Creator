import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { loginUser } from '../../api/auth';
import useAuth from '../../hooks/useAuth';
import toast from 'react-hot-toast';

const AdminLogin = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await loginUser(formData);
      if (res.data.user.role !== 'admin') {
        toast.error('This login is for admin accounts only');
        setLoading(false);
        return;
      }
      login(res.data.user, res.data.token);
      toast.success('Welcome back');
      navigate('/admin/dashboard', { replace: true });
    } catch (error) {
      const msg = error.response?.data?.message || 'Login failed';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ backgroundColor: '#101828' }}>
      <div className="w-full max-w-sm rounded-2xl p-8" style={{ backgroundColor: 'white' }}>
        <div className="text-center mb-8">
          <h1 className="text-xl font-black" style={{ color: '#101828' }}>
            Good<span style={{ color: '#155DFC' }}>Creator</span>
          </h1>
          <p className="text-sm mt-1" style={{ color: '#9CA3AF' }}>Admin access</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-bold mb-1" style={{ color: '#374151' }}>Email</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              placeholder="Please enter your admin email"
              className="w-full px-4 py-2.5 rounded-lg border text-sm focus:outline-none focus:ring-2"
              style={{ borderColor: '#E5E7EB' }}
            />
          </div>

          <div>
            <label className="block text-sm font-bold mb-1" style={{ color: '#374151' }}>Password</label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              required
              placeholder="••••••••"
              className="w-full px-4 py-2.5 rounded-lg border text-sm focus:outline-none focus:ring-2"
              style={{ borderColor: '#E5E7EB' }}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 rounded-lg font-bold text-sm text-white disabled:opacity-60"
            style={{ backgroundColor: '#155DFC' }}
          >
            {loading ? 'Logging in...' : 'Log in'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default AdminLogin;
