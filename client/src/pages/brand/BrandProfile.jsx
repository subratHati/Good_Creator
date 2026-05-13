import { useState, useEffect } from 'react';
import { Camera, Upload } from 'lucide-react';
import Navbar from '../../components/Navbar';
import {
  getMyBrandProfile,
  createBrandProfile,
  updateBrandProfile,
  uploadBrandLogo,
} from '../../api/brand';
import { getMyOpenings } from '../../api/openings';
import toast from 'react-hot-toast';

const CATEGORIES = ['fashion', 'food', 'beauty', 'tech', 'fitness', 'travel', 'education', 'finance', 'lifestyle', 'other'];

const categoryColors = {
  fashion:   { bg: '#FED7AA', color: '#7C2D12' },
  beauty:    { bg: '#FBCFE8', color: '#831843' },
  food:      { bg: '#FDE68A', color: '#78350F' },
  tech:      { bg: '#DDD6FE', color: '#4C1D95' },
  fitness:   { bg: '#BBF7D0', color: '#064E3B' },
  lifestyle: { bg: '#BFDBFE', color: '#1E3A8A' },
  travel:    { bg: '#A7F3D0', color: '#064E3B' },
  education: { bg: '#FDE68A', color: '#78350F' },
  finance:   { bg: '#BBF7D0', color: '#064E3B' },
  other:     { bg: '#E5E7EB', color: '#374151' },
};

const avatarBgs = ['#FF6B35', '#155DFC', '#E1306C', '#16A34A', '#8B5CF6', '#F59E0B'];

// ─── EDIT MODAL ───────────────────────────────────────────────────────────────
const EditModal = ({ profile, onClose, onSave }) => {
  const [form, setForm] = useState({
    brandName: profile?.brandName || '',
    description: profile?.description || '',
    website: profile?.website || '',
    category: profile?.category || '',
    city: profile?.location?.city || '',
    state: profile?.location?.state || '',
    instagramHandle: profile?.instagram?.handle || '',
  });
  const [saving, setSaving] = useState(false);
  const [logoUploading, setLogoUploading] = useState(false);
  const [logoPreview, setLogoPreview] = useState(profile?.logo || null);

  const handleChange = e => setForm({ ...form, [e.target.name]: e.target.value });

  const handleLogoUpload = async e => {
    const file = e.target.files[0];
    if (!file) return;
    setLogoPreview(URL.createObjectURL(file));
    const formData = new FormData();
    formData.append('logo', file);
    setLogoUploading(true);
    try { await uploadBrandLogo(formData); toast.success('Logo uploaded'); }
    catch { toast.error('Logo upload failed'); }
    finally { setLogoUploading(false); }
  };

  const handleSave = async () => {
    if (!form.brandName.trim()) return toast.error('Brand name is required');
    if (!form.category) return toast.error('Please select a category');
    setSaving(true);
    try {
      const payload = {
        brandName: form.brandName,
        description: form.description,
        website: form.website,
        category: form.category,
        location: { city: form.city, state: form.state },
        'instagram.handle': form.instagramHandle,
      };
      if (profile) await updateBrandProfile(payload);
      else await createBrandProfile(payload);
      toast.success('Profile saved!');
      onSave(); onClose();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to save'); }
    finally { setSaving(false); }
  };

  const bgColor = avatarBgs[(form.brandName?.charCodeAt(0) || 0) % avatarBgs.length];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-end md:items-center justify-center z-50 px-0 md:px-4" onClick={onClose}>
      <div className="bg-white rounded-t-2xl md:rounded-2xl w-full md:max-w-lg overflow-y-auto" style={{ maxHeight: '90vh' }} onClick={e => e.stopPropagation()}>
        <div className="p-6">
          <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto mb-5 md:hidden" />
          <h3 className="font-black text-gray-900 text-lg mb-5">Edit Brand Profile</h3>

          {/* logo upload */}
          <div className="flex items-center gap-4 mb-5">
            <div className="relative">
              <div className="w-16 h-16 rounded-2xl overflow-hidden flex items-center justify-center border-2 border-gray-100" style={{ backgroundColor: bgColor }}>
                {logoPreview
                  ? <img src={logoPreview} alt="logo" className="w-full h-full object-cover" />
                  : <span className="text-2xl font-black text-white">{form.brandName?.[0]?.toUpperCase() || '🏷️'}</span>
                }
              </div>
              <label className="absolute bottom-0 right-0 w-6 h-6 bg-gray-900 rounded-full flex items-center justify-center cursor-pointer" style={{ border: '2px solid white' }}>
                <Camera size={10} className="text-white" />
                <input type="file" accept="image/*" onChange={handleLogoUpload} className="hidden" />
              </label>
            </div>
            <div className="text-xs text-gray-400">{logoUploading ? 'Uploading...' : 'Tap camera to change logo'}</div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">Brand name <span className="text-red-500">*</span></label>
              <input name="brandName" value={form.brandName} onChange={handleChange} placeholder="Your brand name"
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm" />
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">Description <span className="text-gray-400 font-normal">(optional)</span></label>
              <textarea name="description" value={form.description} onChange={handleChange} rows={3}
                placeholder="Tell creators about your brand..."
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm resize-none" />
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">Website</label>
              <input name="website" value={form.website} onChange={handleChange} placeholder="https://yourbrand.com"
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm" />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">City</label>
                <input name="city" value={form.city} onChange={handleChange} placeholder="Mumbai"
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm" />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">State</label>
                <input name="state" value={form.state} onChange={handleChange} placeholder="Maharashtra"
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm" />
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Category <span className="text-red-500">*</span></label>
              <div className="flex flex-wrap gap-2">
                {CATEGORIES.map(cat => (
                  <button key={cat} type="button" onClick={() => setForm({ ...form, category: cat })}
                    className={`px-3 py-1.5 rounded-full text-xs font-bold border capitalize transition-all ${form.category === cat ? 'bg-blue-600 text-white border-blue-600' : 'border-gray-200 text-gray-600 hover:border-blue-300'}`}>
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">Instagram handle</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">@</span>
                <input name="instagramHandle" value={form.instagramHandle} onChange={handleChange} placeholder="yourbrand"
                  className="w-full pl-7 pr-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm" />
              </div>
            </div>
          </div>

          <div className="flex gap-3 mt-6">
            <button onClick={onClose} className="flex-1 py-3 border border-gray-200 rounded-xl text-sm font-bold text-gray-600">Cancel</button>
            <button onClick={handleSave} disabled={saving} className="flex-1 py-3 rounded-xl text-sm font-black text-white disabled:opacity-60"
              style={{ backgroundColor: '#155DFC', boxShadow: '0 3px 0 0 #0c3eb5' }}>
              {saving ? 'Saving...' : 'Save Profile'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// ─── SECTION CARD ─────────────────────────────────────────────────────────────
const SectionCard = ({ title, onEdit, children }) => (
  <div style={{ backgroundColor: 'white', border: '1.5px solid #F0F0F0', borderRadius: '20px', overflow: 'hidden', boxShadow: '8px 8px 0 0 rgba(0,0,0,0.07)' }}>
    <div style={{ padding: '12px 16px', borderBottom: '1px solid #F5F5F5', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <span style={{ fontWeight: 900, fontSize: '14px', color: '#101828' }}>{title}</span>
      {onEdit && (
        <button onClick={onEdit} style={{ backgroundColor: '#EFF6FF', color: '#155DFC', border: 'none', borderRadius: '8px', padding: '5px 12px', fontSize: '11px', fontWeight: 900, cursor: 'pointer' }}>Edit</button>
      )}
    </div>
    <div style={{ padding: '14px 16px' }}>{children}</div>
  </div>
);

// ─── MAIN PAGE ────────────────────────────────────────────────────────────────
const BrandProfile = () => {
  const [profile, setProfile] = useState(null);
  const [openings, setOpenings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  const fetchAll = async () => {
    try {
      const [profileRes, openingsRes] = await Promise.allSettled([getMyBrandProfile(), getMyOpenings()]);
      if (profileRes.status === 'fulfilled') setProfile(profileRes.value.data.brand);
      else setProfile(null);
      if (openingsRes.status === 'fulfilled') setOpenings(openingsRes.value.data.openings || []);
    } catch { }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchAll(); }, []);

  const activeCampaigns = openings.filter(o => o.status === 'active').length;
  const totalCampaigns = openings.length;
  const catStyle = categoryColors[profile?.category] || categoryColors.other;
  const logoBg = avatarBgs[(profile?.brandName?.charCodeAt(0) || 0) % avatarBgs.length];

  // Logo component
  const LogoDisplay = ({ size = 64, radius = '16px' }) => (
    <div style={{ width: size, height: size, borderRadius: radius, overflow: 'hidden', backgroundColor: logoBg, display: 'flex', alignItems: 'center', justifyContent: 'center', border: '3px solid #101828', boxShadow: '0 4px 12px rgba(0,0,0,0.3)', flexShrink: 0 }}>
      {profile?.logo
        ? <img src={profile.logo} alt={profile.brandName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        : <span style={{ fontSize: size * 0.4, fontWeight: 900, color: 'white' }}>{profile?.brandName?.[0]?.toUpperCase() || '🏷️'}</span>
      }
    </div>
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex flex-col" style={{ height: '100vh', overflow: 'hidden' }}>
        <Navbar />
        <div className="flex items-center justify-center flex-1">
          <div className="w-10 h-10 rounded-full animate-spin" style={{ border: '3px solid #EFF6FF', borderTopColor: '#155DFC' }} />
        </div>
      </div>
    );
  }

  // shared section content
  const AboutSection = () => profile?.description ? (
    <p style={{ fontSize: '13px', color: '#251A00', lineHeight: 1.6 }}>{profile.description}</p>
  ) : (
    <p style={{ fontSize: '12px', color: '#9CA3AF' }}>No description added yet.</p>
  );

  const WebsiteSection = () => profile?.website ? (
    <a href={profile.website} target="_blank" rel="noreferrer"
      style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#155DFC', backgroundColor: '#EFF6FF', border: '1px solid #DBEAFE', borderRadius: '10px', padding: '8px 12px' }}>
      🔗 {profile.website.replace(/^https?:\/\//, '')}
    </a>
  ) : (
    <p style={{ fontSize: '12px', color: '#9CA3AF' }}>No website added.</p>
  );

  const LocationSection = () => (
    <p style={{ fontSize: '13px', color: '#6B7280', fontWeight: 600 }}>
      {profile?.location?.city && profile?.location?.state
        ? `📍 ${profile.location.city}, ${profile.location.state}`
        : '📍 No location set'}
    </p>
  );

  const CategorySection = () => (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
      {profile?.category
        ? <span style={{ fontSize: '12px', fontWeight: 700, padding: '4px 12px', borderRadius: '20px', backgroundColor: catStyle.bg, color: catStyle.color, textTransform: 'capitalize' }}>{profile.category}</span>
        : <span style={{ fontSize: '12px', color: '#9CA3AF' }}>No category selected</span>
      }
    </div>
  );

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: '#F5F5F7', height: '100vh', overflow: 'hidden' }}>
      <Navbar />
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-5xl mx-auto md:px-6 md:py-6 pb-24 md:pb-10" style={{ paddingLeft: 0, paddingRight: 0 }}>

          {/* ── MOBILE LAYOUT ── */}
          <div className="md:hidden px-4">

            {/* dark hero with blue strip */}
            <div style={{ backgroundColor: 'whitesmoke', borderRadius: '24px', overflow: 'hidden', marginBottom: '16px', boxShadow: '8px 8px 0 0 rgba(0,0,0,0.15)' }}>
              {/* gradient strip */}
              <div style={{ height: '80px', background: 'linear-gradient(135deg, #1E3A5F 0%, #101828 100%)' }} />
              <div style={{ padding: '0 20px 20px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                {/* logo overlapping strip */}
                <div style={{ marginTop: '-32px', marginBottom: '12px' }}>
                  <LogoDisplay size={64} radius="16px" />
                </div>
                <div style={{ fontWeight: 900, fontSize: '18px', color: '#101828', marginBottom: '2px' }}>{profile?.brandName || 'Your Brand'}</div>
                <div style={{ fontSize: '11px', color: '#101828', marginBottom: '10px' }}>
                  {profile?.location?.city ? `${profile.location.city}, ${profile.location.state}` : 'No location set'}
                </div>

                {/* category badge */}
                {profile?.category && (
                  <span style={{ fontSize: '11px', fontWeight: 700, padding: '4px 12px', borderRadius: '20px', backgroundColor: catStyle.bg, color: catStyle.color, textTransform: 'capitalize', marginBottom: '12px' }}>
                    {profile.category}
                  </span>
                )}

                {/* stat boxes */}
                <div style={{ display: 'flex', gap: '8px', width: '100%', marginBottom: '12px' }}>
                  <div style={{ flex: 1, backgroundColor: '#FACC15', borderRadius: '10px', padding: '8px 5px', textAlign: 'center', boxShadow: '0 3px 0 0 #B45309' }}>
                    <div style={{ fontSize: '18px', fontWeight: 900, color: '#0F172A' }}>{activeCampaigns}</div>
                    <div style={{ fontSize: '8px', fontWeight: 700, color: '#78350F', textTransform: 'uppercase', marginTop: '2px' }}>Active</div>
                  </div>
                  <div style={{ flex: 1, backgroundColor: '#DCFCE7', borderRadius: '10px', padding: '8px 5px', textAlign: 'center', boxShadow: '0 3px 0 0 #86EFAC' }}>
                    <div style={{ fontSize: '18px', fontWeight: 900, color: '#14532D' }}>{totalCampaigns}</div>
                    <div style={{ fontSize: '8px', fontWeight: 700, color: '#166534', textTransform: 'uppercase', marginTop: '2px' }}>Total</div>
                  </div>
                </div>

                {/* ig handle */}
                {profile?.instagram?.handle && (
                  <div style={{ width: '100%', background: 'linear-gradient(90deg,#833AB4,#E1306C)', borderRadius: '10px', padding: '8px', textAlign: 'center', marginBottom: '14px' }}>
                    <span style={{ fontSize: '12px', fontWeight: 900, color: 'white' }}>@{profile.instagram.handle}</span>
                  </div>
                )}

                <button onClick={() => setShowModal(true)} style={{ width: '100%', padding: '11px', backgroundColor: '#155DFC', color: 'white', border: 'none', borderRadius: '14px', fontSize: '13px', fontWeight: 900, cursor: 'pointer', boxShadow: '0 3px 0 0 #0c3eb5' }}>
                  ✎ Edit Profile
                </button>
              </div>
            </div>

            {/* about the brand — yellow vibe card */}
            <div style={{ backgroundColor: '#FCC82B', border: '2px solid #765B00', borderRadius: '20px', padding: '16px', marginBottom: '12px', boxShadow: '8px 8px 0 0 rgba(0,0,0,0.08)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                <span style={{ fontSize: '20px' }}>✨</span>
                <span style={{ fontWeight: 900, fontSize: '15px', color: '#251A00' }}>About the Brand</span>
              </div>
              <AboutSection />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <SectionCard title="Website" onEdit={() => setShowModal(true)}><WebsiteSection /></SectionCard>
              <SectionCard title="Location" onEdit={() => setShowModal(true)}><LocationSection /></SectionCard>
              <SectionCard title="Category" onEdit={() => setShowModal(true)}><CategorySection /></SectionCard>
            </div>
          </div>

          {/* ── DESKTOP LAYOUT ── */}
          <div className="hidden md:flex gap-6 items-start px-4 md:px-0">

            {/* left sticky card */}
            <div style={{ width: '260px', flexShrink: 0, position: 'sticky', top: '90px' }}>
              <div style={{ backgroundColor: 'whitesmoke', borderRadius: '24px', overflow: 'hidden', boxShadow: '0 6px 0 0 #0a1020' }}>
                <div style={{ height: '80px', background: 'linear-gradient(135deg, #1E3A5F 0%, #101828 100%)' }} />
                <div style={{ padding: '0 20px 24px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <div style={{ marginTop: '-32px', marginBottom: '12px' }}>
                    <LogoDisplay size={70} radius="18px" />
                  </div>
                  <div style={{ fontWeight: 900, fontSize: '18px', color: '#101828', marginBottom: '2px' }}>{profile?.brandName || 'Your Brand'}</div>
                  <div style={{ fontSize: '11px', color: '#101828', marginBottom: '10px' }}>
                    {profile?.location?.city ? `${profile.location.city}, ${profile.location.state}` : 'No location set'}
                  </div>

                  {profile?.category && (
                    <span style={{ fontSize: '11px', fontWeight: 700, padding: '4px 12px', borderRadius: '20px', backgroundColor: catStyle.bg, color: catStyle.color, textTransform: 'capitalize', marginBottom: '14px' }}>
                      {profile.category}
                    </span>
                  )}

                  <div style={{ display: 'flex', gap: '8px', width: '100%', marginBottom: '12px' }}>
                    <div style={{ flex: 1, backgroundColor: '#FACC15', borderRadius: '10px', padding: '10px 5px', textAlign: 'center', boxShadow: '0 3px 0 0 #B45309' }}>
                      <div style={{ fontSize: '20px', fontWeight: 900, color: '#0F172A' }}>{activeCampaigns}</div>
                      <div style={{ fontSize: '8px', fontWeight: 700, color: '#78350F', textTransform: 'uppercase', marginTop: '2px' }}>Active</div>
                    </div>
                    <div style={{ flex: 1, backgroundColor: '#DCFCE7', borderRadius: '10px', padding: '10px 5px', textAlign: 'center', boxShadow: '0 3px 0 0 #86EFAC' }}>
                      <div style={{ fontSize: '20px', fontWeight: 900, color: '#14532D' }}>{totalCampaigns}</div>
                      <div style={{ fontSize: '8px', fontWeight: 700, color: '#166534', textTransform: 'uppercase', marginTop: '2px' }}>Total</div>
                    </div>
                  </div>

                  {profile?.instagram?.handle && (
                    <div style={{ width: '100%', background: 'linear-gradient(90deg,#833AB4,#E1306C)', borderRadius: '10px', padding: '8px', textAlign: 'center', marginBottom: '16px' }}>
                      <span style={{ fontSize: '12px', fontWeight: 900, color: 'white' }}>@{profile.instagram.handle}</span>
                    </div>
                  )}

                  <button onClick={() => setShowModal(true)} style={{ width: '100%', padding: '11px', backgroundColor: '#155DFC', color: 'white', border: 'none', borderRadius: '14px', fontSize: '13px', fontWeight: 900, cursor: 'pointer', boxShadow: '0 3px 0 0 #0c3eb5' }}>
                    ✎ Edit Profile
                  </button>
                </div>
              </div>
            </div>

            {/* right sections */}
            <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: '14px' }}>

              {/* about — yellow */}
              <div style={{ backgroundColor: '#FCC82B', border: '2px solid #765B00', borderRadius: '20px', padding: '16px', boxShadow: '8px 8px 0 0 rgba(0,0,0,0.08)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '20px' }}>✨</span>
                    <span style={{ fontWeight: 900, fontSize: '15px', color: '#251A00' }}>About the Brand</span>
                  </div>
                  <button onClick={() => setShowModal(true)} style={{ backgroundColor: '#765B00', color: '#FCC82B', border: 'none', borderRadius: '8px', padding: '5px 12px', fontSize: '11px', fontWeight: 900, cursor: 'pointer' }}>Edit</button>
                </div>
                <AboutSection />
              </div>

              <SectionCard title="Website" onEdit={() => setShowModal(true)}><WebsiteSection /></SectionCard>
              <SectionCard title="Location" onEdit={() => setShowModal(true)}><LocationSection /></SectionCard>
              <SectionCard title="Category" onEdit={() => setShowModal(true)}><CategorySection /></SectionCard>
            </div>
          </div>

        </div>
      </div>

      {showModal && <EditModal profile={profile} onClose={() => setShowModal(false)} onSave={fetchAll} />}
    </div>
  );
};

export default BrandProfile;
