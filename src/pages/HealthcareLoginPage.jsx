import { Lock } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import FormInput from "../components/FormInput";
import { useAuth } from "../hooks/useAuth";
import { useToast } from "../hooks/useToast";

const initialForm = {
  name: "",
  email: "",
  phone: "",
  password: "",
  confirmPassword: ""
};

function HealthcareLoginPage() {
  const [form, setForm] = useState(initialForm);
  const [mode, setMode] = useState("login");
  const { login } = useAuth();
  const { addToast } = useToast();
  const navigate = useNavigate();

  const handleSubmit = (event) => {
    event.preventDefault();
    if (mode === "signup" && form.password !== form.confirmPassword) {
      addToast("Passwords do not match.", "error");
      return;
    }
    login({ name: form.name, email: form.email });
    addToast(
      mode === "signup"
        ? "Account created. Welcome to your health dashboard."
        : "Login successful. Welcome to your health dashboard."
    );
    setForm(initialForm);
    navigate("/healthcare");
  };

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <div>
        <h1 className="text-3xl font-extrabold text-slate-900">Healthcare Login</h1>
        <p className="mt-2 text-sm text-slate-600">
          Sign in to access your personalized healthcare dashboard.
        </p>
      </div>

      <section className="card-soft p-6">
        <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-brand-50 px-4 py-2 text-sm font-semibold text-brand-700">
          <Lock size={16} />
          Secure access
        </div>
        <div className="mb-4 flex rounded-full border border-slate-200 bg-white p-1">
          <button
            type="button"
            onClick={() => setMode("login")}
            className={`flex-1 rounded-full px-4 py-2 text-sm font-semibold transition ${
              mode === "login" ? "bg-accent-500 text-white" : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            Log in
          </button>
          <button
            type="button"
            onClick={() => setMode("signup")}
            className={`flex-1 rounded-full px-4 py-2 text-sm font-semibold transition ${
              mode === "signup" ? "bg-accent-500 text-white" : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            Sign up
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <FormInput
            label="Full Name"
            name="name"
            value={form.name}
            onChange={(event) => setForm((previous) => ({ ...previous, name: event.target.value }))}
            placeholder="Amina Johnson"
            required
          />
          <FormInput
            label="Email"
            name="email"
            type="email"
            value={form.email}
            onChange={(event) => setForm((previous) => ({ ...previous, email: event.target.value }))}
            placeholder="amina@example.com"
            required
          />
          <FormInput
            label="Phone Number"
            name="phone"
            type="tel"
            value={form.phone}
            onChange={(event) => setForm((previous) => ({ ...previous, phone: event.target.value }))}
            placeholder="+234 801 234 5678"
          />
          {mode === "signup" ? (
            <>
              <FormInput
                label="Create Password"
                name="password"
                type="password"
                value={form.password}
                onChange={(event) => setForm((previous) => ({ ...previous, password: event.target.value }))}
                placeholder="••••••••"
                required
              />
              <FormInput
                label="Confirm Password"
                name="confirmPassword"
                type="password"
                value={form.confirmPassword}
                onChange={(event) => setForm((previous) => ({ ...previous, confirmPassword: event.target.value }))}
                placeholder="••••••••"
                required
              />
            </>
          ) : null}
          <button
            type="submit"
            className="w-full rounded-full bg-accent-500 px-6 py-3 text-sm font-semibold text-white transition hover:bg-accent-600"
          >
            {mode === "signup" ? "Create Account" : "Login to Dashboard"}
          </button>
        </form>
      </section>
    </div>
  );
}

export default HealthcareLoginPage;
