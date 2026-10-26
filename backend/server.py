from fastapi import FastAPI, APIRouter, HTTPException, Depends, Header, Request
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
from passlib.context import CryptContext
from pymongo.errors import DuplicateKeyError
import os
import time
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict, field_validator, model_validator
from typing import List, Optional
import uuid
import re
from collections import defaultdict
from datetime import datetime, timezone, timedelta
import smtplib
import asyncio
from email.mime.text import MIMEText

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Admin password (simple auth)
ADMIN_PASSWORD = os.environ.get('ADMIN_PASSWORD', 'berberhane2024')

# Online randevu açık mı? Tanımlı değilse açık kabul edilir.
# Yayına hazır olana kadar Render'da BOOKING_ENABLED=false yapılır.
BOOKING_ENABLED = os.environ.get('BOOKING_ENABLED', 'true').strip().lower() != 'false'

# ==================== E-posta Bildirimi (Yeni Randevu) ====================
GMAIL_ADDRESS = os.environ.get('GMAIL_ADDRESS')
GMAIL_APP_PASSWORD = os.environ.get('GMAIL_APP_PASSWORD')
NOTIFICATION_EMAIL = os.environ.get('NOTIFICATION_EMAIL', GMAIL_ADDRESS)

def _send_email_sync(subject: str, body: str):
    """Senkron e-posta gönderimi (ayrı thread'de çalıştırılır)"""
    msg = MIMEText(body, "plain", "utf-8")
    msg["Subject"] = subject
    msg["From"] = GMAIL_ADDRESS
    msg["To"] = NOTIFICATION_EMAIL

    with smtplib.SMTP_SSL("smtp.gmail.com", 465) as server:
        server.login(GMAIL_ADDRESS, GMAIL_APP_PASSWORD)
        server.sendmail(GMAIL_ADDRESS, [NOTIFICATION_EMAIL], msg.as_string())

async def send_new_appointment_notification(appointment: "Appointment"):
    """Yeni randevu geldiğinde admin'e e-posta bildirimi gönderir (hata olursa sessizce geçer)"""
    if not GMAIL_ADDRESS or not GMAIL_APP_PASSWORD:
        return  # E-posta bilgileri .env'de tanımlı değilse sessizce atla

    subject = f"Yeni Randevu: {appointment.customer_name} - {appointment.date} {appointment.time}"
    body = (
        f"BERBERHANE - Yeni Randevu Bildirimi\n\n"
        f"Müşteri: {appointment.customer_name}\n"
        f"Telefon: {appointment.customer_phone}\n"
        f"Hizmet: {appointment.service_name}\n"
        f"Tarih: {appointment.date}\n"
        f"Saat: {appointment.time}\n"
        f"Not: {appointment.customer_note or '-'}\n"
    )
    try:
        await asyncio.to_thread(_send_email_sync, subject, body)
        logger.info(f"Notification email sent for appointment {appointment.id}")
    except Exception as e:
        logger.error(f"Failed to send notification email: {e}")

# Password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def is_hashed(password: str) -> bool:
    """Bcrypt hash'leri $2b$, $2a$ veya $2y$ ile başlar"""
    return password.startswith(("$2b$", "$2a$", "$2y$"))

# ==================== Login Rate Limiting ====================
# Basit, tek-sunuculu (in-memory) rate limiter. IP başına başarısız
# deneme sayısını tutar. Sunucu yeniden başlatılınca sıfırlanır.
LOGIN_ATTEMPTS = defaultdict(list)  # ip -> [failed_attempt_timestamps]
MAX_LOGIN_ATTEMPTS = 5
LOCKOUT_SECONDS = 15 * 60  # 15 dakika

def get_client_ip(request: Request) -> str:
    return request.client.host if request.client else "unknown"

def check_rate_limit(ip: str):
    now = time.time()
    recent = [t for t in LOGIN_ATTEMPTS[ip] if now - t < LOCKOUT_SECONDS]
    LOGIN_ATTEMPTS[ip] = recent
    if len(recent) >= MAX_LOGIN_ATTEMPTS:
        raise HTTPException(
            status_code=429,
            detail="Çok fazla başarısız giriş denemesi. Lütfen 15 dakika sonra tekrar deneyin."
        )

def record_failed_attempt(ip: str):
    LOGIN_ATTEMPTS[ip].append(time.time())

def clear_attempts(ip: str):
    LOGIN_ATTEMPTS[ip] = []

# Create the main app
app = FastAPI(title="BERBERHANE API")

@app.on_event("startup")
async def create_indexes():
    """
    Aynı tarih+saat için birden fazla (iptal edilmemiş) randevu oluşmasını
    veritabanı seviyesinde engeller. Bu, iki kişinin aynı anda aynı saati
    seçmesi durumunda oluşabilecek çift randevu riskini tamamen kapatır.
    """
    await db.appointments.create_index(
        [("date", 1), ("time", 1)],
        unique=True,
        partialFilterExpression={"status": {"$in": ["confirmed", "completed"]}},
        name="unique_active_appointment_slot"
    )
    logger.info("Database indexes ensured")

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# ==================== Models ====================

class Service(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    description: str
    duration: int  # minutes
    price: float
    is_active: bool = True
    order: int = 0

class ServiceCreate(BaseModel):
    name: str
    description: str
    duration: int
    price: float
    order: int = 0

class ServiceUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    duration: Optional[int] = None
    price: Optional[float] = None
    is_active: Optional[bool] = None
    order: Optional[int] = None

class Appointment(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    service_id: str
    service_name: str
    customer_name: str
    customer_phone: str
    customer_note: Optional[str] = None
    date: str  # YYYY-MM-DD
    time: str  # HH:MM
    duration: int
    status: str = "confirmed"  # confirmed, cancelled, completed
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

class AppointmentCreate(BaseModel):
    service_id: str
    customer_name: str
    customer_phone: str
    customer_note: Optional[str] = None
    date: str
    time: str

    @field_validator("customer_name")
    @classmethod
    def validate_customer_name(cls, v):
        if not v or len(v.strip()) < 3:
            raise ValueError("Geçerli bir ad soyad giriniz")
        return v.strip()

    @field_validator("customer_phone")
    @classmethod
    def validate_customer_phone(cls, v):
        digits_only = re.sub(r"\D", "", v or "")
        if len(digits_only) < 10 or len(digits_only) > 13:
            raise ValueError("Geçerli bir telefon numarası giriniz")
        return v.strip()

class BlockedSlot(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    date: str  # YYYY-MM-DD
    start_time: Optional[str] = None  # HH:MM - if null, whole day blocked
    end_time: Optional[str] = None
    reason: Optional[str] = None
    is_full_day: bool = False

class BlockedSlotCreate(BaseModel):
    date: str
    start_time: Optional[str] = None
    end_time: Optional[str] = None
    reason: Optional[str] = None
    is_full_day: bool = False

    @model_validator(mode="after")
    def validate_time_range(self):
        if not self.is_full_day:
            if not self.start_time or not self.end_time:
                raise ValueError("Tüm gün seçili değilse başlangıç ve bitiş saati zorunludur")
            if self.start_time >= self.end_time:
                raise ValueError("Bitiş saati başlangıç saatinden sonra olmalı")
        return self

class WorkingHours(BaseModel):
    day: int  # 0=Monday, 6=Sunday
    day_name: str
    is_open: bool
    open_time: str  # HH:MM
    close_time: str  # HH:MM

class Settings(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = "settings"
    shop_name: str = "BERBERHANE"
    phone: str = "+90 555 123 4567"
    whatsapp: str = "+905551234567"
    address: str = "Dumlupınar, 19 Mayıs Cd. No:87 D:b, 41100 Gölcük/Kocaeli, Türkiye"
    working_hours: List[WorkingHours] = [
        WorkingHours(day=0, day_name="Pazartesi", is_open=True, open_time="09:00", close_time="20:00"),
        WorkingHours(day=1, day_name="Salı", is_open=True, open_time="09:00", close_time="20:00"),
        WorkingHours(day=2, day_name="Çarşamba", is_open=True, open_time="09:00", close_time="20:00"),
        WorkingHours(day=3, day_name="Perşembe", is_open=True, open_time="09:00", close_time="20:00"),
        WorkingHours(day=4, day_name="Cuma", is_open=True, open_time="09:00", close_time="20:00"),
        WorkingHours(day=5, day_name="Cumartesi", is_open=True, open_time="09:00", close_time="21:00"),
        WorkingHours(day=6, day_name="Pazar", is_open=False, open_time="10:00", close_time="18:00"),
    ]
    slot_interval: int = 30  # minutes

class SettingsUpdate(BaseModel):
    shop_name: Optional[str] = None
    phone: Optional[str] = None
    whatsapp: Optional[str] = None
    address: Optional[str] = None
    working_hours: Optional[List[WorkingHours]] = None
    slot_interval: Optional[int] = None

class PasswordChange(BaseModel):
    current_password: str
    new_password: str

# ==================== Auth ====================

async def get_admin_password():
    """Get admin password (hash veya eski düz-metin) from database or env"""
    settings = await db.admin_settings.find_one({"id": "admin"}, {"_id": 0})
    if settings and settings.get("password"):
        return settings["password"]
    return ADMIN_PASSWORD

async def verify_and_upgrade_password(plain_password: str) -> bool:
    """
    Şifreyi doğrular. Eğer DB'de eski düz-metin şifre bulunursa ve
    doğrulama başarılı olursa, şifreyi otomatik olarak bcrypt hash'ine
    yükseltir (kullanıcı hiçbir şey yapmak zorunda kalmaz).
    """
    stored = await get_admin_password()

    if is_hashed(stored):
        return pwd_context.verify(plain_password, stored)

    # Eski düz-metin şifre (geriye dönük uyumluluk)
    if plain_password == stored:
        new_hash = pwd_context.hash(plain_password)
        await db.admin_settings.update_one(
            {"id": "admin"},
            {"$set": {"id": "admin", "password": new_hash}},
            upsert=True
        )
        logger.info("Admin password migrated to bcrypt hash")
        return True
    return False

async def verify_admin(request: Request, x_admin_password: str = Header(None)):
    client_ip = get_client_ip(request)
    check_rate_limit(client_ip)

    if not x_admin_password or not await verify_and_upgrade_password(x_admin_password):
        record_failed_attempt(client_ip)
        raise HTTPException(status_code=401, detail="Yetkisiz erişim")

    clear_attempts(client_ip)
    return True

# ==================== Public Routes ====================

@api_router.get("/")
async def root():
    return {"message": "BERBERHANE API", "status": "active"}

@api_router.get("/services", response_model=List[Service])
async def get_services():
    services = await db.services.find({"is_active": True}, {"_id": 0}).sort("order", 1).to_list(100)
    return services

@api_router.get("/settings", response_model=Settings)
async def get_settings():
    settings = await db.settings.find_one({"id": "settings"}, {"_id": 0})
    if not settings:
        default_settings = Settings()
        await db.settings.insert_one(default_settings.model_dump())
        return default_settings
    return Settings(**settings)

@api_router.get("/available-slots/{date}")
async def get_available_slots(date: str, service_id: str):
    """Get available time slots for a specific date and service"""
    # Get service duration
    service = await db.services.find_one({"id": service_id}, {"_id": 0})
    if not service:
        raise HTTPException(status_code=404, detail="Hizmet bulunamadı")
    
    service_duration = service["duration"]
    
    # Get settings for working hours
    settings = await db.settings.find_one({"id": "settings"}, {"_id": 0})
    if not settings:
        settings = Settings().model_dump()
    
    # Parse date to get day of week
    try:
        date_obj = datetime.strptime(date, "%Y-%m-%d")
        day_of_week = date_obj.weekday()
    except ValueError:
        raise HTTPException(status_code=400, detail="Geçersiz tarih formatı")
    
    # Check if day is within working hours
    working_hours = settings.get("working_hours", [])
    day_hours = next((h for h in working_hours if h["day"] == day_of_week), None)
    
    if not day_hours or not day_hours.get("is_open", False):
        return {"slots": [], "all_slots": [], "message": "Bu gün kapalıyız"}
    
    # Check if whole day is blocked
    blocked = await db.blocked_slots.find_one({
        "date": date,
        "is_full_day": True
    }, {"_id": 0})
    
    if blocked:
        return {"slots": [], "all_slots": [], "message": blocked.get("reason", "Bu gün müsait değiliz")}
    
    # Generate all possible slots
    open_time = datetime.strptime(day_hours["open_time"], "%H:%M")
    close_time = datetime.strptime(day_hours["close_time"], "%H:%M")
    slot_interval = settings.get("slot_interval", 30)
    
    slots = []
    current_time = open_time
    
    while current_time + timedelta(minutes=service_duration) <= close_time:
        slot_time = current_time.strftime("%H:%M")
        slots.append(slot_time)
        current_time += timedelta(minutes=slot_interval)
    
    # Get existing appointments for this date
    appointments = await db.appointments.find({
        "date": date,
        "status": {"$ne": "cancelled"}
    }, {"_id": 0}).to_list(100)
    
    # Get blocked time slots for this date
    blocked_slots = await db.blocked_slots.find({
        "date": date,
        "is_full_day": False
    }, {"_id": 0}).to_list(100)
    
    # Filter out unavailable slots
    available_slots = []
    for slot in slots:
        slot_start = datetime.strptime(slot, "%H:%M")
        slot_end = slot_start + timedelta(minutes=service_duration)
        
        is_available = True
        
        # Check against existing appointments
        for appt in appointments:
            appt_start = datetime.strptime(appt["time"], "%H:%M")
            appt_end = appt_start + timedelta(minutes=appt["duration"])
            
            # Check overlap
            if not (slot_end <= appt_start or slot_start >= appt_end):
                is_available = False
                break
        
        # Check against blocked slots
        if is_available:
            for blocked in blocked_slots:
                if blocked.get("start_time") and blocked.get("end_time"):
                    block_start = datetime.strptime(blocked["start_time"], "%H:%M")
                    block_end = datetime.strptime(blocked["end_time"], "%H:%M")
                    
                    if not (slot_end <= block_start or slot_start >= block_end):
                        is_available = False
                        break
        
        # Check if slot is in the past (for today)
        if is_available and date == datetime.now(timezone.utc).strftime("%Y-%m-%d"):
            now = datetime.now(timezone.utc) + timedelta(hours=3)  # Turkey timezone
            if slot_start.hour < now.hour or (slot_start.hour == now.hour and slot_start.minute <= now.minute):
                is_available = False
        
        if is_available:
            available_slots.append(slot)

    all_slots = [{"time": slot, "available": slot in available_slots} for slot in slots]

    # Kısmi bloklar varsa (tüm gün değil, belirli saat aralığı), sebebini de bildir
    partial_block_message = None
    if blocked_slots:
        reasons = [b.get("reason") for b in blocked_slots if b.get("reason")]
        time_ranges = [
            f"{b.get('start_time')}-{b.get('end_time')}" for b in blocked_slots
            if b.get("start_time") and b.get("end_time")
        ]
        if reasons or time_ranges:
            range_str = ", ".join(time_ranges)
            reason_str = ", ".join(dict.fromkeys(reasons)) if reasons else None
            if reason_str:
                partial_block_message = f"{range_str} saatleri arası müsait değil: {reason_str}"
            else:
                partial_block_message = f"{range_str} saatleri arası müsait değil"

    return {
        "slots": available_slots,
        "all_slots": all_slots,
        "service_duration": service_duration,
        "partial_block_message": partial_block_message,
    }

@api_router.post("/appointments", response_model=Appointment)
async def create_appointment(data: AppointmentCreate):
    """Create a new appointment"""
    if not BOOKING_ENABLED:
        raise HTTPException(
            status_code=503,
            detail="Online randevu şu anda kapalı. Randevu için lütfen bizi arayın veya WhatsApp'tan yazın."
        )

    # Verify service exists
    service = await db.services.find_one({"id": data.service_id}, {"_id": 0})
    if not service:
        raise HTTPException(status_code=404, detail="Hizmet bulunamadı")
    
    # Check if slot is still available
    available = await get_available_slots(data.date, data.service_id)
    if data.time not in available["slots"]:
        raise HTTPException(status_code=400, detail="Bu saat dilimi artık müsait değil")
    
    # Create appointment
    appointment = Appointment(
        service_id=data.service_id,
        service_name=service["name"],
        customer_name=data.customer_name,
        customer_phone=data.customer_phone,
        customer_note=data.customer_note,
        date=data.date,
        time=data.time,
        duration=service["duration"]
    )
    
    try:
        await db.appointments.insert_one(appointment.model_dump())
    except DuplicateKeyError:
        raise HTTPException(
            status_code=409,
            detail="Bu saat dilimi az önce başka biri tarafından alındı. Lütfen başka bir saat seçin."
        )

    logger.info(f"New appointment created: {appointment.id}")

    # Admin'e e-posta bildirimi gönder (hata olursa randevu oluşturmayı etkilemez)
    asyncio.create_task(send_new_appointment_notification(appointment))

    return appointment

# ==================== Admin Routes ====================

@api_router.post("/admin/login")
async def admin_login(password: str, request: Request):
    """Simple admin login check (rate limited + bcrypt)"""
    client_ip = get_client_ip(request)
    check_rate_limit(client_ip)

    if await verify_and_upgrade_password(password):
        clear_attempts(client_ip)
        return {"success": True, "message": "Giriş başarılı"}

    record_failed_attempt(client_ip)
    raise HTTPException(status_code=401, detail="Yanlış şifre")

@api_router.post("/admin/change-password")
async def admin_change_password(data: PasswordChange, auth: bool = Depends(verify_admin)):
    """Change admin password"""
    if not await verify_and_upgrade_password(data.current_password):
        raise HTTPException(status_code=400, detail="Mevcut şifre yanlış")
    
    if len(data.new_password) < 6:
        raise HTTPException(status_code=400, detail="Yeni şifre en az 6 karakter olmalı")

    # Şifre her istekte HTTP başlığında (X-Admin-Password) gönderildiği için
    # sadece standart İngilizce harf, rakam ve sembollere izin veriyoruz.
    # Türkçe karakter içeren şifreler tarayıcıda başlığa eklenemiyor.
    if not re.fullmatch(r"[\x21-\x7E]+", data.new_password):
        raise HTTPException(
            status_code=400,
            detail="Şifrede Türkçe karakter (ç, ğ, ı, İ, ö, ş, ü) ve boşluk kullanılamaz"
        )
    
    new_hash = pwd_context.hash(data.new_password)
    await db.admin_settings.update_one(
        {"id": "admin"},
        {"$set": {"id": "admin", "password": new_hash}},
        upsert=True
    )
    
    return {"success": True, "message": "Şifre başarıyla değiştirildi"}

# Services Management
@api_router.get("/admin/services", response_model=List[Service])
async def admin_get_services(auth: bool = Depends(verify_admin)):
    services = await db.services.find({}, {"_id": 0}).sort("order", 1).to_list(100)
    return services

@api_router.post("/admin/services", response_model=Service)
async def admin_create_service(data: ServiceCreate, auth: bool = Depends(verify_admin)):
    service = Service(**data.model_dump())
    await db.services.insert_one(service.model_dump())
    return service

@api_router.put("/admin/services/{service_id}", response_model=Service)
async def admin_update_service(service_id: str, data: ServiceUpdate, auth: bool = Depends(verify_admin)):
    update_data = {k: v for k, v in data.model_dump().items() if v is not None}
    if not update_data:
        raise HTTPException(status_code=400, detail="Güncellenecek veri yok")
    
    result = await db.services.update_one({"id": service_id}, {"$set": update_data})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Hizmet bulunamadı")
    
    service = await db.services.find_one({"id": service_id}, {"_id": 0})
    return Service(**service)

@api_router.delete("/admin/services/{service_id}")
async def admin_delete_service(service_id: str, auth: bool = Depends(verify_admin)):
    result = await db.services.delete_one({"id": service_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Hizmet bulunamadı")
    return {"success": True, "message": "Hizmet silindi"}

# Appointments Management
@api_router.get("/admin/appointments", response_model=List[Appointment])
async def admin_get_appointments(
    auth: bool = Depends(verify_admin),
    date: Optional[str] = None,
    status: Optional[str] = None
):
    query = {}
    if date:
        query["date"] = date
    if status:
        query["status"] = status
    
    appointments = await db.appointments.find(query, {"_id": 0}).sort([("date", 1), ("time", 1)]).to_list(1000)
    return appointments

@api_router.put("/admin/appointments/{appointment_id}/status")
async def admin_update_appointment_status(
    appointment_id: str,
    status: str,
    auth: bool = Depends(verify_admin)
):
    if status not in ["confirmed", "cancelled", "completed"]:
        raise HTTPException(status_code=400, detail="Geçersiz durum")
    
    result = await db.appointments.update_one(
        {"id": appointment_id},
        {"$set": {"status": status}}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Randevu bulunamadı")
    
    return {"success": True, "message": "Randevu durumu güncellendi"}

@api_router.delete("/admin/appointments/{appointment_id}")
async def admin_delete_appointment(appointment_id: str, auth: bool = Depends(verify_admin)):
    result = await db.appointments.delete_one({"id": appointment_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Randevu bulunamadı")
    return {"success": True, "message": "Randevu silindi"}

# Blocked Slots Management
@api_router.get("/admin/blocked-slots", response_model=List[BlockedSlot])
async def admin_get_blocked_slots(auth: bool = Depends(verify_admin)):
    blocked = await db.blocked_slots.find({}, {"_id": 0}).sort("date", 1).to_list(100)
    return blocked

@api_router.post("/admin/blocked-slots", response_model=BlockedSlot)
async def admin_create_blocked_slot(data: BlockedSlotCreate, auth: bool = Depends(verify_admin)):
    blocked = BlockedSlot(**data.model_dump())
    await db.blocked_slots.insert_one(blocked.model_dump())
    return blocked

@api_router.delete("/admin/blocked-slots/{slot_id}")
async def admin_delete_blocked_slot(slot_id: str, auth: bool = Depends(verify_admin)):
    result = await db.blocked_slots.delete_one({"id": slot_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Bloklu slot bulunamadı")
    return {"success": True, "message": "Bloklu slot silindi"}

# Settings Management
@api_router.put("/admin/settings", response_model=Settings)
async def admin_update_settings(data: SettingsUpdate, auth: bool = Depends(verify_admin)):
    update_data = {k: v for k, v in data.model_dump().items() if v is not None}
    if "working_hours" in update_data:
        update_data["working_hours"] = [h.model_dump() if hasattr(h, 'model_dump') else h for h in update_data["working_hours"]]
    
    await db.settings.update_one(
        {"id": "settings"},
        {"$set": update_data},
        upsert=True
    )
    
    settings = await db.settings.find_one({"id": "settings"}, {"_id": 0})
    return Settings(**settings)

# Seed initial data
@api_router.post("/admin/seed")
async def seed_data(auth: bool = Depends(verify_admin)):
    """Seed initial services and settings"""
    # Check if already seeded
    services_count = await db.services.count_documents({})
    if services_count > 0:
        return {"message": "Veriler zaten mevcut"}
    
    # Default services
    default_services = [
        Service(name="Saç Kesimi", description="Profesyonel erkek saç kesimi", duration=30, price=150, order=1),
        Service(name="Sakal Kesimi", description="Sakal düzeltme ve şekillendirme", duration=20, price=100, order=2),
        Service(name="Saç + Sakal", description="Saç kesimi ve sakal bakımı kombo", duration=45, price=220, order=3),
        Service(name="Çocuk Saç Kesimi", description="12 yaş altı çocuklar için", duration=20, price=100, order=4),
        Service(name="Saç Yıkama & Şekillendirme", description="Yıkama ve fön çekimi", duration=20, price=80, order=5),
        Service(name="Damat Paketi", description="Özel gün için komple bakım", duration=90, price=500, order=6),
    ]
    
    for service in default_services:
        await db.services.insert_one(service.model_dump())
    
    # Default settings
    default_settings = Settings()
    await db.settings.update_one(
        {"id": "settings"},
        {"$set": default_settings.model_dump()},
        upsert=True
    )
    
    return {"message": "Veriler oluşturuldu", "services_created": len(default_services)}

# Include the router in the main app
app.include_router(api_router)

cors_origins_env = os.environ.get('CORS_ORIGINS', 'http://localhost:3000')
cors_origins = [origin.strip() for origin in cors_origins_env.split(',') if origin.strip()]

app.add_middleware(
    CORSMiddleware,
    # Not: Admin yetkilendirmesi çerez (cookie) değil, özel bir header
    # (X-Admin-Password) ile yapılıyor. Bu yüzden allow_credentials=False
    # güvenle kullanılabiliyor; bu da CORS_ORIGINS="*" durumunda bile
    # tarayıcı uyumluluğunu bozmuyor.
    allow_credentials=False,
    allow_origins=cors_origins,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()