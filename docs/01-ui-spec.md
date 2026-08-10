# 01. UI/UX 상세 구현 명세

## 1. 디자인 원칙
첨부 참고 이미지의 구조적 특징을 가져오되, 기존 사이트를 복제하지 않는다.

### 핵심 키워드
- Minimal
- Editorial
- Spacious
- Rounded
- Pink accent
- Navy typography
- Card grid

## 2. 권장 색상 토큰
정확한 색상값은 구현 시 조정할 수 있으나 다음 범위를 사용한다.

```css
--bg: #ffffff;
--surface: #f7f7f9;
--text: #111126;
--muted: #77778a;
--border: #e8e8ef;
--accent: #ed4b8f;
--accent-soft: #fff0f6;
--success-soft: #eefbf4;
--warning-soft: #fff8e8;
--danger-soft: #fff0f0;
```

색상은 감성 의미를 보조할 뿐, 색상 하나만으로 정보를 전달하지 않는다.

## 3. 레이아웃
### Desktop
- 최대 콘텐츠 폭: 1180~1280px
- Header 높이: 약 64~72px
- Hero: 2열
- 입력/결과 영역: 중앙 정렬
- 카드 radius: 20~28px
- 섹션 간 여백: 64~96px

### Mobile
- 좌우 padding: 20px
- Hero 1열
- 카드 1열
- 헤더 메뉴는 축소
- 입력창 높이 180px 이상 권장

## 4. Header
왼쪽:
- 서비스 워드마크: `Sentio` 같은 임시 제품명 사용 가능

중앙/좌측 메뉴:
- Analyze
- Guide

오른쪽:
- `About`
- CTA 또는 빈 영역

MVP에서는 실제 로그인 기능을 만들지 않는다.

## 5. Hero
예시 카피:

**Make sense of your words.**

`AI가 문장의 전반적인 감성을 빠르게 분석해 드립니다.`

보조 chip:
- `Positive`
- `Negative`
- `Neutral`

CTA는 실제 기능인 입력 영역으로 자연스럽게 연결한다.

## 6. 분석 입력 카드
구성:
- 상단 작은 label: `TEXT ANALYSIS`
- textarea
- 글자 수
- 제출 버튼

Placeholder:
`분석하고 싶은 문장을 입력해 주세요.`

버튼:
`감성 분석하기`

버튼 상태:
- default
- hover
- disabled
- loading

## 7. 결과 카드
분석 전:
- 빈 상태 안내

분석 중:
- spinner 또는 skeleton
- `문장을 분석하고 있습니다...`

분석 후:
```text
ANALYSIS RESULT

POSITIVE

92%
Model confidence

Why?
• 긍정적인 평가 표현이 포함되어 있습니다.
• 만족을 나타내는 표현이 사용되었습니다.
```

한국어 UI라면:
- `긍정`
- `부정`
- `중립`
- `모델 신뢰도`
- `분석 이유`

## 8. 오류 UI
카드 안에 오류 영역을 배치한다.

예:
```text
분석을 완료하지 못했습니다.
잠시 후 다시 시도해 주세요.
[다시 시도]
```

개발용 오류 코드는 사용자 화면에 표시하지 않는다.

## 9. 반응형 기준
- 1280px 이상: 2열 Hero
- 768~1279px: 여백 축소, 2열 유지 가능
- 767px 이하: 1열
- 480px 이하: 버튼 full width

## 10. 접근성
- 모든 input/textarea에 label
- focus ring 유지
- `aria-live="polite"`로 결과 영역 갱신
- 오류 영역은 `role="alert"`
- 버튼 텍스트가 기능을 설명해야 함

## 11. 금지
- 참고 이미지의 로고/사진/문구 복사
- 의미 없는 장식용 carousel
- MVP와 무관한 카드 여러 개 추가
- 감성별 색만 보고 판단하도록 설계
