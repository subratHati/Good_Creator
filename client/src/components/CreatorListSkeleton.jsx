import Skeleton from './Skeleton';

// Matches CreatorCard's real layout: avatar + name/location on top,
// a row of stat boxes, category pills below.
const CreatorCardSkeleton = () => (
  <div className="bg-white rounded-2xl border border-gray-200 p-4 flex flex-col gap-3">
    <div className="flex items-center gap-3">
      <Skeleton className="w-14 h-14 flex-shrink-0" style={{ borderRadius: '9999px' }} />
      <div className="flex-1 min-w-0 space-y-2">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-3 w-24" />
      </div>
      <Skeleton className="w-16 h-8 flex-shrink-0" style={{ borderRadius: '10px' }} />
    </div>
    <div className="flex gap-2">
      <Skeleton className="h-10 flex-1" style={{ borderRadius: '10px' }} />
      <Skeleton className="h-10 flex-1" style={{ borderRadius: '10px' }} />
      <Skeleton className="h-10 flex-1" style={{ borderRadius: '10px' }} />
    </div>
    <div className="flex gap-2">
      <Skeleton className="h-5 w-16" style={{ borderRadius: '9999px' }} />
      <Skeleton className="h-5 w-20" style={{ borderRadius: '9999px' }} />
    </div>
  </div>
);

// Renders a stack of skeleton cards, matching the number of items you'd
// typically expect on first load (default 6, matching your API's limit=12
// but only showing enough to fill an initial viewport without overdoing it)
const CreatorListSkeleton = ({ count = 6 }) => (
  <div className="flex flex-col gap-4">
    {Array.from({ length: count }).map((_, i) => (
      <CreatorCardSkeleton key={i} />
    ))}
  </div>
);

export default CreatorListSkeleton;
