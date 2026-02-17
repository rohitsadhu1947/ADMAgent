#!/usr/bin/env python3
"""
Quick script to link your Telegram ID to your ADM record.
Usage: python link_telegram.py <telegram_id> <phone_number>
Example: python link_telegram.py 123456789 7303474258
"""
import sys
sys.path.insert(0, 'backend')

from database import SessionLocal
from models import ADM

if len(sys.argv) < 3:
    print("Usage: python link_telegram.py <telegram_id> <phone_number>")
    print("Example: python link_telegram.py 123456789 7303474258")
    sys.exit(1)

telegram_id = sys.argv[1]
phone = sys.argv[2]

db = SessionLocal()
adm = db.query(ADM).filter(ADM.phone == phone).first()

if not adm:
    print(f"No ADM found with phone {phone}")
    db.close()
    sys.exit(1)

adm.telegram_chat_id = str(telegram_id)
db.commit()
print(f"Linked Telegram ID {telegram_id} to ADM: {adm.name} (ID={adm.id}, phone={adm.phone})")
print("Now restart the bot and send /start — it should recognize you!")
db.close()
