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
```

#### Örnek Başarılı Yanıt (200 OK)
```bash
{
    "token": "1|aBcDeFgHiJkLmNoPqRsTuVwXyZ1234567890AbCdEf",
    "user": {
        "id": 12,
        "name": "Dr. John Doe",
        "email": "user@example.com",
        "created_at": "2025-01-15T09:30:00Z",
        "updated_at": "2025-09-20T14:00:00Z"
    }
}
```

## Korumalı Rotalar (Protected Routes)

Bu endpoint'lere erişim için geçerli bir **Sanctum token** zorunludur.  

### 2) Giriş Yapmış Kullanıcıyı Al (`/me`)

O an giriş yapmış olan kullanıcının detaylarını getirir.

- **Endpoint:** `/api/me`  
- **Method:** `GET`  
- **Authentication:** Gerekli

#### Örnek İstek (cURL)
```bash
curl -X GET "http://your-domain.com/api/me" \
  -H "Authorization: Bearer YOUR_SANCTUM_TOKEN"
```
#### Örnek Başarılı Yanıt (200 OK)

```bash
{
  "id": 12,
  "name": "Dr. John Doe",
  "email": "user@example.com",
  "created_at": "2025-01-15T09:30:00Z",
  "updated_at": "2025-09-20T14:00:00Z"
}
```

#### Cevap Bekleyen Konuşmaları Al (/cevap-bekleyenler)
Yanıt bekleyen konuşmaların bir listesini getirir.

Endpoint: /api/cevap-bekleyenler
Method: GET
Authentication: Gerekli.

#### Örnek İstek (cURL)
```bash
curl -X GET "http://your-domain.com/api/cevap-bekleyenler" \
  -H "Authorization: Bearer YOUR_SANCTUM_TOKEN"
```

#### Örnek Başarılı Yanıt (200 OK)
```bash
[
  {
    "hst_id": 8401,
    "patient_name": "Peter Jones",
    "last_message_text": "Should I continue with the medication?",
    "last_message_time": "2025-10-13T09:45:00Z",
    "unread_count": 3
  }
]
```

### 4) Sohbet Mesajlarını Çek (`/chat-messages`)

Belirli bir hasta konuşmasının mesaj geçmişini getirir.

- **Endpoint:** `/api/chat-messages`  
- **Method:** `POST`  
- **Authentication:** Gerekli

#### Request Body
| Alan     | Tür     | Açıklama                   | Gerekli |
|----------|---------|----------------------------|---------|
| `hst_id` | Integer | Hastanın ID'si   | Evet    |

#### Örnek İstek (cURL)
```bash
curl -X POST "http://your-domain.com/api/chat-messages" \
  -H "Authorization: Bearer YOUR_SANCTUM_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
        "hst_id": 8400
      }'
```
#### Örnek Başarılı Yanıt (200 OK)
```bash
[
  {
    "id": 101,
    "hst_id": 8400,
    "yazar_id": 12,
    "yazar_tamad": "Dr. John Doe",
    "yazar_statu": "doktor",
    "cht_datetime": "2025-10-13T10:00:00Z",
    "cht_text": "Hello, how are you feeling today?",
    "cht_audio": null,
    "cht_audio_path": null,
    "created_at": "2025-10-13T10:00:05Z",
    "updated_at": "2025-10-13T10:00:05Z"
  }
]
```

### Anlık Bildirim Token'ını Kaydet (`/save-push-token`)

İstemcinin (client) **Expo push notification** token'ını sunucuya kaydeder.

- **Endpoint:** `/api/save-push-token`  
- **Method:** `POST`  
- **Authentication:** Gerekli

#### Request Body
| Alan            | Tür     | Açıklama                                 | Gerekli |
|-----------------|---------|------------------------------------------|---------|
| `expoPushToken` | String  | İstemciden alınan Expo push token | Evet    |

#### Örnek İstek (cURL)
```bash
curl -X POST "http://your-domain.com/api/save-push-token" \
  -H "Authorization: Bearer YOUR_SANCTUM_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
        "expoPushToken": "ExponentPushToken[xxxxxxxxxx]"
      }'
```

#### Örnek Başarılı Yanıt (200 OK)
```bash
{
  "message": "Push token saved successfully."
}
```

