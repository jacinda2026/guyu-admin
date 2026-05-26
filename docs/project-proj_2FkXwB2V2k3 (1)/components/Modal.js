function Modal({ isOpen, onClose, title, children, footer }) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto overflow-x-hidden bg-black/50" data-name="Modal" data-file="components/Modal.js">
            <div className="relative w-full max-w-2xl p-4">
                <div className="relative bg-white rounded-xl shadow-xl flex flex-col max-h-[90vh]">
                    <div className="flex items-center justify-between p-5 border-b border-gray-200">
                        <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
                        <button onClick={onClose} className="text-gray-400 hover:text-gray-900 rounded-lg p-1.5 hover:bg-gray-100">
                            <div className="icon-x text-xl"></div>
                        </button>
                    </div>
                    <div className="p-6 overflow-y-auto">
                        {children}
                    </div>
                    {footer && (
                        <div className="flex items-center justify-end p-5 border-t border-gray-200 gap-3">
                            {footer}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}