# 03. Back-End + OpenAI 구현 명세

## 1. 책임
Node.js API endpoint `/api/analyze`가 다음 순서를 책임진다.

```text
Request
→ JSON 파싱
→ 입력 검증
→ OpenAI 호출
→ 구조화 출력 검증
→ Supabase 저장
→ Response
```

## 2. 환경변수
```text
OPENAI_API_KEY=
OPENAI_MODEL=
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
```

`OPENAI_MODEL`은 코드에 하드코딩하지 않는다.

## 3. API 키
OpenAI API key는 브라우저에 노출하면 안 된다. 서버에서 환경변수로 읽는다.

OpenAI 공식 문서에서도 클라이언트 환경에 API key를 배포하지 말고 서버를 통해 요청하라고 안내한다.

## 4. 입력 계약
Request:
```json
{
  "text": "string"
}
```

제약:
- text 필수
- 문자열이어야 함
- trim 후 1~2,000자

## 5. 프롬프트 정책
System/Developer 지시의 목적:
- 문장 전체의 전반적인 감성 분류
- 입력에 없는 사실을 만들지 않음
- reason은 입력 문장에 근거
- sentiment는 세 값 중 하나
- confidence는 0~100 정수
- JSON Schema를 반드시 준수

개발자가 프롬프트를 바꿀 경우 테스트 케이스를 다시 실행한다.

## 6. 구조화 출력
OpenAI Responses API에서 지원되는 JSON Schema 기반 Structured Outputs를 사용한다.

논리적 schema:
```json
{
  "type": "object",
  "properties": {
    "sentiment": {
      "type": "string",
      "enum": ["positive", "negative", "neutral"]
    },
    "confidence": {
      "type": "integer",
      "minimum": 0,
      "maximum": 100
    },
    "reasons": {
      "type": "array",
      "minItems": 1,
      "maxItems": 3,
      "items": { "type": "string" }
    }
  },
  "required": ["sentiment", "confidence", "reasons"],
  "additionalProperties": false
}
```

`strict` 구조화 출력을 지원하는 모델을 사용하는 경우 strict를 활성화한다.

## 7. 서버 검증
OpenAI 응답이 구조화되어 있어도 서버에서 다음을 검증한다.
- sentiment allow-list
- confidence integer
- confidence 0~100
- reasons array
- reasons 길이 1~3
- reason이 문자열인지
- 빈 reason 금지

검증 실패는 `AI_OUTPUT_INVALID`로 처리한다.

## 8. 신뢰도 표현 정책
`confidence=92`는 "이 분류를 모델이 얼마나 확신하는지"를 나타내는 값으로만 표시한다.

금지 문구:
- `정확도 92%`
- `92% 확실하게 맞습니다.`
- `의학적으로 92% 확률입니다.`

권장 문구:
- `모델 신뢰도 92%`
- `모델이 이 분류를 얼마나 확신하는지 나타내는 값입니다.`

## 9. 오류 매핑
- 400: 잘못된 입력
- 502: OpenAI 호출/응답 문제
- 500: 서버 내부 문제
- 저장 실패: 결과는 성공으로 처리할지 여부를 정책으로 고정해야 한다. MVP에서는 **분석 결과는 표시하고 `SAVE_FAILED` 경고를 별도로 반환**하는 방식을 권장한다.

## 10. Rate limit
MVP에서는 사용자 인증 없이 공개 endpoint가 되므로 남용 가능성이 있다.

최소 대응:
- 입력 길이 제한
- 요청 timeout
- 너무 큰 body 차단
- Vercel/플랫폼 레벨 rate limit 검토

별도 rate limiting 서비스 도입은 MVP 필수 기능으로 보지 않는다.

## 11. 참고
OpenAI 공식 JavaScript quickstart는 서버 측 JavaScript에서 공식 SDK를 사용하는 흐름을 제공한다. 실제 SDK 메서드와 모델 파라미터는 구현 시점의 공식 문서를 기준으로 확인한다.
