import React, { useState, useEffect } from "react";

const UpdateClient = ({ open, setOpen, client, onUpdate }) => {
  const [clientData, setClientData] = useState(client);

  useEffect(() => {
    setClientData(client);
  }, [client]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setClientData({ ...clientData, [name]: value });
  };

  const handleSubmit = () => {
    onUpdate(clientData);
  };

  return (
    open && (
      <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
        <div className="bg-white p-6 rounded-md">
          <h2 className="text-xl mb-4">Update Client</h2>
          <input
            name="name"
            value={clientData.name}
            onChange={handleChange}
            placeholder="Client Name"
            className="border p-2 mb-2 w-full"
          />
          <input
            name="email"
            value={clientData.email}
            onChange={handleChange}
            placeholder="Client Email"
            className="border p-2 mb-2 w-full"
          />
          <input
            name="phone"
            value={clientData.phone}
            onChange={handleChange}
            placeholder="Client Phone"
            className="border p-2 mb-2 w-full"
          />
          <input
            name="company"
            value={clientData.company}
            onChange={handleChange}
            placeholder="Client Company"
            className="border p-2 mb-2 w-full"
          />
          <div className="flex justify-end">
            <button onClick={handleSubmit} className="bg-blue-600 text-white px-4 py-2 rounded-md">
              Update Client
            </button>
            <button onClick={() => setOpen(false)} className="ml-2 bg-gray-300 px-4 py-2 rounded-md">
              Cancel
            </button>
          </div>
        </div>
      </div>
    )
  );
};

export default UpdateClient;
