import { useState } from "react";
import { useNavigate, Link } from "react-router";
import { Building2 } from "lucide-react";
import { apiFetch } from "../../api/client";

export function SignupPage() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    companyName: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    setError("");
    setLoading(true);
    try {
      const res = await apiFetch<{
        access_token: string;
        user: { id: string; name: string; email: string; role: string };
      }>("/auth/register", {
        method: "POST",
        body: JSON.stringify({
          name: formData.companyName,
          email: formData.email,
          password: formData.password,
        }),
      });
      localStorage.setItem("auth_token", res.access_token);
      localStorage.setItem("auth_user", JSON.stringify(res.user));
      navigate("/apps");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Registration failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md bg-white rounded-lg shadow-xl p-8">
      <div className="flex items-center justify-center mb-8">
        <Building2 className="w-10 h-10 text-blue-600 mr-3" />
        <h1 className="text-3xl text-gray-900">BuildOS</h1>
      </div>

      <h2 className="text-2xl mb-2 text-gray-900 text-center">
        Create Your Company
      </h2>
      <p className="text-gray-600 text-center mb-6">
        Start managing your construction projects
      </p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm mb-1 text-gray-700">
            Company Name
          </label>
          <input
            type="text"
            required
            value={formData.companyName}
            onChange={(e) =>
              setFormData({ ...formData, companyName: e.target.value })
            }
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Acme Construction Co."
          />
        </div>

        <div>
          <label className="block text-sm mb-1 text-gray-700">Email</label>
          <input
            type="email"
            required
            value={formData.email}
            onChange={(e) =>
              setFormData({ ...formData, email: e.target.value })
            }
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="you@company.com"
          />
        </div>

        <div>
          <label className="block text-sm mb-1 text-gray-700">Password</label>
          <input
            type="password"
            required
            value={formData.password}
            onChange={(e) =>
              setFormData({ ...formData, password: e.target.value })
            }
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="••••••••"
          />
        </div>

        <div>
          <label className="block text-sm mb-1 text-gray-700">
            Confirm Password
          </label>
          <input
            type="password"
            required
            value={formData.confirmPassword}
            onChange={(e) =>
              setFormData({ ...formData, confirmPassword: e.target.value })
            }
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="••••••••"
          />
        </div>

        {error && <p className="text-red-600 text-sm">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 transition-colors mt-6 disabled:opacity-50"
        >
          {loading ? "Creating account…" : "Create Account"}
        </button>
      </form>

      <p className="text-center mt-6 text-sm text-gray-600">
        Already have an account?{" "}
        <Link to="/auth/login" className="text-blue-600 hover:underline">
          Log in
        </Link>
      </p>
    </div>
  );
}
