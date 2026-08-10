# 06. 테스트 및 검수 기준

## 1. 테스트 전략
MVP는 다음 네 단계로 검증한다.

1. 입력 검증
2. API 계약 검증
3. AI 결과 구조 검증
4. 실제 E2E 검증

AI의 "정답" 자체를 100% 보장하는 것이 목표가 아니다. 대신 **정해진 계약을 지키고, 결과를 오해하지 않게 표시하며, 실패를 정상적으로 처리하는 것**을 검수한다.

## 2. 수동 테스트 케이스

| ID | 입력/상황 | 기대 결과 |
|---|---|---|
| T01 | 긍정 문장 | positive 결과 표시 |
| T02 | 부정 문장 | negative 결과 표시 |
| T03 | 사실 전달 문장 | neutral 결과 표시 |
| T04 | 빈 문자열 | 입력 오류 표시, API 호출 없음 |
| T05 | 공백만 입력 | 입력 오류 표시 |
| T06 | 2,000자 | 요청 가능 |
| T07 | 2,001자 | API 호출 없이 길이 오류 |
| T08 | OpenAI 실패 | 사용자 오류 표시 |
| T09 | AI 구조화 출력 실패 | 결과 미표시 + 오류 |
| T10 | Supabase 실패 | 결과 표시 + 저장 실패 경고 |
| T11 | 네트워크 끊김 | 재시도 가능한 오류 |
| T12 | 모바일 375px | 가로 스크롤 없이 사용 가능 |
| T13 | 키보드만 사용 | 입력/제출 가능 |
| T14 | 빠른 연속 클릭 | 중복 요청 방지 |
| T15 | API key 확인 | 브라우저에 노출되지 않음 |

## 3. API 계약 테스트
### 정상
```json
{
  "text": "정말 만족스러운 서비스였습니다."
}
```

### 실패
```json
{}
```

```json
{
  "text": ""
}
```

```json
{
  "text": " ... 2001 characters ..."
}
```

## 4. AI 출력 검증 테스트
다음은 모두 실패 처리되어야 한다.

```json
{
  "sentiment": "happy",
  "confidence": 90,
  "reasons": ["..."]
}
```

```json
{
  "sentiment": "positive",
  "confidence": 120,
  "reasons": ["..."]
}
```

```json
{
  "sentiment": "positive",
  "confidence": 90,
  "reasons": []
}
```

```json
{
  "sentiment": "positive",
  "confidence": "90",
  "reasons": ["..."]
}
```

## 5. UI 검수
### Desktop
- [ ] Header 정렬
- [ ] Hero 2열
- [ ] 입력 카드 중앙 정렬
- [ ] 결과 카드 시각적 우선순위
- [ ] 넓은 여백
- [ ] 핑크 accent
- [ ] pill/chip 스타일
- [ ] 카드 radius

### Mobile
- [ ] 1열
- [ ] 버튼 full width
- [ ] textarea 사용 가능
- [ ] 결과 카드 폭 맞음
- [ ] 가로 스크롤 없음

## 6. 보안 검수
- [ ] Git history에 key 없음
- [ ] `.env`가 gitignore에 포함
- [ ] browser source에 key 없음
- [ ] Network에서 OpenAI 직접 호출 없음
- [ ] service-role key가 클라이언트에 없음

## 7. 완료 기준
다음 조건을 모두 만족해야 "완료"다.

### 기능
- [ ] positive / negative / neutral 표시
- [ ] confidence % 표시
- [ ] reasons 표시
- [ ] 오류 메시지 표시
- [ ] Supabase 저장

### 품질
- [ ] 서버 검증 존재
- [ ] AI schema 검증 존재
- [ ] XSS 방지 렌더링
- [ ] loading/disabled 상태
- [ ] 모바일 대응

### 배포
- [ ] Vercel Production 배포 성공
- [ ] 환경변수 등록
- [ ] 실제 API E2E 성공

## 8. 검수자가 판단하지 않아도 되는 것
검수자는 특정 복합 문장의 감성 라벨이 "절대적으로 정답"인지 판단할 필요가 없다.

다만 다음은 반드시 확인한다.
- 명백한 positive/negative/neutral 예제가 정상적으로 처리되는가
- 출력 구조가 깨지지 않는가
- 오류를 숨기지 않는가
- confidence를 정확도로 오해시키지 않는가
- 이유가 입력 문장과 무관한 허구를 만들지 않는가

## 9. 회귀 테스트 규칙
다음 중 하나가 변경되면 T01~T15를 다시 실행한다.
- OpenAI 모델 변경
- 시스템 프롬프트 변경
- JSON schema 변경
- API endpoint 변경
- 결과 UI 변경
- DB schema 변경
