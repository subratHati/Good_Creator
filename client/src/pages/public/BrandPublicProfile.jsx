import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, ExternalLink, MapPin } from 'lucide-react';
import axiosInstance from '../../api/axiosInstance';

const contentTypeColors = {
  reel: 'bg-blue-100 text-blue-700',
  post: 'bg-purple-100 text-purple-700',
  story: 'bg-orange-100 text-orange-700',
  ugc: 'bg-teal-100 text-teal-700',
};

const BrandPublicProfile = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [brand, setBrand] = useState(null);
  const [openings, setOpenings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      try {
        const [brandRes, openingsRes] = await Promise.all([
          axiosInstance.get(`/brands/${id}`),
          axiosInstance.get(`/openings/search?brandId=${id}`),
        ]);
        setBrand(brandRes.data.brand);
        setOpenings(openingsRes.data.openings || []);
      } catch {
        setBrand(null);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!brand) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-4">😕</div>
          <div className="font-semibold text-gray-900">Brand not found</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-6 h-14 flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft size={18} />
          </button>
          <span className="font-semibold text-gray-900">{brand.brandName}</span>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

          {/* left */}
          <div className="space-y-4">
            <div className="bg-white rounded-xl border border-gray-200 p-6 text-center">
              <div className="w-20 h-20 rounded-xl bg-gray-100 flex items-center justify-center mx-auto mb-3 overflow-hidden">
                {brand.logo
                  ? <img src={brand.logo} alt={brand.brandName} className="w-full h-full object-cover" />
                  : <span className="text-3xl">🏷️</span>
                }
              </div>

              <h1 className="text-xl font-bold text-gray-900 mb-1">{brand.brandName}</h1>

              <span className="inline-block bg-blue-50 text-blue-700 text-xs font-medium px-2.5 py-1 rounded-full capitalize mb-3">
                {brand.category}
              </span>

              {brand.location?.city && (
                <div className="flex items-center justify-center gap-1 text-xs text-gray-400 mb-4">
                  <MapPin size={12} />
                  {brand.location.city}
                  {brand.location.state ? `, ${brand.location.state}` : ''}
                </div>
              )}

              {brand.description && (
                <p className="text-sm text-gray-600 leading-relaxed mb-4">
                  {brand.description}
                </p>
              )}

              <div className="space-y-2">
                {brand.website && (
                  
                  <a
                    href={brand.website}
                    target="_blank"
                    rel="noreferrer"
                    className="w-full flex items-center justify-center gap-2 py-2.5 border border-gray-200 text-gray-600 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
                  >
                    <ExternalLink size={14} />
                    Visit website
                  </a>
                )}
                {brand.instagram?.handle && (
                  
                  <a
                    href={"https://instagram.com/" + brand.instagram.handle}
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

            {/* instagram stats */}
            {brand.instagram?.isVerified && (
              <div className="bg-white rounded-xl border border-gray-200 p-4">
                <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
                  Instagram
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex-1 bg-gray-50 rounded-lg p-3 text-center">
                    <div className="text-xs text-gray-500 mb-1">Followers</div>
                    <div className="text-lg font-bold text-orange-500">
                      {brand.instagram.followersCount >= 1000
                        ? (brand.instagram.followersCount / 1000).toFixed(1) + 'K'
                        : brand.instagram.followersCount || '0'}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* right */}
          <div className="md:col-span-2">
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-4">
                Active openings ({openings.length})
              </div>

              {openings.length === 0 ? (
                <div className="text-center py-8">
                  <div className="text-3xl mb-3">📋</div>
                  <div className="text-sm text-gray-500">No active openings right now</div>
                </div>
              ) : (
                <div className="space-y-3">
                  {openings.map((opening) => (
                    <div
                      key={opening._id}
                      className="p-4 bg-gray-50 rounded-xl"
                    >
                      <div className="flex items-start justify-between gap-3 mb-2">
                        <div className="font-semibold text-gray-900 text-sm">
                          {opening.title}
                        </div>
                        <span className={`text-xs font-semibold px-2.5 py-1 rounded-full capitalize flex-shrink-0 ${contentTypeColors[opening.contentType]}`}>
                          {opening.contentType}
                        </span>
                      </div>

                      {opening.description && (
                        <p className="text-xs text-gray-500 mb-2 line-clamp-2">
                          {opening.description}
                        </p>
                      )}

                      <div className="flex flex-wrap gap-1.5">
                        {opening.budgetMax > 0 && (
                          <span className="bg-green-100 text-green-700 text-xs font-medium px-2 py-0.5 rounded-full">
                            ₹{opening.budgetMin?.toLocaleString('en-IN')} – ₹{opening.budgetMax?.toLocaleString('en-IN')}
                          </span>
                        )}
                        {opening.isBarter && (
                          <span className="bg-amber-100 text-amber-700 text-xs font-medium px-2 py-0.5 rounded-full">
                            Barter
                          </span>
                        )}
                        {opening.requirements?.minFollowers > 0 && (
                          <span className="bg-gray-200 text-gray-600 text-xs font-medium px-2 py-0.5 rounded-full">
                            Min {(opening.requirements.minFollowers / 1000).toFixed(0)}K followers
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BrandPublicProfile;