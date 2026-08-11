import { Link } from "react-router-dom";
import { ArrowLeft } from "@phosphor-icons/react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { useEffect, useState } from "react";
import { getSettings } from "@/lib/api";

const KvkkPage = () => {
  const [settings, setSettings] = useState(null);

  useEffect(() => {
    getSettings()
      .then(setSettings)
      .catch(() => {});
  }, []);

  return (
    <div className="min-h-screen bg-[#0A0A0A]">
      <Header settings={settings} />
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-16">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-[#A3A3A3] hover:text-[#D97706] transition-colors mb-8 font-manrope text-sm"
        >
          <ArrowLeft size={16} />
          Ana Sayfaya Dön
        </Link>

        <h1 className="font-oswald text-3xl sm:text-4xl uppercase text-white mb-2">
          KVKK Aydınlatma Metni
        </h1>
        <p className="text-[#A3A3A3] font-manrope mb-10 text-sm">
          Son güncelleme: {new Date().toLocaleDateString("tr-TR")}
        </p>

        <div className="space-y-8 font-manrope text-[#A3A3A3] leading-relaxed">
          <section>
            <h2 className="font-oswald text-xl text-white uppercase mb-3">1. Veri Sorumlusu</h2>
            <p>
              6698 sayılı Kişisel Verilerin Korunması Kanunu ("KVKK") uyarınca, işbu web
              sitesi üzerinden paylaştığınız kişisel verileriniz, veri sorumlusu sıfatıyla{" "}
              <strong className="text-white">BERBERHANE</strong> ({settings?.address || "Gölcük, Kocaeli"}
              ) tarafından aşağıda açıklanan kapsamda işlenmektedir.
            </p>
          </section>

          <section>
            <h2 className="font-oswald text-xl text-white uppercase mb-3">
              2. İşlenen Kişisel Veriler
            </h2>
            <p>
              Online randevu formu üzerinden ad-soyad, telefon numarası ve (varsa) randevu
              notu bilgileriniz toplanmaktadır. Bu veriler yalnızca randevunuzu oluşturmak,
              onaylamak ve gerekmesi halinde sizinle iletişime geçmek amacıyla kullanılır.
            </p>
          </section>

          <section>
            <h2 className="font-oswald text-xl text-white uppercase mb-3">
              3. İşleme Amacı ve Hukuki Sebep
            </h2>
            <p>
              Verileriniz, KVKK'nın 5. maddesinde belirtilen "sözleşmenin kurulması veya
              ifasıyla doğrudan doğruya ilgili olması kaydıyla, sözleşmenin taraflarına ait
              kişisel verilerin işlenmesinin gerekli olması" hukuki sebebine dayanarak,
              randevu hizmetinin sağlanabilmesi amacıyla işlenmektedir.
            </p>
          </section>

          <section>
            <h2 className="font-oswald text-xl text-white uppercase mb-3">
              4. Verilerin Saklanması ve Aktarımı
            </h2>
            <p>
              Kişisel verileriniz, güvenli sunucularda (MongoDB Atlas) şifreli şekilde
              saklanmaktadır. Verileriniz, yasal zorunluluklar dışında üçüncü kişilerle
              paylaşılmaz veya pazarlama amacıyla kullanılmaz.
            </p>
          </section>

          <section>
            <h2 className="font-oswald text-xl text-white uppercase mb-3">
              5. Haklarınız
            </h2>
            <p className="mb-2">KVKK'nın 11. maddesi uyarınca; kişisel verilerinizin:</p>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li>işlenip işlenmediğini öğrenme,</li>
              <li>işlenmişse buna ilişkin bilgi talep etme,</li>
              <li>işlenme amacını ve amacına uygun kullanılıp kullanılmadığını öğrenme,</li>
              <li>eksik veya yanlış işlenmişse düzeltilmesini isteme,</li>
              <li>silinmesini veya yok edilmesini isteme</li>
            </ul>
            <p className="mt-2">
              haklarına sahipsiniz. Bu haklarınızı kullanmak için{" "}
              <a
                href={`tel:${(settings?.phone || "").replace(/\s/g, "")}`}
                className="text-[#D97706] hover:underline"
              >
                {settings?.phone || "işletme telefon numaramız"}
              </a>{" "}
              üzerinden bizimle iletişime geçebilirsiniz.
            </p>
          </section>
        </div>
      </div>
      <Footer settings={settings} />
    </div>
  );
};

export default KvkkPage;