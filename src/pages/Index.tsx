import { Navigate } from 'react-router-dom';
import { useStore } from '@/store/useStore';

const Index = () => {
  const { user } = useStore();
  
  if (user?.isAuthenticated) {
    return <Navigate to="/form" replace />;
  }
  
  return <Navigate to="/login" replace />;
};

export default Index;
