import os
import re
import json
import requests
from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from crewai import Agent, Task, Crew, Process, LLM
from datetime import datetime, timedelta
from openai import OpenAI
from dotenv import load_dotenv
from passlib.context import CryptContext
from jose import JWTError, jwt

load_dotenv()  # โหลด .env file อัตโนมัติ

# Base directory — ทุก file ใช้ path เดียวกันหมด
BASE_DIR = os.path.dirname(os.path.abspath(__file__))

# --- 🔐 Auth Setup ---
SECRET_KEY = os.environ.get("JWT_SECRET", "xeno-secret-key-change-in-production")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_HOURS = 24
USERS_FILE = os.path.join(BASE_DIR, "users.json")

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
bearer_scheme = HTTPBearer(auto_error=False)

def load_users():
    if not os.path.exists(USERS_FILE):
        return []
    with open(USERS_FILE, "r", encoding="utf-8") as f:
        return json.load(f)

def save_users(users):
    with open(USERS_FILE, "w", encoding="utf-8") as f:
        json.dump(users, f, indent=2, ensure_ascii=False)

def ensure_passwords_hashed():
    """Hash plain text passwords on startup if not already hashed."""
    users = load_users()
    changed = False
    for u in users:
        if not u["password"].startswith("$2b$"):
            u["password"] = pwd_context.hash(u["password"])
            changed = True
    if changed:
        save_users(users)

ensure_passwords_hashed()

def authenticate_user(username: str, password: str):
    users = load_users()
    for u in users:
        if u["username"] == username and pwd_context.verify(password, u["password"]):
            return u
    return None

def create_token(username: str, role: str) -> str:
    expire = datetime.utcnow() + timedelta(hours=ACCESS_TOKEN_EXPIRE_HOURS)
    return jwt.encode({"sub": username, "role": role, "exp": expire}, SECRET_KEY, algorithm=ALGORITHM)

def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme)):
    if not credentials:
        raise HTTPException(status_code=401, detail="Not authenticated")
    try:
        payload = jwt.decode(credentials.credentials, SECRET_KEY, algorithms=[ALGORITHM])
        return {"username": payload["sub"], "role": payload["role"]}
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")
USED_IMAGES_FILE = os.path.join(BASE_DIR, "used_images.json")
MISSION_LOGS_FILE = os.path.join(BASE_DIR, "mission_logs.json")

# --- 📝 ฟังก์ชันบันทึก Log สำหรับหน้า Archive ---
def save_mission_log(agent_name, command, response):
    log_file = MISSION_LOGS_FILE
    new_entry = {
        "id": datetime.now().strftime("%Y%m%d%H%M%S"),
        "timestamp": datetime.now().strftime("%H:%M:%S | %d %b %y"),
        "agent": agent_name,
        "command": command,
        "response": str(response) # แปลงผลลัพธ์จาก AI เป็น String เพื่อลงไฟล์
    }
    
    data = []
    if os.path.exists(log_file):
        try:
            with open(log_file, 'r', encoding='utf-8') as f:
                data = json.load(f)
        except (json.JSONDecodeError, IOError):
            data = []  # ถ้าไฟล์เสียให้เริ่มใหม่
    
    data.insert(0, new_entry) # เอาอันล่าสุดไว้บนสุด
    with open(log_file, 'w', encoding='utf-8') as f:
        # เก็บไว้ 50 รายการล่าสุดเพื่อไม่ให้ไฟล์หนักเกินไป
        json.dump(data[:50], f, indent=4, ensure_ascii=False)

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
    allow_credentials=False,
)

my_llm = LLM(
    model='anthropic/claude-sonnet-4-6',
    temperature=0.7
)

# --- 📊 Facebook Tools สำหรับดึงข้อมูล Real-time ---
from crewai.tools import tool

FB_PAGE_ID = os.environ.get("FB_PAGE_ID", "")
FB_ACCESS_TOKEN = os.environ.get("FB_PAGE_ACCESS_TOKEN", "")

@tool("get_page_stats")
def get_page_stats(dummy: str = "") -> str:
    """ดึงสถิติ Page เช่น followers, fan count, impressions จาก Facebook Graph API"""
    if not FB_PAGE_ID or not FB_ACCESS_TOKEN:
        return "ไม่มี Facebook credentials ในระบบ"
    try:
        fields = "followers_count,fan_count,name"
        url = f"https://graph.facebook.com/v19.0/{FB_PAGE_ID}?fields={fields}&access_token={FB_ACCESS_TOKEN}"
        r = requests.get(url, timeout=10)
        data = r.json()
        if "error" in data:
            return f"Facebook API error: {data['error'].get('message', 'unknown')}"
        return json.dumps(data, ensure_ascii=False)
    except Exception as e:
        return f"Error: {str(e)}"

@tool("get_recent_posts")
def get_recent_posts(dummy: str = "") -> str:
    """ดึง 10 โพสต์ล่าสุดจาก Facebook Page พร้อม engagement"""
    if not FB_PAGE_ID or not FB_ACCESS_TOKEN:
        return "ไม่มี Facebook credentials ในระบบ"
    try:
        fields = "id,message,created_time,permalink_url,likes.summary(true),comments.summary(true)"
        url = f"https://graph.facebook.com/v19.0/{FB_PAGE_ID}/posts?fields={fields}&limit=10&access_token={FB_ACCESS_TOKEN}"
        r = requests.get(url, timeout=10)
        data = r.json()
        if "error" in data:
            return f"Facebook API error: {data['error'].get('message', 'unknown')}"
        return json.dumps(data.get("data", []), ensure_ascii=False)
    except Exception as e:
        return f"Error: {str(e)}"

@tool("get_top_posts")
def get_top_posts(dummy: str = "") -> str:
    """ดึงโพสต์ยอดนิยมสูงสุด 5 อันดับจาก Facebook Page"""
    if not FB_PAGE_ID or not FB_ACCESS_TOKEN:
        return "ไม่มี Facebook credentials ในระบบ"
    try:
        fields = "id,message,created_time,permalink_url,likes.summary(true),comments.summary(true),shares"
        url = f"https://graph.facebook.com/v19.0/{FB_PAGE_ID}/posts?fields={fields}&limit=25&access_token={FB_ACCESS_TOKEN}"
        r = requests.get(url, timeout=10)
        data = r.json()
        if "error" in data:
            return f"Facebook API error: {data['error'].get('message', 'unknown')}"
        posts = data.get("data", [])
        def score(p):
            likes = p.get("likes", {}).get("summary", {}).get("total_count", 0)
            comments = p.get("comments", {}).get("summary", {}).get("total_count", 0)
            shares = p.get("shares", {}).get("count", 0)
            return likes + comments * 2 + shares * 3
        top = sorted(posts, key=score, reverse=True)[:5]
        return json.dumps(top, ensure_ascii=False)
    except Exception as e:
        return f"Error: {str(e)}"

fb_tools = [get_page_stats, get_recent_posts, get_top_posts]

# --- 🎭 สร้างทีม Xeno AI ทั้ง 6 ตำแหน่ง (Full Team) ---

# --- 🎭 สั่งการยูนิต Xeno AI ทั้ง 12 ตำแหน่ง (KUDOS Focus Only) ---

# [1] หน่วยบัญชาการ
commander = Agent(
    role='Xeno Commander (KUDOS Overlord)',
    goal='ควบคุมภาพรวมธุรกิจร้าน KUDOS และสั่งการยูนิตต่างๆ ให้ทำงานสอดประสานกัน',
    backstory="""คุณคือผู้ช่วยมือขวาของคุณ Kan มีหน้าที่บริหารจัดการทุกอย่างในอาณาจักร KUDOS 
    หน้าที่ของคุณคือรับคำสั่งจาก Commander Kan แล้วกระจายงานให้ผู้เชี่ยวชาญแต่ละฝ่ายอย่างแม่นยำ""",
    llm=my_llm, verbose=True, tools=fb_tools
)

# [2] หน่วยระดมสมอง
gemini_core = Agent(
    role='Xeno Gemini (KUDOS Innovation)',
    goal='วิจัยเทรนด์ทรงผมโลกและหาไอเดียการตลาดล้ำๆ มาปรับใช้กับร้าน KUDOS',
    backstory="""คุณคือคลังสมองของร้าน KUDOS คอยมองหาเทคโนโลยี AI หรือเทรนด์แฟชั่นใหม่ๆ 
    มาช่วยสร้างจุดเด่นให้ร้านเหนือกว่าคู่แข่งในย่านราชพฤกษ์และกรุงเทพฯ""",
    llm=my_llm, verbose=True, tools=fb_tools
)

# [3] นักการตลาด (Focus: Premium Hair Service)
content_creator = Agent(
    role='Xeno Content Strategist',
    goal="สร้างคอนเทนต์ดึงดูดลูกค้าให้มาทำผม ยืด ดัด และทำสีที่ KUDOS",
    backstory="""ผู้เชี่ยวชาญการปั้นแบรนด์ร้านทำผมพรีเมียม เน้นย้ำความเก่งเรื่อง 
    'ยืดและดัดดิจิตอล' ของ KUDOS ให้คนจดจำและอยากเดินเข้ามาใช้บริการ""",
    llm=my_llm, verbose=True, tools=fb_tools
)

# [4] ฝ่ายคัดเลือกภาพ
image_scout = Agent(
    role='Xeno Image Scout',
    goal='คุมคุณภาพรูปถ่ายพอร์ตโฟลิโอผมของลูกค้า KUDOS ให้สวยระดับนิตยสาร',
    backstory="""คุณต้องกำกับมุมกล้อง แสง และองค์ประกอบภาพ Before/After 
    เพื่อให้งานฝีมือของช่างที่ KUDOS ดูสวยเงางามและดึงดูดใจที่สุดบนโซเชียล""",
    llm=my_llm, verbose=True, tools=fb_tools
)

# [5] ฝ่ายวิดีโอ (Focus: ASMR & Viral)
video_planner = Agent(
    role='Xeno Video Planner',
    goal='สร้างวิดีโอโชว์ความพริ้วของเส้นผมและบรรยากาศในร้าน KUDOS',
    backstory="""Video Creator สายบิวตี้ที่รู้วิธีตัดต่อวิดีโอทำผมให้น่าดู 
    เน้นการโชว์ผลลัพธ์หลังทำที่ว้าว จนลูกค้าต้องกด Save และทักจองคิว""",
    llm=my_llm, verbose=True, tools=fb_tools
)

# [6] ฝ่ายคุม Mood & Tone
colorist = Agent(
    role='Xeno Color & Mood Specialist',
    goal='ดูแลภาพลักษณ์ (CI) ของร้าน KUDOS ให้ดูหรูหราและเข้าถึงง่าย',
    backstory="""คุมโทนสีและกราฟิกของร้าน KUDOS ในทุกสื่อ 
    ให้ลูกค้าสัมผัสได้ถึงความพรีเมียมและความเป็นมืออาชีพตั้งแต่ครั้งแรกที่เห็น""",
    llm=my_llm, verbose=True, tools=fb_tools
)

# [7] ฝ่ายการเงิน
accountant = Agent(
    role='Xeno Accountant',
    goal='วิเคราะห์กำไรขาดทุนและคำนวณความคุ้มค่าของโปรโมชั่นในร้าน KUDOS',
    backstory="""นักวางแผนการเงินประจำร้าน KUDOS คอยตรวจสอบค่าใช้จ่าย 
    และออกแบบโปรโมชั่นที่ทำให้ร้านได้กำไรสูงสุด โดยที่ลูกค้ารู้สึกคุ้มค่า""",
    llm=my_llm, verbose=True, tools=fb_tools
)

# [8] ฝ่ายบริหารคิว
booking_manager = Agent(
    role='Xeno Booking Manager',
    goal='บริหารจัดการตารางเวลาช่างและคิวลูกค้า KUDOS ทุกสาขา',
    backstory="""ดูแลระบบจองคิว VIP ของร้าน KUDOS ให้ไหลลื่นที่สุด 
    ลดระยะเวลารอคอยของลูกค้า และเพิ่มประสิทธิภาพการทำงานของช่างในแต่ละวัน""",
    llm=my_llm, verbose=True, tools=fb_tools
)

# [9] ฝ่ายพัฒนาระบบ (Tech Support)
coder = Agent(
    role='Xeno Coder (KUDOS Systems)',
    goal='พัฒนาระบบหลังบ้านและ Dashboard สำหรับบริหารจัดการร้าน KUDOS',
    backstory="""Software Engineer ที่สร้างระบบให้ Commander Kan ใช้บริหารร้านได้ง่ายขึ้น 
    คอยเชื่อมต่อข้อมูลจาก LINE OA หรือระบบจองคิวมาไว้ในที่เดียว""",
    llm=my_llm, verbose=True, tools=fb_tools
)

# [10] ฝ่ายออกแบบประสบการณ์ (UI/UX)
gamedev = Agent(
    role='Xeno Experience Designer',
    goal='สร้างกิจกรรมหรือระบบสมาชิก (Gamification) ให้ลูกค้า KUDOS กลับมาใช้บริการซ้ำ',
    backstory="""นำหลักการออกแบบเกมมาสร้างระบบสะสมแต้มหรือกิจกรรมสนุกๆ ให้ลูกค้า KUDOS 
    เพื่อสร้าง Community และความจงรักภักดีต่อแบรนด์ (Brand Loyalty)""",
    llm=my_llm, verbose=True, tools=fb_tools
)

# [11] ฝ่ายวิเคราะห์ตลาด (Trading Mindset)
trader = Agent(
    role='Xeno Market Watch',
    goal='วิเคราะห์ราคาสินค้า (ทองคำ/ค่าเงิน) เพื่อวางแผนการลงทุนและสต็อกผลิตภัณฑ์ราคาแพง',
    backstory="""ใช้วิธีการวิเคราะห์ตลาดมาช่วยตัดสินใจสั่งซื้อผลิตภัณฑ์ทำผมพรีเมียม (เช่น Shiseido) 
    ในช่วงที่ราคาเหมาะสมที่สุด เพื่อคุมต้นทุนของร้าน KUDOS ให้ต่ำที่สุด""",
    llm=my_llm, verbose=True, tools=fb_tools
)

# [12] ฝ่ายตรวจสอบ (New!)
auditor = Agent(
    role='Xeno Auditor (Order Auditor)',
    goal='ตรวจสอบความถูกต้องของงาน ตัวสะกด และโครงสร้างโค้ด',
    backstory="""ผู้คุมกฎระเบียบที่ละเอียดถี่ถ้วนที่สุด 
    คุณต้องเช็คว่างานจาก Agent ตัวอื่นหรือโค้ดที่เขียน มีจุดผิดพลาดตรงไหนหรือไม่ (เช่น ลืมใส่ {} หรือสะกดคำผิด)""",
    llm=my_llm, verbose=True, tools=fb_tools
)

# --- 🗺️ Map Agent ให้ตรงกับ Dashboard (สำคัญมาก!) ---
agent_map = {
    "Xeno Commander": commander,
    "Xeno Gemini": gemini_core,
    "Xeno Content": content_creator,
    "Xeno Scout": image_scout,
    "Xeno Video": video_planner,
    "Xeno Color": colorist,
    "Xeno Account": accountant,
    "Xeno Booking": booking_manager,
    "Xeno Coder": coder,
    "Xeno GameDev": gamedev,
    "Xeno XAU": trader,
    "Xeno Auditor": auditor
}

# --- 🎮 Xeno Game Studio Agents ---

xeno_producer = Agent(
    role='Xeno Producer',
    goal='บริหารจัดการ sprint, milestone และประสานงานทีม game dev ให้ส่งงานตรงเวลา',
    backstory='ผู้บัญชาการการผลิตเกม ควบคุมทุก sprint และ milestone ด้วยความแม่นยำ ตอบเป็นภาษาไทย',
    llm=my_llm, verbose=True, tools=fb_tools
)

xeno_designer = Agent(
    role='Xeno Designer',
    goal='ออกแบบ core loop, progression systems และ mechanics ของเกมให้สนุกและสมดุล',
    backstory='นักออกแบบเกมที่เชี่ยวชาญ MDA framework และ player psychology ตอบเป็นภาษาไทย',
    llm=my_llm, verbose=True, tools=fb_tools
)

xeno_coder = Agent(
    role='Xeno Coder (Lead Programmer)',
    goal='กำหนดสถาปัตยกรรมโค้ด, มาตรฐาน และ review code ทั้งทีม',
    backstory='Lead programmer ที่ออกแบบ API และ refactoring strategy ตอบเป็นภาษาไทย',
    llm=my_llm, verbose=True, tools=fb_tools
)

xeno_engine = Agent(
    role='Xeno Engine (Engine Programmer)',
    goal='ดูแล rendering pipeline, physics, memory management และ core engine systems',
    backstory='วิศวกร engine ที่เชี่ยวชาญ performance-critical systems ตอบเป็นภาษาไทย',
    llm=my_llm, verbose=True, tools=fb_tools
)

xeno_gameplay = Agent(
    role='Xeno Gameplay (Gameplay Programmer)',
    goal='สร้าง combat, player movement, และ interactive features ให้รู้สึกดีและ responsive',
    backstory='โปรแกรมเมอร์ gameplay ที่แปลง design documents ให้เป็น working game features ตอบเป็นภาษาไทย',
    llm=my_llm, verbose=True, tools=fb_tools
)

xeno_ai_bot = Agent(
    role='Xeno AI Bot (AI Programmer)',
    goal='พัฒนา AI พฤติกรรม NPC, pathfinding, behavior trees และ decision-making',
    backstory='ผู้เชี่ยวชาญ game AI ที่สร้าง NPC ให้รู้สึกมีชีวิตและท้าทาย ตอบเป็นภาษาไทย',
    llm=my_llm, verbose=True, tools=fb_tools
)

xeno_ui_dev = Agent(
    role='Xeno UI Dev (UI Programmer)',
    goal='สร้าง HUD, เมนู, inventory screens และ UI framework code',
    backstory='นักพัฒนา UI ที่เชี่ยวชาญ widget development และ screen flow ตอบเป็นภาษาไทย',
    llm=my_llm, verbose=True, tools=fb_tools
)

xeno_director = Agent(
    role='Xeno Director (Creative Director)',
    goal='กำกับวิสัยทัศน์เกม, aesthetic direction และตัดสินใจ creative ขั้นสูงสุด',
    backstory='Creative director ที่เป็นผู้มีอำนาจสูงสุดด้าน vision, tone และ artistic direction ตอบเป็นภาษาไทย',
    llm=my_llm, verbose=True, tools=fb_tools
)

xeno_narrator = Agent(
    role='Xeno Narrator (Narrative Director)',
    goal='สร้างโครงสร้างเรื่อง, world-building, character design และ dialogue strategy',
    backstory='ผู้กำกับ narrative ที่วางแผน story arc และ character development ตอบเป็นภาษาไทย',
    llm=my_llm, verbose=True, tools=fb_tools
)

xeno_writer = Agent(
    role='Xeno Writer',
    goal='เขียน dialogue, lore entries, item descriptions และ in-game text ทั้งหมด',
    backstory='นักเขียนเกมที่สร้าง written content ทุกประเภทให้น่าสนใจและสอดคล้องกับ world ตอบเป็นภาษาไทย',
    llm=my_llm, verbose=True, tools=fb_tools
)

xeno_lore = Agent(
    role='Xeno Lore (World Builder)',
    goal='ออกแบบ factions, cultures, history, geography และ ecology ของโลกเกม',
    backstory='World builder ที่สร้าง lore ให้มีความสอดคล้องและน่าเชื่อถือ ตอบเป็นภาษาไทย',
    llm=my_llm, verbose=True, tools=fb_tools
)

xeno_artist = Agent(
    role='Xeno Artist (Art Director)',
    goal='กำกับ style guide, art bible, asset standards และ visual consistency ของเกม',
    backstory='Art director ที่เป็นเจ้าของ visual identity และ art production pipeline ตอบเป็นภาษาไทย',
    llm=my_llm, verbose=True, tools=fb_tools
)

xeno_tech_art = Agent(
    role='Xeno Tech Art (Technical Artist)',
    goal='พัฒนา shaders, VFX, optimize art pipeline และแก้ปัญหา art-to-engine',
    backstory='Technical artist ที่เชื่อม art และ engineering เข้าหากัน ตอบเป็นภาษาไทย',
    llm=my_llm, verbose=True, tools=fb_tools
)

xeno_audio = Agent(
    role='Xeno Audio (Audio Director)',
    goal='กำกับทิศทางดนตรี, sound design philosophy และ sonic identity ของเกม',
    backstory='Audio director ที่เป็นเจ้าของเอกลักษณ์เสียงของเกมทั้งหมด ตอบเป็นภาษาไทย',
    llm=my_llm, verbose=True, tools=fb_tools
)

xeno_sound = Agent(
    role='Xeno Sound (Sound Designer)',
    goal='ออกแบบ sound effects, audio events และ mixing parameters ทั้งหมด',
    backstory='Sound designer ที่สร้าง SFX specs และ audio implementation strategy ตอบเป็นภาษาไทย',
    llm=my_llm, verbose=True, tools=fb_tools
)

xeno_level = Agent(
    role='Xeno Level (Level Designer)',
    goal='ออกแบบ spatial layout, encounter design, pacing และ environmental storytelling',
    backstory='Level designer ที่สร้าง spatial designs และ difficulty pacing ตอบเป็นภาษาไทย',
    llm=my_llm, verbose=True, tools=fb_tools
)

xeno_balance = Agent(
    role='Xeno Balance (Economy Designer)',
    goal='วิเคราะห์ loot systems, progression curves, resource economy และ balance',
    backstory='Economy designer ที่เชี่ยวชาญ loot tables, progression curves และ in-game market design ตอบเป็นภาษาไทย',
    llm=my_llm, verbose=True, tools=fb_tools
)

xeno_qa = Agent(
    role='Xeno QA (QA Lead)',
    goal='วางแผน test strategy, bug triage, release quality gates และ testing process',
    backstory='QA lead ที่กำหนด test plans และ release readiness evaluation ตอบเป็นภาษาไทย',
    llm=my_llm, verbose=True, tools=fb_tools
)

xeno_tester = Agent(
    role='Xeno Tester (QA Tester)',
    goal='เขียน detailed test cases, bug reports และ regression checklists',
    backstory='QA tester ที่ขุดหา bugs และเขียน bug reports อย่างละเอียด ตอบเป็นภาษาไทย',
    llm=my_llm, verbose=True, tools=fb_tools
)

xeno_devops = Agent(
    role='Xeno DevOps',
    goal='ดูแล build pipelines, CI/CD configuration, version control workflow และ deployment',
    backstory='DevOps engineer ที่รักษา build scripts และ automated testing pipeline ตอบเป็นภาษาไทย',
    llm=my_llm, verbose=True, tools=fb_tools
)

game_agent_map = {
    "Xeno Producer": xeno_producer,
    "Xeno Designer": xeno_designer,
    "Xeno Coder": xeno_coder,
    "Xeno Engine": xeno_engine,
    "Xeno Gameplay": xeno_gameplay,
    "Xeno AI Bot": xeno_ai_bot,
    "Xeno UI Dev": xeno_ui_dev,
    "Xeno Director": xeno_director,
    "Xeno Narrator": xeno_narrator,
    "Xeno Writer": xeno_writer,
    "Xeno Lore": xeno_lore,
    "Xeno Artist": xeno_artist,
    "Xeno Tech Art": xeno_tech_art,
    "Xeno Audio": xeno_audio,
    "Xeno Sound": xeno_sound,
    "Xeno Level": xeno_level,
    "Xeno Balance": xeno_balance,
    "Xeno QA": xeno_qa,
    "Xeno Tester": xeno_tester,
    "Xeno DevOps": xeno_devops,
}

# --- 📘 Facebook Agents ---

fb_commander = Agent(
    role='FB Commander (Facebook Strategist)',
    goal='วางกลยุทธ์ภาพรวม Facebook Page กำหนดทิศทางคอนเทนต์และ KPI ทั้งหมด',
    backstory='ผู้เชี่ยวชาญ Facebook Marketing ที่บริหาร Page ให้เติบโตอย่างยั่งยืน ตอบเป็นภาษาไทย',
    llm=my_llm, verbose=True, tools=fb_tools
)

fb_planner = Agent(
    role='FB Planner (Content Calendar)',
    goal='วางแผน content calendar รายสัปดาห์และรายเดือน ให้ post ออกตรงเวลาและสม่ำเสมอ',
    backstory='นักวางแผนคอนเทนต์ที่จัดตาราง post ให้ครอบคลุมทุก objective และ audience ตอบเป็นภาษาไทย',
    llm=my_llm, verbose=True, tools=fb_tools
)

fb_writer = Agent(
    role='FB Writer (Post Copywriter)',
    goal='เขียน Facebook post caption ภาษาไทยที่ตรงกับ tone ที่กำหนด ออกมาเป็น caption พร้อมโพสต์ทันที ไม่ถามเพิ่ม ไม่อธิบาย',
    backstory="""คุณคือ Copywriter มืออาชีพสาย Facebook ที่เชี่ยวชาญ content framework 10 แบบ:

- Educational: ให้ความรู้ มีโครงสร้าง Hook→ข้อมูล→CTA
- Storytelling: เล่าเรื่องแบบเพื่อนเล่าให้เพื่อนฟัง ภาษาพูด กันเอง เหมือนคุยใน LINE ไม่มีศัพท์ทางการ เช่น "วันนั้นแกเดินเข้ามาร้าน..." หรือ "ไม่น่าเชื่อเลยนะ..." มีจุดหักมุมเล็กๆ แล้วจบด้วยความรู้สึก
- Case Study: ยกตัวอย่างลูกค้าจริง ก่อน→หลัง ผลลัพธ์ชัดเจน
- Lifestyle: สื่อถึงความรู้สึก ภาพชีวิต อารมณ์ดี ไม่ขายตรง
- Emotional: กระทบใจ ใช้ความรู้สึก ความภูมิใจ ความห่วงใย
- Direct Sales: พูดถึงสินค้าตรงๆ ราคา โปรโมชั่น ข้อดี CTA ชัด
- Hard Sell: สร้างแรงกดดัน urgency สูง "อย่าพลาด" "วันนี้เท่านั้น"
- FOMO: กลัวพลาด "คนอื่นเขาทำแล้ว" "เหลือน้อย" "หมดแล้วหมดเลย"
- Trust: สร้างความน่าเชื่อถือ ประสบการณ์ ความเชี่ยวชาญ การรับรอง
- Social Proof: รีวิวลูกค้า ยอดผู้ใช้ รางวัล ความนิยม

สไตล์ภาษา: เขียนแบบคนไทยคุยกันเอง ภาษาพูด ไม่เป็นทางการ ใช้คำว่า "เลย" "นะ" "แบบ" "อ่ะ" "ก็" ได้ตามธรรมชาติ
ห้ามใช้ภาษาโฆษณาเก่า เช่น "รีบจองด่วน!" "อย่ารอช้า!" "สุดพิเศษ!" — ให้ฟังดูเป็นมนุษย์

กฎเหล็ก: รับ Tone และเรื่องที่ต้องการ → เขียน caption ออกมาเลย 1 โพสต์
ห้ามถาม ห้ามอธิบาย ห้ามใส่หัวข้อ ตอบเป็น caption ภาษาไทยพร้อม emoji เท่านั้น
ท้าย caption ทุกโพสต์ต้องมี hashtag #kudosดัดดิจิตอลอันดับ1 #kudosthecircle และ ภาษาไทย + อังกฤษที่เกี่ยวข้อง 5-8 อัน เช่น #ผมสวย #KUDOShair #ดัดดิจิตอล""",
    llm=my_llm, verbose=True, tools=fb_tools
)

fb_visual = Agent(
    role='FB Visual (Graphic Direction)',
    goal='กำกับทิศทางภาพ, thumbnail และ infographic ให้สอดคล้องกับ brand และดึงดูด feed',
    backstory='Art director ที่เชี่ยวชาญ Facebook visual format ทั้ง feed, story และ cover ตอบเป็นภาษาไทย',
    llm=my_llm, verbose=True, tools=fb_tools
)

fb_video = Agent(
    role='FB Video (Reels & Video)',
    goal='สร้าง concept วิดีโอ Reels และ Facebook Video ที่ทำให้ reach และ engagement พุ่ง',
    backstory='Video strategist ที่รู้ algorithm Facebook Video และสร้าง hook ที่ทำให้คนดูจนจบ ตอบเป็นภาษาไทย',
    llm=my_llm, verbose=True, tools=fb_tools
)

fb_ads = Agent(
    role='FB Ads (Ad Specialist)',
    goal='ออกแบบ Facebook Ads campaign ตั้งแต่ creative จนถึง conversion ให้ได้ ROAS สูงสุด',
    backstory='Facebook Ads specialist ที่บริหาร campaign ได้ทุกระดับ awareness ถึง conversion ตอบเป็นภาษาไทย',
    llm=my_llm, verbose=True, tools=fb_tools
)

fb_targeting = Agent(
    role='FB Targeting (Audience Segmentation)',
    goal='วิเคราะห์และสร้าง custom audience, lookalike และ retargeting strategy ที่แม่นยำ',
    backstory='ผู้เชี่ยวชาญ Facebook Pixel และ Audience Insights ที่หา target ที่ใช่ได้เสมอ ตอบเป็นภาษาไทย',
    llm=my_llm, verbose=True, tools=fb_tools
)

fb_boost = Agent(
    role='FB Boost (Budget Optimizer)',
    goal='บริหาร ad budget ให้ได้ ROI สูงสุด scale campaign ที่ work และหยุด campaign ที่ไม่ work',
    backstory='นัก optimize ที่อ่าน Facebook Ads Manager ได้ทะลุปรุโปร่งและตัดสินใจจาก data ตอบเป็นภาษาไทย',
    llm=my_llm, verbose=True, tools=fb_tools
)

fb_community = Agent(
    role='FB Community (Community Manager)',
    goal='ตอบ comment, DM บริหาร community ให้ active, positive และสร้าง brand loyalty',
    backstory='Community manager ที่เปลี่ยน follower เป็น fan และจัดการ crisis ได้อย่างมืออาชีพ ตอบเป็นภาษาไทย',
    llm=my_llm, verbose=True, tools=fb_tools
)

fb_influencer = Agent(
    role='FB Influencer (Collab & KOL)',
    goal='วางแผน KOL collaboration, influencer seeding และ partnership ที่ตรง brand',
    backstory='ผู้เชี่ยวชาญ influencer marketing ที่รู้จัก KOL ทุกระดับและวัดผลได้จริง ตอบเป็นภาษาไทย',
    llm=my_llm, verbose=True, tools=fb_tools
)

fb_insights = Agent(
    role='FB Insights (Data Analyst)',
    goal='วิเคราะห์ Facebook Insights, reach, engagement rate และ conversion funnel',
    backstory='Data analyst ที่แปล Facebook metrics ให้เป็น actionable insights สำหรับทีม ตอบเป็นภาษาไทย',
    llm=my_llm, verbose=True, tools=fb_tools
)

fb_reporter = Agent(
    role='FB Reporter (Performance Report)',
    goal='สรุป weekly/monthly performance report และแนะนำ action items จาก data',
    backstory='Reporting specialist ที่สร้าง dashboard และ report ที่อ่านง่ายและนำไปใช้ได้ทันที ตอบเป็นภาษาไทย',
    llm=my_llm, verbose=True, tools=fb_tools
)

facebook_agent_map = {
    "FB Commander": fb_commander,
    "FB Planner": fb_planner,
    "FB Writer": fb_writer,
    "FB Visual": fb_visual,
    "FB Video": fb_video,
    "FB Ads": fb_ads,
    "FB Targeting": fb_targeting,
    "FB Boost": fb_boost,
    "FB Community": fb_community,
    "FB Influencer": fb_influencer,
    "FB Insights": fb_insights,
    "FB Reporter": fb_reporter,
}

# --- 🔍 Route (เหมือนเดิม) ---
@app.get("/get-logs")
async def get_logs():
    if os.path.exists('mission_logs.json'):
        with open('mission_logs.json', 'r', encoding='utf-8') as f:
            return json.load(f)
    return []

@app.post("/ask-agent")
async def ask_agent(data: dict):
    user_command = data.get("command")
    selected_agent_name = data.get("agent")

    active_agent = game_agent_map.get(selected_agent_name, xeno_producer)

    task = Task(
        description=f"คำสั่ง: {user_command}. ปฏิบัติงานในฐานะ {selected_agent_name}",
        expected_output="คำตอบที่ชัดเจน นำไปใช้ได้จริง เป็นภาษาไทย",
        agent=active_agent
    )

    crew = Crew(
        agents=[active_agent],
        tasks=[task],
        process=Process.sequential
    )

    result = crew.kickoff()
    save_mission_log(selected_agent_name, user_command, result)

    return {"result": str(result)}

@app.post("/ask-facebook")
async def ask_facebook(data: dict):
    user_command = data.get("command")
    selected_agent_name = data.get("agent")

    active_agent = facebook_agent_map.get(selected_agent_name, fb_commander)

    task = Task(
        description=f"คำสั่ง: {user_command}. ปฏิบัติงานในฐานะ {selected_agent_name}",
        expected_output="คำตอบที่ชัดเจน นำไปใช้ได้จริง เป็นภาษาไทย",
        agent=active_agent
    )

    crew = Crew(
        agents=[active_agent],
        tasks=[task],
        process=Process.sequential
    )

    result = crew.kickoff()
    save_mission_log(selected_agent_name, user_command, result)

    return {"result": str(result)}

@app.post("/ask-xeno")
async def ask_xeno(data: dict):
    user_command = data.get("command")
    selected_agent_name = data.get("agent")
    
    # ดึง Agent จาก map (ถ้าหาไม่เจอให้ใช้ Commander เป็น default)
    active_agent = agent_map.get(selected_agent_name, commander)

    task = Task(
        description=f"คำสั่งจาก Commander: {user_command}. โปรดปฏิบัติงานในฐานะ {selected_agent_name}",
        expected_output="คำตอบที่ชัดเจน คมชัด และนำไปใช้ได้จริงในรูปแบบภาษาไทย",
        agent=active_agent
    )

    crew = Crew(
        agents=[active_agent],
        tasks=[task],
        process=Process.sequential
    )

    result = crew.kickoff()
    save_mission_log(selected_agent_name, user_command, result)
    
    return {"result": str(result)}

openai_client = OpenAI(api_key=os.environ.get("OPENAI_API_KEY"))

@app.post("/generate-image")
async def generate_image(data: dict):
    prompt = data.get("prompt", "")
    if not prompt:
        return {"error": "กรุณาใส่ prompt"}
    try:
        response = openai_client.images.generate(
            model="dall-e-3",
            prompt=prompt,
            size="1024x1024",
            quality="standard",
            n=1,
        )
        image_url = response.data[0].url
        return {"image_url": image_url, "message": "สร้างรูปสำเร็จ"}
    except Exception as e:
        return {"error": str(e)}

game_process = None

@app.post("/run-game")
async def run_game():
    global game_process
    import subprocess

    if game_process and game_process.poll() is None:
        game_process.terminate()
        game_process = None
        return {"running": False, "message": "หยุดเกมแล้ว"}

    game_exe = os.environ.get("GAME_EXE_PATH", "")
    if not game_exe or not os.path.exists(game_exe):
        return {"running": False, "message": "❌ ไม่พบไฟล์เกม — กรุณาตั้งค่า GAME_EXE_PATH ใน environment variable"}

    game_process = subprocess.Popen([game_exe])
    return {"running": True, "message": f"เปิดเกมแล้ว: {os.path.basename(game_exe)}"}

# --- 📘 Facebook: AI เลือกรูป + เขียน Caption อัตโนมัติ ---
@app.post("/fb-smart-post")
async def fb_smart_post(data: dict):
    import anthropic as anthropic_sdk

    folder_link = data.get("folder_link", "").strip()
    prompt = data.get("prompt", "").strip() or "เลือกรูปที่สวยและเหมาะกับการโพสต์ Facebook"

    # 1. Extract folder ID
    match = re.search(r'/folders/([a-zA-Z0-9_-]+)', folder_link)
    if not match:
        return {"error": "ลิ้งก์ไม่ถูกต้อง — ควรเป็น https://drive.google.com/drive/folders/..."}
    folder_id = match.group(1)

    # 2. Fetch images from Drive
    api_key = os.environ.get("GOOGLE_DRIVE_API_KEY", "")
    params = {
        "q": f"'{folder_id}' in parents and mimeType contains 'image/' and trashed = false",
        "fields": "files(id,name,mimeType)",
        "pageSize": 20,
        "key": api_key,
    }
    drive_resp = requests.get("https://www.googleapis.com/drive/v3/files", params=params)
    drive_data = drive_resp.json()
    if "error" in drive_data:
        return {"error": drive_data["error"].get("message", "ดึงรูปไม่สำเร็จ")}
    files = drive_data.get("files", [])
    if not files:
        return {"error": "ไม่พบรูปใน folder"}

    # 3. Filter out used images
    used_file = USED_IMAGES_FILE
    used_log = []
    if os.path.exists(used_file):
        try:
            with open(used_file, "r", encoding="utf-8") as f:
                used_log = json.load(f)
        except (json.JSONDecodeError, IOError):
            used_log = []

    # รองรับ format เก่า (list of str)
    if used_log and isinstance(used_log[0], str):
        used_log = [{"id": i, "name": "", "date": ""} for i in used_log]

    used_ids = [e["id"] for e in used_log]
    available = [f for f in files if f["id"] not in used_ids]
    if not available:
        available = files
        used_log = []
        used_ids = []

    # 4. ส่ง thumbnail ให้ Claude Vision เลือกรูปที่ดีที่สุด
    client = anthropic_sdk.Anthropic(api_key=os.environ.get("ANTHROPIC_API_KEY"))
    content = []
    valid_images = []

    for img in available[:8]:
        thumbnail_url = f"https://drive.google.com/thumbnail?id={img['id']}&sz=w400"
        try:
            img_resp = requests.get(thumbnail_url, timeout=10)
            if img_resp.status_code == 200:
                import base64
                img_b64 = base64.b64encode(img_resp.content).decode("utf-8")
                content.append({
                    "type": "image",
                    "source": {"type": "base64", "media_type": "image/jpeg", "data": img_b64}
                })
                content.append({"type": "text", "text": f"[รูปที่ {len(valid_images)+1} | ID: {img['id']} | ชื่อ: {img['name']}]"})
                valid_images.append(img)
        except Exception:
            continue

    if not valid_images:
        return {"error": "ไม่สามารถโหลด thumbnail ได้ — ตรวจสอบว่า folder เป็น Public"}

    content.append({
        "type": "text",
        "text": f"""จากรูปทั้งหมดนี้ กรุณา:
1. เลือก 1 รูปที่สวยและเหมาะสมที่สุดสำหรับโพสต์ Facebook ของร้านทำผม
2. เขียน caption ภาษาไทยที่น่าสนใจ กระชับ มี emoji เหมาะสม

คำสั่งเพิ่มเติม: {prompt}

ตอบเป็น JSON เท่านั้น ไม่มีข้อความอื่น:
{{"selected_id": "ID ของรูปที่เลือก", "reason": "เหตุผลสั้นๆ", "caption": "caption ที่เขียน"}}"""
    })

    ai_resp = client.messages.create(
        model="claude-sonnet-4-6",
        max_tokens=1024,
        messages=[{"role": "user", "content": content}]
    )

    # 5. Parse JSON จาก AI
    raw_text = ai_resp.content[0].text
    json_match = re.search(r'\{.*\}', raw_text, re.DOTALL)
    if not json_match:
        return {"error": f"AI ตอบในรูปแบบที่ไม่ถูกต้อง: {raw_text[:200]}"}

    result_data = json.loads(json_match.group())
    selected_id = result_data.get("selected_id", "")
    selected_img = next((f for f in valid_images if f["id"] == selected_id), valid_images[0])

    # 6. บันทึก id + name + date
    used_log.append({
        "id": selected_img["id"],
        "name": selected_img.get("name", ""),
        "date": datetime.now().strftime("%d %b %Y %H:%M"),
    })
    with open(used_file, "w", encoding="utf-8") as f:
        json.dump(used_log, f, indent=2, ensure_ascii=False)

    return {
        "selected_id": selected_img["id"],
        "preview_url": f"https://drive.google.com/thumbnail?id={selected_img['id']}&sz=w400",
        "caption": result_data.get("caption", ""),
        "reason": result_data.get("reason", ""),
        "remaining": len(available) - 1,
    }


# --- 📘 Facebook: ดูประวัติรูปที่เคยใช้แล้ว ---
@app.get("/fb-used-images")
async def fb_used_images():
    used_file = USED_IMAGES_FILE
    if not os.path.exists(used_file):
        return []
    try:
        with open(used_file, "r", encoding="utf-8") as f:
            data = json.load(f)
        if data and isinstance(data[0], str):
            return [{"id": i, "name": "", "date": ""} for i in data]
        return data
    except (json.JSONDecodeError, IOError):
        return []


# --- 📘 Facebook: ลบรูปออกจากประวัติ ---
@app.post("/fb-delete-used-image")
async def fb_delete_used_image(data: dict):
    image_id = data.get("id", "")
    used_file = USED_IMAGES_FILE
    if not os.path.exists(used_file):
        return {"success": False, "error": "ไม่พบไฟล์"}
    try:
        with open(used_file, "r", encoding="utf-8") as f:
            entries = json.load(f)
        if entries and isinstance(entries[0], str):
            entries = [{"id": i, "name": "", "date": ""} for i in entries]
        entries = [e for e in entries if e["id"] != image_id]
        with open(used_file, "w", encoding="utf-8") as f:
            json.dump(entries, f, indent=2, ensure_ascii=False)
        return {"success": True}
    except (json.JSONDecodeError, IOError) as e:
        return {"success": False, "error": str(e)}


# --- 📘 Facebook: ดึงรูปจาก Google Drive Folder ---
@app.post("/fb-drive-images")
async def fb_drive_images(data: dict):
    folder_link = data.get("folder_link", "").strip()

    match = re.search(r'/folders/([a-zA-Z0-9_-]+)', folder_link)
    if not match:
        return {"error": "ลิ้งก์ไม่ถูกต้อง — ควรเป็น https://drive.google.com/drive/folders/..."}
    folder_id = match.group(1)

    api_key = os.environ.get("GOOGLE_DRIVE_API_KEY", "")
    if not api_key or api_key == "ใส่ Google API Key ที่นี่":
        return {"error": "ไม่พบ GOOGLE_DRIVE_API_KEY ใน .env"}

    # ดึงรูป
    image_params = {
        "q": f"'{folder_id}' in parents and mimeType contains 'image/' and trashed = false",
        "fields": "files(id,name,mimeType)",
        "pageSize": 50,
        "key": api_key,
    }
    image_resp = requests.get("https://www.googleapis.com/drive/v3/files", params=image_params)
    image_result = image_resp.json()
    if "error" in image_result:
        return {"error": image_result["error"].get("message", "ดึงรูปไม่สำเร็จ")}

    files = image_result.get("files", [])
    for f in files:
        f["previewUrl"] = f"https://drive.google.com/thumbnail?id={f['id']}&sz=w400"

    # ดึง subfolder
    folder_params = {
        "q": f"'{folder_id}' in parents and mimeType = 'application/vnd.google-apps.folder' and trashed = false",
        "fields": "files(id,name)",
        "pageSize": 50,
        "key": api_key,
    }
    folder_resp = requests.get("https://www.googleapis.com/drive/v3/files", params=folder_params)
    folder_result = folder_resp.json()
    folders = folder_result.get("files", [])
    for folder in folders:
        folder["folderLink"] = f"https://drive.google.com/drive/folders/{folder['id']}"

    return {"files": files, "folders": folders}


# --- 📘 Facebook: โพสต์ขึ้น Page ---
@app.post("/fb-post")
async def fb_post(data: dict):
    from datetime import timezone
    caption = data.get("caption", "").strip()
    footer = data.get("footer", "").strip()
    import json as _json
    file_ids_raw = data.get("file_ids")
    file_ids = _json.loads(file_ids_raw) if file_ids_raw else []
    scheduled_time = data.get("scheduled_time", "").strip()  # ISO string e.g. "2026-03-31T15:00"

    page_id = os.environ.get("FB_PAGE_ID")
    access_token = os.environ.get("FB_PAGE_ACCESS_TOKEN")

    if not page_id or not access_token:
        return {"success": False, "error": "ไม่พบ FB_PAGE_ID หรือ FB_PAGE_ACCESS_TOKEN ใน .env"}

    full_message = f"{caption}\n\n{footer}".strip() if footer else caption

    # --- ตั้งเวลา: แปลง ISO → Unix timestamp ---
    scheduled_unix = None
    if scheduled_time:
        try:
            dt = datetime.fromisoformat(scheduled_time)
            # ถ้าไม่มี timezone info ให้ถือว่าเป็น local time แล้วแปลงเป็น UTC
            if dt.tzinfo is None:
                dt = dt.astimezone(timezone.utc)
            scheduled_unix = int(dt.timestamp())
            min_time = int(datetime.now(timezone.utc).timestamp()) + 600  # 10 นาทีขึ้นไป
            if scheduled_unix < min_time:
                return {"success": False, "error": "เวลาที่ตั้งต้องห่างจากปัจจุบันอย่างน้อย 10 นาที"}
        except ValueError:
            return {"success": False, "error": "รูปแบบเวลาไม่ถูกต้อง"}

    if file_ids:
        # อัปโหลดรูปทุกใบแบบ unpublished ก่อน
        photo_ids = []
        for fid in file_ids:
            image_url = f"https://drive.google.com/uc?export=download&id={fid}"
            image_resp = requests.get(image_url, timeout=30)
            if image_resp.status_code != 200:
                return {"success": False, "error": f"ดาวน์โหลดรูป {fid} ไม่สำเร็จ"}
            upload_resp = requests.post(
                f"https://graph.facebook.com/v19.0/{page_id}/photos",
                data={"published": "false", "access_token": access_token},
                files={"source": ("image.jpg", image_resp.content, "image/jpeg")},
            )
            upload_data = upload_resp.json()
            if "id" not in upload_data:
                return {"success": False, "error": upload_data.get("error", {}).get("message", "อัปโหลดรูปไม่สำเร็จ")}
            photo_ids.append({"media_fbid": upload_data["id"]})

        post_data = {
            "message": full_message,
            "attached_media": _json.dumps(photo_ids),
            "access_token": access_token,
        }
        if scheduled_unix:
            post_data["published"] = "false"
            post_data["scheduled_publish_time"] = str(scheduled_unix)

        resp = requests.post(
            f"https://graph.facebook.com/v19.0/{page_id}/feed",
            data=post_data,
        )
    else:
        post_data = {"message": full_message, "access_token": access_token}
        if scheduled_unix:
            post_data["published"] = "false"
            post_data["scheduled_publish_time"] = str(scheduled_unix)

        url = f"https://graph.facebook.com/v19.0/{page_id}/feed"
        resp = requests.post(url, data=post_data)

    result = resp.json()
    if "id" in result:
        if scheduled_unix:
            dt_str = datetime.fromisoformat(scheduled_time).strftime("%d/%m/%Y %H:%M")
            return {"success": True, "post_id": result["id"], "message": f"ตั้งเวลาโพสต์สำเร็จ! จะโพสต์วันที่ {dt_str}"}
        return {"success": True, "post_id": result["id"], "message": "โพสต์สำเร็จแล้ว!"}
    fb_error = result.get("error", {})
    error_msg = fb_error.get("message") or fb_error.get("error_user_msg") or str(result)
    return {"success": False, "error": f"Facebook: {error_msg}"}


@app.get("/marketing-stats")
async def marketing_stats():
    page_id = os.environ.get("FB_PAGE_ID")
    token = os.environ.get("FB_PAGE_ACCESS_TOKEN")
    if not page_id or not token:
        return {"error": "ไม่พบ FB_PAGE_ID หรือ FB_PAGE_ACCESS_TOKEN"}

    # ข้อมูลพื้นฐานเพจ
    page_resp = requests.get(
        f"https://graph.facebook.com/v19.0/{page_id}",
        params={"fields": "name,fan_count,followers_count", "access_token": token}
    ).json()

    # Insights 7 วัน
    insights_resp = requests.get(
        f"https://graph.facebook.com/v19.0/{page_id}/insights",
        params={
            "metric": "page_impressions,page_engaged_users,page_post_engagements",
            "period": "week",
            "access_token": token
        }
    ).json()

    # โพสต์ล่าสุด 20 อัน (เอามาจัดอันดับ)
    posts_resp = requests.get(
        f"https://graph.facebook.com/v19.0/{page_id}/posts",
        params={
            "fields": "id,message,created_time,permalink_url,likes.summary(true),comments.summary(true),shares,insights.metric(post_impressions_unique){values}",
            "limit": 20,
            "access_token": token
        }
    ).json()

    # แปลง insights เป็น dict
    insights = {}
    for item in insights_resp.get("data", []):
        key = item.get("name")
        values = item.get("values", [])
        insights[key] = values[-1].get("value", 0) if values else 0

    return {
        "page": page_resp,
        "insights": insights,
        "posts": posts_resp.get("data", [])
    }


# --- 🔐 Auth Endpoints ---
@app.post("/login")
async def login(data: dict):
    username = data.get("username", "").strip()
    password = data.get("password", "").strip()
    user = authenticate_user(username, password)
    if not user:
        raise HTTPException(status_code=401, detail="ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง")
    token = create_token(user["username"], user["role"])
    return {"token": token, "username": user["username"], "role": user["role"]}

@app.get("/me")
async def me(current_user: dict = Depends(get_current_user)):
    return current_user


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=5000)