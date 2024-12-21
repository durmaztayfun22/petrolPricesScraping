const express = require('express');
const axios = require('axios');
// const nodemon = require('nodemon');
const cheerio = require('cheerio');
const cors = require('cors');
const _ = require('lodash');
const app = express();
const PORT = 3000;

app.use(cors()); // CORS'u etkinleştir

// URL ve para birimleri
const currencyData = [
    { url: 'https://kur.doviz.com/serbest-piyasa/amerikan-dolari', key: 'USD' }, // Dolar
    { url: 'https://kur.doviz.com/serbest-piyasa/euro', key: 'EUR' },           // Euro
    { url: 'https://kur.doviz.com/serbest-piyasa/sterlin', key: 'GBP' }         // Sterlin
];

const petrolOfisiData = [
    { url: 'https://www.petrolofisi.com.tr/akaryakit-fiyatlari', key: '' }
];


const Tcities = [
    "ADANA", "ADIYAMAN", "AFYONKARAHİSAR", "AĞRI", "AKSARAY", 
    "AMASYA", "ANKARA", "ANTALYA", "ARTVİN", "AYDIN", 
    "BALIKESİR", "BARTIN", "BATMAN", "BİLECİK", 
    "BİNGÖL", "BİTLİS", "BOLU", "BURDUR", "BURSA", 
    "ÇANAKKALE", "ÇANKIRI", "ÇORUM", "DENİZLİ", "DİYARBAKIR", 
    "DÜZCE", "EDİRNE", "ELAZIĞ", "ERZİNCAN", "ERZURUM", 
    "ESKİŞEHİR", "GAZİANTEP", "GİRESUN", "GÜMÜŞHANE", "HAKKARİ", 
    "HATAY", "ISPARTA", "İSTANBUL (ANADOLU)", "İSTANBUL (AVRUPA)", "İZMİR", 
    "KAHRAMANMARAŞ", "KARABÜK", "KARAMAN", "KARS", "KASTAMONU", 
    "KAYSERİ", "KİLİS", "KIRIKKALE", "KIRKLARELİ", "KIRŞEHİR", 
    "KOCAELİ", "KONYA", "KÜTAHYA", "MALATYA", "MANİSA", 
    "MARDİN", "MERSİN", "MUĞLA", "MUŞ", "NEVŞEHİR", 
    "NİĞDE", "ORDU", "OSMANİYE", "RİZE", "SAKARYA", 
    "SAMSUN", "ŞANLIURFA", "SİİRT", "SİNOP", "ŞIRNAK", 
    "SİVAS", "TEKİRDAĞ", "TOKAT", "TRABZON", "TUNCELİ", 
    "UŞAK", "VAN", "YALOVA", "YOZGAT", "ZONGULDAK"
];


// Döviz verilerini çekmek için bir fonksiyon
const fetchAllData = async () => {
    const results = {};

    // Tüm para birimlerini döngü ile gez
    for (const { url, key } of currencyData) {
        try {
            const response = await axios.get(url);
            const html = response.data;
            const $ = cheerio.load(html);
            
            // İlgili elementi bul ve değerini al
            const element = $(`div[data-socket-key="${key}"][data-socket-attr="s"]`);
            const value = element.text().trim();
            results[key] = value; // Sonuçları güncelle
        } catch (error) {
            console.error(`${url}: Hata: ${error.message}`);
        }
    }

    return results; // Sonuçları döndür
};


// Petrol Ofisi verilerini çekmek için bir fonksiyon
const fetchAllPetrolOfisiData = async () => {
    const results = [];

    for (const { url } of petrolOfisiData) {
        try {
            const response = await axios.get(url);
            const html = response.data;
            const $ = cheerio.load(html);

            // `fuel-items` sınıfına sahip tüm div etiketlerini seç
            $('.fuel-items .price-row').each((index, element) => {
                const cityName = $(element).find('td').first().text().trim(); // Şehir ismi
                const petrolPrice = $(element).find('td').eq(1).find('.with-tax').text().trim(); // V/Max Kurşunsuz 95 fiyatı
                const dieselPrice = $(element).find('td').eq(2).find('.with-tax').text().trim(); // V/Max Diesel fiyatı
                const proDieselPrice = $(element).find('td').eq(3).find('.with-tax').text().trim(); // V/Pro Diesel fiyatı
                const autogasPrice = $(element).find('td').eq(4).find('.with-tax').text().trim(); // PO/gaz Otogaz fiyatı

                // Sonuçları ekle
                results.push({
                    city: cityName,
                    petrolPrice: petrolPrice,
                    dieselPrice: dieselPrice,
                    proDieselPrice: proDieselPrice,
                    autogasPrice: autogasPrice
                });
            });
        } catch (error) {
            console.error(`${url}: Hata: ${error.message}`);
        }
    }

    return results; // Tüm sonuçları döndür
};


// Opet verilerini çekmek için bir fonksiyon
const fetchOpetData = async () => {
    try {
        const response = await axios.get('https://api.opet.com.tr/api/fuelprices/allprices');
        const petrolPrices = response.data;

        // Verileri konsola yazdırma
        console.log(JSON.stringify(petrolPrices, null, 2));
        return petrolPrices;
    } catch (error) {
        console.error('Hata:', error.message);
    }
};

process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
const https = require("https");
const agent = new https.Agent({ rejectUnauthorized: false });

const totallink = "https://apimobiletest.oyakpetrol.com.tr/exapi/fuel_prices";
const cityLink = "https://apimobiletest.oyakpetrol.com.tr/exapi/fuel_price_cities";

// TOTAL verilerini çekmek için bir fonksiyon
const fetchTotalPrices = async () => {
    try {
      // Şehir bilgilerini çek
      const citiesResponse = await axios.get(cityLink, { httpsAgent: agent });
      const cities = citiesResponse.data;
  
      const datas = [];
      for (const city of cities) {
        // Her şehir için fiyat bilgisini çek
        const response = await axios.get(`${totallink}/${city.city_id}`, { httpsAgent: agent });
  
        // "MERKEZ" verisini bul, yoksa ilk elemanı al
        const merkezData =
          response.data.find((entry) => entry.county_name === "MERKEZ") ||
          response.data[0];
  
        if (merkezData) {
          datas.push({
            city_name: city.city_name,
            city_id: city.city_id,
            ...merkezData,
          });
        }
      }
  
      return datas;
    } catch (error) {
      console.error("Error occurred while fetching TOTAL prices:", error);
      throw new Error("TOTAL fiyatlarını çekerken bir hata oluştu.");
    }
};


const bplink = "https://www.bp.com/bp-tr-pump-prices/api/PumpPrices";

/**
 * BP fiyatlarını çeken fonksiyon.
 * Merkez verisi varsa onu, yoksa ilk veriyi döner.
 * @returns {Promise<Array>} Şehirlerin BP fiyatları.
 */
const fetchBPPrices = async () => {
    try {
      const datas = [];
      for (const city of Tcities) {
        const response = await axios.get(`${bplink}?strCity=${city}`);
        
        // response.data'nın bir dizi olup olmadığını kontrol et
        if (Array.isArray(response.data)) {
          // "MERKEZ" bölgesini bulmaya çalışıyoruz
          const merkezData = response.data.find((district) => district.District === "MERKEZ");
          
          // Eğer "MERKEZ" yoksa, ilk veriyi alıyoruz
          const finalData = merkezData || response.data[0];
          
          datas.push(finalData);
        } else {
          console.warn(`Veri dizisi bekleniyordu, ancak alındı: ${JSON.stringify(response.data)}`);
          // Burada response.data'yı bir hata mesajı olarak dönebiliriz
        }
      }
      return datas;
    } catch (error) {
      console.error("Error occurred while fetching BP prices:", error);
      throw new Error("BP fiyatlarını çekerken bir hata oluştu.");
    }
  };
  

  

// Döviz verilerini almak için endpoint
app.get('/exchange-rates', async (req, res) => {
    try {
        const rates = await fetchAllData();
        res.json(rates);
        console.log(rates);
    } catch (error) {
        console.error('Döviz verileri alınamadı:', error);
        res.status(500).send('Döviz verileri alınamadı.');
    }
});

// Akaryakıt verilerini almak için endpoint
app.get('/petrolOfisi-prices', async (req, res) => {
    try {
        const petrolPrices = await fetchAllPetrolOfisiData();
        res.json(petrolPrices);
        // console.log(petrolPrices);
    } catch (error) {
        console.error('Akaryakıt verileri alınamadı:', error);
        res.status(500).send('Akaryakıt verileri alınamadı.');
    }
});

app.get('/po', async (req, res) => {
  try {
      const petrolPrices = await fetchAllPetrolOfisiData();
      res.json(petrolPrices);
  } catch (error) {
      console.error('Akaryakıt verileri alınamadı:', error);
      res.status(500).send('Akaryakıt verileri alınamadı.');
  }
});

app.get('/po/AFYONKARAHISAR', async (req, res) => {
    try {
        const response = await fetch('https://petrol-prices-scraping.vercel.app/po/AFYON');
        const petrolPrices = await response.json();
        res.json(petrolPrices);
    } catch (error) {
        console.error('Akaryakıt verileri alınamadı:', error);
        res.status(500).send('Akaryakıt verileri alınamadı.');
    }
});


app.get('/po/:city', async (req, res) => {
  try {
      const city = req.params.city.toUpperCase();
      const petrolPrices = await fetchAllPetrolOfisiData();

      // Şehre göre sonuçları filtrele
      const cityPetrolPrices = petrolPrices.filter(p => p.city === city);

      if (cityPetrolPrices.length === 0) {
          console.warn(`No petrol prices found for city ${city}`);
          res.status(404).send(`No petrol prices found for city ${city}`);
      } else {
          res.json(cityPetrolPrices);
      }
  } catch (error) {
      console.error(`Akaryakıt verileri ${city} için alınamadı:`, error);
      res.status(500).send(`Akaryakıt verileri ${city} için alınamadı.`);
  }
});

app.get('/opet-prices', async (req, res) => {
    try {
        const petrolPrices = await fetchOpetData();
        res.json(petrolPrices);
    } catch (error) {
        console.error('Akaryakıt verileri alınamadı:', error);
        res.status(500).send('Akaryakıt verileri alınamadı.');
    }
});

app.get('/op', async (req, res) => {
  try {
      const petrolPrices = await fetchOpetData();
      res.json(petrolPrices);
  } catch (error) {
      console.error('Akaryakıt verileri alınamadı:', error);
      res.status(500).send('Akaryakıt verileri alınamadı.');
  }
});

app.get('/op/:city', async (req, res) => {
  try {
      const city = req.params.city;
      const opetPrices = await fetchOpetData();

      // Şehre göre sonuçları filtrele
      const cityOpetPrices = opetPrices.filter(p => p.provinceName.toLowerCase() === city.toLowerCase());

      if (cityOpetPrices.length === 0) {
          console.warn(`No petrol prices found for city ${city}`);
          res.status(404).send(`No petrol prices found for city ${city}`);
      } else {
          res.json(cityOpetPrices[0].prices);
      }
  } catch (error) {
      console.error(`Petrol verileri ${city} için alınamadı:`, error);
      res.status(500).send(`Petrol verileri ${city} için alınamadı.`);
  }
});

app.get("/total-prices", async (req, res) => {
    try {
      const data = await fetchTotalPrices();
      res.json(data);
    } catch (error) {
      res.status(500).send(error.message);
    }
});

app.get("/tot", async (req, res) => {
    try {
      const data = await fetchTotalPrices();
      res.json(data);
    } catch (error) {
      res.status(500).send(error.message);
    }
});

app.get("/tot/:city", async (req, res) => {
    try {
      const city = req.params.city.toUpperCase(); // Gelen şehir parametresini büyük harfe çevir
      const totalPrices = await fetchTotalPrices(); // TOTAL verilerini çek
  
      // Şehre göre sonuçları filtrele
      const cityTotalPrices = totalPrices.filter(
        (p) => p.city_name.toUpperCase() === city
      );
  
      if (cityTotalPrices.length === 0) {
        console.warn(`No fuel prices found for city ${city}`);
        res.status(404).send(`No fuel prices found for city ${city}`);
      } else {
        res.json(cityTotalPrices[0]); // Şehirle eşleşen ilk sonucu döndür
      }
    } catch (error) {
      console.error(`Fuel data could not be fetched for city ${city}:`, error);
      res.status(500).send(`Fuel data could not be fetched for city ${city}.`);
    }
});
  

app.get("/bp-prices", async (req, res) => {
    try {
      const datas = await fetchBPPrices();
      res.json(datas);
    } catch (error) {
      res.status(500).send(error.message);
    }
});
  
app.get("/bp", async (req, res) => {
    try {
      const datas = await fetchBPPrices();
      res.json(datas);
    } catch (error) {
      res.status(500).send(error.message);
    }
});

app.get("/bp/:city", async (req, res) => {
    try {
      const city = req.params.city.toUpperCase(); // Gelen şehir parametresini büyük harfe çevir
      const datas = await fetchBPPrices(); // BP fiyatlarını çek
  
      // Şehre göre sonuçları filtrele
      const cityBPPrices = datas.filter(
        (data) => data.City.toUpperCase() === city
      );
  
      if (cityBPPrices.length === 0) {
        console.warn(`No fuel prices found for city ${city}`);
        res.status(404).send(`No fuel prices found for city ${city}`);
      } else {
        res.json(cityBPPrices[0]); // Şehirle eşleşen ilk sonucu döndür
      }
    } catch (error) {
      console.error(`Fuel data could not be fetched for city ${city}:`, error);
      res.status(500).send(`Fuel data could not be fetched for city ${city}.`);
    }
  });
  

// Sunucuyu başlat
app.listen(PORT, () => {
    console.log(`Sunucu http://localhost:${PORT} adresinde çalışıyor`);
    setInterval(fetchAllData, 10000); // Her 10 saniyede bir verileri güncelle
});
