# Mobil Uygulama API Dökümantasyonu

Bu döküman, mobil uygulamanın sunucu ile iletişim kurmak için kullandığı API endpoint'lerini açıklamaktadır.

---

## Genel Rotalar (Public Routes)

Bu endpoint'ler için kimlik doğrulaması (authentication) gerekmez.

### 1. Kullanıcı Girişi (`/login`)
Bir kullanıcıyı doğrular ve korumalı rotalara erişim için bir Sanctum token'ı döndürür.

* **Endpoint:** `/api/login`
* **Method:** `POST`

#### Request Body
| Alan | Tür | Açıklama | Gerekli |
| :--- | :--- | :--- | :--- |
| `email` | String | Kullanıcının e-posta adresi. | Evet |
| `password` | String | Kullanıcının şifresi. | Evet |

#### Örnek İstek (cURL)
```bash
curl -X POST "[http://your-domain.com/api/login](http://your-domain.com/api/login)" \
  -H "Content-Type: application/json" \
  -d '{
        "email": "user@example.com",
        "password": "password123"
      }'

#### Örnek Başarılı Yanıt (200 OK)

