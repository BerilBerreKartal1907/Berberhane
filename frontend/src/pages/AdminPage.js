import { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { format, addDays, subDays, parseISO } from "date-fns";
import { tr } from "date-fns/locale";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  House,
  CalendarCheck,
  Scissors,
  Clock,
  Gear,
  SignOut,
  CaretLeft,
  CaretRight,
  Plus,
  Trash,
  PencilSimple,
  Check,
  X,
  CalendarX,
  Key,
  DotsSixVertical,
} from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { toast } from "sonner";
import {
  adminLogin,
  adminGetServices,
  adminCreateService,
  adminUpdateService,
  adminDeleteService,
  adminGetAppointments,
  adminUpdateAppointmentStatus,
  adminDeleteAppointment,
  adminGetBlockedSlots,
  adminCreateBlockedSlot,
  adminDeleteBlockedSlot,
  adminUpdateSettings,
  adminChangePassword,
  adminSeedData,
  getSettings,
} from "@/lib/api";

const SortableServiceItem = ({ service, onEdit, onDelete }) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: service.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="bg-[#171717] border border-[#262626] rounded-sm p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
      data-testid={`admin-service-${service.id}`}
    >
      <div className="flex items-center gap-3 flex-1 w-full">
        <button
          {...attributes}
          {...listeners}
          className="text-[#525252] hover:text-[#D97706] cursor-grab active:cursor-grabbing touch-none p-2 -m-2"
          aria-label="Sürükleyerek sırala"
          data-testid={`drag-handle-${service.id}`}
        >
          <DotsSixVertical size={22} weight="bold" />
        </button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h3 className="font-oswald text-lg uppercase text-white">{service.name}</h3>
            {!service.is_active && (
              <span className="text-xs bg-red-400/10 text-red-400 px-2 py-1 rounded">Pasif</span>
            )}
          </div>
          <p className="text-sm text-[#A3A3A3] mt-1">{service.description}</p>
          <div className="flex gap-4 mt-2 text-sm text-[#A3A3A3]">
            <span>{service.duration} dk</span>
            <span className="text-[#D97706]">₺{service.price}</span>
          </div>
        </div>
      </div>
      <div className="flex gap-1">
        <Button
          size="icon"
          variant="ghost"
          onClick={() => onEdit(service)}
          className="text-[#A3A3A3] hover:text-white w-11 h-11 [&_svg]:!size-5"
        >
          <PencilSimple size={20} />
        </Button>
        <Button
          size="icon"
          variant="ghost"
          onClick={() => onDelete(service.id)}
          className="text-[#A3A3A3] hover:text-red-400 w-11 h-11 [&_svg]:!size-5"
        >
          <Trash size={20} />
        </Button>
      </div>
    </div>
  );
};

const AdminPage = () => {
  const navigate = useNavigate();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState("");
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [activeTab, setActiveTab] = useState("appointments");

  // Data states
  const [appointments, setAppointments] = useState([]);
  const [services, setServices] = useState([]);
  const [blockedSlots, setBlockedSlots] = useState([]);
  const [settings, setSettings] = useState(null);
  const [generalForm, setGeneralForm] = useState({
    shop_name: "",
    phone: "",
    whatsapp: "",
    address: "",
  });
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [loading, setLoading] = useState(false);

  // Modal states
  const [serviceModal, setServiceModal] = useState({ open: false, service: null });
  const [blockModal, setBlockModal] = useState({ open: false });
  const [passwordModal, setPasswordModal] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [blockDate, setBlockDate] = useState(null);
  const [blockFullDay, setBlockFullDay] = useState(true);
  const [blockStartTime, setBlockStartTime] = useState("");
  const [blockEndTime, setBlockEndTime] = useState("");
  const [blockReason, setBlockReason] = useState("");

  // Service form
  const [serviceForm, setServiceForm] = useState({
    name: "",
    description: "",
    duration: 30,
    price: 0,
    order: 0,
  });

  // Store password for API calls
  const [storedPassword, setStoredPassword] = useState("");

  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoggingIn(true);
    try {
      await adminLogin(password);
      setStoredPassword(password);
      setIsAuthenticated(true);
      toast.success("Giriş başarılı!");

      // Seed data if needed
      try {
        await adminSeedData(password);
      } catch (e) {
        // Ignore - data may already exist
      }
    } catch (error) {
      if (error?.response?.status === 429) {
        toast.error(
          error?.response?.data?.detail ||
            "Çok fazla başarısız deneme. Lütfen bir süre sonra tekrar deneyin."
        );
      } else {
        toast.error("Yanlış şifre!");
      }
      setPassword("");
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setStoredPassword("");
    setPassword("");
    setNewAppointmentCount(0);
    seenAppointmentIds.current = new Set();
    isFirstPoll.current = true;
  };

  // Fetch data on authentication
  useEffect(() => {
    if (isAuthenticated) {
      fetchData();
    }
  }, [isAuthenticated, selectedDate]);

  // ==================== Yeni randevu bildirimi (ücretsiz, site-içi) ====================
  const [newAppointmentCount, setNewAppointmentCount] = useState(0);
  const seenAppointmentIds = useRef(new Set());
  const isFirstPoll = useRef(true);

  const playNotificationSound = () => {
    try {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      const ctx = new AudioContextClass();
      const oscillator = ctx.createOscillator();
      const gain = ctx.createGain();
      oscillator.connect(gain);
      gain.connect(ctx.destination);
      oscillator.type = "sine";
      oscillator.frequency.setValueAtTime(880, ctx.currentTime);
      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
      oscillator.start();
      oscillator.stop(ctx.currentTime + 0.4);
    } catch (e) {
      // Tarayıcı ses çalmayı desteklemiyorsa sessizce geç
    }
  };

  useEffect(() => {
    if (!isAuthenticated) return;

    const checkForNewAppointments = async () => {
      try {
        // Tarih filtresi vermeden TÜM randevuları çekiyoruz, sadece bugünü değil
        // (müşteri ileri bir tarihe randevu alsa bile bildirim gelsin diye)
        const allAppointments = await adminGetAppointments(storedPassword);

        if (isFirstPoll.current) {
          // İlk kontrolde mevcut randevuları "görülmüş" say, bildirim gösterme
          allAppointments.forEach((a) => seenAppointmentIds.current.add(a.id));
          isFirstPoll.current = false;
          return;
        }

        const freshOnes = allAppointments.filter(
          (a) => !seenAppointmentIds.current.has(a.id)
        );

        if (freshOnes.length > 0) {
          freshOnes.forEach((a) => seenAppointmentIds.current.add(a.id));
          setNewAppointmentCount((prev) => prev + freshOnes.length);
          playNotificationSound();
          const formatAppointmentDate = (appt) => {
            try {
              const readableDate = format(parseISO(appt.date), "d MMMM yyyy", { locale: tr });
              return `${readableDate} saat:${appt.time}`;
            } catch (e) {
              return `${appt.date} ${appt.time}`;
            }
          };
          toast.success(
            freshOnes.length === 1
              ? `Yeni randevu: ${freshOnes[0].customer_name} - ${formatAppointmentDate(freshOnes[0])}`
              : `${freshOnes.length} yeni randevu geldi!`
          );
        }
      } catch (e) {
        // Sessizce geç, arka plan kontrolü kullanıcıyı rahatsız etmesin
      }
    };

    const intervalId = setInterval(checkForNewAppointments, 20000);
    checkForNewAppointments();

    return () => clearInterval(intervalId);
  }, [isAuthenticated, storedPassword]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [appointmentsData, servicesData, blockedData, settingsData] = await Promise.all([
        adminGetAppointments(storedPassword, format(selectedDate, "yyyy-MM-dd")),
        adminGetServices(storedPassword),
        adminGetBlockedSlots(storedPassword),
        getSettings(),
      ]);
      setAppointments(appointmentsData);
      setServices(servicesData);
      setBlockedSlots(blockedData);
      setSettings(settingsData);
      setGeneralForm({
        shop_name: settingsData.shop_name || "",
        phone: settingsData.phone || "",
        whatsapp: settingsData.whatsapp || "",
        address: settingsData.address || "",
      });
    } catch (error) {
      console.error("Error fetching data:", error);
      toast.error("Veriler yüklenemedi");
    } finally {
      setLoading(false);
    }
  };

  // Service CRUD
  const openServiceModal = (service = null) => {
    if (service) {
      setServiceForm({
        name: service.name,
        description: service.description,
        duration: service.duration,
        price: service.price,
        order: service.order || 0,
      });
    } else {
      setServiceForm({ name: "", description: "", duration: 30, price: 0, order: services.length });
    }
    setServiceModal({ open: true, service });
  };

  const saveService = async () => {
    if (!serviceForm.name || !serviceForm.name.trim()) {
      toast.error("Hizmet adı boş bırakılamaz");
      return;
    }
    if (!serviceForm.duration || serviceForm.duration <= 0) {
      toast.error("Süre 0'dan büyük olmalı");
      return;
    }
    if (serviceForm.price === "" || serviceForm.price === null || serviceForm.price < 0) {
      toast.error("Fiyat 0 veya daha büyük olmalı");
      return;
    }
    try {
      if (serviceModal.service) {
        await adminUpdateService(storedPassword, serviceModal.service.id, serviceForm);
        toast.success("Hizmet güncellendi");
      } else {
        await adminCreateService(storedPassword, serviceForm);
        toast.success("Hizmet oluşturuldu");
      }
      setServiceModal({ open: false, service: null });
      fetchData();
    } catch (error) {
      toast.error("Hizmet kaydedilemedi");
    }
  };

  const deleteService = async (serviceId) => {
    if (!window.confirm("Bu hizmeti silmek istediğinizden emin misiniz?")) return;
    try {
      await adminDeleteService(storedPassword, serviceId);
      toast.success("Hizmet silindi");
      fetchData();
    } catch (error) {
      toast.error("Hizmet silinemedi");
    }
  };

  // Drag & drop reordering (hem mouse hem dokunmatik için)
  const dndSensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 150, tolerance: 5 } })
  );

  const handleServiceDragEnd = async (event) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = services.findIndex((s) => s.id === active.id);
    const newIndex = services.findIndex((s) => s.id === over.id);
    const reordered = arrayMove(services, oldIndex, newIndex);
    const updated = reordered.map((service, index) => ({ ...service, order: index + 1 }));

    setServices(updated);

    try {
      await Promise.all(
        updated.map((service) =>
          adminUpdateService(storedPassword, service.id, { order: service.order })
        )
      );
    } catch (error) {
      toast.error("Sıralama kaydedilemedi");
      fetchData();
    }
  };

  // Appointment management
  const updateAppointmentStatus = async (appointmentId, status) => {
    try {
      await adminUpdateAppointmentStatus(storedPassword, appointmentId, status);
      toast.success("Randevu durumu güncellendi");
      fetchData();
    } catch (error) {
      toast.error("Durum güncellenemedi");
    }
  };

  const deleteAppointment = async (appointmentId) => {
    if (!window.confirm("Bu randevuyu silmek istediğinizden emin misiniz?")) return;
    try {
      await adminDeleteAppointment(storedPassword, appointmentId);
      toast.success("Randevu silindi");
      fetchData();
    } catch (error) {
      toast.error("Randevu silinemedi");
    }
  };

  // Blocked slots management
  const saveBlockedSlot = async () => {
    if (!blockDate) {
      toast.error("Lütfen bir tarih seçin");
      return;
    }
    if (!blockFullDay) {
      if (!blockStartTime || !blockEndTime) {
        toast.error("Lütfen başlangıç ve bitiş saatini girin");
        return;
      }
      if (blockStartTime >= blockEndTime) {
        toast.error("Bitiş saati başlangıç saatinden sonra olmalı");
        return;
      }
    }

    try {
      await adminCreateBlockedSlot(storedPassword, {
        date: format(blockDate, "yyyy-MM-dd"),
        is_full_day: blockFullDay,
        start_time: blockFullDay ? null : blockStartTime,
        end_time: blockFullDay ? null : blockEndTime,
        reason: blockReason || null,
      });
      toast.success("Blok oluşturuldu");
      setBlockModal({ open: false });
      setBlockDate(null);
      setBlockFullDay(true);
      setBlockStartTime("");
      setBlockEndTime("");
      setBlockReason("");
      fetchData();
    } catch (error) {
      toast.error("Blok oluşturulamadı");
    }
  };

  const deleteBlockedSlot = async (slotId) => {
    try {
      await adminDeleteBlockedSlot(storedPassword, slotId);
      toast.success("Blok kaldırıldı");
      fetchData();
    } catch (error) {
      toast.error("Blok kaldırılamadı");
    }
  };

  // Password change
  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      toast.error("Tüm alanları doldurun");
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error("Yeni şifreler eşleşmiyor");
      return;
    }
    if (newPassword.length < 6) {
      toast.error("Yeni şifre en az 6 karakter olmalı");
      return;
    }

    try {
      await adminChangePassword(storedPassword, currentPassword, newPassword);
      toast.success("Şifre başarıyla değiştirildi");
      setStoredPassword(newPassword);
      setPasswordModal(false);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (error) {
      toast.error(error.response?.data?.detail || "Şifre değiştirilemedi");
    }
  };

  // Settings update
  const updateWorkingHours = async (dayIndex, field, value) => {
    const newHours = [...settings.working_hours];
    newHours[dayIndex] = { ...newHours[dayIndex], [field]: value };

    try {
      await adminUpdateSettings(storedPassword, { working_hours: newHours });
      setSettings({ ...settings, working_hours: newHours });
      toast.success("Çalışma saatleri güncellendi");
    } catch (error) {
      toast.error("Güncelleme başarısız");
    }
  };

  const saveGeneralSettings = async () => {
    try {
      const updated = await adminUpdateSettings(storedPassword, {
        shop_name: generalForm.shop_name,
        phone: generalForm.phone,
        whatsapp: generalForm.whatsapp,
        address: generalForm.address,
      });
      setSettings(updated);
      toast.success("Genel ayarlar güncellendi");
    } catch (error) {
      toast.error("Güncelleme başarısız");
    }
  };

  // Login Screen
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center px-4">
        <div className="w-full max-w-md" data-testid="admin-login">
          <div className="text-center mb-8">
            <Link to="/" className="font-oswald text-3xl font-bold tracking-tight text-white">
              BERBERHANE
            </Link>
            <p className="text-[#A3A3A3] mt-2 font-manrope">Yönetici Paneli</p>
          </div>

          <form
            onSubmit={handleLogin}
            className="bg-[#171717] border border-[#262626] rounded-sm p-6"
          >
            <div className="mb-4">
              <label className="block text-sm font-manrope text-[#A3A3A3] mb-2">
                Şifre
              </label>
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Şifrenizi girin"
                className="bg-[#0A0A0A] border-[#262626] text-white"
                data-testid="admin-password-input"
              />
            </div>

            <Button
              type="submit"
              disabled={isLoggingIn || !password}
              className="w-full bg-[#D97706] hover:bg-[#B45309] text-white font-oswald uppercase tracking-wider"
              data-testid="admin-login-btn"
            >
              {isLoggingIn ? "Giriş yapılıyor..." : "Giriş Yap"}
            </Button>

            <Link
              to="/"
              className="block text-center mt-4 text-[#A3A3A3] hover:text-white text-sm font-manrope transition-colors"
            >
              ← Ana Sayfaya Dön
            </Link>
          </form>
        </div>
      </div>
    );
  }

  // Admin Dashboard
  return (
    <div className="min-h-screen bg-[#0A0A0A] flex" data-testid="admin-dashboard">
      {/* Sidebar */}
      <aside className="w-64 bg-[#0A0A0A] border-r border-[#262626] fixed h-full hidden lg:block">
        <div className="p-6 border-b border-[#262626]">
          <Link to="/" className="font-oswald text-2xl font-bold tracking-tight text-white">
            BERBERHANE
          </Link>
          <p className="text-xs text-[#A3A3A3] font-manrope mt-1">Yönetici Paneli</p>
        </div>

        <nav className="p-4 space-y-2">
          <button
            onClick={() => setActiveTab("appointments")}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-sm transition-colors font-manrope ${
              activeTab === "appointments"
                ? "bg-[#D97706]/10 text-[#D97706] border border-[#D97706]/20"
                : "text-[#A3A3A3] hover:bg-[#171717]"
            }`}
            data-testid="nav-appointments"
          >
            <CalendarCheck size={20} weight="duotone" />
            Randevular
          </button>

          <button
            onClick={() => setActiveTab("services")}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-sm transition-colors font-manrope ${
              activeTab === "services"
                ? "bg-[#D97706]/10 text-[#D97706] border border-[#D97706]/20"
                : "text-[#A3A3A3] hover:bg-[#171717]"
            }`}
            data-testid="nav-services"
          >
            <Scissors size={20} weight="duotone" />
            Hizmetler
          </button>

          <button
            onClick={() => setActiveTab("schedule")}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-sm transition-colors font-manrope ${
              activeTab === "schedule"
                ? "bg-[#D97706]/10 text-[#D97706] border border-[#D97706]/20"
                : "text-[#A3A3A3] hover:bg-[#171717]"
            }`}
            data-testid="nav-schedule"
          >
            <Clock size={20} weight="duotone" />
            Çalışma Saatleri
          </button>

          <button
            onClick={() => setActiveTab("blocks")}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-sm transition-colors font-manrope ${
              activeTab === "blocks"
                ? "bg-[#D97706]/10 text-[#D97706] border border-[#D97706]/20"
                : "text-[#A3A3A3] hover:bg-[#171717]"
            }`}
            data-testid="nav-blocks"
          >
            <CalendarX size={20} weight="duotone" />
            Bloklu Günler
          </button>

          <button
            onClick={() => setActiveTab("general")}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-sm transition-colors font-manrope ${
              activeTab === "general"
                ? "bg-[#D97706]/10 text-[#D97706] border border-[#D97706]/20"
                : "text-[#A3A3A3] hover:bg-[#171717]"
            }`}
            data-testid="nav-general"
          >
            <Gear size={20} weight="duotone" />
            Genel Ayarlar
          </button>
        </nav>

        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-[#262626]">
          <button
            onClick={() => setPasswordModal(true)}
            className="w-full flex items-center gap-3 px-4 py-3 text-[#A3A3A3] hover:bg-[#171717] rounded-sm transition-colors font-manrope mb-2"
            data-testid="change-password-btn"
          >
            <Key size={20} weight="duotone" />
            Şifre Değiştir
          </button>
          <button
            onClick={() => navigate("/")}
            className="w-full flex items-center gap-3 px-4 py-3 text-[#A3A3A3] hover:bg-[#171717] rounded-sm transition-colors font-manrope mb-2"
          >
            <House size={20} weight="duotone" />
            Siteye Git
          </button>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 text-red-400 hover:bg-red-400/10 rounded-sm transition-colors font-manrope"
            data-testid="logout-btn"
          >
            <SignOut size={20} weight="duotone" />
            Çıkış Yap
          </button>
        </div>
      </aside>

      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 bg-[#0A0A0A] border-b border-[#262626] z-50 p-4">
        <div className="flex items-center justify-between">
          <span className="font-oswald text-xl text-white">BERBERHANE</span>
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate("/")}
              className="text-[#A3A3A3]"
              aria-label="Siteye Git"
              data-testid="mobile-home-btn"
            >
              <House size={22} />
            </button>
            <button
              onClick={() => setPasswordModal(true)}
              className="text-[#A3A3A3]"
              aria-label="Şifre Değiştir"
              data-testid="mobile-change-password-btn"
            >
              <Key size={22} />
            </button>
            <button onClick={handleLogout} className="text-red-400" aria-label="Çıkış Yap">
              <SignOut size={24} />
            </button>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-2 mt-4">
          {["appointments", "services", "schedule", "blocks", "general"].map((tab) => (
            <button
              key={tab}
              onClick={() => {
                setActiveTab(tab);
                if (tab === "appointments") setNewAppointmentCount(0);
              }}
              className={`relative px-2 py-2 rounded-sm text-xs font-manrope text-center ${
                activeTab === tab
                  ? "bg-[#D97706] text-white"
                  : "bg-[#171717] text-[#A3A3A3]"
              }`}
            >
              {tab === "appointments" && "Randevular"}
              {tab === "services" && "Hizmetler"}
              {tab === "schedule" && "Saatler"}
              {tab === "blocks" && "Bloklar"}
              {tab === "general" && "Genel"}
              {tab === "appointments" && newAppointmentCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  {newAppointmentCount}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Main Content */}
      <main className="flex-1 lg:ml-64 pt-44 lg:pt-0">
        <div className="p-4 sm:p-6 lg:p-8">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="w-8 h-8 border-2 border-[#D97706] border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <>
              {/* Appointments Tab */}
              {activeTab === "appointments" && (
                <div data-testid="appointments-tab">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
                    <h1 className="font-oswald text-2xl sm:text-3xl uppercase tracking-tight text-white">
                      Randevular
                    </h1>

                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => setSelectedDate(subDays(selectedDate, 1))}
                        className="border-[#262626] text-white"
                      >
                        <CaretLeft size={18} />
                      </Button>
                      <span className="px-4 py-2 bg-[#171717] border border-[#262626] rounded-sm text-white font-manrope min-w-[180px] text-center">
                        {format(selectedDate, "d MMMM yyyy", { locale: tr })}
                      </span>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => setSelectedDate(addDays(selectedDate, 1))}
                        className="border-[#262626] text-white"
                      >
                        <CaretRight size={18} />
                      </Button>
                    </div>
                  </div>

                  {appointments.length === 0 ? (
                    <div className="bg-[#171717] border border-[#262626] rounded-sm p-8 text-center">
                      <CalendarCheck size={48} weight="duotone" className="text-[#A3A3A3] mx-auto mb-4" />
                      <p className="text-[#A3A3A3] font-manrope">Bu tarihte randevu bulunmuyor.</p>
                    </div>
                  ) : (
                    <>
                      {/* Mobil: kart görünümü */}
                      <div className="md:hidden space-y-3">
                        {appointments.map((appt) => (
                          <div
                            key={appt.id}
                            className="bg-[#171717] border border-[#262626] rounded-sm p-4"
                            data-testid={`appointment-card-${appt.id}`}
                          >
                            <div className="flex items-center justify-between mb-3">
                              <span className="font-oswald text-lg text-[#D97706]">{appt.time}</span>
                              <span className={`badge badge-${appt.status}`}>
                                {appt.status === "confirmed" && "Onaylı"}
                                {appt.status === "cancelled" && "İptal"}
                                {appt.status === "completed" && "Tamamlandı"}
                              </span>
                            </div>
                            <p className="font-manrope text-white mb-0.5">{appt.customer_name}</p>
                            <p className="text-sm text-[#A3A3A3] mb-1">{appt.customer_phone}</p>
                            <p className="text-sm text-[#A3A3A3] mb-3">{appt.service_name}</p>
                            <div className="flex items-center gap-2 pt-3 border-t border-[#262626]">
                              {appt.status === "confirmed" && (
                                <>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => updateAppointmentStatus(appt.id, "completed")}
                                    className="flex-1 text-[#22c55e] hover:bg-[#22c55e]/10 border border-[#22c55e]/20"
                                  >
                                    <Check size={16} className="mr-1" /> Tamamlandı
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => updateAppointmentStatus(appt.id, "cancelled")}
                                    className="flex-1 text-red-400 hover:bg-red-400/10 border border-red-400/20"
                                  >
                                    <X size={16} className="mr-1" /> İptal
                                  </Button>
                                </>
                              )}
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => deleteAppointment(appt.id)}
                                className="text-[#A3A3A3] hover:text-red-400"
                              >
                                <Trash size={16} />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Masaüstü: tablo görünümü */}
                      <div className="hidden md:block bg-[#171717] border border-[#262626] rounded-sm overflow-hidden">
                        <div className="overflow-x-auto">
                          <table className="w-full">
                            <thead>
                              <tr className="border-b border-[#262626]">
                                <th className="text-left p-4 font-manrope text-xs uppercase tracking-wider text-[#A3A3A3]">
                                  Saat
                                </th>
                                <th className="text-left p-4 font-manrope text-xs uppercase tracking-wider text-[#A3A3A3]">
                                  Müşteri
                                </th>
                                <th className="text-left p-4 font-manrope text-xs uppercase tracking-wider text-[#A3A3A3]">
                                  Hizmet
                                </th>
                                <th className="text-left p-4 font-manrope text-xs uppercase tracking-wider text-[#A3A3A3]">
                                  Durum
                                </th>
                                <th className="text-right p-4 font-manrope text-xs uppercase tracking-wider text-[#A3A3A3]">
                                  İşlem
                                </th>
                              </tr>
                            </thead>
                            <tbody>
                              {appointments.map((appt) => (
                                <tr key={appt.id} className="border-b border-[#262626] last:border-0">
                                  <td className="p-4 font-manrope text-white">{appt.time}</td>
                                  <td className="p-4">
                                    <p className="font-manrope text-white">{appt.customer_name}</p>
                                    <p className="text-sm text-[#A3A3A3]">{appt.customer_phone}</p>
                                  </td>
                                  <td className="p-4 font-manrope text-[#A3A3A3]">{appt.service_name}</td>
                                  <td className="p-4">
                                    <span className={`badge badge-${appt.status}`}>
                                      {appt.status === "confirmed" && "Onaylı"}
                                      {appt.status === "cancelled" && "İptal"}
                                      {appt.status === "completed" && "Tamamlandı"}
                                    </span>
                                  </td>
                                  <td className="p-4">
                                    <div className="flex items-center justify-end gap-2">
                                      {appt.status === "confirmed" && (
                                        <>
                                          <Button
                                            size="icon"
                                            variant="ghost"
                                            onClick={() => updateAppointmentStatus(appt.id, "completed")}
                                            className="text-[#22c55e] hover:bg-[#22c55e]/10"
                                            title="Tamamlandı"
                                          >
                                            <Check size={18} />
                                          </Button>
                                          <Button
                                            size="icon"
                                            variant="ghost"
                                            onClick={() => updateAppointmentStatus(appt.id, "cancelled")}
                                            className="text-red-400 hover:bg-red-400/10"
                                            title="İptal Et"
                                          >
                                            <X size={18} />
                                          </Button>
                                        </>
                                      )}
                                      <Button
                                        size="icon"
                                        variant="ghost"
                                        onClick={() => deleteAppointment(appt.id)}
                                        className="text-[#A3A3A3] hover:text-red-400"
                                        title="Sil"
                                      >
                                        <Trash size={18} />
                                      </Button>
                                    </div>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              )}

              {/* Services Tab */}
              {activeTab === "services" && (
                <div data-testid="services-tab">
                  <div className="flex items-center justify-between mb-6">
                    <h1 className="font-oswald text-2xl sm:text-3xl uppercase tracking-tight text-white">
                      Hizmetler
                    </h1>
                    <Button
                      onClick={() => openServiceModal()}
                      className="bg-[#D97706] hover:bg-[#B45309] text-white"
                      data-testid="add-service-btn"
                    >
                      <Plus size={18} className="mr-2" />
                      Hizmet Ekle
                    </Button>
                  </div>

                  <div className="grid gap-4">
                    <DndContext
                      sensors={dndSensors}
                      collisionDetection={closestCenter}
                      onDragEnd={handleServiceDragEnd}
                    >
                      <SortableContext
                        items={services.map((s) => s.id)}
                        strategy={verticalListSortingStrategy}
                      >
                        {services.map((service) => (
                          <SortableServiceItem
                            key={service.id}
                            service={service}
                            onEdit={openServiceModal}
                            onDelete={deleteService}
                          />
                        ))}
                      </SortableContext>
                    </DndContext>
                  </div>
                </div>
              )}

              {/* Schedule Tab */}
              {activeTab === "schedule" && settings && (
                <div data-testid="schedule-tab">
                  <h1 className="font-oswald text-2xl sm:text-3xl uppercase tracking-tight text-white mb-6">
                    Çalışma Saatleri
                  </h1>

                  <div className="bg-[#171717] border border-[#262626] rounded-sm p-4 sm:p-6">
                    <div className="space-y-4">
                      {settings.working_hours.map((day, index) => (
                        <div
                          key={day.day}
                          className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-[#262626] last:border-0"
                        >
                          <div className="flex items-center gap-4">
                            <Switch
                              checked={day.is_open}
                              onCheckedChange={(checked) =>
                                updateWorkingHours(index, "is_open", checked)
                              }
                            />
                            <span
                              className={`font-manrope min-w-[100px] ${
                                day.is_open ? "text-white" : "text-[#A3A3A3]"
                              }`}
                            >
                              {day.day_name}
                            </span>
                          </div>

                          {day.is_open && (
                            <div className="flex items-center gap-2">
                              <Input
                                type="time"
                                value={day.open_time}
                                onChange={(e) =>
                                  updateWorkingHours(index, "open_time", e.target.value)
                                }
                                className="w-32 bg-[#0A0A0A] border-[#262626] text-white"
                              />
                              <span className="text-[#A3A3A3]">-</span>
                              <Input
                                type="time"
                                value={day.close_time}
                                onChange={(e) =>
                                  updateWorkingHours(index, "close_time", e.target.value)
                                }
                                className="w-32 bg-[#0A0A0A] border-[#262626] text-white"
                              />
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Blocks Tab */}
              {activeTab === "blocks" && (
                <div data-testid="blocks-tab">
                  <div className="flex items-center justify-between mb-6">
                    <h1 className="font-oswald text-2xl sm:text-3xl uppercase tracking-tight text-white">
                      Bloklu Günler
                    </h1>
                    <Button
                      onClick={() => setBlockModal({ open: true })}
                      className="bg-[#D97706] hover:bg-[#B45309] text-white"
                      data-testid="add-block-btn"
                    >
                      <Plus size={18} className="mr-2" />
                      Blok Ekle
                    </Button>
                  </div>

                  {blockedSlots.length === 0 ? (
                    <div className="bg-[#171717] border border-[#262626] rounded-sm p-8 text-center">
                      <CalendarX size={48} weight="duotone" className="text-[#A3A3A3] mx-auto mb-4" />
                      <p className="text-[#A3A3A3] font-manrope">Bloklu gün veya saat bulunmuyor.</p>
                    </div>
                  ) : (
                    <div className="grid gap-4">
                      {blockedSlots.map((slot) => (
                        <div
                          key={slot.id}
                          className="bg-[#171717] border border-[#262626] rounded-sm p-4 flex items-center justify-between"
                        >
                          <div>
                            <p className="font-manrope text-white">
                              {format(new Date(slot.date), "d MMMM yyyy", { locale: tr })}
                            </p>
                            <p className="text-sm text-[#A3A3A3] mt-1">
                              {slot.is_full_day
                                ? "Tüm gün"
                                : `${slot.start_time} - ${slot.end_time}`}
                            </p>
                            {slot.reason && (
                              <p className="text-sm text-[#D97706] mt-1">{slot.reason}</p>
                            )}
                          </div>
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => deleteBlockedSlot(slot.id)}
                            className="text-[#A3A3A3] hover:text-red-400"
                          >
                            <Trash size={18} />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {activeTab === "general" && settings && (
                <div data-testid="general-tab">
                  <h1 className="font-oswald text-2xl sm:text-3xl uppercase tracking-tight text-white mb-6">
                    Genel Ayarlar
                  </h1>
                  <div className="bg-[#171717] border border-[#262626] rounded-sm p-6 max-w-xl space-y-4">
                    <div>
                      <label className="block text-sm text-[#A3A3A3] mb-2">İşletme Adı</label>
                      <Input
                        value={generalForm.shop_name}
                        onChange={(e) =>
                          setGeneralForm({ ...generalForm, shop_name: e.target.value })
                        }
                        className="bg-[#0A0A0A] border-[#262626]"
                        data-testid="general-shop-name-input"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-[#A3A3A3] mb-2">Telefon</label>
                      <Input
                        value={generalForm.phone}
                        onChange={(e) =>
                          setGeneralForm({ ...generalForm, phone: e.target.value })
                        }
                        placeholder="+90 5XX XXX XX XX"
                        className="bg-[#0A0A0A] border-[#262626]"
                        data-testid="general-phone-input"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-[#A3A3A3] mb-2">
                        WhatsApp Numarası
                      </label>
                      <Input
                        value={generalForm.whatsapp}
                        onChange={(e) =>
                          setGeneralForm({ ...generalForm, whatsapp: e.target.value })
                        }
                        placeholder="+905XXXXXXXXX (boşluksuz)"
                        className="bg-[#0A0A0A] border-[#262626]"
                        data-testid="general-whatsapp-input"
                      />
                      <p className="text-xs text-[#A3A3A3] mt-1">
                        WhatsApp linki için boşluksuz ve başında + ile girilmeli, örn. +905368109493
                      </p>
                    </div>
                    <div>
                      <label className="block text-sm text-[#A3A3A3] mb-2">Adres</label>
                      <Input
                        value={generalForm.address}
                        onChange={(e) =>
                          setGeneralForm({ ...generalForm, address: e.target.value })
                        }
                        className="bg-[#0A0A0A] border-[#262626]"
                        data-testid="general-address-input"
                      />
                    </div>
                    <Button
                      onClick={saveGeneralSettings}
                      className="bg-[#D97706] hover:bg-[#B45309] text-white"
                      data-testid="save-general-settings-btn"
                    >
                      Kaydet
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </main>

      {/* Service Modal */}
      <Dialog open={serviceModal.open} onOpenChange={(open) => setServiceModal({ open, service: null })}>
        <DialogContent className="bg-[#171717] border-[#262626] text-white">
          <DialogHeader>
            <DialogTitle className="font-oswald uppercase">
              {serviceModal.service ? "Hizmeti Düzenle" : "Yeni Hizmet"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="block text-sm text-[#A3A3A3] mb-2">Hizmet Adı</label>
              <Input
                value={serviceForm.name}
                onChange={(e) => setServiceForm({ ...serviceForm, name: e.target.value })}
                className="bg-[#0A0A0A] border-[#262626]"
                data-testid="service-name-input"
              />
            </div>
            <div>
              <label className="block text-sm text-[#A3A3A3] mb-2">Açıklama</label>
              <Input
                value={serviceForm.description}
                onChange={(e) => setServiceForm({ ...serviceForm, description: e.target.value })}
                className="bg-[#0A0A0A] border-[#262626]"
                data-testid="service-desc-input"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-[#A3A3A3] mb-2">Süre (dk)</label>
                <Input
                  type="number"
                  value={serviceForm.duration}
                  onChange={(e) => setServiceForm({ ...serviceForm, duration: parseInt(e.target.value) })}
                  className="bg-[#0A0A0A] border-[#262626]"
                  data-testid="service-duration-input"
                />
              </div>
              <div>
                <label className="block text-sm text-[#A3A3A3] mb-2">Fiyat (₺)</label>
                <Input
                  type="number"
                  value={serviceForm.price}
                  onChange={(e) => setServiceForm({ ...serviceForm, price: parseFloat(e.target.value) })}
                  className="bg-[#0A0A0A] border-[#262626]"
                  data-testid="service-price-input"
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="ghost"
              onClick={() => setServiceModal({ open: false, service: null })}
            >
              İptal
            </Button>
            <Button
              onClick={saveService}
              className="bg-[#D97706] hover:bg-[#B45309]"
              data-testid="save-service-btn"
            >
              Kaydet
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Block Modal */}
      <Dialog open={blockModal.open} onOpenChange={(open) => setBlockModal({ open })}>
        <DialogContent className="bg-[#171717] border-[#262626] text-white">
          <DialogHeader>
            <DialogTitle className="font-oswald uppercase">Blok Ekle</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex justify-center">
              <Calendar
                mode="single"
                selected={blockDate}
                onSelect={setBlockDate}
                locale={tr}
                className="bg-[#0A0A0A] border border-[#262626] rounded-sm"
              />
            </div>
            <div className="flex items-center gap-4">
              <Switch checked={blockFullDay} onCheckedChange={setBlockFullDay} />
              <span className="text-[#A3A3A3]">Tüm gün</span>
            </div>
            {!blockFullDay && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-[#A3A3A3] mb-2">Başlangıç</label>
                  <Input
                    type="time"
                    value={blockStartTime}
                    onChange={(e) => setBlockStartTime(e.target.value)}
                    className="bg-[#0A0A0A] border-[#262626]"
                  />
                </div>
                <div>
                  <label className="block text-sm text-[#A3A3A3] mb-2">Bitiş</label>
                  <Input
                    type="time"
                    value={blockEndTime}
                    onChange={(e) => setBlockEndTime(e.target.value)}
                    className="bg-[#0A0A0A] border-[#262626]"
                  />
                </div>
              </div>
            )}
            <div>
              <label className="block text-sm text-[#A3A3A3] mb-2">Sebep (opsiyonel)</label>
              <Input
                value={blockReason}
                onChange={(e) => setBlockReason(e.target.value)}
                placeholder="Örn: Tatil, özel etkinlik..."
                className="bg-[#0A0A0A] border-[#262626]"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setBlockModal({ open: false })}>
              İptal
            </Button>
            <Button
              onClick={saveBlockedSlot}
              className="bg-[#D97706] hover:bg-[#B45309]"
              data-testid="save-block-btn"
            >
              Kaydet
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Password Change Modal */}
      <Dialog
        open={passwordModal}
        onOpenChange={(open) => {
          setPasswordModal(open);
          if (!open) {
            setCurrentPassword("");
            setNewPassword("");
            setConfirmPassword("");
          }
        }}
      >
        <DialogContent className="bg-[#171717] border-[#262626] text-white">
          <DialogHeader>
            <DialogTitle className="font-oswald uppercase">Şifre Değiştir</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <label className="block text-sm text-[#A3A3A3] mb-2">Mevcut Şifre</label>
              <Input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="bg-[#0A0A0A] border-[#262626]"
                data-testid="current-password-input"
              />
            </div>
            <div>
              <label className="block text-sm text-[#A3A3A3] mb-2">Yeni Şifre</label>
              <Input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="En az 6 karakter"
                className="bg-[#0A0A0A] border-[#262626]"
                data-testid="new-password-input"
              />
            </div>
            <div>
              <label className="block text-sm text-[#A3A3A3] mb-2">Yeni Şifre (Tekrar)</label>
              <Input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="bg-[#0A0A0A] border-[#262626]"
                data-testid="confirm-password-input"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setPasswordModal(false)}>
              İptal
            </Button>
            <Button
              onClick={handleChangePassword}
              className="bg-[#D97706] hover:bg-[#B45309]"
              data-testid="save-password-btn"
            >
              Şifreyi Değiştir
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminPage;