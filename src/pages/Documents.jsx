import React, { useState } from 'react';

const Documents = () => {
  const [docs, setDocs] = useState([
    { id: 'doc1', filename: 'Project_Plan.pdf', uploadedBy: 'Alice Johnson', uploadedAt: '2025-12-01', url: '/files/Project_Plan.pdf' },
    { id: 'doc2', filename: 'Design_Mockup.png', uploadedBy: 'Bob Smith', uploadedAt: '2025-12-03', url: '/files/Design_Mockup.png' },
    { id: 'doc3', filename: 'Requirements.docx', uploadedBy: 'Charlie Lee', uploadedAt: '2025-12-05', url: '/files/Requirements.docx' },
    { id: 'doc4', filename: 'Budget.xlsx', uploadedBy: 'Dana White', uploadedAt: '2025-12-07', url: '/files/Budget.xlsx' },
  ]);

  const [showModal, setShowModal] = useState(false);
  const [newDoc, setNewDoc] = useState({ filename: '', uploadedBy: '', file: null });

  const handleView = (doc) => {
    if (doc.file) {
      const fileURL = URL.createObjectURL(doc.file);
      window.open(fileURL, '_blank');
    } else {
      window.open(doc.url, '_blank');
    }
  };

  const handleAddDocument = () => {
    if (!newDoc.filename || !newDoc.uploadedBy || !newDoc.file) return;
    const doc = {
      id: `doc${docs.length + 1}`,
      filename: newDoc.filename,
      uploadedBy: newDoc.uploadedBy,
      uploadedAt: new Date().toISOString().split('T')[0],
      file: newDoc.file, // Store the file object for viewing
      url: URL.createObjectURL(newDoc.file),
    };
    setDocs([doc, ...docs]);
    setNewDoc({ filename: '', uploadedBy: '', file: null });
    setShowModal(false);
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-3xl font-bold text-gray-800">Documents & Files</h2>
        <button
          onClick={() => setShowModal(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg shadow hover:bg-blue-700 transition flex items-center gap-2"
        >
          + Add Document
        </button>
      </div>

      {docs.length === 0 ? (
        <div className="text-gray-500 text-lg">No documents found.</div>
      ) : (
        <div className="overflow-x-auto rounded-xl shadow border bg-white">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">ID</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Filename</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Uploaded By</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Uploaded At</th>
                <th className="px-6 py-4 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {docs.map((d) => (
                <tr key={d.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-3 text-sm font-medium text-gray-700">{d.id}</td>
                  <td className="px-6 py-3 text-sm text-gray-800 font-semibold">{d.filename}</td>
                  <td className="px-6 py-3 text-sm text-gray-700">{d.uploadedBy}</td>
                  <td className="px-6 py-3 text-sm text-gray-500">{d.uploadedAt}</td>
                  <td className="px-6 py-3 text-sm text-center flex justify-center gap-2">
                    <button
                      onClick={() => handleView(d)}
                      className="px-4 py-1 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition shadow"
                    >
                      View
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ---------- ADD DOCUMENT MODAL ---------- */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex justify-center items-center z-50">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-md p-6">
            <h3 className="text-xl font-semibold mb-4">Add New Document</h3>
            <div className="space-y-4">
              <input
                type="text"
                placeholder="Filename"
                className="w-full px-4 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={newDoc.filename}
                onChange={(e) => setNewDoc({ ...newDoc, filename: e.target.value })}
              />
              <input
                type="text"
                placeholder="Uploaded By"
                className="w-full px-4 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={newDoc.uploadedBy}
                onChange={(e) => setNewDoc({ ...newDoc, uploadedBy: e.target.value })}
              />
              <input
                type="file"
                className="w-full px-4 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                onChange={(e) => setNewDoc({ ...newDoc, file: e.target.files[0], filename: e.target.files[0]?.name })}
              />
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleAddDocument}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
              >
                Add Document
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Documents;
