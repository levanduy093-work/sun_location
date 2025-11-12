export const LOCATION_CATALOG = {
  vietnam: {
    name: "Việt Nam",
    defaultTimezone: "Asia/Ho_Chi_Minh",
    cities: {
      hcm: { name: "TP. Hồ Chí Minh", latitude: 10.8231, longitude: 106.6297, altitude: 19 },
      hanoi: { name: "Hà Nội", latitude: 21.0278, longitude: 105.8342, altitude: 10 },
      danang: { name: "Đà Nẵng", latitude: 16.0471, longitude: 108.2068, altitude: 5 },
      hue: { name: "Huế", latitude: 16.4637, longitude: 107.5909, altitude: 5 },
      nha_trang: { name: "Nha Trang", latitude: 12.2451, longitude: 109.1943, altitude: 12 },
      can_tho: { name: "Cần Thơ", latitude: 10.0452, longitude: 105.7469, altitude: 5 },
    },
  },
  japan: {
    name: "Nhật Bản",
    defaultTimezone: "Asia/Tokyo",
    cities: {
      tokyo: { name: "Tokyo", latitude: 35.6762, longitude: 139.6503, altitude: 40 },
      osaka: { name: "Osaka", latitude: 34.6937, longitude: 135.5023, altitude: 15 },
      kyoto: { name: "Kyoto", latitude: 35.0116, longitude: 135.7681, altitude: 50 },
      sapporo: { name: "Sapporo", latitude: 43.0618, longitude: 141.3545, altitude: 26 },
      fukuoka: { name: "Fukuoka", latitude: 33.5904, longitude: 130.4017, altitude: 10 },
    },
  },
  australia: {
    name: "Úc",
    defaultTimezone: "Australia/Sydney",
    cities: {
      sydney: { name: "Sydney", latitude: -33.8688, longitude: 151.2093, altitude: 58, timezone: "Australia/Sydney" },
      melbourne: { name: "Melbourne", latitude: -37.8136, longitude: 144.9631, altitude: 31, timezone: "Australia/Melbourne" },
      brisbane: { name: "Brisbane", latitude: -27.4698, longitude: 153.0251, altitude: 27, timezone: "Australia/Brisbane" },
      perth: { name: "Perth", latitude: -31.9523, longitude: 115.8613, altitude: 25, timezone: "Australia/Perth" },
      adelaide: { name: "Adelaide", latitude: -34.9285, longitude: 138.6007, altitude: 48, timezone: "Australia/Adelaide" },
    },
  },
  usa: {
    name: "Hoa Kỳ",
    defaultTimezone: "America/New_York",
    cities: {
      new_york: { name: "New York", latitude: 40.7128, longitude: -74.006, altitude: 10, timezone: "America/New_York" },
      los_angeles: { name: "Los Angeles", latitude: 34.0522, longitude: -118.2437, altitude: 71, timezone: "America/Los_Angeles" },
      chicago: { name: "Chicago", latitude: 41.8781, longitude: -87.6298, altitude: 181, timezone: "America/Chicago" },
      houston: { name: "Houston", latitude: 29.7604, longitude: -95.3698, altitude: 13, timezone: "America/Chicago" },
      denver: { name: "Denver", latitude: 39.7392, longitude: -104.9903, altitude: 1609, timezone: "America/Denver" },
      san_francisco: { name: "San Francisco", latitude: 37.7749, longitude: -122.4194, altitude: 16, timezone: "America/Los_Angeles" },
    },
  },
  germany: {
    name: "Đức",
    defaultTimezone: "Europe/Berlin",
    cities: {
      berlin: { name: "Berlin", latitude: 52.52, longitude: 13.405, altitude: 34 },
      munich: { name: "Munich", latitude: 48.1351, longitude: 11.582, altitude: 519 },
      frankfurt: { name: "Frankfurt", latitude: 50.1109, longitude: 8.6821, altitude: 112 },
      hamburg: { name: "Hamburg", latitude: 53.5511, longitude: 9.9937, altitude: 7 },
      cologne: { name: "Cologne", latitude: 50.9375, longitude: 6.9603, altitude: 37 },
    },
  },
  canada: {
    name: "Canada",
    defaultTimezone: "America/Toronto",
    cities: {
      toronto: { name: "Toronto", latitude: 43.6532, longitude: -79.3832, altitude: 76, timezone: "America/Toronto" },
      vancouver: { name: "Vancouver", latitude: 49.2827, longitude: -123.1207, altitude: 2, timezone: "America/Vancouver" },
      montreal: { name: "Montréal", latitude: 45.5017, longitude: -73.5673, altitude: 36, timezone: "America/Toronto" },
      calgary: { name: "Calgary", latitude: 51.0447, longitude: -114.0719, altitude: 1045, timezone: "America/Edmonton" },
      ottawa: { name: "Ottawa", latitude: 45.4215, longitude: -75.6972, altitude: 70, timezone: "America/Toronto" },
    },
  },
  india: {
    name: "Ấn Độ",
    defaultTimezone: "Asia/Kolkata",
    cities: {
      new_delhi: { name: "New Delhi", latitude: 28.6139, longitude: 77.209, altitude: 216 },
      mumbai: { name: "Mumbai", latitude: 19.076, longitude: 72.8777, altitude: 14 },
      bengaluru: { name: "Bengaluru", latitude: 12.9716, longitude: 77.5946, altitude: 920 },
      chennai: { name: "Chennai", latitude: 13.0827, longitude: 80.2707, altitude: 6 },
      kolkata: { name: "Kolkata", latitude: 22.5726, longitude: 88.3639, altitude: 9 },
    },
  },
  united_kingdom: {
    name: "Vương quốc Anh",
    defaultTimezone: "Europe/London",
    cities: {
      london: { name: "London", latitude: 51.5072, longitude: -0.1276, altitude: 11 },
      manchester: { name: "Manchester", latitude: 53.4808, longitude: -2.2426, altitude: 38 },
      birmingham: { name: "Birmingham", latitude: 52.4862, longitude: -1.8904, altitude: 140 },
      glasgow: { name: "Glasgow", latitude: 55.8642, longitude: -4.2518, altitude: 40 },
      edinburgh: { name: "Edinburgh", latitude: 55.9533, longitude: -3.1883, altitude: 47 },
    },
  },
  south_korea: {
    name: "Hàn Quốc",
    defaultTimezone: "Asia/Seoul",
    cities: {
      seoul: { name: "Seoul", latitude: 37.5665, longitude: 126.978, altitude: 38 },
      busan: { name: "Busan", latitude: 35.1796, longitude: 129.0756, altitude: 6 },
      incheon: { name: "Incheon", latitude: 37.4563, longitude: 126.7052, altitude: 2 },
      daegu: { name: "Daegu", latitude: 35.8714, longitude: 128.6014, altitude: 50 },
      daejeon: { name: "Daejeon", latitude: 36.3504, longitude: 127.3845, altitude: 70 },
    },
  },
  china: {
    name: "Trung Quốc",
    defaultTimezone: "Asia/Shanghai",
    cities: {
      beijing: { name: "Bắc Kinh", latitude: 39.9042, longitude: 116.4074, altitude: 44 },
      shanghai: { name: "Thượng Hải", latitude: 31.2304, longitude: 121.4737, altitude: 4 },
      guangzhou: { name: "Quảng Châu", latitude: 23.1291, longitude: 113.2644, altitude: 21 },
      shenzhen: { name: "Thâm Quyến", latitude: 22.5431, longitude: 114.0579, altitude: 6 },
      chengdu: { name: "Thành Đô", latitude: 30.5728, longitude: 104.0668, altitude: 500 },
    },
  },
  singapore: {
    name: "Singapore",
    defaultTimezone: "Asia/Singapore",
    cities: {
      singapore: { name: "Singapore", latitude: 1.3521, longitude: 103.8198, altitude: 15 },
    },
  },
  thailand: {
    name: "Thái Lan",
    defaultTimezone: "Asia/Bangkok",
    cities: {
      bangkok: { name: "Bangkok", latitude: 13.7563, longitude: 100.5018, altitude: 1 },
      chiang_mai: { name: "Chiang Mai", latitude: 18.7883, longitude: 98.9853, altitude: 310 },
      phuket: { name: "Phuket", latitude: 7.8804, longitude: 98.3923, altitude: 3 },
      pattaya: { name: "Pattaya", latitude: 12.9236, longitude: 100.8825, altitude: 2 },
    },
  },
  malaysia: {
    name: "Malaysia",
    defaultTimezone: "Asia/Kuala_Lumpur",
    cities: {
      kuala_lumpur: { name: "Kuala Lumpur", latitude: 3.139, longitude: 101.6869, altitude: 21 },
      george_town: { name: "George Town", latitude: 5.4141, longitude: 100.3288, altitude: 4 },
      johor_bahru: { name: "Johor Bahru", latitude: 1.4927, longitude: 103.7414, altitude: 36 },
      kota_kinabalu: { name: "Kota Kinabalu", latitude: 5.9804, longitude: 116.0735, altitude: 5 },
    },
  },
  indonesia: {
    name: "Indonesia",
    defaultTimezone: "Asia/Jakarta",
    cities: {
      jakarta: { name: "Jakarta", latitude: -6.2088, longitude: 106.8456, altitude: 8 },
      surabaya: { name: "Surabaya", latitude: -7.2575, longitude: 112.7521, altitude: 5 },
      bandung: { name: "Bandung", latitude: -6.9175, longitude: 107.6191, altitude: 768 },
      bali: { name: "Denpasar", latitude: -8.6705, longitude: 115.2126, altitude: 45, timezone: "Asia/Makassar" },
    },
  },
  philippines: {
    name: "Philippines",
    defaultTimezone: "Asia/Manila",
    cities: {
      manila: { name: "Manila", latitude: 14.5995, longitude: 120.9842, altitude: 16 },
      cebu: { name: "Cebu", latitude: 10.3157, longitude: 123.8854, altitude: 5 },
      davao: { name: "Davao", latitude: 7.1907, longitude: 125.4553, altitude: 22 },
      baguio: { name: "Baguio", latitude: 16.4023, longitude: 120.596, altitude: 1450 },
    },
  },
  france: {
    name: "Pháp",
    defaultTimezone: "Europe/Paris",
    cities: {
      paris: { name: "Paris", latitude: 48.8566, longitude: 2.3522, altitude: 35 },
      lyon: { name: "Lyon", latitude: 45.764, longitude: 4.8357, altitude: 162 },
      marseille: { name: "Marseille", latitude: 43.2965, longitude: 5.3698, altitude: 28 },
      toulouse: { name: "Toulouse", latitude: 43.6047, longitude: 1.4442, altitude: 146 },
      nice: { name: "Nice", latitude: 43.7102, longitude: 7.262, altitude: 10 },
    },
  },
  spain: {
    name: "Tây Ban Nha",
    defaultTimezone: "Europe/Madrid",
    cities: {
      madrid: { name: "Madrid", latitude: 40.4168, longitude: -3.7038, altitude: 667 },
      barcelona: { name: "Barcelona", latitude: 41.3874, longitude: 2.1686, altitude: 12 },
      valencia: { name: "Valencia", latitude: 39.4699, longitude: -0.3763, altitude: 15 },
      seville: { name: "Seville", latitude: 37.3891, longitude: -5.9845, altitude: 7 },
      bilbao: { name: "Bilbao", latitude: 43.263, longitude: -2.9349, altitude: 19 },
    },
  },
  italy: {
    name: "Ý",
    defaultTimezone: "Europe/Rome",
    cities: {
      rome: { name: "Rome", latitude: 41.9028, longitude: 12.4964, altitude: 21 },
      milan: { name: "Milan", latitude: 45.4642, longitude: 9.19, altitude: 120 },
      florence: { name: "Florence", latitude: 43.7696, longitude: 11.2558, altitude: 50 },
      naples: { name: "Naples", latitude: 40.8518, longitude: 14.2681, altitude: 17 },
      venice: { name: "Venice", latitude: 45.4408, longitude: 12.3155, altitude: 2 },
    },
  },
  brazil: {
    name: "Brazil",
    defaultTimezone: "America/Sao_Paulo",
    cities: {
      sao_paulo: { name: "São Paulo", latitude: -23.5505, longitude: -46.6333, altitude: 760 },
      rio_de_janeiro: { name: "Rio de Janeiro", latitude: -22.9068, longitude: -43.1729, altitude: 5 },
      brasilia: { name: "Brasília", latitude: -15.8267, longitude: -47.9218, altitude: 1172 },
      salvador: { name: "Salvador", latitude: -12.9777, longitude: -38.5016, altitude: 8 },
      recife: { name: "Recife", latitude: -8.0476, longitude: -34.877, altitude: 10 },
    },
  },
  mexico: {
    name: "Mexico",
    defaultTimezone: "America/Mexico_City",
    cities: {
      mexico_city: { name: "Mexico City", latitude: 19.4326, longitude: -99.1332, altitude: 2250 },
      guadalajara: { name: "Guadalajara", latitude: 20.6597, longitude: -103.3496, altitude: 1566 },
      monterrey: { name: "Monterrey", latitude: 25.6866, longitude: -100.3161, altitude: 540 },
      cancun: { name: "Cancún", latitude: 21.1619, longitude: -86.8515, altitude: 10, timezone: "America/Cancun" },
    },
  },
  argentina: {
    name: "Argentina",
    defaultTimezone: "America/Argentina/Buenos_Aires",
    cities: {
      buenos_aires: { name: "Buenos Aires", latitude: -34.6037, longitude: -58.3816, altitude: 25 },
      cordoba: { name: "Córdoba", latitude: -31.4201, longitude: -64.1888, altitude: 402 },
      rosario: { name: "Rosario", latitude: -32.9442, longitude: -60.6505, altitude: 25 },
      mendoza: { name: "Mendoza", latitude: -32.8895, longitude: -68.8458, altitude: 746 },
    },
  },
  south_africa: {
    name: "Nam Phi",
    defaultTimezone: "Africa/Johannesburg",
    cities: {
      johannesburg: { name: "Johannesburg", latitude: -26.2041, longitude: 28.0473, altitude: 1753 },
      cape_town: { name: "Cape Town", latitude: -33.9249, longitude: 18.4241, altitude: 25 },
      durban: { name: "Durban", latitude: -29.8587, longitude: 31.0218, altitude: 8 },
      pretoria: { name: "Pretoria", latitude: -25.7479, longitude: 28.2293, altitude: 1339 },
    },
  },
  united_arab_emirates: {
    name: "UAE",
    defaultTimezone: "Asia/Dubai",
    cities: {
      dubai: { name: "Dubai", latitude: 25.2048, longitude: 55.2708, altitude: 16 },
      abu_dhabi: { name: "Abu Dhabi", latitude: 24.4539, longitude: 54.3773, altitude: 27 },
      sharjah: { name: "Sharjah", latitude: 25.3463, longitude: 55.4209, altitude: 8 },
      al_ain: { name: "Al Ain", latitude: 24.1302, longitude: 55.8023, altitude: 292 },
    },
  },
  turkey: {
    name: "Thổ Nhĩ Kỳ",
    defaultTimezone: "Europe/Istanbul",
    cities: {
      istanbul: { name: "Istanbul", latitude: 41.0082, longitude: 28.9784, altitude: 39 },
      ankara: { name: "Ankara", latitude: 39.9334, longitude: 32.8597, altitude: 938 },
      izmir: { name: "Izmir", latitude: 38.4237, longitude: 27.1428, altitude: 30 },
      antalya: { name: "Antalya", latitude: 36.8969, longitude: 30.7133, altitude: 30 },
    },
  },
  new_zealand: {
    name: "New Zealand",
    defaultTimezone: "Pacific/Auckland",
    cities: {
      auckland: { name: "Auckland", latitude: -36.8485, longitude: 174.7633, altitude: 40 },
      wellington: { name: "Wellington", latitude: -41.2865, longitude: 174.7762, altitude: 13 },
      christchurch: { name: "Christchurch", latitude: -43.5321, longitude: 172.6362, altitude: 20 },
      queenstown: { name: "Queenstown", latitude: -45.0312, longitude: 168.6626, altitude: 310 },
    },
  },
};

export const DEFAULT_LOCATION = {
  country: "vietnam",
  city: "hcm",
};
