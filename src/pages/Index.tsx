import { useSelector } from 'react-redux';
import { Navigate } from 'react-router-dom';

const Index = () => {
    const { user } = useSelector((state: any) => state.auth);
  if (user?.isAuthenticated) {
    return <Navigate to="/form" replace />;
  }
  
  return <Navigate to="/login" replace />;
};

export default Index;
