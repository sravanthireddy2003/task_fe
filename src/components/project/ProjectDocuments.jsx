
import React, { useState, useRef, useEffect } from "react";
import { getAccessToken } from "../../utils/tokenService";
import { useDispatch, useSelector } from "react-redux";
import * as Icons from "../../icons";
import Button from "../Button";
import { formatFileSize as formatFileSizeHelper } from "../../utils/fileHelpers";
import { fetchDocuments } from "../../redux/slices/documentSlice";
// toast for notifications
import { toast } from "sonner";

const ProjectDocuments = ({ project, onClose }) => {
    const dispatch = useDispatch();
    const fileInputRef = useRef(null);
    const [uploading, setUploading] = useState(false);
    const [selectedFiles, setSelectedFiles] = useState([]);

    // Select documents from Redux store
    const documents = useSelector(state => state.documents.items);
    const status = useSelector(state => state.documents.status);

    // Fetch documents when component mounts or project changes
    useEffect(() => {
        if (project?.id || project?._id || project?.public_id) {
            const projectId = project.public_id || project.id || project._id;
            dispatch(fetchDocuments({ projectId, type: 'PROJECT' }));
        }
    }, [project, dispatch]);

    const getFileIcon = (mimeType) => {
        if (!mimeType) return <Icons.FileText className="tm-icon text-gray-400" />;
        const type = mimeType.toLowerCase();
        if (type.includes('pdf')) return <Icons.FileText className="tm-icon text-red-500" />;
        if (type.includes('image')) return <Icons.FileImage className="tm-icon text-green-500" />;
        if (type.includes('word') || type.includes('doc')) return <Icons.FileChartPie className="tm-icon text-blue-500" />;
        if (type.includes('excel') || type.includes('xls')) return <Icons.FileSpreadsheet className="tm-icon text-green-600" />;
        return <Icons.FileText className="tm-icon text-gray-400" />;
    };

    const formatFileSize = (bytes) => formatFileSizeHelper(bytes);

    const handleFileSelect = (event) => {
        const files = Array.from(event.target.files);
        if (files.length === 0) return;
        setSelectedFiles(prev => [...prev, ...files]);
        // Reset input so the same file can be selected again if removed
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const removeSelectedFile = (index) => {
        setSelectedFiles(prev => prev.filter((_, i) => i !== index));
    };

    const handleFileUploadSubmit = async () => {
        if (selectedFiles.length === 0) return;

        setUploading(true);
        try {
            const projectId = project.public_id || project.id || project._id;
            for (const file of selectedFiles) {
                const formData = new FormData();
                formData.append('document', file);
                formData.append('entityType', 'PROJECT');
                formData.append('entityId', projectId);

                const token = getAccessToken();
                const response = await fetch('/api/documents/upload', {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${token}`
                    },
                    body: formData
                });

                if (!response.ok) {
                    throw new Error(`Upload failed: ${response.status}`);
                }
            }
            toast.success("Documents uploaded successfully");
            setSelectedFiles([]);
            // Refresh documents
            dispatch(fetchDocuments({ projectId, type: 'PROJECT' }));

            // Close the modal upon success!
            if (onClose) {
                onClose();
            }
        } catch (error) {
            toast.error("Upload failed: " + error.message);
        } finally {
            setUploading(false);
        }
    };



    const user = useSelector(state => state.auth.user);
    const userRole = user?.role?.toLowerCase() || 'employee';
    const canModify = userRole === 'admin' || userRole === 'manager';

    return (
        <div className="w-full">
            {/* Header and Upload Button */}
            <div className="flex flex-col gap-4 mb-4">
                <div className="flex items-center justify-between">
                    <h3 className="text-section-title text-gray-800">Project Documents</h3>
                    {canModify && (
                        <div className="flex gap-2">
                            <input
                                type="file"
                                ref={fileInputRef}
                                onChange={handleFileSelect}
                                multiple
                                accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png"
                                className="hidden"
                            />
                            <Button
                                label="Select Files"
                                icon={<Icons.Plus />}
                                onClick={() => fileInputRef.current?.click()}
                                disabled={uploading}
                                className="bg-gray-100 text-gray-700 px-3 py-1.5 rounded-lg text-sm hover:bg-gray-200 transition-colors"
                            />
                        </div>
                    )}
                </div>

                {/* Selected Files Staging Area */}
                {selectedFiles.length > 0 && (
                    <div className="bg-blue-50 border border-blue-100 rounded-lg p-3">
                        <div className="flex items-center justify-between mb-2">
                            <h4 className="text-sm font-semibold text-blue-800">Ready to Upload</h4>
                            <Button
                                label={uploading ? "Uploading..." : "Submit Upload"}
                                icon={!uploading && <Icons.UploadCloud />}
                                onClick={handleFileUploadSubmit}
                                disabled={uploading}
                                className="bg-blue-600 text-white px-3 py-1.5 rounded-lg text-sm hover:bg-blue-700 transition-colors"
                            />
                        </div>
                        <div className="space-y-2">
                            {selectedFiles.map((file, idx) => (
                                <div key={idx} className="flex flex-row items-center justify-between bg-white px-3 py-2 rounded border border-blue-100 text-sm">
                                    <span className="text-gray-700 font-medium truncate max-w-[80%]">{file.name}</span>
                                    <button
                                        onClick={() => removeSelectedFile(idx)}
                                        disabled={uploading}
                                        className="text-red-500 hover:text-red-700 p-1"
                                    >
                                        <Icons.X className="w-4 h-4" />
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* List */}
            <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
                {status === 'loading' ? (
                    <div className="text-center py-8">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                        <p className="text-sm text-gray-500 mt-2">Loading documents...</p>
                    </div>
                ) : documents.length === 0 ? (
                    <div className="text-center py-8 text-gray-500 bg-gray-50 rounded-lg border-2 border-dashed border-gray-200">
                        <Icons.FileText className="tm-icon mx-auto mb-2 text-gray-400" />
                        <p className="text-sm">No documents found for this project</p>
                    </div>
                ) : (
                    documents.map((doc) => (
                        <div key={doc.documentId || doc.id || doc._id} className="bg-white p-3 rounded-lg border shadow-sm flex items-center justify-between hover:shadow-md transition-shadow">
                            <div className="flex items-center space-x-3 overflow-hidden">
                                {getFileIcon(doc.mimeType || doc.file_type)}
                                <div className="min-w-0">
                                    <p className="text-sm font-medium text-gray-900 truncate" title={doc.fileName || doc.file_name}>
                                        {doc.fileName || doc.file_name || "Unnamed Document"}
                                    </p>
                                    <div className="flex items-center text-xs text-gray-500 gap-2">
                                        <span>{formatFileSize(doc.fileSize || doc.file_size)}</span>
                                        <span>â€¢</span>
                                        <span>{new Date(doc.uploadedAt || doc.uploaded_at).toLocaleDateString()}</span>
                                    </div>
                                </div>
                            </div>


                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default ProjectDocuments;

