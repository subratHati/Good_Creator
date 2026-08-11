import Skeleton from './Skeleton';

// Matches CreatorHome's actual sections: the dark hero/carousel area,
// the Instagram stats panel, and the category grid — same shapes,
// just shimmering placeholders instead of real content.
const CreatorHomeSkeleton = () => (
  <div className="px-4 md:px-0 md:max-w-6xl md:mx-auto md:px-6 md:pt-6">
    {/* carousel */}
    <Skeleton className="w-full" style={{ height: '28vh', borderRadius: '20px', marginBottom: '20px' }} />

    {/* instagram panel */}
    <div className="bg-white rounded-2xl border border-gray-100 p-4 mb-6">
      <div className="grid grid-cols-2 gap-3 mb-3">
        <Skeleton className="h-16" style={{ borderRadius: '14px' }} />
        <Skeleton className="h-16" style={{ borderRadius: '14px' }} />
      </div>
      <Skeleton className="h-11 w-full" style={{ borderRadius: '14px' }} />
    </div>

    {/* category grid */}
    <Skeleton className="h-5 w-40 mb-4" />
    <div className="grid grid-cols-2 gap-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <Skeleton key={i} className="h-14" style={{ borderRadius: '16px' }} />
      ))}
    </div>
  </div>
);

export default CreatorHomeSkeleton;
