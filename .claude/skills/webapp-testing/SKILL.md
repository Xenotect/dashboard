---
name: webapp-testing
description: Test the KUDOS dashboard web application using Playwright. Use when verifying new features work correctly, checking UI after changes, testing API endpoints, or doing regression testing before deploy. Covers both frontend (Next.js) and backend (FastAPI) testing.
---

# Web App Testing — KUDOS Dashboard

## Stack ที่ต้อง test

- **Frontend**: Next.js — `http://localhost:3000`
- **Backend**: FastAPI — `http://localhost:8000`

## Pattern หลัก: Reconnaissance → Action

**ห้าม** inspect DOM ก่อน network idle จะ query selector ผิด

```python
from playwright.sync_api import sync_playwright

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    page = browser.new_page()
    
    page.goto('http://localhost:3000')
    page.wait_for_load_state('networkidle')  # CRITICAL
    
    # ถึงตอนนี้ค่อย inspect
    page.screenshot(path='screenshot.png')
    browser.close()
```

## Login ก่อน test เสมอ

```python
# Login
page.goto('http://localhost:3000')
page.wait_for_load_state('networkidle')
page.fill('input[type="text"]', 'admin')
page.fill('input[type="password"]', 'your_password')
page.click('button[type="submit"]')
page.wait_for_load_state('networkidle')
```

## Test Cases หลักของ KUDOS dashboard

| Feature | สิ่งที่ต้อง verify |
|---------|-----------------|
| Login | redirect หลัง login สำเร็จ |
| FB Create Post | เลือกรูป → เขียน caption → โพสต์ → result message |
| Drive Images | โหลดรูปจาก Drive, pagination ทำงาน |
| Marketing tab | Refresh โหลด stats, AI Analyst section |
| Dark/Light mode | toggle แล้วสีเปลี่ยน, persist หลัง reload |
| Font size | เปลี่ยน font size, persist หลัง reload |

## Test API endpoints โดยตรง

```python
import requests

BASE = "http://localhost:8000"

# Login ก่อน
token = requests.post(f"{BASE}/login", 
    json={"username": "admin", "password": "xxx"}
).json()["token"]

headers = {"Authorization": f"Bearer {token}"}

# Test endpoint
resp = requests.get(f"{BASE}/marketing-stats", headers=headers)
assert resp.status_code == 200
assert "page" in resp.json()
```

## ขั้นตอนเมื่อเจอ bug

1. Screenshot ณ จุดที่ fail
2. Log console errors: `page.on('console', lambda msg: print(msg.text))`
3. Log network errors: `page.on('response', lambda r: print(r.status, r.url) if r.status >= 400 else None)`
4. บันทึกใน bug report
