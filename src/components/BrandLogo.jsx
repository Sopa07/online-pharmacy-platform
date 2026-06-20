import logo from "../assets/shazzar-logo.jpeg";

function BrandLogo({ className = "h-12 w-auto rounded-lg", alt = "Shazzar Pharmacy logo" }) {
  return <img src={logo} alt={alt} className={className} loading="eager" />;
}

export default BrandLogo;
