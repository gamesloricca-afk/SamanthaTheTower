ENEMY MECHANICS

Project: Samantha – The Tower
Database: Game Knowledge Base (GKB)
Document ID: GKB-ENEMY-001
Version: 1.2.0
Date: 2026-11-07
Status: Draft – Pending Owner Approval
Owner: Samantha Project Owner

---

1. PURPOSE

Dokumen ini menjadi referensi mekanisme musuh dalam The Tower: Idle Tower Defense.

Tujuannya membantu Samantha memahami dan menganalisis:

- Kategori dan karakteristik musuh.
- Perilaku serangan dan efek khusus.
- Batas populasi dan mekanisme kemunculan.
- Interaksi musuh dengan pertahanan Tower.
- Pengaruh mekanisme musuh terhadap strategi pemain.

Dokumen ini merupakan basis pengetahuan yang dikelola berdasarkan bukti. Informasi dari komunitas dapat digunakan dan disajikan dengan atribusi yang sesuai tanpa harus selalu diverifikasi secara independen oleh Samantha.

Core Principle: Optimize Decisions, Not Popularity.

2. EVIDENCE GOVERNANCE

Dokumen ini mengikuti "SAMANTHA EVIDENCE GOVERNANCE".

Setiap klaim penting menggunakan salahku satu dari empat Evidence Status berikut:

Status| Arti
Reported| Dilaporkan oleh sumber, belum dinilai lebih lanjut.
Supported| Didukung bukti yang cukup kredibel, tetapi belum memenuhi Verified.
Verified| Telah diperiksa terhadap bukti yang relevan dan dapat diandalkan oleh Samantha. Bukan sertifikasi resmi developer atau jaminan berlaku selamanya.
Unverified| Bukti yang tersedia belum cukup untuk menetapkan informasi secara andal.

Ketentuan:

1. Status bukti menjelaskan keadaan bukti yang tersedia, bukan kebenaran mutlak.
2. Informasi komunitas boleh disajikan dengan menyebutkan sumber dan statusnya.
3. Samantha tidak wajib melakukan pengujian sendiri terhadap setiap klaim.
4. Beberapa website yang menggunakan sumber asal sama tidak otomatis menjadi konfirmasi independen.
5. Jika sumber berbeda, Samantha dapat menyajikan perbedaannya tanpa harus memutuskan mana yang benar.
6. Informasi yang pernah Verified dapat menjadi tidak berlaku setelah perubahan game.

Tidak digunakan Confidence Level atau klasifikasi tambahan yang tidak diperlukan.

3. ENEMY CLASSIFICATION

Musuh dikelompokkan menjadi empat kategori utama.

3.1 Normal Enemies

- Basic
- Fast
- Tank
- Ranged
- Protector

3.2 Boss

Boss merupakan kategori musuh tersendiri dan memiliki mekanisme serta interaksi khusus.

3.3 Elite

Terdiri dari:

- Vampire
- Ray
- Scatter

3.4 Fleet

Terdiri dari:

- Saboteur
- Commander
- Overcharge

Fleet merupakan kategori khusus. Support Enemies yang muncul bersama Fleet harus dibedakan dari Fleet utama.

4. ENEMY POPULATION LIMITS

Referensi komunitas melaporkan batas populasi terpisah untuk Normal, Elite, Boss, dan jenis Elite tertentu.

Angka yang sering dilaporkan meliputi:

Population| Community-reported information
Normal| Batas yang umum dilaporkan adalah 120
Elite| Batas total yang umum dilaporkan adalah 20
Boss| Batas yang umum dilaporkan adalah 10
Each Elite type| Batas yang umum dilaporkan adalah 8
Protector| Referensi yang tersedia melaporkan batas 10, tetapi informasi historis dan versi perlu diperhatikan

Evidence Status: Reported / Supported, depending on the individual claim.

Angka tersebut merupakan informasi komunitas, bukan pernyataan bahwa developer telah mengonfirmasi seluruh batas tersebut untuk setiap versi dan kondisi permainan.

4.1 Fleet Population Distinction

Patch notes resmi v28.3 mengonfirmasi bahwa Support Enemies yang muncul bersama Fleet memiliki spawn cap tersendiri.

Namun, referensi komunitas berbeda pendapat mengenai apakah Fleet utama dihitung ke dalam batas populasi Normal.

- Sebagian referensi menyatakan Fleet utama dihitung ke dalam batas Normal.
- Referensi lain menyatakan Fleet utama tidak dihitung ke dalam batas tersebut.

Evidence Status: Unverified.

Samantha harus mempertahankan perbedaan laporan ini dan tidak menetapkan salah satu interpretasi sebagai fakta terkonfirmasi.

Batas Support Enemies dan aturan populasi Fleet utama merupakan dua hal yang berbeda dan tidak boleh dicampuradukkan.

5. SHARED ENEMY MECHANICS

Beberapa mekanisme umum dilaporkan berlaku terhadap musuh.

5.1 Heat-Up

Musuh melee dilaporkan meningkatkan damage setiap kali berhasil mengenai Tower atau Wall.

Referensi komunitas mencatat peningkatan sebesar 4% per hit.

Ranged, Ray, dan Overcharge shots tidak termasuk dalam mekanisme Heat-Up tersebut.

Evidence Status: Supported.

Samantha harus membedakan serangan kontak dari serangan proyektil atau beam.

5.2 Coin Decay

Musuh yang bertahan hidup lebih dari tiga wave dilaporkan mengalami pengurangan nilai coin sebesar 50%.

Evidence Status: Supported.

Jangan menganggap pengurangan tersebut sebagai pengurangan langsung terhadap seluruh pendapatan coin dalam satu run. Mekanisme ini berkaitan dengan nilai coin musuh yang bersangkutan.

5.3 Mass Growth

Mass musuh dilaporkan meningkat sebesar 4% untuk setiap wave yang berhasil dilewati musuh tersebut.

Mass berpengaruh terhadap kemampuan efek knockback dalam mengendalikan musuh.

Evidence Status: Supported.

Implementasi dan interaksi dengan Battle Conditions tetap dapat bergantung pada versi game.

6. NORMAL ENEMY CHARACTERISTICS

6.1 Basic

Basic merupakan kategori musuh standar dan menjadi acuan perbandingan bagi beberapa statistik musuh lainnya.

6.2 Fast

Fast memiliki movement speed lebih tinggi dibandingkan Basic.

Implikasi strategis:

- Dapat mencapai Tower lebih cepat.
- Membutuhkan perhatian pada crowd control dan jangkauan serangan.
- Kegagalan mengatasi Fast tidak selalu berarti damage Tower terlalu rendah.

6.3 Tank

Tank memiliki health lebih tinggi dan movement speed lebih rendah dibandingkan Basic.

Implikasi strategis:

- Membutuhkan damage lebih besar untuk dikalahkan.
- Dapat bertahan lebih lama dalam area pertahanan.
- Musuh yang bertahan terlalu lama dapat meningkatkan tekanan populasi.

6.4 Ranged

Ranged dapat menyerang Tower dari jarak tertentu.

Implikasi strategis:

- Orb coverage saja tidak menjamin perlindungan terhadap Ranged.
- Samantha harus membedakan serangan jarak jauh dengan damage kontak.
- Tower range, damage, crowd control, dan pertahanan perlu dianalisis bersama.

6.5 Protector

Protector memberikan perlindungan kepada musuh di sekitarnya.

Referensi komunitas melaporkan bahwa perlindungan tersebut mengurangi damage yang diterima oleh musuh yang dilindungi.

Implikasi strategis:

- Musuh yang berada dalam perlindungan dapat membutuhkan damage lebih besar.
- Jumlah dan durasi keberadaan Protector dapat memengaruhi kepadatan musuh.
- Samantha perlu mempertimbangkan efek perlindungan sebelum menyimpulkan bahwa damage pemain tidak mencukupi.

Interaksi dengan setiap jenis damage tidak boleh diasumsikan sama tanpa bukti.

7. BOSS MECHANICS

Boss memiliki kategori populasi tersendiri dan beberapa interaksi khusus dengan sistem pertahanan Tower.

Referensi komunitas melaporkan bahwa:

- Boss memiliki health jauh lebih tinggi daripada musuh Normal.
- Boss memiliki movement speed lebih rendah daripada Basic.
- Interaksi Boss dengan Orb, Death Ray, dan Shockwave memiliki pembatasan atau pengecualian tertentu.
- Orb Boss Hit memberikan interaksi khusus terhadap Boss.

Evidence Status: Reported / Supported.

Implikasi strategis:

- Kemampuan membersihkan Normal enemies tidak otomatis berarti pemain memiliki damage Boss yang cukup.
- Boss damage, damage amplification, dan mekanisme bertahan hidup harus dianalisis secara terpisah.
- Samantha tidak boleh menganggap daftar interaksi ini sebagai daftar lengkap seluruh immunity Boss.

8. ELITE MECHANICS

Elite terdiri dari Vampire, Ray, dan Scatter.

Referensi komunitas melaporkan bahwa Elite memiliki pembatasan interaksi terhadap beberapa mekanisme pertahanan, termasuk Orb, Death Ray, Shockwave, dan Black Hole.

Setiap jenis Elite memiliki batas populasi tersendiri menurut referensi komunitas. Anak hasil pemecahan Scatter dilaporkan tidak dihitung dalam batas populasi jenis Elite tersebut.

Evidence Status: Supported.

8.1 Vampire

Karakteristik yang dilaporkan:

- Vampire menguras sebagian health maksimum Tower setiap detik selama efeknya berlangsung.
- Efeknya menonaktifkan Tower Health Regeneration dan Lifesteal.
- Wall Regen tetap dapat berjalan.

Referensi komunitas mencatat drain sebesar 2% dari maksimum Tower health per detik.

Evidence Status: Supported.

Samantha harus membedakan efek terhadap Tower dan Wall. Jangan menyatakan Wall Regen ikut dinonaktifkan.

8.2 Ray

Karakteristik yang dilaporkan:

- Ray melakukan charge sebelum menembakkan beam.
- Beam memberikan damage yang lebih besar daripada serangan Basic.
- Ray memiliki immunity terhadap Knockback.

Referensi komunitas mencatat charge sekitar 30 detik dan beam damage sekitar dua kali damage Basic.

Evidence Status: Supported.

Charge duration, beam duration, dan interval serangan merupakan pengukuran berbeda. Jangan menyamakannya.

8.3 Scatter

Scatter dapat membelah diri menjadi beberapa bagian setelah terkena mekanisme tertentu.

Referensi komunitas melaporkan bahwa hanya satu hasil pembelahan yang memberikan Elite Cells.

Evidence Status: Supported.

Jumlah akhir tubuh Scatter tidak dicantumkan sebagai angka tetap dalam dokumen ini karena berpotensi menimbulkan perbedaan interpretasi mengenai proses pembelahan.

9. FLEET MECHANICS

Fleet merupakan kategori musuh khusus dengan mekanisme tersendiri.

9.1 Support Enemies

Fleet dapat muncul bersama Support Enemies yang sesuai dengan jenis Fleet.

Patch notes resmi v28.3 menyatakan bahwa Support Enemies memiliki spawn cap tersendiri agar kemunculannya tidak terhalang oleh batas populasi musuh lainnya.

Evidence Status: Verified.

Jumlah Support Enemies dalam satu kemunculan tidak ditetapkan sebagai angka tetap dalam dokumen ini. Jumlah tersebut dapat berbeda menurut kondisi dan versi game.

9.2 Saboteur

Menurut patch notes resmi v28.3:

- Setiap serangan Saboteur mengurangi satu level pada main stat Ultimate Weapon yang terdampak.
- Ultimate Weapon yang terdampak akan dipulihkan ketika Saboteur dikalahkan.

Jenis stat yang terdampak bergantung pada Ultimate Weapon terkait.

Evidence Status: Verified.

9.3 Commander

Menurut patch notes resmi v28.3:

- Commander memberikan peningkatan Health, Mass, dan Speed kepada musuh melalui pulse.
- Peningkatan Speed dan Mass memiliki batas stacking.
- Peningkatan Health tidak menggunakan batas stacking yang sama.

Patch notes menyebut peningkatan sebesar 15% per pulse. Batas peningkatan Speed dan Mass disebut secara khusus oleh developer.

Evidence Status: Verified.

Samantha tidak boleh menyatakan bahwa peningkatan Health juga memiliki batas stacking yang sama dengan Speed dan Mass.

9.4 Overcharge

Menurut patch notes resmi v28.3:

- Damage awal Overcharge ditetapkan berdasarkan damage Wave 1 pada tier tempat musuh tersebut muncul.
- Setiap hit yang berhasil meningkatkan damage Overcharge secara eksponensial.
- Overcharge memiliki kemampuan Parting Shot ketika mati.
- Parting Shot hanya terjadi jika Overcharge telah mencapai Tower's Range.

Patch notes menyebut faktor peningkatan damage sebesar 1.4x per hit.

Evidence Status: Verified.

9.5 Fleet Tournament Mechanics

Developer mengumumkan perubahan mekanisme Fleet Wave untuk liga turnamen yang menggunakan Fleet.

Mekanisme yang diumumkan:

- Fleet muncul pada awal Fleet Wave.
- Progress wave ditentukan oleh sisa health Fleet, bukan timer.
- Musuh jenis lain tetap muncul selama Fleet Wave berlangsung.
- Wave berikutnya dimulai setelah seluruh Fleet pada wave tersebut dikalahkan.
- Sisa persentase health Fleet dapat digunakan sebagai tie-break pada Fleet Wave.

Evidence Status: Verified.

Penerapan mekanisme ini harus mengikuti cakupan liga dan mode yang diumumkan developer. Jangan menganggapnya berlaku untuk semua mode permainan.

10. ENEMY COIN VALUES

Nilai coin musuh perlu dibedakan antara:

1. Nilai dasar atau direct coin drop.
2. Relative coin weight yang digunakan dalam perbandingan atau perhitungan ekonomi.

Referensi komunitas melaporkan perbandingan relative coin weight berikut:

Enemy| Relative Coin Weight
Basic| 1
Fast| 2
Ranged| 2
Protector| 3
Tank| 4
Elite| 4
Boss| 5

Evidence Status: Reported.

Angka tersebut bukan jaminan jumlah coin yang diterima pemain dari setiap kill.

Sumber komunitas lain menjelaskan bahwa direct coin drop Basic secara normal adalah 0, dengan kemungkinan memperoleh coin melalui Critical Coin Card.

Karena itu, Basic relative coin weight tidak boleh disamakan dengan direct coin drop.

Pendapatan coin aktual dapat dipengaruhi oleh:

- Coin bonuses.
- Golden Tower.
- Black Hole.
- Death Wave.
- Golden Bot.
- Themes, relics, dan enhancement.
- Battle Conditions.
- Enemy-specific effects.
- Game version.

Samantha harus menyebutkan jenis nilai yang sedang dibahas sebelum melakukan perbandingan atau perhitungan.

11. SPAWN MECHANICS

Komposisi musuh dapat berubah berdasarkan perkembangan wave dan kondisi permainan.

Variabel yang relevan meliputi:

- Tier.
- Wave.
- Enemy category.
- Spawn progression.
- Battle Conditions.
- Special encounters.
- Fleet mechanics.
- Population limits.

Samantha tidak boleh menganggap satu distribusi spawn yang diamati pada suatu run berlaku universal untuk seluruh tier, wave, atau versi game.

Data spawn dari komunitas dapat digunakan untuk analisis dengan mencantumkan sumber dan kondisi pengamatan apabila tersedia.

Formula probabilitas spawn yang belum memiliki dukungan memadai harus tetap dianggap belum terkonfirmasi.

12. ENEMY INTERACTION MATRIX

Tabel berikut merupakan ringkasan interaksi yang dilaporkan, bukan daftar lengkap immunity.

Enemy| Reported Interaction
Boss| Memiliki pembatasan atau pengecualian terhadap beberapa mekanisme serangan dan crowd control
Elite| Memiliki immunity terhadap beberapa mekanisme, termasuk Orb, Death Ray, Shockwave, dan Black Hole
Ray| Immune terhadap Knockback
Ranged| Dapat menyerang dari jarak tertentu
Protector| Memberikan perlindungan kepada musuh di sekitarnya
Vampire| Mengganggu Tower Health Regeneration dan Lifesteal
Saboteur| Mengurangi level main stat Ultimate Weapon yang terdampak
Commander| Meningkatkan statistik musuh melalui pulse
Overcharge| Damage meningkat setelah hit berhasil dan dapat melakukan Parting Shot

Ketentuan:

- Jangan menyimpulkan immunity terhadap mekanisme yang tidak tercantum.
- Bedakan immunity, resistance, protection, dan targeting restrictions.
- Catat pengecualian secara terpisah apabila tersedia.
- Periksa kembali interaksi setelah patch yang relevan.

13. DIAGNOSTIC AND STRATEGIC APPLICATION

Ketika pemain melaporkan kegagalan run, Samantha dapat mempertimbangkan pertanyaan berikut:

1. Musuh jenis apa yang menyebabkan ancaman terakhir?
2. Apakah musuh tersebut Boss, Elite, Fleet, atau Normal?
3. Apakah Protector sedang aktif?
4. Apakah terdapat Battle Condition yang memengaruhi interaksi?
5. Apakah masalah berkaitan dengan damage, crowd control, atau mekanisme khusus?
6. Apakah Tower menerima contact damage, projectile, beam, atau efek lainnya?
7. Apakah kepadatan musuh atau populasi menjadi faktor?
8. Apakah konfigurasi pemain sesuai dengan tujuan run?

Musuh terakhir yang terlihat pada battle report tidak otomatis merupakan satu-satunya penyebab kegagalan run.

Enemy Mechanics dapat digunakan untuk mendukung analisis:

- Damage requirements.
- Crowd-control requirements.
- Survival dan defensive requirements.
- Elite Cell acquisition.
- Boss elimination.
- Tournament performance.
- Farming efficiency.
- Death-cause analysis.
- Enemy density dan population pressure.

Jenis musuh saja tidak cukup untuk menentukan prioritas upgrade.

Rekomendasi juga perlu mempertimbangkan tujuan pemain, progres akun, preset, module, Ultimate Weapon, sinergi sistem, sumber daya, opportunity cost, dan bukti yang tersedia.

Samantha boleh memberikan analisis dan rekomendasi berdasarkan informasi yang tersedia tanpa harus menyelesaikan setiap perbedaan sumber terlebih dahulu.

14. SOURCE REFERENCES

Referensi berikut digunakan sebagai sumber informasi dan bahan perbandingan.

Official Developer Sources

1. Tech Tree Games – v28.3 Patch Notes

https://www.techtreegames.com/post/v28-3-patch-notes

Digunakan untuk memeriksa perubahan Fleet, Support Enemy spawn cap, Saboteur, Commander, dan Overcharge.

2. Tech Tree Games – Tournaments: Legend and Mythic New Fleet Wave Mechanics

https://techtreegames.zendesk.com/hc/en-us/articles/58296439461403--The-Tower-Tournaments-Legend-and-Mythic-New-Fleet-Wave-Mechanics

Pengumuman developer mengenai mekanisme Fleet Wave dan tie-break untuk liga yang menggunakan Fleet.

3. Tech Tree Games – v29 Patch Notes

https://techtreegames.zendesk.com/hc/en-us/articles/54972978743707-v29-Patch-Notes-2026-08-26

Referensi tambahan untuk mekanisme Fleet dalam turnamen.

Community and Fan Sources

4. Tower Hub – Enemies

https://tower-advisor.vercel.app/wiki/enemy/enemies

Digunakan untuk membandingkan karakteristik musuh, shared mechanics, populasi, Fleet, dan spawn mechanics.

5. Tower Hub – Elite Enemies

https://www.tower-hub.com/wiki/enemy/elite-enemies

Digunakan untuk membandingkan karakteristik Elite, immunity, Scatter, Vampire, dan Ray.

6. Towerstats – The Tower Enemies

https://towerstats.org/guide/enemies/

Referensi komunitas untuk enemy classification, population, enemy characteristics, dan Fleet.

Halaman ini menyatakan menggunakan data dari The Tower Wiki. Karena itu, informasi yang berasal dari sumber asal yang sama tidak boleh dihitung sebagai konfirmasi independen.

7. Towerstats – Enemy Coin Weight Curve

https://towerstats.org/enemy-coin-weight-curve/

Referensi untuk analisis relative coin weight dan komposisi musuh.

8. Tower Knowledge Hub – Guide to Improving Coin Income

https://the-tower.notion.site/Guide-to-Improving-Coin-Income-1bf91383b93f80b883fefcd58298d20a

Digunakan untuk membandingkan direct coin drop dan faktor pendapatan coin.

Referensi komunitas bukan pengganti dokumentasi resmi developer. Informasi harus tetap diberi atribusi dan status bukti yang sesuai.

15. DOCUMENT MAINTENANCE

Dokumen ini dapat diperbarui apabila tersedia:

- Patch notes baru.
- Pengumuman resmi developer.
- Perubahan mekanisme yang dapat diamati.
- Referensi komunitas baru.
- Pengujian pemain yang terdokumentasi.
- Koreksi terhadap informasi sebelumnya.

Informasi yang berubah harus disesuaikan dengan bukti dan versi game yang relevan.

Developer dapat mengubah mekanisme permainan kapan saja, termasuk tanpa pemberitahuan sebelumnya. Samantha tidak dapat menjamin mengetahui perubahan yang belum diumumkan, belum terdeteksi, atau belum tersedia dalam sumber yang dapat diakses.

Informasi lama yang pernah Verified tidak otomatis berlaku untuk versi terbaru.

16. DOCUMENT GOVERNANCE

Dokumen ini merupakan referensi pengetahuan yang dapat berkembang.

Samantha harus:

- Menyebutkan sumber informasi jika tersedia.
- Mempertahankan Evidence Status.
- Tidak memperlakukan informasi komunitas sebagai fakta resmi.
- Tidak menyamakan pengulangan informasi dengan konfirmasi independen.
- Menampilkan perbedaan laporan apabila sumber tidak sepakat.
- Tidak mengarang hasil pengujian atau konfirmasi.
- Menggunakan informasi sesuai versi dan kondisi yang diketahui.
- Memberikan analisis dengan menjelaskan dasar dan keterbatasannya.

Samantha tidak berkewajiban melakukan verifikasi independen terhadap seluruh informasi atau menyelesaikan setiap konflik sumber sebelum membantu pemain.

Guiding Principle

An enemy is not merely a health value. Its movement, attack behavior, immunity, population, and interaction with other enemies determine the actual threat it presents.

Knowledge Integrity Rule

Samantha must distinguish what a source reports, what available evidence supports, what has been verified, and what remains uncertain.

Core Principle: Optimize Decisions, Not Popularity.
