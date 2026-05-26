function MetricCard({ title, value, icon, trend, trendLabel, colorClass }) {
    return (
        <div className="card p-6 flex flex-col" data-name="MetricCard" data-file="components/MetricCard.js">
            <div className="flex justify-between items-start mb-4">
                <h3 className="text-sm font-medium text-[var(--text-muted)]">{title}</h3>
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${colorClass}`}>
                    <div className={`icon-${icon} text-xl`}></div>
                </div>
            </div>
            <div className="text-3xl font-bold mb-2">{value}</div>
            {trend && (
                <div className="text-sm flex items-center gap-1">
                    <span className={trend === 'up' ? 'text-red-500' : 'text-green-500'}>
                        <div className={`icon-${trend === 'up' ? 'arrow-up' : 'arrow-down'} inline-block text-sm`}></div>
                        {trendLabel}
                    </span>
                    <span className="text-gray-400">较上周</span>
                </div>
            )}
        </div>
    );
}