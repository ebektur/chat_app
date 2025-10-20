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
        "email": "john.doe@fly.com.tr",
        "password": "password123"
      }'
```

#### Örnek Başarılı Yanıt (200 OK)
```bash
{
  "token": "17|TOKEN",
  "user": {
    "id": 1,
    "name": "John Doe",
    "email": "john.doe@fly.com.tr",
    "role": "doktor",
    "expo_push_token": "ExponentPushToken[XXXXXXXXX]",
    "created_at": "2025-09-05T18:34:53.000000Z",
    "updated_at": "2025-09-12T13:24:00.000000Z"
    "hst_id: null"
  }
}
```

```bash
{
  "token": "18|TOKEN",
  "user": {
    "id": 2,
    "name": "Jane Patient",
    "email": "jane.patient@fly.com.tr",
    "role": "patient",
    "expo_push_token": "ExponentPushToken[XXXXXXXXX]",
    "created_at": "2025-09-05T18:34:53.000000Z",
    "updated_at": "2025-09-12T13:24:00.000000Z"
    "hst_id: 8606"
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
  "id": 1,
  "name": "John Doe",
  "email": "john.doe@fly.com.tr",
  "role": "doktor",
  "expo_push_token": "ExponentPushToken[XXXXXXXXXXXX]",
  "created_at": "2025-09-05T18:34:53.000000Z",
  "updated_at": "2025-09-12T13:24:00.000000Z",
  "hst_id" : null
}
```

### Cevap Bekleyen Konuşmaları Al (/cevap-bekleyenler)
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
    "status": "success",
    "data": [
        {
            "hst_id": 8401,
            "patient_name": "Test Patient Jane",
            "last_message_text": "This is my first message...",
            "last_message_time": "2025-10-13 15:50:13",
            "is_unread": 1
        },
        {
            "hst_id": 8400,
            "patient_name": "Frau Kamila Birke",
            "last_message_text": "Thank you, doctor.",
            "last_message_time": "2025-10-13 15:50:15",
            "is_unread": 0
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
"status": "success",
    "data": [
        {
            "id": 22,
            "hst_id": 8400,
            "yazar_id": 2,
            "yazar_tamad": "Staff Member",
            "yazar_statu": "mf",
            "cht_datetime": "2025-09-12T12:51:40.000000Z",
            "cht_text": "Merhaba hocam, hastanın dosyasını güncelledim.",
            "cht_audio": null,
            "cht_audio_path": null,
            "created_at": "2025-09-12T13:21:41.000000Z",
            "updated_at": "2025-09-12T13:21:41.000000Z"
        },
        {
            "id": 23,
            "hst_id": 8400,
            "yazar_id": 1,
            "yazar_tamad": "Dr. Onur Egemen",
            "yazar_statu": "dr",
            "cht_datetime": "2025-09-12T12:53:40.000000Z",
            "cht_text": "Teşekkürler. Sabahki sonuçlar sisteme düştü mü?",
            "cht_audio": null,
            "cht_audio_path": null,
            "created_at": "2025-09-12T13:21:41.000000Z",
            "updated_at": "2025-09-12T13:21:41.000000Z"
        },
        {
            "id": 34,
            "hst_id": 8400,
            "yazar_id": 5,
            "yazar_tamad": "Frau Kamila Birke",
            "yazar_statu": "patient",
            "cht_datetime": "2025-10-13T14:50:15.000000Z",
            "cht_text": "Thank you, doctor.",
            "cht_audio": null,
            "cht_audio_path": null,
            "created_at": "2025-10-13T15:50:15.000000Z",
            "updated_at": "2025-10
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

