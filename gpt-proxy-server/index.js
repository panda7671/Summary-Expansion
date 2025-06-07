// index.js
const express = require("express");
const cors = require("cors");
require("dotenv").config();
const { countTokens } = require("./gptTokenUtils");

const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));

const app = express();
app.use(cors());
app.use(express.json());

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

if (!OPENAI_API_KEY) {
  console.error('❌ OPENAI_API_KEY 환경 변수가 설정되지 않았습니다.');
  process.exit(1);
}

// ✅ 자동 재시도 함수 (429 Too Many Requests 시)
async function gptWithRetry(requestBody, retries = 2, delayMs = 2000) {
  const url = "https://api.openai.com/v1/chat/completions";

  for (let attempt = 0; attempt <= retries; attempt++) {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${OPENAI_API_KEY}`
      },
      body: JSON.stringify(requestBody)
    });

    if (res.status !== 429 || attempt === retries) {
      return res;
    }

    console.warn(`⏳ GPT API rate limit... 대기 후 재시도 (${attempt + 1})`);
    await new Promise(resolve => setTimeout(resolve, delayMs));
  }

  throw new Error("Too many retries (GPT rate limit)");
}

app.post("/gpt", async (req, res) => {
  const { prompt, summaryLength } = req.body;

  const systemPrompt = "너는 어떤 언어로 된 텍스트든 이해해서, 결과를 한국어로 정확하게 요약하고 퀴즈를 생성하는 AI 도우미야. 퀴즈는 반드시 요약된 내용 안에서 출제되어야 해.";
  const userPrompt = `
📄 다음 텍스트를 한국어로 ${summaryLength}로 요약하고, 퀴즈 3개를 만들어줘.

🧠 조건:
1. 요약은 핵심 정보만 포함.
2. 퀴즈는 요약 안에서 정답을 찾을 수 있도록 구성.
3. 퀴즈 형식 예:

문제 1: ...
보기:
1. ...
2. ...
3. ...
정답: (숫자)

4. 모든 출력은 한국어로.
5. 요약과 퀴즈는 구분해서 출력.

📜 원문:
"""${prompt}"""
`.trim();

  const totalPrompt = systemPrompt + userPrompt;
  const totalTokens = countTokens(totalPrompt, "gpt-4");

  if (totalTokens + 1000 > 8192) {
    return res.status(400).json({
      error: {
        message: `⚠️ 입력이 너무 깁니다. 총 ${totalTokens} 토큰이며, GPT-4는 8192 토큰까지만 지원합니다.\n\n텍스트를 더 짧게 선택해주세요.`
      }
    });
  }

  const requestBody = {
    model: "gpt-4",
    max_tokens: 1000,
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt }
    ]
  };

  try {
    const response = await gptWithRetry(requestBody, 2); // 최대 2회 재시도
    const data = await response.json();
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: { message: err.message } });
  }
});

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`🚀 GPT 프록시 서버 실행 중: http://localhost:${PORT}`);
});
