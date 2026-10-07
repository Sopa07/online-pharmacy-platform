import {
  Activity,
  Calendar,
  ClipboardList,
  FileText,
  LayoutDashboard,
  Package,
  Search,
  Users
} from "lucide-react";
import { useEffect, useState } from "react";
import { apiRequest } from "../utils/api";
import { useAuth } from "../hooks/useAuth";
import { formatNaira } from "../utils/formatCurrency";

function AdminPage() {
  const { token } = useAuth();
  const [activeTab, setActiveTab] = useState("overview");
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState({
    summary: { orders: 0, prescriptions: 0, consultations: 0 },
    orders: [],
    prescriptions: [],
    consultations: []
  });

  useEffect(() => {
    async function fetchAdminData() {
      setLoading(true);
      try {
        const [summaryRes, ordersRes, prescriptionsRes, consultationsRes] = await Promise.all([
          apiRequest("/admin/summary", { token }),
          apiRequest("/admin/orders", { token }),
          apiRequest("/admin/prescriptions", { token }),
          apiRequest("/admin/consultations", { token })
        ]);

        setData({
          summary: summaryRes.data,
          orders: ordersRes.data,
          prescriptions: prescriptionsRes.data,
          consultations: consultationsRes.data
        });
      } catch (error) {
        console.error("Failed to fetch admin data:", error);
      } finally {
        setLoading(false);
      }
    }

    if (token) {
      fetchAdminData();
    }
  }, [token]);

  const renderOverview = () => (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="card-soft p-6">
          <div className="flex items-center gap-4">
            <div className="rounded-xl bg-brand-50 p-3 text-brand-600">
              <Package size={24} />
            </div>
            <div>
              <p className="text-sm text-slate-500">Total Orders</p>
              <p className="text-2xl font-bold text-slate-900">{data.summary.orders}</p>
            </div>
          </div>
        </div>
        <div className="card-soft p-6">
          <div className="flex items-center gap-4">
            <div className="rounded-xl bg-accent-50 p-3 text-accent-600">
              <FileText size={24} />
            </div>
            <div>
              <p className="text-sm text-slate-500">Prescriptions</p>
              <p className="text-2xl font-bold text-slate-900">{data.summary.prescriptions}</p>
            </div>
          </div>
        </div>
        <div className="card-soft p-6">
          <div className="flex items-center gap-4">
            <div className="rounded-xl bg-emerald-50 p-3 text-emerald-600">
              <Calendar size={24} />
            </div>
            <div>
              <p className="text-sm text-slate-500">Consultations</p>
              <p className="text-2xl font-bold text-slate-900">{data.summary.consultations}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="card-soft overflow-hidden">
        <div className="border-b border-slate-100 bg-slate-50/50 px-6 py-4">
          <h3 className="font-bold text-slate-900">Recent Orders</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-100 text-slate-500">
                <th className="px-6 py-4 font-semibold">Reference</th>
                <th className="px-6 py-4 font-semibold">Customer</th>
                <th className="px-6 py-4 font-semibold">Total</th>
                <th className="px-6 py-4 font-semibold">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {data.orders.slice(0, 5).map((order) => (
                <tr key={order.id} className="hover:bg-slate-50/50">
                  <td className="px-6 py-4 font-mono text-xs font-semibold text-brand-700">{order.reference}</td>
                  <td className="px-6 py-4 text-slate-700">{order.customer_name}</td>
                  <td className="px-6 py-4 font-semibold text-slate-900">{formatNaira(order.total)}</td>
                  <td className="px-6 py-4">
                    <span className="rounded-full bg-amber-50 px-2 py-1 text-xs font-bold capitalize text-amber-700">
                      {order.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  const renderOrders = () => (
    <div className="card-soft overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50/50 text-slate-500">
            <tr className="border-b border-slate-100">
              <th className="px-6 py-4 font-semibold">Reference</th>
              <th className="px-6 py-4 font-semibold">Customer</th>
              <th className="px-6 py-4 font-semibold">Phone</th>
              <th className="px-6 py-4 font-semibold">Total</th>
              <th className="px-6 py-4 font-semibold">Payment</th>
              <th className="px-6 py-4 font-semibold">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {data.orders.map((order) => (
              <tr key={order.id} className="hover:bg-slate-50/50">
                <td className="px-6 py-4 font-mono text-xs font-semibold text-brand-700">{order.reference}</td>
                <td className="px-6 py-4 text-slate-700">{order.customer_name}</td>
                <td className="px-6 py-4 text-slate-500">{order.customer_phone}</td>
                <td className="px-6 py-4 font-semibold text-slate-900">{formatNaira(order.total)}</td>
                <td className="px-6 py-4">
                  <span className="text-xs text-slate-600">{order.payment_status}</span>
                </td>
                <td className="px-6 py-4">
                  <span className="rounded-full bg-amber-50 px-2 py-1 text-xs font-bold capitalize text-amber-700">
                    {order.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderPrescriptions = () => (
    <div className="card-soft overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50/50 text-slate-500">
            <tr className="border-b border-slate-100">
              <th className="px-6 py-4 font-semibold">Reference</th>
              <th className="px-6 py-4 font-semibold">Patient</th>
              <th className="px-6 py-4 font-semibold">Phone</th>
              <th className="px-6 py-4 font-semibold">File</th>
              <th className="px-6 py-4 font-semibold">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {data.prescriptions.map((rx) => (
              <tr key={rx.id} className="hover:bg-slate-50/50">
                <td className="px-6 py-4 font-mono text-xs font-semibold text-brand-700">{rx.reference}</td>
                <td className="px-6 py-4 text-slate-700">{rx.patient_name}</td>
                <td className="px-6 py-4 text-slate-500">{rx.patient_phone}</td>
                <td className="px-6 py-4 text-xs font-semibold text-slate-600 underline">{rx.file_path}</td>
                <td className="px-6 py-4">
                  <span className="rounded-full bg-blue-50 px-2 py-1 text-xs font-bold capitalize text-blue-700">
                    {rx.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderConsultations = () => (
    <div className="card-soft overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50/50 text-slate-500">
            <tr className="border-b border-slate-100">
              <th className="px-6 py-4 font-semibold">Reference</th>
              <th className="px-6 py-4 font-semibold">Patient</th>
              <th className="px-6 py-4 font-semibold">Specialist</th>
              <th className="px-6 py-4 font-semibold">Date & Time</th>
              <th className="px-6 py-4 font-semibold">Method</th>
              <th className="px-6 py-4 font-semibold">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {data.consultations.map((con) => (
              <tr key={con.id} className="hover:bg-slate-50/50">
                <td className="px-6 py-4 font-mono text-xs font-semibold text-brand-700">{con.reference}</td>
                <td className="px-6 py-4 text-slate-700">{con.patient_name}</td>
                <td className="px-6 py-4">
                  <p className="font-semibold text-slate-900">{con.specialist_name}</p>
                  <p className="text-xs text-slate-500">{con.specialization}</p>
                </td>
                <td className="px-6 py-4">
                  <p className="text-slate-700">{con.consultation_date}</p>
                  <p className="text-xs text-slate-500">{con.time_slot}</p>
                </td>
                <td className="px-6 py-4 capitalize text-slate-600">{con.method}</td>
                <td className="px-6 py-4">
                  <span className="rounded-full bg-emerald-50 px-2 py-1 text-xs font-bold capitalize text-emerald-700">
                    {con.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900">Admin Dashboard</h1>
          <p className="mt-1 text-sm text-slate-600">Monitor and manage platform activity across Nigeria.</p>
        </div>
        <div className="flex rounded-full border border-slate-200 bg-white p-1">
          <button
            onClick={() => setActiveTab("overview")}
            className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
              activeTab === "overview" ? "bg-brand-500 text-white" : "text-slate-600 hover:bg-slate-50"
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => setActiveTab("orders")}
            className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
              activeTab === "orders" ? "bg-brand-500 text-white" : "text-slate-600 hover:bg-slate-50"
            }`}
          >
            Orders
          </button>
          <button
            onClick={() => setActiveTab("prescriptions")}
            className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
              activeTab === "prescriptions" ? "bg-brand-500 text-white" : "text-slate-600 hover:bg-slate-50"
            }`}
          >
            Prescriptions
          </button>
          <button
            onClick={() => setActiveTab("consultations")}
            className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
              activeTab === "consultations" ? "bg-brand-500 text-white" : "text-slate-600 hover:bg-slate-50"
            }`}
          >
            Consultations
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex h-64 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-200 border-t-brand-600"></div>
        </div>
      ) : (
        <>
          {activeTab === "overview" && renderOverview()}
          {activeTab === "orders" && renderOrders()}
          {activeTab === "prescriptions" && renderPrescriptions()}
          {activeTab === "consultations" && renderConsultations()}
        </>
      )}
    </div>
  );
}

export default AdminPage;
