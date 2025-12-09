import React, { useState, useRef, useEffect } from "react";
import { getAccessToken } from "../../utils/tokenService";
import { useDispatch } from "react-redux";
import { IoMdAdd, IoMdDownload, IoMdEye, IoMdTrash } from "react-icons/io";
import { MdFileUpload } from "react-icons/md";
import { FaFile, FaFilePdf, FaFileImage, FaFileWord, FaFileExcel } from "react-icons/fa";
import Button from "../Button";
import { attachDocument, deleteDocument } from "../../redux/slices/clientSlice";

const ClientDocuments = ({ client }) => {
  const dispatch = useDispatch();
  const fileInputRef = useRef(null);
  const [uploading, setUploading] = useState(false);

  const documents = client?.documents || [];

  const getFileIcon = (fileType) => {
    if (!fileType) return <FaFile className="text-gray-400" size={24} />;

    const type = fileType.toLowerCase();
    if (type.includes('pdf')) return <FaFilePdf className="text-red-500" size={24} />;
    if (type.includes('image') || type.includes('jpg') || type.includes('png') || type.includes('jpeg')) {
      return <FaFileImage className="text-green-500" size={24} />;
    }
    if (type.includes('word') || type.includes('doc')) return <FaFileWord className="text-blue-500" size={24} />;
    if (type.includes('excel') || type.includes('xls')) return <FaFileExcel className="text-green-600" size={24} />;
    return <FaFile className="text-gray-400" size={24} />;
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return '';
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  };

  const [showViewer, setShowViewer] = useState(false);
  const [viewerUrl, setViewerUrl] = useState(null);
  const [viewerName, setViewerName] = useState('');
  const fallbackTimerRef = useRef(null);
  const [showBlocked, setShowBlocked] = useState(false);

  const handleFileUpload = async (event) => {
    const files = Array.from(event.target.files);
    if (files.length === 0) return;

    setUploading(true);
    try {
      for (const file of files) {
        const documentData = {
          file_name: file.name,
          file_type: file.type,
          file_url: URL.createObjectURL(file), // In a real app, you'd upload to server first
        };

        await dispatch(attachDocument({
          clientId: client.id,
          document: documentData
        })).unwrap();
      }
    } catch (error) {
      console.error("Failed to upload document:", error);
    } finally {
      setUploading(false);
      // Clear the input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleDelete = async (documentId) => {
    if (window.confirm("Are you sure you want to delete this document?")) {
      try {
        await dispatch(deleteDocument({
          clientId: client.id,
          documentId
        })).unwrap();
      } catch (error) {
        console.error("Failed to delete document:", error);
      }
    }
  };

  const handleDownload = (doc) => {
    // In a real app, you'd fetch the file from the server
    if (doc.file_url) {
      const a = window.document.createElement('a');
      a.href = doc.file_url;
      a.download = doc.file_name || 'document';
      window.document.body.appendChild(a);
      a.click();
      window.document.body.removeChild(a);
    }
  };

  const handleView = (doc) => {
    // Show file inside an in-app modal viewer (iframe). Works for PDFs and many file urls.
    if (!doc || !doc.file_url) return;
    setViewerUrl(doc.file_url);
    setViewerName(doc.file_name || 'Document');
    setShowViewer(true);
    // Start a short fallback timer: if iframe doesn't load quickly (likely blocked by X-Frame-Options/CSP),
    // show a blocked notice so the user can manually open in a new tab.
    setShowBlocked(false);
    if (fallbackTimerRef.current) {
      clearTimeout(fallbackTimerRef.current);
      fallbackTimerRef.current = null;
    }
    fallbackTimerRef.current = setTimeout(() => {
      setShowBlocked(true);
      fallbackTimerRef.current = null;
    }, 1600);
  };

  // Clear any pending fallback timers on unmount or when viewer is closed
  useEffect(() => {
    return () => {
      if (fallbackTimerRef.current) {
        clearTimeout(fallbackTimerRef.current);
        fallbackTimerRef.current = null;
      }
    };
  }, []);

  // Try to fetch the file as a blob (uses tenant + auth headers) and open as blob URL.
  const openViaFetch = async (fileUrl) => {
    if (!fileUrl) throw new Error('no url');
    const headers = {};
    try {
      const tenant = (() => {
        try { return localStorage.getItem('tenantId') || import.meta.env.VITE_TENANT_ID || ''; } catch (e) { return import.meta.env.VITE_TENANT_ID || ''; }
      })();
      if (tenant) headers['x-tenant-id'] = tenant;
      const token = getAccessToken && getAccessToken();
      if (token) headers['Authorization'] = `Bearer ${token}`;
    } catch (e) {
      // ignore header construction errors
    }

    const resp = await fetch(fileUrl, { method: 'GET', headers });
    if (!resp.ok) throw new Error('fetch failed');
    const contentType = resp.headers.get('content-type') || '';
    // Only proceed for binary/pdf/image content
    const blob = await resp.blob();
    const blobUrl = URL.createObjectURL(blob);
    window.open(blobUrl, '_blank');
    // release after some time
    setTimeout(() => URL.revokeObjectURL(blobUrl), 60_000);
  };

  return (
    <div className="w-full">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold text-gray-800">Client Documents</h2>
        <div className="flex space-x-3">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            multiple
            accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png"
            className="hidden"
          />
          <Button
            label={uploading ? "Uploading..." : "Upload Documents"}
            icon={<MdFileUpload />}
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg disabled:opacity-50"
          />
        </div>
      </div>

      {/* Documents List */}
      <div className="space-y-4">
        {documents.length === 0 ? (
          <div className="text-center py-12 text-gray-500 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
            <MdFileUpload size={48} className="mx-auto mb-4 text-gray-300" />
            <p className="text-lg mb-2">No documents uploaded yet</p>
            <p className="text-sm">Click "Upload Documents" to add files</p>
          </div>
        ) : (
          documents.map((document) => (
            <div
              key={document.id || document._id}
              className="bg-white p-4 rounded-lg shadow-md border flex items-center justify-between"
            >
              <div className="flex items-center space-x-4">
                {getFileIcon(document.file_type)}
                <div>
                  <h3 className="font-medium text-gray-900">
                    {document.file_name || 'Unnamed Document'}
                  </h3>
                  <div className="text-sm text-gray-600 space-y-1">
                    <p>Type: {document.file_type || 'Unknown'}</p>
                    {document.file_size && (
                      <p>Size: {formatFileSize(document.file_size)}</p>
                    )}
                    {document.uploaded_at && (
                      <p>Uploaded: {new Date(document.uploaded_at).toLocaleDateString()}</p>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <button
                  onClick={() => handleView(document)}
                  className="text-blue-500 hover:text-blue-600 p-2"
                  title="View document"
                >
                  <IoMdEye size={20} />
                </button>
                <button
                  onClick={() => handleDownload(document)}
                  className="text-green-500 hover:text-green-600 p-2"
                  title="Download document"
                >
                  <IoMdDownload size={20} />
                </button>
                <button
                  onClick={() => handleDelete(document.id || document._id)}
                  className="text-red-500 hover:text-red-600 p-2"
                  title="Delete document"
                >
                  <IoMdTrash size={20} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* In-app viewer modal */}
      {showViewer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowViewer(false)}></div>
            <div className="relative w-11/12 h-5/6 bg-white rounded shadow-lg overflow-hidden">
              <div className="flex items-center justify-between p-3 border-b">
                <div className="font-medium">{viewerName}</div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => {
                          if (viewerUrl) {
                            // Try to open via fetch+blob first (works around some CORS/frame issues if server permits)
                            openViaFetch(viewerUrl).catch(() => {
                              try { window.open(viewerUrl, '_blank'); } catch (e) {}
                            });
                          }
                    }}
                    className="px-3 py-1 bg-gray-100 rounded hover:bg-gray-200"
                    title="Open in new tab"
                  >
                        Open in new tab
                  </button>
                  <button
                    onClick={() => {
                      setShowViewer(false);
                      setShowBlocked(false);
                      if (fallbackTimerRef.current) {
                        clearTimeout(fallbackTimerRef.current);
                        fallbackTimerRef.current = null;
                      }
                    }}
                    className="px-3 py-1 bg-gray-100 rounded hover:bg-gray-200"
                  >
                    Close
                  </button>
                </div>
              </div>
              {showBlocked && (
                <div className="p-3 bg-yellow-50 border-b border-yellow-200 text-yellow-900">
                  The browser blocked embedding this file. You can <button
                    onClick={() => { try { window.open(viewerUrl, '_blank'); } catch (e) {} }}
                    className="font-semibold underline ml-1"
                  >open it in a new tab</button>.
                </div>
              )}
              <div className="w-full h-full">
                <iframe
                  title={viewerName}
                  src={viewerUrl}
                  className="w-full h-full"
                  sandbox="allow-same-origin allow-scripts allow-popups allow-forms"
                  onLoad={() => {
                    if (fallbackTimerRef.current) {
                      clearTimeout(fallbackTimerRef.current);
                      fallbackTimerRef.current = null;
                    }
                    setShowBlocked(false);
                  }}
                  onError={() => {
                    if (fallbackTimerRef.current) {
                      clearTimeout(fallbackTimerRef.current);
                      fallbackTimerRef.current = null;
                    }
                    setShowBlocked(true);
                  }}
                />
              </div>
            </div>
        </div>
      )}

      {/* Upload Instructions */}
      <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
        <h3 className="font-medium text-blue-900 mb-2">Supported File Types</h3>
        <p className="text-sm text-blue-700">
          You can upload PDF, Word documents (.doc, .docx), Excel files (.xls, .xlsx),
          and images (.jpg, .jpeg, .png). Maximum file size: 10MB per file.
        </p>
      </div>
    </div>
  );
};

export default ClientDocuments;