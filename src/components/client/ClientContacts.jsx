import React, { useState } from "react";
import { useDispatch } from "react-redux";
import { IoMdAdd, IoMdClose, IoMdPerson } from "react-icons/io";
import { MdEdit, MdDelete, MdStar, MdStarBorder } from "react-icons/md";
import Button from '../Button'
import { addContact, updateContact, deleteContact, setPrimaryContact } from '../../redux/slices/clientSlice'

const ClientContacts = ({ client }) => {
  const dispatch = useDispatch();
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingContact, setEditingContact] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    position: "",
    department: "",
  });

  const contacts = client?.contacts || [];

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingContact) {
        await dispatch(updateContact({
          clientId: client.id,
          contactId: editingContact.id,
          contact: formData
        })).unwrap();
        setEditingContact(null);
      } else {
        await dispatch(addContact({
          clientId: client.id,
          contact: formData
        })).unwrap();
        setShowAddForm(false);
      }
      setFormData({ name: "", email: "", phone: "", position: "", department: "" });
    } catch (error) {
      console.error("Failed to save contact:", error);
    }
  };

  const handleEdit = (contact) => {
    setEditingContact(contact);
    setFormData({
      name: contact.name || "",
      email: contact.email || "",
      phone: contact.phone || "",
      position: contact.position || "",
      department: contact.department || "",
    });
  };

  const handleDelete = async (contactId) => {
    if (window.confirm("Are you sure you want to delete this contact?")) {
      try {
        await dispatch(deleteContact({
          clientId: client.id,
          contactId
        })).unwrap();
      } catch (error) {
        console.error("Failed to delete contact:", error);
      }
    }
  };

  const handleSetPrimary = async (contactId) => {
    try {
      await dispatch(setPrimaryContact({
        clientId: client.id,
        contactId
      })).unwrap();
    } catch (error) {
      console.error("Failed to set primary contact:", error);
    }
  };

  const resetForm = () => {
    setShowAddForm(false);
    setEditingContact(null);
    setFormData({ name: "", email: "", phone: "", position: "", department: "" });
  };

  return (
    <div className="w-full">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold text-gray-800">Client Contacts</h2>
        <Button
          label="Add Contact"
          icon={<IoMdAdd />}
          onClick={() => setShowAddForm(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg"
        />
      </div>

      {/* Contact Form */}
      {(showAddForm || editingContact) && (
        <div className="bg-white p-6 rounded-lg shadow-md mb-6 border">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-medium">
              {editingContact ? "Edit Contact" : "Add New Contact"}
            </h3>
            <button
              onClick={resetForm}
              className="text-gray-500 hover:text-gray-700"
            >
              <IoMdClose size={24} />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Phone
                </label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Position
                </label>
                <input
                  type="text"
                  value={formData.position}
                  onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Department
                </label>
                <input
                  type="text"
                  value={formData.department}
                  onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="flex justify-end space-x-3 pt-4">
              <Button
                label="Cancel"
                onClick={resetForm}
                className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg"
              />
              <Button
                label={editingContact ? "Update Contact" : "Add Contact"}
                type="submit"
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg"
              />
            </div>
          </form>
        </div>
      )}

      {/* Contacts List */}
      <div className="space-y-4">
        {contacts.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <IoMdPerson size={48} className="mx-auto mb-4 text-gray-300" />
            <p>No contacts added yet</p>
          </div>
        ) : (
          contacts.map((contact) => (
            <div
              key={contact.id || contact._id}
              className="bg-white p-4 rounded-lg shadow-md border flex justify-between items-center"
            >
              <div className="flex items-center space-x-4">
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                  <IoMdPerson className="text-blue-600" size={20} />
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <h3 className="font-medium text-gray-900">{contact.name}</h3>
                    {contact.isPrimary && (
                      <MdStar className="text-yellow-500" size={16} />
                    )}
                  </div>
                  <div className="text-sm text-gray-600 space-y-1">
                    {contact.email && <p>{contact.email}</p>}
                    {contact.phone && <p>{contact.phone}</p>}
                    {(contact.position || contact.department) && (
                      <p>
                        {[contact.position, contact.department].filter(Boolean).join(", ")}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                {!contact.isPrimary && (
                  <button
                    onClick={() => handleSetPrimary(contact.id || contact._id)}
                    className="text-yellow-500 hover:text-yellow-600 p-1"
                    title="Set as primary contact"
                  >
                    <MdStarBorder size={20} />
                  </button>
                )}
                <button
                  onClick={() => handleEdit(contact)}
                  className="text-blue-500 hover:text-blue-600 p-1"
                  title="Edit contact"
                >
                  <MdEdit size={20} />
                </button>
                <button
                  onClick={() => handleDelete(contact.id || contact._id)}
                  className="text-red-500 hover:text-red-600 p-1"
                  title="Delete contact"
                >
                  <MdDelete size={20} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default ClientContacts;