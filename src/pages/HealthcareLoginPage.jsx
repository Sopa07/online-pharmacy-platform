import { Lock } from "lucide-react";
import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
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
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { login, register } = useAuth();
  const { addToast } = useToast();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirectTo = searchParams.get("redirect") || "/healthcare";

  const updateField = (field) => (event) => {
    setForm((previous) => ({ ...previous, [field]: event.target.value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (mode === "signup" && form.password !== form.confirmPassword) {
      addToast("Passwords do not match.", "error");
      return;
    }

    setIsSubmitting(true);
    try {
      if (mode === "signup") {
        const result = await register({
          name: form.name,
          email: form.email,
          phone: form.phone,
          password: form.password
        });
        if (result.needsConfirmation) {
          addToast("Account created. Check your email to confirm your account, then log in.");
          setForm(initialForm);
          setMode("login");
          return;
        }
        addToast("Account created. Welcome to your health dashboard.");
      } else {
        await login({
          email: form.email,
          password: form.password
        });
        addToast("Login successful. Welcome to your health dashboard.");
      }

      setForm(initialForm);
      navigate(redirectTo);
    } catch (error) {
      addToast(error.message, "error");
    } finally {
      setIsSubmitting(false);
    }
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
          {mode === "signup" ? (
            <FormInput
              label="Full Name"
              name="name"
              value={form.name}
              onChange={updateField("name")}
              placeholder="Amina Johnson"
              required
            />
          ) : null}
          <FormInput
            label="Email"
            name="email"
            type="email"
            value={form.email}
            onChange={updateField("email")}
            placeholder="amina@example.com"
            required
          />
          {mode === "signup" ? (
            <FormInput
              label="Phone Number"
              name="phone"
              type="tel"
              value={form.phone}
              onChange={updateField("phone")}
              placeholder="+234 801 234 5678"
              required
            />
          ) : null}
          <FormInput
            label={mode === "signup" ? "Create Password" : "Password"}
            name="password"
            type="password"
            value={form.password}
            onChange={updateField("password")}
            placeholder={mode === "signup" ? "At least 8 characters" : "Your password"}
            minLength={mode === "signup" ? 8 : undefined}
            required
          />
          {mode === "signup" ? (
            <FormInput
              label="Confirm Password"
              name="confirmPassword"
              type="password"
              value={form.confirmPassword}
              onChange={updateField("confirmPassword")}
              placeholder="Re-enter password"
              minLength={8}
              required
            />
          ) : null}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full rounded-full bg-accent-500 px-6 py-3 text-sm font-semibold text-white transition hover:bg-accent-600 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting ? "Please wait..." : mode === "signup" ? "Create Account" : "Login to Dashboard"}
          </button>
        </form>
      </section>
    </div>
  );
}

export default HealthcareLoginPage;
