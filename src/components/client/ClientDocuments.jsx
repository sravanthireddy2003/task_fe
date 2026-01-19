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

  const getFileIcon = (mimeType) => {
    if (!mimeType) return <FaFile className="text-gray-400" size={24} />;
    const type = mimeType.toLowerCase();
    if (type.includes('pdf')) return <FaFilePdf className="text-red-500" size={24} />;
    if (type.includes('image')) return <FaFileImage className="text-green-500" size={24} />;
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

  // ✅ FIXED: Upload to backend API
  const handleFileUpload = async (event) => {
    const files = Array.from(event.target.files);
    if (files.length === 0) return;

    setUploading(true);
    try {
      for (const file of files) {
        const formData = new FormData();
        formData.append('document', file);
        formData.append('entityType', 'CLIENT');
        formData.append('entityId', client.id);

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

        const result = await response.json();
        
        // ✅ Add new document with publicUrl (NOT blob URL)
        await dispatch(attachDocument({
          clientId: client.id,
          document: {
            id: result.data.documentId,
            file_name: result.data.fileName,
            file_type: result.data.mimeType,
            file_size: result.data.fileSize,
            file_url: result.data.publicUrl,  // ✅ Backend public URL
            uploaded_at: new Date().toISOString()
          }
        })).unwrap();
      }
    } catch (error) {
      console.error("Failed to upload document:", error);
      alert("Upload failed: " + error.message);
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  // ✅ FIXED: Use publicUrl only
  const handleDownload = async (doc) => {
    try {
      const url = doc.publicUrl || doc.file_url;
      if (!url) return;
      const token = getAccessToken();
      const resp = await fetch(url, {
        method: 'GET',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!resp.ok) throw new Error(`Failed to download (${resp.status})`);
      const blob = await resp.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = doc.file_name || doc.fileName || 'document';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      // revoke after a short delay
      setTimeout(() => window.URL.revokeObjectURL(blobUrl), 5000);
    } catch (err) {
      console.error('Download failed', err);
      alert('Download failed: ' + (err.message || err));
    }
  };

  // ✅ FIXED: Use publicUrl only
  const handleView = async (doc) => {
    try {
      const url = doc.publicUrl || doc.file_url;
      if (!url) return;
      const token = getAccessToken();
      const resp = await fetch(url, {
        method: 'GET',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!resp.ok) throw new Error(`Failed to fetch document (${resp.status})`);
      const blob = await resp.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      window.open(blobUrl, '_blank');
      // revoke after a short delay
      setTimeout(() => window.URL.revokeObjectURL(blobUrl), 5000);
    } catch (err) {
      console.error('View failed', err);
      alert('Unable to open document: ' + (err.message || err));
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
              key={document.id || document.documentId || document._id}
              className="bg-white p-4 rounded-lg shadow-md border flex items-center justify-between"
            >
              <div className="flex items-center space-x-4">
                {getFileIcon(document.file_type || document.mimeType)}
                <div>
                  <h3 className="font-medium text-gray-900">
                    {document.file_name || document.fileName || 'Unnamed Document'}
                  </h3>
                  <div className="text-sm text-gray-600 space-y-1">
                    <p>Type: {document.file_type || document.mimeType || 'Unknown'}</p>
                    {document.file_size && (
                      <p>Size: {formatFileSize(document.file_size)}</p>
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
                  onClick={() => handleDelete(document.id || document.documentId || document._id)}
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
