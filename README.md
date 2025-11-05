# Peerstack Multi-filter demo (simple static)


Xüsusiyyətlər:
- **Login səhifəsi** — istifadəçi adı və şifrə ilə giriş (demo: admin/admin)
- Header filter sahələri: Ad, Soyad, FİN, Status, Başlanğıc, Son
- Təmizlə / Axtar / Bugün düymələri
- Sağda təqvim (Calendar) — seçilmiş tarixi vurğulayır
- Prev / Next düymələri seçilmiş tarixi hərəkət etdirir
- Orta cədvəl seçilmiş filtrlərə uyğun nəticələri göstərir
- Pagination (prev/next düymələri ilə)
- "Məlumat yoxdur" göstəricisi
- Çıxış düyməsi (logout)

## Necə işlətmək:

### 1. Login səhifəsi
Brauzeriniz ilə `login.html` faylını açın:
```bash
open /Users/cavid2006/peerstacksite/login.html
```

**Demo hesab:**
- İstifadəçi adı: `admin`
- Şifrə: `admin`

### 2. Əsas səhifə
Login edəndən sonra avtomatik `index.html` səhifəsinə yönləndiriləcəksiniz.

**Funksiyalar:**
1. Filtrləri doldurun və `Axtar` düyməsinə basın
2. Təqvimdən tarix seçin — cədvəl filtrələnəcək
3. Prev/Next düymələri ilə gün-gün keçid edin
4. Sağ yuxarıdakı X ikonuna basaraq çıxış edin

## Fayllar:
- `login.html` — Giriş səhifəsi
- `login.js` — Login məntiqi
- `index.html` — Əsas cədvəl və filter səhifəsi
- `app.js` — Əsas funksionallıq
- `styles.css` — Bütün stillər (login + əsas səhifə)
- `README.md` — Bu fayl

Qeyd: Bu, minimal, sadə və statik nümunədir — server/DB yoxdur. Asanlıqla genişləndirilə bilər.
