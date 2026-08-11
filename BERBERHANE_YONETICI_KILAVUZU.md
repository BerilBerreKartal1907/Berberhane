# BERBERHANE Yönetici Paneli Kılavuzu

## Yönetici Paneline Giriş

### Adım 1: Panele Erişim
Web sitenizin adresinin sonuna `/admin` ekleyin:
```
https://siteniz.com/admin
```

Veya ana sayfanın en altındaki **"Yönetici Girişi"** linkine tıklayın.

### Adım 2: Şifre ile Giriş
- Şifre kutusuna admin şifrenizi girin
- **"Giriş Yap"** butonuna tıklayın
- 5 kez üst üste yanlış şifre girilirse, güvenlik amacıyla 15 dakika giriş engellenir

---

## Yönetici Paneli Özellikleri

### 1. RANDEVULAR
Sol menüden (mobilde üstteki) **"Randevular"** sekmesine tıklayın.

**Ne yapabilirsiniz:**
- Günlük randevuları görüntüleyin
- Tarih seçici ile farklı günlere bakın (◀ ▶ okları ile)
- Her randevuda müşteri adı, telefonu, hizmet ve saati görün
- Panel açıkken yeni bir randevu gelirse otomatik olarak sesli bildirim ve ekran uyarısı alırsınız

**Randevu İşlemleri:**
- ✓ (yeşil tik) / "Tamamlandı" butonu: Randevuyu tamamlandı olarak işaretle
- ✗ (kırmızı çarpı) / "İptal" butonu: Randevuyu iptal et
- 🗑 (çöp kutusu): Randevuyu tamamen sil

---

### 2. HİZMETLER
Sol menüden **"Hizmetler"** sekmesine tıklayın.

**Ne yapabilirsiniz:**

#### Yeni Hizmet Eklemek:
1. Sağ üstteki **"+ Hizmet Ekle"** butonuna tıklayın
2. Formu doldurun:
   - **Hizmet Adı:** Örn: "Saç Kesimi"
   - **Açıklama:** Kısa bir açıklama
   - **Süre (dk):** Hizmetin dakika cinsinden süresi
   - **Fiyat (₺):** Ücret
3. **"Kaydet"** butonuna tıklayın

#### Hizmet Düzenlemek:
1. Düzenlemek istediğiniz hizmetin yanındaki 🖊 (kalem) ikonuna tıklayın
2. Bilgileri güncelleyin
3. **"Kaydet"** butonuna tıklayın

#### Hizmet Silmek:
1. Silmek istediğiniz hizmetin yanındaki 🗑 (çöp kutusu) ikonuna tıklayın
2. Onay verin

#### Hizmetlerin Sırasını Değiştirmek:
- Her hizmetin solundaki ⠿ tutamacını tutup sürükleyerek listedeki yerini değiştirebilirsiniz (hem bilgisayarda fare, hem telefonda parmakla çalışır)
- Yeni sıra otomatik kaydedilir; ana sayfadaki hizmet sıralaması da buna göre güncellenir

---

### 3. ÇALIŞMA SAATLERİ
Sol menüden **"Çalışma Saatleri"** sekmesine tıklayın.

**Ne yapabilirsiniz:**
- Her gün için açık/kapalı durumunu ayarlayın (anahtar ile)
- Açılış ve kapanış saatlerini değiştirin
- Değişiklikler otomatik kaydedilir ve hem ana sayfadaki bilgide hem randevu takviminde anında yansır

**Örnek:**
- Pazartesi: 09:00 - 21:00 (Açık)
- Pazar: Kapalı

---

### 4. BLOKLU GÜNLER
Sol menüden **"Bloklu Günler"** sekmesine tıklayın.

**Ne işe yarar:**
Tatil, özel gün veya izin günlerinizde randevu alınmasını engelleyin.

#### Blok Eklemek:
1. **"+ Blok Ekle"** butonuna tıklayın
2. Takvimden tarihi seçin
3. Seçenekler:
   - **Tüm gün:** O gün hiç randevu alınmaz
   - **Belirli saatler:** Sadece seçtiğiniz saat aralığı bloklanır (başlangıç/bitiş saati girilmesi zorunludur)
4. İsterseniz sebep yazın (örn: "Bayram tatili") — bu sebep, müşteri o tarihi seçtiğinde ekranda ona gösterilir
5. **"Kaydet"** butonuna tıklayın

#### Blok Kaldırmak:
- Blokun yanındaki 🗑 (çöp kutusu) ikonuna tıklayın

---

### 5. GENEL AYARLAR
Sol menüden **"Genel Ayarlar"** sekmesine tıklayın.

**Ne yapabilirsiniz:**
- İşletme adını, telefon numarasını, WhatsApp numarasını ve adresi buradan güncelleyebilirsiniz
- Değişiklikler kaydedilince site genelinde (İletişim bölümü, Footer, WhatsApp butonu) otomatik güncellenir
- Bu bilgileri değiştirmek için artık geliştiriciye ihtiyacınız yok

---

### 6. ŞİFRE DEĞİŞTİRME
Üst menüdeki (mobilde 🔑 ikonu, masaüstünde sol alt) **"Şifre Değiştir"** butonuna tıklayın.

- Mevcut şifrenizi, yeni şifrenizi ve tekrarını girip kaydedin
- Yeni şifre en az 6 karakter olmalı
- Şifreniz veritabanında güvenli şekilde şifrelenmiş (hash'lenmiş) olarak saklanır, kimse düz metin olarak göremez

---

## Bildirimler

Yeni bir randevu geldiğinde, kayıtlı e-posta adresinize (berberhanerandevu@gmail.com) otomatik olarak bir bildirim e-postası gider. Ayrıca admin paneli açıkken de sesli/ekran bildirimi alırsınız. Telefonunuzda o e-posta hesabına Gmail uygulamasından giriş yapıp bildirimleri açarsanız, site kapalıyken de haberdar olabilirsiniz.

---

## Sık Sorulan Sorular

### Şifremi unuttum, ne yapmalıyım?
Şifrenizi biliyorsanız "Şifre Değiştir" ile kendiniz güncelleyebilirsiniz. Şifrenizi tamamen unuttuysanız, veritabanına erişimi olan geliştiriciye başvurmanız gerekir (şifre güvenli şekilde şifrelendiği için düz metin olarak geri getirilemez, sadece sıfırlanabilir).

### Müşteri randevu aldığında bildirim alır mıyım?
Evet — kayıtlı e-posta adresinize otomatik bildirim gider, ayrıca panel açıkken sesli/ekran uyarısı da alırsınız.

### Müşteri randevusunu iptal edebilir mi?
Müşteriler şu an kendi randevularını kendileri iptal edemiyor. Sizi arayıp bilgi vermeleri gerekiyor, siz panelden iptal edebilirsiniz.

### Fiyatları değiştirdiğimde eski randevular etkilenir mi?
Hayır, eski randevular eski fiyatlarla kayıtlı kalır. Sadece yeni randevular güncel fiyatları gösterir.

### Aynı saate iki randevu alınabilir mi?
Hayır, sistem bunu otomatik engeller — iki müşteri aynı anda aynı saati seçmeye çalışsa bile, sadece biri randevuyu tamamlayabilir.

---

## Hızlı İpuçları

1. **Her sabah** paneli açıp günün randevularını kontrol edin
2. **Tatil öncesi** bloklu günleri eklemeyi unutmayın
3. **Fiyat güncellemesi** yapacaksanız müşterilere önceden bildirin
4. Çıkış yapmak için **"Çıkış Yap"** butonunu kullanın
5. Telefon/adres gibi bilgiler değiştiğinde **"Genel Ayarlar"**dan güncelleyin, geliştiriciye ihtiyaç yok

---

## İletişim

Teknik sorunlar için web geliştiricisine ulaşın.

---

*Bu kılavuz BERBERHANE yönetici paneli için hazırlanmıştır.*