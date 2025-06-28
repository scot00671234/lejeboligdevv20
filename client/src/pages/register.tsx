import { useEffect } from 'react';
import { useLocation } from 'wouter';
import { useAuth } from '@/hooks/use-auth';
import AuthModal from '@/components/auth-modal';

export default function Register() {
  const [, setLocation] = useLocation();
  const { isAuthenticated, user } = useAuth();

  useEffect(() => {
    if (isAuthenticated && user) {
      // Redirect based on user role
      if (user.role === 'landlord') {
        setLocation('/dashboard');
      } else if (user.role === 'tenant') {
        setLocation('/properties');
      }
    }
  }, [isAuthenticated, user, setLocation]);

  const handleClose = () => {
    setLocation('/');
  };

  return (
    <AuthModal 
      isOpen={true}
      onClose={handleClose}
      defaultMode="register"
    />
  );
}
