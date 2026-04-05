"use client";

/**
 * Profile Page - User profile with statistics
 * 
 * Features:
 * - Display user information
 * - Show portfolio and transaction statistics
 * - Cyberpunk glass morphism theme
 */

import { useState, useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { 
  User, Mail, Shield, Wallet, Activity, TrendingUp, 
  ArrowLeft, Loader2, Coins, Camera, Pencil, Check, X
} from "lucide-react";
import Navbar from "../components/Navbar";

// ============ TYPES ============
interface UserProfile {
  id: string;
  name: string | null;
  email: string | null;
  emailVerified: Date | null;
  image: string | null;
  role: string | null;
}

interface UserStats {
  transactions: {
    total: number;
    deposits: number;
    withdrawals: number;
  };
  portfolios: number;
  latestSnapshot: {
    totalValue: string;
    date: string;
    holdingsJson: Record<string, number>;
  } | null;
}

interface ProfileData {
  user: UserProfile;
  stats: UserStats;
}

// ============ COMPONENT ============
export default function ProfilePage() {
  const { status, update } = useSession();
  const router = useRouter();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState("");
  const [editImage, setEditImage] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Redirect if not authenticated
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  // Fetch profile data
  useEffect(() => {
    if (status !== "authenticated") return;

    async function fetchProfile() {
      try {
        const res = await fetch("/api/profile");
        if (!res.ok) throw new Error("Failed to fetch profile");
        const data = await res.json();
        setProfile(data);
        setEditName(data.user.name || "");
        setEditImage(data.user.image);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error");
      } finally {
        setLoading(false);
      }
    }

    fetchProfile();
  }, [status]);

  // Handle image upload
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      alert("Image must be less than 2MB");
      return;
    }

    // Convert to base64
    const reader = new FileReader();
    reader.onloadend = () => {
      setEditImage(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  // Save profile changes
  const handleSave = async () => {
    if (!profile) return;
    
    setSaving(true);
    try {
      const res = await fetch("/api/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: editName,
          image: editImage,
        }),
      });

      if (!res.ok) throw new Error("Failed to update profile");

      const updated = await res.json();
      setProfile({ ...profile, user: updated });
      setIsEditing(false);
      
      // Update session
      await update({ name: editName, image: editImage });
      
      console.log("[Profile] Updated successfully");
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  // Cancel edit
  const handleCancel = () => {
    if (!profile) return;
    setEditName(profile.user.name || "");
    setEditImage(profile.user.image);
    setIsEditing(false);
  };

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0a0a0a] via-[#1a1a2e] to-[#16213e] flex items-center justify-center">
        <Loader2 className="w-12 h-12 animate-spin text-cyan-400" />
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0a0a0a] via-[#1a1a2e] to-[#16213e]">
        <Navbar />
        <div className="pt-20 px-4">
          <div className="max-w-4xl mx-auto">
            <div className="text-red-400 text-center p-8 rounded-2xl bg-red-500/10 border border-red-500/20">
              Error: {error || "Failed to load profile"}
            </div>
          </div>
        </div>
      </div>
    );
  }

  const { user, stats } = profile;

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a0a0a] via-[#1a1a2e] to-[#16213e]">
      <Navbar />
      
      <div className="pt-20 px-4 pb-12">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Back Button */}
          <button
            onClick={() => router.push("/dashboard")}
            className="flex items-center gap-2 text-cyan-400 hover:text-cyan-300 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Back to Dashboard</span>
          </button>

          {/* Profile Header */}
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-cyan-500/20 via-purple-500/20 to-pink-500/20 p-8 border border-white/10 backdrop-blur-xl">
            <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/10 via-transparent to-purple-500/10" />
            
            <div className="relative flex items-center gap-6">
              {/* Avatar with Edit Overlay */}
              <div className="relative group">
                <div className="w-24 h-24 rounded-full bg-gradient-to-br from-cyan-400 to-purple-500 flex items-center justify-center text-3xl font-bold text-white shadow-lg shadow-cyan-500/30 overflow-hidden">
                  {(isEditing ? editImage : user.image) ? (
                    <img 
                      src={isEditing ? editImage || undefined : user.image || undefined} 
                      alt={user.name || "User"} 
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span>{(isEditing ? editName : user.name)?.charAt(0).toUpperCase() || "U"}</span>
                  )}
                </div>
                
                {/* Edit Button Overlay */}
                {isEditing && (
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                  >
                    <Camera className="w-8 h-8 text-white" />
                  </button>
                )}
                
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="hidden"
                />
              </div>
              
              {/* User Info */}
              <div className="flex-1">
                {isEditing ? (
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="text-3xl font-bold bg-white/10 border border-white/20 rounded-lg px-3 py-1 text-white w-full max-w-xs focus:outline-none focus:border-cyan-400"
                    placeholder="Your name"
                  />
                ) : (
                  <h1 className="text-3xl font-bold text-white mb-1">
                    {user.name || "Anonymous User"}
                  </h1>
                )}
                <div className="flex items-center gap-2 text-cyan-400">
                  <Mail className="w-4 h-4" />
                  <span>{user.email}</span>
                </div>
                <div className="mt-2 inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-sm text-white/80">
                  <Shield className="w-4 h-4 text-green-400" />
                  <span className="capitalize">{user.role || "USER"}</span>
                </div>
              </div>

              {/* Edit/Save Buttons */}
              <div className="flex gap-2">
                {isEditing ? (
                  <>
                    <button
                      onClick={handleSave}
                      disabled={saving}
                      className="flex items-center gap-2 px-4 py-2 bg-green-500/20 border border-green-500/30 text-green-400 rounded-xl hover:bg-green-500 hover:text-white transition-all disabled:opacity-50"
                    >
                      {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                      {saving ? "Saving..." : "Save"}
                    </button>
                    <button
                      onClick={handleCancel}
                      disabled={saving}
                      className="flex items-center gap-2 px-4 py-2 bg-red-500/20 border border-red-500/30 text-red-400 rounded-xl hover:bg-red-500 hover:text-white transition-all disabled:opacity-50"
                    >
                      <X className="w-4 h-4" />
                      Cancel
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => setIsEditing(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-cyan-500/20 border border-cyan-500/30 text-cyan-400 rounded-xl hover:bg-cyan-500 hover:text-white transition-all"
                  >
                    <Pencil className="w-4 h-4" />
                    Edit
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Statistics Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Portfolios */}
            <div className="rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-cyan-500/20 flex items-center justify-center">
                  <Wallet className="w-5 h-5 text-cyan-400" />
                </div>
                <h3 className="text-lg font-semibold text-white">Portfolios</h3>
              </div>
              <div className="text-3xl font-bold text-white mb-1">
                {stats.portfolios}
              </div>
              <p className="text-sm text-white/60">Active portfolios</p>
            </div>

            {/* Transactions */}
            <div className="rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-purple-500/20 flex items-center justify-center">
                  <Activity className="w-5 h-5 text-purple-400" />
                </div>
                <h3 className="text-lg font-semibold text-white">Transactions</h3>
              </div>
              <div className="text-3xl font-bold text-white mb-1">
                {stats.transactions.total}
              </div>
              <div className="flex gap-4 text-sm">
                <span className="text-green-400">+{stats.transactions.deposits}</span>
                <span className="text-red-400">-{stats.transactions.withdrawals}</span>
              </div>
            </div>

            {/* Total Value */}
            <div className="rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-pink-500/20 flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-pink-400" />
                </div>
                <h3 className="text-lg font-semibold text-white">Total Value</h3>
              </div>
              <div className="text-3xl font-bold text-white mb-1">
                {stats.latestSnapshot 
                  ? `฿${parseFloat(stats.latestSnapshot.totalValue).toLocaleString()}`
                  : "N/A"
                }
              </div>
              <p className="text-sm text-white/60">
                {stats.latestSnapshot 
                  ? `Last updated: ${new Date(stats.latestSnapshot.date).toLocaleDateString()}`
                  : "No data available"
                }
              </p>
            </div>
          </div>

          {/* Holdings Breakdown */}
          {stats.latestSnapshot && stats.latestSnapshot.holdingsJson && (
            <div className="rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-green-500/20 flex items-center justify-center">
                  <Coins className="w-5 h-5 text-green-400" />
                </div>
                <h3 className="text-lg font-semibold text-white">Current Holdings</h3>
              </div>
              
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {Object.entries(stats.latestSnapshot.holdingsJson)
                  .filter(([, amount]) => amount > 0)
                  .map(([asset, amount]) => (
                    <div 
                      key={asset}
                      className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/5"
                    >
                      <span className="font-medium text-white">{asset}</span>
                      <span className="text-cyan-400">{amount.toLocaleString()}</span>
                    </div>
                  ))}
              </div>
            </div>
          )}

          {/* Account Details */}
          <div className="rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center">
                <User className="w-5 h-5 text-blue-400" />
              </div>
              <h3 className="text-lg font-semibold text-white">Account Details</h3>
            </div>
            
            <div className="space-y-4">
              <div className="flex justify-between py-3 border-b border-white/10">
                <span className="text-white/60">User ID</span>
                <span className="text-white font-mono text-sm">{user.id}</span>
              </div>
              <div className="flex justify-between py-3 border-b border-white/10">
                <span className="text-white/60">Email</span>
                <span className="text-white">{user.email}</span>
              </div>
              <div className="flex justify-between py-3 border-b border-white/10">
                <span className="text-white/60">Role</span>
                <span className="text-white capitalize">{user.role || "USER"}</span>
              </div>
              <div className="flex justify-between py-3">
                <span className="text-white/60">Email Verified</span>
                <span className={user.emailVerified ? "text-green-400" : "text-yellow-400"}>
                  {user.emailVerified ? "Yes" : "Pending"}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
