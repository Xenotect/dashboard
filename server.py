from flask import Flask, request, jsonify
from flask_cors import CORS
from agents import xeno_crew
import os
import json
from datetime import datetime

app = Flask(__name__)
CORS(app) 

# --- 📁 ฟังก์ชันสำหรับบันทึก Log ---
def save_mission_log(agent_name, command, response):
    log_file = 'mission_logs.json'
    new_entry = {
        "id": datetime.now().strftime("%Y%m%d%H%M%S"),
        "timestamp": datetime.now().strftime("%H:%M:%S | %d %b %y"),
        "agent": agent_name, # หรือจะเปลี่ยนเป็นชื่อ Agent ที่ตอบจริงๆ ก็ได้
        "command": command,
        "response": response
    }
    
    data = []
    if os.path.exists(log_file):
        try:
            with open(log_file, 'r', encoding='utf-8') as f:
                data = json.load(f)
        except: data = []
    
    data.insert(0, new_entry)
    with open(log_file, 'w', encoding='utf-8') as f:
        json.dump(data[:500], f, indent=4, ensure_ascii=False)

# --- 🔍 Route สำหรับหน้า Archive (ดึง Log ไปโชว์) ---
@app.route('/get-logs', methods=['GET'])
def get_logs():
    if os.path.exists('mission_logs.json'):
        with open('mission_logs.json', 'r', encoding='utf-8') as f:
            return jsonify(json.load(f))
    return jsonify([])

# --- 🚀 Route เดิมสำหรับสั่งงาน AI ---
@app.route('/ask-xeno', methods=['POST'])
def ask_xeno():
    data = request.json
    user_command = data.get('command')

    try:
        result = xeno_crew.kickoff(inputs={'command': user_command})
        
        # ✅ บันทึกผลลัพธ์ลง Log ทันทีที่ทำงานเสร็จ
        save_mission_log("Xeno Intelligence", user_command, str(result))
        
        return jsonify({"status": "success", "result": str(result)})
    except Exception as e:
        error_message = str(e)
        if "credit balance is too low" in error_message.lower():
            friendly_message = "❌ น้อง Xeno พร้อมทำงานแล้วครับ! แต่ตอนนี้ 'พลังงาน (Credit)' ในระบบหมดพอดี พี่ๆ ช่วยเติมพลังงานที่ Anthropic Console หน่อยนะครับ"
        else:
            friendly_message = f"❌ เกิดข้อผิดพลาดบางอย่าง: {error_message}"
        
        return jsonify({"status": "error", "message": friendly_message}), 500

if __name__ == '__main__':
    port = int(os.environ.get("PORT", 5000))
    print(f"🚀 Xeno Web Server is running on port {port}")
    app.run(host="0.0.0.0", port=port, debug=False)