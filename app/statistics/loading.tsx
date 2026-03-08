export default function StatisticsLoading() {
  return (
    <div className="space-y-4">
      <div className="glass-card glass-shimmer h-8 w-48 rounded-lg" />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="glass-card glass-shimmer h-24 rounded-2xl" />
        ))}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="glass-card glass-shimmer h-72 rounded-2xl" />
        ))}
      </div>
      <div className="glass-card glass-shimmer h-[500px] rounded-2xl" />
    </div>
  );
}
