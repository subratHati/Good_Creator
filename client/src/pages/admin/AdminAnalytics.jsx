import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, BarChart3, Copy, MessageSquare, Check } from 'lucide-react';
import { getUserAnalytics, getCampaignAnalytics, getCollabAnalytics, getBrandsWithConversations, exportBrandConversations } from '../../api/analytics';
import useAuth from '../../hooks/useAuth';
import toast from 'react-hot-toast';

const CATEGORIES = ['lifestyle', 'food', 'travel', 'fashion', 'beauty', 'tech', 'fitness', 'gaming', 'education', 'finance', 'entertainment', 'parenting_family', 'vlogging', 'dance', 'religious', 'news_politics', 'video_editing', 'ai_content', 'pets_wildlife', 'other'];

// same display-label logic used across the app's category pickers
const categoryLabels = {
  parenting_family: 'Parenting/Family',
  news_politics: 'News/Politics',
  pets_wildlife: 'Pets/Wildlife',
  ai_content: 'AI Content',
};
const getCategoryLabel = (cat) => {
  if (categoryLabels[cat]) return categoryLabels[cat];
  const spaced = cat.replace(/_/g, ' ');
  return spaced.charAt(0).toUpperCase() + spaced.slice(1);
};

const formatDate = (date) =>
  date ? new Date(date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—';

const formatCurrency = (n) => `₹${(n || 0).toLocaleString('en-IN')}`;

const FilterPill = ({ active, onClick, children }) => (
  <button
    onClick={onClick}
    className="px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors"
    style={{
      backgroundColor: active ? '#101828' : 'white',
      color: active ? 'white' : '#6B7280',
      borderColor: active ? '#101828' : '#E5E7EB',
    }}
  >
    {children}
  </button>
);

const SummaryCard = ({ label, value }) => (
  <div className="bg-white rounded-2xl border p-4 text-center" style={{ borderColor: '#E5E7EB' }}>
    <div className="text-2xl font-black" style={{ color: '#101828' }}>{value}</div>
    <div className="text-xs mt-1" style={{ color: '#9CA3AF' }}>{label}</div>
  </div>
);

const UsersTab = () => {
  const [data, setData] = useState({ creators: [], brands: [], summary: { totalCreators: 0, totalBrands: 0, total: 0 } });
  const [loading, setLoading] = useState(true);
  const [range, setRange] = useState('');
  const [role, setRole] = useState('');
  const [category, setCategory] = useState('');

  const fetchData = async (r = range, rl = role, c = category) => {
    setLoading(true);
    try {
      const params = {};
      if (r) params.range = r;
      if (rl) params.role = rl;
      if (c) params.category = c;
      const res = await getUserAnalytics(params);
      setData(res.data);
    } catch {
      toast.error('Failed to load user analytics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const combined = [
    ...data.creators.map(c => ({ ...c, __role: 'creator', __displayName: c.name, __category: c.categories?.[0] })),
    ...data.brands.map(b => ({ ...b, __role: 'brand', __displayName: b.brandName, __category: b.category })),
  ].sort((a, b) => new Date(b.userId?.createdAt || 0) - new Date(a.userId?.createdAt || 0));

  return (
    <div>
      <div className="grid grid-cols-3 gap-3 mb-5">
        <SummaryCard label="Total Users" value={data.summary.total} />
        <SummaryCard label="Creators" value={data.summary.totalCreators} />
        <SummaryCard label="Brands" value={data.summary.totalBrands} />
      </div>

      <div className="flex flex-wrap items-center gap-2 mb-4">
        <span className="text-xs font-bold uppercase tracking-wider mr-1" style={{ color: '#9CA3AF' }}>Registered</span>
        {[{ v: '', l: 'All time' }, { v: 'today', l: 'Today' }, { v: 'this_week', l: 'This week' }, { v: 'this_month', l: 'This month' }].map(opt => (
          <FilterPill key={opt.v} active={range === opt.v} onClick={() => { setRange(opt.v); fetchData(opt.v, role, category); }}>{opt.l}</FilterPill>
        ))}
      </div>
      <div className="flex flex-wrap items-center gap-2 mb-4">
        <span className="text-xs font-bold uppercase tracking-wider mr-1" style={{ color: '#9CA3AF' }}>Role</span>
        {[{ v: '', l: 'All' }, { v: 'creator', l: 'Creators' }, { v: 'brand', l: 'Brands' }].map(opt => (
          <FilterPill key={opt.v} active={role === opt.v} onClick={() => { setRole(opt.v); fetchData(range, opt.v, category); }}>{opt.l}</FilterPill>
        ))}
        <span className="text-xs font-bold uppercase tracking-wider ml-3 mr-1" style={{ color: '#9CA3AF' }}>Category</span>
        <select
          value={category}
          onChange={e => { setCategory(e.target.value); fetchData(range, role, e.target.value); }}
          className="px-3 py-1.5 rounded-full text-xs font-semibold border bg-white focus:outline-none"
          style={{ borderColor: '#E5E7EB', color: '#6B7280' }}
        >
          <option value="">All categories</option>
          {CATEGORIES.map(c => <option key={c} value={c}>{getCategoryLabel(c)}</option>)}
        </select>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="w-8 h-8 rounded-full animate-spin" style={{ border: '3px solid #EFF6FF', borderTopColor: '#155DFC' }} />
        </div>
      ) : combined.length === 0 ? (
        <div className="bg-white rounded-2xl border p-12 text-center text-sm" style={{ borderColor: '#E5E7EB', color: '#9CA3AF' }}>No users match these filters.</div>
      ) : (
        <div className="bg-white rounded-2xl border overflow-hidden" style={{ borderColor: '#E5E7EB' }}>
          <div className="divide-y" style={{ borderColor: '#F0F0F0' }}>
            {combined.map(u => (
              <div key={u._id} className="flex items-center gap-4 px-5 py-3.5">
                <span className="text-xs font-bold px-2 py-1 rounded-full capitalize flex-shrink-0" style={{ backgroundColor: u.__role === 'creator' ? '#EFF6FF' : '#FEF3C7', color: u.__role === 'creator' ? '#1E3A8A' : '#92400E' }}>
                  {u.__role}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="font-bold text-sm truncate" style={{ color: '#101828' }}>{u.__displayName || 'Unnamed'}</div>
                  <div className="text-xs truncate" style={{ color: '#9CA3AF' }}>{u.userId?.email || '—'}</div>
                </div>
                {u.__category && (
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-full flex-shrink-0" style={{ backgroundColor: '#F3F4F6', color: '#6B7280' }}>{getCategoryLabel(u.__category)}</span>
                )}
                <div className="text-xs flex-shrink-0" style={{ color: '#9CA3AF' }}>{formatDate(u.userId?.createdAt)}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

const CampaignsTab = () => {
  const [data, setData] = useState({ campaigns: [], summary: { total: 0, active: 0, closed: 0, draft: 0 } });
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState('');

  const fetchData = async (s = status) => {
    setLoading(true);
    try {
      const params = {};
      if (s) params.status = s;
      const res = await getCampaignAnalytics(params);
      setData(res.data);
    } catch {
      toast.error('Failed to load campaign analytics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  return (
    <div>
      <div className="grid grid-cols-4 gap-3 mb-5">
        <SummaryCard label="Total" value={data.summary.total} />
        <SummaryCard label="Active" value={data.summary.active} />
        <SummaryCard label="Closed" value={data.summary.closed} />
        <SummaryCard label="Draft" value={data.summary.draft} />
      </div>

      <div className="flex flex-wrap items-center gap-2 mb-4">
        <span className="text-xs font-bold uppercase tracking-wider mr-1" style={{ color: '#9CA3AF' }}>Status</span>
        {[{ v: '', l: 'All (incl. closed)' }, { v: 'active', l: 'Active' }, { v: 'closed', l: 'Closed' }, { v: 'draft', l: 'Draft' }].map(opt => (
          <FilterPill key={opt.v} active={status === opt.v} onClick={() => { setStatus(opt.v); fetchData(opt.v); }}>{opt.l}</FilterPill>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="w-8 h-8 rounded-full animate-spin" style={{ border: '3px solid #EFF6FF', borderTopColor: '#155DFC' }} />
        </div>
      ) : data.campaigns.length === 0 ? (
        <div className="bg-white rounded-2xl border p-12 text-center text-sm" style={{ borderColor: '#E5E7EB', color: '#9CA3AF' }}>No campaigns match these filters.</div>
      ) : (
        <div className="bg-white rounded-2xl border overflow-hidden" style={{ borderColor: '#E5E7EB' }}>
          <div className="divide-y" style={{ borderColor: '#F0F0F0' }}>
            {data.campaigns.map(c => (
              <div key={c._id} className="flex items-center gap-4 px-5 py-3.5">
                <span
                  className="text-xs font-bold px-2 py-1 rounded-full capitalize flex-shrink-0"
                  style={{
                    backgroundColor: c.status === 'active' ? '#F0FDF4' : c.status === 'closed' ? '#FEF2F2' : '#F3F4F6',
                    color: c.status === 'active' ? '#166534' : c.status === 'closed' ? '#991B1B' : '#6B7280',
                  }}
                >
                  {c.status}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="font-bold text-sm truncate" style={{ color: '#101828' }}>{c.title || 'Campaign'}</div>
                  <div className="text-xs truncate" style={{ color: '#9CA3AF' }}>By {c.brandId?.brandName || 'Brand'}</div>
                </div>
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  <span className="text-xs font-semibold px-2 py-1 rounded-full" style={{ backgroundColor: '#EFF6FF', color: '#1E3A8A' }}>
                    {c.applicantCounts?.applied || 0} applied
                  </span>
                  <span className="text-xs font-semibold px-2 py-1 rounded-full" style={{ backgroundColor: '#F0FDF4', color: '#166534' }}>
                    {c.applicantCounts?.shortlisted || 0} shortlisted
                  </span>
                  <span className="text-xs font-semibold px-2 py-1 rounded-full" style={{ backgroundColor: '#FEF2F2', color: '#991B1B' }}>
                    {c.applicantCounts?.rejected || 0} rejected
                  </span>
                </div>
                <div className="text-xs flex-shrink-0" style={{ color: '#9CA3AF' }}>{formatDate(c.createdAt)}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

const CollabsTab = () => {
  const [data, setData] = useState({ collabs: [], summary: { total: 0, pending: 0, delivered: 0, completed: 0, totalValue: 0 } });
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState('');

  const fetchData = async (s = status) => {
    setLoading(true);
    try {
      const params = {};
      if (s) params.status = s;
      const res = await getCollabAnalytics(params);
      setData(res.data);
    } catch {
      toast.error('Failed to load collab analytics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const statusStyles = {
    pending: { bg: '#FFFBEB', color: '#92400E' },
    delivered: { bg: '#EFF6FF', color: '#1E3A8A' },
    completed: { bg: '#F0FDF4', color: '#166534' },
  };

  return (
    <div>
      <div className="grid grid-cols-4 gap-3 mb-5">
        <SummaryCard label="Total Collabs" value={data.summary.total} />
        <SummaryCard label="Pending" value={data.summary.pending} />
        <SummaryCard label="Delivered" value={data.summary.delivered} />
        <SummaryCard label="Completed" value={data.summary.completed} />
      </div>
      <div className="bg-white rounded-2xl border p-4 mb-5 text-center" style={{ borderColor: '#E5E7EB' }}>
        <div className="text-xs mb-1" style={{ color: '#9CA3AF' }}>Total Collab Value (filtered)</div>
        <div className="text-xl font-black" style={{ color: '#101828' }}>{formatCurrency(data.summary.totalValue)}</div>
      </div>

      <div className="flex flex-wrap items-center gap-2 mb-4">
        <span className="text-xs font-bold uppercase tracking-wider mr-1" style={{ color: '#9CA3AF' }}>Status</span>
        {[
          { v: '', l: 'All' },
          { v: 'pending', l: 'Paid, awaiting delivery' },
          { v: 'delivered', l: 'Delivery approved' },
          { v: 'completed', l: 'Payout completed' },
        ].map(opt => (
          <FilterPill key={opt.v} active={status === opt.v} onClick={() => { setStatus(opt.v); fetchData(opt.v); }}>{opt.l}</FilterPill>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="w-8 h-8 rounded-full animate-spin" style={{ border: '3px solid #EFF6FF', borderTopColor: '#155DFC' }} />
        </div>
      ) : data.collabs.length === 0 ? (
        <div className="bg-white rounded-2xl border p-12 text-center text-sm" style={{ borderColor: '#E5E7EB', color: '#9CA3AF' }}>No collaborations match these filters.</div>
      ) : (
        <div className="bg-white rounded-2xl border overflow-hidden" style={{ borderColor: '#E5E7EB' }}>
          <div className="divide-y" style={{ borderColor: '#F0F0F0' }}>
            {data.collabs.map(c => {
              const st = statusStyles[c.status] || statusStyles.pending;
              return (
                <div key={c._id} className="flex items-center gap-4 px-5 py-3.5">
                  <span className="text-xs font-bold px-2 py-1 rounded-full capitalize flex-shrink-0" style={{ backgroundColor: st.bg, color: st.color }}>{c.status}</span>
                  <div className="flex-1 min-w-0">
                    <div className="font-bold text-sm truncate" style={{ color: '#101828' }}>{c.creatorId?.name || 'Creator'} × {c.brandId?.brandName || 'Brand'}</div>
                    <div className="text-xs font-mono truncate" style={{ color: '#9CA3AF' }}>{c.collabId}</div>
                  </div>
                  <div className="text-sm font-bold flex-shrink-0" style={{ color: '#101828' }}>{formatCurrency(c.amount)}</div>
                  <div className="text-xs flex-shrink-0 w-20 text-right" style={{ color: '#9CA3AF' }}>{formatDate(c.paidAt)}</div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

const ConversationsTab = () => {
  const [brands, setBrands] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedBrand, setSelectedBrand] = useState(null);
  const [exportText, setExportText] = useState('');
  const [exportLoading, setExportLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [category, setCategory] = useState('');
  const [range, setRange] = useState('');
  const [sortBy, setSortBy] = useState('recent');

  const fetchBrands = async (c = category, r = range, s = sortBy) => {
    setLoading(true);
    try {
      const params = {};
      if (c) params.category = c;
      if (r) params.range = r;
      if (s) params.sortBy = s;
      const res = await getBrandsWithConversations(params);
      setBrands(res.data.brands || []);
    } catch {
      toast.error('Failed to load brands');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchBrands(); }, []);

  const handleSelectBrand = async (brand) => {
    setSelectedBrand(brand);
    setExportLoading(true);
    setCopied(false);
    try {
      const res = await exportBrandConversations(brand.brandId);
      setExportText(res.data.text);
    } catch {
      toast.error('Failed to load conversations');
      setExportText('');
    } finally {
      setExportLoading(false);
    }
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(exportText);
      setCopied(true);
      toast.success('Copied — paste it into Claude or ChatGPT');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('Failed to copy');
    }
  };

  if (selectedBrand) {
    return (
      <div>
        <button
          onClick={() => { setSelectedBrand(null); setExportText(''); }}
          className="flex items-center gap-1.5 text-xs font-bold mb-4"
          style={{ color: '#155DFC' }}
        >
          <ArrowLeft size={14} /> Back to brands
        </button>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-black" style={{ color: '#101828' }}>{selectedBrand.brandName}</h3>
            <p className="text-xs" style={{ color: '#9CA3AF' }}>{selectedBrand.conversationCount} conversation{selectedBrand.conversationCount !== 1 ? 's' : ''}</p>
          </div>
          <button
            onClick={handleCopy}
            disabled={exportLoading || !exportText}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-black text-white disabled:opacity-50"
            style={{ backgroundColor: copied ? '#16A34A' : '#155DFC' }}
          >
            {copied ? <Check size={15} /> : <Copy size={15} />}
            {copied ? 'Copied' : 'Copy all text'}
          </button>
        </div>
        {exportLoading ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-8 h-8 rounded-full animate-spin" style={{ border: '3px solid #EFF6FF', borderTopColor: '#155DFC' }} />
          </div>
        ) : (
          <textarea
            readOnly
            value={exportText}
            className="w-full font-mono text-xs p-4 rounded-2xl border resize-none"
            style={{ borderColor: '#E5E7EB', height: '60vh', backgroundColor: '#FAFAFA', color: '#374151' }}
          />
        )}
      </div>
    );
  }

  return (
    <div>
      <p className="text-sm mb-4" style={{ color: '#9CA3AF' }}>
        Brands with at least one conversation. Click a brand to view and copy their full conversation history — paste it into Claude or ChatGPT to get a summary.
      </p>

      <div className="flex flex-wrap items-center gap-2 mb-4">
        <span className="text-xs font-bold uppercase tracking-wider mr-1" style={{ color: '#9CA3AF' }}>Sort</span>
        {[
          { v: 'recent', l: 'Most recent' },
          { v: 'oldest', l: 'Oldest first' },
          { v: 'most', l: 'Most conversations' },
          { v: 'least', l: 'Fewest conversations' },
        ].map(opt => (
          <FilterPill key={opt.v} active={sortBy === opt.v} onClick={() => { setSortBy(opt.v); fetchBrands(category, range, opt.v); }}>{opt.l}</FilterPill>
        ))}
      </div>
      <div className="flex flex-wrap items-center gap-2 mb-5">
        <span className="text-xs font-bold uppercase tracking-wider mr-1" style={{ color: '#9CA3AF' }}>Activity</span>
        {[{ v: '', l: 'All time' }, { v: 'today', l: 'Today' }, { v: 'this_week', l: 'This week' }, { v: 'this_month', l: 'This month' }].map(opt => (
          <FilterPill key={opt.v} active={range === opt.v} onClick={() => { setRange(opt.v); fetchBrands(category, opt.v, sortBy); }}>{opt.l}</FilterPill>
        ))}
        <span className="text-xs font-bold uppercase tracking-wider ml-3 mr-1" style={{ color: '#9CA3AF' }}>Category</span>
        <select
          value={category}
          onChange={e => { setCategory(e.target.value); fetchBrands(e.target.value, range, sortBy); }}
          className="px-3 py-1.5 rounded-full text-xs font-semibold border bg-white focus:outline-none"
          style={{ borderColor: '#E5E7EB', color: '#6B7280' }}
        >
          <option value="">All categories</option>
          {CATEGORIES.map(c => <option key={c} value={c}>{getCategoryLabel(c)}</option>)}
        </select>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="w-8 h-8 rounded-full animate-spin" style={{ border: '3px solid #EFF6FF', borderTopColor: '#155DFC' }} />
        </div>
      ) : brands.length === 0 ? (
        <div className="bg-white rounded-2xl border p-12 text-center text-sm" style={{ borderColor: '#E5E7EB', color: '#9CA3AF' }}>No brand conversations yet.</div>
      ) : (
        <div className="bg-white rounded-2xl border overflow-hidden" style={{ borderColor: '#E5E7EB' }}>
          <div className="divide-y" style={{ borderColor: '#F0F0F0' }}>
            {brands.map(b => (
              <button
                key={b.brandId}
                onClick={() => handleSelectBrand(b)}
                className="w-full text-left flex items-center gap-4 px-5 py-3.5 hover:bg-gray-50 transition-colors"
              >
                <div className="w-10 h-10 rounded-xl overflow-hidden flex-shrink-0 flex items-center justify-center" style={{ backgroundColor: '#F8FAFC' }}>
                  {b.logo ? <img src={b.logo} alt="" className="w-full h-full object-cover" /> : <MessageSquare size={16} color="#9CA3AF" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-bold text-sm truncate" style={{ color: '#101828' }}>{b.brandName}</div>
                  <div className="text-xs" style={{ color: '#9CA3AF' }}>{b.conversationCount} conversation{b.conversationCount !== 1 ? 's' : ''} · Last active {formatDate(b.lastActivityAt)}</div>
                </div>
                <ArrowLeft size={14} color="#D1D5DB" style={{ transform: 'rotate(180deg)' }} />
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

const AdminAnalytics = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [tab, setTab] = useState('users');

  useEffect(() => {
    if (user && user.role !== 'admin') {
      navigate('/', { replace: true });
    }
  }, [user, navigate]);

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#F5F5F7' }}>
      <div className="sticky top-0 z-20" style={{ backgroundColor: '#101828' }}>
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center gap-3">
          <button onClick={() => navigate('/admin/dashboard')} className="p-2 -ml-2 rounded-lg" style={{ color: 'rgba(255,255,255,0.7)' }}>
            <ArrowLeft size={18} />
          </button>
          <BarChart3 size={18} color="#155DFC" />
          <h1 className="font-black text-white">Analytics</h1>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-8">
        <div className="flex items-center gap-2 mb-6 flex-wrap">
          {[
            { key: 'users', label: 'User Analytics' },
            { key: 'campaigns', label: 'Campaign Analytics' },
            { key: 'collabs', label: 'Collab Analytics' },
            { key: 'conversations', label: 'Brand Conversation Analytics' },
          ].map(t => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className="px-4 py-2 rounded-xl text-sm font-black"
              style={{ backgroundColor: tab === t.key ? '#101828' : 'white', color: tab === t.key ? 'white' : '#6B7280', border: '1.5px solid #E5E7EB' }}
            >
              {t.label}
            </button>
          ))}
        </div>

        {tab === 'users' && <UsersTab />}
        {tab === 'campaigns' && <CampaignsTab />}
        {tab === 'collabs' && <CollabsTab />}
        {tab === 'conversations' && <ConversationsTab />}
      </div>
    </div>
  );
};

export default AdminAnalytics;
