/**
 * Helper สำหรับจัดการเวลาในรูปแบบ ICT (UTC+7) ประเทศไทย
 */

/**
 * ดึงเวลาปัจจุบันในรูปแบบ Date object ที่ปรับเป็นเวลาไทยแล้ว
 * เหมาะสำหรับใช้บันทึกลงฐานข้อมูลเพื่อให้ timestamp ตรงกับเวลาไทย
 */
export function getThaiTime(): Date {
  // สร้าง Date object จากเวลา UTC ปัจจุบัน และบวกไป 7 ชั่วโมง
  return new Date(Date.now() + 7 * 60 * 60 * 1000);
}

/**
 * แปลง Date object ใดๆ ให้เป็น String วันที่แบบไทย (YYYY-MM-DD)
 */
export function formatThaiDate(date: Date): string {
  const thaiDate = new Date(date.getTime() + (date.getTimezoneOffset() === 0 ? 7 * 60 * 60 * 1000 : 0));
  return thaiDate.toISOString().slice(0, 10);
}

/**
 * จัดรูปแบบเวลาสำหรับแสดงผล (เช่น 24 เม.ย. 2026 20:30:00)
 */
export function formatThaiDateTimeFull(date: Date): string {
  return date.toLocaleString('th-TH', {
    timeZone: 'Asia/Bangkok',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}
