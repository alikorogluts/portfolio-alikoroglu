# Source Map

## Hangi veri kategorisi hangi repo dosyalarından türetildi?

- Kimlik: `README.md`, `components/landing/portfolio-data.ts`, `app/page.tsx`
- Yetenekler: `components/landing/portfolio-data.ts`, `README.md`
- Projeler: `components/landing/portfolio-data.ts`, `prisma/seed.ts`
- Deneyim: `components/landing/portfolio-data.ts`, `prisma/seed.ts`
- Teknik: `README.md`, `package.json`, `app/layout.tsx`, `app/page.tsx`, `lib/portfolio-data.ts`, `components/analytics.tsx`, `prisma/schema.prisma`
- İletişim: `components/landing/cta-section.tsx`, `components/landing/navigation.tsx`, `app/api/contact/route.ts`, `lib/portfolio-data.ts`
- Bilinmeyen: Repo içinde doğrulanmayan alanları reddetme davranışı için `README.md`, `components/landing/portfolio-data.ts` ve `prisma/schema.prisma` ile karşılaştırmalı olarak üretildi.
- Düzeltme: Yanlış varsayımları nazikçe düzeltmek için `README.md` ve `components/landing/portfolio-data.ts` kaynak alındı.
- Sınır: Portföy kapsamı dışı isteklerde yönlendirme tonu için proje amacı `README.md` üzerinden türetildi.
- Güvenlik: `README.md`, `components/analytics.tsx`, `app/api/contact/route.ts`, `prisma/schema.prisma`, `.env.example`
- Özet: `README.md`, `components/landing/portfolio-data.ts`, `lib/portfolio-data.ts`
- Test: Yukarıdaki kategorilerin regresyon ve edge-case varyasyonlarıdır.

## Hangi içerikler repo içinde bulunamadığı için veri setine eklenmedi?

- Doğum tarihi, açık adres, not ortalaması, maaş beklentisi veya doğrulanmış üniversite adı.
- DeepSecure için doğruluk oranı, benchmark skoru, canlı ürün durumu veya detaylı ekran akışı.
- Habit Tracker kullanıcı sayısı, canlı trafik, gelir veya production metrikleri.
- Her proje için ayrı doğrulanmış repository/demo URL listesi.
- Admin kullanıcı bilgileri, şifreler, session tokenları, gerçek environment variable değerleri ve gerçek database bağlantıları.
- Contact formundan gelen kullanıcı mesajları veya kişisel veri içerebilecek kayıtlar.
- Telefon ve doğrudan kişisel e-posta gibi hassas iletişim değerleri.

## Gelecekte hangi dosyalar güncellenirse veri seti yeniden üretilmeli?

- `components/landing/portfolio-data.ts`
- `lib/portfolio-data.ts`
- `README.md`
- `prisma/schema.prisma`
- `prisma/seed.ts`
- `app/page.tsx`
- `app/layout.tsx`
- `components/analytics.tsx`
- `components/landing/navigation.tsx`
- `components/landing/cta-section.tsx`
- `app/api/contact/route.ts`
- Admin CMS üzerinden production içerikleri değişirse, veritabanındaki public portfolio kayıtları ayrıca kaynak olarak dışa aktarılıp veri seti yeniden gözden geçirilmelidir.
