


## **PetrolPricesScraping** 🚀
		Bu proje bazı akaryakıt istasyonlarının verileri JavaScript projesidir.
## **Özellikler** ✨

-   Özellik 1: İki farklı akaryakıt istasyonlarının verileri gelir.
-   Özellik 2: Hızlı ve güvenli bir altyapıya sahiptir.
## **Kurulum** ⚙️

Projeyi yerel makinenize kurmak için aşağıdaki adımları takip edin:
-   **Depoyu klonlayın:**
     `git clone https://github.com/durmaztayfun22/petrolPricesScraping.git` 
    
-   **Gerekli bağımlılıkları yükleyin:**
    `npm install` 
    
-   **Projenizi başlatın:**
    `node index.js`
   ## **Kullanım** 📚

Bu proje, örnek akaryakıt fiyatları verisini bir REST API üzerinden sunar. Diğer projeler, bu veriyi kolayca çekebilir ve kullanabilir. İşte nasıl çalıştığına dair detaylı bir açıklama:

### **Adım 1: Projeyi Başlatın**

Sunucuyu yerel makinenizde başlatmak için aşağıdaki komutları kullanabilirsiniz:
-   **Depoyu klonlayın:**
     `git clone https://github.com/durmaztayfun22/petrolPricesScraping.git` 
    
-   **Gerekli bağımlılıkları yükleyin:**
    `npm install` 
    
-   **Projenizi başlatın:**
    `node index.js`
  ### **Adım 2: API Çıktısını Görüntüleyin**

API'ye bir GET isteği göndererek akaryakıt fiyatlarını alabilirsiniz. Örnek bir istek:
	
	`curl http://localhost:3000/api/fuel-prices`
API çıktısı şu şekilde olacaktır:
`{
  "station": "Opet",
  "city": "İstanbul",
  "prices": {
    "benzin": "34.57 TL",
    "motorin": "32.15 TL",
    "lpg": "15.75 TL"
  },
  "date": "2024-12-22"
}
`
### **Adım 3: Veriyi Başka Bir Projeye Çekin**

Bu API'yi başka bir projede kullanmak için `fetch` veya `axios` gibi bir HTTP istemcisi kullanabilirsiniz. Örnek bir React uygulamasında bu veriyi nasıl çekebileceğiniz:
```javascript
import React, { useEffect, useState } from "react";
import axios from "axios";

const FuelPrices = () => {
  const [data, setData] = useState(null);

  useEffect(() => {
    axios
      .get("http://localhost:3000/api/fuel-prices")
      .then((response) => {
        setData(response.data);
      })
      .catch((error) => {
        console.error("Veri çekilirken bir hata oluştu:", error);
      });
  }, []);

  return (
    <div>
      {data ? (
        <div>
          <h1>{data.station} Akaryakıt Fiyatları</h1>
          <p>Şehir: {data.city}</p>
          <ul>
            <li>Benzin: {data.prices.benzin}</li>
            <li>Motorin: {data.prices.motorin}</li>
            <li>LPG: {data.prices.lpg}</li>
          </ul>
          <p>Tarih: {data.date}</p>
        </div>
      ) : (
        <p>Veri yükleniyor...</p>
      )}
    </div>
  );
};

export default FuelPrices;
### **Notlar**

-   API'yi uzaktan kullanmak için veritabanı bağlantısını ve sunucu yapılandırmasını güncelleyebilirsiniz.
-   Belirtilen kodlar birer örnektir.
