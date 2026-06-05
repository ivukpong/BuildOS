import React from "react";
import { useNavigate } from "react-router";

export const UnauthorizedPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="text-6xl font-bold text-red-600 mb-4">403</div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Access Denied
          </h1>
          <p className="text-gray-600 mb-8">
            You don't have permission to access this resource. Please contact
            your administrator if you believe this is an error.
          </p>
          <div className="space-x-4">
            <button
              onClick={() => navigate("/")}
              className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
            >
              Go to Dashboard
            </button>
            <button
              onClick={() => navigate(-1)}
              className="inline-block bg-gray-600 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded"
            >
              Go Back
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
