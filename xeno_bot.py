import os
import telebot
import requests
from dotenv import load_dotenv

load_dotenv()

# อ่าน Token จาก .env
BOT_TOKEN = os.environ.get("TELEGRAM_BOT_TOKEN")
bot = telebot.TeleBot(BOT_TOKEN)

# ฟังก์ชันสำหรับส่งคำสั่งไปหา Agents (ที่รันพอร์ต 5000)
def ask_xeno_server(command):
    try:
        url = "http://127.0.0.1:5000/ask-xeno"
        data = {"command": command, "agent": "Xeno Content"}
        response = requests.post(url, json=data, timeout=300) 
        
        if response.status_code == 200:
            return response.json().get("result")
        else:
            return f"❌ Server ตอบกลับด้วย Error: {response.status_code}"
    except Exception as e:
        return f"❌ ติดต่อ Server พอร์ต 5000 ไม่ได้ (ลืมรัน xeno หรือเปล่า?): {str(e)}"

@bot.message_handler(commands=['start'])
def welcome(message):
    bot.reply_to(message, "🛸 Xeno AI (Claude 4.6) พร้อมรับคำสั่งจาก Telegram แล้วครับคุณ Kan!")

@bot.message_handler(func=lambda message: True)
def handle_message(message):
    query = message.text
    # ส่งข้อความบอกว่ากำลังทำ (เพื่อให้รู้ว่าบอทไม่ตาย)
    status = bot.reply_to(message, "⚡ กำลังส่งคำสั่งไปที่กองบัญชาการ Xeno...")
    
    # ดึงผลลัพธ์จาก Server
    result = ask_xeno_server(query)
    
    # ส่งคำตอบสุดท้าย
    bot.reply_to(message, f"✅ รายงานจาก Claude 4.6:\n\n{result}")

print("🛸 Xeno Telegram Bot (v4.6 Ready) is running...")
bot.infinity_polling()