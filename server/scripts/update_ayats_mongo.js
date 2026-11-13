// Run this in mongosh or paste into MongoDB prompt
use wls-portal-db;

const res = db.ayats.bulkWrite([
  {
    updateMany: {
      filter: { surah_number: 2, ayat_number: 23 },
      update: {
        $set: {
          imageUrl: ["/quran/02/23.png"],
          imageUrls: ["/quran/02/23.png"],
          ayat_image_eng_url: ["/quran/02/23.png"],
          ayat_image_eng_urls: ["/quran/02/23.png"],
          ayat_image_urdu_url: [],
          ayat_image_urdu_urls: [],
          ayat_image_hindi_url: [],
          ayat_image_hindi_urls: []
        }
      }
    }
  },
  {
    updateMany: {
      filter: { surah_number: 2, ayat_number: 24 },
      update: {
        $set: {
          imageUrl: ["/quran/02/24.png"],
          imageUrls: ["/quran/02/24.png"],
          ayat_image_eng_url: ["/quran/02/24.png"],
          ayat_image_eng_urls: ["/quran/02/24.png"],
          ayat_image_urdu_url: [],
          ayat_image_urdu_urls: [],
          ayat_image_hindi_url: [],
          ayat_image_hindi_urls: []
        }
      }
    }
  },
  {
    updateMany: {
      filter: { surah_number: 2, ayat_number: 148 },
      update: {
        $set: {
          imageUrl: ["/quran/02/148.png"],
          imageUrls: ["/quran/02/148.png"],
          ayat_image_eng_url: ["/quran/02/148.png"],
          ayat_image_eng_urls: ["/quran/02/148.png"],
          ayat_image_urdu_url: [],
          ayat_image_urdu_urls: [],
          ayat_image_hindi_url: [],
          ayat_image_hindi_urls: []
        }
      }
    }
  },
  {
    updateMany: {
      filter: { surah_number: 2, ayat_number: 200 },
      update: {
        $set: {
          imageUrl: ["/quran/02/200.png"],
          imageUrls: ["/quran/02/200.png"],
          ayat_image_eng_url: ["/quran/02/200.png"],
          ayat_image_eng_urls: ["/quran/02/200.png"],
          ayat_image_urdu_url: [],
          ayat_image_urdu_urls: [],
          ayat_image_hindi_url: [],
          ayat_image_hindi_urls: []
        }
      }
    }
  },
  {
    updateMany: {
      filter: { surah_number: 2, ayat_number: 255 },
      update: {
        $set: {
          imageUrl: ["/quran/02/255.png"],
          imageUrls: ["/quran/02/255.png"],
          ayat_image_eng_url: ["/quran/02/255.png"],
          ayat_image_eng_urls: ["/quran/02/255.png"],
          ayat_image_urdu_url: [],
          ayat_image_urdu_urls: [],
          ayat_image_hindi_url: [],
          ayat_image_hindi_urls: []
        }
      }
    }
  },
  {
    updateMany: {
      filter: { surah_number: 3, ayat_number: 31 },
      update: {
        $set: {
          imageUrl: ["/quran/03/31.png"],
          imageUrls: ["/quran/03/31.png"],
          ayat_image_eng_url: ["/quran/03/31.png"],
          ayat_image_eng_urls: ["/quran/03/31.png"],
          ayat_image_urdu_url: [],
          ayat_image_urdu_urls: [],
          ayat_image_hindi_url: [],
          ayat_image_hindi_urls: []
        }
      }
    }
  },
  {
    updateMany: {
      filter: { surah_number: 3, ayat_number: 32 },
      update: {
        $set: {
          imageUrl: ["/quran/03/32.png"],
          imageUrls: ["/quran/03/32.png"],
          ayat_image_eng_url: ["/quran/03/32.png"],
          ayat_image_eng_urls: ["/quran/03/32.png"],
          ayat_image_urdu_url: [],
          ayat_image_urdu_urls: [],
          ayat_image_hindi_url: [],
          ayat_image_hindi_urls: []
        }
      }
    }
  },
  {
    updateMany: {
      filter: { surah_number: 4, ayat_number: 59 },
      update: {
        $set: {
          imageUrl: ["/quran/04/59.png"],
          imageUrls: ["/quran/04/59.png"],
          ayat_image_eng_url: ["/quran/04/59.png"],
          ayat_image_eng_urls: ["/quran/04/59.png"],
          ayat_image_urdu_url: [],
          ayat_image_urdu_urls: [],
          ayat_image_hindi_url: [],
          ayat_image_hindi_urls: []
        }
      }
    }
  },
  {
    updateMany: {
      filter: { surah_number: 5, ayat_number: 44 },
      update: {
        $set: {
          imageUrl: ["/quran/05/44.png"],
          imageUrls: ["/quran/05/44.png"],
          ayat_image_eng_url: ["/quran/05/44.png"],
          ayat_image_eng_urls: ["/quran/05/44.png"],
          ayat_image_urdu_url: [],
          ayat_image_urdu_urls: [],
          ayat_image_hindi_url: [],
          ayat_image_hindi_urls: []
        }
      }
    }
  },
  {
    updateMany: {
      filter: { surah_number: 6, ayat_number: 19 },
      update: {
        $set: {
          imageUrl: ["/quran/06/19.png"],
          imageUrls: ["/quran/06/19.png"],
          ayat_image_eng_url: ["/quran/06/19.png"],
          ayat_image_eng_urls: ["/quran/06/19.png"],
          ayat_image_urdu_url: [],
          ayat_image_urdu_urls: [],
          ayat_image_hindi_url: [],
          ayat_image_hindi_urls: []
        }
      }
    }
  },
  {
    updateMany: {
      filter: { surah_number: 6, ayat_number: 74 },
      update: {
        $set: {
          imageUrl: ["/quran/06/74.png"],
          imageUrls: ["/quran/06/74.png"],
          ayat_image_eng_url: ["/quran/06/74.png"],
          ayat_image_eng_urls: ["/quran/06/74.png"],
          ayat_image_urdu_url: [],
          ayat_image_urdu_urls: [],
          ayat_image_hindi_url: [],
          ayat_image_hindi_urls: []
        }
      }
    }
  },
  {
    updateMany: {
      filter: { surah_number: 6, ayat_number: 103 },
      update: {
        $set: {
          imageUrl: ["/quran/06/103.png"],
          imageUrls: ["/quran/06/103.png"],
          ayat_image_eng_url: ["/quran/06/103.png"],
          ayat_image_eng_urls: ["/quran/06/103.png"],
          ayat_image_urdu_url: [],
          ayat_image_urdu_urls: [],
          ayat_image_hindi_url: [],
          ayat_image_hindi_urls: []
        }
      }
    }
  },
  {
    updateMany: {
      filter: { surah_number: 6, ayat_number: 104 },
      update: {
        $set: {
          imageUrl: ["/quran/06/104.png"],
          imageUrls: ["/quran/06/104.png"],
          ayat_image_eng_url: ["/quran/06/104.png"],
          ayat_image_eng_urls: ["/quran/06/104.png"],
          ayat_image_urdu_url: [],
          ayat_image_urdu_urls: [],
          ayat_image_hindi_url: [],
          ayat_image_hindi_urls: []
        }
      }
    }
  },
  {
    updateMany: {
      filter: { surah_number: 7, ayat_number: 180 },
      update: {
        $set: {
          imageUrl: ["/quran/07/180.png"],
          imageUrls: ["/quran/07/180.png"],
          ayat_image_eng_url: ["/quran/07/180.png"],
          ayat_image_eng_urls: ["/quran/07/180.png"],
          ayat_image_urdu_url: [],
          ayat_image_urdu_urls: [],
          ayat_image_hindi_url: [],
          ayat_image_hindi_urls: []
        }
      }
    }
  },
  {
    updateMany: {
      filter: { surah_number: 9, ayat_number: 24 },
      update: {
        $set: {
          imageUrl: ["/quran/09/24.png"],
          imageUrls: ["/quran/09/24.png"],
          ayat_image_eng_url: ["/quran/09/24.png"],
          ayat_image_eng_urls: ["/quran/09/24.png"],
          ayat_image_urdu_url: [],
          ayat_image_urdu_urls: [],
          ayat_image_hindi_url: [],
          ayat_image_hindi_urls: []
        }
      }
    }
  },
  {
    updateMany: {
      filter: { surah_number: 9, ayat_number: 111 },
      update: {
        $set: {
          imageUrl: ["/quran/09/111.png"],
          imageUrls: ["/quran/09/111.png"],
          ayat_image_eng_url: ["/quran/09/111.png"],
          ayat_image_eng_urls: ["/quran/09/111.png"],
          ayat_image_urdu_url: [],
          ayat_image_urdu_urls: [],
          ayat_image_hindi_url: [],
          ayat_image_hindi_urls: []
        }
      }
    }
  },
  {
    updateMany: {
      filter: { surah_number: 14, ayat_number: 35 },
      update: {
        $set: {
          imageUrl: ["/quran/14/35.png"],
          imageUrls: ["/quran/14/35.png"],
          ayat_image_eng_url: ["/quran/14/35.png"],
          ayat_image_eng_urls: ["/quran/14/35.png"],
          ayat_image_urdu_url: [],
          ayat_image_urdu_urls: [],
          ayat_image_hindi_url: [],
          ayat_image_hindi_urls: []
        }
      }
    }
  },
  {
    updateMany: {
      filter: { surah_number: 14, ayat_number: 36 },
      update: {
        $set: {
          imageUrl: ["/quran/14/36.png"],
          imageUrls: ["/quran/14/36.png"],
          ayat_image_eng_url: ["/quran/14/36.png"],
          ayat_image_eng_urls: ["/quran/14/36.png"],
          ayat_image_urdu_url: [],
          ayat_image_urdu_urls: [],
          ayat_image_hindi_url: [],
          ayat_image_hindi_urls: []
        }
      }
    }
  },
  {
    updateMany: {
      filter: { surah_number: 14, ayat_number: 41 },
      update: {
        $set: {
          imageUrl: ["/quran/14/41.png"],
          imageUrls: ["/quran/14/41.png"],
          ayat_image_eng_url: ["/quran/14/41.png"],
          ayat_image_eng_urls: ["/quran/14/41.png"],
          ayat_image_urdu_url: [],
          ayat_image_urdu_urls: [],
          ayat_image_hindi_url: [],
          ayat_image_hindi_urls: []
        }
      }
    }
  },
  {
    updateMany: {
      filter: { surah_number: 15, ayat_number: 9 },
      update: {
        $set: {
          imageUrl: ["/quran/15/9.png"],
          imageUrls: ["/quran/15/9.png"],
          ayat_image_eng_url: ["/quran/15/9.png"],
          ayat_image_eng_urls: ["/quran/15/9.png"],
          ayat_image_urdu_url: [],
          ayat_image_urdu_urls: [],
          ayat_image_hindi_url: [],
          ayat_image_hindi_urls: []
        }
      }
    }
  },
  {
    updateMany: {
      filter: { surah_number: 21, ayat_number: 30 },
      update: {
        $set: {
          imageUrl: ["/quran/21/30.png"],
          imageUrls: ["/quran/21/30.png"],
          ayat_image_eng_url: ["/quran/21/30.png"],
          ayat_image_eng_urls: ["/quran/21/30.png"],
          ayat_image_urdu_url: [],
          ayat_image_urdu_urls: [],
          ayat_image_hindi_url: [],
          ayat_image_hindi_urls: []
        }
      }
    }
  },
  {
    updateMany: {
      filter: { surah_number: 21, ayat_number: 57 },
      update: {
        $set: {
          imageUrl: ["/quran/21/57.png"],
          imageUrls: ["/quran/21/57.png"],
          ayat_image_eng_url: ["/quran/21/57.png"],
          ayat_image_eng_urls: ["/quran/21/57.png"],
          ayat_image_urdu_url: [],
          ayat_image_urdu_urls: [],
          ayat_image_hindi_url: [],
          ayat_image_hindi_urls: []
        }
      }
    }
  },
  {
    updateMany: {
      filter: { surah_number: 21, ayat_number: 58 },
      update: {
        $set: {
          imageUrl: ["/quran/21/58.png"],
          imageUrls: ["/quran/21/58.png"],
          ayat_image_eng_url: ["/quran/21/58.png"],
          ayat_image_eng_urls: ["/quran/21/58.png"],
          ayat_image_urdu_url: [],
          ayat_image_urdu_urls: [],
          ayat_image_hindi_url: [],
          ayat_image_hindi_urls: []
        }
      }
    }
  },
  {
    updateMany: {
      filter: { surah_number: 21, ayat_number: 59 },
      update: {
        $set: {
          imageUrl: ["/quran/21/59.png"],
          imageUrls: ["/quran/21/59.png"],
          ayat_image_eng_url: ["/quran/21/59.png"],
          ayat_image_eng_urls: ["/quran/21/59.png"],
          ayat_image_urdu_url: [],
          ayat_image_urdu_urls: [],
          ayat_image_hindi_url: [],
          ayat_image_hindi_urls: []
        }
      }
    }
  },
  {
    updateMany: {
      filter: { surah_number: 21, ayat_number: 60 },
      update: {
        $set: {
          imageUrl: ["/quran/21/60.png"],
          imageUrls: ["/quran/21/60.png"],
          ayat_image_eng_url: ["/quran/21/60.png"],
          ayat_image_eng_urls: ["/quran/21/60.png"],
          ayat_image_urdu_url: [],
          ayat_image_urdu_urls: [],
          ayat_image_hindi_url: [],
          ayat_image_hindi_urls: []
        }
      }
    }
  },
  {
    updateMany: {
      filter: { surah_number: 21, ayat_number: 61 },
      update: {
        $set: {
          imageUrl: ["/quran/21/61.png"],
          imageUrls: ["/quran/21/61.png"],
          ayat_image_eng_url: ["/quran/21/61.png"],
          ayat_image_eng_urls: ["/quran/21/61.png"],
          ayat_image_urdu_url: [],
          ayat_image_urdu_urls: [],
          ayat_image_hindi_url: [],
          ayat_image_hindi_urls: []
        }
      }
    }
  },
  {
    updateMany: {
      filter: { surah_number: 21, ayat_number: 62 },
      update: {
        $set: {
          imageUrl: ["/quran/21/62.png"],
          imageUrls: ["/quran/21/62.png"],
          ayat_image_eng_url: ["/quran/21/62.png"],
          ayat_image_eng_urls: ["/quran/21/62.png"],
          ayat_image_urdu_url: [],
          ayat_image_urdu_urls: [],
          ayat_image_hindi_url: [],
          ayat_image_hindi_urls: []
        }
      }
    }
  },
  {
    updateMany: {
      filter: { surah_number: 21, ayat_number: 63 },
      update: {
        $set: {
          imageUrl: ["/quran/21/63.png"],
          imageUrls: ["/quran/21/63.png"],
          ayat_image_eng_url: ["/quran/21/63.png"],
          ayat_image_eng_urls: ["/quran/21/63.png"],
          ayat_image_urdu_url: [],
          ayat_image_urdu_urls: [],
          ayat_image_hindi_url: [],
          ayat_image_hindi_urls: []
        }
      }
    }
  },
  {
    updateMany: {
      filter: { surah_number: 21, ayat_number: 64 },
      update: {
        $set: {
          imageUrl: ["/quran/21/64.png"],
          imageUrls: ["/quran/21/64.png"],
          ayat_image_eng_url: ["/quran/21/64.png"],
          ayat_image_eng_urls: ["/quran/21/64.png"],
          ayat_image_urdu_url: [],
          ayat_image_urdu_urls: [],
          ayat_image_hindi_url: [],
          ayat_image_hindi_urls: []
        }
      }
    }
  },
  {
    updateMany: {
      filter: { surah_number: 21, ayat_number: 65 },
      update: {
        $set: {
          imageUrl: ["/quran/21/65.png"],
          imageUrls: ["/quran/21/65.png"],
          ayat_image_eng_url: ["/quran/21/65.png"],
          ayat_image_eng_urls: ["/quran/21/65.png"],
          ayat_image_urdu_url: [],
          ayat_image_urdu_urls: [],
          ayat_image_hindi_url: [],
          ayat_image_hindi_urls: []
        }
      }
    }
  },
  {
    updateMany: {
      filter: { surah_number: 21, ayat_number: 66 },
      update: {
        $set: {
          imageUrl: ["/quran/21/66.png"],
          imageUrls: ["/quran/21/66.png"],
          ayat_image_eng_url: ["/quran/21/66.png"],
          ayat_image_eng_urls: ["/quran/21/66.png"],
          ayat_image_urdu_url: [],
          ayat_image_urdu_urls: [],
          ayat_image_hindi_url: [],
          ayat_image_hindi_urls: []
        }
      }
    }
  },
  {
    updateMany: {
      filter: { surah_number: 21, ayat_number: 67 },
      update: {
        $set: {
          imageUrl: ["/quran/21/67.png"],
          imageUrls: ["/quran/21/67.png"],
          ayat_image_eng_url: ["/quran/21/67.png"],
          ayat_image_eng_urls: ["/quran/21/67.png"],
          ayat_image_urdu_url: [],
          ayat_image_urdu_urls: [],
          ayat_image_hindi_url: [],
          ayat_image_hindi_urls: []
        }
      }
    }
  },
  {
    updateMany: {
      filter: { surah_number: 22, ayat_number: 5 },
      update: {
        $set: {
          imageUrl: ["/quran/22/05.png"],
          imageUrls: ["/quran/22/05.png"],
          ayat_image_eng_url: ["/quran/22/05.png"],
          ayat_image_eng_urls: ["/quran/22/05.png"],
          ayat_image_urdu_url: [],
          ayat_image_urdu_urls: [],
          ayat_image_hindi_url: [],
          ayat_image_hindi_urls: []
        }
      }
    }
  },
  {
    updateMany: {
      filter: { surah_number: 25, ayat_number: 43 },
      update: {
        $set: {
          imageUrl: ["/quran/25/043.png"],
          imageUrls: ["/quran/25/043.png"],
          ayat_image_eng_url: ["/quran/25/043.png"],
          ayat_image_eng_urls: ["/quran/25/043.png"],
          ayat_image_urdu_url: [],
          ayat_image_urdu_urls: [],
          ayat_image_hindi_url: [],
          ayat_image_hindi_urls: []
        }
      }
    }
  },
  {
    updateMany: {
      filter: { surah_number: 29, ayat_number: 25 },
      update: {
        $set: {
          imageUrl: ["/quran/29/25.png"],
          imageUrls: ["/quran/29/25.png"],
          ayat_image_eng_url: ["/quran/29/25.png"],
          ayat_image_eng_urls: ["/quran/29/25.png"],
          ayat_image_urdu_url: [],
          ayat_image_urdu_urls: [],
          ayat_image_hindi_url: [],
          ayat_image_hindi_urls: []
        }
      }
    }
  },
  {
    updateMany: {
      filter: { surah_number: 30, ayat_number: 22 },
      update: {
        $set: {
          imageUrl: ["/quran/30/22.png"],
          imageUrls: ["/quran/30/22.png"],
          ayat_image_eng_url: ["/quran/30/22.png"],
          ayat_image_eng_urls: ["/quran/30/22.png"],
          ayat_image_urdu_url: [],
          ayat_image_urdu_urls: [],
          ayat_image_hindi_url: [],
          ayat_image_hindi_urls: []
        }
      }
    }
  },
  {
    updateMany: {
      filter: { surah_number: 37, ayat_number: 91 },
      update: {
        $set: {
          imageUrl: ["/quran/37/91.png"],
          imageUrls: ["/quran/37/91.png"],
          ayat_image_eng_url: ["/quran/37/91.png"],
          ayat_image_eng_urls: ["/quran/37/91.png"],
          ayat_image_urdu_url: [],
          ayat_image_urdu_urls: [],
          ayat_image_hindi_url: [],
          ayat_image_hindi_urls: []
        }
      }
    }
  },
  {
    updateMany: {
      filter: { surah_number: 37, ayat_number: 92 },
      update: {
        $set: {
          imageUrl: ["/quran/37/92.png"],
          imageUrls: ["/quran/37/92.png"],
          ayat_image_eng_url: ["/quran/37/92.png"],
          ayat_image_eng_urls: ["/quran/37/92.png"],
          ayat_image_urdu_url: [],
          ayat_image_urdu_urls: [],
          ayat_image_hindi_url: [],
          ayat_image_hindi_urls: []
        }
      }
    }
  },
  {
    updateMany: {
      filter: { surah_number: 37, ayat_number: 93 },
      update: {
        $set: {
          imageUrl: ["/quran/37/93.png"],
          imageUrls: ["/quran/37/93.png"],
          ayat_image_eng_url: ["/quran/37/93.png"],
          ayat_image_eng_urls: ["/quran/37/93.png"],
          ayat_image_urdu_url: [],
          ayat_image_urdu_urls: [],
          ayat_image_hindi_url: [],
          ayat_image_hindi_urls: []
        }
      }
    }
  },
  {
    updateMany: {
      filter: { surah_number: 37, ayat_number: 95 },
      update: {
        $set: {
          imageUrl: ["/quran/37/95.png"],
          imageUrls: ["/quran/37/95.png"],
          ayat_image_eng_url: ["/quran/37/95.png"],
          ayat_image_eng_urls: ["/quran/37/95.png"],
          ayat_image_urdu_url: [],
          ayat_image_urdu_urls: [],
          ayat_image_hindi_url: [],
          ayat_image_hindi_urls: []
        }
      }
    }
  },
  {
    updateMany: {
      filter: { surah_number: 37, ayat_number: 125 },
      update: {
        $set: {
          imageUrl: ["/quran/37/125.png"],
          imageUrls: ["/quran/37/125.png"],
          ayat_image_eng_url: ["/quran/37/125.png"],
          ayat_image_eng_urls: ["/quran/37/125.png"],
          ayat_image_urdu_url: [],
          ayat_image_urdu_urls: [],
          ayat_image_hindi_url: [],
          ayat_image_hindi_urls: []
        }
      }
    }
  },
  {
    updateMany: {
      filter: { surah_number: 38, ayat_number: 5 },
      update: {
        $set: {
          imageUrl: ["/quran/38/05.png"],
          imageUrls: ["/quran/38/05.png"],
          ayat_image_eng_url: ["/quran/38/05.png"],
          ayat_image_eng_urls: ["/quran/38/05.png"],
          ayat_image_urdu_url: [],
          ayat_image_urdu_urls: [],
          ayat_image_hindi_url: [],
          ayat_image_hindi_urls: []
        }
      }
    }
  },
  {
    updateMany: {
      filter: { surah_number: 38, ayat_number: 6 },
      update: {
        $set: {
          imageUrl: ["/quran/38/06.png"],
          imageUrls: ["/quran/38/06.png"],
          ayat_image_eng_url: ["/quran/38/06.png"],
          ayat_image_eng_urls: ["/quran/38/06.png"],
          ayat_image_urdu_url: [],
          ayat_image_urdu_urls: [],
          ayat_image_hindi_url: [],
          ayat_image_hindi_urls: []
        }
      }
    }
  },
  {
    updateMany: {
      filter: { surah_number: 38, ayat_number: 7 },
      update: {
        $set: {
          imageUrl: ["/quran/38/07.png"],
          imageUrls: ["/quran/38/07.png"],
          ayat_image_eng_url: ["/quran/38/07.png"],
          ayat_image_eng_urls: ["/quran/38/07.png"],
          ayat_image_urdu_url: [],
          ayat_image_urdu_urls: [],
          ayat_image_hindi_url: [],
          ayat_image_hindi_urls: []
        }
      }
    }
  },
  {
    updateMany: {
      filter: { surah_number: 42, ayat_number: 51 },
      update: {
        $set: {
          imageUrl: ["/quran/42/51.png"],
          imageUrls: ["/quran/42/51.png"],
          ayat_image_eng_url: ["/quran/42/51.png"],
          ayat_image_eng_urls: ["/quran/42/51.png"],
          ayat_image_urdu_url: [],
          ayat_image_urdu_urls: [],
          ayat_image_hindi_url: [],
          ayat_image_hindi_urls: []
        }
      }
    }
  },
  {
    updateMany: {
      filter: { surah_number: 42, ayat_number: 52 },
      update: {
        $set: {
          imageUrl: ["/quran/42/52.png"],
          imageUrls: ["/quran/42/52.png"],
          ayat_image_eng_url: ["/quran/42/52.png"],
          ayat_image_eng_urls: ["/quran/42/52.png"],
          ayat_image_urdu_url: [],
          ayat_image_urdu_urls: [],
          ayat_image_hindi_url: [],
          ayat_image_hindi_urls: []
        }
      }
    }
  },
  {
    updateMany: {
      filter: { surah_number: 53, ayat_number: 19 },
      update: {
        $set: {
          imageUrl: ["/quran/53/019.png"],
          imageUrls: ["/quran/53/019.png"],
          ayat_image_eng_url: ["/quran/53/019.png"],
          ayat_image_eng_urls: ["/quran/53/019.png"],
          ayat_image_urdu_url: [],
          ayat_image_urdu_urls: [],
          ayat_image_hindi_url: [],
          ayat_image_hindi_urls: []
        }
      }
    }
  },
  {
    updateMany: {
      filter: { surah_number: 53, ayat_number: 20 },
      update: {
        $set: {
          imageUrl: ["/quran/53/020.png"],
          imageUrls: ["/quran/53/020.png"],
          ayat_image_eng_url: ["/quran/53/020.png"],
          ayat_image_eng_urls: ["/quran/53/020.png"],
          ayat_image_urdu_url: [],
          ayat_image_urdu_urls: [],
          ayat_image_hindi_url: [],
          ayat_image_hindi_urls: []
        }
      }
    }
  },
  {
    updateMany: {
      filter: { surah_number: 53, ayat_number: 21 },
      update: {
        $set: {
          imageUrl: ["/quran/53/21.png"],
          imageUrls: ["/quran/53/21.png"],
          ayat_image_eng_url: ["/quran/53/21.png"],
          ayat_image_eng_urls: ["/quran/53/21.png"],
          ayat_image_urdu_url: [],
          ayat_image_urdu_urls: [],
          ayat_image_hindi_url: [],
          ayat_image_hindi_urls: []
        }
      }
    }
  },
  {
    updateMany: {
      filter: { surah_number: 53, ayat_number: 22 },
      update: {
        $set: {
          imageUrl: ["/quran/53/22.png"],
          imageUrls: ["/quran/53/22.png"],
          ayat_image_eng_url: ["/quran/53/22.png"],
          ayat_image_eng_urls: ["/quran/53/22.png"],
          ayat_image_urdu_url: [],
          ayat_image_urdu_urls: [],
          ayat_image_hindi_url: [],
          ayat_image_hindi_urls: []
        }
      }
    }
  },
  {
    updateMany: {
      filter: { surah_number: 53, ayat_number: 23 },
      update: {
        $set: {
          imageUrl: ["/quran/53/23.png"],
          imageUrls: ["/quran/53/23.png"],
          ayat_image_eng_url: ["/quran/53/23.png"],
          ayat_image_eng_urls: ["/quran/53/23.png"],
          ayat_image_urdu_url: [],
          ayat_image_urdu_urls: [],
          ayat_image_hindi_url: [],
          ayat_image_hindi_urls: []
        }
      }
    }
  },
  {
    updateMany: {
      filter: { surah_number: 59, ayat_number: 22 },
      update: {
        $set: {
          imageUrl: ["/quran/59/22.png"],
          imageUrls: ["/quran/59/22.png"],
          ayat_image_eng_url: ["/quran/59/22.png"],
          ayat_image_eng_urls: ["/quran/59/22.png"],
          ayat_image_urdu_url: [],
          ayat_image_urdu_urls: [],
          ayat_image_hindi_url: [],
          ayat_image_hindi_urls: []
        }
      }
    }
  },
  {
    updateMany: {
      filter: { surah_number: 59, ayat_number: 23 },
      update: {
        $set: {
          imageUrl: ["/quran/59/23.png"],
          imageUrls: ["/quran/59/23.png"],
          ayat_image_eng_url: ["/quran/59/23.png"],
          ayat_image_eng_urls: ["/quran/59/23.png"],
          ayat_image_urdu_url: [],
          ayat_image_urdu_urls: [],
          ayat_image_hindi_url: [],
          ayat_image_hindi_urls: []
        }
      }
    }
  },
  {
    updateMany: {
      filter: { surah_number: 59, ayat_number: 24 },
      update: {
        $set: {
          imageUrl: ["/quran/59/24.png"],
          imageUrls: ["/quran/59/24.png"],
          ayat_image_eng_url: ["/quran/59/24.png"],
          ayat_image_eng_urls: ["/quran/59/24.png"],
          ayat_image_urdu_url: [],
          ayat_image_urdu_urls: [],
          ayat_image_hindi_url: [],
          ayat_image_hindi_urls: []
        }
      }
    }
  },
  {
    updateMany: {
      filter: { surah_number: 61, ayat_number: 5 },
      update: {
        $set: {
          imageUrl: ["/quran/61/05.png"],
          imageUrls: ["/quran/61/05.png"],
          ayat_image_eng_url: ["/quran/61/05.png"],
          ayat_image_eng_urls: ["/quran/61/05.png"],
          ayat_image_urdu_url: [],
          ayat_image_urdu_urls: [],
          ayat_image_hindi_url: [],
          ayat_image_hindi_urls: []
        }
      }
    }
  },
  {
    updateMany: {
      filter: { surah_number: 61, ayat_number: 6 },
      update: {
        $set: {
          imageUrl: ["/quran/61/06.png"],
          imageUrls: ["/quran/61/06.png"],
          ayat_image_eng_url: ["/quran/61/06.png"],
          ayat_image_eng_urls: ["/quran/61/06.png"],
          ayat_image_urdu_url: [],
          ayat_image_urdu_urls: [],
          ayat_image_hindi_url: [],
          ayat_image_hindi_urls: []
        }
      }
    }
  },
  {
    updateMany: {
      filter: { surah_number: 71, ayat_number: 22 },
      update: {
        $set: {
          imageUrl: ["/quran/71/22.png"],
          imageUrls: ["/quran/71/22.png"],
          ayat_image_eng_url: ["/quran/71/22.png"],
          ayat_image_eng_urls: ["/quran/71/22.png"],
          ayat_image_urdu_url: [],
          ayat_image_urdu_urls: [],
          ayat_image_hindi_url: [],
          ayat_image_hindi_urls: []
        }
      }
    }
  },
  {
    updateMany: {
      filter: { surah_number: 71, ayat_number: 23 },
      update: {
        $set: {
          imageUrl: ["/quran/71/23.png"],
          imageUrls: ["/quran/71/23.png"],
          ayat_image_eng_url: ["/quran/71/23.png"],
          ayat_image_eng_urls: ["/quran/71/23.png"],
          ayat_image_urdu_url: [],
          ayat_image_urdu_urls: [],
          ayat_image_hindi_url: [],
          ayat_image_hindi_urls: []
        }
      }
    }
  }
]);

print("Ayats Bulk Update Result: Matched " + res.matchedCount + ", Modified " + res.modifiedCount);
