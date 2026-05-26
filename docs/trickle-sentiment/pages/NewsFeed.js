function NewsFeed() {
    const trendChartRef = React.useRef(null);
    const trendChartInstance = React.useRef(null);

    React.useEffect(() => {
        if (trendChartInstance.current) {
            trendChartInstance.current.destroy();
        }

        const ctx = trendChartRef.current.getContext('2d');
        trendChartInstance.current = new window.ChartJS(ctx, {
            type: 'line',
            data: {
                labels: ['08:00', '10:00', '12:00', '14:00', '16:00', '18:00', '20:00'],
                datasets: [
                    {
                        label: '高风险舆情新增量',
                        data: [2, 5, 12, 18, 15, 8, 4],
                        borderColor: '#ef4444',
                        backgroundColor: 'rgba(239, 68, 68, 0.1)',
                        borderWidth: 2,
                        fill: true,
                        tension: 0.4
                    },
                    {
                        label: '中低风险舆情新增量',
                        data: [8, 10, 15, 22, 28, 20, 12],
                        borderColor: '#f59e0b',
                        backgroundColor: 'rgba(245, 158, 11, 0.1)',
                        borderWidth: 2,
                        fill: true,
                        tension: 0.4
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                interaction: { mode: 'index', intersect: false },
                plugins: { legend: { position: 'top' } },
                scales: { y: { beginAtZero: true } }
            }
        });

        return () => {
            if (trendChartInstance.current) trendChartInstance.current.destroy();
        };
    }, []);

    const newsList = [
        { id: 1, time: '刚刚', title: 'DeepSeek最新问答将两车底盘认定为完全一致', source: '大模型巡检 (DeepSeek)', level: 'high', trend: 'up', excerpt: '在常规提问"智己LS7底盘和奥迪一样吗"中，模型未提及星云平台差异，直接给出"同集团换壳"结论。' },
        { id: 2, time: '30分钟前', title: '某自媒体发布《E7X其实就是智己的壳？》', source: '新浪看点', level: 'high', trend: 'up', excerpt: '文章引用了多处不实言论，阅读量正在快速攀升，极易被各大模型抓取更新语料。' },
        { id: 3, time: '2小时前', title: '有驾平台发布技术澄清分析', source: '有驾', level: 'low', trend: 'down', excerpt: '专业作者详细解析了ADP平台与星云平台的核心差异，属于正向高权重内容，需加强曝光。' },
        { id: 4, time: '5小时前', title: '易车社区出现换壳疑问贴', source: '易车社区', level: 'medium', trend: 'up', excerpt: '用户发帖提问两车是否为换壳车，底下跟帖存在信息模糊现象，暂无官方或认证号介入澄清。' },
        { id: 5, time: '昨天', title: '豆包 Pro 在带年份提问中给出正确澄清', source: '大模型巡检 (豆包 Pro)', level: 'low', trend: 'down', excerpt: '当提问明确包含"2025款"时，豆包Pro较准确地指出了两车平台技术的不同。' },
    ];

    const getLevelConfig = (level) => {
        switch(level) {
            case 'high': return { bg: 'bg-red-100', text: 'text-red-800', border: 'border-red-200', label: '高风险' };
            case 'medium': return { bg: 'bg-orange-100', text: 'text-orange-800', border: 'border-orange-200', label: '中风险' };
            case 'low': return { bg: 'bg-green-100', text: 'text-green-800', border: 'border-green-200', label: '低风险 (正向/澄清)' };
            default: return { bg: 'bg-gray-100', text: 'text-gray-800', border: 'border-gray-200', label: '未知' };
        }
    };

    return (
        <div className="space-y-6" data-name="NewsFeed" data-file="pages/NewsFeed.js">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h2 className="text-xl font-bold">实时舆情追踪</h2>
                    <p className="text-sm text-[var(--text-muted)] mt-1">实时监控大模型输出与全网信源的最新动态，分析扩散趋势</p>
                </div>
                <div className="flex gap-2">
                    <button className="bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-lg text-sm hover:bg-gray-50 flex items-center gap-2">
                        <div className="icon-refresh-cw"></div> 刷新数据
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* News Feed List */}
                <div className="lg:col-span-2 card p-6 flex flex-col h-[700px]">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="font-semibold text-lg flex items-center gap-2">
                            <div className="icon-radio text-[var(--primary)] animate-pulse"></div>
                            舆情动态流
                        </h3>
                        <div className="flex gap-2">
                            <span className="text-xs bg-gray-100 px-2 py-1 rounded cursor-pointer hover:bg-gray-200">全部</span>
                            <span className="text-xs bg-red-50 text-red-600 px-2 py-1 rounded cursor-pointer hover:bg-red-100">仅看高风险</span>
                        </div>
                    </div>
                    
                    <div className="flex-1 overflow-y-auto pr-2 space-y-4">
                        {newsList.map(news => {
                            const config = getLevelConfig(news.level);
                            return (
                                <div key={news.id} className={`p-4 rounded-xl border ${config.border} bg-white hover:shadow-md transition-shadow relative overflow-hidden`}>
                                    {news.level === 'high' && <div className="absolute left-0 top-0 bottom-0 w-1 bg-red-500"></div>}
                                    <div className="flex justify-between items-start mb-2">
                                        <div className="flex items-center gap-2">
                                            <span className={`text-xs px-2 py-0.5 rounded font-medium ${config.bg} ${config.text}`}>
                                                {config.label}
                                            </span>
                                            <span className="text-xs text-gray-500 flex items-center gap-1">
                                                <div className="icon-clock text-[10px]"></div> {news.time}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded">{news.source}</span>
                                            <div title={news.trend === 'up' ? '扩散上升' : '扩散下降'} className={`icon-trending-${news.trend} ${news.trend === 'up' ? 'text-red-500' : 'text-green-500'} text-sm`}></div>
                                        </div>
                                    </div>
                                    <h4 className="font-semibold text-gray-900 text-base mb-1">{news.title}</h4>
                                    <p className="text-sm text-gray-600 mb-3">{news.excerpt}</p>
                                    <div className="flex justify-end gap-3 text-xs">
                                        <button className="text-blue-600 hover:text-blue-800 flex items-center gap-1 font-medium">
                                            <div className="icon-eye"></div> 查看详情
                                        </button>
                                        {news.level === 'high' && (
                                            <button className="text-red-600 hover:text-red-800 flex items-center gap-1 font-medium">
                                                <div className="icon-shield-alert"></div> 启动GEO对冲
                                            </button>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Trend and Path */}
                <div className="flex flex-col gap-6">
                    {/* Chart */}
                    <div className="card p-6 flex-1">
                        <h3 className="font-semibold text-base mb-4 flex items-center gap-2">
                            <div className="icon-chart-line text-[var(--primary)]"></div>
                            今日舆情发酵趋势
                        </h3>
                        <div className="h-48">
                            <canvas ref={trendChartRef}></canvas>
                        </div>
                    </div>

                    {/* Path */}
                    <div className="card p-6 flex-1">
                        <h3 className="font-semibold text-base mb-4 flex items-center gap-2">
                            <div className="icon-git-commit-horizontal text-[var(--primary)]"></div>
                            典型高危舆情扩散路径
                        </h3>
                        <div className="relative pl-6 space-y-6 before:absolute before:inset-y-0 before:left-[11px] before:w-0.5 before:bg-gray-200 mt-2">
                            <div className="relative">
                                <div className="absolute -left-[30px] top-1 w-4 h-4 rounded-full bg-gray-200 border-2 border-white"></div>
                                <div className="text-xs text-gray-500 mb-0.5">源头发酵 (昨天 14:00)</div>
                                <div className="text-sm font-medium text-gray-800 bg-gray-50 p-2 rounded border border-gray-100">
                                    易车社区 / 贴吧出现诱导性提问
                                </div>
                            </div>
                            <div className="relative">
                                <div className="absolute -left-[30px] top-1 w-4 h-4 rounded-full bg-orange-400 border-2 border-white shadow-sm"></div>
                                <div className="text-xs text-orange-600 mb-0.5">媒体扩散 (昨天 18:00)</div>
                                <div className="text-sm font-medium text-gray-800 bg-orange-50 p-2 rounded border border-orange-100">
                                    新浪看点等抓取形成多篇"换壳"文章
                                </div>
                            </div>
                            <div className="relative">
                                <div className="absolute -left-[30px] top-1 w-4 h-4 rounded-full bg-red-500 border-2 border-white shadow-sm animate-pulse"></div>
                                <div className="text-xs text-red-600 mb-0.5 font-medium">大模型收录反馈 (今天 08:00)</div>
                                <div className="text-sm font-medium text-red-900 bg-red-50 p-2 rounded border border-red-200 shadow-sm">
                                    DeepSeek / 通义千问 语料更新，对用户明确输出"两车是换壳"的错误结论
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}