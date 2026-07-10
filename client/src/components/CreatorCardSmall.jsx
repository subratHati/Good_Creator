// src/components/CreatorCardSmall.jsx
// Compact vertical card for BrandHome featured creators section

import { useNavigate } from 'react-router-dom';

const avatarBgs = ['#FF6B35', '#155DFC', '#E1306C', '#16A34A', '#8B5CF6', '#F59E0B'];

const CreatorCardSmall = ({ creator, onViewProfile }) => {
  const navigate = useNavigate();
  const name = creator.name || creator.userId?.email?.split('@')[0] || 'Creator';
  const bg = avatarBgs[(name?.charCodeAt(0) || 0) % avatarBgs.length];
  const ig = creator.instagram || {};

  const handleClick = () => {
    if (onViewProfile) onViewProfile(creator);
    else navigate(`/creator/${creator._id}`);
  };

  return (
    <div
      onClick={handleClick}
      style={{ backgroundColor: 'white', border: '1px solid #EAECF0', borderRadius: '20px', boxShadow: '0 1px 3px rgba(16,24,40,0.05)', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '20px 16px 16px', cursor: 'pointer', width: '140px', flexShrink: 0, transition: 'box-shadow 0.15s, transform 0.15s' }}
      onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 4px 16px rgba(16,24,40,0.1)'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
      onMouseLeave={e => { e.currentTarget.style.boxShadow = '0 1px 3px rgba(16,24,40,0.05)'; e.currentTarget.style.transform = 'translateY(0)'; }}
    >
      {/* profile picture */}
      <div style={{ width: '72px', height: '72px', borderRadius: '50%', backgroundColor: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '26px', fontWeight: 800, color: 'white', overflow: 'hidden', border: '2px solid #EFF6FF', marginBottom: '12px', flexShrink: 0 }}>
        {creator.profilePhoto
          ? <img src={creator.profilePhoto} alt={name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          : <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', height: '100%' }}>{name[0]?.toUpperCase()}</span>
        }
      </div>

      {/* name */}
      <div style={{ fontSize: '13px', fontWeight: 700, color: '#101828', textAlign: 'center', marginBottom: '4px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', width: '100%' }}>
        {name}
      </div>

      {/* instagram handle */}
      <div style={{ fontSize: '11px', textAlign: 'center', marginBottom: '14px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', width: '100%' }}>
        {ig.isConnected && ig.handle
          ? <span style={{ background: 'linear-gradient(90deg, #833AB4, #E1306C, #F77737)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text', fontWeight: 600 }}>@{ig.handle}</span>
          : <span style={{ color: '#9CA3AF' }}>Not connected</span>
        }
      </div>

      {/* view profile button */}
      <button
        onClick={e => { e.stopPropagation(); handleClick(); }}
        style={{ width: '100%', padding: '8px', backgroundColor: 'white', color: '#155DFC', border: '1.5px solid #155DFC', borderRadius: '10px', fontSize: '11px', fontWeight: 700, cursor: 'pointer', transition: 'all 0.15s' }}
        onMouseEnter={e => { e.currentTarget.style.backgroundColor = '#155DFC'; e.currentTarget.style.color = 'white'; }}
        onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'white'; e.currentTarget.style.color = '#155DFC'; }}
      >
        View Profile
      </button>
    </div>
  );
};

export default CreatorCardSmall;
