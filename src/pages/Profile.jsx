import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useDispatch, useSelector } from 'react-redux';
import { getProfile } from '../redux/slices/authSlice';
import Button from '../components/Button';
import Textbox from '../components/Textbox';

const Profile = () => {
  const dispatch = useDispatch();
  const user = useSelector((state) => state.auth.user);
  const { register, handleSubmit, reset } = useForm({ defaultValues: user || {} });
  const [avatarPreview, setAvatarPreview] = useState(user?.photo || null);

  const onSubmit = (data) => {
    // For now, just console.log. Hook this up to users API when ready.
    console.log('Profile update payload', data);
  };

  return (
    <div className="w-full min-h-screen p-6">
      <div className="max-w-3xl mx-auto bg-white p-6 rounded shadow">
        <h2 className="text-2xl font-bold mb-4">Profile</h2>
        <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-1 gap-4">
          <Textbox label="Name" name="name" register={register('name')} />
          <Textbox label="Email" name="email" register={register('email')} />
          <Textbox label="Phone" name="phone" register={register('phone')} />

          <div>
            <label className="block text-sm font-medium text-gray-700">Photo</label>
            <input type="file" accept="image/*" className="mt-1" onChange={(e) => { const file = e.target.files[0]; if (file) setAvatarPreview(URL.createObjectURL(file)); }} />
            {avatarPreview && <img src={avatarPreview} alt="preview" className="w-20 h-20 mt-2 rounded-full" />}
          </div>

          <div className="pt-4">
            <Button type="submit" label="Save Profile" className="bg-blue-600 text-white rounded" />
          </div>
        </form>
      </div>
    </div>
  );
};

export default Profile;
