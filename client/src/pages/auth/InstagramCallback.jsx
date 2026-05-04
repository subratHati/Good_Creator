// import { useEffect, useState } from 'react'; 
// import { useNavigate } from 'react-router-dom';
// import axiosInstance from '../../api/axiosInstance';
// import useAuth from '../../hooks/useAuth';
// import toast from 'react-hot-toast';

// const formatNumber = (num) => {
//   if (!num) return '0';
//   if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
//   if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
//   return num.toString();
// };

// const InstagramCallback = () => {
//   const navigate = useNavigate();
//   const { user } = useAuth();
//   const [status, setStatus] = useState('connecting');
//   const [accounts, setAccounts] = useState([]);
//   const [selecting, setSelecting] = useState(null);

//   useEffect(() => {
//     const handleCallback = async () => {
//       const urlParams = new URLSearchParams(window.location.search);
//       const code = urlParams.get('code');
//       const error = urlParams.get('error');

//       if (error) {
//         toast.error('Instagram connection was cancelled');
//         navigate(`/${user?.role}/profile`);
//         return;
//       }

//       if (!code) {
//         toast.error('No authorization code received');
//         navigate(`/${user?.role}/profile`);
//         return;
//       }

//       try {
//         setStatus('connecting');
//         const res = await axiosInstance.post('/instagram/connect', { code });

//         if (res.data.requiresSelection) {
//           // multiple accounts — show selection screen
//           setAccounts(res.data.accounts);
//           setStatus('selecting');
//         } else {
//           // single account — auto connected
//           setStatus('success');
//           toast.success('Instagram connected successfully!');
//           setTimeout(() => navigate(`/${user?.role}/profile`), 1500);
//         }
//       } catch (error) {
//         setStatus('error');
//         const msg = error.response?.data?.message || 'Failed to connect Instagram';
//         toast.error(msg);
//         setTimeout(() => navigate(`/${user?.role}/profile`), 2000);
//       }
//     };

//     handleCallback();
//   }, []);

//   const handleSelectAccount = async (account) => {
//     setSelecting(account.instagramId);
//     try {
//       await axiosInstance.post('/instagram/select-account', {
//         instagramId: account.instagramId,
//         username: account.username,
//         profilePicture: account.profilePicture,
//         followersCount: account.followersCount,
//         pageAccessToken: account.pageAccessToken,
//       });
//       setStatus('success');
//       toast.success(`@${account.username} connected successfully!`);
//       setTimeout(() => navigate(`/${user?.role}/profile`), 1500);
//     } catch (error) {
//       toast.error('Failed to connect this account. Try again.');
//       setSelecting(null);
//     }
//   };

//   return (
//     <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
//       <div className="bg-white rounded-2xl border border-gray-200 w-full max-w-sm mx-auto">

//         {/* connecting state */}
//         {status === 'connecting' && (
//           <div className="p-8 text-center">
//             <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
//             <h2 className="text-lg font-bold text-gray-900 mb-2">Connecting Instagram</h2>
//             <p className="text-sm text-gray-500">Fetching your accounts...</p>
//           </div>
//         )}

//         {/* account selection state */}
//         {status === 'selecting' && (
//           <div className="p-6">
//             <div className="text-center mb-6">
//               <div className="w-12 h-12 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-3">
//                 <span className="text-2xl">📸</span>
//               </div>
//               <h2 className="text-lg font-bold text-gray-900">Select Instagram account</h2>
//               <p className="text-sm text-gray-500 mt-1">
//                 We found {accounts.length} Instagram accounts. Choose which one to connect.
//               </p>
//             </div>

//             <div className="space-y-3">
//               {accounts.map((account) => (
//                 <button
//                   key={account.instagramId}
//                   onClick={() => handleSelectAccount(account)}
//                   disabled={!!selecting}
//                   className={`w-full flex items-center gap-3 p-4 rounded-xl border-2 text-left transition-all ${
//                     selecting === account.instagramId
//                       ? 'border-blue-600 bg-blue-50'
//                       : 'border-gray-200 hover:border-blue-300 hover:bg-gray-50'
//                   } disabled:opacity-60`}
//                 >
//                   {/* profile picture */}
//                   <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white font-bold text-lg flex-shrink-0 overflow-hidden">
//                     {account.profilePicture ? (
//                       <img
//                         src={account.profilePicture}
//                         alt={account.username}
//                         className="w-full h-full object-cover"
//                       />
//                     ) : (
//                       account.username?.[0]?.toUpperCase()
//                     )}
//                   </div>

//                   {/* account info */}
//                   <div className="flex-1 min-w-0">
//                     <div className="font-semibold text-gray-900 truncate">
//                       @{account.username}
//                     </div>
//                     <div className="text-sm text-gray-500">
//                       {formatNumber(account.followersCount)} followers
//                     </div>
//                     <div className="text-xs text-gray-400 truncate">
//                       via {account.pageName}
//                     </div>
//                   </div>

//                   {/* loading or arrow */}
//                   <div className="flex-shrink-0">
//                     {selecting === account.instagramId ? (
//                       <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
//                     ) : (
//                       <span className="text-gray-400 text-lg">→</span>
//                     )}
//                   </div>
//                 </button>
//               ))}
//             </div>

//             <button
//               onClick={() => navigate(`/${user?.role}/profile`)}
//               className="w-full mt-4 py-2.5 text-sm text-gray-500 hover:text-gray-700 transition-colors"
//             >
//               Cancel
//             </button>
//           </div>
//         )}

//         {/* success state */}
//         {status === 'success' && (
//           <div className="p-8 text-center">
//             <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
//               <span className="text-green-600 text-2xl">✓</span>
//             </div>
//             <h2 className="text-lg font-bold text-gray-900 mb-2">Instagram connected!</h2>
//             <p className="text-sm text-gray-500">Redirecting to your profile...</p>
//           </div>
//         )}

//         {/* error state */}
//         {status === 'error' && (
//           <div className="p-8 text-center">
//             <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
//               <span className="text-red-600 text-2xl">✕</span>
//             </div>
//             <h2 className="text-lg font-bold text-gray-900 mb-2">Connection failed</h2>
//             <p className="text-sm text-gray-500">Redirecting back to your profile...</p>
//           </div>
//         )}
//       </div>
//     </div>
//   );
// };

// export default InstagramCallback;


import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosInstance from '../../api/axiosInstance';
import useAuth from '../../hooks/useAuth';
import toast from 'react-hot-toast';

const InstagramCallback = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [status, setStatus] = useState('connecting');
  const [message, setMessage] = useState('Fetching your Instagram profile...');

  useEffect(() => {
    const handleCallback = async () => {
      const urlParams = new URLSearchParams(window.location.search);
      const code = urlParams.get('code');
      const error = urlParams.get('error');
      const errorReason = urlParams.get('error_reason');

      if (error) {
        if (errorReason === 'user_denied') {
          toast.error('Instagram connection was cancelled');
        } else {
          toast.error('Instagram connection failed');
        }
        navigate(`/${user?.role}/profile`);
        return;
      }

      if (!code) {
        toast.error('No authorization code received');
        navigate(`/${user?.role}/profile`);
        return;
      }

      // strip the #_ that Instagram sometimes appends
      const cleanCode = code.replace(/#_$/, '');

      try {
        setStatus('connecting');
        setMessage('Fetching your Instagram profile...');

        const res = await axiosInstance.post('/instagram/connect', { code: cleanCode });

        setMessage('Calculating your engagement metrics...');

        setStatus('success');
        toast.success(`@${res.data.instagram?.handle} connected successfully!`);
        setTimeout(() => navigate(`/${user?.role}/profile`), 1500);
      } catch (error) {
        setStatus('error');
        const msg = error.response?.data?.message || 'Failed to connect Instagram';
        toast.error(msg);
        setTimeout(() => navigate(`/${user?.role}/profile`), 2000);
      }
    };

    handleCallback();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="bg-white rounded-2xl border border-gray-200 p-8 text-center max-w-sm w-full">

        {status === 'connecting' && (
          <>
            <div className="w-14 h-14 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-5" />
            <h2 className="text-lg font-bold text-gray-900 mb-2">Connecting Instagram</h2>
            <p className="text-sm text-gray-500">{message}</p>
          </>
        )}

        {status === 'success' && (
          <>
            <div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-5">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
            </div>
            <h2 className="text-lg font-bold text-gray-900 mb-2">Instagram connected!</h2>
            <p className="text-sm text-gray-500">Redirecting to your profile...</p>
          </>
        )}

        {status === 'error' && (
          <>
            <div className="w-14 h-14 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-5">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </div>
            <h2 className="text-lg font-bold text-gray-900 mb-2">Connection failed</h2>
            <p className="text-sm text-gray-500">Redirecting back to your profile...</p>
          </>
        )}
      </div>
    </div>
  );
};

export default InstagramCallback;