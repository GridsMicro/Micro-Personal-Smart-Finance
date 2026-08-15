#!/bin/bash
# ─────────────────────────────────────────────────────────────
#  Portfolio Transaction Manager - Quick Runner
#  Usage: ./run.sh <command> [args...]
#
#  Portfolio commands:
#    ./run.sh status
#    ./run.sh buy ADA 9046.6 50000 5.52
#    ./run.sh sell TRX 50000
#    ./run.sh convert TRX USDT 1524.40686 51220.07 33.6 --date 2026-07-26
#    ./run.sh cash add 45657 --note "ขาย DOGE"
#    ./run.sh cash set 99576
#    ./run.sh assets
#
#  Market asset commands:
#    ./run.sh market list                        # ดูเหรียญทั้งหมด
#    ./run.sh market add LINK chainlink          # เพิ่มเหรียญใหม่
#    ./run.sh market on  LINK                   # เปิดเหรียญ
#    ./run.sh market off MOODENG                # ปิดเหรียญ
#    ./run.sh market tv  LINK BITKUB:LINKTHB    # ตั้ง TradingView symbol
#
#  Git commands:
#    ./run.sh push                    # push ด้วย message อัตโนมัติ
#    ./run.sh push "my commit msg"    # push ด้วย message ที่กำหนดเอง
# ─────────────────────────────────────────────────────────────

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
VENV_DIR="$SCRIPT_DIR/.venv"
PYTHON="$VENV_DIR/bin/python"
PORTFOLIO_SCRIPT="$SCRIPT_DIR/portfolio.py"
MARKET_SCRIPT="$SCRIPT_DIR/manage_assets.py"

# ── Auto-setup venv ─────────────────────────────────────────
if [ ! -f "$PYTHON" ]; then
  echo "🔧 ตั้งค่า Python venv ครั้งแรก..."
  python3 -m venv "$VENV_DIR"
  "$VENV_DIR/bin/pip" install --quiet --upgrade pip
  "$VENV_DIR/bin/pip" install --quiet -r "$SCRIPT_DIR/requirements.txt"
  echo "✅ Setup เสร็จแล้ว"
fi

# ── Run ─────────────────────────────────────────────────────
if [ "$1" = "push" ]; then
  shift
  "$PYTHON" "$SCRIPT_DIR/push.py" "$@"
elif [ "$1" = "market" ]; then
  shift
  "$PYTHON" "$MARKET_SCRIPT" "$@"
else
  "$PYTHON" "$PORTFOLIO_SCRIPT" "$@"
fi
