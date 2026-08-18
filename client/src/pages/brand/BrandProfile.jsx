import { useState, useEffect } from 'react';
import { Camera, HelpCircle } from 'lucide-react';
import Navbar from '../../components/Navbar';
import { useNavigate } from 'react-router-dom';
import {
  getMyBrandProfile,
  createBrandProfile,
  updateBrandProfile,
  uploadBrandLogo,
} from '../../api/brand';
import { getMyOpenings } from '../../api/openings';
import toast from 'react-hot-toast';



const CATEGORIES = ['fashion', 'food', 'beauty', 'tech', 'fitness', 'travel', 'education', 'finance', 'lifestyle', 'entertainment', 'parenting_family', 'vlogging', 'dance', 'religious', 'news_politics', 'video_editing', 'ai_content', 'pets_wildlife', 'other'];
const categoryColors = {
  fashion: { bg: '#FED7AA', color: '#7C2D12' },
  beauty: { bg: '#FBCFE8', color: '#831843' },
  food: { bg: '#FDE68A', color: '#78350F' },
  tech: { bg: '#DDD6FE', color: '#4C1D95' },
  fitness: { bg: '#BBF7D0', color: '#064E3B' },
  lifestyle: { bg: '#BFDBFE', color: '#1E3A8A' },
  travel: { bg: '#A7F3D0', color: '#064E3B' },
  education: { bg: '#FDE68A', color: '#78350F' },
  finance: { bg: '#BBF7D0', color: '#064E3B' },
  entertainment: { bg: '#FCE7F3', color: '#9D174D' },
  parenting_family: { bg: '#FEF3C7', color: '#92400E' },
  vlogging: { bg: '#E0E7FF', color: '#3730A3' },
  dance: { bg: '#FBCFE8', color: '#9D174D' },
  religious: { bg: '#FEF9C3', color: '#713F12' },
  news_politics: { bg: '#E5E7EB', color: '#1F2937' },
  video_editing: { bg: '#CFFAFE', color: '#155E75' },
  ai_content: { bg: '#EDE9FE', color: '#5B21B6' },
  pets_wildlife: { bg: '#D1FAE5', color: '#065F46' },
  other: { bg: '#E5E7EB', color: '#374151' },
};

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
    <div className="fixed bg-black bg-opacity-50 flex items-end md:items-center justify-center px-0 md:px-4" style={{ zIndex: 99999, top: 0, left: 0, right: 0, bottom: 'calc(60px + env(safe-area-inset-bottom))' }} onClick={onClose}>
      <div className="bg-white w-full md:max-w-lg overflow-y-auto" style={{ borderRadius: '24px 24px 0 0', maxHeight: 'calc(90vh - 60px - env(safe-area-inset-bottom))' }} onClick={e => e.stopPropagation()}>
        <div style={{ padding: '24px 24px calc(24px + env(safe-area-inset-bottom))' }}>
          <div style={{ width: '40px', height: '4px', backgroundColor: '#E5E7EB', borderRadius: '2px', margin: '0 auto 20px' }} className="md:hidden" />
          <h3 style={{ fontWeight: 900, fontSize: '18px', color: '#101828', marginBottom: '20px' }}>Edit Brand Profile</h3>

          {/* logo upload */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '20px' }}>
            <div style={{ position: 'relative' }}>
              <div style={{ width: '72px', height: '72px', borderRadius: '16px', overflow: 'hidden', backgroundColor: bgColor, display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid #F0F0F0' }}>
                {logoPreview
                  ? <img src={logoPreview} alt="logo" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  : <span style={{ fontSize: '28px', fontWeight: 900, color: 'white' }}>{form.brandName?.[0]?.toUpperCase() || '🏷️'}</span>
                }
              </div>
              <label style={{ position: 'absolute', bottom: 0, right: 0, width: '24px', height: '24px', backgroundColor: '#101828', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', border: '2px solid white' }}>
                <Camera size={11} color="white" />
                <input type="file" accept="image/*" onChange={handleLogoUpload} style={{ display: 'none' }} />
              </label>
            </div>
            <div>
              <div style={{ fontSize: '13px', fontWeight: 700, color: '#101828', marginBottom: '2px' }}>Brand Logo</div>
              <div style={{ fontSize: '12px', color: '#9CA3AF' }}>{logoUploading ? 'Uploading...' : 'This will appear as your profile header'}</div>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#374151', marginBottom: '6px' }}>Brand name <span style={{ color: '#EF4444' }}>*</span></label>
              <input name="brandName" value={form.brandName} onChange={handleChange} placeholder="Your brand name"
                style={{ width: '100%', padding: '13px 14px', borderRadius: '14px', border: '1.5px solid #E5E7EB', fontSize: '15px', outline: 'none', backgroundColor: '#F9FAFB', boxSizing: 'border-box' }}
                onFocus={e => e.target.style.borderColor = '#155DFC'}
                onBlur={e => e.target.style.borderColor = '#E5E7EB'} />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#374151', marginBottom: '6px' }}>Description <span style={{ color: '#9CA3AF', fontWeight: 400 }}>(optional)</span></label>
              <textarea name="description" value={form.description} onChange={handleChange} rows={3} placeholder="Tell creators about your brand..."
                style={{ width: '100%', padding: '13px 14px', borderRadius: '14px', border: '1.5px solid #E5E7EB', fontSize: '15px', outline: 'none', resize: 'none', fontFamily: 'inherit', backgroundColor: '#F9FAFB', boxSizing: 'border-box' }}
                onFocus={e => e.target.style.borderColor = '#155DFC'}
                onBlur={e => e.target.style.borderColor = '#E5E7EB'} />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#374151', marginBottom: '6px' }}>Website</label>
              <input name="website" value={form.website} onChange={handleChange} placeholder="https://yourbrand.com"
                style={{ width: '100%', padding: '13px 14px', borderRadius: '14px', border: '1.5px solid #E5E7EB', fontSize: '15px', outline: 'none', backgroundColor: '#F9FAFB', boxSizing: 'border-box' }}
                onFocus={e => e.target.style.borderColor = '#155DFC'}
                onBlur={e => e.target.style.borderColor = '#E5E7EB'} />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#374151', marginBottom: '6px' }}>City</label>
                <input name="city" value={form.city} onChange={handleChange} placeholder="Mumbai"
                  style={{ width: '100%', padding: '13px 14px', borderRadius: '14px', border: '1.5px solid #E5E7EB', fontSize: '15px', outline: 'none', backgroundColor: '#F9FAFB', boxSizing: 'border-box' }}
                  onFocus={e => e.target.style.borderColor = '#155DFC'}
                  onBlur={e => e.target.style.borderColor = '#E5E7EB'} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#374151', marginBottom: '6px' }}>State</label>
                <input name="state" value={form.state} onChange={handleChange} placeholder="Maharashtra"
                  style={{ width: '100%', padding: '13px 14px', borderRadius: '14px', border: '1.5px solid #E5E7EB', fontSize: '15px', outline: 'none', backgroundColor: '#F9FAFB', boxSizing: 'border-box' }}
                  onFocus={e => e.target.style.borderColor = '#155DFC'}
                  onBlur={e => e.target.style.borderColor = '#E5E7EB'} />
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#374151', marginBottom: '8px' }}>Category <span style={{ color: '#EF4444' }}>*</span></label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', maxHeight: '200px', overflowY: 'auto', paddingRight: '4px' }}>
                {CATEGORIES.map(cat => (
                  <button key={cat} type="button" onClick={() => setForm({ ...form, category: cat })}
                    style={{ padding: '6px 14px', borderRadius: '99px', fontSize: '12px', fontWeight: 700, border: '1.5px solid', borderColor: form.category === cat ? '#155DFC' : '#E5E7EB', backgroundColor: form.category === cat ? '#155DFC' : 'white', color: form.category === cat ? 'white' : '#6B7280', cursor: 'pointer' }}>
                    {getCategoryLabel(cat)}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#374151', marginBottom: '6px' }}>Instagram handle</label>
              <div style={{ position: 'relative' }}>
                <span style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#9CA3AF', fontSize: '15px' }}>@</span>
                <input name="instagramHandle" value={form.instagramHandle} onChange={handleChange} placeholder="yourbrand"
                  style={{ width: '100%', padding: '13px 14px 13px 32px', borderRadius: '14px', border: '1.5px solid #E5E7EB', fontSize: '15px', outline: 'none', backgroundColor: '#F9FAFB', boxSizing: 'border-box' }}
                  onFocus={e => e.target.style.borderColor = '#155DFC'}
                  onBlur={e => e.target.style.borderColor = '#E5E7EB'} />
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '10px', marginTop: '24px' }}>
            <button onClick={onClose}
              style={{ flex: 1, padding: '14px', border: '1.5px solid #E5E7EB', borderRadius: '14px', fontSize: '14px', fontWeight: 700, color: '#6B7280', background: 'white', cursor: 'pointer' }}>
              Cancel
            </button>
            <button onClick={handleSave} disabled={saving}
              style={{ flex: 1, padding: '14px', backgroundColor: saving ? '#93B4FD' : '#155DFC', color: 'white', border: 'none', borderRadius: '14px', fontSize: '14px', fontWeight: 900, cursor: saving ? 'not-allowed' : 'pointer', boxShadow: saving ? 'none' : '0 4px 0 0 #0C3EB5' }}>
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
  <div style={{ backgroundColor: 'white', border: '1px solid #E5E7EB', borderRadius: '16px', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.04)', marginBottom: '10px' }}>
    <div style={{ padding: '13px 16px', borderBottom: '1px solid #F5F5F5', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
      <span style={{ fontWeight: 900, fontSize: '13px', color: '#101828' }}>{title}</span>
      {onEdit && (
        <button onClick={onEdit} style={{ backgroundColor: '#EFF6FF', color: '#155DFC', border: 'none', borderRadius: '7px', padding: '4px 10px', fontSize: '11px', fontWeight: 900, cursor: 'pointer' }}>Edit</button>
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
  const navigate = useNavigate();

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

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex flex-col" style={{ height: '100vh', overflow: 'hidden' }}>
        <Navbar />
        <div className="flex items-center justify-center flex-1">
          <div className="w-10 h-10 rounded-full animate-spin" style={{ border: '3px solid #F0F0F0', borderTopColor: '#155DFC' }} />
        </div>
      </div>
    );
  }

  const AboutSection = () => profile?.description ? (
    <p style={{ fontSize: '13px', color: '#374151', lineHeight: 1.6 }}>{profile.description}</p>
  ) : (
    <p style={{ fontSize: '12px', color: '#9CA3AF' }}>No description added yet.</p>
  );

  const WebsiteSection = () => profile?.website ? (
    <a href={profile.website} target="_blank" rel="noreferrer"
      style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', fontWeight: 600, color: '#155DFC', backgroundColor: '#F8FAFC', border: '1px solid #E5E7EB', borderRadius: '10px', padding: '10px 14px', textDecoration: 'none' }}>
      🔗 {profile.website.replace(/^https?:\/\//, '')}
    </a>
  ) : (
    <p style={{ fontSize: '12px', color: '#9CA3AF' }}>No website added.</p>
  );

  const LocationSection = () => (
    <p style={{ fontSize: '13px', color: '#374151', fontWeight: 500 }}>
      {profile?.location?.city && profile?.location?.state
        ? `📍 ${profile.location.city}, ${profile.location.state}`
        : '📍 No location set'}
    </p>
  );

  const CategorySection = () => (
    <div>
      {profile?.category
        ? <span style={{ fontSize: '12px', fontWeight: 700, padding: '5px 14px', borderRadius: '99px', backgroundColor: catStyle.bg, color: catStyle.color, display: 'inline-block' }}>{getCategoryLabel(profile.category)}</span>
        : <span style={{ fontSize: '12px', color: '#9CA3AF' }}>No category selected</span>
      }
    </div>
  );

  // ── MOBILE ──
  const MobileLayout = () => (
    <div className="md:hidden" style={{ height: '100%', overflowY: 'auto' }}>

      {/* HEADER — brand logo as hero image */}
      <div style={{ height: '220px', position: 'relative', overflow: 'hidden', backgroundColor: '#101828', flexShrink: 0 }}>
        {profile?.logo && (
          <img src={profile.logo} alt={profile.brandName}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        )}
        {/* gradient overlay */}
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(0deg, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0.1) 60%)' }} />

      </div>

      {/* WHITE CARD SLIDES UP */}
      <div style={{ backgroundColor: 'white', borderRadius: '28px 28px 0 0', marginTop: '-28px', position: 'relative', zIndex: 2, padding: '24px 16px 20px' }}>

        {/* brand name + tagline */}
        <div style={{ marginBottom: '16px' }}>
          <h1 style={{ fontSize: '22px', fontWeight: 900, color: '#101828', marginBottom: '6px', letterSpacing: '-0.3px' }}>
            {profile?.brandName || 'Your Brand'}
          </h1>
          {profile?.description && (
            <p style={{ fontSize: '13px', color: '#6B7280', lineHeight: 1.5, marginBottom: '12px' }}>
              {profile.description.slice(0, 100)}{profile.description.length > 100 ? '…' : ''}
            </p>
          )}
          {/* info pills */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
            {profile?.location?.city && (
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '11px', fontWeight: 600, color: '#374151', backgroundColor: '#F8FAFC', border: '1px solid #E5E7EB', borderRadius: '99px', padding: '4px 10px' }}>
                📍 {profile.location.city}
              </span>
            )}
            {profile?.category && (
              <span style={{ fontSize: '11px', fontWeight: 700, padding: '4px 10px', borderRadius: '99px', backgroundColor: catStyle.bg, color: catStyle.color }}>
                {getCategoryLabel(profile.category)}
              </span>
            )}
            {profile?.instagram?.handle && (
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '11px', fontWeight: 700, color: 'white', background: 'linear-gradient(90deg,#833AB4,#E1306C)', borderRadius: '99px', padding: '4px 10px' }}>
                @{profile.instagram.handle}
              </span>
            )}
          </div>
        </div>

        {/* stats row */}
        <div style={{ display: 'flex', border: '1px solid #E5E7EB', borderRadius: '16px', overflow: 'hidden', marginBottom: '16px' }}>
          {[
            { val: activeCampaigns, lbl: 'Active' },
            { val: totalCampaigns, lbl: 'Campaigns' },
          ].map((s, i) => (
            <div key={i} style={{ flex: 1, textAlign: 'center', padding: '14px 8px', borderRight: i < 1 ? '1px solid #E5E7EB' : 'none' }}>
              <div style={{ fontSize: '22px', fontWeight: 900, color: '#101828', marginBottom: '3px' }}>{s.val}</div>
              <div style={{ fontSize: '9px', fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{s.lbl}</div>
            </div>
          ))}
        </div>

        {/* edit button */}
        <button onClick={() => setShowModal(true)}
          style={{ width: '100%', padding: '14px', backgroundColor: '#155DFC', color: 'white', border: 'none', borderRadius: '14px', fontSize: '14px', fontWeight: 900, cursor: 'pointer', boxShadow: '0 4px 0 0 #0C3EB5', marginBottom: '24px' }}>
          ✎ Edit Profile
        </button>

        <div style={{ height: '1px', backgroundColor: '#F0F0F0', margin: '0 -16px 20px' }} />
      </div>

      {/* section cards on gray bg */}
      <div style={{ backgroundColor: '#F8FAFC', padding: '0 16px 100px' }}>
        <SectionCard title="Transactions">
          <button
            onClick={() => navigate('/brand/transactions')}
            style={{ width: '100%', padding: '12px', backgroundColor: '#F8FAFC', border: '1.5px dashed #E5E7EB', borderRadius: '12px', fontSize: '13px', fontWeight: 700, color: '#155DFC', cursor: 'pointer' }}>
            🧾 View Transaction History
          </button>
        </SectionCard>
        <SectionCard title="About the Brand" onEdit={() => setShowModal(true)}><AboutSection /></SectionCard>
        <SectionCard title="Website" onEdit={() => setShowModal(true)}><WebsiteSection /></SectionCard>
        <SectionCard title="Location" onEdit={() => setShowModal(true)}><LocationSection /></SectionCard>
        <SectionCard title="Category" onEdit={() => setShowModal(true)}><CategorySection /></SectionCard>
        <SectionCard title="Contact Us & Help">
          <button
            onClick={() => navigate('/contact-help')}
            style={{ width: '100%', padding: '12px', backgroundColor: '#F8FAFC', border: '1.5px dashed #E5E7EB', borderRadius: '12px', fontSize: '13px', fontWeight: 700, color: '#155DFC', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
            <HelpCircle size={16} /> Get Help & Raise an Issue
          </button>
        </SectionCard>
      </div>
    </div>
  );

  // ── DESKTOP ──
  const DesktopLayout = () => (
    <div className="hidden md:block max-w-4xl mx-auto px-6 py-6 pb-10">

      {/* hero header */}
      <div style={{ height: '280px', borderRadius: '24px', overflow: 'hidden', position: 'relative', backgroundColor: '#101828', marginBottom: '24px', boxShadow: '0 4px 20px rgba(0,0,0,0.15)' }}>
        {profile?.logo && (
          <img src={profile.logo} alt={profile.brandName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        )}
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(0deg, rgba(0,0,0,0.6) 0%, rgba(0,0,0,0.1) 60%)' }} />
        {/* brand name overlay at bottom */}
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '24px 28px' }}>
          <h1 style={{ fontSize: '28px', fontWeight: 900, color: 'white', marginBottom: '4px', letterSpacing: '-0.5px' }}>
            {profile?.brandName || 'Your Brand'}
          </h1>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', alignItems: 'center' }}>
            {profile?.location?.city && (
              <span style={{ fontSize: '12px', fontWeight: 600, color: 'rgba(255,255,255,0.7)' }}>
                📍 {profile.location.city}, {profile.location.state}
              </span>
            )}
            {profile?.category && (
              <span style={{ fontSize: '11px', fontWeight: 700, padding: '4px 10px', borderRadius: '99px', backgroundColor: catStyle.bg, color: catStyle.color }}>
                {getCategoryLabel(profile.category)}
              </span>
            )}
            {profile?.instagram?.handle && (
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '11px', fontWeight: 700, color: 'white', background: 'linear-gradient(90deg,#833AB4,#E1306C)', borderRadius: '99px', padding: '3px 10px' }}>
                @{profile.instagram.handle}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* two column layout */}
      <div style={{ display: 'flex', gap: '20px', alignItems: 'flex-start' }}>

        {/* left — stats + edit */}
        <div style={{ width: '240px', flexShrink: 0 }}>
          <div style={{ backgroundColor: 'white', border: '1px solid #E5E7EB', borderRadius: '20px', overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.06)', marginBottom: '12px' }}>
            <div style={{ display: 'flex', borderBottom: '1px solid #E5E7EB' }}>
              {[
                { val: activeCampaigns, lbl: 'Active' },
                { val: totalCampaigns, lbl: 'Campaigns' },
              ].map((s, i) => (
                <div key={i} style={{ flex: 1, textAlign: 'center', padding: '16px 8px', borderRight: i < 1 ? '1px solid #E5E7EB' : 'none' }}>
                  <div style={{ fontSize: '24px', fontWeight: 900, color: '#101828', marginBottom: '3px' }}>{s.val}</div>
                  <div style={{ fontSize: '9px', fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{s.lbl}</div>
                </div>
              ))}
            </div>
            <div style={{ padding: '14px' }}>
              <button onClick={() => setShowModal(true)}
                style={{ width: '100%', padding: '12px', backgroundColor: '#155DFC', color: 'white', border: 'none', borderRadius: '12px', fontSize: '13px', fontWeight: 900, cursor: 'pointer', boxShadow: '0 3px 0 0 #0C3EB5' }}>
                ✎ Edit Profile
              </button>
            </div>
          </div>

          {/* website quick link */}
          {profile?.website && (
            <div style={{ backgroundColor: 'white', border: '1px solid #E5E7EB', borderRadius: '16px', padding: '14px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
              <div style={{ fontSize: '11px', fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px' }}>Website</div>
              <a href={profile.website} target="_blank" rel="noreferrer"
                style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: 600, color: '#155DFC', textDecoration: 'none' }}>
                🔗 {profile.website.replace(/^https?:\/\//, '')}
              </a>
            </div>
          )}
        </div>

        {/* right — section cards */}
        <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <SectionCard title="Transactions">
            <button
              onClick={() => navigate('/brand/transactions')}
              style={{ width: '100%', padding: '12px', backgroundColor: '#F8FAFC', border: '1.5px dashed #E5E7EB', borderRadius: '12px', fontSize: '13px', fontWeight: 700, color: '#155DFC', cursor: 'pointer' }}>
              🧾 View Transaction History
            </button>
          </SectionCard>
          <SectionCard title="About the Brand" onEdit={() => setShowModal(true)}><AboutSection /></SectionCard>
          <SectionCard title="Location" onEdit={() => setShowModal(true)}><LocationSection /></SectionCard>
          <SectionCard title="Category" onEdit={() => setShowModal(true)}><CategorySection /></SectionCard>

          {!profile?.website && <SectionCard title="Website" onEdit={() => setShowModal(true)}><WebsiteSection /></SectionCard>}
          <SectionCard title="Contact Us & Help">
            <button
              onClick={() => navigate('/contact-help')}
              style={{ width: '100%', padding: '12px', backgroundColor: '#F8FAFC', border: '1.5px dashed #E5E7EB', borderRadius: '12px', fontSize: '13px', fontWeight: 700, color: '#155DFC', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
              <HelpCircle size={16} /> Get Help & Raise an Issue
            </button>
          </SectionCard>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: '#F8FAFC', height: '100vh', overflow: 'hidden' }}>
      <Navbar />

      <div className="flex-1 overflow-y-auto">
        <MobileLayout />
        <DesktopLayout />
      </div>

      {showModal && <EditModal profile={profile} onClose={() => setShowModal(false)} onSave={fetchAll} />}
    </div>
  );
};

export default BrandProfile;
