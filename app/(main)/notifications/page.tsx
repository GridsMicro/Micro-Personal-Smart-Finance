import { getNotifications, getUnreadCount } from "@/actions/notifications";
import { redirectIfNotAuth } from "@/app/proxy/auth";
import { Bell, Check, Trash2, TrendingUp, AlertCircle, Info } from "lucide-react";

const typeConfig: Record<string, { icon: React.ElementType; color: string; bg: string }> = {
  price_alert: { icon: TrendingUp, color: "#00D4FF", bg: "rgba(0,212,255,0.1)" },
  system: { icon: Info, color: "#4FC3F7", bg: "rgba(79,195,247,0.1)" },
  warning: { icon: AlertCircle, color: "#FFB74D", bg: "rgba(255,183,77,0.1)" },
  default: { icon: Bell, color: "#A0A0B0", bg: "rgba(160,160,176,0.1)" },
};

export default async function NotificationsPage() {
  await redirectIfNotAuth();
  const notifications = await getNotifications();
  const unreadCount = await getUnreadCount();

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">การแจ้งเตือน</h1>
          <p className="text-sm text-[#A0A0B0] mt-0.5">
            {unreadCount > 0 ? `${unreadCount} รายการที่ยังไม่ได้อ่าน` : "ไม่มีการแจ้งเตือนใหม่"}
          </p>
        </div>
        {unreadCount > 0 && (
          <form action="/actions/notifications" method="POST">
            <input type="hidden" name="action" value="markAllAsRead" />
            <button
              type="submit"
              className="h-9 px-4 rounded-lg text-sm font-medium border border-[#162660] text-white hover:bg-[#0A1845] transition-colors flex items-center gap-2"
            >
              <Check className="h-4 w-4" />
              อ่านทั้งหมด
            </button>
          </form>
        )}
      </div>

      {/* Notifications */}
      {notifications.length === 0 ? (
        <div className="rounded-xl border border-[#0F1F55] bg-gradient-to-b from-[#071442] to-[#040E35] p-16 text-center">
          <div className="h-16 w-16 rounded-2xl bg-[#0A1845] flex items-center justify-center mx-auto mb-4">
            <Bell className="h-8 w-8 text-[#5A6A9A]" />
          </div>
          <h3 className="text-lg font-semibold text-white mb-2">ไม่มีการแจ้งเตือน</h3>
          <p className="text-sm text-[#A0A0B0]">การแจ้งเตือนราคาและข่าวสารจะแสดงที่นี่</p>
        </div>
      ) : (
        <div className="space-y-2">
          {notifications.map((n) => {
            const cfg = typeConfig[n.type] || typeConfig.default;
            const Icon = cfg.icon;
            return (
              <div
                key={n.id}
                className={`rounded-xl border bg-gradient-to-b from-[#071442] to-[#040E35] p-4 transition-all hover:border-[#162660] ${!n.is_read ? "border-l-2 border-l-[#00D4FF] border-[#0F1F55]" : "border-[#0F1F55]"}`}
              >
                <div className="flex items-start gap-4">
                  <div className="h-9 w-9 rounded-xl flex items-center justify-center shrink-0" style={{ background: cfg.bg }}>
                    <Icon className="h-4.5 w-4.5" style={{ color: cfg.color }} size={18} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: cfg.color }}>
                        {n.type}
                      </span>
                      {!n.is_read && (
                        <span className="h-1.5 w-1.5 rounded-full bg-[#00D4FF]" />
                      )}
                    </div>
                    <p className="text-sm font-semibold text-white">{n.title}</p>
                    <p className="text-sm text-[#A0A0B0] mt-0.5">{n.message}</p>
                    <p className="text-xs text-[#5A6A9A] mt-1.5">
                      {n.created_at ? new Date(n.created_at).toLocaleDateString("th-TH", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }) : "-"}
                    </p>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    {!n.is_read && (
                      <form action="/actions/notifications" method="POST">
                        <input type="hidden" name="action" value="markAsRead" />
                        <input type="hidden" name="id" value={n.id} />
                        <button type="submit" className="h-8 w-8 rounded-lg flex items-center justify-center text-[#5A6A9A] hover:text-[#00D4FF] hover:bg-[#00D4FF]/10 transition-all">
                          <Check className="h-4 w-4" />
                        </button>
                      </form>
                    )}
                    <form action="/actions/notifications" method="POST">
                      <input type="hidden" name="action" value="delete" />
                      <input type="hidden" name="id" value={n.id} />
                      <button type="submit" className="h-8 w-8 rounded-lg flex items-center justify-center text-[#5A6A9A] hover:text-[#FF5252] hover:bg-[#FF5252]/10 transition-all">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </form>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
