import { getUserTickets } from "@/actions/support";
import { redirectIfNotAuth } from "@/app/proxy/auth";
import { Plus, MessageSquare, Clock, HelpCircle, Mail, MessageCircle } from "lucide-react";
import Link from "next/link";

const statusConfig: Record<string, { label: string; color: string; bg: string }> = {
  open: { label: "เปิด", color: "#FFB74D", bg: "rgba(255,183,77,0.1)" },
  in_progress: { label: "กำลังดำเนินการ", color: "#4FC3F7", bg: "rgba(79,195,247,0.1)" },
  resolved: { label: "แก้ไขแล้ว", color: "#00E676", bg: "rgba(0,230,118,0.1)" },
  closed: { label: "ปิด", color: "#5A6A9A", bg: "rgba(107,107,123,0.1)" },
};

const faqItems = [
  "วิธีเพิ่มสินทรัพย์ในพอร์ต",
  "การคำนวณผลกำไร/ขาดทุน",
  "การตั้งค่าการแจ้งเตือนราคา",
  "วิธีสร้างวอตช์ลิสต์",
];

export default async function SupportPage() {
  await redirectIfNotAuth();
  const tickets = await getUserTickets();

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">ศูนย์ช่วยเหลือ</h1>
          <p className="text-sm text-[#A0A0B0] mt-0.5">ส่งคำขอความช่วยเหลือและติดตามสถานะ</p>
        </div>
        <Link href="/support/new">
          <button className="h-9 px-4 rounded-lg text-sm font-semibold bg-[#00D4FF] text-black hover:bg-[#00A8CC] shadow-[0_0_20px_rgba(0,212,255,0.3)] transition-all flex items-center gap-2">
            <Plus className="h-4 w-4" />
            สร้าง Ticket
          </button>
        </Link>
      </div>

      <div className="grid gap-5 lg:grid-cols-3">
        {/* Tickets */}
        <div className="lg:col-span-2 space-y-3">
          {tickets.length === 0 ? (
            <div className="rounded-xl border border-[#0F1F55] bg-gradient-to-b from-[#071442] to-[#040E35] p-16 text-center">
              <div className="h-16 w-16 rounded-2xl bg-[#0A1845] flex items-center justify-center mx-auto mb-4">
                <MessageSquare className="h-8 w-8 text-[#5A6A9A]" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">ยังไม่มี Ticket</h3>
              <p className="text-sm text-[#A0A0B0] mb-6">สร้าง Ticket เพื่อขอความช่วยเหลือจากทีมงาน</p>
              <Link href="/support/new">
                <button className="h-10 px-6 rounded-lg text-sm font-semibold bg-[#00D4FF] text-black hover:bg-[#00A8CC] shadow-[0_0_20px_rgba(0,212,255,0.3)] transition-all inline-flex items-center gap-2">
                  <Plus className="h-4 w-4" />
                  สร้าง Ticket แรก
                </button>
              </Link>
            </div>
          ) : (
            tickets.map((ticket) => {
              const status = statusConfig[ticket.status ?? "open"] || statusConfig.closed;
              return (
                <div key={ticket.id} className="rounded-xl border border-[#0F1F55] bg-gradient-to-b from-[#071442] to-[#040E35] p-5 transition-all hover:border-[#162660]">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-[#5A6A9A]">#{ticket.ticket_number}</span>
                      <span className="text-xs font-semibold px-2.5 py-1 rounded-full" style={{ color: status.color, background: status.bg }}>
                        {status.label}
                      </span>
                    </div>
                  </div>
                  <h3 className="text-sm font-semibold text-white mb-1.5">{ticket.subject}</h3>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-xs text-[#5A6A9A]">
                      <Clock className="h-3.5 w-3.5" />
                      {ticket.created_at ? new Date(ticket.created_at).toLocaleDateString("th-TH") : "-"}
                      {ticket.replies?.length > 0 && (
                        <span className="ml-3 text-[#00D4FF]">{ticket.replies.length} การตอบกลับ</span>
                      )}
                    </div>
                    <Link href={`/support/${ticket.id}`}>
                      <button className="h-8 px-3 rounded-lg text-xs font-medium border border-[#162660] text-white hover:bg-[#0A1845] transition-colors">
                        ดูรายละเอียด
                      </button>
                    </Link>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* FAQ */}
          <div className="rounded-xl border border-[#0F1F55] bg-gradient-to-b from-[#071442] to-[#040E35] p-5">
            <div className="flex items-center gap-2 mb-4">
              <HelpCircle className="h-4 w-4 text-[#00D4FF]" />
              <h3 className="text-sm font-semibold text-white">คำถามที่พบบ่อย</h3>
            </div>
            <div className="space-y-2">
              {faqItems.map((q) => (
                <button key={q} className="w-full text-left text-xs text-[#A0A0B0] hover:text-[#00D4FF] py-1.5 transition-colors">
                  {q}
                </button>
              ))}
            </div>
          </div>

          {/* Contact */}
          <div className="rounded-xl border border-[#0F1F55] bg-gradient-to-b from-[#071442] to-[#040E35] p-5">
            <h3 className="text-sm font-semibold text-white mb-4">ติดต่อเรา</h3>
            <div className="space-y-3">
              <div className="flex items-center gap-2.5 text-xs text-[#A0A0B0]">
                <Mail className="h-3.5 w-3.5 text-[#00D4FF] shrink-0" />
                k.net.game01@gmail.com
              </div>
              <div className="flex items-center gap-2.5 text-xs text-[#A0A0B0]">
                <MessageCircle className="h-3.5 w-3.5 text-[#00D4FF] shrink-0" />
                Line: @teu8808s
              </div>
              <div className="text-xs text-[#5A6A9A] mt-2">จันทร์-ศุกร์ 9:00-18:00</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
