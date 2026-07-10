import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Lock } from 'lucide-react';
import { getCreatorBankDetails, saveCreatorBankDetails } from '../../api/payment';
import toast from 'react-hot-toast';

const BankDetails = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    accountHolderName: '',
    accountNumber: '',
    ifscCode: '',
    bankName: '',
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [hasSaved, setHasSaved] = useState(false);

  useEffect(() => {
    const fetch = async () => {
      try {
        const res = await getCreatorBankDetails();
        if (res.data.bankDetails) {
          setForm(res.data.bankDetails);
          setHasSaved(true);
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
      setHasSaved(true);
    } catch {
      toast.error('Failed to save bank details');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div style={{ minHeight: '100dvh', backgroundColor: '#F8FAFC', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className="w-10 h-10 rounded-full animate-spin" style={{ border: '3px solid #F0F0F0', borderTopColor: '#155DFC' }} />
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100dvh', backgroundColor: '#F8FAFC' }}>

      {/* header */}
      <div style={{ backgroundColor: 'white', borderBottom: '1px solid #E5E7EB', padding: '14px 20px', display: 'flex', alignItems: 'center', gap: '12px', position: 'sticky', top: 0, zIndex: 10 }}>
        <button onClick={() => navigate(-1)}
          style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '4px' }}>
          <ArrowLeft size={22} color="#101828" />
        </button>
        <div>
          <div style={{ fontWeight: 900, fontSize: '16px', color: '#101828' }}>Bank Details</div>
          <div style={{ fontSize: '12px', color: '#9CA3AF' }}>Required to receive payments from brands</div>
        </div>
      </div>

      <div style={{ maxWidth: '480px', margin: '0 auto', padding: '24px 20px 100px' }}>

        {/* saved badge */}
        {hasSaved && (
          <div style={{ backgroundColor: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: '14px', padding: '12px 16px', display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '24px' }}>
            <span style={{ fontSize: '18px' }}>✅</span>
            <div>
              <div style={{ fontSize: '13px', fontWeight: 700, color: '#166534' }}>Bank details saved</div>
              <div style={{ fontSize: '12px', color: '#16A34A' }}>You can update them anytime below</div>
            </div>
          </div>
        )}

        {/* form */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>

          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#374151', marginBottom: '8px' }}>
              Account Holder Name
            </label>
            <input type="text" value={form.accountHolderName}
              onChange={e => setForm({ ...form, accountHolderName: e.target.value })}
              placeholder="As per bank records"
              style={{ width: '100%', padding: '14px 16px', borderRadius: '14px', border: '1.5px solid #E5E7EB', fontSize: '15px', outline: 'none', backgroundColor: '#F9FAFB', boxSizing: 'border-box' }}
              onFocus={e => e.target.style.borderColor = '#155DFC'}
              onBlur={e => e.target.style.borderColor = '#E5E7EB'} />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#374151', marginBottom: '8px' }}>
              Bank Name
            </label>
            <input type="text" value={form.bankName}
              onChange={e => setForm({ ...form, bankName: e.target.value })}
              placeholder="e.g. State Bank of India"
              style={{ width: '100%', padding: '14px 16px', borderRadius: '14px', border: '1.5px solid #E5E7EB', fontSize: '15px', outline: 'none', backgroundColor: '#F9FAFB', boxSizing: 'border-box' }}
              onFocus={e => e.target.style.borderColor = '#155DFC'}
              onBlur={e => e.target.style.borderColor = '#E5E7EB'} />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#374151', marginBottom: '8px' }}>
              Account Number
            </label>
            <input type="text" value={form.accountNumber}
              onChange={e => setForm({ ...form, accountNumber: e.target.value })}
              placeholder="Enter account number"
              style={{ width: '100%', padding: '14px 16px', borderRadius: '14px', border: '1.5px solid #E5E7EB', fontSize: '15px', outline: 'none', backgroundColor: '#F9FAFB', boxSizing: 'border-box' }}
              onFocus={e => e.target.style.borderColor = '#155DFC'}
              onBlur={e => e.target.style.borderColor = '#E5E7EB'} />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#374151', marginBottom: '8px' }}>
              IFSC Code
            </label>
            <input type="text" value={form.ifscCode}
              onChange={e => setForm({ ...form, ifscCode: e.target.value.toUpperCase() })}
              placeholder="e.g. SBIN0001234"
              style={{ width: '100%', padding: '14px 16px', borderRadius: '14px', border: '1.5px solid #E5E7EB', fontSize: '15px', outline: 'none', backgroundColor: '#F9FAFB', boxSizing: 'border-box', letterSpacing: '1px' }}
              onFocus={e => e.target.style.borderColor = '#155DFC'}
              onBlur={e => e.target.style.borderColor = '#E5E7EB'} />
          </div>

          {/* security note */}
          <div style={{ backgroundColor: '#EFF6FF', border: '1px solid #DBEAFE', borderRadius: '14px', padding: '14px 16px', display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
            <Lock size={16} color="#155DFC" style={{ flexShrink: 0, marginTop: '1px' }} />
            <p style={{ fontSize: '12px', color: '#1D4ED8', lineHeight: 1.5, margin: 0 }}>
              Your bank details are encrypted and stored securely. They are only used to transfer payments from brands directly to your account.
            </p>
          </div>

          {/* save button */}
          <button onClick={handleSave} disabled={saving}
            style={{ width: '100%', padding: '16px', backgroundColor: saving ? '#93B4FD' : '#155DFC', color: 'white', border: 'none', borderRadius: '14px', fontSize: '15px', fontWeight: 900, cursor: saving ? 'not-allowed' : 'pointer', boxShadow: saving ? 'none' : '0 4px 0 0 #0C3EB5', marginTop: '8px' }}>
            {saving ? 'Saving...' : hasSaved ? 'Update Bank Details' : 'Save Bank Details'}
          </button>

        </div>
      </div>
    </div>
  );
};

export default BankDetails;
