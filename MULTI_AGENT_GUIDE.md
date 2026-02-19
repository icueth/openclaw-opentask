# Multi-Agent Task Implementation Guide

## วิธีที่แนะนำ: Coordinator Pattern

ใช้ agent `coordinator` ควบคุม agent อื่นๆ

### ขั้นตอนการใช้งาน

#### 1. สร้าง Task หลัก
```bash
curl -X POST http://localhost:3000/api/projects/[id]/tasks \
  -H "Content-Type: application/json" \
  -d '{
    "title": "🎯 Multi-Agent: Build Full Stack App",
    "description": "สร้างแอพครบวงจรโดยทีม 3 คน",
    "agentId": "coordinator",
    "priority": "high"
  }'
```

#### 2. Coordinator Task Prompt
Coordinator จะได้รับ prompt นี้:

```markdown
## 🎯 YOU ARE THE COORDINATOR

คุณเป็นหัวหน้าทีม ต้องประสานงานกับลูกทีม 3 คน:

### 👥 ทีมของคุณ:
1. **Backend Developer (coder/Nova)**
   - หน้าที่: สร้าง REST API
   - Output: `/api` folder

2. **Frontend Developer (coder/Nova)**  
   - หน้าที่: สร้าง React UI
   - Output: `/frontend` folder
   - รอ Backend เสร็จก่อน

3. **DevOps Engineer (main/Omsin)**
   - หน้าที่: Setup Docker + Deploy
   - Output: `Dockerfile`, `docker-compose.yml`
   - รอ Backend + Frontend เสร็จก่อน

### 🔄 Workflow:
```
คุณ (Coordinator)
    ↓
Spawn Backend Agent → รอเสร็จ
    ↓
Spawn Frontend Agent → รอเสร็จ  
    ↓
Spawn DevOps Agent → รอเสร็จ
    ↓
รวมผลงาน + Report Complete
```

### 🛠️ Tools for Coordination:

#### 1. Spawn Sub-Agent
```
exec: {"command": "openclaw agent --agent coder --message 'สร้าง API...' --timeout 1800"}
```

#### 2. Create Sub-Task (ผ่าน API)
```
exec: {"command": "curl -X POST http://localhost:3000/api/projects/[id]/tasks -H 'Content-Type: application/json' -d '{...}'"}
```

#### 3. Check Progress
```
exec: {"command": "curl http://localhost:3000/api/projects/[id]/tasks/[subtask-id]"}
```

### ✅ Deliverables:
- [ ] Backend API ทำงานได้
- [ ] Frontend เชื่อมต่อ API ได้
- [ ] Dockerfile สำหรับ deploy
- [ ] เอกสารการใช้งาน

### 📊 Progress Reporting:
คุณต้อง report progress รวม:
- 25% - Backend started
- 50% - Backend done, Frontend started  
- 75% - Frontend done, DevOps started
- 100% - All done
```

### 3. ผลลัพธ์ที่ได้

```
Task: "Build Full Stack App" (coordinator)
  ├── Sub-Task 1: "Backend API" (coder) - Completed
  ├── Sub-Task 2: "Frontend UI" (coder) - Completed
  ├── Sub-Task 3: "DevOps Setup" (main) - Completed
  └── Result: รวมทั้งหมด
```

---

## 🔧 Implementation Checklist

### Phase 1: Basic Coordinator (ง่าย)
- [ ] สร้าง task ด้วย agent coordinator
- [ ] Coordinator spawn agents ผ่าน `exec` tool
- [ ] รอผลลัพธ์แล้ว report

### Phase 2: Sub-Task Tracking (กลาง)
- [ ] เพิ่ม `parentTaskId` ใน Task type
- [ ] สร้าง API list sub-tasks
- [ ] Dashboard แสดง task tree

### Phase 3: Parallel Execution (ยาก)
- [ ] แก้ไข taskQueue รองรับ parallel
- [ ] Dependency management (A รอ B เสร็จ)
- [ ] Auto-merge results

---

## 💡 ตัวอย่างใช้งานจริง

### Scenario: สร้างเว็บขายของ

**ลูกค้าต้องการ:**
- Backend API (Node.js + Database)
- Frontend (React)
- Mobile App (React Native)
- DevOps (Docker + CI/CD)

**วิธีทำ:**
1. สร้าง task หลัก → coordinator
2. Coordinator แบ่งเป็น 4 sub-tasks
3. รันพร้อมกัน (backend + frontend + mobile)
4. รอทั้ง 3 เสร็จ → ค่อยรัน devops
5. Report รวมกลับมา

**เวลาที่ใช้:**
- แบบเดิม (1 agent): ~2 ชม.
- แบบ Multi-Agent: ~40 นาที (parallel)

---

## 🚀 Quick Start

ต้องการให้ implement วิธีไหนก่อน?
1. **Coordinator Pattern** - ง่าย ใช้ได้เลย
2. **Sub-Task System** - ต้องแก้ backend
3. **Parallel Execution** - ต้องแก้ taskQueue

แนะนำเริ่มที่ **วิธี 1 (Coordinator)** ใช้ได้ทันทีโดยสร้าง task ด้วย agent coordinator!