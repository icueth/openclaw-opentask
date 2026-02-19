# Daemon Agent Pattern สำหรับ Task Processing

## แนวคิด

```
Dashboard → sessions_send → Daemon Agent (รันตลอด) → subagents spawn → Worker Agents
```

## สถาปัตยกรรม

### 1. Daemon Agent (Long-running)
- รันเป็น OpenClaw agent ตลอดเวลา
- คอยรับ message ผ่าน `sessions_send`
- เมื่อได้รับ task จะใช้ `subagents spawn` เพื่อสร้าง worker

### 2. Dashboard
- ใช้ `sessions_send` ส่ง task ไปหา Daemon Agent
- หรือใช้ API `/api/sessions_send` ผ่าน Gateway

### 3. Worker Agents
- ถูก spawn โดย Daemon Agent ผ่าน `subagents spawn`
- ทำงานจริง แล้ว announce ผลกลับ

## ข้อดี

✅ ใช้ `subagents` tool ได้จริง (เพราะรันภายใต้ OpenClaw agent)
✅ มี session isolation
✅ มี announce อัตโนมัติ
✅ รองรับ nested sub-agents

## ข้อควรระวัง

⚠️ ต้องมี Daemon Agent รันอยู่ตลอดเวลา
⚠️ ต้องรู้ `sessionKey` ของ Daemon Agent
⚠️ ซับซ้อนกว่าวิธี CLI ธรรมดา

## การทดสอบ

### Step 1: รัน Daemon Agent
```bash
openclaw agent --agent coordinator --message "Run as daemon and listen for tasks"
```

### Step 2: ส่ง Task จาก Dashboard
```bash
curl -X POST http://localhost:18789/api/sessions_send \
  -H "Content-Type: application/json" \
  -d '{
    "sessionKey": "agent:coordinator:main",
    "message": "Spawn worker for task-123: Create a React component"
  }'
```

### Step 3: Daemon Agent จะทำ
1. รับ message
2. ใช้ `subagents spawn` สร้าง worker
3. Worker ทำงานและ announce กลับ

## สรุป

วิธีนี้เป็นไปได้และใช้ OpenClaw Core ได้เต็มรูปแบบ แต่ต้องจัดการเรื่อง:
- Daemon Agent lifecycle (always-on)
- Session discovery (หา sessionKey)
- Error handling

ต้องการให้ implement แบบนี้ไหมครับ? หรืออยากให้ทดสอบแค่ proof-of-concept ก่อน?
