---
name: frontend-design
description: Design and build distinctive, production-grade frontend UI for the KUDOS dashboard. Use when adding new pages, components, or redesigning existing UI. Avoids generic AI aesthetics — creates intentional, characterful interfaces matching the dark terminal style of the dashboard.
---

# Frontend Design

สำหรับสร้าง UI component, หน้าใหม่, หรือปรับ design ใน KUDOS dashboard

## Design Context

Dashboard นี้ใช้ aesthetic แบบ **dark terminal / command center** โทนหลักคือ:
- Background: `#08080f` (dark mode) / `#f1f5f9` (light mode)
- Font: `Courier New` monospace
- Accent: ตาม system ที่เลือก (Facebook = #1877F2, Marketing = #f59e0b, GameDev = #7c3aed)
- Cards: `bg-white/[0.02]` border `border-white/5`
- Text ขนาดเล็ก uppercase tracking-widest สำหรับ labels

## ก่อนเขียนโค้ด ต้องถามตัวเอง

1. **วัตถุประสงค์** — หน้า/component นี้แก้ปัญหาอะไร?
2. **Aesthetic direction** — สอดคล้องกับ dark terminal style หรือเปล่า?
3. **Mobile?** — dashboard ใช้บน desktop เป็นหลัก แต่ responsive ด้วย
4. **State** — loading / empty / error / success ครบไหม?

## มาตรฐานการเขียน

**Typography**
- Labels: `text-[8px] uppercase tracking-widest`
- Values: `text-xl font-black` หรือ `text-3xl font-black`
- Body: `text-[10px] text-slate-400`

**Buttons**
- Primary: solid color + `font-black text-[9px] uppercase tracking-widest rounded-xl`
- Secondary: `bg-white/[0.04] border border-white/10`
- States: `disabled:opacity-30 transition-all`

**Cards / Sections**
- `rounded-2xl border border-white/5 bg-white/[0.02] p-5`
- Header bar ซ้าย: `w-1 h-4 rounded-full` สี accent

**Colors**
- ใช้ CSS variables: `var(--bg-main)`, `var(--text-main)`, `var(--border-main)`
- ห้าม hardcode `bg-[#08080f]` หรือ `text-white` ใหม่ — ให้ใช้ CSS vars แทน (รองรับ dark/light mode)

**Animations**
- Loading: `animate-pulse` บน placeholder text
- Transitions: `transition-all` บนปุ่มทุกตัว

## สิ่งที่ต้องหลีกเลี่ยง

- ห้ามใช้ font ใหม่ที่ไม่ใช่ Courier New (ยกเว้น design ที่ตั้งใจแยก)
- ห้าม hardcode สีที่ทำให้ light mode พัง
- ห้ามลืม loading state และ error state
- ห้ามสร้าง component ที่ซ้ำกับที่มีอยู่แล้ว

## ก่อน output โค้ด

1. บอก layout ที่จะสร้างก่อน (1-2 ประโยค)
2. ถามว่า approve ไหม
3. เขียนโค้ด
4. ถาม "จะเพิ่มใน `page.tsx` บรรทัดไหนดีครับ?"
