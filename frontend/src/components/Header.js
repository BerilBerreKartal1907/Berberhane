import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { List, X } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { useBooking } from "@/context/BookingContext";

const Header = ({ settings }) => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { openBooking } = useBooking();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const navLinks = [
    { href: "#hizmetler", label: "Hizmetler" },
    { href: "#galeri", label: "Galeri" },
    { href: "#iletisim", label: "İletişim" },
  ];

  const scrollToSection = (e, href) => {
    e.preventDefault();
    const element = document.querySelector(href);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
    setIsMobileMenuOpen(false);
  };

  return (
    <>
      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          isScrolled
            ? "bg-black/80 backdrop-blur-xl border-b border-white/10"
            : "bg-transparent"
        }`}
        data-testid="header"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            {/* Logo */}
            <Link
              to="/"
              className="font-oswald text-2xl sm:text-3xl font-bold tracking-tight text-white"
              data-testid="logo"
            >
              BERBERHANE
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-8" data-testid="desktop-nav">
              {navLinks.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  onClick={(e) => scrollToSection(e, link.href)}
                  className="text-[#A3A3A3] hover:text-white transition-colors font-manrope text-sm uppercase tracking-wider"
                >
                  {link.label}
                </a>
              ))}
            </nav>

            {/* CTA Button */}
            <div className="flex items-center gap-4">
              <Button
                onClick={() => openBooking()}
                className="hidden sm:flex bg-[#D97706] hover:bg-[#B45309] text-white font-oswald text-sm uppercase tracking-wider px-6 py-5"
                data-testid="header-cta-randevu-al"
              >
                Randevu Al
              </Button>

              {/* Mobile Menu Button */}
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="md:hidden p-2 text-white"
                data-testid="mobile-menu-button"
              >
                {isMobileMenuOpen ? <X size={28} /> : <List size={28} />}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 bg-[#0A0A0A]/98 z-40 md:hidden" data-testid="mobile-menu">
          <div className="flex flex-col items-center justify-center h-full gap-8">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={(e) => scrollToSection(e, link.href)}
                className="font-oswald text-3xl text-white uppercase tracking-wider"
              >
                {link.label}
              </a>
            ))}
            <Button
              onClick={() => {
                openBooking();
                setIsMobileMenuOpen(false);
              }}
              className="mt-4 bg-[#D97706] hover:bg-[#B45309] text-white font-oswald text-lg uppercase tracking-wider px-8 py-6"
              data-testid="mobile-cta-randevu-al"
            >
              Randevu Al
            </Button>
          </div>
        </div>
      )}
    </>
  );
};

export default Header;
