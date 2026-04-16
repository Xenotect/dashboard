# COMMANDS — Xeno AI Agent Dashboard

> คู่มือคำสั่งและ reference สำหรับ KUDOS Dashboard
> อัปเดตล่าสุด: 2026-04-16

---

## 🚀 Dev Server

```bash
# Frontend (Next.js)
npm run dev
# → http://localhost:3000

# Backend (FastAPI)
uvicorn agents:app --reload --port 8000
# → http://localhost:8000

# Deploy to Railway + Vercel
git push origin master:main
```

---

## 🌐 API Endpoints

### Auth
| Method | Endpoint | คำอธิบาย |
|--------|----------|---------|
| `POST` | `/login` | Login รับ JWT token |
| `GET` | `/me` | ดึงข้อมูล user ปัจจุบัน |

### Facebook Posts
| Method | Endpoint | คำอธิบาย |
|--------|----------|---------|
| `POST` | `/fb-post` | โพสต์รูปจาก Google Drive ไป FB (+IG ได้) |
| `POST` | `/fb-post-local` | โพสต์รูปจากเครื่องไป FB (+IG ได้) |
| `POST` | `/fb-smart-post` | AI เลือกรูปที่ดีที่สุดแล้วโพสต์อัตโนมัติ |
| `POST` | `/fb-drive-images` | ดึงรูปจาก Google Drive folder |
| `GET` | `/fb-used-images` | ดูรูปที่เคยโพสต์ไปแล้ว |
| `POST` | `/fb-delete-used-image` | ลบรูปออกจาก used list |

### Facebook AI
| Method | Endpoint | คำอธิบาย |
|--------|----------|---------|
| `POST` | `/ask-facebook` | สั่งงาน FB Agent (FB Writer, Planner ฯลฯ) |
| `GET` | `/marketing-stats` | ดึง Page Insights + top posts |
| `GET` | `/fb-insights-analysis?days=7` | AI วิเคราะห์ Insights (admin only) |

### Xeno Agents
| Method | Endpoint | คำอธิบาย |
|--------|----------|---------|
| `POST` | `/ask-agent` | สั่งงาน KUDOS Agents (Commander, Gemini ฯลฯ) |
| `POST` | `/ask-xeno` | สั่งงาน Game Studio Agents |
| `POST` | `/generate-image` | Generate รูปด้วย AI |
| `POST` | `/run-game` | Run/Stop game dev server |
| `GET` | `/get-logs` | ดึง mission logs ทั้งหมด |

---

## 🤖 AI Agents

### KUDOS Agents (ใน `/ask-agent`)
| Agent | Role |
|-------|------|
| `Xeno Commander` | บริหารภาพรวม สั่งการทุกยูนิต |
| `Xeno Gemini` | วิจัยเทรนด์ หาไอเดียใหม่ |
| `Xeno Content` | สร้าง content marketing |
| `Xeno Image Scout` | คัดเลือกรูป คุมคุณภาพ |
| `Xeno Video Planner` | วางแผน video content |
| `Xeno Color & Mood` | คุม CI / brand tone |
| `Xeno Accountant` | วิเคราะห์การเงิน |
| `Xeno Booking Manager` | บริหารคิว |
| `Xeno Coder` | พัฒนาระบบ |
| `Xeno Auditor` | ตรวจสอบงาน |

### Facebook Agents (ใน `/ask-facebook`)
| Agent | Role |
|-------|------|
| `FB Commander` | วางกลยุทธ์ภาพรวม Page |
| `FB Planner` | content calendar |
| `FB Writer` | เขียน caption / copywriting |
| `FB Visual` | กำกับทิศทางภาพ |
| `FB Video` | Reels & video strategy |
| `FB Ads` | Facebook Ads specialist |
| `FB Targeting` | Audience segmentation |
| `FB Boost` | Budget optimizer |
| `FB Community` | จัดการ comment / DM |
| `FB Influencer` | KOL collaboration |
| `FB Insights` | วิเคราะห์ data |
| `FB Reporter` | สรุป performance report |

---

## ⚡ Claude Code Skills (พิมพ์ใน Claude Code)

| Command | คำอธิบาย |
|---------|---------|
| `/fb-content` | Generate Facebook caption สำหรับ KUDOS |
| `/frontend-design` | สร้าง UI component ใหม่ตาม style dashboard |
| `/webapp-testing` | Test dashboard ด้วย Playwright |
| `/skill-creator` | สร้าง skill ใหม่ |

---

## 🔑 Environment Variables (.env)

```env
# Facebook
FB_PAGE_ID=             # Facebook Page ID
FB_PAGE_ACCESS_TOKEN=   # Page Access Token (ไม่หมดอายุ)

# Instagram
IG_USER_ID=             # Instagram Business Account ID

# Google Drive
GOOGLE_DRIVE_API_KEY=   # สำหรับดึงรูปจาก Drive

# Auth
JWT_SECRET=             # Secret key สำหรับ JWT

# AI
ANTHROPIC_API_KEY=      # Claude API key
OPENAI_API_KEY=         # OpenAI API key (backup)
```

---

## 📁 ไฟล์หลัก

| ไฟล์ | หน้าที่ |
|------|---------|
| `agents.py` | Backend FastAPI + AI Agents ทั้งหมด |
| `src/app/page.tsx` | Frontend หน้าหลัก |
| `src/app/archive/page.tsx` | หน้า archive logs |
| `src/app/globals.css` | CSS variables dark/light mode |
| `used_images.json` | Log รูปที่โพสต์ไปแล้ว |
| `users.json` | User accounts |
| `mission_logs.json` | Log การสั่งงาน agents |
| `DEVLOG.md` | บันทึก session และ fix |

---

## 🚢 Deploy

```bash
# Push ทั้ง Railway (backend) และ Vercel (frontend)
git add agents.py src/app/page.tsx   # ระบุไฟล์ที่แก้
git commit -m "feat: ..."
git push origin master:main

# Railway ดู branch: main
# Vercel ดู branch: main
```

> ⚠️ `used_images.json` และ `.env` ห้าม commit
