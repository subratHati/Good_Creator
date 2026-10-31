import { useNavigate } from 'react-router-dom';
import useAuth from '../hooks/useAuth';

// The GoodCreator "G" logo mark, drawn in the colour of the surrounding text (white on the button)
const GoodCreatorMark = ({ size = 20 }) => (
  <svg viewBox="64 62 380 380" width={size} height={size} fill="currentColor" aria-hidden="true" style={{ flexShrink: 0 }}>
    <path d="M290.8,71.1C322,77 349.9,89.1 374.5,109.4C357.4,119.9 340.9,130.1 324.2,140.1C323,140.9 320.4,140.6 319.1,139.7C280.2,112.9 214.1,115.8 176.2,147.6C151.1,168.7 137.5,195.9 133.2,228C129.5,256.1 131.4,283.9 143.1,310.3C161.2,351.1 192.7,374.3 236.9,380.1C258.4,382.9 279.6,381 299.9,373.5C329.8,362.5 349.8,341.2 361,311.6C364.6,302.2 366.7,292.3 369.8,281.6C356.2,281.6 343.8,281.6 331.3,281.6C331.3,265.6 331.3,250.3 331.3,234.8C364.8,234.8 398.1,234.8 431.7,234.8C431.8,236.2 432,237.7 432,239.1C431.4,256.2 432.8,273.7 429.9,290.3C416.5,365.8 353.6,422.7 282.3,432.2C242,437.6 203.2,432.8 167,413.5C119.8,388.3 89.1,349.5 76.8,297.4C65.7,250.2 69.9,204.3 93.4,161.3C119.8,113 161.1,84 214.4,72.1C239.6,66.5 265,66.9 290.8,71.1zM288,240.4C304.7,240.6 312,259 303.3,270.4C298.2,277.2 289.2,279.9 281,276.9C273.4,274 268.3,265.5 269.2,257.4C270.1,248.5 276.3,242 285.1,240.8C285.9,240.7 286.8,240.6 288,240.4zM214.9,273.2C205.7,264.1 207.5,249.4 217.8,243.2C225.6,238.4 236.3,240 242.3,246.9C248.1,253.7 248.1,264.2 242.4,271.3C236.7,278.3 226.4,280.2 218.4,275.7C217.3,275 216.2,274.2 214.9,273.2z" />
  </svg>
);

// Header shortcut that opens the AI assistant chat, shown next to the notification bell
const AIAssistantButton = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  if (!user) return null;
  // the assistant is for creators and brands only
  if (user.role && user.role !== 'creator' && user.role !== 'brand') return null;

  return (
    <>
      <style>{`
        .gc-ai-btn {
          display: inline-flex; align-items: center; justify-content: center; gap: 8px;
          height: 36px; padding: 0 14px 0 12px; margin-right: 6px;
          border: none; border-radius: 999px; cursor: pointer;
          font-size: 13px; font-weight: 700; color: #fff; white-space: nowrap;
          background: linear-gradient(90deg, #38bdf8, #4f46e5);
          box-shadow: 0 2px 8px rgba(79,70,229,0.35);
          animation: gcAiGlow 2.8s ease-in-out infinite;
          transition: transform 0.15s, filter 0.15s;
        }
        .gc-ai-btn:hover { transform: translateY(-1px); filter: brightness(1.06); }
        @keyframes gcAiGlow {
          0%, 100% { box-shadow: 0 2px 8px rgba(79,70,229,0.35), 0 0 0 0 rgba(56,189,248,0.45); }
          50% { box-shadow: 0 2px 8px rgba(79,70,229,0.35), 0 0 0 6px rgba(56,189,248,0); }
        }
        @media (prefers-reduced-motion: reduce) { .gc-ai-btn { animation: none; } }
        @media (max-width: 639px) {
          .gc-ai-btn { width: 38px; height: 38px; padding: 0; }
          .gc-ai-label { display: none; }
        }
      `}</style>
      <button
        type="button"
        className="gc-ai-btn"
        onClick={() => navigate('/messages/assistant')}
        aria-label="Open AI assistant"
        title="GoodCreator AI assistant"
      >
        <GoodCreatorMark size={20} />
        <span className="gc-ai-label"> AI</span>
      </button>
    </>
  );
};

export default AIAssistantButton;