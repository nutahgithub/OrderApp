import { useCallback, useEffect, useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../../features/auth/AuthContext";
import { apiClient } from "../../lib/api/client";
import type { Order } from "../../lib/api/types";
import { useI18n } from "../../lib/i18n/I18nContext";
import { MessageKey } from "../../lib/i18n/messages";
import { createRealtimeSocket, RealtimeEvent } from "../../lib/realtime/socket";
import { Button } from "../ui/Button";
import { LanguageSwitcher } from "../ui/LanguageSwitcher";

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
  { labelKey: MessageKey.NavDashboard, to: "/admin/dashboard" },
  { labelKey: MessageKey.NavBranches, to: "/admin/branches" },
  { labelKey: MessageKey.NavTables, to: "/admin/tables" },
  { labelKey: MessageKey.NavMenus, to: "/admin/menus" },
  { labelKey: MessageKey.NavOrders, to: "/admin/orders" },
  { labelKey: MessageKey.NavPayments, to: "/admin/payments" }
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
          const response = await apiClient.listBranches(token);

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
    <div className="admin-shell">
      <aside className="admin-sidebar">
        <div>
          <div className="brand">Smart Restaurant OS</div>
          {admin ? (
            <div className="admin-profile">
              <strong>{admin.name}</strong>
              <span>{admin.tenant.name}</span>
            </div>
          ) : null}
        </div>
        <nav className="admin-nav" aria-label="Admin navigation">
          {navItems.map((item) => (
            <NavLink key={item.to} to={item.to}>
              {t(item.labelKey)}
            </NavLink>
          ))}
        </nav>
        <LanguageSwitcher />
        {!soundReady ? (
          <Button type="button" className="button--ghost" onClick={handleEnableSound}>
            {t(MessageKey.NotificationsEnableSound)}
          </Button>
        ) : null}
        <Button type="button" className="button--secondary" onClick={handleLogout}>
          {t(MessageKey.AuthLogout)}
        </Button>
      </aside>
      <main className="admin-main">
        <Outlet />
      </main>
      {toasts.length > 0 ? (
        <div className="toast-stack" aria-live="polite" aria-atomic="false">
          {toasts.map((toast) => (
            <div className="toast toast--order" key={toast.id}>
              <strong>{toast.title}</strong>
              <span>{toast.description}</span>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
};
