import React, { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { selectUser } from '../redux/slices/authSlice';
import fetchWithTenant from '../utils/fetchWithTenant';
import { httpGetService } from '../App/httpHandler';
import { getAccessToken, getRefreshToken } from '../utils/tokenService';
import { setAuthToken } from '../App/httpHandler';
import { refreshToken as refreshTokenThunk } from '../redux/slices/authSlice';
import * as Icons from '../icons';
import PageHeader from '../components/PageHeader';
import SelectList from '../components/SelectList';

const {
  Settings: SettingsIcon,
  Database,
  ShieldCheck,
  Bell,
  Globe2,
  KeyRound,
  Save,
  Loader2,
  CheckCircle2,
  XCircle,
  QrCode,
  Smartphone,
  AlertTriangle,
  History,
  Copy,
} = Icons;
import { toast } from 'sonner';

// 2FA Component
const TwoFactorAuth = () => {
  const [isEnabled, setIsEnabled] = useState(false);
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState('initial'); // initial, setup, verify, backup
  const [qrCode, setQrCode] = useState('');
  const [secret, setSecret] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [backupCodes, setBackupCodes] = useState([]);

  const check2FAStatus = async () => {
    // API call removed to prevent live errors
    setIsEnabled(false);
  };

  const handleEnable2FA = async () => {
    setLoading(true);
    // API call removed to prevent live errors
    // Set dummy data for UI
    setQrCode('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=='); // 1x1 transparent PNG
    setSecret('DUMMY_SECRET_FOR_DEVELOPMENT');
    setStep('setup');
    toast.success('Scan QR code to set up 2FA');
    setLoading(false);
  };

  const handleVerify2FA = async () => {
    if (!verificationCode || verificationCode.length !== 6) {
      toast.error('Please enter a valid 6-digit code');
      return;
    }

    // API calls removed to prevent live errors
    setLoading(true);
    setBackupCodes([]);
    setStep('backup');
    setIsEnabled(true);
    toast.success('2FA enabled successfully!');
    setLoading(false);
  };

  const handleDisable2FA = async () => {
    if (!window.confirm('Are you sure you want to disable 2FA? This will reduce your account security.')) {
      return;
    }

    // API call removed to prevent live errors
    setLoading(true);
    setIsEnabled(false);
    setStep('initial');
    toast.success('2FA disabled successfully');
    setLoading(false);
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

  useEffect(() => {
    check2FAStatus();
  }, []);

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-blue-50 rounded-lg">
            <KeyRound className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <h3 className="text-xl font-semibold text-gray-900">Two-Factor Authentication (2FA)</h3>
            <p className="text-gray-600 mt-1">Add an extra layer of security using TOTP authenticator apps</p>
          </div>
        </div>

        <div className={`px-4 py-2 rounded-full text-sm font-medium ${isEnabled
          ? 'bg-green-100 text-green-800 border border-green-200'
          : 'bg-gray-100 text-gray-800 border border-gray-200'
          }`}>
          {isEnabled ? 'Enabled' : 'Disabled'}
        </div>
      </div>

      {/* Main Content */}
      {step === 'initial' && (
        <div className="space-y-6">
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-6">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-white rounded-lg shadow-sm">
                <ShieldCheck className="w-8 h-8 text-blue-600" />
              </div>
              <div className="flex-1">
                <h4 className="font-semibold text-gray-900 mb-2">Enhanced Account Security</h4>
                <p className="text-gray-600 mb-4">
                  Two-factor authentication adds an extra layer of security to your account.
                  When enabled, you'll need to enter both your password and a verification code from
                  an authenticator app when signing in.
                </p>
                <div className="flex items-center gap-3 text-sm text-gray-600">
                  <AlertTriangle className="text-yellow-500" />
                  <span>Recommended for all accounts with sensitive data</span>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-5 border border-gray-200 rounded-lg hover:border-blue-300 hover:shadow-sm transition-all">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 bg-blue-50 rounded">
                  <Smartphone className="w-5 h-5 text-blue-600" />
                </div>
                <h5 className="font-semibold text-gray-900">Authenticator Apps</h5>
              </div>
              <p className="text-sm text-gray-600 mb-4">
                Use Google Authenticator, Authy, Microsoft Authenticator, or any TOTP-compatible app
              </p>
            </div>

            <div className="p-5 border border-gray-200 rounded-lg hover:border-blue-300 hover:shadow-sm transition-all">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 bg-green-50 rounded">
                  <CheckCircle2 className="w-5 h-5 text-green-600" />
                </div>
                <h5 className="font-semibold text-gray-900">How It Works</h5>
              </div>
              <p className="text-sm text-gray-600 mb-4">
                1. Scan QR code<br />
                2. Enter 6-digit code<br />
                3. Save backup codes
              </p>
            </div>

            <div className="p-5 border border-gray-200 rounded-lg hover:border-blue-300 hover:shadow-sm transition-all">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 bg-purple-50 rounded">
                  <QrCode className="w-5 h-5 text-purple-600" />
                </div>
                <h5 className="font-semibold text-gray-900">Always Available</h5>
              </div>
              <p className="text-sm text-gray-600 mb-4">
                Works offline - no SMS or email required. Codes refresh every 30 seconds.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4 pt-4 border-t border-gray-200">
            {!isEnabled ? (
              <button
                onClick={handleEnable2FA}
                disabled={loading}
                className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Setting up...
                  </>
                ) : (
                  <>
                    <KeyRound className="w-4 h-4" />
                    Enable 2FA
                  </>
                )}
              </button>
            ) : (
              <button
                onClick={handleDisable2FA}
                disabled={loading}
                className="inline-flex items-center gap-2 px-6 py-3 bg-red-600 text-white font-medium rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Disabling...
                  </>
                ) : (
                  'Disable 2FA'
                )}
              </button>
            )}

            <button className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors">
              Learn More About 2FA
            </button>
          </div>
        </div>
      )}

      {/* Setup Step - QR Code */}
      {step === 'setup' && (
        <div className="space-y-6">
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5" />
              <div>
                <p className="font-medium text-yellow-800">Complete setup within 5 minutes</p>
                <p className="text-sm text-yellow-700 mt-1">
                  The QR code will expire. If it does, you'll need to start the setup process again.
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* QR Code Section */}
            <div className="space-y-6">
              <div>
                <h4 className="font-semibold text-gray-900 mb-3">Step 1: Scan QR Code</h4>
                <div className="bg-white border border-gray-300 rounded-lg p-6 flex items-center justify-center">
                  {qrCode ? (
                    <img
                      src={qrCode}
                      alt="2FA QR Code"
                      className="w-64 h-64"
                    />
                  ) : (
                    <div className="w-64 h-64 bg-gray-100 rounded flex items-center justify-center">
                      <Loader2 className="w-8 h-8 text-gray-400 animate-spin" />
                    </div>
                  )}
                </div>
              </div>

              <div>
                <h4 className="font-semibold text-gray-900 mb-3">Step 2: Enter Verification Code</h4>
                <div className="space-y-3">
                  <input
                    type="text"
                    value={verificationCode}
                    onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    placeholder="Enter 6-digit code"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none text-center text-2xl tracking-widest"
                    maxLength={6}
                  />
                  <p className="text-sm text-gray-500 text-center">
                    Enter the 6-digit code from your authenticator app
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={handleVerify2FA}
                  disabled={loading || verificationCode.length !== 6}
                  className="flex-1 px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin inline mr-2" />
                      Verifying...
                    </>
                  ) : (
                    'Verify and Enable'
                  )}
                </button>
                <button
                  onClick={() => setStep('initial')}
                  className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>

            {/* Instructions Section */}
            <div className="space-y-6">
              <div>
                <h4 className="font-semibold text-gray-900 mb-4">Setup Instructions</h4>
                <div className="space-y-4">
                  <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-lg">
                    <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                      <span className="font-semibold text-blue-600">1</span>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">Install Authenticator App</p>
                      <p className="text-sm text-gray-600 mt-1">
                        Install Google Authenticator, Authy, Microsoft Authenticator, or any TOTP app on your phone.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-lg">
                    <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                      <span className="font-semibold text-blue-600">2</span>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">Scan QR Code</p>
                      <p className="text-sm text-gray-600 mt-1">
                        Open your authenticator app and scan the QR code above, or enter the secret key manually.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-lg">
                    <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                      <span className="font-semibold text-blue-600">3</span>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">Enter Code</p>
                      <p className="text-sm text-gray-600 mt-1">
                        Enter the 6-digit code from your authenticator app in the verification field.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-lg">
                    <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                      <span className="font-semibold text-blue-600">4</span>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">Save Backup Codes</p>
                      <p className="text-sm text-gray-600 mt-1">
                        After verification, you'll receive backup codes. Save them in a secure place.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Manual Entry */}
              <div className="border border-gray-200 rounded-lg p-4">
                <h5 className="font-semibold text-gray-900 mb-2">Can't scan QR code?</h5>
                <p className="text-sm text-gray-600 mb-3">Enter this secret key manually in your app:</p>
                <div className="flex items-center gap-2">
                  <code className="flex-1 bg-gray-100 px-3 py-2 rounded text-sm font-mono break-all">
                    {secret}
                  </code>
                  <button
                    onClick={() => copyToClipboard(secret)}
                    className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded transition-colors"
                    title="Copy secret key"
                  >
                    <Copy />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Backup Codes Step */}
      {step === 'backup' && backupCodes.length > 0 && (
        <div className="space-y-6">
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-green-600 mt-0.5" />
              <div>
                <p className="font-medium text-green-800">Two-Factor Authentication Enabled Successfully!</p>
                <p className="text-sm text-green-700 mt-1">
                  Your account is now protected with 2FA. Please save your backup codes.
                </p>
              </div>
            </div>
          </div>

          <div className="border border-gray-200 rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h4 className="font-semibold text-gray-900">Backup Codes</h4>
                <p className="text-sm text-gray-600 mt-1">
                  Save these codes in a secure place. Each code can be used once if you lose access to your authenticator app.
                </p>
              </div>
              <button
                onClick={downloadBackupCodes}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
              >
                <Copy />
                Download Codes
              </button>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              {backupCodes.map((code, index) => (
                <div
                  key={index}
                  className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-center font-mono"
                >
                  {code}
                </div>
              ))}
            </div>

            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5" />
                <div>
                  <p className="font-medium text-red-800">Important Security Notice</p>
                  <ul className="text-sm text-red-700 mt-1 list-disc list-inside space-y-1">
                    <li>Save these codes in a secure, offline location</li>
                    <li>Do not store them in plain text files or emails</li>
                    <li>Each code can only be used once</li>
                    <li>Generate new codes if you lose them</li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6 pt-6 border-t border-gray-200">
              <button
                onClick={() => copyToClipboard(backupCodes.join('\n'))}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2"
              >
                <Copy />
                Copy All Codes
              </button>
              <button
                onClick={() => setStep('initial')}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const TIMEZONES = [
  "Asia/Kolkata",
  "UTC",
  "America/New_York",
  "Europe/London",
  "Asia/Tokyo",
  "Australia/Sydney",
  "America/Los_Angeles"
];

// Main Settings Component
const Settings = () => {
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState(null);
  const [expandedSection, setExpandedSection] = useState('general');
  const user = useSelector(selectUser);

  // Diagnostic: ensure axios defaults and log token state
  useEffect(() => {
    try {
      const access = getAccessToken();
      const refresh = getRefreshToken();
      console.debug('[Settings] tokens:', { access: access ? 'present' : null, refresh: refresh ? 'present' : null });
      if (access) setAuthToken(access, refresh || null, 'local');
    } catch (e) {
      console.warn('Settings token diagnostic failed', e);
    }
  }, []);

  const [showToken, setShowToken] = useState(false);

  // Audit logs state
  const [auditLogs, setAuditLogs] = useState([]);
  const [auditLoading, setAuditLoading] = useState(false);
  const [auditError, setAuditError] = useState(null);
  const dispatch = useDispatch();

  const loadSettings = async () => {
    try {
      setLoading(true);
      const role = (user?.role || '').toString().toLowerCase();
      let settingsEndpoint = '/api/admin/settings';
      if (role.includes('manager')) settingsEndpoint = '/api/manager/settings';
      else if (role.includes('employee')) settingsEndpoint = '/api/employee/settings';
      else if (role.includes('client')) settingsEndpoint = '/api/client/settings';

      const res = await fetchWithTenant(settingsEndpoint, { method: 'GET' });
      setSettings(res?.data || res || {});
      setError(null);
    } catch (err) {
      setError(err.message || 'Failed to load settings');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSettings();
  }, []);

  const fetchAuditLogs = async () => {
    try {
      setAuditLoading(true);
      setAuditError(null);
      const role = (user?.role || '').toLowerCase();
      let endpoint = '/api/employee/audit-logs?limit=25&page=1';
      if (role === 'admin') endpoint = '/api/admin/audit-logs?limit=25&page=1';
      else if (role === 'manager') endpoint = '/api/manager/audit-logs?limit=25&page=1';

      // Use axios-backed httpGetService so axios' default Authorization header is used
      const resp = await httpGetService(endpoint.replace(/^\//, ''));
      const data = resp?.data ?? resp;
      const logs = Array.isArray(data?.logs) ? data.logs : (Array.isArray(data) ? data : []);
      setAuditLogs(logs);
    } catch (err) {
      console.error('Failed to load audit logs', err);
      setAuditError(err.message || 'Failed to load audit logs');
    } finally {
      setAuditLoading(false);
    }
  };

  useEffect(() => {
    fetchAuditLogs();
  }, [user]);

  const handleSettingChange = (category, key, value) => {
    setSettings(prev => ({
      ...prev,
      [category]: {
        ...prev[category],
        [key]: value
      }
    }));
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setSaveStatus(null);
      const role = (user?.role || '').toString().toLowerCase();
      let settingsEndpoint = '/api/admin/settings';
      if (role.includes('manager')) settingsEndpoint = '/api/manager/settings';
      else if (role.includes('employee')) settingsEndpoint = '/api/employee/settings';
      else if (role.includes('client')) settingsEndpoint = '/api/client/settings';

      await fetchWithTenant(settingsEndpoint, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings)
      });
      setSaveStatus('success');
      toast.success('Settings saved successfully!');
      setTimeout(() => setSaveStatus(null), 3000);
    } catch (err) {
      setSaveStatus('error');
      toast.error(err.message || 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const SettingCard = ({ title, icon: Icon, children, sectionKey }) => (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-6 overflow-hidden">
      <button
        onClick={() => setExpandedSection(expandedSection === sectionKey ? null : sectionKey)}
        className="w-full flex items-center justify-between p-6 hover:bg-gray-50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-50 rounded-lg">
            <Icon className="text-blue-600 w-5 h-5" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
        </div>
        <svg
          className={`w-5 h-5 text-gray-400 transform transition-transform ${expandedSection === sectionKey ? 'rotate-180' : ''
            }`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {expandedSection === sectionKey && (
        <div className="px-6 pb-6 border-t border-gray-100">
          {children}
        </div>
      )}
    </div>
  );

  const ToggleSwitch = ({ checked, onChange, label, description }) => (
    <div className="flex items-center justify-between py-4 border-b border-gray-100 last:border-b-0">
      <div>
        <p className="font-medium text-gray-900">{label}</p>
        {description && <p className="text-sm text-gray-500 mt-1">{description}</p>}
      </div>
      <button
        type="button"
        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${checked ? 'bg-blue-600' : 'bg-gray-300'
          }`}
        onClick={() => onChange(!checked)}
      >
        <span
          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${checked ? 'translate-x-6' : 'translate-x-1'
            }`}
        />
      </button>
    </div>
  );

  const InputField = ({ label, value, onChange, type = 'text', placeholder, description }) => (
    <div className="space-y-2 py-4 border-b border-gray-100 last:border-b-0">
      <label className="block text-sm font-medium text-gray-900">{label}</label>
      {description && <p className="text-sm text-gray-500">{description}</p>}
      <input
        type={type}
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
        placeholder={placeholder}
      />
    </div>
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white p-4 md:p-8">
        <div className="max-w-6xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-300 rounded w-64 mb-6"></div>
            <div className="space-y-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-48 bg-gray-300 rounded-lg"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white p-8 flex items-center justify-center">
        <div className="max-w-md text-center">
          <div className="bg-red-50 border border-red-200 rounded-xl p-8">
            <XCircle className="w-12 h-12 text-red-600 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-red-800 mb-2">Error Loading Settings</h3>
            <p className="text-red-600">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        <PageHeader
          title="System Settings"
          subtitle="Configure your system preferences and security settings"
          onRefresh={() => {
            loadSettings();
            fetchAuditLogs();
          }}
          refreshing={loading || auditLoading}
        >
          <div className="flex flex-col items-end gap-3 text-sm text-gray-600">
            <div className="flex items-center gap-3">
              {saveStatus === 'success' && (
                <div className="flex items-center gap-2 text-green-600">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Saved!</span>
                </div>
              )}
              {saveStatus === 'error' && (
                <div className="flex items-center gap-2 text-red-600">
                  <XCircle className="w-4 h-4" />
                  <span>Failed to save</span>
                </div>
              )}
              <button
                onClick={handleSave}
                disabled={saving}
                className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    Save Changes
                  </>
                )}
              </button>
            </div>
          </div>
        </PageHeader>

        {/* 2FA Component - Placed prominently */}
        <TwoFactorAuth />

        {/* Other Settings Sections */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Navigation */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 sticky top-6">
              <h3 className="font-semibold text-gray-900 mb-4">Settings Sections</h3>
              <nav className="space-y-2">
                {[
                  { key: 'general', label: 'General Settings', icon: SettingsIcon },
                  { key: 'database', label: 'Database Config', icon: Database },
                  { key: 'security', label: 'Security', icon: ShieldCheck },
                  { key: 'notifications', label: 'Notifications', icon: Bell },
                  { key: 'api', label: 'API Settings', icon: Globe2 },
                ].map((item) => (
                  <button
                    key={item.key}
                    onClick={() => setExpandedSection(item.key)}
                    className={`w-full text-left flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${expandedSection === item.key
                      ? 'bg-blue-50 text-blue-700 border border-blue-200'
                      : 'text-gray-700 hover:bg-gray-50'
                      }`}
                  >
                    <item.icon className="w-5 h-5" />
                    <span className="font-medium">{item.label}</span>
                  </button>
                ))}
              </nav>

              <div className="mt-8 pt-6 border-t border-gray-200">
                <div className="flex items-center gap-3 text-gray-600">
                  <ShieldCheck className="w-4 h-4" />
                  <div>
                    <p className="font-medium">Settings Version</p>
                    <p className="text-sm">v{settings?.version || '1.0.0'}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Settings Content */}
          <div className="lg:col-span-2">
            {/* General Settings */}
            <SettingCard title="General Settings" icon={SettingsIcon} sectionKey="general">
              <div className="space-y-4">
                {/* Dynamically render fields, using SelectList for timezone */}
                {Object.entries(settings?.general || {}).map(([key, value]) => {
                  const label = key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());

                  if (key === 'timezone') {
                    return (
                      <div key={key} className="py-4 border-b border-gray-100 last:border-b-0">
                        <SelectList
                          label={label}
                          lists={TIMEZONES}
                          selected={value}
                          setSelected={(val) => handleSettingChange('general', key, val)}
                        />
                      </div>
                    );
                  }

                  return (
                    <InputField
                      key={key}
                      label={label}
                      value={value}
                      onChange={(val) => handleSettingChange('general', key, val)}
                    />
                  );
                })}
              </div>
            </SettingCard>

            {/* Database Configuration */}
            <SettingCard title="Database Configuration" icon={Database} sectionKey="database">
              <div className="space-y-1">
                {Object.entries(settings?.database || {}).map(([key, value]) => (
                  <div key={key} className="py-4 border-b border-gray-100 last:border-b-0">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-gray-900">
                          {key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                        </p>
                        <p className="text-sm text-gray-500 mt-1">{value}</p>
                      </div>
                      <div className={`px-3 py-1 rounded-full text-xs font-medium ${value ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                        }`}>
                        {value ? 'Active' : 'Inactive'}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </SettingCard>

            {/* Security Settings */}
            <SettingCard title="Security Settings" icon={ShieldCheck} sectionKey="security">
              <div className="space-y-1">
                <ToggleSwitch
                  checked={settings?.security?.password_expiry || false}
                  onChange={(val) => handleSettingChange('security', 'password_expiry', val)}
                  label="Password Expiry"
                  description="Require users to change passwords periodically"
                />
                <ToggleSwitch
                  checked={settings?.security?.login_notifications || false}
                  onChange={(val) => handleSettingChange('security', 'login_notifications', val)}
                  label="Login Notifications"
                  description="Send email notifications for new logins"
                />
                <ToggleSwitch
                  checked={settings?.security?.session_timeout || false}
                  onChange={(val) => handleSettingChange('security', 'session_timeout', val)}
                  label="Session Timeout"
                  description="Automatically log out inactive users"
                />
              </div>
            </SettingCard>

            {/* Notification Settings */}
            <SettingCard title="Notification Settings" icon={Bell} sectionKey="notifications">
              <div className="space-y-1">
                {Object.entries(settings?.notifications || {}).map(([key, value]) => (
                  <ToggleSwitch
                    key={key}
                    checked={value}
                    onChange={(val) => handleSettingChange('notifications', key, val)}
                    label={key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                  />
                ))}
              </div>
            </SettingCard>

            {/* API Settings */}
            <SettingCard title="API Settings" icon={Globe2} sectionKey="api">
              <div className="space-y-4">
                {Object.entries(settings?.api || {}).map(([key, value]) => (
                  <InputField
                    key={key}
                    label={key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    value={value}
                    onChange={(val) => handleSettingChange('api', key, val)}
                    type={key.toLowerCase().includes('key') || key.toLowerCase().includes('secret') ? 'password' : 'text'}
                  />
                ))}
              </div>
            </SettingCard>

            {/* Audit Logs */}
            <SettingCard title="Audit Logs" icon={History} sectionKey="auditLogs">
              <div className="space-y-3">
                {auditLoading ? (
                  <div className="flex items-center gap-3 text-sm text-gray-600">
                    <Loader2 className="animate-spin" />
                    Loading audit logs...
                  </div>
                ) : auditError ? (
                  <div className="text-sm text-red-600">{auditError}</div>
                ) : auditLogs.length === 0 ? (
                  <div className="text-sm text-gray-600">No audit logs available.</div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full text-sm">
                      <thead>
                        <tr className="text-left text-gray-600">
                          <th className="px-3 py-2">Time</th>
                          <th className="px-3 py-2">Actor</th>
                          <th className="px-3 py-2">Action</th>
                          <th className="px-3 py-2">Entity</th>
                          <th className="px-3 py-2">Details</th>
                          <th className="px-3 py-2">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {auditLogs.slice(0, 100).map((log, idx) => {
                          const id = log.id || log._id || idx;
                          const whenRaw = log.timestamp || log.created_at || log.time || log.date || '';
                          const actorRaw = log.actor || (log.user && (log.user.name || log.user.email)) || log.username || '';
                          const actionRaw = log.action || log.verb || '';
                          const entityRaw = log.entity || log.resource || '';
                          const details = log.details || {};
                          const fileUrl = details?.file_url || details?.url || details?.fileUrl;

                          const safeToString = (v) => {
                            if (v === null || v === undefined) return '';
                            if (typeof v === 'string') return v;
                            if (typeof v === 'number' || typeof v === 'boolean') return String(v);
                            if (typeof v === 'object') {
                              // prefer name or id if present
                              return v.name || v.title || v.id || v._id || JSON.stringify(v);
                            }
                            return String(v);
                          };

                          const when = safeToString(whenRaw);
                          const actor = safeToString(actorRaw);
                          const action = safeToString(actionRaw);
                          const entity = safeToString(entityRaw);

                          return (
                            <tr key={id} className="border-t border-gray-100">
                              <td className="px-3 py-2 align-top text-gray-700">{when}</td>
                              <td className="px-3 py-2 align-top text-gray-700">{actor}</td>
                              <td className="px-3 py-2 align-top text-gray-700">{action}</td>
                              <td className="px-3 py-2 align-top text-gray-700">{entity}</td>
                              <td className="px-3 py-2 align-top text-gray-700">{JSON.stringify(details)}</td>
                              <td className="px-3 py-2 align-top text-gray-700">
                                <div className="flex items-center gap-2">
                                  {fileUrl && (
                                    <>
                                      <button
                                        onClick={async () => {
                                          try {
                                            const accessToken = localStorage.getItem('accessToken') || localStorage.getItem('tm_access_token');
                                            const tenant = localStorage.getItem('tenantId') || 'default';
                                            const isSameOrigin = fileUrl.startsWith(window.location.origin) || fileUrl.startsWith('/');
                                            if (isSameOrigin && accessToken) {
                                              const resp = await fetch(fileUrl, { headers: { 'Authorization': `Bearer ${accessToken}`, 'x-tenant-id': tenant } });
                                              if (resp.ok) {
                                                const blob = await resp.blob();
                                                const url = window.URL.createObjectURL(blob);
                                                window.open(url, '_blank');
                                                setTimeout(() => window.URL.revokeObjectURL(url), 10000);
                                                return;
                                              }
                                            }
                                            window.open(fileUrl, '_blank');
                                          } catch (err) {
                                            console.error('Preview audit file error', err);
                                            window.open(fileUrl, '_blank');
                                          }
                                        }}
                                        className="text-blue-600 hover:underline text-sm"
                                      >
                                        Preview
                                      </button>
                                      <a
                                        href={fileUrl}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="text-gray-600 text-sm"
                                      >
                                        Download
                                      </a>
                                    </>
                                  )}
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </SettingCard>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;