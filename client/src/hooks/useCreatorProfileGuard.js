import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getMyCreatorProfile } from '../api/creator';
import useAuth from './useAuth';
import toast from 'react-hot-toast';

const useCreatorProfileGuard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [checking, setChecking] = useState(true);
  const [hasProfile, setHasProfile] = useState(false);

  useEffect(() => {
    if (!user || user.role !== 'creator') {
      setChecking(false);
      return;
    }

    const check = async () => {
      try {
        await getMyCreatorProfile();
        setHasProfile(true);
      } catch {
        setHasProfile(false);
        toast.error('Please complete your profile first');
        navigate('/creator/profile');
      } finally {
        setChecking(false);
      }
    };

    check();
  }, [user]);

  return { checking, hasProfile };
};

export default useCreatorProfileGuard;
