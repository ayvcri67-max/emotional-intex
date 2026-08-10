const express = require('express');
const path = require('path');
const analyzeHandler = require('./api/analyze');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

// public 폴더 정적 파일 제공
app.use(express.static(path.join(__dirname, 'public')));

// /api/analyze API 라우터
app.post('/api/analyze', analyzeHandler);

app.listen(PORT, () => {
  console.log(`==================================================`);
  console.log(`🚀 감성 분석 서버가 정상적으로 시작되었습니다!`);
  console.log(`🌐 접속 주소: http://localhost:${PORT}`);
  console.log(`==================================================`);
});
