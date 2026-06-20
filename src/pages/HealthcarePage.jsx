import { Activity, BellRing, HeartPulse, MessageCircle, Syringe, Target, Video } from "lucide-react";
import { useState } from "react";
import FormInput from "../components/FormInput";
import { useToast } from "../hooks/useToast";
import { useAuth } from "../hooks/useAuth";
import specialists from "../data/specialists.json";
import SpecialistCard from "../components/SpecialistCard";
import Modal from "../components/Modal";

const baselineForm = {
  age: "",
  gender: "",
  weight: "",
  allergies: "",
  chronicConditions: "",
  medications: ""
};

const updateFormDefaults = {
  emergencyContact: "",
  preferredCheckin: "Weekly",
  note: ""
};

const bookingDefaults = {
  specialistId: "",
  date: "",
  timeSlot: "",
  reason: "",
  method: "video"
};

const followups = [
  { date: "Mar 12, 2026", title: "Blood pressure check-in", detail: "Review morning and evening trend logs." },
  { date: "Mar 16, 2026", title: "Medication adherence review", detail: "Confirm refill schedule and reminder settings." },
  { date: "Mar 21, 2026", title: "Specialist follow-up", detail: "Virtual consultation with chronic care pharmacist." }
];

function HealthcarePage() {
  const [healthForm, setHealthForm] = useState(baselineForm);
  const [updateForm, setUpdateForm] = useState(updateFormDefaults);
  const [booking, setBooking] = useState(bookingDefaults);
  const [modalOpen, setModalOpen] = useState(false);
  const { addToast } = useToast();
  const { user, logout } = useAuth();

  const selectedSpecialist = specialists.find((item) => String(item.id) === booking.specialistId);

  const handleCollectSubmit = (event) => {
    event.preventDefault();
    addToast("Health profile captured successfully.");
  };

  const handleUpdateSubmit = (event) => {
    event.preventDefault();
    addToast("Health profile updated.");
  };

  const handleBookingSubmit = (event) => {
    event.preventDefault();
    setModalOpen(true);
    addToast("Consultation slot reserved.");
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900">Personalized Healthcare Dashboard</h1>
          <p className="mt-2 text-sm text-slate-600">Track key health signals and keep your care profile current.</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 shadow-soft">
          <p className="font-semibold text-slate-900">{user?.name ?? "Patient"}</p>
          <p className="text-xs text-slate-500">{user?.email || "Signed in"}</p>
          <button
            type="button"
            onClick={logout}
            className="mt-2 text-xs font-semibold text-rose-600 hover:text-rose-700"
          >
            Log out
          </button>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1fr_1fr]">
        <section className="card-soft p-6">
          <h2 className="text-lg font-semibold text-slate-900">Health Data Collection</h2>
          <form onSubmit={handleCollectSubmit} className="mt-4 grid gap-4 sm:grid-cols-2">
            <FormInput
              label="Age"
              name="age"
              type="number"
              value={healthForm.age}
              onChange={(event) => setHealthForm((previous) => ({ ...previous, age: event.target.value }))}
              required
              placeholder="34"
            />
            <FormInput
              label="Gender"
              name="gender"
              as="select"
              value={healthForm.gender}
              onChange={(event) => setHealthForm((previous) => ({ ...previous, gender: event.target.value }))}
              required
              options={[
                { value: "", label: "Select gender" },
                { value: "Female", label: "Female" },
                { value: "Male", label: "Male" },
                { value: "Other", label: "Other" }
              ]}
            />
            <FormInput
              label="Weight (kg)"
              name="weight"
              type="number"
              value={healthForm.weight}
              onChange={(event) => setHealthForm((previous) => ({ ...previous, weight: event.target.value }))}
              required
              placeholder="70"
            />
            <FormInput
              label="Allergies"
              name="allergies"
              value={healthForm.allergies}
              onChange={(event) => setHealthForm((previous) => ({ ...previous, allergies: event.target.value }))}
              placeholder="Penicillin"
            />
            <FormInput
              label="Chronic Conditions"
              name="chronicConditions"
              as="textarea"
              rows={3}
              value={healthForm.chronicConditions}
              onChange={(event) =>
                setHealthForm((previous) => ({ ...previous, chronicConditions: event.target.value }))
              }
              placeholder="Hypertension, Asthma"
            />
            <FormInput
              label="Current Medications"
              name="medications"
              as="textarea"
              rows={3}
              value={healthForm.medications}
              onChange={(event) => setHealthForm((previous) => ({ ...previous, medications: event.target.value }))}
              placeholder="Lisinopril 10mg daily"
            />
            <button
              type="submit"
              className="sm:col-span-2 rounded-full bg-accent-500 px-6 py-3 text-sm font-semibold text-white transition hover:bg-accent-600"
            >
              Save Health Data
            </button>
          </form>
        </section>

        <section className="card-soft p-6">
          <h2 className="text-lg font-semibold text-slate-900">Health Tracker</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <article className="rounded-2xl bg-rose-50 p-4">
              <div className="inline-flex rounded-xl bg-rose-100 p-2 text-rose-600">
                <HeartPulse size={16} />
              </div>
              <p className="mt-3 text-sm text-slate-600">Blood Pressure</p>
              <p className="text-xl font-bold text-slate-900">122 / 78 mmHg</p>
            </article>
            <article className="rounded-2xl bg-brand-50 p-4">
              <div className="inline-flex rounded-xl bg-brand-100 p-2 text-brand-700">
                <Syringe size={16} />
              </div>
              <p className="mt-3 text-sm text-slate-600">Blood Sugar</p>
              <p className="text-xl font-bold text-slate-900">106 mg/dL</p>
            </article>
            <article className="rounded-2xl bg-amber-50 p-4">
              <div className="inline-flex rounded-xl bg-amber-100 p-2 text-amber-700">
                <BellRing size={16} />
              </div>
              <p className="mt-3 text-sm text-slate-600">Medication Reminders</p>
              <p className="text-xl font-bold text-slate-900">3 today</p>
            </article>
            <article className="rounded-2xl bg-emerald-50 p-4">
              <div className="inline-flex rounded-xl bg-emerald-100 p-2 text-emerald-700">
                <Target size={16} />
              </div>
              <p className="mt-3 text-sm text-slate-600">Wellness Goals</p>
              <p className="text-xl font-bold text-slate-900">4 / 6 complete</p>
            </article>
          </div>
        </section>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1fr_1fr]">
        <section className="card-soft p-6">
          <h2 className="text-lg font-semibold text-slate-900">Update Health Profile</h2>
          <form onSubmit={handleUpdateSubmit} className="mt-4 space-y-4">
            <FormInput
              label="Emergency Contact"
              name="emergencyContact"
              value={updateForm.emergencyContact}
              onChange={(event) => setUpdateForm((previous) => ({ ...previous, emergencyContact: event.target.value }))}
              placeholder="+234 809 876 1020"
            />
            <FormInput
              label="Preferred Check-in Frequency"
              name="preferredCheckin"
              as="select"
              value={updateForm.preferredCheckin}
              onChange={(event) => setUpdateForm((previous) => ({ ...previous, preferredCheckin: event.target.value }))}
              options={[
                { value: "Weekly", label: "Weekly" },
                { value: "Bi-weekly", label: "Bi-weekly" },
                { value: "Monthly", label: "Monthly" }
              ]}
            />
            <FormInput
              label="Additional Notes"
              name="note"
              as="textarea"
              rows={4}
              value={updateForm.note}
              onChange={(event) => setUpdateForm((previous) => ({ ...previous, note: event.target.value }))}
              placeholder="Mention recent symptoms or medication changes."
            />
            <button
              type="submit"
              className="rounded-full bg-accent-500 px-6 py-3 text-sm font-semibold text-white transition hover:bg-accent-600"
            >
              Update Health Profile
            </button>
          </form>
        </section>

        <section className="card-soft p-6">
          <h2 className="text-lg font-semibold text-slate-900">Follow-up Timeline</h2>
          <div className="mt-5 space-y-4">
            {followups.map((item) => (
              <article key={item.date} className="relative rounded-xl border border-slate-200 p-4 pl-6">
                <span className="absolute left-2 top-6 h-2.5 w-2.5 rounded-full bg-brand-500" />
                <p className="text-xs font-semibold uppercase tracking-wide text-brand-700">{item.date}</p>
                <h3 className="mt-1 font-semibold text-slate-900">{item.title}</h3>
                <p className="mt-1 text-sm text-slate-600">{item.detail}</p>
              </article>
            ))}
          </div>
          <div className="mt-4 inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
            <Activity size={14} />
            Upcoming check-ins auto-generated from your profile preferences
          </div>
        </section>
      </div>

      <section>
        <h2 className="mb-4 text-2xl font-bold text-slate-900">Consultation & Specialist Care</h2>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {specialists.map((specialist) => (
            <SpecialistCard key={specialist.id} specialist={specialist} />
          ))}
        </div>
      </section>

      <section className="card-soft p-6">
        <h3 className="text-xl font-bold text-slate-900">Book a Consultation</h3>
        <form onSubmit={handleBookingSubmit} className="mt-4 grid gap-4 sm:grid-cols-2">
          <FormInput
            label="Select Specialist"
            name="specialistId"
            as="select"
            value={booking.specialistId}
            onChange={(event) => setBooking((previous) => ({ ...previous, specialistId: event.target.value }))}
            options={[
              { value: "", label: "Select specialist" },
              ...specialists.map((item) => ({ value: String(item.id), label: `${item.name} - ${item.specialization}` }))
            ]}
            required
          />
          <FormInput
            label="Date"
            name="date"
            type="date"
            value={booking.date}
            onChange={(event) => setBooking((previous) => ({ ...previous, date: event.target.value }))}
            required
          />
          <FormInput
            label="Time Slot"
            name="timeSlot"
            as="select"
            value={booking.timeSlot}
            onChange={(event) => setBooking((previous) => ({ ...previous, timeSlot: event.target.value }))}
            options={[
              { value: "", label: "Select slot" },
              { value: "09:00 AM", label: "09:00 AM" },
              { value: "11:00 AM", label: "11:00 AM" },
              { value: "02:00 PM", label: "02:00 PM" },
              { value: "04:30 PM", label: "04:30 PM" }
            ]}
            required
          />
          <FormInput
            label="Reason for Consultation"
            name="reason"
            as="textarea"
            rows={4}
            value={booking.reason}
            onChange={(event) => setBooking((previous) => ({ ...previous, reason: event.target.value }))}
            placeholder="Describe your symptoms or medication concern."
            required
          />
          <div className="sm:col-span-2">
            <p className="mb-2 text-sm font-semibold text-slate-700">Consultation Method</p>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-slate-300 p-3 transition hover:border-brand-300">
                <input
                  type="radio"
                  name="method"
                  value="video"
                  checked={booking.method === "video"}
                  onChange={(event) => setBooking((previous) => ({ ...previous, method: event.target.value }))}
                  className="text-brand-600 focus:ring-brand-500"
                />
                <Video size={16} className="text-brand-700" />
                <span className="text-sm font-medium text-slate-700">Video Consultation</span>
              </label>
              <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-slate-300 p-3 transition hover:border-brand-300">
                <input
                  type="radio"
                  name="method"
                  value="chat"
                  checked={booking.method === "chat"}
                  onChange={(event) => setBooking((previous) => ({ ...previous, method: event.target.value }))}
                  className="text-brand-600 focus:ring-brand-500"
                />
                <MessageCircle size={16} className="text-brand-700" />
                <span className="text-sm font-medium text-slate-700">Chat Consultation</span>
              </label>
            </div>
          </div>
          <button
            type="submit"
            className="sm:col-span-2 rounded-full bg-accent-500 px-6 py-3 text-sm font-semibold text-white transition hover:bg-accent-600"
          >
            Book Consultation
          </button>
        </form>
      </section>

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="Consultation Confirmed">
        <div className="space-y-3 text-sm text-slate-700">
          <p>
            Your consultation has been booked with{" "}
            <span className="font-semibold text-slate-900">{selectedSpecialist?.name ?? "selected specialist"}</span>.
          </p>
          <p>
            Date: <span className="font-semibold text-slate-900">{booking.date || "Not selected"}</span>
          </p>
          <p>
            Time: <span className="font-semibold text-slate-900">{booking.timeSlot || "Not selected"}</span>
          </p>
          <p>
            Method: <span className="font-semibold capitalize text-slate-900">{booking.method}</span>
          </p>
          <button
            type="button"
            onClick={() => {
              setModalOpen(false);
              setBooking(bookingDefaults);
            }}
            className="mt-2 w-full rounded-full bg-accent-500 px-5 py-3 text-sm font-semibold text-white hover:bg-accent-600"
          >
            Close
          </button>
        </div>
      </Modal>
    </div>
  );
}

export default HealthcarePage;
