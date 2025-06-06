const { encoding_for_model } = require("tiktoken");

/**
 * 단일 문자열의 토큰 수 계산
 * @param {string} text - 텍스트 입력
 * @param {string} model - 모델 이름 (예: "gpt-4")
 * @returns {number} - 토큰 수 (실패 시 0)
 */
function countTokens(text, model = "gpt-4") {
  try {
    const encoding = encoding_for_model(model);
    const tokens = encoding.encode(text);
    return tokens.length;
  } catch (error) {
    console.error(`[countTokens] 토큰 계산 실패 (모델: ${model}):`, error.message);
    return 0;
  }
}

/**
 * Chat API용 messages 배열의 전체 토큰 수 계산
 * @param {Array} messages - [{ role: "system", content: "..." }, ... ]
 * @param {string} model - 모델 이름 (예: "gpt-4")
 * @returns {number} - 토큰 수 (실패 시 0)
 */
function countMessagesTokens(messages, model = "gpt-4") {
  try {
    const encoding = encoding_for_model(model);
    let tokens = 0;

    for (const message of messages) {
      tokens += 4; // 역할/구조 토큰
      for (const [key, value] of Object.entries(message)) {
        tokens += encoding.encode(value).length;
      }
    }

    tokens += 2; // assistant 응답용 마무리 토큰
    return tokens;
  } catch (error) {
    console.error(`[countMessagesTokens] 메시지 토큰 계산 실패 (모델: ${model}):`, error.message);
    return 0;
  }
}

module.exports = {
  countTokens,
  countMessagesTokens
};
