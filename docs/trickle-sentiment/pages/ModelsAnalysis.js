function ModelsAnalysis() {
    const [expandedRow, setExpandedRow] = React.useState(null);

    const models = [
        { id: 'doubao', name: 'doubao-1-5-pro', display: '豆包 Pro', samples: 30, errShell: 8, errTech: 2, errUnclear: 5, totalErr: 15, errRate: '50.0%', tag: '思考型', note: '以 “无明确纠正” 为主，误判比例相对较低' },
        { id: 'deepseek', name: 'deepseek-chat', display: 'DeepSeek', samples: 28, errShell: 9, errTech: 3, errUnclear: 4, totalErr: 16, errRate: '57.1%', tag: '垂直优化', note: '“换壳关系误判” 占比最高，技术混淆较明显' },
        { id: 'qwen', name: 'qwen-turbo', display: '通义千问', samples: 27, errShell: 10, errTech: 1, errUnclear: 5, totalErr: 16, errRate: '59.3%', tag: '响应优先', note: '“换壳关系误判” 比例最高，错误结论最直接' },
        { id: 'hunyuan', name: 'hunyuan-turbo', display: '混元 Turbo', samples: 27, errShell: 7, errTech: 2, errUnclear: 6, totalErr: 15, errRate: '55.6%', tag: '多领域', note: '错误类型分布均匀，无单一突出错误' }
    ];

    return (
        <div className="space-y-6" data-name="ModelsAnalysis" data-file="pages/ModelsAnalysis.js">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h2 className="text-xl font-bold">AI大模型回答错误诊断</h2>
                    <p className="text-sm text-[var(--text-muted)] mt-1">共计112轮标准化有效问答测试结果追踪</p>
                </div>
                <button className="bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-lg text-sm hover:bg-gray-50 flex items-center gap-2 shadow-sm">
                    <div className="icon-download"></div>
                    导出诊断报告
                </button>
            </div>

            <div className="card overflow-hidden">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-gray-50 border-b border-gray-200 text-sm text-gray-600">
                            <th className="p-4 font-semibold">AI 模型名称</th>
                            <th className="p-4 font-semibold text-center">总样本量</th>
                            <th className="p-4 font-semibold text-center">换壳关系误判</th>
                            <th className="p-4 font-semibold text-center">平台技术混淆</th>
                            <th className="p-4 font-semibold text-center">无明确纠正</th>
                            <th className="p-4 font-semibold text-center">总错误数</th>
                            <th className="p-4 font-semibold text-right">错误率</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                        {models.map((model) => (
                            <React.Fragment key={model.id}>
                                <tr 
                                    className={`hover:bg-blue-50 cursor-pointer transition ${expandedRow === model.id ? 'bg-blue-50/50' : ''}`}
                                    onClick={() => setExpandedRow(expandedRow === model.id ? null : model.id)}
                                >
                                    <td className="p-4">
                                        <div className="flex items-center gap-2">
                                            <div className={`icon-chevron-${expandedRow === model.id ? 'down' : 'right'} text-gray-400`}></div>
                                            <div>
                                                <div className="font-medium text-gray-900">{model.display}</div>
                                                <div className="text-xs text-gray-500 mt-0.5 flex items-center gap-2">
                                                    <span className="px-1.5 py-0.5 rounded bg-gray-100">{model.tag}</span>
                                                    {model.name}
                                                </div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="p-4 text-center text-gray-600">{model.samples}</td>
                                    <td className="p-4 text-center"><span className="text-red-600 font-medium">{model.errShell}</span></td>
                                    <td className="p-4 text-center"><span className="text-orange-500">{model.errTech}</span></td>
                                    <td className="p-4 text-center text-gray-500">{model.errUnclear}</td>
                                    <td className="p-4 text-center font-bold text-gray-700">{model.totalErr}</td>
                                    <td className="p-4 text-right">
                                        <span className={`inline-flex px-2 py-1 rounded-full text-xs font-semibold ${
                                            parseFloat(model.errRate) > 55 ? 'bg-red-100 text-red-800' : 'bg-orange-100 text-orange-800'
                                        }`}>
                                            {model.errRate}
                                        </span>
                                    </td>
                                </tr>
                                {expandedRow === model.id && (
                                    <tr>
                                        <td colSpan="7" className="bg-gray-50 p-4 text-sm border-t border-gray-100">
                                            <div className="flex gap-4">
                                                <div className="w-1/2 p-4 bg-white rounded-lg border border-gray-200">
                                                    <h4 className="font-semibold text-gray-800 mb-2">模型错误特征</h4>
                                                    <p className="text-gray-600">{model.note}</p>
                                                    {model.id === 'deepseek' && <p className="text-gray-500 mt-2 text-xs">注：该模型虽含汽车相关训练，但汽车领域知识更新明显滞后。</p>}
                                                </div>
                                                <div className="w-1/2 p-4 bg-white rounded-lg border border-gray-200">
                                                    <h4 className="font-semibold text-gray-800 mb-2">主要信源引用问题</h4>
                                                    <p className="text-gray-600 text-xs mt-1">• 引用“非官方信源”占比过高</p>
                                                    <p className="text-gray-600 text-xs mt-1">• 引用汽车垂直平台（如易车、汽车之家）不足17%</p>
                                                </div>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </React.Fragment>
                        ))}
                    </tbody>
                </table>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="card p-6">
                    <h3 className="font-semibold text-lg mb-4">核心错误特征总结</h3>
                    <ul className="space-y-3">
                        <li className="flex gap-3 text-sm">
                            <div className="icon-circle-x text-red-500 shrink-0 mt-0.5"></div>
                            <div>
                                <span className="font-medium">错误率普遍偏高：</span> 平均错误率55.5%，说明主流AI模型在该舆情话题上的知识准确性严重不足。
                            </div>
                        </li>
                        <li className="flex gap-3 text-sm">
                            <div className="icon-target text-orange-500 shrink-0 mt-0.5"></div>
                            <div>
                                <span className="font-medium">错误集中于核心认知：</span> “换壳误判”和“无明确纠正”两类错误占总错误数的82.1%。
                            </div>
                        </li>
                        <li className="flex gap-3 text-sm">
                            <div className="icon-file-search text-blue-500 shrink-0 mt-0.5"></div>
                            <div>
                                <span className="font-medium">信源引用偏差：</span> 错误回答中83.0%引用非官方信源，垂直平台引用极少。
                            </div>
                        </li>
                    </ul>
                </div>
                <div className="card p-6">
                    <h3 className="font-semibold text-lg mb-4">语义理解偏差根因</h3>
                    <ul className="space-y-3">
                        <li className="flex gap-3 text-sm">
                            <div className="icon-network text-purple-500 shrink-0 mt-0.5"></div>
                            <div>
                                <span className="font-medium">概念混淆：</span> 模型将"上汽集团产业链关联"（事实）错误等同于"平台共享=换壳"（错误），偏差率58.9%。
                            </div>
                        </li>
                        <li className="flex gap-3 text-sm">
                            <div className="icon-cpu text-indigo-500 shrink-0 mt-0.5"></div>
                            <div>
                                <span className="font-medium">技术术语误解：</span> 对"ADP平台"和"星云平台"技术差异识别率仅29.4%。
                            </div>
                        </li>
                    </ul>
                </div>
            </div>

            <div className="card p-6">
                <h3 className="font-semibold text-lg mb-4">信源错误类型分布 (总样本 565条)</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                        <div className="flex justify-between items-center mb-2">
                            <div className="font-medium text-yellow-800">信息模糊</div>
                            <span className="text-xl font-bold text-yellow-600">72条 <span className="text-sm font-normal">(12.7%)</span></span>
                        </div>
                        <p className="text-xs text-yellow-700">含"不确定""可能""仅供参考"等表述，未明确澄清换壳争议</p>
                    </div>
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                        <div className="flex justify-between items-center mb-2">
                            <div className="font-medium text-green-800">正确回答</div>
                            <span className="text-xl font-bold text-green-600">35条 <span className="text-sm font-normal">(6.2%)</span></span>
                        </div>
                        <p className="text-xs text-green-700">明确指出"两车非换壳关系"，并提及平台差异（ADP vs 星云平台）</p>
                    </div>
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                        <div className="flex justify-between items-center mb-2">
                            <div className="font-medium text-red-800">错误认定</div>
                            <span className="text-xl font-bold text-red-600">8条 <span className="text-sm font-normal">(1.4%)</span></span>
                        </div>
                        <p className="text-xs text-red-700">错误判定"奥迪E7X是智己LS7换壳车"，存在直接误导风险</p>
                    </div>
                </div>
            </div>
        </div>
    );
}