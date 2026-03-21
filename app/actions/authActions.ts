"use server";

import { cookies } from "next/headers";

export async function loginWithSuperAdmin(email: string, password: string) {
  // ยิง Request ไปยัง API Service ตัวกลาง (Single Source of Truth)
  const API_URL = process.env.API_SERVICE_URL || "https://api-service-woad.vercel.app";
  
  try {
    const response = await fetch(`${API_URL}/api/auth/superadmin`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email, password }),
      // ใช้ cache: 'no-store' เนื่องจากเป็นการตรวจสอบ Auth เสมอกันห้ามจำ
      cache: "no-store",
    });

    const data = await response.json();

    if (data.success && data.role === "superadmin") {
      // ประทับตรา Secure Cookie รับรองว่าเป็น SuperAdmin แท้
      const cookieStore = await cookies();
      cookieStore.set("sf_superadmin_session", "true", {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        maxAge: 60 * 60 * 24 * 7, // 1 อาทิตย์
        path: "/",
      });
      return { success: true };
    }

    return { success: false, error: "Invalid credentials" };
  } catch (error) {
    console.error("SuperAdmin Auth Error:", error);
    return { success: false, error: "Service unavailable or connection failed" };
  }
}
