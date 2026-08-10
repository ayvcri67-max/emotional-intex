document.addEventListener('DOMContentLoaded', () => {
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

  inputText.addEventListener('input', () => {
    const currentLength = inputText.value.length;
    charCount.textContent = `${currentLength.toLocaleString()} / 2,000자`;

    if (currentLength > 2000) {
      charCount.style.color = '#ef4444';
    } else {
      charCount.style.color = '#94a3b8';
    }

    hideError();
  });

  analyzeForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const textValue = inputText.value.trim();

    if (!textValue) {
      showError('분석할 텍스트를 입력해 주세요.');
      inputText.focus();
      return;
    }

    if (textValue.length > 2000) {
      showError('텍스트는 2,000자 이내로 입력해 주세요.');
      return;
    }

    startLoading();

    try {
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text: textValue }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        const errMsg = result.error?.message || '분석에 실패했습니다. 잠시 후 다시 시도해 주세요.';
        showError(errMsg);
        showEmptyState();
        return;
      }

      renderResult(result.data);

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

  function stopLoading() {
    submitBtn.disabled = false;
    btnText.textContent = '감성 분석하기';
    btnLoader.classList.add('hidden');
    loadingResultState.classList.add('hidden');
  }

  function renderResult(data) {
    const { sentiment, confidence, reasons } = data;

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

    const safeConfidence = Math.min(Math.max(confidence, 0), 100);
    confidenceValue.textContent = `${safeConfidence}%`;
    progressBarFill.style.width = `${safeConfidence}%`;

    reasonsList.innerHTML = '';
    if (Array.isArray(reasons)) {
      reasons.forEach((reason) => {
        const li = document.createElement('li');
        li.textContent = reason;
        reasonsList.appendChild(li);
      });
    }

    emptyResultState.classList.add('hidden');
    successResultState.classList.remove('hidden');
  }

  function showEmptyState() {
    emptyResultState.classList.remove('hidden');
    successResultState.classList.add('hidden');
  }

  function showError(msg) {
    errorMessage.textContent = msg;
    errorMessage.classList.remove('hidden');
  }

  function hideError() {
    errorMessage.textContent = '';
    errorMessage.classList.add('hidden');
  }

  function showWarning(msg) {
    warningMessage.textContent = msg;
    warningMessage.classList.remove('hidden');
  }

  function hideWarning() {
    warningMessage.textContent = '';
    warningMessage.classList.add('hidden');
  }
});
