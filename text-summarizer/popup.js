// 가장 최근 응답을 chrome.storage에서 불러오기
document.addEventListener("DOMContentLoaded", () => {
  chrome.storage.local.get(["gptResult"], (result) => {
    const output = document.getElementById("output");
    output.textContent = result.gptResult || "결과가 없습니다.";
  });
});
