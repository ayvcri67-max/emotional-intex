// ==============================================================================
// 백엔드 API 엔드포인트: /api/analyze
// 역할: 사용자 입력 검증 -> OpenAI API 감성 분석 호출 -> 스키마 검증 -> Supabase DB 저장
// ==============================================================================

const { OpenAI } = require('openai');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// ------------------------------------------------------------------------------
// 1. 환경변수 확인 및 클라이언트 초기화
// ------------------------------------------------------------------------------
const openaiApiKey = process.env.OPENAI_API_KEY;
const openaiModel = process.env.OPENAI_MODEL || 'gpt-4o-mini';
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// OpenAI 클라이언트 생성 (API 키는 서버에서만 안전하게 사용됩니다)
const openai = new OpenAI({
  apiKey: openaiApiKey || 'DUMMY_KEY_FOR_INIT', // 키 미설정 시 요청 단계에서 에러 처리
});

// Supabase 서버용 클라이언트 생성 (Service Role Key로 서버 저장소에 접근)
let supabase = null;
if (supabaseUrl && supabaseServiceRoleKey && supabaseUrl !== 'your_supabase_url_here') {
  supabase = createClient(supabaseUrl, supabaseServiceRoleKey);
}

// ------------------------------------------------------------------------------
// 2. OpenAI 구조화 출력(Structured Output)용 JSON 스키마 정의
// ------------------------------------------------------------------------------
const sentimentResponseSchema = {
  type: 'object',
  properties: {
    sentiment: {
      type: 'string',
      enum: ['positive', 'negative', 'neutral'],
      description: '문장의 전반적인 감성 분류 (positive, negative, neutral 중 하나)',
    },
    confidence: {
      type: 'integer',
      minimum: 0,
      maximum: 100,
      description: '모델이 해당 분류를 확신하는 정도 (0~100 정수 퍼센트)',
    },
    reasons: {
      type: 'array',
      minItems: 1,
      maxItems: 3,
      items: {
        type: 'string',
      },
      description: '입력 문장에 근거한 1~3개의 짧고 구체적인 판단 이유',
    },
  },
  required: ['sentiment', 'confidence', 'reasons'],
  additionalProperties: false,
};

// ------------------------------------------------------------------------------
// 3. 메인 분석 처리 핸들러 함수
// ------------------------------------------------------------------------------
async function analyzeHandler(req, res) {
  try {
    // --------------------------------------------------------------------------
    // Step A. 입력값 검증 (Front-End와 별개로 서버 단 2차 입력 검증)
    // --------------------------------------------------------------------------
    const { text } = req.body || {};

    if (!text || typeof text !== 'string') {
      return res.status(400).json({
        success: false,
        error: {
          code: 'EMPTY_INPUT',
          message: '분석할 텍스트를 입력해 주세요.',
        },
      });
    }

    // 앞뒤 공백 제거 (trim)
    const trimmedText = text.trim();

    if (trimmedText.length === 0) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'EMPTY_INPUT',
          message: '분석할 텍스트를 입력해 주세요.',
        },
      });
    }

    if (trimmedText.length > 2000) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'TEXT_TOO_LONG',
          message: '텍스트는 2,000자 이내로 입력해 주세요.',
        },
      });
    }

    // API 키 설정 검사
    if (!openaiApiKey || openaiApiKey === 'your_openai_api_key_here') {
      return res.status(500).json({
        success: false,
        error: {
          code: 'SERVER_CONFIG_ERROR',
          message: '.env 파일에 올바른 OPENAI_API_KEY를 설정해 주세요.',
        },
      });
    }

    // --------------------------------------------------------------------------
    // Step B. OpenAI API 호출 (Structured Outputs 이용)
    // --------------------------------------------------------------------------
    let aiResponse;
    try {
      aiResponse = await openai.chat.completions.create({
        model: openaiModel,
        messages: [
          {
            role: 'system',
            content: `당신은 텍스트 감성 분석 전문가입니다. 
제공된 입력 문장의 전반적인 정서적 방향을 정확하게 판단하여 감성(positive, negative, neutral), 모델 신뢰도(0~100%), 판단 이유(1~3개)를 JSON 형식으로 반환하세요.
- 입력 문장에 실제로 나타난 단어와 표현만 근거로 삼으세요.
- 입력에 존재하지 않는 정보나 상상을 덧붙이지 마세요.`,
          },
          {
            role: 'user',
            content: trimmedText,
          },
        ],
        response_format: {
          type: 'json_schema',
          json_schema: {
            name: 'sentiment_analysis_result',
            strict: true,
            schema: sentimentResponseSchema,
          },
        },
        temperature: 0.2, // 명확하고 일관된 판단을 위해 온도를 낮춤
      });
    } catch (openaiErr) {
      console.error('OpenAI API 호출 에러:', openaiErr.message);
      return res.status(502).json({
        success: false,
        error: {
          code: 'AI_API_ERROR',
          message: '분석에 실패했습니다. 잠시 후 다시 시도해 주세요.',
        },
      });
    }

    // --------------------------------------------------------------------------
    // Step C. AI 응답 파싱 및 서버 측 구조/스키마 2차 검증
    // --------------------------------------------------------------------------
    let parsedData;
    try {
      const rawContent = aiResponse.choices[0].message.content;
      parsedData = JSON.parse(rawContent);
    } catch (parseErr) {
      console.error('AI 응답 파싱 에러:', parseErr);
      return res.status(502).json({
        success: false,
        error: {
          code: 'AI_OUTPUT_INVALID',
          message: '분석 결과를 확인하지 못했습니다. 다시 시도해 주세요.',
        },
      });
    }

    const { sentiment, confidence, reasons } = parsedData;

    // 서버 단 스키마 엄격 검증
    const validSentiments = ['positive', 'negative', 'neutral'];
    const isValidSentiment = validSentiments.includes(sentiment);
    const isValidConfidence = Number.isInteger(confidence) && confidence >= 0 && confidence <= 100;
    const isValidReasons = Array.isArray(reasons) && reasons.length >= 1 && reasons.length <= 3 && reasons.every(r => typeof r === 'string' && r.trim().length > 0);

    if (!isValidSentiment || !isValidConfidence || !isValidReasons) {
      console.error('AI 검증 실패 데이터:', parsedData);
      return res.status(502).json({
        success: false,
        error: {
          code: 'AI_OUTPUT_INVALID',
          message: '분석 결과를 확인하지 못했습니다. 다시 시도해 주세요.',
        },
      });
    }

    // --------------------------------------------------------------------------
    // Step D. Supabase DB 저장 (실패 시에도 경고 메시지와 함께 분석 결과 반환)
    // --------------------------------------------------------------------------
    let saveFailed = false;

    if (supabase) {
      try {
        const { error: dbError } = await supabase
          .from('sentiment_analyses')
          .insert([
            {
              input_text: trimmedText,
              sentiment: sentiment,
              confidence: confidence,
              reasons: reasons,
            },
          ]);

        if (dbError) {
          console.error('Supabase DB 저장 실패:', dbError.message);
          saveFailed = true;
        }
      } catch (dbEx) {
        console.error('Supabase 예외 발생:', dbEx.message);
        saveFailed = true;
      }
    } else {
      // Supabase 설정이 아직 안 되어 있는 경우
      saveFailed = true;
    }

    // --------------------------------------------------------------------------
    // Step E. 최종 최종 결과 응답 반환
    // --------------------------------------------------------------------------
    const responsePayload = {
      success: true,
      data: {
        sentiment,
        confidence,
        reasons,
      },
    };

    // DB 저장 실패 시 사용자 안내용 경고 메시지 동시 제공 (PRD.md FR-06 준수)
    if (saveFailed) {
      responsePayload.warning = {
        code: 'SAVE_FAILED',
        message: '분석은 완료되었지만 결과 저장에 실패했습니다.',
      };
    }

    return res.status(200).json(responsePayload);

  } catch (err) {
    console.error('서버 내부 에러:', err);
    return res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: '서버 내부 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.',
      },
    });
  }
}

module.exports = analyzeHandler;
