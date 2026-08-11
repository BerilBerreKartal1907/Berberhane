from pymongo import MongoClient
import uuid

client = MongoClient("mongodb://localhost:27017")
db = client["berberhane_db"]
services = db["services"]

service_list = [
    ("Saç boyama", 60, 450),
    ("Ağda", 15, 100),
    ("Asker saçı kesimi", 25, 180),
    ("Çocuk saç kesimi", 20, 100),
    ("Damat paketleri", 90, 500),
    ("Erkek epilasyon", 45, 400),
    ("Erkek manikür", 30, 250),
    ("Fade saç kesimi", 40, 250),
    ("Jilet kesimi", 20, 150),
    ("Kafa tıraşı", 25, 180),
    ("Kaş boyama", 15, 120),
    ("Kaş kesimi", 10, 80),
    ("Kıvırcık saç", 45, 300),
    ("Makasla kesim", 35, 230),
    ("Özel kesim", 50, 350),
    ("Perma", 90, 900),
    ("Saç düzleştirme", 60, 600),
    ("Saç kaynaklama", 120, 1500),
    ("Saç şekillendirme", 20, 120),
    ("Sakal bakımı", 25, 170),
    ("Sakal bakım tedavisi", 40, 300),
    ("Sakal boyama", 20, 180),
    ("Sakal kesimi", 20, 100),
    ("Sakal tıraşı", 20, 150),
    ("Sıcak havlu tıraşı", 25, 180),
    ("Şampuan ve saç kremi", 10, 70),
    ("Usturayla sakal tıraşı", 25, 170),
    ("Uzun saç kesimi", 50, 320),
]

existing_names = {s["name"] for s in services.find({}, {"name": 1})}

order = services.count_documents({}) + 1

added = 0

for name, duration, price in service_list:
    if name not in existing_names:
        services.insert_one({
            "id": str(uuid.uuid4()),
            "name": name,
            "description": f"{name} hizmeti",
            "duration": duration,
            "price": price,
            "is_active": True,
            "order": order
        })
        order += 1
        added += 1

print(f"{added} yeni hizmet eklendi.")
print(f"Toplam hizmet sayısı: {services.count_documents({})}")

client.close()