import { useNavigate } from 'react-router-dom';

const LandingPage = () => {
  const navigate = useNavigate();

  return (
    <div style={{ fontFamily: "'DM Sans', sans-serif" }} className="min-h-screen bg-[#F5F2EC] overflow-x-hidden">
      <link href="https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=DM+Sans:wght@300;400;500;600&display=swap" rel="stylesheet" />

      {/* NAV */}
      <nav className="flex items-center justify-between px-6 md:px-12 py-5">
        <div style={{ fontFamily: "'Syne', sans-serif" }} className="text-xl font-bold text-gray-900">
          Good<span className="text-blue-600">Creator</span>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/login')}
            className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
          >
            Log in
          </button>
          <button
            onClick={() => navigate('/register')}
            className="px-4 py-2 bg-gray-900 text-white text-sm font-semibold rounded-xl hover:bg-gray-800 transition-colors"
          >
            Join free
          </button>
        </div>
      </nav>

      {/* HERO */}
      <section className="px-6 md:px-12 pt-12 pb-16 md:pt-20 md:pb-24">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-2 gap-12 items-center">

            {/* left */}
            <div>
              <div className="inline-flex items-center gap-2 bg-white border border-gray-200 rounded-full px-4 py-2 text-xs font-medium text-gray-500 mb-6">
                <span className="w-1.5 h-1.5 rounded-full bg-orange-400 animate-pulse" />
                India's micro-creator marketplace
              </div>

              <h1 style={{ fontFamily: "'Syne', sans-serif", letterSpacing: '-2px', lineHeight: 1.05 }}
                className="text-5xl md:text-6xl font-bold text-gray-900 mb-5">
                Where brands meet <span className="text-blue-600">real</span> creators
              </h1>

              <p className="text-lg text-gray-500 font-light leading-relaxed mb-8 max-w-md">
                Connect micro and nano Instagram creators with Indian D2C brands. No agencies, no cold DMs. Transparent pricing and real collabs.
              </p>

              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={() => navigate('/register')}
                  className="px-6 py-3.5 bg-gray-900 text-white font-semibold rounded-xl hover:bg-gray-800 transition-colors text-sm"
                >
                  I'm a creator →
                </button>
                <button
                  onClick={() => navigate('/register')}
                  className="px-6 py-3.5 bg-white border border-gray-200 text-gray-700 font-semibold rounded-xl hover:bg-gray-50 transition-colors text-sm"
                >
                  I'm a brand →
                </button>
              </div>
              <p className="text-xs text-gray-400 mt-3">Free to join · No commission at launch</p>
            </div>

            {/* right — mock creator card */}
            <div className="hidden md:block">
              <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm max-w-xs mx-auto">
                <div className="flex items-start gap-3 mb-3">
                  <div className="w-14 h-14 rounded-full bg-gradient-to-br from-blue-400 to-blue-700 flex items-center justify-center text-white font-bold text-xl flex-shrink-0">P</div>
                  <div>
                    <div className="font-bold text-gray-900">Priya Sharma</div>
                    <div className="text-xs text-gray-400">@priya_lifestyle</div>
                    <div className="text-xs text-gray-400">📍 Bhubaneswar, India</div>
                  </div>
                </div>
                <div className="flex flex-wrap gap-1.5 mb-3">
                  <span className="text-xs px-2.5 py-1 rounded-full bg-gray-100 text-gray-600">Lifestyle</span>
                  <span className="text-xs px-2.5 py-1 rounded-full bg-gray-100 text-gray-600">Fashion</span>
                </div>
                <div className="flex items-start mb-3">
                  <div className="flex-1 text-center">
                    <div className="text-lg font-bold text-amber-600">48K</div>
                    <div className="text-xs font-bold text-gray-400 uppercase tracking-wider">Followers</div>
                  </div>
                  <div className="flex-1 text-center">
                    <div className="text-lg font-bold text-red-800">6.2%</div>
                    <div className="text-xs font-bold text-gray-400 uppercase tracking-wider">Engagement</div>
                  </div>
                  <div className="flex-1 text-center">
                    <div className="text-lg font-bold text-blue-800">12K</div>
                    <div className="text-xs font-bold text-gray-400 uppercase tracking-wider">Avg Views</div>
                  </div>
                </div>
                <div className="h-px bg-gray-100 mb-3" />
                <div className="flex justify-between items-center mb-3">
                  <span className="text-xs text-gray-400">Starting from</span>
                  <span className="text-sm font-bold text-gray-900">₹3,500 <span className="font-normal text-gray-400">/ Reel</span></span>
                </div>
                <div className="w-full py-2.5 bg-gray-900 text-white text-xs font-semibold rounded-xl text-center">Visit Instagram</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* STATS BAR */}
      <div className="border-y border-gray-200 bg-white py-6 px-6">
        <div className="max-w-3xl mx-auto flex justify-around">
          {[
            { num: '₹0', label: 'Commission at launch' },
            { num: '15+', label: 'Indian cities' },
            { num: '100%', label: 'Verified stats' },
          ].map(({ num, label }) => (
            <div key={label} className="text-center">
              <div style={{ fontFamily: "'Syne', sans-serif" }} className="text-2xl md:text-3xl font-bold text-gray-900">{num}</div>
              <div className="text-xs text-gray-500 mt-1">{label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* HOW IT WORKS */}
      <section className="px-6 md:px-12 py-16 max-w-6xl mx-auto">
        <div className="text-xs font-bold text-blue-600 uppercase tracking-widest mb-3">How it works</div>
        <h2 style={{ fontFamily: "'Syne', sans-serif", letterSpacing: '-1px' }} className="text-3xl md:text-4xl font-bold text-gray-900 mb-10">Simple. Fast. Transparent.</h2>
        <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { step: '01', title: 'Create profile', desc: 'Set your niche, pricing, and connect Instagram. Stats sync automatically.' },
            { step: '02', title: 'Post openings', desc: 'Brands create work posts with budget, content type, and requirements.' },
            { step: '03', title: 'Discover', desc: 'Brands filter creators by city, niche, followers. Creators browse openings.' },
            { step: '04', title: 'Collab', desc: 'Match found. Connect on Instagram. No middlemen, no fees at launch.' },
          ].map(({ step, title, desc }) => (
            <div key={step} className="bg-white rounded-2xl border border-gray-200 p-5 relative overflow-hidden hover:-translate-y-1 transition-transform">
              <div style={{ fontFamily: "'Syne', sans-serif" }} className="text-6xl font-bold text-gray-100 absolute top-2 right-3 leading-none">{step}</div>
              <div className="text-sm font-bold text-gray-900 mb-2 relative">{title}</div>
              <div className="text-sm text-gray-500 font-light leading-relaxed relative">{desc}</div>
            </div>
          ))}
        </div>
      </section>

      {/* WHO */}
      <section className="px-6 md:px-12 pb-16 max-w-6xl mx-auto">
        <div className="grid md:grid-cols-2 gap-4">
          <div className="bg-gradient-to-br from-blue-50 to-[#F5F2EC] rounded-2xl border border-gray-200 p-8">
            <div className="text-xs font-bold text-blue-600 uppercase tracking-widest mb-3">For creators</div>
            <h3 style={{ fontFamily: "'Syne', sans-serif" }} className="text-2xl font-bold text-gray-900 mb-3">Stop cold DMing brands forever</h3>
            <p className="text-sm text-gray-500 font-light leading-relaxed mb-5">Set your prices once. Let brands find you. Get discovered by brands that need your niche.</p>
            <ul className="space-y-2 mb-6">
              {['Transparent pricing for every content type', 'Instagram stats auto-verified', 'Toggle open/closed anytime', 'Enable barter for product deals'].map(t => (
                <li key={t} className="flex items-center gap-2 text-sm text-gray-600">
                  <span className="w-4 h-4 rounded bg-blue-100 text-blue-600 flex items-center justify-center text-xs font-bold flex-shrink-0">✓</span>
                  {t}
                </li>
              ))}
            </ul>
            <button onClick={() => navigate('/register')} className="px-5 py-2.5 bg-gray-900 text-white text-sm font-semibold rounded-xl hover:bg-gray-800 transition-colors">
              Join as creator
            </button>
          </div>

          <div className="bg-gradient-to-br from-orange-50 to-[#F5F2EC] rounded-2xl border border-gray-200 p-8">
            <div className="text-xs font-bold text-orange-500 uppercase tracking-widest mb-3">For brands</div>
            <h3 style={{ fontFamily: "'Syne', sans-serif" }} className="text-2xl font-bold text-gray-900 mb-3">Find micro creators who convert</h3>
            <p className="text-sm text-gray-500 font-light leading-relaxed mb-5">Filter by city, niche, followers and engagement. See real pricing upfront. No agency fees.</p>
            <ul className="space-y-2 mb-6">
              {['Search with advanced filters', 'Real Instagram insights, not self-reported', 'Post openings and receive applications', 'Find barter-ready creators for low budgets'].map(t => (
                <li key={t} className="flex items-center gap-2 text-sm text-gray-600">
                  <span className="w-4 h-4 rounded bg-orange-100 text-orange-500 flex items-center justify-center text-xs font-bold flex-shrink-0">✓</span>
                  {t}
                </li>
              ))}
            </ul>
            <button onClick={() => navigate('/register')} className="px-5 py-2.5 bg-orange-500 text-white text-sm font-semibold rounded-xl hover:bg-orange-600 transition-colors">
              Join as brand
            </button>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="px-6 md:px-12 pb-16 max-w-6xl mx-auto">
        <div className="bg-gray-900 rounded-2xl p-8 md:p-12 flex flex-col md:flex-row items-center justify-between gap-6">
          <div>
            <h3 style={{ fontFamily: "'Syne', sans-serif", letterSpacing: '-1px' }} className="text-2xl md:text-3xl font-bold text-white mb-2">
              Ready to find your next collab?
            </h3>
            <p className="text-gray-400 text-sm">Free forever at launch stage.</p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 flex-shrink-0">
            <button onClick={() => navigate('/register')} className="px-6 py-3 bg-white text-gray-900 text-sm font-semibold rounded-xl hover:bg-gray-100 transition-colors">
              Join as creator
            </button>
            <button onClick={() => navigate('/register')} className="px-6 py-3 border border-gray-600 text-white text-sm font-semibold rounded-xl hover:bg-gray-800 transition-colors">
              Post an opening
            </button>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-gray-200 px-6 md:px-12 py-6 flex flex-col md:flex-row items-center justify-between gap-3">
        <div style={{ fontFamily: "'Syne', sans-serif" }} className="font-bold text-gray-900">
          Good<span className="text-blue-600">Creator</span>
        </div>
        <div className="text-xs text-gray-400">Built for India's creator economy · 2026</div>
        <div className="flex gap-4">
          <a href="/privacy" className="text-xs text-gray-400 hover:text-gray-600">Privacy</a>
          <a href="mailto:subratdude98@gmail.com" className="text-xs text-gray-400 hover:text-gray-600">Contact</a>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
