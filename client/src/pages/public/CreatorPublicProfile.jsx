import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, ExternalLink, MapPin, CheckCircle } from 'lucide-react';
import axiosInstance from '../../api/axiosInstance';
import { sendEnquiry } from '../../api/enquiries';
import useAuth from '../../hooks/useAuth';
import toast from 'react-hot-toast';

const formatNumber = (num) => {
  if (!num) return '0';
  if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
  if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
  return num.toString();
};

const CreatorPublicProfile = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [creator, setCreator] = useState(null);
  const [loading, setLoading] = useState(true);
  const [enquiryModal, setEnquiryModal] = useState(false);
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);

  useEffect(() => {
    const fetch = async () => {
      try {
        const res = await axiosInstance.get(`/creators/${id}`);
        setCreator(res.data.creator);
      } catch {
        setCreator(null);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [id]);

  const handleSendEnquiry = async () => {
    if (!message.trim()) {
      toast.error('Please enter a message');
      return;
    }
    setSending(true);
    try {
      await sendEnquiry(id, message);
      toast.success('Enquiry sent successfully');
      setEnquiryModal(false);
      setMessage('');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to send enquiry');
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!creator) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-4">😕</div>
          <div className="font-semibold text-gray-900">Creator not found</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">

      {/* header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-6 h-14 flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft size={18} />
          </button>
          <span className="font-semibold text-gray-900">{creator.name}</span>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

          {/* left column */}
          <div className="md:col-span-1 space-y-4">

            {/* profile card */}
            <div className="bg-white rounded-xl border border-gray-200 p-6 text-center">
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white font-bold text-2xl mx-auto mb-3 overflow-hidden">
                {creator.profilePhoto
                  ? <img src={creator.profilePhoto} alt={creator.name} className="w-full h-full object-cover" />
                  : creator.name?.[0]?.toUpperCase()
                }
              </div>

              <div className="flex items-center justify-center gap-1.5 mb-1">
                <h1 className="text-xl font-bold text-gray-900">{creator.name}</h1>
                {creator.isAdminVerified && (
                  <CheckCircle size={18} className="text-blue-500" />
                )}
              </div>

              {creator.instagram?.handle && (
                <div className="text-sm text-gray-500 mb-2">
                  @{creator.instagram.handle}
                </div>
              )}

              {creator.location?.city && (
                <div className="flex items-center justify-center gap-1 text-xs text-gray-400 mb-3">
                  <MapPin size={12} />
                  {creator.location.city}
                  {creator.location.state ? `, ${creator.location.state}` : ''}
                </div>
              )}

              <div className="flex flex-wrap justify-center gap-1.5 mb-4">
                <span className={`flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full ${
                  creator.isOpenForCollab
                    ? 'bg-green-100 text-green-700'
                    : 'bg-gray-100 text-gray-600'
                }`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${
                    creator.isOpenForCollab ? 'bg-green-500' : 'bg-gray-400'
                  }`} />
                  {creator.isOpenForCollab ? 'Open for collab' : 'Closed'}
                </span>
                {creator.barterEnabled && (
                  <span className="bg-amber-100 text-amber-700 text-xs font-medium px-2.5 py-1 rounded-full">
                    Barter ✓
                  </span>
                )}
              </div>

              {creator.bio && (
                <p className="text-sm text-gray-600 leading-relaxed mb-4">
                  {creator.bio}
                </p>
              )}

              {/* action buttons */}
              <div className="space-y-2">
                {user?.role === 'brand' && (
                  <button
                    onClick={() => setEnquiryModal(true)}
                    className="w-full py-2.5 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 transition-colors"
                  >
                    Send enquiry
                  </button>
                )}
                {creator.instagram?.handle && (
                  
                  <a
                    href={"https://instagram.com/" + creator.instagram.handle}
                    target="_blank"
                    rel="noreferrer"
                    className="w-full flex items-center justify-center gap-2 py-2.5 border border-gray-200 text-gray-600 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
                  >
                    <ExternalLink size={14} />
                    View Instagram
                  </a>
                )}
              </div>
            </div>

            {/* categories */}
            {creator.categories?.length > 0 && (
              <div className="bg-white rounded-xl border border-gray-200 p-4">
                <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
                  Niches
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {creator.categories.map((cat) => (
                    <span key={cat} className="bg-blue-50 text-blue-700 text-xs font-medium px-2.5 py-1 rounded-full capitalize">
                      {cat}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* languages */}
            {creator.languages?.length > 0 && (
              <div className="bg-white rounded-xl border border-gray-200 p-4">
                <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
                  Languages
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {creator.languages.map((lang) => (
                    <span key={lang} className="bg-gray-100 text-gray-600 text-xs font-medium px-2.5 py-1 rounded-full">
                      {lang}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* right column */}
          <div className="md:col-span-2 space-y-4">

            {/* instagram stats */}
            {creator.instagram?.isConnected && (
              <div className="bg-white rounded-xl border border-gray-200 p-5">
                <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-4">
                  Instagram stats — verified
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {[
                    { label: 'Followers', value: formatNumber(creator.instagram.followersCount), highlight: true },
                    { label: 'Engagement', value: creator.instagram.engagementRate ? `${creator.instagram.engagementRate}%` : '—', highlight: true },
                    { label: 'Avg reach', value: formatNumber(creator.instagram.avgReach), highlight: false },
                    { label: 'Avg likes', value: formatNumber(creator.instagram.avgLikes), highlight: false },
                  ].map(({ label, value, highlight }) => (
                    <div key={label} className="bg-gray-50 rounded-lg p-3 text-center">
                      <div className="text-xs font-semibold text-gray-500 mb-1">{label}</div>
                      <div className={`text-xl font-bold ${highlight ? 'text-orange-500' : 'text-gray-900'}`}>
                        {value}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* pricing table */}
            {(creator.pricing?.reel > 0 ||
              creator.pricing?.post > 0 ||
              creator.pricing?.story > 0 ||
              creator.pricing?.ugcCollab > 0 ||
              creator.pricing?.ugcNonCollab > 0) && (
              <div className="bg-white rounded-xl border border-gray-200 p-5">
                <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-4">
                  Pricing
                </div>
                <div className="space-y-0">
                  {[
                    { key: 'reel', label: 'Reel', desc: 'Short video content' },
                    { key: 'post', label: 'Feed post', desc: 'Photo or carousel' },
                    { key: 'story', label: 'Story', desc: '24hr story mention' },
                    { key: 'ugcCollab', label: 'UGC with collab tag', desc: 'With brand tag' },
                    { key: 'ugcNonCollab', label: 'UGC without collab tag', desc: 'Without brand tag' },
                  ]
                    .filter(({ key }) => creator.pricing?.[key] > 0)
                    .map(({ key, label, desc }, i, arr) => (
                      <div
                        key={key}
                        className={`flex items-center justify-between py-3 ${
                          i < arr.length - 1 ? 'border-b border-gray-100' : ''
                        }`}
                      >
                        <div>
                          <div className="text-sm font-medium text-gray-900">{label}</div>
                          <div className="text-xs text-gray-400">{desc}</div>
                        </div>
                        <div className="text-sm font-bold text-gray-900">
                          ₹{creator.pricing[key].toLocaleString('en-IN')}
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            )}

            {/* sample content */}
            {creator.sampleContentLinks?.filter(l => l).length > 0 && (
              <div className="bg-white rounded-xl border border-gray-200 p-5">
                <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-4">
                  Sample content
                </div>
                <div className="space-y-2">
                  {creator.sampleContentLinks.filter(l => l).map((link, i) => (
                    
                    <a
                      key={i}
                      href={link}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg text-sm text-blue-600 hover:bg-blue-50 transition-colors"
                    >
                      <ExternalLink size={14} />
                      Sample {i + 1}
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* enquiry modal */}
      {enquiryModal && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 px-4"
          onClick={() => setEnquiryModal(false)}
        >
          <div
            className="bg-white rounded-2xl p-6 w-full max-w-md"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="font-bold text-gray-900 text-lg mb-1">Send enquiry</h3>
            <p className="text-sm text-gray-500 mb-4">
              to {creator.name}
            </p>

            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={4}
              placeholder="Hi! We'd love to collaborate with you on..."
              className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm resize-none mb-4"
            />

            <div className="flex gap-3">
              <button
                onClick={() => setEnquiryModal(false)}
                className="flex-1 py-2.5 border border-gray-200 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSendEnquiry}
                disabled={sending}
                className="flex-1 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 transition-colors disabled:opacity-60"
              >
                {sending ? 'Sending...' : 'Send enquiry'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CreatorPublicProfile;