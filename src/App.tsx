import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from './components/Layout';
import { Dashboard } from './pages/Dashboard';
import { Upload } from './pages/Upload';
import { Queue } from './pages/Queue';
import { Editor } from './pages/Editor';
import { Settings } from './pages/Settings';
import { Auth } from './pages/Auth';
import { FirebaseProvider } from './components/FirebaseProvider';
import { useStore } from './store/useStore';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user } = useStore();
  if (!user) return <Navigate to="/auth" />;
  return <>{children}</>;
}

function AppRoutes() {
  const { user } = useStore();

  return (
    <Routes>
      <Route path="/auth" element={user ? <Navigate to="/" /> : <Auth />} />
      <Route path="/*" element={
        <ProtectedRoute>
          <Layout>
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/upload" element={<Upload />} />
              <Route path="/queue" element={<Queue />} />
              <Route path="/editor/:id" element={<Editor />} />
              <Route path="/settings" element={<Settings />} />
            </Routes>
          </Layout>
        </ProtectedRoute>
      } />
    </Routes>
  );
}

export default function App() {
  return (
    <FirebaseProvider>
      <Router>
        <AppRoutes />
      </Router>
    </FirebaseProvider>
  );
}
