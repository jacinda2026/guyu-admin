function Sidebar({ currentTab, setCurrentTab }) {
    const navItems = [
        { id: 'overview', label: '舆情总览', icon: 'layout-dashboard' },
        { id: 'models', label: '模型诊断', icon: 'bot' },
        { id: 'sources', label: '信源监控', icon: 'database' },
        { id: 'news', label: '实时舆情', icon: 'radio' },
        { id: 'keyword-query', label: '关键词与问题分析', icon: 'search-code' },
        { id: 'projects', label: '项目管理', icon: 'folder-kanban' },
    ];

    return (
        <aside className="w-[var(--sidebar-width)] bg-[var(--bg-surface)] border-r border-[var(--border-color)] fixed h-screen top-0 left-0 flex flex-col z-10" data-name="Sidebar" data-file="components/Sidebar.js">
            <div className="h-16 flex items-center px-6 border-b border-[var(--border-color)]">
                <div className="icon-activity text-[var(--primary)] text-2xl mr-2"></div>
                <span className="font-bold text-lg tracking-wide">AI-Monitor</span>
            </div>
            
            <div className="flex-1 overflow-y-auto py-6 px-4 space-y-2">
                <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4 px-2">功能菜单</div>
                {navItems.map(item => (
                    <div 
                        key={item.id}
                        onClick={() => setCurrentTab(item.id)}
                        className={`nav-item ${currentTab === item.id ? 'active' : ''}`}
                    >
                        <div className={`icon-${item.icon} text-lg`}></div>
                        {item.label}
                    </div>
                ))}
            </div>

            <div className="p-4 border-t border-[var(--border-color)]">
                <div className="flex items-center gap-3">
                    <img src="https://ui-avatars.com/api/?name=Admin&background=2563eb&color=fff" alt="User" className="w-8 h-8 rounded-full" />
                    <div>
                        <div className="text-sm font-medium">管理员</div>
                        <div className="text-xs text-gray-500">admin@trickle.so</div>
                    </div>
                </div>
            </div>
        </aside>
    );
}