import { Video, MessageCircle } from "lucide-react";
import { useMemo, useState } from "react";
import specialists from "../data/specialists.json";
import SpecialistCard from "../components/SpecialistCard";
import FormInput from "../components/FormInput";
import Modal from "../components/Modal";
import { useToast } from "../hooks/useToast";

const bookingDefaults = {
  specialistId: "",
  date: "",
  timeSlot: "",
  reason: "",
  method: "video"
};

function ConsultationPage() {
  const [booking, setBooking] = useState(bookingDefaults);
  const [modalOpen, setModalOpen] = useState(false);
  const { addToast } = useToast();

  const specialistOptions = useMemo(
    () => [
      { value: "", label: "Select specialist" },
      ...specialists.map((item) => ({ value: String(item.id), label: `${item.name} - ${item.specialization}` }))
    ],
    []
  );

  const selectedSpecialist = specialists.find((item) => String(item.id) === booking.specialistId);

  const handleSubmit = (event) => {
    event.preventDefault();
    setModalOpen(true);
    addToast("Consultation slot reserved.");
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-extrabold text-slate-900">Book Telehealth Consultation</h1>
        <p className="mt-2 text-sm text-slate-600">Choose a specialist, date, and preferred consultation method in Nigeria.</p>
      </div>

      <section>
        <h2 className="mb-4 text-xl font-bold text-slate-900">Specialist Directory</h2>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {specialists.map((specialist) => (
            <SpecialistCard key={specialist.id} specialist={specialist} />
          ))}
        </div>
      </section>

      <section className="card-soft p-6">
        <h2 className="text-xl font-bold text-slate-900">Book Consultation</h2>
        <form onSubmit={handleSubmit} className="mt-4 grid gap-4 sm:grid-cols-2">
          <FormInput
            label="Select Specialist"
            name="specialistId"
            as="select"
            value={booking.specialistId}
            onChange={(event) => setBooking((previous) => ({ ...previous, specialistId: event.target.value }))}
            options={specialistOptions}
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
            Method:{" "}
            <span className="font-semibold capitalize text-slate-900">{booking.method}</span>
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

export default ConsultationPage;
