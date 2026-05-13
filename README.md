# 🌿 Carbon Platform — Backend

> PCF(Product Carbon Footprint) 탄소 발자국 추적 SaaS 플랫폼의 백엔드 API 서버

---

## 📌 과제 개요

제조사·물류사 등 기업 고객이 원소재·전기·운송 데이터를 Excel로 업로드하면,  
**GHG Protocol 기반 Scope별 탄소 배출량을 자동 계산**하고 시각화 대시보드에 제공합니다.

---

## 🧠 도메인 이해 — PCF & GHG Scope

### GHG Protocol Scope 분류

| Scope       | 정의                        | 이 시스템에서              |
| ----------- | --------------------------- | -------------------------- |
| **Scope 1** | 직접 배출 (자체 연료 연소)  | 연료 연소 활동             |
| **Scope 2** | 간접 배출 (구매 전기)       | 한국전력 전기 사용         |
| **Scope 3** | 가치사슬 배출 (원소재·운송) | 플라스틱 원소재, 트럭 운송 |

### PCF 계산 공식

```
배출량(kgCO₂e) = 활동량 × 배출계수(Emission Factor)
```

### 배출계수 (Emission Factors)

| 설명       | 계수  | 단위          | 출처 기준          |
| ---------- | ----- | ------------- | ------------------ |
| 한국전력   | 0.456 | kgCO₂e/kWh    | 한국 전력 배출계수 |
| 플라스틱 1 | 2.3   | kgCO₂e/kg     | LCA 데이터베이스   |
| 플라스틱 2 | 3.2   | kgCO₂e/kg     | LCA 데이터베이스   |
| 트럭 운송  | 3.5   | kgCO₂e/ton-km | 국토교통부 기준    |

---

## 🏗️ 시스템 설계

### 기술 스택

| 영역            | 기술                | 선택 이유                                        |
| --------------- | ------------------- | ------------------------------------------------ |
| Framework       | NestJS (TypeScript) | 모듈 기반 구조로 확장성·유지보수성 우수          |
| ORM             | Prisma              | 타입 안전성, 마이그레이션 관리 용이              |
| Database        | PostgreSQL          | 관계형 데이터(Upload↔EmissionRecord) 처리에 적합 |
| AI              | OpenAI GPT-4o       | 다국어 지원, 탄소 도메인 분석 품질 우수          |
| File Processing | xlsx                | 서버사이드 Excel 파싱, buffer 처리 지원          |

### 모듈 구조

```
src/
├── ai/                  # AI 인사이트 및 챗봇
│   ├── ai.controller.ts
│   ├── ai.service.ts
│   └── ai.module.ts
├── emissions/           # 배출량 조회 및 집계
│   ├── emissions.controller.ts
│   ├── emissions.service.ts
│   └── emissions.module.ts
├── upload/              # Excel 업로드 및 파일 관리
│   ├── upload.controller.ts
│   └── upload.module.ts
├── prisma/              # DB 연결
│   ├── prisma.service.ts
│   └── prisma.module.ts
└── main.ts
```

### 데이터베이스 스키마

```prisma
model Upload {
  id        Int              @id @default(autoincrement())
  fileName  String
  createdAt DateTime         @default(now())
  emissions EmissionRecord[]
}

model EmissionRecord {
  id             Int      @id @default(autoincrement())
  date           DateTime
  activityType   String
  description    String
  amount         Float
  unit           String
  emissionFactor Float
  emission       Float
  scope          String
  uploadId       Int?
  upload         Upload?  @relation(fields: [uploadId], references: [id])
  createdAt      DateTime @default(now())
}
```

### API 엔드포인트

| Method   | Endpoint                | 설명                                |
| -------- | ----------------------- | ----------------------------------- |
| `GET`    | `/upload`               | 업로드 파일 목록 조회               |
| `POST`   | `/upload/excel`         | Excel 파일 업로드 및 배출량 계산    |
| `DELETE` | `/upload/:id`           | 업로드 및 관련 배출 데이터 삭제     |
| `GET`    | `/emissions`            | 전체 배출 레코드 조회               |
| `GET`    | `/emissions?uploadId=1` | 특정 업로드 파일의 배출 데이터 조회 |
| `GET`    | `/emissions/summary`    | Scope별·월별·카테고리별 집계        |
| `POST`   | `/ai/insight`           | 배출 데이터 AI 분석 인사이트 생성   |
| `POST`   | `/ai/chat`              | AI 어시스턴트 대화                  |

---

## 🤖 AI 활용 방식

### 사용한 AI 도구

- **OpenAI GPT-4o** — 배출 데이터 분석 및 챗봇
- **Claude (Anthropic)** — 코드 작성 보조, 디버깅, 아키텍처 설계 검토

### AI 인사이트 Prompt 설계

```
You are a carbon footprint analyst. Analyze the following emission data
and provide a concise, actionable insight (2-3 sentences).
Focus on the biggest emission source and one concrete reduction recommendation.
Detect the language parameter and respond in that language.

Data: { totalEmission, scope1, scope2, scope3, byMonth, byCategory }
```

**설계 이유:**

- `Focus on the biggest emission source` — 실무자가 즉시 행동할 수 있는 정보 우선
- `language` 파라미터 — 브라우저 언어 감지로 다국어 지원 (Korean/English)
- 2-3 sentences 제한 — 경영자 대상 간결한 요약

### AI 챗봇 Prompt 설계

```
You are a carbon footprint assistant for a manufacturing company.
Detect the language of the user's message and respond in that same language only.
Current emission data: { totalEmission, scope2, scope3, byCategory }
Be concise, data-driven, and practical.
If asked something unrelated to carbon/emissions, politely redirect.
```

**설계 이유:**

- 실시간 배출 데이터를 context로 주입 — 실제 데이터 기반 답변
- 마지막 6개 메시지(3턴)만 context로 유지 — 토큰 비용 절감
- `politely redirect` — 탄소 도메인 외 질문 방지

---

## ⚖️ 설계 결정 및 Trade-off

### 1. Emission Factor — 하드코딩 vs DB 저장

|               | 하드코딩 (채택)                                                | DB 저장                 |
| ------------- | -------------------------------------------------------------- | ----------------------- |
| 장점          | 빠른 구현, 단순한 구조                                         | 관리자가 계수 수정 가능 |
| 단점          | 계수 변경 시 재배포 필요                                       | 추가 API, 관리 UI 필요  |
| **선택 이유** | MVP 단계에서 속도 우선, 향후 `EmissionFactor` 테이블 확장 예정 |

### 2. 중복 업로드 방지 — 파일명 기반

파일명이 같으면 재업로드를 차단합니다.

**Trade-off:** 파일명이 다르면 같은 내용도 업로드 가능.  
**이유:** 파일 해시 비교는 구현 복잡도가 높아 MVP에서 파일명 기반으로 단순화.

### 3. Chat Context — 최근 6개 메시지만 유지

전체 대화 기록 대신 최근 3턴(6메시지)만 GPT에 전달합니다.

**Trade-off:** 긴 대화에서 초반 맥락 손실 가능.  
**이유:** GPT-4o 토큰 비용 절감 및 응답 속도 향상.

### 4. NestJS 선택 이유

Express 대비 모듈 기반 구조로 `EmissionsModule`, `UploadModule`, `AiModule`을 독립적으로 개발·테스트 가능. TypeScript 네이티브 지원으로 타입 안전성 확보.

---

## 🚀 실행 방법

### 1. 의존성 설치

```bash
npm install
```

### 2. 환경변수 설정

프로젝트 루트에 `.env` 파일 생성:

```env
DATABASE_URL=postgresql://USER:PASSWORD@localhost:5432/carbon_platform
OPENAI_API_KEY=sk-...
```

### 3. 데이터베이스 설정

```bash
npx prisma migrate dev
npx prisma generate
```

### 4. 서버 실행

```bash
# 개발
npm run start:dev

# 프로덕션
npm run build
npm run start:prod
```

서버: `http://localhost:3002`

---

## 📊 Excel 파일 형식

업로드할 Excel 파일의 컬럼 구조:

| 컬럼명       | 설명      | 예시                         |
| ------------ | --------- | ---------------------------- |
| `일자(원본)` | 날짜      | 2025-01-01                   |
| `활동 유형`  | 활동 분류 | 전기 / 원소재 / 운송         |
| `설명`       | 세부 항목 | 한국전력 / 플라스틱 1 / 트럭 |
| `량`         | 사용량    | 110                          |
| `단위`       | 단위      | kWh / kg / ton-km            |

---

## 🔮 향후 개선 사항

- [ ] Emission Factor DB 관리 (관리자 UI)
- [ ] 파일 해시 기반 중복 감지
- [ ] Redis 캐싱 (summary 응답 속도 향상)
- [ ] JWT 인증 (다중 사용자 지원)
- [ ] 배출량 목표 설정 및 달성률 추적

```markdown
## ⏱️ 개발 기간

| 기간       | 작업 내용                                                   |
| ---------- | ----------------------------------------------------------- |
| 2026-05-12 | 프로젝트 초기화, Excel 업로드, 배출량 계산, PostgreSQL 연동 |
| 2026-05-13 | README 작성, .env 보안 처리                                 |
| 2026-05-14 | uploadId 필터링 (summary 엔드포인트)                        |

**총 개발 기간: 3일 / 실제 작업 시간: 약 4시간 (2026.05.12 ~ 2026.05.14)**
```
