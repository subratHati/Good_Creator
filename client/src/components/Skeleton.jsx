// A single shimmering placeholder block. Compose these into whatever
// shape a specific page's real content takes (a card, a row, a circle
// for an avatar, etc.) — this component only handles the shimmer
// animation and rounded-rectangle shape, nothing page-specific.
const Skeleton = ({ className = '', style = {} }) => (
  <div
    className={`animate-pulse ${className}`}
    style={{ backgroundColor: '#E5E7EB', borderRadius: '8px', ...style }}
  />
);

export default Skeleton;
