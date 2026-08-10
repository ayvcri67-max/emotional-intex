# 05. Vercel 배포 및 운영 명세

## 1. 배포 구조
```text
Vercel
├─ Static Front-End
│  ├─ index.html
│  ├─ styles.css
│  └─ app.js
│
└─ Node.js Serverless Function
   └─ /api/analyze
        ├─ OpenAI
        └─ Supabase
```

## 2. 환경변수
Vercel Project Settings → Environment Variables에 다음을 등록한다.

```text
OPENAI_API_KEY
OPENAI_MODEL
SUPABASE_URL
SUPABASE_SERVICE_ROLE_KEY
```

각 값은 Production / Preview / Development 중 필요한 환경에 정확히 등록한다.

## 3. Git 보안
`.gitignore` 예:
```text
node_modules/
.env
.env.local
.vercel
```

절대로 저장소에 다음을 커밋하지 않는다.
- OpenAI API key
- Supabase service-role key
- 실제 운영 데이터

## 4. 배포 전 체크
- `npm install`
- `npm run test`
- `npm run build`가 프로젝트에 존재한다면 실행
- 로컬 API 호출 확인
- Supabase 저장 확인
- 환경변수 확인

## 5. Vercel 배포 후 체크
1. 페이지가 열리는가?
2. 입력창이 표시되는가?
3. positive 문장 분석이 되는가?
4. negative 문장 분석이 되는가?
5. neutral 문장 분석이 되는가?
6. confidence가 표시되는가?
7. reasons가 표시되는가?
8. 오류 메시지가 표시되는가?
9. Supabase row가 생성되는가?
10. 브라우저에서 OpenAI key가 보이지 않는가?

## 6. 네트워크 확인
Chrome DevTools → Network에서 다음을 확인한다.
- 브라우저 → `/api/analyze` 요청은 존재
- 브라우저 → `api.openai.com` 직접 요청은 없어야 함
- 응답에 `OPENAI_API_KEY`가 포함되지 않아야 함

## 7. 운영 제한
MVP는 공개 endpoint이므로 비용 통제가 중요하다.
- 입력 길이 제한
- 요청 timeout
- 필요하면 Vercel/외부 rate limit 추가
- OpenAI 프로젝트별 사용량 모니터링

## 8. 모델 변경
모델을 바꾸면 다음을 다시 검증한다.
- JSON schema 호환
- 한국어 분석 품질
- confidence 값의 의미
- 비용/응답시간
- 테스트 케이스

모델명은 문서 작성 시 임의로 "최신 모델"이라고 고정하지 않는다. 배포 시점의 공식 OpenAI 문서를 확인한다.
