import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { usePuterStore } from "~/lib/puter";

const WipeApp = () => {
    const { auth, isLoading, error, clearError, fs, ai, kv } = usePuterStore();
    const navigate = useNavigate();
    const [files, setFiles] = useState<FSItem[]>([]);
    const [isDeleting, setIsDeleting] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);

    const loadFiles = async () => {
        try {
            const files = (await fs.readDir("./")) as FSItem[];
            setFiles(files);
        } catch (err) {
            console.error("Failed to load files:", err);
        }
    };

    useEffect(() => {
        loadFiles();
    }, []);

    useEffect(() => {
        if (!isLoading && !auth.isAuthenticated) {
            navigate("/auth?next=/wipe");
        }
    }, [isLoading]);

    const handleDelete = async () => {
        setIsDeleting(true);
        try {
            await Promise.all(files.map(async (file) => {
                await fs.delete(file.path);
            }));
            await kv.flush();
            await loadFiles();
            setShowConfirm(false);
        } catch (err) {
            console.error("Failed to delete files:", err);
        } finally {
            setIsDeleting(false);
        }
    };

    const formatFileSize = (bytes: number) => {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    const getFileIcon = (file: FSItem) => {
        if (file.is_dir) return "📁";
        const ext = file.name.split('.').pop()?.toLowerCase();
        switch (ext) {
            case 'txt': return "📄";
            case 'pdf': return "📕";
            case 'jpg':
            case 'jpeg':
            case 'png':
            case 'gif': return "🖼️";
            case 'mp4':
            case 'avi':
            case 'mov': return "🎥";
            case 'mp3':
            case 'wav': return "🎵";
            default: return "📄";
        }
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
                <div className="bg-white rounded-2xl shadow-xl p-8 flex items-center space-x-4">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    <span className="text-gray-700 font-medium">Loading your data...</span>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-red-50 to-red-100 flex items-center justify-center">
                <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full mx-4">
                    <div className="text-center">
                        <div className="text-red-500 text-6xl mb-4">⚠️</div>
                        <h2 className="text-xl font-bold text-gray-900 mb-2">Something went wrong</h2>
                        <p className="text-gray-600 mb-6">Error: {error}</p>
                        <button
                            onClick={clearError}
                            className="bg-red-500 hover:bg-red-600 text-white px-6 py-2 rounded-lg font-medium transition-colors"
                        >
                            Try Again
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
            <div className="container mx-auto px-4 py-8 max-w-4xl">
                {/* Header */}
                <div className="bg-white rounded-2xl shadow-lg p-6 mb-8">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900 mb-2">Data Management</h1>
                            <p className="text-gray-600">Manage your application data and files</p>
                        </div>
                        <div className="text-right">
                            <p className="text-sm text-gray-500">Authenticated as</p>
                            <p className="font-semibold text-blue-600 flex items-center">
                                <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                                {auth.user?.username}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Files Section */}
                <div className="bg-white rounded-2xl shadow-lg p-6 mb-8">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-xl font-bold text-gray-900">Your Files</h2>
                        <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
                            {files.length} {files.length === 1 ? 'item' : 'items'}
                        </span>
                    </div>
                    
                    {files.length === 0 ? (
                        <div className="text-center py-12">
                            <div className="text-gray-400 text-6xl mb-4">📁</div>
                            <h3 className="text-lg font-medium text-gray-600 mb-2">No files found</h3>
                            <p className="text-gray-500">Your storage appears to be empty</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {files.map((file) => (
                                <div key={file.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
                                    <div className="flex items-center space-x-3">
                                        <span className="text-2xl">{getFileIcon(file)}</span>
                                        <div>
                                            <p className="font-medium text-gray-900">{file.name}</p>
                                            <p className="text-sm text-gray-500">
                                                {file.is_dir ? 'Folder' : formatFileSize(file.size || 0)}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="text-xs text-gray-400">
                                        {file.is_dir ? 'DIR' : 'FILE'}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Danger Zone */}
                <div className="bg-white rounded-2xl shadow-lg border-2 border-red-100 p-6">
                    <div className="flex items-start space-x-4">
                        <div className="text-red-500 text-2xl">⚠️</div>
                        <div className="flex-1">
                            <h2 className="text-xl font-bold text-red-600 mb-2">Danger Zone</h2>
                            <p className="text-gray-600 mb-4">
                                This action will permanently delete all your files and application data. 
                                This cannot be undone.
                            </p>
                            
                            {!showConfirm ? (
                                <button
                                    onClick={() => setShowConfirm(true)}
                                    disabled={files.length === 0}
                                    className={`px-6 py-3 rounded-lg font-medium transition-all ${
                                        files.length === 0
                                            ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                                            : 'bg-red-500 hover:bg-red-600 text-white hover:shadow-lg transform hover:-translate-y-0.5'
                                    }`}
                                >
                                    Wipe All Data
                                </button>
                            ) : (
                                <div className="space-y-4">
                                    <div className="bg-red-50 border-l-4 border-red-400 p-4 rounded">
                                        <p className="text-red-700 font-medium">
                                            Are you absolutely sure? This will delete {files.length} {files.length === 1 ? 'item' : 'items'}.
                                        </p>
                                    </div>
                                    <div className="flex space-x-3">
                                        <button
                                            onClick={handleDelete}
                                            disabled={isDeleting}
                                            className="bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white px-6 py-3 rounded-lg font-medium transition-colors flex items-center space-x-2"
                                        >
                                            {isDeleting && (
                                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                            )}
                                            <span>{isDeleting ? 'Deleting...' : 'Yes, Delete Everything'}</span>
                                        </button>
                                        <button
                                            onClick={() => setShowConfirm(false)}
                                            disabled={isDeleting}
                                            className="bg-gray-300 hover:bg-gray-400 disabled:bg-gray-200 text-gray-700 px-6 py-3 rounded-lg font-medium transition-colors"
                                        >
                                            Cancel
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default WipeApp;