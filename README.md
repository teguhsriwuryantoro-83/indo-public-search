# MAZTEGE — YouTube Archive Search

Aplikasi pencarian video YouTube berdasarkan tahun/bulan upload dengan kolom kata kunci terpisah.

## Teknologi
- Frontend: HTML, CSS, JavaScript vanilla (mobile-first).
- Backend: Node.js + Express.
- Sumber data: YouTube Data API v3 `search.list` dan `videos.list`.
- Filter tanggal: `publishedAfter` dan `publishedBefore` menggunakan rentang UTC.
- Hosting: Render Web Service (region Singapore).

## Menjalankan
1. Node.js 20+
2. `npm install`
3. Set environment variable `YOUTUBE_API_KEY`
4. `npm start`
5. Buka `http://localhost:3000`

## API key
Buat project di Google Cloud Console, aktifkan YouTube Data API v3, buat API key, lalu simpan sebagai environment variable `YOUTUBE_API_KEY` di Render. Jangan commit API key ke GitHub atau frontend.

Google Cloud Console: https://console.cloud.google.com/
YouTube Data API: https://developers.google.com/youtube/v3

## Endpoint
- `GET /api/health` — status server dan apakah API key sudah terpasang.
- `GET /api/search?q=Marinir&year=2006&month=5&order=relevance&maxResults=25`
- `pageToken` — pagination dari token YouTube.

## Catatan batasan
- API key wajib untuk pencarian langsung.
- YouTube Data API `search.list` memiliki kuota yang perlu dipantau; satu permintaan pencarian menghabiskan kuota search.
- Hasil API tidak selalu mencakup semua video; hasil pencarian dapat bervariasi menurut relevansi.
- Tanggal yang difilter adalah tanggal publikasi menurut YouTube, bukan tanggal kejadian/rekaman.
- API tidak menjamin seluruh unggahan 2005–2007 dapat ditemukan.
- Jangan gunakan scraping yang melanggar ketentuan layanan atau melewati CAPTCHA/rate limit.

## Deploy Render
- Runtime: Node
- Build: `npm install`
- Start: `npm start`
- Region: Singapore
- Environment: `YOUTUBE_API_KEY` (diisi melalui Dashboard Render, jangan di Git).
