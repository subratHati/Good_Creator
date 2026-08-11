import Skeleton from './Skeleton';

// Matches BrandHome's actual sections: carousel, active-campaigns stat
// row, and the horizontal creator cards row.
const BrandHomeSkeleton = () => (
  <div className="px-4 md:px-0 md:max-w-6xl md:mx-auto md:px-6 md:pt-6">
    {/* carousel */}
    <Skeleton className="w-full" style={{ height: '28vh', borderRadius: '24px', marginBottom: '20px' }} />

    {/* active campaigns row */}
    <Skeleton className="h-16 w-full mb-6" style={{ borderRadius: '16px' }} />

    {/* featured creators */}
    <Skeleton className="h-5 w-44 mb-3" />
    <div className="flex gap-3 overflow-hidden">
      {Array.from({ length: 4 }).map((_, i) => (
        <Skeleton key={i} className="flex-shrink-0" style={{ width: '140px', height: '180px', borderRadius: '16px' }} />
      ))}
    </div>
  </div>
);

export default BrandHomeSkeleton;
