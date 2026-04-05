"use client";

import { useState, useEffect, useMemo } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  PieChart, Pie, Cell, Tooltip as RechartsTooltip, ResponsiveContainer
} from "recharts";
import {
  BarChart3, Coins, Activity, Plus, Layers, X
} from "lucide-react";
import Navbar from "../../components/Navbar";

// UI Components
import { GlassCard } from "./ui/GlassCard";
import { NeonButton } from "./ui/NeonButton";

// Feature Components
import { PortfolioCard } from "./PortfolioCard";
import { AssetRow } from "./AssetRow";

// Modals
import { AssetModal } from "./modals/AssetModal";
import { PortfolioModal } from "./modals/PortfolioModal";
import { PortfolioEditModal } from "./modals/PortfolioEditModal";
import { PortfolioConfirmationModal } from "./modals/PortfolioConfirmationModal";

// Views
import { AssetDetailView } from "./views/AssetDetailView";

// Lib & Hooks
import {
  MarketData, Portfolio, PortfolioItem, DailySnapshot, Transaction,
  EXCHANGES_MAPPED, NEON_COLORS, getPriceKey
} from "../lib/constants";
import {
  getTransactions, getDailySnapshots, saveTransaction
} from "../../actions/transactionActions";
import { fetchPortfolios, deletePortfolioFromDB, savePortfolioToDB } from "../../actions/portfolioActions";
