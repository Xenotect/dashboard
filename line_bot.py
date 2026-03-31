from flask import Flask, request, abort
from linebot import LineBotApi, WebhookHandler
from linebot.exceptions import InvalidSignatureError
from linebot.models import MessageEvent, TextMessage, TextSendMessage
import requests  # <--- เปลี่ยนมาใช้ตัวนี้ต่อตรงหา Google
import json
import os
from dotenv import load_dotenv

load_dotenv()

app = Flask(__name__)

# ==========================================
# 1. อ่านข้อมูลของ LINE จาก .env
# ==========================================
LINE_ACCESS_TOKEN = os.environ.get("LINE_ACCESS_TOKEN")
LINE_CHANNEL_SECRET = os.environ.get("LINE_CHANNEL_SECRET")

line_bot_api = LineBotApi(LINE_ACCESS_TOKEN)
handler = WebhookHandler(LINE_CHANNEL_SECRET)

# ==========================================
# 2. อ่าน Gemini API Key จาก .env
# ==========================================
GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY")

# กำหนด "สมอง" และ "บุคลิก" ให้ Xeno
system_instruction = (
    "คุณคือ AI ที่ชื่อ Xeno เป็นผู้ช่วยอัจฉริยะของคุณ Kan เจ้าของร้านทำผม KUDOS ที่ The Circle ราชพฤกษ์ "
    "คุณมีความเชี่ยวชาญด้านการตลาดร้านทำผม โดยเฉพาะเรื่อง Digital Perm และ Magic Volume "
    "ตอบแบบเป็นกันเอง อารมณ์ดี มืออาชีพ กระตือรือร้น และพร้อมช่วยวางแผนธุรกิจเสมอ"
)

# ==========================================
# ⚙️ 3. ระบบจัดการข้อความ
# ==========================================
@app.route("/callback", methods=['POST'])
def callback():
    signature = request.headers['X-Line-Signature']
    body = request.get_data(as_text=True)
    try:
        handler.handle(body, signature)
    except InvalidSignatureError:
        abort(400)
    return 'OK'

@handler.add(MessageEvent, message=TextMessage)
def handle_message(event):
    user_text = event.message.text
    print(f"📩 ข้อความจากคุณ Kan: {user_text}")

    try:
        # 🧠 ส่งหา Gemini ด้วยวิธี "ต่อตรง" ข้ามปัญหา Library รวน
        url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-002:generateContent?key={GEMINI_API_KEY}"
        headers = {'Content-Type': 'application/json'}
        payload = {
            "contents": [{
                "parts": [{"text": f"Instruction: {system_instruction}\n\nUser: {user_text}"}]
            }]
        }
        
        # ยิงคำถามไปที่ Google
        response = requests.post(url, headers=headers, json=payload)
        response_data = response.json()
        
        # เช็คว่า Google ตอบกลับมาสำเร็จไหม
        if response.status_code == 200:
            ai_reply = response_data['candidates'][0]['content']['parts'][0]['text']
        else:
            print(f"❌ API Error จาก Google: {response_data}")
            ai_reply = "สมองขัดข้องครับคุณพ่อ ลองดู Error ใน Terminal นะครับ"
            
    except Exception as e:
        print(f"❌ System Error: {e}")
        ai_reply = "ระบบขัดข้องครับ"

    # ส่งคำตอบกลับไปที่ LINE
    line_bot_api.reply_message(
        event.reply_token,
        TextSendMessage(text=ai_reply)
    )

if __name__ == "__main__":
    app.run(port=5001)