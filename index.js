const express = require('express');
const axios = require('axios');
// const nodemon = require('nodemon');
const cheerio = require('cheerio');
const cors = require('cors');
const _ = require('lodash');
const app = express();
const PORT = 3000;


app.use(cors()); // CORS'u etkinleştir

// const Tcities = [
//     "ADANA", "ADIYAMAN", "AFYONKARAHİSAR", "AĞRI", "AKSARAY", 
//     "AMASYA", "ANKARA", "ANTALYA", "ARTVİN", "AYDIN", 
//     "BALIKESİR", "BARTIN", "BATMAN", "BAYBURT", "BİLECİK", 
//     "BİNGÖL", "BİTLİS", "BOLU", "BURDUR", "BURSA", 
//     "ÇANAKKALE", "ÇANKIRI", "ÇORUM", "DENİZLİ", "DİYARBAKIR", 
//     "DÜZCE", "EDİRNE", "ELAZIĞ", "ERZİNCAN", "ERZURUM", 
//     "ESKİŞEHİR", "GAZİANTEP", "GİRESUN", "GÜMÜŞHANE", "HAKKARİ", 
//     "HATAY", "ISPARTA", "İSTANBUL (ANADOLU)", "İSTANBUL (AVRUPA)", "İZMİR", 
//     "KAHRAMANMARAŞ", "KARABÜK", "KARAMAN", "KARS", "KASTAMONU", 
//     "KAYSERİ", "KİLİS", "KIRIKKALE", "KIRKLARELİ", "KIRŞEHİR", 
//     "KOCAELİ", "KONYA", "KÜTAHYA", "MALATYA", "MANİSA", 
//     "MARDİN", "MERSİN", "MUĞLA", "MUŞ", "NEVŞEHİR", 
//     "NİĞDE", "ORDU", "OSMANİYE", "RİZE", "SAKARYA", 
//     "SAMSUN", "ŞANLIURFA", "SİİRT", "SİNOP", "ŞIRNAK", 
//     "SİVAS", "TEKİRDAĞ", "TOKAT", "TRABZON", "TUNCELİ", 
//     "UŞAK", "VAN", "YALOVA", "YOZGAT", "ZONGULDAK"
// ];

// URL ve para birimleri
const currencyData = [
    { url: 'https://kur.doviz.com/serbest-piyasa/amerikan-dolari', key: 'USD' }, // Dolar
    { url: 'https://kur.doviz.com/serbest-piyasa/euro', key: 'EUR' },           // Euro
    { url: 'https://kur.doviz.com/serbest-piyasa/sterlin', key: 'GBP' }         // Sterlin
];

const petrolOfisiData = [
    { url: 'https://www.petrolofisi.com.tr/akaryakit-fiyatlari', key: '' }
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


// const bplink = "https://www.bp.com/bp-tr-pump-prices/api/PumpPrices";
// app.get("/bp-prices", async (req, res) => {
//   try {
//     const datas = [];
//     for (let index = 0; index < Tcities.length; index++) {
//       const response = await axios.get(`${bplink}?strCity=${Tcities[index]}`);
//       const merkezData = response.data.find(
//         (district) => district.District === "MERKEZ"
//       ); // Get only the 'MERKEZ' district
//       if (merkezData) {
//         datas.push(merkezData); // Push only the 'MERKEZ' district data
//       } else {
//         datas.push(response.data[0]); // Push the first district if 'MERKEZ' is not found
//       }
//     }
//     res.json(datas);
//   } catch (error) {
//     console.error(error);
//     res.status(500).send("Error occurred while fetching BP prices");
//   }
// });


process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

const totallink = "https://apimobiletest.oyakpetrol.com.tr/exapi/fuel_prices";

app.get("/total-prices", async (req, res) => {
  try {
    const response = await axios.get(totallink);
    const data = response.data;

    // "MERKEZ" olan verileri filtreleyelim
    const merkezData = data.filter((entry) => entry.county_name === "MERKEZ");

    res.json(merkezData); // Filtrelenmiş veriyi JSON olarak döndür
  } catch (error) {
    console.error(error);
    res.status(500).send("Error occurred while fetching TOTAL prices");
  }
});




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
      const petrolPrices = await axios.get(`https://petrol-prices-scraping.vercel.app/petrolOfisi-prices`);
      // const petrolPrices = await axios.get('http://localhost:3000/petrolOfisi-prices');
      const plainPetrolPrices = _.cloneDeep(petrolPrices.data);
      res.json(plainPetrolPrices);
    } catch (error) {
      console.error('Akaryakıt verileri alınamadı:', error);
      res.status(500).send('Akaryakıt verileri alınamadı.');
    }
});
  
app.get('/po/:city', async (req, res) => {
    try {
      const city = req.params.city.toUpperCase();
      const petrolPrices = await axios.get(`https://petrol-prices-scraping.vercel.app/petrolOfisi-prices?city=${city}`);
      // const petrolPrices = await axios.get(`http://localhost:3000/petrolOfisi-prices?city=${city}`);
      const plainPetrolPrices = _.cloneDeep(petrolPrices.data);
  
      // Filter results by city
      const cityPetrolPrices = plainPetrolPrices.filter(p => p.city === city);
  
      if (cityPetrolPrices.length === 0) {
        console.warn(`No petrol prices found for city ${city}`);
        res.status(404).send(`No petrol prices found for city ${city}`);
      } else {
        res.json(cityPetrolPrices);
      }
    } catch (error) {
      city = city || '<unknown>';
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
      const petrolPrices = await axios.get(`https://petrol-prices-scraping.vercel.app/opet-prices`);
      // const petrolPrices = await axios.get('http://localhost:3000/opet-prices');
      const plainPetrolPrices = _.cloneDeep(petrolPrices.data);
      res.json(plainPetrolPrices);
    } catch (error) {
      console.error('Akaryakıt verileri alınamadı:', error);
      res.status(500).send('Akaryakıt verileri alınamadı.');
    }
});

app.get('/op/:city', async (req, res) => {
    try {
      const city = req.params.city;
      const opetPrices = await axios.get(`https://petrol-prices-scraping.vercel.app/opet-prices`);
      // const opetPrices = await axios.get('http://localhost:3000/opet-prices');
      const plainOpetPrices = _.cloneDeep(opetPrices.data);
  
      // Filter results by city
      const cityOpetPrices = plainOpetPrices.filter(p => p.provinceName.toLowerCase() === city.toLowerCase());
  
      if (cityOpetPrices.length === 0) {
        console.warn(`No petrol prices found for city ${city}`);
        res.status(404).send(`No petrol prices found for city ${city}`);
      } else {
        res.json(cityOpetPrices[0].prices);
      }
    } catch (error) {
        city = city || '<unknown>';
        console.error(`Petrol verileri ${city} için alınamadı:`, error);
        res.status(500).send(`Petrol verileri ${city} için alınamadı.`);
      }
  });
  


// Sunucuyu başlat
app.listen(PORT, () => {
    console.log(`Sunucu http://localhost:${PORT} adresinde çalışıyor`);
    setInterval(fetchAllData, 10000); // Her 10 saniyede bir verileri güncelle
});
