import BrandLogo from "./BrandLogo";

function Footer() {
  return (
    <footer className="border-t border-slate-200 bg-white">
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-10 sm:px-6 md:grid-cols-3 lg:px-8">
        <div className="text-center md:text-left">
          <div className="flex flex-col items-center gap-2 md:items-start">
            <BrandLogo className="h-14 w-auto rounded-lg shadow-sm" />
            <p className="text-sm font-semibold uppercase tracking-widest text-slate-700">Shazzar Pharmacy</p>
          </div>
          <p className="mt-2 text-sm text-slate-600">
            Trusted digital pharmacy and telehealth support for families across Nigeria.
          </p>
        </div>
        <div>
          <h4 className="font-semibold text-slate-900">Support</h4>
          <ul className="mt-2 space-y-1 text-sm text-slate-600">
            <li>24/7 live chat simulation</li>
            <li>Certified pharmacists</li>
            <li>Prescription verification</li>
          </ul>
        </div>
        <div>
          <h4 className="font-semibold text-slate-900">Contact</h4>
          <ul className="mt-2 space-y-1 text-sm text-slate-600">
            <li>Email: Support@shazzarcarepharmacy.com</li>
            <li>Phone: +234 902 208 7353</li>
            <li>Address: 62/64 Addo road, (Opposite Pump and Sell) Ajah</li>
          </ul>
        </div>
      </div>
      <p className="border-t border-slate-200 px-4 py-4 text-center text-xs text-slate-500">
        © 2026 Shazzar Pharmacy. Frontend demo for educational purposes.
      </p>
    </footer>
  );
}

export default Footer;
