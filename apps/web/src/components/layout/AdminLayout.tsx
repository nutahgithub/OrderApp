import { useCallback, useEffect, useState } from "react";
import { BellRing, Building2, Gauge, LogOut, MenuSquare, ShoppingBag, Store, Table2, Volume2 } from "lucide-react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../../features/auth/AuthContext";
import { branchesApi } from "../../features/branches/api";
import type { Order } from "../../lib/api/types";
import { useI18n } from "../../lib/i18n/I18nContext";
import { MessageKey } from "../../lib/i18n/messages";
import { createRealtimeSocket, RealtimeEvent } from "../../lib/realtime/socket";
import { cn } from "../../lib/utils/cn";
import { Button } from "../ui/Button";
import { LanguageSwitcher } from "../ui/LanguageSwitcher";
import { ThemeSwitcher } from "../ui/ThemeSwitcher";

type ToastMessage = {
  id: string;
  title: string;
  description: string;
};

type AudioWindow = Window & {
  webkitAudioContext?: typeof AudioContext;
};

let notificationAudioContext: AudioContext | null = null;

const navItems = [
  { icon: Gauge, labelKey: MessageKey.NavDashboard, to: "/admin/dashboard" },
  { icon: Building2, labelKey: MessageKey.NavBranches, to: "/admin/branches" },
  { icon: Table2, labelKey: MessageKey.NavTables, to: "/admin/tables" },
  { icon: MenuSquare, labelKey: MessageKey.NavMenus, to: "/admin/menus" },
  { icon: Table2, labelKey: MessageKey.NavTableSales, to: "/admin/table-sales" },
  { icon: ShoppingBag, labelKey: MessageKey.NavOrders, to: "/admin/orders" }
];

const formatCurrency = (price: string): string => {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 2
  }).format(Number(price));
};

const getNotificationAudioContext = (): AudioContext | null => {
  const AudioContextConstructor = window.AudioContext || (window as AudioWindow).webkitAudioContext;

  if (!AudioContextConstructor) {
    return null;
  }

  if (!notificationAudioContext || notificationAudioContext.state === "closed") {
    notificationAudioContext = new AudioContextConstructor();
  }

  return notificationAudioContext;
};

const unlockNotificationAudio = async (): Promise<boolean> => {
  const audioContext = getNotificationAudioContext();

  if (!audioContext) {
    return false;
  }

  if (audioContext.state === "suspended") {
    await audioContext.resume();
  }

  return audioContext.state === "running";
};

const playOrderNotificationSound = async (): Promise<void> => {
  const audioContext = getNotificationAudioContext();

  if (!audioContext) {
    return;
  }

  if (audioContext.state === "suspended") {
    await audioContext.resume();
  }

  if (audioContext.state !== "running") {
    return;
  }

  const masterGain = audioContext.createGain();
  const now = audioContext.currentTime + 0.02;
  const notes = [
    { frequency: 659.25, start: 0, duration: 0.16 },
    { frequency: 880, start: 0.12, duration: 0.18 },
    { frequency: 1318.51, start: 0.28, duration: 0.22 }
  ];

  masterGain.gain.setValueAtTime(0.001, now);
  masterGain.gain.exponentialRampToValueAtTime(0.22, now + 0.03);
  masterGain.gain.exponentialRampToValueAtTime(0.001, now + 0.72);
  masterGain.connect(audioContext.destination);

  notes.forEach((note) => {
    const oscillator = audioContext.createOscillator();
    const shimmer = audioContext.createOscillator();
    const noteGain = audioContext.createGain();
    const startAt = now + note.start;
    const stopAt = startAt + note.duration;

    oscillator.type = "triangle";
    shimmer.type = "sine";
    oscillator.frequency.setValueAtTime(note.frequency, startAt);
    shimmer.frequency.setValueAtTime(note.frequency * 2, startAt);
    noteGain.gain.setValueAtTime(0.001, startAt);
    noteGain.gain.exponentialRampToValueAtTime(0.55, startAt + 0.025);
    noteGain.gain.exponentialRampToValueAtTime(0.001, stopAt);
    oscillator.connect(noteGain);
    shimmer.connect(noteGain);
    noteGain.connect(masterGain);
    oscillator.start(startAt);
    shimmer.start(startAt);
    oscillator.stop(stopAt + 0.02);
    shimmer.stop(stopAt + 0.02);
  });
};

export const AdminLayout = () => {
  const { admin, logout, token } = useAuth();
  const { t } = useI18n();
  const navigate = useNavigate();
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [soundReady, setSoundReady] = useState(false);

  const pushToast = useCallback((toast: Omit<ToastMessage, "id">) => {
    const id = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
    setToasts((currentToasts) => [...currentToasts, { ...toast, id }].slice(-4));

    window.setTimeout(() => {
      setToasts((currentToasts) => currentToasts.filter((currentToast) => currentToast.id !== id));
    }, 6000);
  }, []);

  const notifyNewOrder = useCallback(
    (order: Order) => {
      pushToast({
        title: t(MessageKey.OrdersNewToastTitle),
        description: t(MessageKey.OrdersNewToastDescription, {
          tableName: order.tableName,
          amount: formatCurrency(order.total)
        })
      });

      try {
        void playOrderNotificationSound();
      } catch {
        // Browsers may block audio before the first user interaction.
      }
    },
    [pushToast, t]
  );

  useEffect(() => {
    if (!token) {
      return;
    }

    const socket = createRealtimeSocket(token);
    let isActive = true;

    socket.on("connect", () => {
      void (async () => {
        try {
          const response = await branchesApi.list(token);

          if (!isActive) {
            return;
          }

          response.branches.forEach((branch) => {
            socket.emit(RealtimeEvent.AdminJoinBranch, { branchId: branch.id });
          });
        } catch {
          socket.disconnect();
        }
      })();
    });

    socket.on(RealtimeEvent.OrderCreated, (payload) => {
      notifyNewOrder(payload.order);
    });

    socket.connect();

    return () => {
      isActive = false;
      socket.disconnect();
    };
  }, [notifyNewOrder, token]);

  useEffect(() => {
    const handleFirstInteraction = () => {
      void unlockNotificationAudio().then(setSoundReady).catch(() => setSoundReady(false));
    };

    window.addEventListener("pointerdown", handleFirstInteraction, { once: true });
    window.addEventListener("keydown", handleFirstInteraction, { once: true });

    return () => {
      window.removeEventListener("pointerdown", handleFirstInteraction);
      window.removeEventListener("keydown", handleFirstInteraction);
    };
  }, []);

  const handleEnableSound = () => {
    void unlockNotificationAudio()
      .then((isReady) => {
        setSoundReady(isReady);

        if (isReady) {
          void playOrderNotificationSound();
        }
      })
      .catch(() => setSoundReady(false));
  };

  const handleLogout = () => {
    logout();
    navigate("/admin/login", { replace: true });
  };

  return (
    <div className="grid min-h-screen grid-cols-[264px_minmax(0,1fr)] max-[780px]:grid-cols-1">
      <aside className="flex flex-col gap-5 bg-[hsl(var(--sidebar))] p-5 text-[hsl(var(--sidebar-foreground))] max-[780px]:sticky max-[780px]:top-0 max-[780px]:z-10 max-[780px]:gap-3 max-[780px]:p-3">
        <div className="rounded-md border border-[hsl(var(--sidebar-foreground)/0.12)] bg-[hsl(var(--sidebar-foreground)/0.06)] p-3">
          <div className="flex items-center gap-2.5 text-base font-extrabold">
            <span className="grid h-9 w-9 place-items-center rounded-md bg-[hsl(var(--sidebar-foreground)/0.14)] text-sm">OS</span>
            <span className="min-w-0 break-words">Smart Restaurant OS</span>
          </div>
          {admin ? (
            <div className="mt-3 grid gap-1 border-t border-[hsl(var(--sidebar-foreground)/0.12)] pt-3 text-[13px] text-[hsl(var(--sidebar-foreground)/0.86)]">
              <strong className="break-words">{admin.name}</strong>
              <span className="inline-flex min-w-0 items-center gap-1.5 text-[hsl(var(--sidebar-foreground)/0.68)]">
                <Store className="h-3.5 w-3.5 flex-none" aria-hidden="true" />
                <span className="break-words">{admin.tenant.name}</span>
              </span>
            </div>
          ) : null}
        </div>
        <nav className="grid gap-1.5 max-[780px]:flex max-[780px]:overflow-x-auto max-[780px]:pb-1" aria-label="Admin navigation">
          {navItems.map((item) => {
            const Icon = item.icon;

            return (
            <NavLink
              className={({ isActive }) =>
                cn(
                  "inline-flex min-h-11 items-center gap-2.5 rounded-md px-3 py-2.5 text-[hsl(var(--sidebar-foreground)/0.82)] no-underline transition hover:bg-[hsl(var(--sidebar-foreground)/0.12)] hover:text-white max-[780px]:min-w-max max-[780px]:justify-center",
                  isActive && "bg-[hsl(var(--sidebar-foreground)/0.16)] text-white shadow-sm"
                )
              }
              key={item.to}
              to={item.to}
            >
              <Icon className="h-4 w-4 flex-none" aria-hidden="true" />
              {t(item.labelKey)}
            </NavLink>
            );
          })}
        </nav>
        <div className="grid gap-3 rounded-md border border-[hsl(var(--sidebar-foreground)/0.12)] bg-[hsl(var(--sidebar-foreground)/0.06)] p-3 max-[780px]:grid-cols-2">
          <LanguageSwitcher />
          <ThemeSwitcher />
        </div>
        {!soundReady ? (
          <Button type="button" className="mt-0 bg-[hsl(var(--sidebar-foreground)/0.12)] text-[hsl(var(--sidebar-foreground))] hover:bg-[hsl(var(--sidebar-foreground)/0.2)]" onClick={handleEnableSound}>
            <Volume2 className="h-4 w-4" aria-hidden="true" />
            {t(MessageKey.NotificationsEnableSound)}
          </Button>
        ) : null}
        <Button type="button" className="mt-auto bg-[hsl(var(--sidebar-foreground)/0.12)] text-[hsl(var(--sidebar-foreground))] hover:bg-[hsl(var(--sidebar-foreground)/0.2)]" onClick={handleLogout}>
          <LogOut className="h-4 w-4" aria-hidden="true" />
          {t(MessageKey.AuthLogout)}
        </Button>
      </aside>
      <main className="min-w-0 bg-background p-7 max-[780px]:p-[18px]">
        <div className="mx-auto w-full max-w-[1760px]">
          <Outlet />
        </div>
      </main>
      {toasts.length > 0 ? (
        <div
          className="fixed bottom-5 right-5 z-30 grid w-[min(420px,calc(100vw-40px))] gap-3 max-[780px]:bottom-3.5 max-[780px]:right-3.5 max-[780px]:w-[calc(100vw-28px)]"
          aria-live="polite"
          aria-atomic="false"
        >
          {toasts.map((toast) => (
            <div
              className="relative grid grid-cols-[auto_minmax(0,1fr)] gap-3 overflow-hidden rounded-md border border-success/60 bg-card py-4 pl-4 pr-4 text-primary shadow-floating before:absolute before:inset-y-0 before:left-0 before:w-1 before:bg-success before:content-['']"
              key={toast.id}
            >
              <BellRing className="mt-0.5 h-5 w-5" aria-hidden="true" />
              <span className="grid min-w-0 gap-1">
                <strong className="break-words">{toast.title}</strong>
                <span className="break-words text-sm leading-normal text-foreground">{toast.description}</span>
              </span>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
};
