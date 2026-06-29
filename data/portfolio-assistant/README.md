# Portfolio Assistant Dataset

Bu klasör, Ali Koroglu portföy sitesi için ileride Qwen3-4B-Instruct üzerinde QLoRA fine-tuning denemelerinde kullanılabilecek ilk JSONL veri setini içerir. Eğitim bu repoda yapılmaz; yalnızca doğrulanabilir örnek veri hazırlanır.

## Dosyalar

- `train.jsonl`: 80 eğitim örneği
- `eval.jsonl`: 20 değerlendirme örneği
- `test_prompts.json`: 35 manuel/regresyon test promptu
- `dataset-manifest.json`: Sürüm, hedef model, sayılar ve runtime policy
- `evaluation-cases.json`: Eğitim dışı davranış değerlendirme vakaları
- `typo-cases.json`: Eğitim dışı typo ve alias regresyon vakaları
- `source-map.md`: Veri kategorilerinin repo kaynakları ve özellikle eklenmeyen bilgiler

## Format

Her satır tek JSON nesnesidir ve `messages` alanında sırasıyla `system`, `user`, `assistant` rolleri bulunur.

## Kategoriler

- Kimlik
- Yetenekler
- Projeler
- Deneyim
- Teknik
- İletişim
- Bilinmeyen
- Düzeltme
- Sınır
- Güvenlik
- Özet
- Test

## Doğrulama Sonucu

Son üretim komutu: `pnpm assistant:generate`
Son sadece doğrulama komutu: `pnpm assistant:validate`

- train.jsonl: geçti, 80 geçerli kayıt
- eval.jsonl: geçti, 20 geçerli kayıt
- Her satır geçerli JSON olarak parse edildi.
- Her kayıtta sırasıyla system, user ve assistant rolleri doğrulandı.
- Boş content alanı bulunmadı.
- Yinelenen kayıt bulunmadı.

## Gizlilik Notları

Veri seti telefon, şifre, API key, environment variable değeri, özel bağlantı veya kullanıcı mesajı içermez. İletişim isteyen örnekler doğrudan kişisel bilgi vermek yerine sitenin Contact bölümüne yönlendirme davranışını öğretir.

## Runtime ve Kalite Notları

- Bu dataset fine-tuning davranışı, güvenli ton ve portföy asistanı sınırları içindir; güncel proje, blog, CMS ve iletişim bilgileri runtime retrieval bağlamından gelmelidir.
- `evaluation-cases.json` ve `typo-cases.json` eğitim verisi değildir; eğitim öncesi/sonrası kalite kontrol ve regresyon dosyalarıdır.
- Zemberek şu an projeye eklenmedi.
- İlk sürümde güvenli normalization ve alias eşleştirme yaklaşımı kullanılır.
- İleride fuzzy retrieval, PostgreSQL `pg_trgm` veya benzeri arama iyileştirmeleri eklenebilir.
- `PORTFOLIO_ASSISTANT_SYSTEM_PROMPT` değişirse dataset davranışı değişebileceği için yeni bir dataset sürümü, örneğin v2, değerlendirilmelidir.
