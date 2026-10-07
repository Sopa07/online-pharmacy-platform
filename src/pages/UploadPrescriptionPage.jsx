import { FileText, UploadCloud } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import FormInput from "../components/FormInput";
import { useAuth } from "../hooks/useAuth";
import { useToast } from "../hooks/useToast";
import { apiRequest } from "../utils/api";

const allowedTypes = ["application/pdf", "image/jpeg", "image/png"];

const initialForm = {
  fullName: "",
  phone: "",
  email: "",
  address: ""
};

function UploadPrescriptionPage() {
  const inputRef = useRef(null);
  const [form, setForm] = useState(initialForm);
  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [reference, setReference] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { token, user } = useAuth();

  useEffect(() => {
    if (user) {
      setForm((prev) => ({
        ...prev,
        fullName: prev.fullName || user.name || "",
        phone: prev.phone || user.phone || "",
        email: prev.email || user.email || ""
      }));
    }
  }, [user]);

  const { addToast } = useToast();

  const isImage = useMemo(() => file && file.type.startsWith("image/"), [file]);

  useEffect(() => {
    if (!file || !isImage) {
      setPreviewUrl("");
      return undefined;
    }

    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [file, isImage]);

  const handleFile = (incomingFile) => {
    if (!incomingFile) {
      return;
    }
    if (!allowedTypes.includes(incomingFile.type)) {
      addToast("Only PDF, JPG, and PNG files are accepted.", "error");
      return;
    }
    setFile(incomingFile);
    setSubmitted(false);
  };

  const handleDrop = (event) => {
    event.preventDefault();
    setIsDragging(false);
    handleFile(event.dataTransfer.files?.[0]);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!file) {
      addToast("Please upload a prescription file first.", "error");
      return;
    }
    if (!token) {
      addToast("Please log in before submitting a prescription.", "error");
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await apiRequest("/prescriptions", {
        method: "POST",
        token,
        body: {
          patient: {
            name: form.fullName,
            phone: form.phone,
            email: form.email,
            address: form.address
          },
          prescription: {
            fileName: file.name,
            fileType: file.type,
            fileSize: file.size
          }
        }
      });

      setReference(result.data.reference);
      setSubmitted(true);
      addToast("Prescription submitted successfully.");
      setForm(initialForm);
      setFile(null);
    } catch (error) {
      addToast(error.message, "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <h1 className="text-3xl font-extrabold text-slate-900">Upload Prescription</h1>
        <p className="mt-2 text-sm text-slate-600">Submit your prescription and patient details for pharmacist review.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <section className="card-soft p-6">
          <div
            className={`rounded-2xl border-2 border-dashed p-8 text-center transition ${
              isDragging ? "border-brand-500 bg-brand-50" : "border-slate-300 bg-slate-50"
            }`}
            onDragOver={(event) => {
              event.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
            role="button"
            tabIndex={0}
            onClick={() => inputRef.current?.click()}
            onKeyDown={(event) => {
              if (event.key === "Enter" || event.key === " ") {
                inputRef.current?.click();
              }
            }}
            aria-label="Prescription file upload zone"
          >
            <UploadCloud size={34} className="mx-auto text-brand-600" />
            <h2 className="mt-3 text-lg font-semibold text-slate-900">Drag and drop prescription here</h2>
            <p className="mt-1 text-sm text-slate-600">Accepted formats: PDF, JPG, PNG</p>
            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                inputRef.current?.click();
              }}
              className="mt-4 rounded-full bg-accent-500 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-accent-600"
            >
              Select File
            </button>
            <input
              ref={inputRef}
              type="file"
              accept=".pdf,.jpg,.jpeg,.png"
              onChange={(event) => handleFile(event.target.files?.[0])}
              className="hidden"
              aria-label="Upload prescription file"
            />
          </div>

          {file ? (
            <div className="mt-5 rounded-xl border border-slate-200 p-4">
              <h3 className="text-sm font-semibold text-slate-900">File Preview</h3>
              {isImage && previewUrl ? (
                <img src={previewUrl} alt="Prescription preview" className="mt-3 max-h-64 rounded-lg object-contain" />
              ) : (
                <div className="mt-3 inline-flex items-center gap-2 rounded-lg bg-slate-100 px-3 py-2 text-sm text-slate-700">
                  <FileText size={16} />
                  {file.name}
                </div>
              )}
            </div>
          ) : null}
        </section>

        <section className="card-soft p-6">
          <h2 className="text-lg font-semibold text-slate-900">Patient Information</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <FormInput
              label="Full Name"
              name="fullName"
              value={form.fullName}
              onChange={(event) => setForm((previous) => ({ ...previous, fullName: event.target.value }))}
              required
              placeholder="John Doe"
            />
            <FormInput
              label="Phone Number"
              name="phone"
              type="tel"
              value={form.phone}
              onChange={(event) => setForm((previous) => ({ ...previous, phone: event.target.value }))}
              required
              placeholder="+234 801 234 5678"
            />
            <FormInput
              label="Email"
              name="email"
              type="email"
              value={form.email}
              onChange={(event) => setForm((previous) => ({ ...previous, email: event.target.value }))}
              required
              placeholder="you@email.com"
            />
            <FormInput
              label="Delivery Address"
              name="address"
              value={form.address}
              onChange={(event) => setForm((previous) => ({ ...previous, address: event.target.value }))}
              required
              placeholder="Street, Area, LGA, State"
            />
          </div>
          <button
            type="submit"
            disabled={isSubmitting}
            className="mt-5 rounded-full bg-accent-500 px-6 py-3 text-sm font-semibold text-white transition hover:bg-accent-600 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting ? "Submitting..." : "Submit Prescription"}
          </button>
        </section>
      </form>

      {submitted ? (
        <section className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-semibold text-emerald-700">
          A pharmacist will review your prescription shortly{reference ? ` (${reference})` : "."}
        </section>
      ) : null}
    </div>
  );
}

export default UploadPrescriptionPage;
