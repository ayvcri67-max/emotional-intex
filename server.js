// ==============================================================================
// 로컬 개발 서버 (Express)
// 역할: static 프론트엔드 파일 제공 및 /api/analyze 요청 처리
// ==============================================================================

const express = require('express');
const path = require('path');
const analyzeHandler = require('./api/analyze');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// JSON 요청 본문 파싱 (최대 2,000자 텍스트 수용)
app.use(express.json());

// 정적 파일 제공 (index.html, style.css, app.js)
app.use(express.static(__dirname));

// /api/analyze API 라우터 등록
app.post('/api/analyze', analyzeHandler);

// 서버 구동
app.listen(PORT, () => {
  console.log(`==================================================`);
  console.log(`🚀 감성 분석 서버가 정상적으로 시작되었습니다!`);
  console.log(`🌐 접속 주소: http://localhost:${PORT}`);
  console.log(`==================================================`);
});
