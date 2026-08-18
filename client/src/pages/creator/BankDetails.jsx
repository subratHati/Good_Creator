import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Lock, Landmark, Pencil, CheckCircle2 } from 'lucide-react';
import { getCreatorBankDetails, saveCreatorBankDetails } from '../../api/payment';
import toast from 'react-hot-toast';

const maskAccountNumber = (num) => {
  if (!num) return '';
  const str = String(num);
  if (str.length <= 4) return str;
  return '•'.repeat(str.length - 4) + str.slice(-4);
};

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
  const [isEditing, setIsEditing] = useState(false);
  const [showSaveConfirm, setShowSaveConfirm] = useState(false);

  useEffect(() => {
    const fetch = async () => {
      try {
        const res = await getCreatorBankDetails();
        if (res.data.bankDetails?.accountNumber) {
          setForm(res.data.bankDetails);
          setHasSaved(true);
          setIsEditing(false);
        } else {
          setIsEditing(true);
        }
      } catch {
        setIsEditing(true);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, []);

  // validates the form and, if everything looks good, opens the
  // confirmation modal instead of saving immediately — the actual save
  // only happens once the creator explicitly confirms in that modal
  const handleSaveClick = () => {
    if (!form.accountHolderName || !form.accountNumber || !form.ifscCode || !form.bankName) {
      return toast.error('Please fill all bank details');
    }
    setShowSaveConfirm(true);
  };

  const handleConfirmSave = async () => {
    setSaving(true);
    try {
      await saveCreatorBankDetails(form);
      toast.success('Bank details saved');
      setHasSaved(true);
      setIsEditing(false);
      setShowSaveConfirm(false);
    } catch {
      toast.error('Failed to save bank details');
      setShowSaveConfirm(false);
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

        {hasSaved && !isEditing && (
          <div>
            <div style={{ backgroundColor: 'white', border: '1.5px solid #E5E7EB', borderRadius: '20px', padding: '20px', marginBottom: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '18px' }}>
                <div style={{ width: '44px', height: '44px', borderRadius: '14px', backgroundColor: '#EFF6FF', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Landmark size={20} color="#155DFC" />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '15px', fontWeight: 800, color: '#101828' }}>{form.bankName}</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '5px', marginTop: '2px' }}>
                    <CheckCircle2 size={12} color="#16A34A" />
                    <span style={{ fontSize: '11px', fontWeight: 700, color: '#16A34A' }}>Verified for payouts</span>
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div>
                  <div style={{ fontSize: '11px', fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '3px' }}>Account Holder</div>
                  <div style={{ fontSize: '14px', fontWeight: 700, color: '#101828' }}>{form.accountHolderName}</div>
                </div>
                <div style={{ height: '1px', backgroundColor: '#F3F4F6' }} />
                <div>
                  <div style={{ fontSize: '11px', fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '3px' }}>Account Number</div>
                  <div style={{ fontSize: '14px', fontWeight: 700, color: '#101828', fontFamily: 'monospace', letterSpacing: '1px' }}>{maskAccountNumber(form.accountNumber)}</div>
                </div>
                <div style={{ height: '1px', backgroundColor: '#F3F4F6' }} />
                <div>
                  <div style={{ fontSize: '11px', fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '3px' }}>IFSC Code</div>
                  <div style={{ fontSize: '14px', fontWeight: 700, color: '#101828', letterSpacing: '1px' }}>{form.ifscCode}</div>
                </div>
              </div>
            </div>

            <button
              onClick={() => setIsEditing(true)}
              style={{ width: '100%', padding: '14px', backgroundColor: 'white', color: '#155DFC', border: '1.5px solid #DBEAFE', borderRadius: '14px', fontSize: '14px', fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
            >
              <Pencil size={15} /> Edit Bank Details
            </button>
          </div>
        )}

        {isEditing && (
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

            <div style={{ backgroundColor: '#EFF6FF', border: '1px solid #DBEAFE', borderRadius: '14px', padding: '14px 16px', display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
              <Lock size={16} color="#155DFC" style={{ flexShrink: 0, marginTop: '1px' }} />
              <p style={{ fontSize: '12px', color: '#1D4ED8', lineHeight: 1.5, margin: 0 }}>
                Your bank details are encrypted and stored securely. They are only used to transfer payments from brands directly to your account.
              </p>
            </div>

            <div style={{ display: 'flex', gap: '10px', marginTop: '8px' }}>
              {hasSaved && (
                <button
                  onClick={() => setIsEditing(false)}
                  style={{ flex: 1, padding: '16px', backgroundColor: 'white', color: '#6B7280', border: '1.5px solid #E5E7EB', borderRadius: '14px', fontSize: '15px', fontWeight: 800, cursor: 'pointer' }}
                >
                  Cancel
                </button>
              )}
              <button onClick={handleSaveClick} disabled={saving}
                style={{ flex: 1, padding: '16px', backgroundColor: saving ? '#93B4FD' : '#155DFC', color: 'white', border: 'none', borderRadius: '14px', fontSize: '15px', fontWeight: 900, cursor: saving ? 'not-allowed' : 'pointer', boxShadow: saving ? 'none' : '0 4px 0 0 #0C3EB5' }}>
                {saving ? 'Saving...' : hasSaved ? 'Update Bank Details' : 'Save Bank Details'}
              </button>
            </div>
          </div>
        )}
      </div>

      {showSaveConfirm && (
        <div
          className="fixed bg-black bg-opacity-50 flex items-end md:items-center justify-center px-0 md:px-4"
          style={{ zIndex: 99999, top: 0, left: 0, right: 0, bottom: 'calc(60px + env(safe-area-inset-bottom))' }}
          onClick={() => !saving && setShowSaveConfirm(false)}
        >
          <div
            style={{ backgroundColor: 'white', borderRadius: '24px 24px 0 0', width: '100%', maxWidth: '380px' }}
            className="md:rounded-3xl"
            onClick={e => e.stopPropagation()}
          >
            <div style={{ padding: '28px 24px calc(28px + env(safe-area-inset-bottom))', textAlign: 'center' }}>
              <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto mb-5 md:hidden" />
              <div style={{ width: '52px', height: '52px', borderRadius: '16px', backgroundColor: '#EFF6FF', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                <Landmark size={24} color="#155DFC" />
              </div>
              <h3 style={{ fontWeight: 900, fontSize: '17px', color: '#101828', marginBottom: '8px' }}>
                Save these bank details?
              </h3>
              <p style={{ fontSize: '13px', color: '#6B7280', lineHeight: 1.5, marginBottom: '24px' }}>
                Please double check that everything is correct — payments from brands will be sent to this account.
              </p>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button
                  onClick={() => setShowSaveConfirm(false)}
                  disabled={saving}
                  style={{ flex: 1, padding: '14px', backgroundColor: 'white', color: '#6B7280', border: '1.5px solid #E5E7EB', borderRadius: '14px', fontSize: '14px', fontWeight: 800, cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmSave}
                  disabled={saving}
                  style={{ flex: 1, padding: '14px', backgroundColor: saving ? '#93B4FD' : '#155DFC', color: 'white', border: 'none', borderRadius: '14px', fontSize: '14px', fontWeight: 900, cursor: saving ? 'not-allowed' : 'pointer' }}
                >
                  {saving ? 'Saving...' : 'Yes, Save'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BankDetails;
