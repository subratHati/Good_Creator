import { useId } from 'react';
import './assistant.css';
import logoSrc from '../../assets/ai-logo.webp';

// 4-point sparkle, drawn in a 24x24 box
const STAR = 'M12 2c.6 5.6 4.4 9.4 10 10-5.6.6-9.4 4.4-10 10-.6-5.6-4.4-9.4-10-10 5.6-.6 9.4-4.4 10-10z';

export function VerifiedTick({ size = 16, ring = false, className = '' }) {
    const gid = `ai-v-${useId().replace(/:/g, '')}`;
    return (
        <svg viewBox="0 0 24 24" width={size} height={size} className={`shrink-0 ${className}`} role="img" aria-label="Official GoodCreator AI">
            <title>Official GoodCreator AI</title>
            <defs>
                <linearGradient id={gid} x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0" stopColor="#38bdf8" />
                    <stop offset="1" stopColor="#4f46e5" />
                </linearGradient>
            </defs>
            {ring && <circle cx="12" cy="12" r="12" fill="#fff" />}
            <circle cx="12" cy="12" r={ring ? 10 : 12} fill={`url(#${gid})`} />
            <path d="M7.5 12.5l3 3 6-6.5" fill="none" stroke="#fff" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
    );
}

export function AssistantLogo({ size = 40, glow = false, verified = false, className = '' }) {
    const badge = Math.max(12, Math.round(size * 0.4));
    return (
        <span className={`relative inline-flex shrink-0 ${className}`} style={{ width: size, height: size }}>
            <span className={`absolute inset-0 rounded-full ${glow ? 'ai-glow' : ''}`} />
            <img
                src={logoSrc}
                alt=""
                width={size}
                height={size}
                draggable={false}
                className="relative rounded-full bg-white object-cover"
                style={{ width: size, height: size }}
            />
            {verified && (
                <span className="absolute -bottom-0.5 -right-0.5" style={{ width: badge, height: badge }}>
                    <VerifiedTick size={badge} ring />
                </span>
            )}
        </span>
    );
}

export function AiTag({ className = '' }) {
    return (
        <span className={`rounded-full bg-gradient-to-r from-indigo-500 via-violet-500 to-fuchsia-500 px-1.5 py-0.5 text-[10px] font-bold leading-none tracking-wide text-white ${className}`}>
            AI
        </span>
    );
}

const SPARKLES = [
    { left: '38%', top: '14%', size: 10, delay: '0s' },
    { left: '62%', top: '58%', size: 8, delay: '0.7s' },
    { left: '82%', top: '18%', size: 12, delay: '1.4s' },
    { left: '92%', top: '62%', size: 7, delay: '0.3s' },
];

export function AssistantHeader({ onBack, subtitle = 'Official AI assistant' }) {
    return (
        <div className="relative flex items-center gap-3 overflow-hidden bg-gradient-to-r from-indigo-600 via-violet-600 to-fuchsia-600 px-3 py-3 text-white">
            {SPARKLES.map((s, i) => (
                <svg key={i} viewBox="0 0 24 24" width={s.size} height={s.size} className="ai-twinkle pointer-events-none absolute fill-white"
                    style={{ left: s.left, top: s.top, animationDelay: s.delay }} aria-hidden="true">
                    <path d={STAR} />
                </svg>
            ))}
            <button type="button" onClick={onBack} aria-label="Back"
                className="relative z-10 -ml-1 cursor-pointer rounded-full p-1.5 hover:bg-white/15">
                <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M15 18l-6-6 6-6" />
                </svg>
            </button>
            <AssistantLogo size={40} glow className="relative z-10 rounded-full ring-2 ring-white/40" />
            <div className="relative z-10 min-w-0">
                <div className="flex items-center gap-1.5">
                    <span className="truncate text-[15px] font-semibold leading-tight">GoodCreator Assistant</span>
                    <VerifiedTick size={16} ring />
                    <span className="rounded-full bg-white/20 px-1.5 py-0.5 text-[10px] font-bold leading-none tracking-wide">AI</span>
                </div>
                <p className="mt-0.5 flex items-center gap-1.5 text-xs text-white/80">
                    <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-300" />
                    {subtitle}
                </p>
            </div>
        </div>
    );
}

// the AI's message: logo + white bubble with a gradient outline
export function AssistantBubble({ children, time }) {
    return (
        <div className="flex max-w-[90%] items-end gap-2">
            <AssistantLogo size={28} />
            <div className="ai-bubble-border rounded-2xl rounded-bl-md p-[1.5px] shadow-sm">
                <div className="rounded-[14px] rounded-bl-[5px] bg-white px-3.5 py-2.5 text-sm text-gray-800">
                    <div className="whitespace-pre-wrap break-words">{children}</div>
                    {time && <div className="mt-1 text-[10px] text-gray-400">{time}</div>}
                </div>
            </div>
        </div>
    );
}

export function AssistantTyping() {
    return (
        <div className="flex max-w-[90%] items-end gap-2">
            <AssistantLogo size={28} glow />
            <div className="ai-bubble-border rounded-2xl rounded-bl-md p-[1.5px]">
                <div className="flex items-center gap-2 rounded-[14px] rounded-bl-[5px] bg-white px-3.5 py-2.5">
                    <span className="flex gap-1">
                        {[0, 1, 2].map((i) => (
                            <span key={i} className="h-1.5 w-1.5 animate-bounce rounded-full bg-gradient-to-br from-indigo-500 to-fuchsia-500"
                                style={{ animationDelay: `${i * 0.15}s` }} />
                        ))}
                    </span>
                    <span className="ai-shimmer-text text-xs font-medium">thinking…</span>
                </div>
            </div>
        </div>
    );
}

export const chipsForRole = (role) =>
    role === 'brand'
        ? ['Find creators for my campaign', 'Show my campaigns', 'How do payouts work?']
        : ['Find campaigns for me', 'Show my applications', 'How do payouts work?'];

export function SuggestionChips({ chips, onPick }) {
    return (
        <div className="flex flex-wrap gap-2 pl-9">
            {chips.map((c) => (
                <button key={c} type="button" onClick={() => onPick(c)}
                    className="cursor-pointer rounded-full border border-violet-200 bg-white px-3 py-1.5 text-xs font-medium text-violet-700 shadow-sm hover:bg-violet-50">
                    {c}
                </button>
            ))}
        </div>
    );
}