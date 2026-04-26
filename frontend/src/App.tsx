import { useEffect } from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { useAuth, useUser } from "@clerk/clerk-react";
import { setTokenProvider } from "@/api/apiClient";
import { syncUser } from "@/api/oneTimeQueries";
import { useGlobalStore } from "@/store/globalState";
import LoginPage from "@/views/auth";
import DashboardPage from "@/views/dashboard";

function AuthSync() {
  const { getToken, isSignedIn } = useAuth();
  const { user } = useUser();
  const { apiKey, setApiKey } = useGlobalStore();

  useEffect(() => {
    setTokenProvider(() => getToken());
  }, [getToken]);

  useEffect(() => {
    if (isSignedIn && user && !apiKey) {
      const email = user.primaryEmailAddress?.emailAddress ?? "";
      syncUser(email)
        .then((res) => {
          if (res.isSuccess) setApiKey(res.apiKey, res.userId);
        })
        .catch(console.error);
    }
  }, [isSignedIn, user, apiKey, setApiKey]);

  return null;
}

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isSignedIn, isLoaded } = useAuth();
  if (!isLoaded) return null;
  if (!isSignedIn) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthSync />
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route
          path="/*"
          element={
            <ProtectedRoute>
              <DashboardPage />
            </ProtectedRoute>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}
