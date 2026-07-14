import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosInstance from '../../api/axiosInstance';
import useAuth from '../../hooks/useAuth';
import toast from 'react-hot-toast';

const formatNumber = (num) => {
  if (!num) return '0';
  if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
  if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
  return num.toString();
};

const InstagramCallback = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [status, setStatus] = useState('connecting');
  const [accounts, setAccounts] = useState([]);
  const [selecting, setSelecting] = useState(null);

  useEffect(() => {
    const handleCallback = async () => {
      const urlParams = new URLSearchParams(window.location.search);
      const code = urlParams.get('code');
      const error = urlParams.get('error');

      if (error) {
        toast.error('Instagram connection was cancelled');
        navigate(`/${user?.role}/profile`, { replace: true });
        return;
      }

      if (!code) {
        toast.error('No authorization code received');
        navigate(`/${user?.role}/profile`, { replace: true });
        return;
      }

      try {
        setStatus('connecting');
        const res = await axiosInstance.post('/instagram/connect', { code });

        if (res.data.requiresSelection) {
          // multiple accounts — show selection screen
          setAccounts(res.data.accounts);
          setStatus('selecting');
        } else {
          // single account — auto connected
          setStatus('success');
          toast.success('Instagram connected successfully!');
          setTimeout(() => navigate(`/${user?.role}/profile`, { replace: true }), 1500);
        }
      } catch (error) {
        setStatus('error');
        const msg = error.response?.data?.message || 'Failed to connect Instagram';
        toast.error(msg);
        setTimeout(() => navigate(`/${user?.role}/profile`, { replace: true }), 2000);
      }
    };

    handleCallback();
  }, []);

  const handleSelectAccount = async (account) => {
    setSelecting(account.instagramId);
    try {
      await axiosInstance.post('/instagram/select-account', {
        instagramId: account.instagramId,
        username: account.username,
        profilePicture: account.profilePicture,
        followersCount: account.followersCount,
        pageAccessToken: account.pageAccessToken,
      });
      setStatus('success');
      toast.success(`@${account.username} connected successfully!`);
      setTimeout(() => navigate(`/${user?.role}/profile`, { replace: true }), 1500);
    } catch (error) {
      toast.error('Failed to connect this account. Try again.');
      setSelecting(null);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ backgroundColor: '#F5F5F7' }}>
      <div className="w-full max-w-sm mx-auto rounded-3xl overflow-hidden" style={{ backgroundColor: 'white', border: '1.5px solid #F0F0F0', boxShadow: '0 6px 0 0 #E5E5E5' }}>

        {/* connecting state */}
        {status === 'connecting' && (
          <div className="p-8 text-center">
            <div
              className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-5"
              style={{ background: 'linear-gradient(135deg,#f9ce34,#ee2a7b,#6228d7)' }}
            >
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
                <circle cx="12" cy="12" r="4" />
                <circle cx="17.5" cy="6.5" r="1" fill="white" stroke="none" />
              </svg>
            </div>
            <div className="w-8 h-8 rounded-full animate-spin mx-auto mb-5" style={{ border: '3px solid #EFF6FF', borderTopColor: '#155DFC' }} />
            <h2 className="font-black text-lg mb-1.5" style={{ color: '#101828' }}>Connecting Instagram</h2>
            <p className="text-sm" style={{ color: '#9CA3AF' }}>Fetching your accounts, this may take a moment...</p>
          </div>
        )}

        {/* account selection state */}
        {status === 'selecting' && (
          <div className="p-6">
            <div className="text-center mb-6">
              <div
                className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4"
                style={{ background: 'linear-gradient(135deg,#f9ce34,#ee2a7b,#6228d7)' }}
              >
                <span className="text-2xl">📸</span>
              </div>
              <h2 className="font-black text-lg" style={{ color: '#101828' }}>Select Instagram account</h2>
              <p className="text-sm mt-1" style={{ color: '#9CA3AF' }}>
                We found {accounts.length} Instagram accounts. Choose which one to connect.
              </p>
            </div>

            <div className="space-y-3">
              {accounts.map((account) => (
                <button
                  key={account.instagramId}
                  onClick={() => handleSelectAccount(account)}
                  disabled={!!selecting}
                  className="w-full flex items-center gap-3 p-4 rounded-2xl text-left transition-all disabled:opacity-60"
                  style={{
                    border: selecting === account.instagramId ? '2px solid #155DFC' : '2px solid #E5E7EB',
                    backgroundColor: selecting === account.instagramId ? '#EFF6FF' : 'white',
                  }}
                >
                  {/* profile picture */}
                  <div
                    className="w-12 h-12 rounded-full flex items-center justify-center text-white font-black text-lg flex-shrink-0 overflow-hidden"
                    style={{ background: 'linear-gradient(135deg,#155DFC,#0D3FAE)' }}
                  >
                    {account.profilePicture ? (
                      <img src={account.profilePicture} alt={account.username} className="w-full h-full object-cover" />
                    ) : (
                      account.username?.[0]?.toUpperCase()
                    )}
                  </div>

                  {/* account info */}
                  <div className="flex-1 min-w-0">
                    <div className="font-black truncate" style={{ color: '#101828' }}>
                      @{account.username}
                    </div>
                    <div className="text-sm" style={{ color: '#6B7280' }}>
                      {formatNumber(account.followersCount)} followers
                    </div>
                    <div className="text-xs truncate" style={{ color: '#9CA3AF' }}>
                      via {account.pageName}
                    </div>
                  </div>

                  {/* loading or arrow */}
                  <div className="flex-shrink-0">
                    {selecting === account.instagramId ? (
                      <div className="w-5 h-5 rounded-full animate-spin" style={{ border: '2px solid #BFDBFE', borderTopColor: '#155DFC' }} />
                    ) : (
                      <span style={{ color: '#9CA3AF', fontSize: '18px' }}>→</span>
                    )}
                  </div>
                </button>
              ))}
            </div>

            <button
              onClick={() => navigate(`/${user?.role}/profile`, { replace: true })}
              className="w-full mt-4 py-2.5 text-sm font-semibold transition-colors"
              style={{ color: '#9CA3AF' }}
            >
              Cancel
            </button>
          </div>
        )}

        {/* success state */}
        {status === 'success' && (
          <div className="p-8 text-center">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-5" style={{ backgroundColor: '#DCFCE7', boxShadow: '0 3px 0 0 #86EFAC' }}>
              <span style={{ color: '#166534', fontSize: '26px' }}>✓</span>
            </div>
            <h2 className="font-black text-lg mb-1.5" style={{ color: '#101828' }}>Instagram connected!</h2>
            <p className="text-sm" style={{ color: '#9CA3AF' }}>Redirecting to your profile...</p>
          </div>
        )}

        {/* error state */}
        {status === 'error' && (
          <div className="p-8 text-center">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-5" style={{ backgroundColor: '#FEE2E2', boxShadow: '0 3px 0 0 #FCA5A5' }}>
              <span style={{ color: '#991B1B', fontSize: '26px' }}>✕</span>
            </div>
            <h2 className="font-black text-lg mb-1.5" style={{ color: '#101828' }}>Connection failed</h2>
            <p className="text-sm" style={{ color: '#9CA3AF' }}>Redirecting back to your profile...</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default InstagramCallback;
