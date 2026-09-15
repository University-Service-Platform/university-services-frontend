import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from '@/auth';
import { AppRoutes } from '@/routes';
import './App.css';

const App: React.FC = () => {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
};

export default App;
