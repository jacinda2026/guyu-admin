// Important: DO NOT remove this `ErrorBoundary` component.
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo.componentStack);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">系统出现异常</h1>
            <p className="text-gray-600 mb-4">很抱歉，加载过程中发生了意外错误。</p>
            <button
              onClick={() => window.location.reload()}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
            >
              重新加载
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

function App() {
  const [currentTab, setCurrentTab] = React.useState('overview');

  const renderContent = () => {
    switch (currentTab) {
      case 'overview':
        return <Overview />;
      case 'models':
        return <ModelsAnalysis />;
      case 'sources':
        return <SourcesMonitor />;
      case 'news':
        return <NewsFeed />;
      case 'keyword-query':
        return <KeywordQueryAnalysis />;
      case 'projects':
        return <ProjectManagement />;
      default:
        return <Overview />;
    }
  };

  try {
    return (
      <div className="flex bg-[var(--bg-body)] min-h-screen" data-name="App" data-file="app.js">
        <Sidebar currentTab={currentTab} setCurrentTab={setCurrentTab} />
        
        <div className="flex-1 ml-[var(--sidebar-width)] flex flex-col">
          <Header />
          <main className="p-8 max-w-7xl mx-auto w-full">
            {renderContent()}
          </main>
          
          <footer className="mt-auto py-6 text-center text-sm text-gray-400">
            &copy; 2026 AI大模型舆情与GEO优化监控系统. 保留所有权利.
          </footer>
        </div>
      </div>
    );
  } catch (error) {
    console.error('App component error:', error);
    return null;
  }
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <ErrorBoundary>
    <App />
  </ErrorBoundary>
);