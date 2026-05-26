function SourcesMonitor() {
    const pieChartRef = React.useRef(null);
    const pieChartInstance = React.useRef(null);

    React.useEffect(() => {
        if (pieChartInstance.current) {
            pieChartInstance.current.destroy();
        }

        const ctx = pieChartRef.current.getContext('2d');
        pieChartInstance.current = new window.ChartJS(ctx, {
            type: 'doughnut',
            data: {
                labels: ['汽车垂直平台', '综合新闻平台', '其他/社区', '官方渠道'],
                datasets: [{
                    data: [196, 102, 112, 2],
                    backgroundColor: ['#3b82f6', '#8b5cf6', '#f59e0b', '#10b981'],
                    borderWidth: 0
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                cutout: '70%',
                plugins: {
                    legend: { position: 'right' }
                }
            }
        });

        return () => {
            if (pieChartInstance.current) pieChartInstance.current.destroy();
        };
    }, []);

    const [selectedType, setSelectedType] = React.useState('全部');

    const topSources = [
        { name: '易车', volume: 46, type: '汽车垂直平台', ratio: '11.17%', feature: '内容专业，含技术解析' },
        { name: '懂车帝', volume: 38, type: '汽车垂直平台', ratio: '9.22%', feature: '用户实测，偶见错误表述' },
        { name: '手机搜狐网', volume: 29, type: '综合新闻平台', ratio: '7.04%', feature: '行业转载，技术深度不足' },
        { name: '有驾', volume: 28, type: '汽车垂直平台', ratio: '6.80%', feature: '权威技术解读，区分平台' },
        { name: '车家号', volume: 28, type: '汽车垂直平台', ratio: '6.80%', feature: '自媒体，内容质量不均' },
        { name: '新浪看点', volume: 24, type: '综合新闻平台', ratio: '5.83%', feature: '侧重动态，易引第三方观点' },
        { name: 'news.m.yiche.com', volume: 15, type: '其他', ratio: '3.64%', feature: '与主站重复，无新信息' },
        { name: '易车社区', volume: 15, type: '汽车垂直平台', ratio: '3.64%', feature: '用户讨论，含“换壳”疑问' },
        { name: '什么值得买社区频道', volume: 14, type: '其他', ratio: '3.40%', feature: '偶见错误平台关联' },
        { name: '网易', volume: 11, type: '综合新闻平台', ratio: '2.67%', feature: '新闻转载，技术细节缺失' },
    ];

    const filteredSources = selectedType === '全部' ? topSources : topSources.filter(s => s.type === selectedType);

    const highRiskSources = [
        { name: '新浪看点', volume: 24, errorRate: '8.3%', risk: 'high', type: '综合新闻' },
        { name: '手机搜狐网', volume: 29, errorRate: '6.9%', risk: 'high', type: '综合新闻' },
        { name: '易车社区', volume: 15, errorRate: '6.7%', risk: 'medium-high', type: '汽车垂直平台' },
        { name: '腾讯网', volume: 16, errorRate: '5.2%', risk: 'medium', type: '综合新闻平台' },
        { name: '汽车之家', volume: 15, errorRate: '4.8%', risk: 'medium', type: '汽车垂直平台' },
    ];

    return (
        <div className="space-y-6" data-name="SourcesMonitor" data-file="pages/SourcesMonitor.js">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="card p-6">
                    <div className="flex justify-between items-start mb-2">
                        <h3 className="font-semibold text-lg">全网信源类型分布</h3>
                        <select 
                            className="text-sm border border-gray-200 rounded-md px-2 py-1 outline-none"
                            value={selectedType}
                            onChange={(e) => setSelectedType(e.target.value)}
                        >
                            <option value="全部">全部类型 (412条)</option>
                            <option value="汽车垂直平台">汽车垂直平台 (196条)</option>
                            <option value="综合新闻平台">综合新闻平台 (102条)</option>
                            <option value="其他">其他/社区 (112条)</option>
                        </select>
                    </div>
                    <p className="text-sm text-gray-500 mb-6">前10信源占总量的56.31%，社交媒体(微博/微信)抓取为0</p>
                    <div className="h-48 relative mb-4">
                        <canvas ref={pieChartRef}></canvas>
                        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none pr-[160px]">
                            <span className="text-3xl font-bold text-gray-800">412</span>
                            <span className="text-xs text-gray-500 mt-1">有效样本</span>
                        </div>
                    </div>
                    
                    <div className="mt-4 max-h-48 overflow-y-auto pr-2 text-sm border-t border-gray-100 pt-4">
                        <div className="text-xs text-gray-400 font-semibold mb-2">TOP 10 核心信源 ({selectedType})</div>
                        {filteredSources.map((source, idx) => (
                            <div key={idx} className="flex justify-between items-center py-2 border-b border-gray-50 last:border-0 hover:bg-gray-50 px-2 rounded transition">
                                <div className="flex items-center gap-3">
                                    <span className="text-gray-400 text-xs w-4">{idx + 1}.</span>
                                    <span className="font-medium text-gray-700">{source.name}</span>
                                </div>
                                <div className="text-right">
                                    <span className="font-bold text-[var(--primary)] mr-2">{source.volume}条</span>
                                    <span className="text-xs text-gray-400 w-12 inline-block">{source.ratio}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="card p-6">
                    <h3 className="font-semibold text-lg mb-6 flex items-center gap-2">
                        <div className="icon-triangle-alert text-red-500"></div>
                        高风险信源平台 TOP 5
                    </h3>
                    <div className="space-y-4">
                        {highRiskSources.map((source, idx) => (
                            <div key={idx} className="flex items-center justify-between p-3 rounded-lg bg-gray-50 border border-gray-100">
                                <div>
                                    <div className="font-medium text-gray-900 flex items-center gap-2">
                                        {source.name}
                                        <span className="px-2 py-0.5 rounded-full bg-gray-200 text-gray-600 text-[10px]">{source.type}</span>
                                    </div>
                                    <div className="text-sm text-gray-500 mt-1">样本量: {source.volume}条</div>
                                </div>
                                <div className="text-right">
                                    <div className="text-red-600 font-bold">{source.errorRate}</div>
                                    <div className={`text-xs mt-1 ${source.risk === 'high' ? 'text-red-500' : 'text-orange-500'}`}>
                                        {source.risk === 'high' ? '高风险' : '中高风险'}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            <div className="card p-6">
                <h3 className="font-semibold text-lg mb-4">媒体权重平台分级与 GEO 策略</h3>
                
                <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
                    <div className="flex-none w-64 p-3 rounded-lg border border-red-200 bg-red-50">
                        <div className="flex justify-between items-center mb-2">
                            <span className="font-bold text-red-800">S级 (权威核心)</span>
                            <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded">核心铺设</span>
                        </div>
                        <p className="text-xs text-red-600">奥迪/智己官网、工信部公告、央视等官方媒体</p>
                    </div>
                    <div className="flex-none w-64 p-3 rounded-lg border border-orange-200 bg-orange-50">
                        <div className="flex justify-between items-center mb-2">
                            <span className="font-bold text-orange-800">A级 (高权重)</span>
                            <span className="text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded">重点投放</span>
                        </div>
                        <p className="text-xs text-orange-600">汽车之家、懂车帝、易车、新浪/搜狐/腾讯汽车</p>
                    </div>
                    <div className="flex-none w-64 p-3 rounded-lg border border-blue-200 bg-blue-50">
                        <div className="flex justify-between items-center mb-2">
                            <span className="font-bold text-blue-800">B级 (中权重)</span>
                            <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded">对冲稀释</span>
                        </div>
                        <p className="text-xs text-blue-600">新浪看点、手机搜狐、百家号、头条、知乎</p>
                    </div>
                    <div className="flex-none w-64 p-3 rounded-lg border border-gray-200 bg-gray-50">
                        <div className="flex justify-between items-center mb-2">
                            <span className="font-bold text-gray-800">C级 (低权重)</span>
                            <span className="text-xs bg-gray-200 text-gray-700 px-2 py-0.5 rounded">监测预警</span>
                        </div>
                        <p className="text-xs text-gray-600">各类汽车社区、小众论坛、UGC内容平台</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="p-4 rounded-xl border border-blue-100 bg-blue-50/50">
                        <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center mb-3">
                            <span className="font-bold">1</span>
                        </div>
                        <h4 className="font-semibold text-blue-900 mb-2">第一阶段：紧急对冲期</h4>
                        <p className="text-sm text-blue-800/80">
                            S级权威信源内容固化铺设，在上汽奥迪、智己汽车官网发布官方专项说明。针对A级高权重平台批量投放澄清内容。
                        </p>
                    </div>
                    <div className="p-4 rounded-xl border border-indigo-100 bg-indigo-50/50">
                        <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center mb-3">
                            <span className="font-bold">2</span>
                        </div>
                        <h4 className="font-semibold text-indigo-900 mb-2">第二阶段：权重建设期</h4>
                        <p className="text-sm text-indigo-800/80">
                            全场景内容覆盖，构建稳定权重体系。搭建矩阵账号体系，覆盖平台差异、技术区别等核心方向。
                        </p>
                    </div>
                    <div className="p-4 rounded-xl border border-green-100 bg-green-50/50">
                        <div className="w-8 h-8 rounded-full bg-green-100 text-green-600 flex items-center justify-center mb-3">
                            <span className="font-bold">3</span>
                        </div>
                        <h4 className="font-semibold text-green-900 mb-2">长效监测机制</h4>
                        <p className="text-sm text-green-800/80">
                            持续追踪AI收录效果与模型回答变化，动态调整优化策略，阻断错误信息恶性循环。
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}