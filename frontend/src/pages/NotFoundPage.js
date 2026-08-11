import { Link } from "react-router-dom";
import { Scissors } from "@phosphor-icons/react";

const NotFoundPage = () => {
  return (
    <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center px-4">
      <div className="text-center">
        <Scissors size={56} weight="duotone" className="text-[#D97706] mx-auto mb-6" />
        <h1 className="font-oswald text-6xl sm:text-7xl font-bold text-white mb-4">404</h1>
        <p className="font-manrope text-[#A3A3A3] mb-8">
          Aradığınız sayfa bulunamadı.
        </p>
        <Link
          to="/"
          className="inline-block bg-[#D97706] hover:bg-[#B45309] text-white font-manrope font-medium px-6 py-3 rounded-sm transition-colors"
        >
          Ana Sayfaya Dön
        </Link>
      </div>
    </div>
  );
};

export default NotFoundPage;