import Skeleton from './Skeleton';

// Matches OpeningCard's real layout precisely: image box on the left,
// title/badge row, brand name, deliverable chips, and budget/apply row
// on the right — same horizontal card shape used in BrowseBrands.jsx.
const OpeningCardSkeleton = () => (
  <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'stretch', gap: '12px' }}>
    <Skeleton
      style={{ width: '120px', height: '130px', flexShrink: 0, borderRadius: '14px', alignSelf: 'center' }}
    />
    <div style={{ flex: 1, padding: '12px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: '8px' }}>
        <Skeleton style={{ height: '16px', width: '70%', borderRadius: '6px' }} />
        <Skeleton style={{ height: '18px', width: '50px', borderRadius: '20px', flexShrink: 0 }} />
      </div>
      <Skeleton style={{ height: '11px', width: '40%', borderRadius: '4px' }} />
      <div style={{ display: 'flex', gap: '6px' }}>
        <Skeleton style={{ height: '32px', width: '60px', borderRadius: '8px' }} />
        <Skeleton style={{ height: '32px', width: '60px', borderRadius: '8px' }} />
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: 'auto' }}>
        <Skeleton style={{ height: '24px', width: '90px', borderRadius: '10px' }} />
        <Skeleton style={{ height: '32px', width: '70px', borderRadius: '10px', marginLeft: 'auto' }} />
      </div>
    </div>
  </div>
);

const OpeningListSkeleton = ({ count = 4 }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
    {Array.from({ length: count }).map((_, i) => (
      <OpeningCardSkeleton key={i} />
    ))}
  </div>
);

export default OpeningListSkeleton;
