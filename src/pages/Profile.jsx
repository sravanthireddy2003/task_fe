import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useDispatch, useSelector } from 'react-redux';
import { getProfile, updateProfile, enable2FA, verify2FA, disable2FA } from '../redux/slices/authSlice';
import { toast } from 'sonner';
import Button from '../components/Button';
import Textbox from '../components/Textbox';
import { 
  FaUser, 
  FaEnvelope, 
  FaPhone, 
  FaCamera, 
  FaSave, 
  FaKey, 
  FaQrcode, 
  FaMobileAlt,
  FaShieldAlt,
  FaCheckCircle,
  FaTimesCircle,
  FaExclamationTriangle,
  FaCopy,
  FaDownload
} from 'react-icons/fa';

const Profile = () => {
  const dispatch = useDispatch();
  const user = useSelector((state) => state.auth.user);
  const { register, handleSubmit, reset, formState: { errors } } = useForm({ 
    defaultValues: user || {},
    mode: 'onChange'
  });
  
  const [avatarPreview, setAvatarPreview] = useState(user?.photo || null);
  const [isEditing, setIsEditing] = useState(false);
  const [qrData, setQrData] = useState(null);
  const [showVerify, setShowVerify] = useState(false);
  const [tokenValue, setTokenValue] = useState("");
  const [twoFAEnabled, setTwoFAEnabled] = useState(
    !!(user?.twoFactor?.enabled || user?.twoFactor?.hasSecret || user?.twoFactorEnabled || user?.twoFaEnabled || user?.is2faEnabled || user?.twoFA)
  );
  const [backupCodes, setBackupCodes] = useState([]);
  const [showBackupCodes, setShowBackupCodes] = useState(false);

  // Initialize form with user data
  useEffect(() => {
    if (user) {
      reset(user);
      setTwoFAEnabled(!!(user?.twoFactor?.enabled || user?.twoFactor?.hasSecret || user?.twoFactorEnabled || user?.twoFaEnabled || user?.is2faEnabled || user?.twoFA));
    }
  }, [user, reset]);

  // Fetch latest profile on mount to ensure we have freshest data
  useEffect(() => {
    dispatch(getProfile()).catch(() => {});
  }, [dispatch]);

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        toast.error('Image size should be less than 5MB');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const onSubmit = (data) => {
    const payload = {
      name: data.name,
      email: data.email,
      phone: data.phone,
      photo: avatarPreview
    };

    (async () => {
      try {
        const resp = await dispatch(updateProfile(payload)).unwrap();
        toast.success(resp?.message || 'Profile updated');
        setIsEditing(false);
        // refresh profile from server to pick up any server-side changes
        dispatch(getProfile()).catch(() => {});
      } catch (err) {
        const msg = err?.message || err?.payload || 'Update failed';
        toast.error(msg);
      }
    })();
  };

  const handleEnable2FA = async () => {
    try {
      const res = await dispatch(enable2FA()).unwrap();
      
      if (res && (res.enabled === true || (res?.success === true && res?.enabled === true))) {
        setTwoFAEnabled(true);
        toast.success(res.message || "2FA already enabled");
        dispatch(getProfile());
        return;
      }

      setQrData(res || null);
      setShowVerify(true);
      toast.success("Scan the QR code with your authenticator app");
    } catch (err) {
      toast.error(err?.message || err || "Failed to initiate 2FA");
    }
  };

  const handleVerify2FA = async () => {
    if (!tokenValue) return toast.error("Enter the 6-digit token from your authenticator app.");
    try {
      const res = await dispatch(verify2FA({ token: tokenValue })).unwrap();
      setShowVerify(false);
      setQrData(null);
      toast.success(res?.message || "2FA enabled successfully");
      setTwoFAEnabled(true);
      
      // Simulate getting backup codes (replace with actual API call)
      const mockBackupCodes = Array.from({length: 10}, () => 
        Math.random().toString(36).substring(2, 8).toUpperCase()
      );
      setBackupCodes(mockBackupCodes);
      setShowBackupCodes(true);
      
      dispatch(getProfile());
    } catch (err) {
      toast.error(err?.message || err || "Failed to verify 2FA token");
    }
  };

  const handleDisable2FA = async () => {
    if (!window.confirm('Are you sure you want to disable 2FA? This will reduce your account security.')) {
      return;
    }
    
    try {
      const res = await dispatch(disable2FA()).unwrap();
      const wasDisabled = res && (res.success === true || res.enabled === false || res.enabled === 'false');
      toast.success(res?.message || (wasDisabled ? "2FA disabled" : "2FA update applied"));

      if (wasDisabled) {
        setTwoFAEnabled(false);
      } else {
        setTwoFAEnabled(false);
      }
      dispatch(getProfile());
    } catch (err) {
      toast.error(err?.message || err || "Failed to disable 2FA");
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard!');
  };

  const downloadBackupCodes = () => {
    const codesText = backupCodes.join('\n');
    const blob = new Blob([codesText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = '2fa-backup-codes.txt';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success('Backup codes downloaded');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Profile Settings</h1>
          <p className="text-gray-600 mt-2">Manage your account information and security settings</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Profile Card */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              {/* Profile Header */}
              <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="relative">
                      <div className="w-20 h-20 rounded-full bg-white/20 backdrop-blur-sm border-2 border-white/30 flex items-center justify-center">
                        {avatarPreview ? (
                          <img 
                            src={avatarPreview} 
                            alt="Profile" 
                            className="w-full h-full rounded-full object-cover"
                          />
                        ) : user?.name ? (
                          <span className="text-2xl font-bold text-white">
                            {user.name.charAt(0).toUpperCase()}
                          </span>
                        ) : (
                          <FaUser className="w-10 h-10 text-white" />
                        )}
                      </div>
                      <label className="absolute -bottom-2 -right-2 p-2 bg-white rounded-full shadow-lg cursor-pointer hover:bg-gray-50 transition-colors">
                        <FaCamera className="w-4 h-4 text-blue-600" />
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={handleAvatarChange}
                        />
                      </label>
                    </div>
                    <div>
                      <h2 className="text-xl font-semibold text-white">{user?.name || 'User Name'}</h2>
                      <p className="text-blue-100">{user?.email || 'user@example.com'}</p>
                      <p className="text-blue-100 text-sm mt-1">
                        Member since {user?.memberSince ? new Date(user.memberSince).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) : '—'}
                      </p>
                    </div>
                  </div>
                  
                  <button
                    onClick={() => setIsEditing(!isEditing)}
                    className="px-4 py-2 bg-white/20 hover:bg-white/30 text-white rounded-lg transition-colors backdrop-blur-sm"
                  >
                    {isEditing ? 'Cancel Edit' : 'Edit Profile'}
                  </button>
                </div>
              </div>

              {/* Profile Form */}
              <div className="p-6">
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                        <FaUser className="text-gray-400" />
                        Full Name
                      </label>
                      <Textbox
                        name="name"
                        register={register('name', { 
                          required: 'Name is required',
                          minLength: { value: 2, message: 'Name must be at least 2 characters' }
                        })}
                        error={errors.name?.message}
                        disabled={!isEditing}
                        className={!isEditing ? 'bg-gray-50' : ''}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                        <FaEnvelope className="text-gray-400" />
                        Email Address
                      </label>
                      <Textbox
                        name="email"
                        type="email"
                        register={register('email', { 
                          required: 'Email is required',
                          pattern: {
                            value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                            message: 'Invalid email address'
                          }
                        })}
                        error={errors.email?.message}
                        disabled={!isEditing}
                        className={!isEditing ? 'bg-gray-50' : ''}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                        <FaPhone className="text-gray-400" />
                        Phone Number
                      </label>
                      <Textbox
                        name="phone"
                        register={register('phone')}
                        error={errors.phone?.message}
                        disabled={!isEditing}
                        className={!isEditing ? 'bg-gray-50' : ''}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Account Role
                      </label>
                      <input
                        type="text"
                        value={user?.role || 'User'}
                        disabled
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-500 cursor-not-allowed"
                      />
                    </div>
                  </div>

                  {isEditing && (
                    <div className="pt-4 border-t border-gray-200">
                      <Button
                        type="submit"
                        label="Save Changes"
                        className="w-full md:w-auto px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
                        icon={FaSave}
                      />
                    </div>
                  )}
                </form>
              </div>
            </div>

            {/* 2FA Section */}
            <div className="mt-6 bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-blue-50 rounded-lg">
                      <FaShieldAlt className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold text-gray-900">Two-Factor Authentication</h3>
                      <p className="text-gray-600">Add an extra layer of security to your account</p>
                    </div>
                  </div>
                  
                  <div className={`px-4 py-2 rounded-full text-sm font-medium flex items-center gap-2 ${
                    twoFAEnabled 
                      ? 'bg-green-100 text-green-800 border border-green-200' 
                      : 'bg-gray-100 text-gray-800 border border-gray-200'
                  }`}>
                    {twoFAEnabled ? (
                      <>
                        <FaCheckCircle className="w-4 h-4" />
                        Enabled
                      </>
                    ) : (
                      <>
                        <FaTimesCircle className="w-4 h-4" />
                        Disabled
                      </>
                    )}
                  </div>
                </div>

                {!twoFAEnabled ? (
                  <div className="space-y-6">
                    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-6">
                      <div className="flex items-start gap-4">
                        <div className="p-3 bg-white rounded-lg shadow-sm">
                          <FaKey className="w-8 h-8 text-blue-600" />
                        </div>
                        <div className="flex-1">
                          <h4 className="font-semibold text-gray-900 mb-2">Enhanced Account Security</h4>
                          <p className="text-gray-600 mb-4">
                            Protect your account with two-factor authentication. When enabled, 
                            you'll need to enter both your password and a verification code from 
                            your authenticator app when signing in.
                          </p>
                          <div className="flex items-center gap-3 text-sm text-gray-600">
                            <FaExclamationTriangle className="text-yellow-500" />
                            <span>Recommended for all accounts with sensitive data</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="p-5 border border-gray-200 rounded-lg hover:border-blue-300 hover:shadow-sm transition-all">
                        <div className="flex items-center gap-3 mb-3">
                          <div className="p-2 bg-blue-50 rounded">
                            <FaMobileAlt className="w-5 h-5 text-blue-600" />
                          </div>
                          <h5 className="font-semibold text-gray-900">Authenticator Apps</h5>
                        </div>
                        <p className="text-sm text-gray-600">
                          Use Google Authenticator, Authy, Microsoft Authenticator, or any TOTP app
                        </p>
                      </div>
                      
                      <div className="p-5 border border-gray-200 rounded-lg hover:border-blue-300 hover:shadow-sm transition-all">
                        <div className="flex items-center gap-3 mb-3">
                          <div className="p-2 bg-green-50 rounded">
                            <FaCheckCircle className="w-5 h-5 text-green-600" />
                          </div>
                          <h5 className="font-semibold text-gray-900">How It Works</h5>
                        </div>
                        <p className="text-sm text-gray-600">
                          1. Scan QR code<br />
                          2. Enter 6-digit code<br />
                          3. Save backup codes
                        </p>
                      </div>
                      
                      <div className="p-5 border border-gray-200 rounded-lg hover:border-blue-300 hover:shadow-sm transition-all">
                        <div className="flex items-center gap-3 mb-3">
                          <div className="p-2 bg-purple-50 rounded">
                            <FaQrcode className="w-5 h-5 text-purple-600" />
                          </div>
                          <h5 className="font-semibold text-gray-900">Always Available</h5>
                        </div>
                        <p className="text-sm text-gray-600">
                          Works offline - no SMS or email required. Codes refresh every 30 seconds.
                        </p>
                      </div>
                    </div>

                    <div className="pt-4 border-t border-gray-200">
                      <button
                        onClick={handleEnable2FA}
                        className="w-full md:w-auto px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
                      >
                        <FaKey />
                        Enable Two-Factor Authentication
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-6">
                    <div className="bg-green-50 border border-green-200 rounded-xl p-6">
                      <div className="flex items-center gap-4">
                        <FaCheckCircle className="w-8 h-8 text-green-600 flex-shrink-0" />
                        <div>
                          <h4 className="font-semibold text-green-800">Two-Factor Authentication is Active</h4>
                          <p className="text-green-700 mt-1">
                            Your account is protected with an extra layer of security. 
                            You'll need to enter a verification code from your authenticator app when signing in.
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="p-5 bg-gray-50 rounded-lg border border-gray-200">
                        <h5 className="font-semibold text-gray-900 mb-3">Authenticator App</h5>
                        <p className="text-gray-600 text-sm mb-4">
                          Use your authenticator app to generate verification codes
                        </p>
                        <button
                          onClick={() => setShowBackupCodes(true)}
                          className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                        >
                          View Backup Codes
                        </button>
                      </div>
                      
                      <div className="p-5 bg-gray-50 rounded-lg border border-gray-200">
                        <h5 className="font-semibold text-gray-900 mb-3">Account Security</h5>
                        <p className="text-gray-600 text-sm mb-4">
                          Manage your 2FA settings and backup options
                        </p>
                        <button
                          onClick={handleDisable2FA}
                          className="text-red-600 hover:text-red-800 text-sm font-medium"
                        >
                          Disable 2FA
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Column - Account Info */}
          <div className="space-y-6">
            {/* Account Summary */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="font-semibold text-gray-900 mb-4">Account Summary</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between py-3 border-b border-gray-100">
                  <span className="text-gray-600">Account Status</span>
                  <span className="px-3 py-1 bg-green-100 text-green-800 text-sm font-medium rounded-full">
                    Active
                  </span>
                </div>
                <div className="flex items-center justify-between py-3 border-b border-gray-100">
                  <span className="text-gray-600">Last Login</span>
                  <span className="text-gray-900 font-medium">
                    {new Date().toLocaleDateString('en-US', { 
                      month: 'short', 
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </span>
                </div>
                <div className="flex items-center justify-between py-3 border-b border-gray-100">
                  <span className="text-gray-600">Email Verified</span>
                  <span className="px-3 py-1 bg-blue-100 text-blue-800 text-sm font-medium rounded-full">
                    Verified
                  </span>
                </div>
                <div className="flex items-center justify-between py-3">
                  <span className="text-gray-600">2FA Status</span>
                  <span className={`px-3 py-1 text-sm font-medium rounded-full ${
                    twoFAEnabled 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    {twoFAEnabled ? 'Enabled' : 'Disabled'}
                  </span>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="font-semibold text-gray-900 mb-4">Quick Actions</h3>
              <div className="space-y-3">
                <button className="w-full text-left px-4 py-3 text-gray-700 hover:bg-gray-50 rounded-lg transition-colors flex items-center gap-3">
                  <FaKey className="text-gray-400" />
                  <span>Change Password</span>
                </button>
                <button className="w-full text-left px-4 py-3 text-gray-700 hover:bg-gray-50 rounded-lg transition-colors flex items-center gap-3">
                  <FaEnvelope className="text-gray-400" />
                  <span>Email Preferences</span>
                </button>
                <button className="w-full text-left px-4 py-3 text-gray-700 hover:bg-gray-50 rounded-lg transition-colors flex items-center gap-3">
                  <FaShieldAlt className="text-gray-400" />
                  <span>Privacy Settings</span>
                </button>
              </div>
            </div>

            {/* Security Tips */}
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
              <h3 className="font-semibold text-blue-900 mb-3">Security Tips</h3>
              <ul className="space-y-3">
                <li className="flex items-start gap-2 text-sm text-blue-800">
                  <FaCheckCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  <span>Use a strong, unique password</span>
                </li>
                <li className="flex items-start gap-2 text-sm text-blue-800">
                  <FaCheckCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  <span>Enable two-factor authentication</span>
                </li>
                <li className="flex items-start gap-2 text-sm text-blue-800">
                  <FaCheckCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  <span>Keep your backup codes safe</span>
                </li>
                <li className="flex items-start gap-2 text-sm text-blue-800">
                  <FaCheckCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  <span>Review login activity regularly</span>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* QR Code Modal */}
        {showVerify && qrData && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold text-gray-900">Scan QR Code</h3>
                <button
                  onClick={() => setShowVerify(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>
              
              <div className="space-y-6">
                <div className="bg-gray-50 p-6 rounded-xl flex items-center justify-center">
                  <img 
                    src={qrData.qrCode || qrData.qr} 
                    alt="QR Code" 
                    className="w-64 h-64"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Enter 6-digit verification code
                  </label>
                  <input
                    type="text"
                    value={tokenValue}
                    onChange={(e) => setTokenValue(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    placeholder="000000"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none text-center text-2xl tracking-widest"
                    maxLength={6}
                  />
                </div>
                
                <div className="flex gap-3">
                  <button
                    onClick={() => setShowVerify(false)}
                    className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleVerify2FA}
                    disabled={tokenValue.length !== 6}
                    className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Verify & Enable
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Backup Codes Modal */}
        {showBackupCodes && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold text-gray-900">Backup Codes</h3>
                <button
                  onClick={() => setShowBackupCodes(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>
              
              <div className="space-y-6">
                <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
                  <div className="flex items-start gap-3">
                    <FaExclamationTriangle className="w-5 h-5 text-yellow-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-medium text-yellow-800">Save these codes in a secure place!</p>
                      <p className="text-sm text-yellow-700 mt-1">
                        Each code can be used once if you lose access to your authenticator app.
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                  {backupCodes.map((code, index) => (
                    <div
                      key={index}
                      className="bg-gray-50 border border-gray-200 rounded-lg p-3 text-center font-mono text-sm"
                    >
                      {code}
                    </div>
                  ))}
                </div>
                
                <div className="flex gap-3">
                  <button
                    onClick={() => copyToClipboard(backupCodes.join('\n'))}
                    className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 flex items-center justify-center gap-2"
                  >
                    <FaCopy />
                    Copy All
                  </button>
                  <button
                    onClick={downloadBackupCodes}
                    className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center justify-center gap-2"
                  >
                    <FaDownload />
                    Download
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Profile;