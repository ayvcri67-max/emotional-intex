// ==============================================================================
// 프론트엔드 클라이언트 스크립트 (app.js)
// 역할: 입력 검증, /api/analyze 서버 통신, 상태별 UI 렌더링
// ==============================================================================

document.addEventListener('DOMContentLoaded', () => {
  // 1. DOM 요소 바인딩
  const analyzeForm = document.getElementById('analyzeForm');
  const inputText = document.getElementById('inputText');
  const charCount = document.getElementById('charCount');
  const submitBtn = document.getElementById('submitBtn');
  const btnText = submitBtn.querySelector('.btn-text');
  const btnLoader = submitBtn.querySelector('.btn-loader');
  const errorMessage = document.getElementById('errorMessage');
  const warningMessage = document.getElementById('warningMessage');

  const resultCard = document.getElementById('resultCard');
  const emptyResultState = document.getElementById('emptyResultState');
  const loadingResultState = document.getElementById('loadingResultState');
  const successResultState = document.getElementById('successResultState');

  const sentimentBadge = document.getElementById('sentimentBadge');
  const confidenceValue = document.getElementById('confidenceValue');
  const progressBarFill = document.getElementById('progressBarFill');
  const reasonsList = document.getElementById('reasonsList');

  // ----------------------------------------------------------------------------
  // 2. 입력 글자 수 카운팅 및 검증
  // ----------------------------------------------------------------------------
  inputText.addEventListener('input', () => {
    const currentLength = inputText.value.length;
    charCount.textContent = `${currentLength.toLocaleString()} / 2,000자`;

    if (currentLength > 2000) {
      charCount.style.color = '#ef4444'; // 초과 시 빨간색 경고
    } else {
      charCount.style.color = '#94a3b8';
    }

    // 입력 중 에러 메시지 초기화
    hideError();
  });

  // ----------------------------------------------------------------------------
  // 3. 감성 분석 폼 제출 이벤트
  // ----------------------------------------------------------------------------
  analyzeForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    // 입력값 앞뒤 공백 제거
    const textValue = inputText.value.trim();

    // 프론트엔드 1차 입력 검증
    if (!textValue) {
      showError('분석할 텍스트를 입력해 주세요.');
      inputText.focus();
      return;
    }

    if (textValue.length > 2000) {
      showError('텍스트는 2,000자 이내로 입력해 주세요.');
      return;
    }

    // 분석 시작: UI 상태 변경
    startLoading();

    try {
      // 서버 백엔드 API 호출
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text: textValue }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        // 백엔드 실패 응답 처리
        const errMsg = result.error?.message || '분석에 실패했습니다. 잠시 후 다시 시도해 주세요.';
        showError(errMsg);
        showEmptyState();
        return;
      }

      // 분석 성공 렌더링
      renderResult(result.data);

      // 경고(DB 저장 실패 등)가 포함된 경우
      if (result.warning) {
        showWarning(result.warning.message);
      } else {
        hideWarning();
      }

    } catch (err) {
      console.error('네트워크 에러:', err);
      showError('네트워크 오류가 발생했거나 서버에 연결할 수 없습니다. 잠시 후 다시 시도해 주세요.');
      showEmptyState();
    } finally {
      stopLoading();
    }
  });

  // ----------------------------------------------------------------------------
  // 4. UI 렌더링 헬퍼 함수
  // ----------------------------------------------------------------------------

  // 로딩 시작 UI
  function startLoading() {
    hideError();
    hideWarning();
    submitBtn.disabled = true;
    btnText.textContent = '분석 진행 중...';
    btnLoader.classList.remove('hidden');

    emptyResultState.classList.add('hidden');
    successResultState.classList.add('hidden');
    loadingResultState.classList.remove('hidden');
  }

  // 로딩 종료 UI
  function stopLoading() {
    submitBtn.disabled = false;
    btnText.textContent = '감성 분석하기';
    btnLoader.classList.add('hidden');
    loadingResultState.classList.add('hidden');
  }

  // 분석 결과 표시
  function renderResult(data) {
    const { sentiment, confidence, reasons } = data;

    // 감성 배지 렌더링 (영어 -> 한글 변환 및 색상 클래스 부여)
    sentimentBadge.className = 'sentiment-badge';
    if (sentiment === 'positive') {
      sentimentBadge.textContent = '😊 긍정 (Positive)';
      sentimentBadge.classList.add('sentiment-positive');
    } else if (sentiment === 'negative') {
      sentimentBadge.textContent = '🙁 부정 (Negative)';
      sentimentBadge.classList.add('sentiment-negative');
    } else {
      sentimentBadge.textContent = '😐 중립 (Neutral)';
      sentimentBadge.classList.add('sentiment-neutral');
    }

    // 신뢰도 퍼센트 및 프로그레스 바 렌더링
    const safeConfidence = Math.min(Math.max(confidence, 0), 100);
    confidenceValue.textContent = `${safeConfidence}%`;
    progressBarFill.style.width = `${safeConfidence}%`;

    // 이유 목록 렌더링 (보안 XSS 방지를 위해 textContent 전용 사용)
    reasonsList.innerHTML = '';
    if (Array.isArray(reasons)) {
      reasons.forEach((reason) => {
        const li = document.createElement('li');
        li.textContent = reason; // textContent 사용하여 안전하게 삽입
        reasonsList.appendChild(li);
      });
    }

    // 성공 카드 표시
    emptyResultState.classList.add('hidden');
    successResultState.classList.remove('hidden');
  }

  // 대기 상태 표시
  function showEmptyState() {
    emptyResultState.classList.remove('hidden');
    successResultState.classList.add('hidden');
  }

  // 에러 메시지 출력
  function showError(msg) {
    errorMessage.textContent = msg;
    errorMessage.classList.remove('hidden');
  }

  function hideError() {
    errorMessage.textContent = '';
    errorMessage.classList.add('hidden');
  }

  // 경고 메시지 출력
  function showWarning(msg) {
    warningMessage.textContent = msg;
    warningMessage.classList.remove('hidden');
  }

  function hideWarning() {
    warningMessage.textContent = '';
    warningMessage.classList.add('hidden');
  }
});
