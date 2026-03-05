import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getAccessToken } from "../../utils/tokenService";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "sonner";
import * as Icons from "../../icons";
import Button from "../Button";
import { attachDocument, deleteDocument, getClient } from "../../redux/slices/clientSlice";
import { resolveFileUrl, formatFileSize as formatFileSizeHelper } from "../../utils/fileHelpers";

const ClientDocuments = ({ client }) => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const fileInputRef = useRef(null);
  const [uploading, setUploading] = useState(false);

  const documents = client?.documents || [];

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

  // ✅ FIXED: Upload to backend API
  const handleFileUpload = async (event) => {
    const files = Array.from(event.target.files);
    if (files.length === 0) return;

    setUploading(true);
    try {
      for (const file of files) {
        // Pass raw file to thunk to avoid FormData serialization issues
        await dispatch(attachDocument({
          clientId: client.id,
          file: file
        })).unwrap();
      }

      toast.success('Documents uploaded successfully');

      // ✅ Refresh client data after all uploads
      if (client?.id) {
        await dispatch(getClient(client.id)).unwrap();
      }
    } catch (error) {
      toast.error("Upload failed: " + (error.message || "Unknown error"));
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  // ✅ FIXED: Use direct file URL only
  const handleDownload = async (doc) => {
    try {
      const rawUrl = doc.file_url || doc.publicUrl;
      if (!rawUrl) {
        alert('No file URL available');
        return;
      }
      const url = resolveFileUrl(rawUrl);
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
      setTimeout(() => window.URL.revokeObjectURL(blobUrl), 5000);
    } catch (err) {
      alert('Download failed: ' + (err.message || err));
    }
  };

  // ✅ FIXED: Use direct file URL only
  const handleView = async (doc) => {
    try {
      const rawUrl = doc.file_url || doc.publicUrl;
      if (!rawUrl) {
        alert('No file URL available');
        return;
      }
      const url = resolveFileUrl(rawUrl);
      const token = getAccessToken();
      const resp = await fetch(url, {
        method: 'GET',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!resp.ok) throw new Error(`Failed to fetch document (${resp.status})`);
      const blob = await resp.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      window.open(blobUrl, '_blank');
      setTimeout(() => window.URL.revokeObjectURL(blobUrl), 5000);
    } catch (err) {
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
      } catch (error) {}
    }
  };

  // RBAC Access Checks: Employees cannot upload or delete client documents
  const user = useSelector(state => state.auth.user);
  const userRole = user?.role?.toLowerCase() || 'employee';
  const canModify = userRole === 'admin' || userRole === 'manager';

  return (
    <div className="w-full">
      <div className="flex items-center gap-4 mb-6">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-100 text-gray-700 font-medium transition"
          title="Go back to previous page"
        >
          <Icons.ChevronLeft className="tm-icon" />
          Back
        </button>
        <div className="flex-1">
          <h2 className="text-xl font-semibold text-gray-800">Client Documents</h2>
        </div>

        {/* Only show upload button for Admin/Manager */}
        {canModify && (
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
              icon={<Icons.UploadCloud />}
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg disabled:opacity-50"
            />
          </div>
        )}
      </div>

      {/* Documents List */}
      <div className="space-y-4">
        {documents.length === 0 ? (
          <div className="text-center py-12 text-gray-500 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
            <Icons.UploadCloud className="tm-icon mx-auto mb-4 text-gray-300" />
            <p className="text-lg mb-2">No documents uploaded yet</p>
            {canModify && <p className="text-sm">Click "Upload Documents" to add files</p>}
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
                  className="text-blue-500 hover:text-blue-600 p-2 icon-center"
                  title="View document"
                >
                  <Icons.Eye className="tm-icon" />
                </button>
                <button
                  onClick={() => handleDownload(document)}
                  className="text-green-500 hover:text-green-600 p-2 icon-center"
                  title="Download document"
                >
                  <Icons.Download className="tm-icon" />
                </button>
                {/* Only show delete button for Admin/Manager */}
                {canModify && (
                  <button
                    onClick={() => handleDelete(document.id || document.documentId || document._id)}
                    className="text-red-500 hover:text-red-600 p-2 icon-center"
                    title="Delete document"
                  >
                    <Icons.Trash2 className="tm-icon" />
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Upload Instructions */}
      {canModify && (
        <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
          <h3 className="font-medium text-blue-900 mb-2">Supported File Types</h3>
          <p className="text-sm text-blue-700">
            You can upload PDF, Word documents (.doc, .docx), Excel files (.xls, .xlsx),
            and images (.jpg, .jpeg, .png). Maximum file size: 10MB per file.
          </p>
        </div>
      )}
    </div>
  );
};

export default ClientDocuments;
