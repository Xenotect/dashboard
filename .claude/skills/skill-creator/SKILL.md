---
name: skill-creator
description: Create new skills for the KUDOS dashboard project. Use when you want to automate a repeated workflow, create a shortcut command, or standardize how a task is done. Examples: "/fb-content" for generating Facebook posts, "/deploy" for deployment checklist, "/add-agent" for adding new AI agents.
---

# Skill Creator — KUDOS Dashboard

สร้าง skill ใหม่สำหรับ KUDOS dashboard โดยเฉพาะ

## โครงสร้าง Skill

```
.claude/skills/
└── skill-name/
    └── SKILL.md
```

## Template SKILL.md

```markdown
---
name: skill-name
description: อธิบายชัดๆ ว่าทำอะไร และใช้เมื่อไหร่ (สำคัญมาก — Claude ใช้อันนี้ตัดสินว่าจะ trigger หรือเปล่า)
---

# Skill Name

## วัตถุประสงค์
อธิบาย 1 ย่อหน้า

## ขั้นตอน
1. ...
2. ...
3. ...

## Output ที่คาดหวัง
...
```

## Skills ที่ควรสร้างสำหรับ KUDOS

| Skill | ประโยชน์ |
|-------|---------|
| `/fb-content` | Generate Facebook caption ตาม tone ที่เลือก |
| `/kudos-deploy` | Checklist ก่อน deploy (backend + frontend) |
| `/add-agent` | Template เพิ่ม Agent ใหม่ใน agents.py |
| `/ig-strategy` | วางแผน content IG รายสัปดาห์ |

## กฎการเขียน description ที่ดี

- ระบุ **trigger words** ชัดๆ เช่น "Use when user asks for Facebook caption"
- บอก **context** ที่ใช้ได้ เช่น "for KUDOS hair salon"
- ห้ามกำกวม — Claude จะ undertrigger ถ้า description ไม่ชัด

## ขั้นตอนสร้าง skill ใหม่

1. ถามว่า skill นี้จะทำอะไร
2. draft SKILL.md
3. ทดสอบโดย invoke `/skill-name`
4. ปรับ description ถ้า trigger ไม่ถูก
