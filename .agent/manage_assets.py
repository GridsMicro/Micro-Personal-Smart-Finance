#!/usr/bin/env python3
"""
manage_assets.py — เพิ่ม/ปิด/เปิดเหรียญใน Market Page

Usage:
  python manage_assets.py list                          # ดูเหรียญทั้งหมด
  python manage_assets.py add <SYMBOL> <coingecko_id>  # เพิ่มเหรียญใหม่
  python manage_assets.py on  <SYMBOL>                 # เปิดเหรียญ (is_active=true)
  python manage_assets.py off <SYMBOL>                 # ปิดเหรียญ (is_active=false)
  python manage_assets.py tv  <SYMBOL> <TV_SYMBOL>     # ตั้ง TradingView symbol

ตัวอย่าง:
  python manage_assets.py add LINK chainlink
  python manage_assets.py on  LINK
  python manage_assets.py off MOODENG
  python manage_assets.py tv  LINK BITKUB:LINKTHB
"""

import os, sys, re, json
from pathlib import Path
from dotenv import load_dotenv

# โหลด .env.local จาก root project
ROOT = Path(__file__).parent.parent
load_dotenv(ROOT / ".env.local")

import psycopg

DB_URL = os.environ.get("DATABASE_URL")
if not DB_URL:
    print("❌ ไม่พบ DATABASE_URL ใน .env.local")
    sys.exit(1)

# path ไฟล์ market-client.tsx
MARKET_CLIENT = ROOT / "app" / "p" / "market" / "market-client.tsx"

# ── Default TradingView symbols (Bitkub THB ก่อน, fallback Binance USDT) ──
DEFAULT_TV: dict[str, str] = {
    "BTC":     "BITKUB:BTCTHB",
    "ETH":     "BITKUB:ETHTHB",
    "TRX":     "BITKUB:TRXTHB",
    "DOGE":    "BITKUB:DOGETHB",
    "SOL":     "BITKUB:SOLTHB",
    "ADA":     "BITKUB:ADATHB",
    "XRP":     "BITKUB:XRPTHB",
    "AVAX":    "BITKUB:AVAXTHB",
    "DOT":     "BITKUB:DOTTHB",
    "MATIC":   "BITKUB:MATICTHB",
    "LTC":     "BITKUB:LTCTHB",
    "NEAR":    "BITKUB:NEARTHB",
    "BNB":     "BINANCE:BNBUSDT",
    "USDT":    "BINANCE:USDTUSDC",
    "USDC":    "BINANCE:USDCUSDT",
    "LINK":    "BITKUB:LINKTHB",
    "UNI":     "BITKUB:UNITHB",
    "ATOM":    "BITKUB:ATOMTHB",
    "FTM":     "BITKUB:FTMTHB",
    "SAND":    "BITKUB:SANDTHB",
    "MANA":    "BITKUB:MANATHB",
    "OP":      "BITKUB:OPTHB",
    "ARB":     "BINANCE:ARBUSDT",
    "SUI":     "BINANCE:SUIUSDT",
    "SEI":     "BINANCE:SEIUSDT",
    "PEPE":    "BINANCE:PEPEUSDT",
    "WIF":     "BINANCE:WIFUSDT",
    "ORDI":    "BINANCE:ORDIUSDT",
    "SATS":    "BINANCE:SATSUSDT",
    "GOAT":    "BINANCE:GOATUSDT",
    "MOODENG": "BINANCE:MOODENGUSDT",
}

# Default coin colors
DEFAULT_COLOR: dict[str, str] = {
    "BTC": "#F7931A", "ETH": "#627EEA", "TRX": "#FF0013",
    "DOGE": "#C2A633", "USDT": "#26A17B", "SOL": "#9945FF",
    "ADA": "#0033AD", "XRP": "#346AA9", "BNB": "#F3BA2F",
    "AVAX": "#E84142", "DOT": "#E6007A", "MATIC": "#8247E5",
    "LTC": "#BFBBBB", "NEAR": "#00C08B", "USDC": "#2775CA",
    "LINK": "#2A5ADA", "UNI": "#FF007A", "ATOM": "#2E3148",
    "FTM": "#1969FF", "SAND": "#04ADEF", "MANA": "#FF2D55",
    "OP": "#FF0420", "ARB": "#12AAFF", "SUI": "#6FBCF0",
    "PEPE": "#00AA00", "WIF": "#C0A56E", "ORDI": "#FF8C00",
}


def get_conn():
    return psycopg.connect(DB_URL)


def cmd_list():
    """แสดงรายการเหรียญทั้งหมด"""
    conn = get_conn()
    cur = conn.cursor()
    cur.execute("SELECT symbol, id, coingecko_id, is_active FROM assets ORDER BY symbol")
    rows = cur.fetchall()
    conn.close()

    print(f"\n{'Status':<8} {'Symbol':<10} {'coin_id':<28} {'CoinGecko Name'}")
    print("─" * 70)
    for r in rows:
        status = "✅ ON " if r[3] else "⛔ OFF"
        print(f"{status}  {r[0]:<10} {r[1]:<28} {r[2] or '—'}")
    print(f"\nรวม {len(rows)} เหรียญ (ON: {sum(1 for r in rows if r[3])}, OFF: {sum(1 for r in rows if not r[3])})\n")


def cmd_add(symbol: str, coingecko_id: str, tv_symbol: str | None = None, color: str | None = None):
    """เพิ่มเหรียญใหม่เข้า DB"""
    symbol = symbol.upper()
    coin_id = coingecko_id.lower().strip()

    conn = get_conn()
    cur = conn.cursor()

    # ตรวจว่ามีอยู่แล้วไหม
    cur.execute("SELECT id, is_active FROM assets WHERE symbol = %s OR id = %s", (symbol, coin_id))
    existing = cur.fetchone()

    if existing:
        if not existing[1]:
            # มีอยู่แล้วแต่ปิดอยู่ → เปิดให้
            cur.execute("UPDATE assets SET is_active = true WHERE id = %s", (existing[0],))
            conn.commit()
            print(f"✅ {symbol} มีอยู่แล้ว (ปิดอยู่) → เปิดให้แล้ว")
        else:
            print(f"ℹ️  {symbol} มีอยู่แล้ว และเปิดอยู่แล้ว")
        conn.close()
        return

    # INSERT ใหม่
    cur.execute("""
        INSERT INTO assets (id, symbol, name, type, is_active, coingecko_id)
        VALUES (%s, %s, %s, 'crypto', true, %s)
    """, (coin_id, symbol, symbol, symbol))
    conn.commit()
    conn.close()
    print(f"✅ เพิ่ม {symbol} ({coin_id}) สำเร็จ")

    # อัปเดต tsx
    _patch_tsx(symbol, coin_id, tv_symbol, color)


def cmd_toggle(symbol: str, active: bool):
    """เปิด/ปิดเหรียญ"""
    symbol = symbol.upper()
    conn = get_conn()
    cur = conn.cursor()
    cur.execute("UPDATE assets SET is_active = %s WHERE symbol = %s RETURNING id", (active, symbol))
    row = cur.fetchone()
    conn.commit()
    conn.close()

    if row:
        state = "✅ เปิด" if active else "⛔ ปิด"
        print(f"{state} {symbol} ({row[0]}) สำเร็จ")
    else:
        print(f"❌ ไม่พบ {symbol} ใน DB")


def cmd_tv(symbol: str, tv_symbol: str):
    """อัปเดต TradingView symbol ใน market-client.tsx"""
    symbol = symbol.upper()
    _patch_tv_symbol(symbol, tv_symbol)
    print(f"✅ ตั้ง TradingView symbol ของ {symbol} → {tv_symbol}")


def _get_coin_id(symbol: str) -> str | None:
    conn = get_conn()
    cur = conn.cursor()
    cur.execute("SELECT id FROM assets WHERE symbol = %s", (symbol,))
    row = cur.fetchone()
    conn.close()
    return row[0] if row else None


def _patch_tsx(symbol: str, coin_id: str, tv_symbol: str | None, color: str | None):
    """เพิ่ม mapping ใน market-client.tsx อัตโนมัติ"""
    if not MARKET_CLIENT.exists():
        print(f"⚠️  ไม่พบไฟล์ {MARKET_CLIENT} — ข้ามการ patch tsx")
        return

    content = MARKET_CLIENT.read_text(encoding="utf-8")
    changed = False

    # TV_SYMBOL
    tv = tv_symbol or DEFAULT_TV.get(symbol) or f"BINANCE:{symbol}USDT"
    tv_line = f'  {coin_id}: "{tv}",'
    if coin_id not in content:
        content = content.replace(
            "};  // END_TV_SYMBOL",
            f"{tv_line}\n}};  // END_TV_SYMBOL"
        )
        # fallback: หา block TV_SYMBOL แล้วเพิ่มก่อน };
        if "END_TV_SYMBOL" not in content:
            content = re.sub(
                r'(const TV_SYMBOL[^=]*=\s*\{[^}]*)',
                lambda m: m.group(0) + f"\n{tv_line}",
                content,
                count=1
            )
        changed = True

    # COIN_SYMBOL
    sym_line = f'  {coin_id}: "{symbol}",'
    if f'  {coin_id}: "' not in content:
        content = re.sub(
            r'(const COIN_SYMBOL[^=]*=\s*\{)',
            lambda m: m.group(0) + f"\n{sym_line}",
            content,
            count=1
        )
        changed = True

    # COIN_COLOR
    col = color or DEFAULT_COLOR.get(symbol, "#1A2A5E")
    col_line = f'  {coin_id}: "{col}",'
    if f"  {coin_id}:" not in content.split("const COIN_COLOR")[1] if "const COIN_COLOR" in content else True:
        content = re.sub(
            r'(const COIN_COLOR[^=]*=\s*\{)',
            lambda m: m.group(0) + f"\n{col_line}",
            content,
            count=1
        )
        changed = True

    if changed:
        MARKET_CLIENT.write_text(content, encoding="utf-8")
        print(f"📝 อัปเดต market-client.tsx: เพิ่ม {symbol} ({coin_id})")
        print(f"   TV_SYMBOL  → {tv}")
        print(f"   COIN_COLOR → {col}")
    else:
        print(f"ℹ️  market-client.tsx ไม่ต้องอัปเดต (มี {coin_id} อยู่แล้ว)")


def _patch_tv_symbol(symbol: str, tv_symbol: str):
    """อัปเดตเฉพาะ TV_SYMBOL ใน tsx"""
    coin_id = _get_coin_id(symbol)
    if not coin_id:
        print(f"❌ ไม่พบ {symbol} ใน DB")
        return
    if not MARKET_CLIENT.exists():
        print(f"⚠️  ไม่พบไฟล์ {MARKET_CLIENT}")
        return

    content = MARKET_CLIENT.read_text(encoding="utf-8")
    # แทนที่ค่าเก่า
    new_content = re.sub(
        rf'({re.escape(coin_id)}: ")[^"]+(")',
        lambda m: f'{coin_id}: "{tv_symbol}"',
        content,
        count=1
    )
    if new_content != content:
        MARKET_CLIENT.write_text(new_content, encoding="utf-8")
        print(f"📝 อัปเดต market-client.tsx สำเร็จ")
    else:
        print(f"⚠️  ไม่พบ {coin_id} ใน TV_SYMBOL block — ลอง add ก่อน")


# ── CLI ──────────────────────────────────────────────────────────────────────
def main():
    args = sys.argv[1:]
    if not args:
        print(__doc__)
        sys.exit(0)

    cmd = args[0].lower()

    if cmd == "list":
        cmd_list()

    elif cmd == "add":
        if len(args) < 3:
            print("Usage: manage_assets.py add <SYMBOL> <coingecko_id> [tv_symbol] [color]")
            sys.exit(1)
        tv = args[3] if len(args) > 3 else None
        color = args[4] if len(args) > 4 else None
        cmd_add(args[1], args[2], tv, color)

    elif cmd == "on":
        if len(args) < 2:
            print("Usage: manage_assets.py on <SYMBOL>")
            sys.exit(1)
        cmd_toggle(args[1], True)

    elif cmd == "off":
        if len(args) < 2:
            print("Usage: manage_assets.py off <SYMBOL>")
            sys.exit(1)
        cmd_toggle(args[1], False)

    elif cmd == "tv":
        if len(args) < 3:
            print("Usage: manage_assets.py tv <SYMBOL> <TV_SYMBOL>")
            sys.exit(1)
        cmd_tv(args[1], args[2])

    else:
        print(f"❌ ไม่รู้จัก command '{cmd}'")
        print(__doc__)
        sys.exit(1)


if __name__ == "__main__":
    main()
