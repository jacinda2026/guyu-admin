function ProjectManagement() {
    const [projects, setProjects] = React.useState([
        { id: 1, name: '奥迪E7X与智己LS7「换壳」舆情专项', status: 'active', models: ['豆包 Pro', 'DeepSeek', '混元 Turbo', '通义千问'], keywords: ['换壳', '平台', 'E7X', 'LS7'], lastRun: '2026-05-11' },
        { id: 2, name: '某品牌自动驾驶系统事故监控', status: 'paused', models: ['DeepSeek', '通义千问'], keywords: ['自动驾驶', '事故', '失灵'], lastRun: '2026-05-10' },
    ]);
    const [isModalOpen, setIsModalOpen] = React.useState(false);
    
    // Form state
    const [formState, setFormState] = React.useState({
        name: '',
        keywords: '',
        models: {
            doubao: true,
            deepseek: true,
            qwen: false,
            hunyuan: false,
            kimi: false
        }
    });

    const handleCreate = () => {
        setIsModalOpen(true);
    };

    const handleSave = () => {
        const newProject = {
            id: Date.now(),
            name: formState.name || '未命名项目',
            status: 'active',
            models: Object.keys(formState.models).filter(k => formState.models[k]),
            keywords: formState.keywords.split(/[,，\s]+/).filter(k => k),
            lastRun: '等待运行'
        };
        setProjects([newProject, ...projects]);
        setIsModalOpen(false);
        setFormState({ name: '', keywords: '', models: { doubao: true, deepseek: true, qwen: false, hunyuan: false, kimi: false } });
    };

    return (
        <div className="space-y-6" data-name="ProjectManagement" data-file="pages/ProjectManagement.js">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h2 className="text-xl font-bold">舆情项目管理</h2>
                    <p className="text-sm text-[var(--text-muted)] mt-1">创建和配置监控项目，设置大模型和舆情关键词</p>
                </div>
                <button onClick={handleCreate} className="bg-[var(--primary)] text-white px-4 py-2 rounded-lg text-sm hover:bg-[var(--primary-hover)] flex items-center gap-2 shadow-sm transition">
                    <div className="icon-plus"></div>
                    新建项目
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {projects.map(proj => (
                    <div key={proj.id} className="card p-6 flex flex-col hover:border-[var(--primary)] transition-colors cursor-pointer group">
                        <div className="flex justify-between items-start mb-4">
                            <div className={`badge ${proj.status === 'active' ? 'badge-success' : 'badge-warning'} mb-2`}>
                                {proj.status === 'active' ? '监控中' : '已暂停'}
                            </div>
                            <button className="text-gray-400 hover:text-gray-700 opacity-0 group-hover:opacity-100 transition">
                                <div className="icon-settings text-lg"></div>
                            </button>
                        </div>
                        <h3 className="font-semibold text-lg text-gray-900 mb-2 line-clamp-2" title={proj.name}>{proj.name}</h3>
                        
                        <div className="mt-4 space-y-3 flex-1">
                            <div>
                                <div className="text-xs text-gray-500 mb-1">监控模型 ({proj.models.length})</div>
                                <div className="flex flex-wrap gap-1">
                                    {proj.models.map(m => (
                                        <span key={m} className="px-2 py-1 bg-blue-50 text-blue-700 rounded text-xs">{m}</span>
                                    ))}
                                </div>
                            </div>
                            <div>
                                <div className="text-xs text-gray-500 mb-1">监控关键词/问题 ({proj.keywords.length})</div>
                                <div className="flex flex-wrap gap-1">
                                    {proj.keywords.map(k => (
                                        <span key={k} className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs">{k}</span>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div className="mt-6 pt-4 border-t border-gray-100 flex justify-between items-center text-xs text-gray-500">
                            <span>最后运行: {proj.lastRun}</span>
                            <div className="flex gap-2">
                                <span className="hover:text-[var(--primary)]">配置</span>
                                <span>|</span>
                                <span className="hover:text-[var(--primary)]">看板</span>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            <Modal 
                isOpen={isModalOpen} 
                onClose={() => setIsModalOpen(false)} 
                title="新建舆情监控项目"
                footer={
                    <>
                        <button onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg transition">取消</button>
                        <button onClick={handleSave} className="px-4 py-2 text-sm text-white bg-[var(--primary)] hover:bg-[var(--primary-hover)] rounded-lg transition">保存并创建</button>
                    </>
                }
            >
                <div className="space-y-5">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">项目名称 <span className="text-red-500">*</span></label>
                        <input 
                            type="text" 
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent" 
                            placeholder="例如：2026年XX品牌新品发布会负面舆情监控"
                            value={formState.name}
                            onChange={e => setFormState({...formState, name: e.target.value})}
                        />
                    </div>
                    
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">舆情关键词或提问锚点 <span className="text-red-500">*</span></label>
                        <textarea 
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent h-24" 
                            placeholder="输入要监控的核心关键词、长尾词或诱导性问题（多个以逗号或空格分隔）"
                            value={formState.keywords}
                            onChange={e => setFormState({...formState, keywords: e.target.value})}
                        ></textarea>
                        <p className="text-xs text-gray-500 mt-1">例如：电池自燃，刹车失灵，换壳，智商税</p>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">选择监控大模型池</label>
                        <div className="grid grid-cols-2 gap-3">
                            <label className="flex items-center gap-2 p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
                                <input type="checkbox" className="w-4 h-4 text-[var(--primary)] rounded focus:ring-[var(--primary)]" checked={formState.models.doubao} onChange={e => setFormState({...formState, models: {...formState.models, doubao: e.target.checked}})} />
                                <span className="text-sm font-medium">豆包 Doubao Pro</span>
                            </label>
                            <label className="flex items-center gap-2 p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
                                <input type="checkbox" className="w-4 h-4 text-[var(--primary)] rounded focus:ring-[var(--primary)]" checked={formState.models.deepseek} onChange={e => setFormState({...formState, models: {...formState.models, deepseek: e.target.checked}})} />
                                <span className="text-sm font-medium">DeepSeek Chat</span>
                            </label>
                            <label className="flex items-center gap-2 p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
                                <input type="checkbox" className="w-4 h-4 text-[var(--primary)] rounded focus:ring-[var(--primary)]" checked={formState.models.qwen} onChange={e => setFormState({...formState, models: {...formState.models, qwen: e.target.checked}})} />
                                <span className="text-sm font-medium">通义千问 Qwen Turbo</span>
                            </label>
                            <label className="flex items-center gap-2 p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
                                <input type="checkbox" className="w-4 h-4 text-[var(--primary)] rounded focus:ring-[var(--primary)]" checked={formState.models.hunyuan} onChange={e => setFormState({...formState, models: {...formState.models, hunyuan: e.target.checked}})} />
                                <span className="text-sm font-medium">腾讯混元 Hunyuan Turbo</span>
                            </label>
                            <label className="flex items-center gap-2 p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
                                <input type="checkbox" className="w-4 h-4 text-[var(--primary)] rounded focus:ring-[var(--primary)]" checked={formState.models.kimi} onChange={e => setFormState({...formState, models: {...formState.models, kimi: e.target.checked}})} />
                                <span className="text-sm font-medium">Kimi 月之暗面</span>
                            </label>
                        </div>
                    </div>

                    <div className="bg-blue-50 p-4 rounded-lg border border-blue-100 flex items-start gap-3">
                        <div className="icon-info text-blue-500 mt-0.5"></div>
                        <div className="text-sm text-blue-800">
                            创建项目后，系统将自动利用选定的大模型在全网范围内生成和抓取舆情回答样本，并执行诊断分析。
                        </div>
                    </div>
                </div>
            </Modal>
        </div>
    );
}