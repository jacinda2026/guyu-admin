function Header() {
    const [showNotif, setShowNotif] = React.useState(false);

    const notifications = [
        { id: 1, title: '新增高风险回答', desc: 'DeepSeek在"两车底盘区别"中再次输出换壳定论', time: '10分钟前', unread: true },
        { id: 2, title: '舆情扩散预警', desc: '新浪看点爆发3篇相似负面文章，被通义千问收录', time: '1小时前', unread: true },
        { id: 3, title: '监测报告生成', desc: '上周《大模型诊断周报》已生成完毕', time: '2小时前', unread: false },
    ];

    return (
        <header className="h-16 bg-[var(--bg-surface)] border-b border-[var(--border-color)] flex items-center justify-between px-8 sticky top-0 z-20" data-name="Header" data-file="components/Header.js">
            <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 bg-gray-100 px-3 py-1.5 rounded-lg border border-gray-200 cursor-pointer hover:bg-gray-200 transition">
                    <div className="icon-folder text-blue-600"></div>
                    <span className="text-sm font-medium text-gray-700">当前项目: 奥迪E7X舆情</span>
                    <div className="icon-chevron-down text-gray-400 text-sm"></div>
                </div>
                <h1 className="text-xl font-semibold text-[var(--text-main)] ml-2">奥迪E7X与智己LS7「换壳」舆情专项</h1>
                <span className="badge badge-danger">高风险预警</span>
            </div>
            <div className="flex items-center gap-4 text-[var(--text-muted)]">
                <div className="relative">
                    <div className="relative cursor-pointer hover:text-[var(--text-main)]" onClick={() => setShowNotif(!showNotif)}>
                        <div className="icon-bell text-xl"></div>
                        <span className="absolute -top-1 -right-1 flex h-3 w-3">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                        </span>
                    </div>

                    {showNotif && (
                        <div className="absolute right-0 mt-3 w-80 bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
                            <div className="p-3 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                                <span className="font-semibold text-gray-800 text-sm">实时舆情通知</span>
                                <span className="text-xs text-blue-600 cursor-pointer hover:underline">全部标为已读</span>
                            </div>
                            <div className="max-h-80 overflow-y-auto">
                                {notifications.map(n => (
                                    <div key={n.id} className={`p-3 border-b border-gray-50 hover:bg-gray-50 cursor-pointer ${n.unread ? 'bg-blue-50/30' : ''}`}>
                                        <div className="flex justify-between items-start mb-1">
                                            <div className="flex items-center gap-2">
                                                {n.unread && <span className="w-1.5 h-1.5 bg-red-500 rounded-full"></span>}
                                                <span className="font-medium text-sm text-gray-800">{n.title}</span>
                                            </div>
                                            <span className="text-xs text-gray-400">{n.time}</span>
                                        </div>
                                        <p className="text-xs text-gray-600 pl-3.5 line-clamp-2">{n.desc}</p>
                                    </div>
                                ))}
                            </div>
                            <div className="p-2 text-center text-xs text-gray-500 hover:bg-gray-50 cursor-pointer border-t border-gray-100">
                                查看全部通知
                            </div>
                        </div>
                    )}
                </div>
                <div className="cursor-pointer hover:text-[var(--text-main)]">
                    <div className="icon-settings text-xl"></div>
                </div>
            </div>
        </header>
    );
}
