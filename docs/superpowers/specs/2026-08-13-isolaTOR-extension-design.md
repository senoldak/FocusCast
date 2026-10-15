# isolaTOR Chrome Eklentisi Tasarım Dokümanı (Design Specification v2.5 Minimal)

**Tarih:** 2026-08-14  
**Sürüm:** 2.5.0 (Minimal Broadcast Studio — Chrome Side Panel)  
**Durum:** Onaylandı & Uygulandı (Approved & Implemented)  
**Tasarım Dili:** Minimalist koyu tema, tipografik hiyerarşi (Plus Jakarta Sans & JetBrains Mono), emojilerden arındırılmış temiz endüstriyel stüdyo paneli.

---

## 1. Genel Mimari
`isolaTOR`, Chrome'un yerel **Side Panel API** (`chrome.sidePanel`) üzerinde çalışan profesyonel video ve ses stüdyo mikseridir. Görüşme boyunca kesintisiz açık kalır ve %100 yerel (client-side) çalışır.

---

## 2. Temel Fonksiyonlar ve Modüller

### 2.1. Video & Kamera Stüdyosu
- **Arka Plan İzolasyonu:** Bulanıklaştırma (Blur), Sanal Galeri (Stüdyo, Ofis, Teras, Sınıf, Kütüphane, Özel Görsel) ve Düz Renk (Chroma key).
- **Stüdyo Işığı (Ring Light):** Nötr, Sıcak ve Soğuk ton seçenekleriyle yüz aydınlatma.
- **Cilt Yumuşatma (Beauty):** Doğal ten yumuşatma ve canlılık filtresi.
- **Sunum Zamanlayıcısı:** 5, 10, 15 dakika seçenekli geri sayım rozeti.
- **Ekran Fotoğrafı & Video Kaydı:** Filtreli HD PNG indirme ve yerel WebM kaydı.
- **Göz Teması Kılavuzu:** Optik hizalama ve göz temasını koruma çizgileri.
- **Otomatik Kadrajlama (Center Stage):** Kullanıcıyı takip eden otomatik zoom ve ortalama.
- **Alt Bant (İsimlik):** Kamera üzerine cam efektli isim ve unvan bandı.
- **Sanal Lazer:** Canlı kamera üzerinde parlayan lazer işaretçi.

### 2.2. Ses & Studio Motoru
- **Canlı Ses Efektleri (Soundboard):** Mikrofona doğrudan gönderilen Alkış, Zil, Onay ve Bateri efektleri.
- **İkincil Ses Kalkanı (Voice Shield):** Odadaki ikincil insan seslerini zayıflatan odak kalkanı.
- **AI Gürültü Baskılama & De-Esser:** Fan/uğultu engelleyici ve sert 'S' yumuşatıcı.
- **Ses Profilleri:** Doğal, Radyo, Net Vokal, Gizlilik.
- **Ton Ekolayzır:** Bas ve tiz için ayarlanabilir dB filtreleri.
- **Frekans Spektrumu:** Gerçek zamanlı 16 kanallı analizör.

### 2.3. Ayarlar & Özel Profiller
- **Özel Profil Kaydet:** Tüm kamera ve ses ayarlarını tek tıkla kaydedip yükleme.
- **Teleprompter:** Ekranda kayan sunum/konuşma metni.
- **Bas-Konuş:** Space tuşuyla anlık mikrofon kontrolü.
- **Görüşme İçi Konsol:** Toplantı ekranında yüzen mini kontrol çubuğu.
- **Kısayollar:** `Alt + M`, `Alt + B`, `Alt + W`, `Space`.

---

## 3. Gizlilik
Tüm işlemler cihazınızda yerel olarak çalıştırılır. Hiçbir veri harici sunuculara aktarılmaz.
