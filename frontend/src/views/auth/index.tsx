import { SignIn } from "@clerk/clerk-react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@clerk/clerk-react";

export default function LoginPage() {
  const { isSignedIn, isLoaded } = useAuth();
  if (!isLoaded) return null;
  if (isSignedIn) return <Navigate to="/" replace />;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Life Tracker</h1>
        <p className="text-gray-500 mb-8">
          Track your food, expenses, and time
        </p>
        <SignIn routing="hash" />
      </div>
    </div>
  );
}
