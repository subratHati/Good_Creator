import { useId, useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';

// 8-lobe scalloped seal, drawn once in a 24x24 box
const SEAL = (() => {
    const N = 96, R = 10.1, A = 1.35, LOBES = 8;
    let d = '';
    for (let i = 0; i <= N; i++) {
        const t = (i / N) * Math.PI * 2 - Math.PI / 2;
        const r = R + A * Math.cos(LOBES * (t + Math.PI / 2));
        d += (i === 0 ? 'M' : 'L') + (12 + r * Math.cos(t)).toFixed(2) + ' ' + (12 + r * Math.sin(t)).toFixed(2) + ' ';
    }
    return d + 'Z';
})();

const TONES = {
    gold: { stops: [['0', '#FDE68A'], ['0.45', '#F5B731'], ['1', '#B7791F']], edge: '#9A6410' },
    blue: { stops: [['0', '#60A5FA'], ['0.5', '#2563EB'], ['1', '#1D4ED8']], edge: '#1E40AF' },
};

export function VerifiedBadge({ size = 18, tone = 'gold', title = 'Verified creator', decorative = false, className = '' }) {
    const uid = useId().replace(/:/g, '');
    const gid = `vb-g-${uid}`;
    const sid = `vb-s-${uid}`;
    const t = TONES[tone] || TONES.gold;
    return (
        <svg
            viewBox="0 0 24 24"
            width={size}
            height={size}
            className={`shrink-0 ${className}`}
            {...(decorative ? { 'aria-hidden': true } : { role: 'img', 'aria-label': title })}
        >
            {!decorative && <title>{title}</title>}
            <defs>
                <linearGradient id={gid} x1="0" y1="0" x2="1" y2="1">
                    {t.stops.map(([o, c]) => <stop key={o} offset={o} stopColor={c} />)}
                </linearGradient>
                <linearGradient id={sid} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0" stopColor="#fff" stopOpacity="0.55" />
                    <stop offset="0.6" stopColor="#fff" stopOpacity="0" />
                </linearGradient>
            </defs>
            <path d={SEAL} fill={`url(#${gid})`} stroke={t.edge} strokeWidth="0.5" strokeOpacity="0.6" strokeLinejoin="round" />
            <path d={SEAL} fill={`url(#${sid})`} />
            <circle cx="12" cy="12" r="7.6" fill="none" stroke="#fff" strokeOpacity="0.35" strokeWidth="0.6" />
            <path d="M7.4 12.9l3 3 6-6.4" fill="none" stroke="rgba(90,50,0,0.35)" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M7.4 12.4l3 3 6-6.4" fill="none" stroke="#fff" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
    );
}

const PILL_SIZES = {
    sm: { cls: 'text-xs px-2.5 py-0.5', icon: 14 },
    md: { cls: 'text-sm px-3 py-1.5', icon: 16 },
};

const PILL_TONES = {
    gold: 'text-amber-800 bg-gradient-to-b from-amber-50 to-amber-100 border-amber-200',
    blue: 'text-blue-700 bg-gradient-to-b from-blue-50 to-blue-100 border-blue-200',
};

export function VerifiedPill({ label = 'Verified', size = 'sm', tone = 'gold', className = '' }) {
    const s = PILL_SIZES[size] || PILL_SIZES.sm;
    return (
        <span className={`inline-flex items-center gap-1.5 font-semibold border rounded-full ${PILL_TONES[tone] || PILL_TONES.gold} ${s.cls} ${className}`}>
            <VerifiedBadge size={s.icon} tone={tone} decorative />
            {label}
        </span>
    );
}

export function InstagramVerifiedBadge({ size = 18, className = '' }) {
    const btnRef = useRef(null);
    const popRef = useRef(null);
    const closeTimer = useRef(null);
    const [open, setOpen] = useState(false);
    const [pos, setPos] = useState({ top: 0, left: 0, arrow: 130, above: false });

    const canHover = () =>
        typeof window !== 'undefined' && !!window.matchMedia && window.matchMedia('(hover: hover)').matches;

    const closeIt = () => {
        clearTimeout(closeTimer.current);
        setOpen(false);
    };
    const closeSoon = () => {
        clearTimeout(closeTimer.current);
        closeTimer.current = setTimeout(closeIt, 120);
    };
    const openIt = () => {
        clearTimeout(closeTimer.current);
        const el = btnRef.current;
        if (!el) return;
        const r = el.getBoundingClientRect();
        const W = 260, M = 12;
        const left = Math.max(M, Math.min(r.left + r.width / 2 - W / 2, window.innerWidth - W - M));
        const above = r.bottom + 170 > window.innerHeight && r.top > 190;
        setPos({
            top: above ? r.top - 10 : r.bottom + 10,
            left,
            arrow: Math.max(14, Math.min(r.left + r.width / 2 - left, W - 14)),
            above,
        });
        setOpen(true);
    };

    useEffect(() => {
        if (!open) return undefined;
        const onDown = (e) => {
            if (btnRef.current?.contains(e.target) || popRef.current?.contains(e.target)) return;
            closeIt();
        };
        const onKey = (e) => { if (e.key === 'Escape') closeIt(); };
        document.addEventListener('pointerdown', onDown);
        document.addEventListener('keydown', onKey);
        window.addEventListener('scroll', closeIt, true);
        window.addEventListener('resize', closeIt);
        return () => {
            document.removeEventListener('pointerdown', onDown);
            document.removeEventListener('keydown', onKey);
            window.removeEventListener('scroll', closeIt, true);
            window.removeEventListener('resize', closeIt);
        };
    }, [open]);

    useEffect(() => () => clearTimeout(closeTimer.current), []);

    return (
        <>
            <button
                ref={btnRef}
                type="button"
                aria-label="Instagram data verified. Tap for details"
                aria-expanded={open}
                className={className}
                onMouseEnter={() => { if (canHover()) openIt(); }}
                onMouseLeave={() => { if (canHover()) closeSoon(); }}
                onClick={(e) => {
                    // never let a tap on the badge open the creator's profile
                    e.stopPropagation();
                    e.preventDefault();
                    if (open && !canHover()) closeIt(); else openIt();
                }}
                style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', padding: '4px', margin: '-4px', background: 'none', border: 'none', cursor: 'pointer', flexShrink: 0, touchAction: 'manipulation' }}
            >
                <VerifiedBadge size={size} tone="blue" decorative />
            </button>

            {open && createPortal(
                <div
                    ref={popRef}
                    role="tooltip"
                    onClick={(e) => e.stopPropagation()}
                    onMouseEnter={() => clearTimeout(closeTimer.current)}
                    onMouseLeave={() => { if (canHover()) closeSoon(); }}
                    style={{
                        position: 'fixed', top: pos.top, left: pos.left, width: 260, zIndex: 100000,
                        transform: pos.above ? 'translateY(-100%)' : 'none',
                        background: '#fff', border: '1px solid #EAECF0', borderRadius: 12,
                        boxShadow: '0 12px 32px rgba(16,24,40,0.18)', padding: '12px 14px',
                        textAlign: 'left', cursor: 'default', whiteSpace: 'normal',
                    }}
                >
                    <span
                        style={{
                            position: 'absolute', left: pos.arrow - 6, width: 12, height: 12, background: '#fff',
                            transform: 'rotate(45deg)',
                            ...(pos.above
                                ? { bottom: -7, borderRight: '1px solid #EAECF0', borderBottom: '1px solid #EAECF0' }
                                : { top: -7, borderLeft: '1px solid #EAECF0', borderTop: '1px solid #EAECF0' }),
                        }}
                    />
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                        <VerifiedBadge size={16} tone="blue" decorative />
                        <span style={{ fontSize: 13, fontWeight: 700, color: '#101828' }}>Instagram data verified</span>
                    </div>
                    <p style={{ margin: 0, fontSize: 12.5, lineHeight: 1.5, color: '#475467' }}>
                        This is not Instagram's own blue tick, and it does not mean the creator's Instagram account is verified.
                        It means the creator connected their Instagram account, and their followers, reach and engagement are
                        pulled directly from Instagram through Meta's official API, so the numbers are genuine.
                    </p>
                </div>,
                document.body
            )}
        </>
    );
}