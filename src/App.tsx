import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import { Provider } from 'react-redux';
import { AuthProvider } from '@/auth';
import { AppRoutes } from '@/routes';
import { store } from '@/store';
import './App.css';

const App: React.FC = () => {
  return (
    <Provider store={store}>
      <BrowserRouter>
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>
      </BrowserRouter>
    </Provider>
  );
};

export default App;
