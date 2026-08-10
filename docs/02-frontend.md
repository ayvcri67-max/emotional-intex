# 02. Front-End 구현 명세

## 1. 권장 파일 구조
```text
/
├─ public/
│  ├─ index.html
│  ├─ styles.css
│  └─ app.js
├─ api/
│  └─ analyze.js
├─ lib/
│  ├─ validation.js
│  ├─ openai.js
│  └─ supabase.js
├─ docs/
├─ AGENTS.md
├─ PRD.md
├─ package.json
└─ .env.example
```

Vercel의 Node.js 함수 규칙에 맞춰 실제 파일 구조는 구현 환경에 맞게 조정할 수 있으나, 책임 분리는 유지한다.

## 2. 상태
프론트 상태는 최소한 다음을 구분한다.
- `idle`
- `loading`
- `success`
- `error`

## 3. API 요청
```js
fetch("/api/analyze", {
  method: "POST",
  headers: {
    "Content-Type": "application/json"
  },
  body: JSON.stringify({ text })
});
```

## 4. 성공 응답 예
```json
{
  "success": true,
  "data": {
    "sentiment": "positive",
    "confidence": 92,
    "reasons": [
      "만족을 나타내는 표현이 포함되어 있습니다."
    ]
  }
}
```

## 5. 실패 응답 예
```json
{
  "success": false,
  "error": {
    "code": "INVALID_INPUT",
    "message": "분석할 텍스트를 입력해 주세요."
  }
}
```

`message`는 사용자에게 표시 가능한 문구만 사용한다.

## 6. 렌더링 규칙
- AI의 reason을 `innerHTML`로 삽입하지 않는다.
- `textContent` 또는 DOM API를 사용한다.
- 서버가 준 `sentiment`를 allow-list로 다시 확인한다.
- confidence는 숫자인지 확인하고 0~100으로 제한된 값만 표시한다.

## 7. UX
제출 시:
1. 버튼 disabled
2. 로딩 표시
3. 이전 오류 제거
4. 결과 영역에 로딩 상태 표시

완료 시:
1. 버튼 활성화
2. 결과 렌더링
3. 결과 영역으로 시각적 focus 이동 또는 scroll
4. 실패 시 입력값은 유지

## 8. 브라우저에서 하지 않는 일
- OpenAI API 직접 호출
- OpenAI API key 저장
- Supabase service-role key 사용
- DB에 임의 직접 쓰기

## 9. 프론트 검증
서버 검증과 중복되어도 다음을 수행한다.
- trim
- 빈 문자열
- 2,000자 제한

서버 검증이 최종 권한을 가진다.
