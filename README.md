# ARCO Careers (아르코 채용) — 포트폴리오 데모

가상의 에듀테크 기업 **아르코에듀(ARCO Edu)** 의 채용 사이트 + 사내 HR 콘솔(ATS)을 구현한 Next.js 포트폴리오 데모입니다.
**모든 회사·공고·지원자 데이터는 가상이며**, 별도 백엔드 없이 브라우저(localStorage)에만 저장되는 로컬 데모 모드로 동작합니다.

- **컨셉**: *Grow Faster, Work Smarter* — Editorial Luxury × 코퍼레이트 클린
- **브랜드 컬러**: `#52B3D8` (스카이블루) + 네이비차콜 `#0E1B24`
- **구성**: 지원자 사이트(`/`) + HR 콘솔(`/hr`) + 외부 포털(면접관/필기시험)

## 기술 스택

- Next.js 16 (App Router, Turbopack) · React 19 · TypeScript
- Tailwind CSS v4 (`@theme` 토큰, `tailwind.config.js` 없음)
- motion(framer-motion) · lucide-react
- react-hook-form · zod (입사지원 폼)

## 시작하기

```bash
npm install
npm run dev      # http://localhost:3000
npm run build    # 프로덕션 빌드
```

`.env.local` 없이 실행하면 로컬 데모 모드(목업 데이터 + localStorage)로 동작합니다.

## 구조

```
src/
├─ app/                 # 라우트 (App Router)
│  ├─ (site)/           # 지원자 사이트 (채용공고/입사지원/피플/회사소개/FAQ)
│  ├─ (hr)/hr/          # HR 콘솔 (파이프라인/공고/일정/평가/설정)
│  └─ (external)/       # 면접관 포털 · 온라인 필기시험 · 평가룸
├─ components/          # UI 프리미티브 · 모션 · 레이아웃 · 섹션
└─ lib/
   ├─ data/             # 데모용 가상 데이터 (공고/직무/연혁/FAQ 등)
   ├─ hr/               # HR 콘솔 도메인 (store/seed/mail 목업)
   ├─ provider.ts       # RecruitProvider (Mock → 실백엔드 교체 지점)
   └─ types.ts
```

> 🧪 이 브랜치(`demo`)는 공개 포트폴리오 데모용으로, 실존 기업·인물·주소·연락처와 무관합니다.
