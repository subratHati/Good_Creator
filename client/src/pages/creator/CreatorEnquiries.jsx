import { useEffect, useState } from 'react';
import Navbar from '../../components/Navbar';
import { getMyEnquiries, markEnquirySeen } from '../../api/enquiries';

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

const CreatorEnquiries = () => {
  const [enquiries, setEnquiries] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      try {
        const res = await getMyEnquiries();
        setEnquiries(res.data.enquiries);
        // mark all as seen
        res.data.enquiries
          .filter((e) => e.status === 'sent')
          .forEach((e) => markEnquirySeen(e._id).catch(() => { }));
      } catch {
        setEnquiries([]);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="flex items-center justify-center h-96">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-3xl mx-auto px-6 py-8">

        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Enquiries</h1>
          <p className="text-gray-500 mt-1">Messages from brands interested in working with you</p>
        </div>

        {enquiries.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
            <div className="text-4xl mb-4">💬</div>
            <div className="font-semibold text-gray-900 mb-2">No enquiries yet</div>
            <div className="text-sm text-gray-500">
              When brands send you a message it will appear here.
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {enquiries.map((enquiry) => (
              <div
                key={enquiry._id}
                className={`bg-white rounded-xl border p-5 ${enquiry.status === 'sent'
                  ? 'border-blue-200 bg-blue-50'
                  : 'border-gray-200'
                  }`}
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center overflow-hidden flex-shrink-0">
                    {enquiry.brandId?.logo
                      ? <img src={enquiry.brandId.logo} alt="brand" className="w-full h-full object-cover" />
                      : <span>🏷️</span>
                    }
                  </div>
                  <div className="flex-1">
                    <div className="font-semibold text-gray-900 text-sm">
                      {enquiry.brandId?.brandName || 'Brand'}
                    </div>
                    <div className="text-xs text-gray-500">
                      {enquiry.brandId?.category ? getCategoryLabel(enquiry.brandId.category) : ''}
                      {enquiry.brandId?.location?.city
                        ? ` · ${enquiry.brandId.location.city}`
                        : ''}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {enquiry.status === 'sent' && (
                      <span className="bg-blue-100 text-blue-700 text-xs font-semibold px-2.5 py-1 rounded-full">
                        New
                      </span>
                    )}
                    <span className="text-xs text-gray-400">
                      {new Date(enquiry.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>

                <p className="text-sm text-gray-700 leading-relaxed bg-white rounded-lg p-3 border border-gray-100">
                  {enquiry.message}
                </p>

                {enquiry.brandId?.instagram?.handle && (
                  <div className="mt-3">

                    <a
                      href={"https://instagram.com/" + enquiry.brandId.instagram.handle}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1.5 text-xs font-medium text-blue-600 hover:underline"
                    >
                      View brand on Instagram
                    </a>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default CreatorEnquiries;