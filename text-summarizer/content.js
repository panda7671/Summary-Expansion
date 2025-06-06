chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "summarizeAndQuiz") {
    const selectedText = request.text;
    const summaryLength = request.length || "3~5줄";

    // 전체 메시지 계산용 프롬프트 구성
    const systemPrompt = "너는 어떤 언어로 된 텍스트든 이해해서, 결과를 한국어로 정확하게 요약하고 퀴즈를 생성하는 AI 도우미야. 퀴즈는 반드시 요약된 내용 안에서 출제되어야 해.";
    const userPromptPrefix = `
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
"""`;

    const fullMessage = systemPrompt + userPromptPrefix + selectedText + `"""`;

    // 토큰 수 계산 함수 (간단 추정치)
    function estimateTokens(text) {
      return Math.ceil(text.length / 3.5);
    }

    const estimatedPromptTokens = estimateTokens(fullMessage);
    const estimatedCompletionTokens = 1000;
    const totalEstimatedTokens = estimatedPromptTokens + estimatedCompletionTokens;

    if (totalEstimatedTokens > 8192) {
      showGptPanel(
        `⚠️ 선택한 텍스트가 너무 깁니다.\n\n현재 예상 토큰 수: ${totalEstimatedTokens} (프롬프트 ${estimatedPromptTokens} + 응답 1000)\n\nGPT-4는 최대 8192 토큰까지 지원하므로 텍스트를 더 짧게 선택해주세요.`
      );
      return;
    }

    // ✅ 로딩 표시 먼저
    showGptPanel("⏳ 요약 및 문제를 생성하는 중입니다...\n잠시만 기다려주세요.");

    // ✅ GPT 프록시 서버 호출
    fetch("http://localhost:3000/gpt", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        prompt: selectedText,
        summaryLength
      })
    })
      .then(res => res.json())
      .then(data => {
        console.log("🧠 GPT 응답 전체:", data);

        if (data.choices && data.choices.length > 0) {
          const gptResponse = data.choices[0].message.content;
          chrome.storage.local.set({ gptResult: gptResponse });
          showGptPanel(gptResponse);
        } else if (data.error) {
          showGptPanel("❌ GPT 오류: " + (data.error.message || JSON.stringify(data.error)));
        } else {
          showGptPanel("❌ 알 수 없는 GPT 응답 오류입니다.");
        }
      })
      .catch(err => {
        showGptPanel("❌ 서버 연결 실패: " + err.message);
      });
  }
});
// 👉 GPT 결과를 오른쪽에 표시하는 함수
function showGptPanel(content) {
  const old = document.getElementById("gpt-summary-panel");
  if (old) old.remove();

  const panel = document.createElement("div");
  panel.id = "gpt-summary-panel";
  panel.style.position = "fixed";
  panel.style.top = "50px";
  panel.style.right = "20px";
  panel.style.width = "350px";
  panel.style.maxHeight = "80vh";
  panel.style.overflowY = "auto";
  panel.style.zIndex = "999999";
  panel.style.background = "#fff";
  panel.style.border = "1px solid #ccc";
  panel.style.boxShadow = "0 0 10px rgba(0,0,0,0.2)";
  panel.style.padding = "16px";
  panel.style.borderRadius = "10px";
  panel.style.fontSize = "14px";
  panel.style.lineHeight = "1.5";
  panel.style.whiteSpace = "pre-wrap";

  const closeBtn = document.createElement("button");
  closeBtn.textContent = "✖";
  closeBtn.style.position = "absolute";
  closeBtn.style.top = "8px";
  closeBtn.style.right = "8px";
  closeBtn.style.border = "none";
  closeBtn.style.background = "transparent";
  closeBtn.style.fontSize = "16px";
  closeBtn.style.cursor = "pointer";
  closeBtn.onclick = () => panel.remove();

  const title = document.createElement("h3");
  title.textContent = "🧠 GPT 요약 & 퀴즈";
  title.style.marginTop = "0";

  const contentDiv = document.createElement("div");
  contentDiv.textContent = content;

  panel.appendChild(closeBtn);
  panel.appendChild(title);
  panel.appendChild(contentDiv);
  document.body.appendChild(panel);
}
