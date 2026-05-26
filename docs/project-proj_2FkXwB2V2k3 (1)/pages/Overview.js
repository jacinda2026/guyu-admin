function Overview() {
    const chartRef = React.useRef(null);
    const chartInstance = React.useRef(null);

    React.useEffect(() => {
        if (chartInstance.current) {
            chartInstance.current.destroy();
        }

        const ctx = chartRef.current.getContext('2d');
        chartInstance.current = new window.ChartJS(ctx, {
            type: 'bar',
            data: {
                labels: ['豆包 Pro', 'DeepSeek', '混元 Turbo', '通义千问'],
                datasets: [
                    {
                        label: '错误回答数',
                        data: [15, 16, 15, 16],
                        backgroundColor: '#ef4444',
                        borderRadius: 4
                    },
                    {
                        label: '正确/模糊回答数',
                        data: [15, 12, 12, 11],
                        backgroundColor: '#3b82f6',
                        borderRadius: 4
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { position: 'top' },
                    title: { display: false }
                },
                scales: {
                    y: { stacked: true, beginAtZero: true },
                    x: { stacked: true }
                }
            }
        });

        return () => {
            if (chartInstance.current) chartInstance.current.destroy();
        };
    }, []);

    return (
        <div className="space-y-6" data-name="Overview" data-file="pages/Overview.js">
            {/* Top Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <MetricCard 
                    title="监控模型总数" 
                    value="4" 
                    icon="bot" 
                    colorClass="bg-blue-100 text-blue-600"
                />
                <MetricCard 
                    title="有效问答测试" 
                    value="112" 
                    icon="messages-square" 
                    colorClass="bg-purple-100 text-purple-600"
                />
                <MetricCard 
                    title="大模型平均错误率" 
                    value="55.5%" 
                    icon="triangle-alert" 
                    trend="up"
                    trendLabel="高风险"
                    colorClass="bg-red-100 text-red-600"
                />
                <MetricCard 
                    title="强相关信源样本" 
                    value="412" 
                    icon="database" 
                    trend="down"
                    trendLabel="总计591"
                    colorClass="bg-amber-100 text-amber-600"
                />
            </div>

            {/* Data Funnel */}
            <div className="card p-6">
                <h3 className="text-lg font-semibold mb-6 flex items-center gap-2">
                    <div className="icon-list-filter text-[var(--primary)]"></div>
                    基础数据清洗漏斗
                </h3>
                <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                    <div className="flex-1 w-full bg-gray-50 rounded-xl p-4 text-center border border-gray-200">
                        <div className="text-sm text-gray-500 mb-1">原始抓取总信源</div>
                        <div className="text-2xl font-bold text-gray-800">591</div>
                    </div>
                    <div className="icon-arrow-right hidden md:block text-gray-400 text-xl"></div>
                    <div className="icon-arrow-down block md:hidden text-gray-400 text-xl"></div>
                    <div className="flex-1 w-full bg-blue-50 rounded-xl p-4 text-center border border-blue-100">
                        <div className="text-sm text-blue-600 mb-1">信源名称非空数据</div>
                        <div className="text-2xl font-bold text-blue-800">558 <span className="text-xs font-normal text-blue-600">(94.4%)</span></div>
                    </div>
                    <div className="icon-arrow-right hidden md:block text-blue-400 text-xl"></div>
                    <div className="icon-arrow-down block md:hidden text-blue-400 text-xl"></div>
                    <div className="flex-1 w-full bg-indigo-50 rounded-xl p-4 text-center border border-indigo-100 shadow-sm relative overflow-hidden">
                        <div className="absolute top-0 right-0 bg-indigo-500 text-white text-[10px] px-2 py-0.5 rounded-bl-lg">核心数据集</div>
                        <div className="text-sm text-indigo-700 mb-1">E7X/LS7强相关数据</div>
                        <div className="text-2xl font-bold text-indigo-900">412 <span className="text-xs font-normal text-indigo-700">(73.8%)</span></div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Main Chart */}
                <div className="card p-6">
                    <h3 className="text-lg font-semibold mb-6 flex items-center gap-2">
                        <div className="icon-chart-bar text-[var(--primary)]"></div>
                        各模型回答准确性分布
                    </h3>
                    <div className="h-72">
                        <canvas ref={chartRef}></canvas>
                    </div>
                </div>

                {/* Status Timeline or Risks */}
                <div className="card p-6">
                    <h3 className="text-lg font-semibold mb-6 flex items-center gap-2">
                        <div className="icon-shield-alert text-red-500"></div>
                        高风险舆情预警
                    </h3>
                    <div className="space-y-4">
                        <div className="p-3 bg-red-50 rounded-lg border border-red-100 cursor-pointer hover:bg-red-100 transition">
                            <div className="flex justify-between items-center mb-1">
                                <h4 className="font-semibold text-red-800 text-sm flex items-center gap-2">
                                    <div className="icon-file-warning"></div>
                                    信息滞后
                                </h4>
                                <span className="font-bold text-red-600">65.3%</span>
                            </div>
                            <p className="text-xs text-red-700">信源数据截止24年5月前，缺失2025年后ADP与星云平台官方技术说明</p>
                        </div>
                        <div className="p-3 bg-orange-50 rounded-lg border border-orange-100 cursor-pointer hover:bg-orange-100 transition">
                            <div className="flex justify-between items-center mb-1">
                                <h4 className="font-semibold text-orange-800 text-sm flex items-center gap-2">
                                    <div className="icon-git-branch"></div>
                                    概念混淆 (语义映射偏差)
                                </h4>
                                <span className="font-bold text-orange-600">58.9%</span>
                            </div>
                            <p className="text-xs text-orange-700">模型将"上汽集团产业链关联"错误等同于"平台共享=换壳"</p>
                        </div>
                        <div className="p-3 bg-yellow-50 rounded-lg border border-yellow-100 cursor-pointer hover:bg-yellow-100 transition">
                            <div className="flex justify-between items-center mb-1">
                                <h4 className="font-semibold text-yellow-800 text-sm flex items-center gap-2">
                                    <div className="icon-volume-x"></div>
                                    噪声数据干扰
                                </h4>
                                <span className="font-bold text-yellow-600">42.7%</span>
                            </div>
                            <p className="text-xs text-yellow-700">非权威信源占42.7%，其中31.5%含有主观“换壳”表述</p>
                        </div>
                        <div className="p-3 bg-blue-50 rounded-lg border border-blue-100 cursor-pointer hover:bg-blue-100 transition">
                            <div className="flex justify-between items-center mb-1">
                                <h4 className="font-semibold text-blue-800 text-sm flex items-center gap-2">
                                    <div className="icon-cpu"></div>
                                    技术术语误解
                                </h4>
                                <span className="font-bold text-blue-600">37.6%</span>
                            </div>
                            <p className="text-xs text-blue-700">技术差异识别率仅29.4%，将"技术共享"混淆为"平台相同"</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}