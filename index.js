const express = require('express');
const axios = require('axios');
// const nodemon = require('nodemon');
const cheerio = require('cheerio');
const cors = require('cors');
const puppeteer = require('puppeteer');

const app = express();
const PORT = 3000;

process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0"; 
const https = require("https");
const agent = new https.Agent({ rejectUnauthorized: false });

app.use(cors()); // CORS'u etkinleştir

const Tcities = [
    "ADANA", "ADIYAMAN", "AFYONKARAHİSAR", "AĞRI", "AKSARAY", 
    "AMASYA", "ANKARA", "ANTALYA", "ARTVİN", "AYDIN", 
    "BALIKESİR", "BARTIN", "BATMAN", "BAYBURT", "BİLECİK", 
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

const fetchAllOpetData = async () => {
    const results = [];
    const urls = [
        'https://www.opet.com.tr/akaryakit-fiyatlari',
        // Diğer URL'ler buraya ekleyin
    ];

    const browser = await puppeteer.launch();

    for (const url of urls) {
        try {
            console.log(`Çalışılan URL: ${url}`);
            const page = await browser.newPage();
            await page.goto(url, { waitUntil: 'domcontentloaded' });
            await page.waitForSelector('.table-radius'); // Tablonun yüklendiğinden emin olun
            
            const html = await page.content();
            const $ = cheerio.load(html);

            $('.table-radius tbody tr').each((index, element) => {
                let cityName = $(element).find('td').eq(0).find('span.ml-auto').text().trim();
                let prices = {};

                const fuelTypes = ['Kurşunsuz Benzin 95', 'Motorin UltraForce', 'Motorin EcoForce', 'Gazyağı', 'Fuel Oil', 'Yüksek Kükürtlü Fuel Oil', 'Kalorifer Yakıtı'];
                fuelTypes.forEach((fuelType, idx) => {
                    const price = $(element).find('td').eq(idx + 2).find('span.ml-auto').text().trim();
                    if (price) {
                        prices[fuelType] = price;
                        console.log(`${fuelType}: ${price}`);
                    } else {
                        console.log(`${fuelType} bulunamadı`);
                    }
                });

                results.push({ cityName, ...prices });
            });

            console.log(`Tüm elemanlar işlendi`);

            await page.close();
        } catch (error) {
            console.error(`${url}: Hata: ${error.message}`);
        }
    }

    await browser.close();
    console.log("İşlem tamamlandı. Sonuçlar:", results);
    return results;
};

fetchAllOpetData();


const bplink = "https://www.bp.com/bp-tr-pump-prices/api/PumpPrices";
app.get("/bp-prices", async (req, res) => {
  try {
    const datas = [];
    for (let index = 0; index < Tcities.length; index++) {
      const response = await axios.get(`${bplink}?strCity=${Tcities[index]}`);
      const merkezData = response.data.find(
        (district) => district.District === "MERKEZ"
      ); // Get only the 'MERKEZ' district
      if (merkezData) {
        datas.push(merkezData); // Push only the 'MERKEZ' district data
      } else {
        datas.push(response.data[0]); // Push the first district if 'MERKEZ' is not found
      }
    }
    res.json(datas);
  } catch (error) {
    console.error(error);
    res.status(500).send("Error occurred while fetching BP prices");
  }
});


const totallink = "https://apimobiletest.oyakpetrol.com.tr/exapi/fuel_prices";
const cityLink = "https://apimobiletest.oyakpetrol.com.tr/exapi/fuel_price_cities";

app.get("/total-prices", async (req, res) => {
  try {
    const citiesResponse = await axios.get(cityLink, { httpsAgent: agent });
    const cities = citiesResponse.data;
    
    const datas = [];
    for (const city of cities) {
      const response = await axios.get(`${totallink}/${city.city_id}`);
      
      const merkezData = response.data.find(
        (entry) => entry.county_name === "MERKEZ"
      );

      if (merkezData) {
        datas.push({
          city_name: city.city_name,
          city_id: city.city_id,
          ...merkezData
        });
      }
    }
    
    res.json(datas);
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
        console.log(petrolPrices);
    } catch (error) {
        console.error('Akaryakıt verileri alınamadı:', error);
        res.status(500).send('Akaryakıt verileri alınamadı.');
    }
});

app.get('/opet-prices', async (req, res) => {
    try {
        const petrolPrices = await fetchAllOpetData();
        res.json(petrolPrices);
        console.log(petrolPrices);
    } catch (error) {
        console.error('Akaryakıt verileri alınamadı:', error);
        res.status(500).send('Akaryakıt verileri alınamadı.');
    }
});

// Sunucuyu başlat
app.listen(PORT, () => {
    console.log(`Sunucu http://localhost:${PORT} adresinde çalışıyor`);
    setInterval(fetchAllData, 10000); // Her 10 saniyede bir verileri güncelle
});