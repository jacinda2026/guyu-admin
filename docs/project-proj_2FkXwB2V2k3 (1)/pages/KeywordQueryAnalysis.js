function KeywordQueryAnalysis() {
    const [subTab, setSubTab] = React.useState('overview');

    // Mock Data
    const kpiData = {
        keywordCount: 120,
        questionCount: 80,
        highRiskKeywordCount: 12,
        highRiskQuestionCount: 9,
        avgAiMentionRate: '68%',
        avgAiRecommendationRate: '31%',
        avgAiAccuracy: '82%',
        avgNegativeRate: '24%',
        competitorSuppressionCount: 15,
        contentGapCount: 22
    };

    const keywordData = [
        { id: 1, keyword: '奥迪E7X 智商税', type: '负面词', volume: 1250, negRate: '85%', heat: 88, platforms: ['百度', '小红书'], risk: 'high', suggestion: '官网辟谣及核心媒体SEO占位' },
        { id: 2, keyword: '智己LS7 评测', type: '品牌词', volume: 3400, negRate: '12%', heat: 95, platforms: ['B站', '抖音'], risk: 'low', suggestion: '扩大KOC真实评测铺设' },
        { id: 3, keyword: 'E7X和LS7 换壳', type: '风险词', volume: 2100, negRate: '65%', heat: 92, platforms: ['易车', '知乎'], risk: 'high', suggestion: '输出平台差异化技术白皮书' },
        { id: 4, keyword: '奥迪E7X 价格', type: '场景词', volume: 5600, negRate: '5%', heat: 75, platforms: ['懂车帝', '百度'], risk: 'low', suggestion: '保持价格敏感度监测' },
    ];

    const questionData = [
        { id: 1, question: '奥迪E7X是智己LS7的换壳车吗？', cluster: '危机追问', intent: '风险验证', models: ['豆包', '通义千问', 'DeepSeek'], mentionRate: '100%', recRate: '0%', avgRank: 1, sentiment: '负向', accuracy: '40%', hallucination: '30%', risk: 'high' },
        { id: 2, question: '奥迪E7X和智己LS7哪个更值得买？', cluster: '竞品对比', intent: '对比选择', models: ['所有模型'], mentionRate: '100%', recRate: '45%', avgRank: 2, sentiment: '中向', accuracy: '85%', hallucination: '5%', risk: 'medium' },
        { id: 3, question: '智己LS7有什么致命缺点？', cluster: '风险质疑', intent: '负面验证', models: ['Kimi', '文心一言'], mentionRate: '100%', recRate: '0%', avgRank: 1, sentiment: '负向', accuracy: '70%', hallucination: '15%', risk: 'high' },
        { id: 4, question: '2026年高端纯电SUV推荐', cluster: '榜单推荐', intent: '榜单推荐', models: ['豆包', 'Kimi', 'DeepSeek'], mentionRate: '35%', recRate: '20%', avgRank: 4, sentiment: '正向', accuracy: '90%', hallucination: '0%', risk: 'medium' },
    ];

    const clusterData = [
        { name: '危机追问 (换壳争议)', qCount: 15, models: 6, mention: '95%', rec: '5%', negRate: '68%', acc: '45%', risk: 'high', gap: '官方技术解析、权威背书', suggest: '紧急铺设ADP平台与星云平台差异化对比稿件' },
        { name: '购买决策 (性价比)', qCount: 24, models: 6, mention: '88%', rec: '42%', negRate: '15%', acc: '82%', risk: 'low', gap: '竞品优势对比、长测内容', suggest: '针对小红书和知乎补充购车指南与车主真实口碑' },
        { name: '售后体验 (服务体系)', qCount: 12, models: 6, mention: '65%', rec: '55%', negRate: '22%', acc: '78%', risk: 'medium', gap: '服务案例、官方保修政策明细', suggest: '增加官网FAQ覆盖度，引导AI抓取官方服务承诺' },
    ];

    try {
        return (
            <div className="space-y-6" data-name="KeywordQueryAnalysis" data-file="pages/KeywordQueryAnalysis.js">
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <h2 className="text-xl font-bold">关键词与问题颗粒度分析 (Keyword & Query Intelligence)</h2>
                        <p className="text-sm text-[var(--text-muted)] mt-1">融合传统搜索舆情与大模型提问意图的双向交叉分析</p>
                    </div>
                    <button className="bg-[var(--primary)] text-white px-4 py-2 rounded-lg text-sm hover:bg-[var(--primary-hover)] shadow-sm flex items-center gap-2">
                        <div className="icon-sparkles"></div> 生成内容优化策略
                    </button>
                </div>

                {/* Filters */}
                <div className="card p-4 flex flex-wrap gap-4 items-center bg-gray-50 border border-gray-200">
                    <div className="flex items-center gap-2">
                        <div className="icon-list-filter text-gray-500"></div>
                        <span className="text-sm font-medium text-gray-700">深度筛选:</span>
                    </div>
                    <select className="text-sm border border-gray-300 rounded-md px-3 py-1.5 outline-none bg-white">
                        <option>所有平台 (百度/小红书/抖音等)</option>
                        <option>搜索引擎</option>
                        <option>社交媒体</option>
                    </select>
                    <select className="text-sm border border-gray-300 rounded-md px-3 py-1.5 outline-none bg-white">
                        <option>所有AI模型</option>
                        <option>豆包 Doubao</option>
                        <option>DeepSeek</option>
                        <option>通义千问 Qwen</option>
                    </select>
                    <select className="text-sm border border-gray-300 rounded-md px-3 py-1.5 outline-none bg-white">
                        <option>所有意图类型</option>
                        <option>风险确认</option>
                        <option>购买决策</option>
                        <option>榜单推荐</option>
                    </select>
                    <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                        <input type="checkbox" className="rounded text-[var(--primary)] focus:ring-[var(--primary)]" />
                        仅看高风险
                    </label>
                    <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                        <input type="checkbox" className="rounded text-[var(--primary)] focus:ring-[var(--primary)]" />
                        竞品压制
                    </label>
                </div>

                {/* Sub Navigation */}
                <div className="flex border-b border-gray-200">
                    {['overview:概览与问题簇', 'keywords:传统关键词分析', 'questions:大模型问题分析', 'cross:交叉分析矩阵'].map(tab => {
                        const [key, label] = tab.split(':');
                        return (
                            <button 
                                key={key}
                                onClick={() => setSubTab(key)}
                                className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${subTab === key ? 'border-[var(--primary)] text-[var(--primary)]' : 'border-transparent text-gray-500 hover:text-gray-800'}`}
                            >
                                {label}
                            </button>
                        );
                    })}
                </div>

                {/* Tab Content */}
                {subTab === 'overview' && (
                    <div className="space-y-6 animation-fade-in">
                        {/* KPI Grid */}
                        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                            <div className="card p-4 bg-white border-l-4 border-l-blue-500">
                                <div className="text-xs text-gray-500 mb-1">监控关键词 / 问题数</div>
                                <div className="text-2xl font-bold">{kpiData.keywordCount} <span className="text-lg text-gray-400 font-normal">/ {kpiData.questionCount}</span></div>
                            </div>
                            <div className="card p-4 bg-white border-l-4 border-l-red-500">
                                <div className="text-xs text-gray-500 mb-1">高风险关键词 / 问题</div>
                                <div className="text-2xl font-bold text-red-600">{kpiData.highRiskKeywordCount} <span className="text-lg text-red-400 font-normal">/ {kpiData.highRiskQuestionCount}</span></div>
                            </div>
                            <div className="card p-4 bg-white border-l-4 border-l-indigo-500">
                                <div className="text-xs text-gray-500 mb-1">平均AI提及 / 推荐率</div>
                                <div className="text-2xl font-bold text-indigo-700">{kpiData.avgAiMentionRate} <span className="text-lg text-indigo-400 font-normal">/ {kpiData.avgAiRecommendationRate}</span></div>
                            </div>
                            <div className="card p-4 bg-white border-l-4 border-l-orange-500">
                                <div className="text-xs text-gray-500 mb-1">平均答案准确率 / 负面率</div>
                                <div className="text-2xl font-bold text-orange-600">{kpiData.avgAiAccuracy} <span className="text-lg text-orange-400 font-normal">/ {kpiData.avgNegativeRate}</span></div>
                            </div>
                            <div className="card p-4 bg-white border-l-4 border-l-green-500">
                                <div className="text-xs text-gray-500 mb-1">竞品压制 / 内容缺口机会</div>
                                <div className="text-2xl font-bold text-green-600">{kpiData.competitorSuppressionCount} <span className="text-lg text-green-400 font-normal">/ {kpiData.contentGapCount}</span></div>
                            </div>
                        </div>

                        {/* Cluster Cards */}
                        <h3 className="text-lg font-semibold flex items-center gap-2 mt-8 mb-4">
                            <div className="icon-network text-[var(--primary)]"></div>
                            核心用户问题簇洞察 (Query Clusters)
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            {clusterData.map((cluster, idx) => (
                                <div key={idx} className={`card p-5 border-t-4 ${cluster.risk === 'high' ? 'border-t-red-500' : cluster.risk === 'medium' ? 'border-t-orange-500' : 'border-t-green-500'}`}>
                                    <div className="flex justify-between items-start mb-4">
                                        <h4 className="font-bold text-gray-900">{cluster.name}</h4>
                                        <span className={`text-xs px-2 py-1 rounded font-medium ${cluster.risk === 'high' ? 'bg-red-100 text-red-800' : cluster.risk === 'medium' ? 'bg-orange-100 text-orange-800' : 'bg-green-100 text-green-800'}`}>
                                            {cluster.risk === 'high' ? '高风险' : cluster.risk === 'medium' ? '中风险' : '低风险'}
                                        </span>
                                    </div>
                                    <div className="grid grid-cols-2 gap-y-3 gap-x-2 text-sm mb-4">
                                        <div><span className="text-gray-500">问题量:</span> <span className="font-medium">{cluster.qCount}个</span></div>
                                        <div><span className="text-gray-500">覆盖模型:</span> <span className="font-medium">{cluster.models}个</span></div>
                                        <div><span className="text-gray-500">平均提及:</span> <span className="font-medium">{cluster.mention}</span></div>
                                        <div><span className="text-gray-500">平均准确率:</span> <span className={parseInt(cluster.acc) < 60 ? 'text-red-600 font-bold' : 'font-medium'}>{cluster.acc}</span></div>
                                        <div><span className="text-gray-500">平均负面率:</span> <span className={parseInt(cluster.negRate) > 30 ? 'text-red-600 font-bold' : 'font-medium'}>{cluster.negRate}</span></div>
                                        <div><span className="text-gray-500">主动推荐:</span> <span className="font-medium">{cluster.rec}</span></div>
                                    </div>
                                    <div className="pt-4 border-t border-gray-100 space-y-2">
                                        <div className="flex gap-2 text-sm">
                                            <div className="icon-search-x text-orange-500 shrink-0 mt-0.5"></div>
                                            <div><span className="text-gray-600 font-medium">内容缺口:</span> <span className="text-gray-800">{cluster.gap}</span></div>
                                        </div>
                                        <div className="flex gap-2 text-sm">
                                            <div className="icon-lightbulb text-[var(--primary)] shrink-0 mt-0.5"></div>
                                            <div><span className="text-gray-600 font-medium">优化建议:</span> <span className="text-[var(--primary)]">{cluster.suggest}</span></div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {subTab === 'keywords' && (
                    <div className="card overflow-hidden animation-fade-in">
                        <table className="w-full text-left text-sm border-collapse">
                            <thead>
                                <tr className="bg-gray-50 border-b border-gray-200 text-gray-600">
                                    <th className="p-4 font-semibold">监控关键词</th>
                                    <th className="p-4 font-semibold">词性/分类</th>
                                    <th className="p-4 font-semibold">全网声量</th>
                                    <th className="p-4 font-semibold">负面率</th>
                                    <th className="p-4 font-semibold">传播热度</th>
                                    <th className="p-4 font-semibold">主要影响平台</th>
                                    <th className="p-4 font-semibold">风险等级</th>
                                    <th className="p-4 font-semibold">系统策略建议</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                                {keywordData.map(row => (
                                    <tr key={row.id} className="hover:bg-blue-50 transition">
                                        <td className="p-4 font-medium text-gray-900">{row.keyword}</td>
                                        <td className="p-4"><span className="bg-gray-100 text-gray-600 px-2 py-1 rounded text-xs">{row.type}</span></td>
                                        <td className="p-4">{row.volume}</td>
                                        <td className="p-4"><span className={parseInt(row.negRate) > 30 ? 'text-red-600 font-bold' : ''}>{row.negRate}</span></td>
                                        <td className="p-4">
                                            <div className="flex items-center gap-2">
                                                <div className="w-16 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                                                    <div className="h-full bg-[var(--primary)]" style={{ width: `${row.heat}%` }}></div>
                                                </div>
                                                <span className="text-xs">{row.heat}</span>
                                            </div>
                                        </td>
                                        <td className="p-4 text-gray-600">{row.platforms.join(', ')}</td>
                                        <td className="p-4">
                                            <span className={`inline-flex px-2 py-1 rounded-full text-xs font-semibold ${row.risk === 'high' ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}`}>
                                                {row.risk === 'high' ? '高风险' : '低风险'}
                                            </span>
                                        </td>
                                        <td className="p-4 text-[var(--primary)] truncate max-w-[200px]" title={row.suggestion}>{row.suggestion}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {subTab === 'questions' && (
                    <div className="card overflow-hidden animation-fade-in">
                        <table className="w-full text-left text-sm border-collapse">
                            <thead>
                                <tr className="bg-gray-50 border-b border-gray-200 text-gray-600">
                                    <th className="p-4 font-semibold">用户AI提问 (Prompt)</th>
                                    <th className="p-4 font-semibold">所属簇/意图</th>
                                    <th className="p-4 font-semibold text-center">提及率</th>
                                    <th className="p-4 font-semibold text-center">主动推荐</th>
                                    <th className="p-4 font-semibold text-center">平均顺位</th>
                                    <th className="p-4 font-semibold text-center">情感倾向</th>
                                    <th className="p-4 font-semibold text-center">准确率</th>
                                    <th className="p-4 font-semibold text-center">幻觉/编造率</th>
                                    <th className="p-4 font-semibold text-center">风险</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                                {questionData.map(row => (
                                    <tr key={row.id} className="hover:bg-blue-50 transition">
                                        <td className="p-4">
                                            <div className="font-medium text-gray-900 mb-1">{row.question}</div>
                                            <div className="text-xs text-gray-400">覆盖: {row.models.join(', ')}</div>
                                        </td>
                                        <td className="p-4">
                                            <div className="text-xs font-medium text-indigo-700 bg-indigo-50 inline-block px-2 py-0.5 rounded mb-1">{row.cluster}</div>
                                            <div className="text-xs text-gray-500">{row.intent}</div>
                                        </td>
                                        <td className="p-4 text-center">{row.mentionRate}</td>
                                        <td className="p-4 text-center">{row.recRate}</td>
                                        <td className="p-4 text-center">TOP {row.avgRank}</td>
                                        <td className="p-4 text-center">
                                            <span className={`${row.sentiment === '负向' ? 'text-red-500' : row.sentiment === '正向' ? 'text-green-500' : 'text-gray-500'}`}>{row.sentiment}</span>
                                        </td>
                                        <td className="p-4 text-center"><span className={parseInt(row.accuracy) < 50 ? 'text-red-600 font-bold' : ''}>{row.accuracy}</span></td>
                                        <td className="p-4 text-center"><span className={parseInt(row.hallucination) > 10 ? 'text-orange-500 font-bold' : ''}>{row.hallucination}</span></td>
                                        <td className="p-4 text-center">
                                            <span className={`inline-flex px-2 py-1 rounded-full text-xs font-semibold ${row.risk === 'high' ? 'bg-red-100 text-red-800' : row.risk === 'medium' ? 'bg-orange-100 text-orange-800' : 'bg-green-100 text-green-800'}`}>
                                                {row.risk === 'high' ? '高风险' : row.risk === 'medium' ? '中风险' : '低风险'}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {subTab === 'cross' && (
                    <div className="grid grid-cols-1 gap-6 animation-fade-in">
                        <div className="card p-6 bg-gradient-to-br from-indigo-50 to-white">
                            <h3 className="text-lg font-semibold flex items-center gap-2 mb-4 text-indigo-900">
                                <div className="icon-brain-circuit"></div>
                                AI 交叉洞察与关联发现 (Auto-Insights)
                            </h3>
                            <div className="space-y-4">
                                <div className="bg-white p-4 rounded-lg border border-indigo-100 shadow-sm relative pl-12">
                                    <div className="absolute left-4 top-4 icon-file-search text-red-500 text-xl"></div>
                                    <p className="text-sm text-gray-800 leading-relaxed">
                                        在 <span className="font-bold">“奥迪E7X 换壳”</span> 关键词下，百度搜索结果首页中负面内容占比达到 46%，其中 3 篇高传播负面文章被 <span className="font-bold text-[var(--primary)]">豆包、Kimi 和 通义千问</span> 多次引用，直接导致在回答 <span className="font-bold">“奥迪E7X靠谱吗”</span> 和 <span className="font-bold">“两车底盘区别”</span> 提问时，模型答案负面率上升至 68%。
                                    </p>
                                </div>
                                <div className="bg-white p-4 rounded-lg border border-indigo-100 shadow-sm relative pl-12">
                                    <div className="absolute left-4 top-4 icon-git-compare text-orange-500 text-xl"></div>
                                    <p className="text-sm text-gray-800 leading-relaxed">
                                        在 <span className="font-bold">“奥迪E7X和竞品XX哪个好”</span> 购买决策问题簇中，<span className="font-bold text-[var(--primary)]">DeepSeek 和 通义千问</span> 均优先推荐竞品。本品牌主要劣势被模型归结于 <span className="font-bold">“公开评测内容少”</span> 与 <span className="font-bold">“第三方权威背书不足”</span>。
                                    </p>
                                </div>
                                <div className="bg-white p-4 rounded-lg border border-indigo-100 shadow-sm relative pl-12">
                                    <div className="absolute left-4 top-4 icon-trending-up text-blue-500 text-xl"></div>
                                    <p className="text-sm text-gray-800 leading-relaxed">
                                        小红书中 <span className="font-bold">“智己LS7 避雷”</span> 相关笔记互动量周环比增长 128%，并已开始污染百度搜索下拉框提示词，极易在下一次大模型语料更新期被抓取，建议优先启动社媒防守策略。
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        );
    } catch (error) {
        console.error('KeywordQueryAnalysis component error:', error);
        return null;
    }
}