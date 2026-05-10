import { useEffect, useState } from 'react';
import { getCreatorBankDetails, saveCreatorBankDetails } from '../api/payment'
import toast from 'react-hot-toast';

const BankDetailsForm = () => {
  const [form, setForm] = useState({
    accountHolderName: '',
    accountNumber: '',
    ifscCode: '',
    bankName: '',
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    const fetch = async () => {
      try {
        const res = await getCreatorBankDetails();
        if (res.data.bankDetails) {
          setForm(res.data.bankDetails);
          setShowForm(true);
        }
      } catch {}
      finally { setLoading(false); }
    };
    fetch();
  }, []);

  const handleSave = async () => {
    if (!form.accountHolderName || !form.accountNumber || !form.ifscCode || !form.bankName) {
      return toast.error('Please fill all bank details');
    }
    setSaving(true);
    try {
      await saveCreatorBankDetails(form);
      toast.success('Bank details saved');
    } catch {
      toast.error('Failed to save bank details');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return null;

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="font-semibold text-gray-900">Bank Details</h2>
          <p className="text-xs text-gray-500 mt-0.5">Required to receive payments from brands</p>
        </div>
        {!showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="px-4 py-2 bg-blue-600 text-white text-xs font-semibold rounded-xl hover:bg-blue-700 transition-colors"
          >
            Add bank details
          </button>
        )}
      </div>

      {showForm && (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Account holder name</label>
            <input
              type="text"
              value={form.accountHolderName}
              onChange={e => setForm({ ...form, accountHolderName: e.target.value })}
              placeholder="As per bank records"
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Bank name</label>
            <input
              type="text"
              value={form.bankName}
              onChange={e => setForm({ ...form, bankName: e.target.value })}
              placeholder="e.g. State Bank of India"
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Account number</label>
            <input
              type="text"
              value={form.accountNumber}
              onChange={e => setForm({ ...form, accountNumber: e.target.value })}
              placeholder="Enter account number"
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">IFSC code</label>
            <input
              type="text"
              value={form.ifscCode}
              onChange={e => setForm({ ...form, ifscCode: e.target.value.toUpperCase() })}
              placeholder="e.g. SBIN0001234"
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            />
          </div>

          <div className="bg-amber-50 border border-amber-200 rounded-xl p-3">
            <p className="text-xs text-amber-700">
              🔒 Your bank details are encrypted and stored securely. They are only used to transfer payments from brands.
            </p>
          </div>

          <button
            onClick={handleSave}
            disabled={saving}
            className="w-full py-3 bg-gray-900 text-white rounded-xl text-sm font-semibold hover:bg-gray-800 transition-colors disabled:opacity-60"
          >
            {saving ? 'Saving...' : 'Save bank details'}
          </button>
        </div>
      )}
    </div>
  );
};

export default BankDetailsForm;
