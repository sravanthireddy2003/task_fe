import React, { useState } from "react";
import { useDispatch } from "react-redux";
import * as Icons from "../../icons";
import Button from "../Button";
import { addContact, updateContact, deleteContact, setPrimaryContact } from "../../redux/slices/clientSlice";

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
  const [errors, setErrors] = useState({});

  const validate = () => {
    const newErrors = {};
    const nameStr = formData.name?.trim() || "";
    if (!nameStr) newErrors.name = "Name is required";

    const emailStr = formData.email?.trim() || "";
    if (emailStr && !/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i.test(emailStr)) {
      newErrors.email = "Invalid email format";
    }

    const phoneStr = formData.phone?.trim() || "";
    if (phoneStr) {
      if (!/^[0-9]{10}$/.test(phoneStr)) {
        newErrors.phone = "Phone must be 10 digits";
      } else if (!/^[6-9]\d{9}$/.test(phoneStr)) {
        newErrors.phone = "Valid phone must start with 6-9";
      }
    }

    // Duplicate Validation based on current contacts array
    const contacts = client?.contacts || [];
    const currentId = editingContact?.id || editingContact?._id || editingContact?.public_id;

    if (emailStr && !newErrors.email) {
      const isDuplicateEmail = contacts.some(c =>
        c.email?.toLowerCase() === emailStr.toLowerCase() &&
        (c.id || c._id || c.public_id) !== currentId
      );
      if (isDuplicateEmail) newErrors.email = "Email already exists!";
    }

    if (phoneStr && !newErrors.phone) {
      const isDuplicatePhone = contacts.some(c =>
        c.phone?.trim() === phoneStr &&
        (c.id || c._id || c.public_id) !== currentId
      );
      if (isDuplicatePhone) newErrors.phone = "Phone number already exists!";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    let finalValue = value;
    if (name === 'phone') {
      finalValue = finalValue.replace(/\D/g, '').slice(0, 10);
    }
    setFormData((prev) => ({ ...prev, [name]: finalValue }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const contacts = client?.contacts || [];

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
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
    } catch (error) { }
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
      } catch (error) { }
    }
  };

  const handleSetPrimary = async (contactId) => {
    try {
      await dispatch(setPrimaryContact({
        clientId: client.id,
        contactId
      })).unwrap();
    } catch (error) { }
  };

  const resetForm = () => {
    setShowAddForm(false);
    setEditingContact(null);
    setFormData({ name: "", email: "", phone: "", position: "", department: "" });
    setErrors({});
  };

  return (
    <div className="w-full">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-section-title text-gray-800">Client Contacts</h2>
        <Button
          label="Add Contact"
          icon={<Icons.Plus />}
          onClick={() => setShowAddForm(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg"
        />
      </div>

      {/* Contact Form */}
      {(showAddForm || editingContact) && (
        <div className="bg-white p-6 rounded-lg shadow-md mb-6 border">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-card-title">
              {editingContact ? "Edit Contact" : "Add New Contact"}
            </h3>
            <button
              onClick={resetForm}
              className="text-gray-500 hover:text-gray-700 icon-center"
            >
              <Icons.X className="tm-icon" />
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
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
                {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
                {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Phone
                </label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
                {errors.phone && <p className="text-red-500 text-xs mt-1">{errors.phone}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Position
                </label>
                <input
                  type="text"
                  name="position"
                  value={formData.position}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Department
                </label>
                <input
                  type="text"
                  name="department"
                  value={formData.department}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-600"
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
            <Icons.User className="w-12 h-12 mx-auto mb-4 text-gray-300" />
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
                  <Icons.User className="tm-icon text-blue-600" />
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <h3 className="font-medium text-gray-900">{contact.name}</h3>
                    {contact.isPrimary && (
                      <Icons.Star className="tm-icon text-yellow-500" />
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
                    className="text-yellow-500 hover:text-yellow-600 p-1 icon-center"
                    title="Set as primary contact"
                  >
                    <Icons.StarOff className="tm-icon" />
                  </button>
                )}
                <button
                  onClick={() => handleEdit(contact)}
                  className="text-blue-500 hover:text-blue-600 p-1 icon-center"
                  title="Edit contact"
                >
                  <Icons.Edit3 className="tm-icon" />
                </button>
                <button
                  onClick={() => handleDelete(contact.id || contact._id)}
                  className="text-red-500 hover:text-red-600 p-1 icon-center"
                  title="Delete contact"
                >
                  <Icons.Trash2 className="tm-icon" />
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
