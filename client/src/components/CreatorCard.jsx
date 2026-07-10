// src/components/CreatorCard.jsx
// Shared creator card — BrandHome + BrowseCreators

import { useNavigate } from 'react-router-dom';
import { MapPin, Unlink } from 'lucide-react';

const formatNumber = (num) => {
  if (!num) return '—';
  if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
  if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
  return num.toString();
};

const avatarBgs = ['#FF6B35', '#155DFC', '#E1306C', '#16A34A', '#8B5CF6', '#F59E0B'];

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
  gaming: { bg: '#DDD6FE', color: '#4C1D95' },
  other: { bg: '#E5E7EB', color: '#374151' },
};

const CheckIcon = () => (
  <svg viewBox="0 0 12 12" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ width: '9px', height: '9px' }}>
    <polyline points="2,6 5,9 10,3" />
  </svg>
);


const CreatorCard = ({ creator, onViewProfile }) => {
  const navigate = useNavigate();
  const name = creator.name || creator.userId?.email?.split('@')[0] || 'Creator';
  const bg = avatarBgs[(name?.charCodeAt(0) || 0) % avatarBgs.length];
  const ig = creator.instagram || {};
  const categories = creator.categories || [];

  const handleClick = () => {
    if (onViewProfile) onViewProfile(creator);
    else navigate(`/creator/${creator._id}`);
  };

  return (
    <div
      onClick={handleClick}
      style={{
        backgroundColor: 'white',
        border: '1px solid #EAECF0',
        borderRadius: '20px',
        boxShadow: '0 1px 3px rgba(16,24,40,0.05)',
        display: 'flex',
        alignItems: 'stretch',
        overflow: 'hidden',
        cursor: 'pointer',
        transition: 'box-shadow 0.15s, transform 0.15s',
      }}
      onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 4px 16px rgba(16,24,40,0.1)'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
      onMouseLeave={e => { e.currentTarget.style.boxShadow = '0 1px 3px rgba(16,24,40,0.05)'; e.currentTarget.style.transform = 'translateY(0)'; }}
    >

      {/* ── LEFT — avatar pinned top ── */}
      <div style={{ padding: '14px 8px 14px 8px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-start', flexShrink: 0 }}>
        <div style={{ position: 'relative', marginTop: '2px' }}>
          <div style={{ width: '96px', height: '96px', borderRadius: '50%', backgroundColor: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '30px', fontWeight: 800, color: 'white', overflow: 'hidden', border: '2px solid #EFF6FF', flexShrink: 0 }}>
            {creator.profilePhoto
              ? <img src={creator.profilePhoto} alt={name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              : <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', height: '100%' }}>{name[0]?.toUpperCase()}</span>
            }
          </div>
          {ig.isConnected && (
            <div style={{ position: 'absolute', bottom: '1px', right: '1px', width: '20px', height: '20px', borderRadius: '50%', backgroundColor: '#155DFC', border: '2px solid white', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <CheckIcon />
            </div>
          )}
        </div>
      </div>

      {/* ── RIGHT — all content ── */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, padding: '20px 20px 18px 2px' }}>

        {/* TOP RIGHT — name + handle + categories + price */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '10px', marginBottom: '14px' }}>

          {/* name block */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: '15px', fontWeight: 700, color: '#101828', marginBottom: '2px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{name}</div>
            {!ig.isConnected && !ig.handle
              ? <div style={{ fontSize: '12px', fontWeight: 600, marginBottom: '6px', background: 'linear-gradient(90deg, #833AB4, #E1306C, #F77737)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>@{ig.handle}subratdude98</div>
              : <div style={{ fontSize: '11px', color: '#F59E0B', fontWeight: 600, marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Unlink size={12} color="#F59E0B" /> Not verified
              </div>
            }
          </div>

          {/* price box */}
          <div style={{ backgroundColor: '#EFF6FF', borderRadius: '10px', padding: '9px 12px', flexShrink: 0, textAlign: 'right' }}>
            <div style={{ fontSize: '10px', color: '#667085', fontWeight: 500, whiteSpace: 'nowrap', marginBottom: '2px' }}>Reels from</div>
            {creator.pricing?.reel > 0
              ? <div style={{ fontSize: '15px', fontWeight: 700, color: '#155DFC', whiteSpace: 'nowrap' }}>₹{creator.pricing.reel.toLocaleString('en-IN')}</div>
              : <div style={{ fontSize: '12px', fontWeight: 600, color: '#667085', whiteSpace: 'nowrap' }}>Negotiable</div>
            }
          </div>
        </div>

        {/* divider */}
        <div style={{ height: '1px', backgroundColor: '#F2F4F7', marginBottom: '14px' }} />

        {/* BOTTOM RIGHT — followers | avg views | profile button */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-start', gap: '6px' }}>

          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
            
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <div style={{ fontSize: '16px', fontWeight: 700, color: '#101828', lineHeight: 1 }}>{formatNumber(ig.followersCount) || '45.2K'} </div>
              <div style={{ fontSize: '10px', fontWeight: 500, color: '#667085', marginTop: '2px' }}>Followers</div>
            </div>
          </div>

          <div style={{ width: '1px', height: '28px', backgroundColor: '#F2F4F7', flexShrink: 0 }} />

          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
            
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <div style={{ fontSize: '16px', fontWeight: 700, color: '#101828', lineHeight: 1 }}>{formatNumber(ig.avgViews) || '124k'} </div>
              <div style={{ fontSize: '10px', fontWeight: 500, color: '#667085', marginTop: '2px' }}>Avg Views</div>
            </div>
          </div>

          <div style={{ width: '1px', height: '28px', backgroundColor: '#F2F4F7', flexShrink: 0 }} />

          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '2px' }}>
            <MapPin size={16} color="#155DFC" />
            <div style={{ fontSize: '11px', fontWeight: 600, color: '#667085', textAlign: 'center', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '100%' }}>
              {creator.location?.city ? creator.location.city.slice(0, 15) : '—'}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default CreatorCard;
