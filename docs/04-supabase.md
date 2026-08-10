# 04. Supabase DB 구현 명세

## 1. 목적
성공한 감성 분석 결과를 저장한다.

## 2. 테이블
테이블명: `sentiment_analyses`

| 컬럼 | 타입 | 필수 | 설명 |
|---|---|---:|---|
| id | uuid | O | primary key |
| input_text | text | O | 사용자가 입력한 원문 |
| sentiment | text | O | positive/negative/neutral |
| confidence | integer | O | 0~100 |
| reasons | jsonb | O | 문자열 배열 |
| created_at | timestamptz | O | 생성 시각 |

## 3. 권장 SQL
```sql
create extension if not exists pgcrypto;

create table if not exists public.sentiment_analyses (
  id uuid primary key default gen_random_uuid(),
  input_text text not null,
  sentiment text not null check (sentiment in ('positive', 'negative', 'neutral')),
  confidence integer not null check (confidence between 0 and 100),
  reasons jsonb not null,
  created_at timestamptz not null default now()
);

alter table public.sentiment_analyses enable row level security;
```

## 4. 저장 책임
MVP에서는 서버 API가 DB 저장을 담당한다.

권장:
- 서버에서 Supabase client 생성
- service role key는 서버 환경변수
- service role key를 브라우저로 보내지 않음

Supabase 공식 문서에서도 서버/클라이언트 환경에 맞는 `supabase-js` 사용 방식과 RLS/권한 설정을 확인할 수 있다.

## 5. 저장 전 검증
다음 조건을 만족하지 않으면 저장하지 않는다.
- input_text 1~2,000자
- sentiment allow-list
- confidence 0~100
- reasons 1~3개

## 6. 개인정보/로그
MVP는 로그인 없는 서비스이므로 입력 텍스트에 개인정보가 포함될 수 있다는 사실을 사용자에게 안내할 수 있다.

서버 로그에 원문 전체를 남기지 않는다.

## 7. 실패 처리
DB 저장이 실패해도 분석 API의 사용자 경험을 무조건 실패로 만들 필요는 없다.

권장 응답:
```json
{
  "success": true,
  "data": {
    "sentiment": "positive",
    "confidence": 92,
    "reasons": ["..."]
  },
  "warning": {
    "code": "SAVE_FAILED",
    "message": "분석은 완료되었지만 결과 저장에 실패했습니다."
  }
}
```

단, 저장 실패를 성공으로 숨기면 안 된다.

## 8. RLS
향후 사용자 계정 기능을 추가할 경우 user_id를 도입하고 사용자별 정책을 만든다.

MVP에서는 공개 클라이언트가 테이블에 직접 접근하지 않도록 서버 저장을 우선한다.

## 9. 검증 기준
Supabase dashboard 또는 SQL로 다음을 확인한다.
- 분석 요청 1회 → row 1개 생성
- sentiment 값이 세 값 외에 저장되지 않음
- confidence가 범위를 벗어나지 않음
- reasons가 JSON array로 저장됨
