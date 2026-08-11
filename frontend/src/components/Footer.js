import { Link } from "react-router-dom";
import { InstagramLogo, TiktokLogo } from "@phosphor-icons/react";

const Footer = ({ settings }) => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-[#0A0A0A] border-t border-[#262626]" data-testid="footer">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 mb-12">
          {/* Brand */}
          <div>
            <Link to="/" className="font-oswald text-3xl font-bold tracking-tight text-white">
              BERBERHANE
            </Link>
            <p className="font-manrope text-sm text-[#D97706] mt-2 tracking-wide">
              Mustafa Şimşek
            </p>
            <p className="font-manrope text-[#A3A3A3] mt-4 leading-relaxed">
              Gölcük'ün en iyi erkek kuaförü. Profesyonel hizmet, modern tarz.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-oswald text-lg uppercase tracking-wider text-white mb-4">
              Hızlı Erişim
            </h4>
            <nav className="space-y-2">
              <a
                href="#hizmetler"
                className="block font-manrope text-[#A3A3A3] hover:text-[#D97706] transition-colors"
              >
                Hizmetler
              </a>
              <a
                href="#galeri"
                className="block font-manrope text-[#A3A3A3] hover:text-[#D97706] transition-colors"
              >
                Galeri
              </a>
              <a
                href="#iletisim"
                className="block font-manrope text-[#A3A3A3] hover:text-[#D97706] transition-colors"
              >
                İletişim
              </a>
            </nav>
          </div>

          {/* Contact & Social */}
          <div>
            <h4 className="font-oswald text-lg uppercase tracking-wider text-white mb-4">
              İletişim
            </h4>
            <div className="space-y-2 font-manrope text-[#A3A3A3] mb-6">
              <a
                href="https://www.google.com/maps/dir/?api=1&destination=40.7181519,29.8258375&destination_place_id=ChIJMZvRL5hByxQRgMWtfiYfqDw"
                target="_blank"
                rel="noopener noreferrer"
                className="block hover:text-[#D97706] transition-colors"
              >
                {settings?.address || "Gölcük, Kocaeli"}
              </a>
              <a
                href={`tel:${(settings?.phone || "+905551234567").replace(/\s/g, "")}`}
                className="block hover:text-[#D97706] transition-colors"
              >
                {settings?.phone || "+90 555 123 4567"}
              </a>
            </div>

            {/* Social Links */}
            <div className="flex gap-4">
              <a
                href="https://www.instagram.com/berberhane41/"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 bg-[#171717] border border-[#262626] rounded-sm flex items-center justify-center text-[#A3A3A3] hover:text-[#D97706] hover:border-[#D97706] transition-colors"
                aria-label="Instagram"
              >
                <InstagramLogo size={20} weight="duotone" />
              </a>
              <a
                href="https://www.tiktok.com/@berberhane_41"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 bg-[#171717] border border-[#262626] rounded-sm flex items-center justify-center text-[#A3A3A3] hover:text-[#D97706] hover:border-[#D97706] transition-colors"
                aria-label="TikTok"
              >
                <TiktokLogo size={20} weight="duotone" />
              </a>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-[#262626] pt-8 flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="font-manrope text-sm text-[#A3A3A3]">
            © {currentYear} BERBERHANE. Tüm hakları saklıdır.
          </p>
          <div className="flex items-center gap-6">
            <Link
              to="/kvkk"
              className="font-manrope text-sm text-[#A3A3A3] hover:text-[#D97706] transition-colors"
              data-testid="footer-kvkk-link"
            >
              KVKK Aydınlatma Metni
            </Link>
            <Link
              to="/admin"
              className="font-manrope text-sm text-[#A3A3A3] hover:text-[#D97706] transition-colors"
              data-testid="footer-admin-link"
            >
              Yönetici Girişi
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;