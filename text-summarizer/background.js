chrome.runtime.onInstalled.addListener(() => {
  // 요약 길이 옵션별로 context menu 생성
  const options = [
    { id: "summary-3-5", title: "📄 요약 (3~5줄)" },
    { id: "summary-5-7", title: "📄 요약 (5~7줄)" },
    { id: "summary-7-9", title: "📄 요약 (7~9줄)" },
    { id: "summary-10",  title: "📄 요약 (10~15줄)" }  // ✅ 수정됨
  ];

  options.forEach(({ id, title }) => {
    chrome.contextMenus.create({
      id,
      title,
      contexts: ["selection"]
    });
  });
});

chrome.contextMenus.onClicked.addListener((info, tab) => {
  const url = tab.url || "";

  console.log("✅ 우클릭된 탭 URL:", url);

  // ❌ 차단된 페이지
  const blocked = (
    url.startsWith("chrome://") ||
    url.startsWith("chrome-extension://") ||
    url.includes("google.com/search")
  );

  if (blocked) {
    chrome.notifications.create({
      type: "basic",
      iconUrl: "icon.png",
      title: "확장 프로그램 안내",
      message: "❌ 이 페이지(chrome:// 등)에서는 확장 기능을 사용할 수 없습니다."
    });
    return;
  }

  // 선택한 요약 길이 파악
  const summaryLengthMap = {
    "summary-3-5": "3~5줄",
    "summary-5-7": "5~7줄",
    "summary-7-9": "7~9줄",
    "summary-10":  "10~15줄" // ✅ 수정됨
  };

  const summaryLength = summaryLengthMap[info.menuItemId];

  // content.js 삽입 후 메시지 전달
  chrome.scripting.executeScript({
    target: { tabId: tab.id },
    files: ["content.js"]
  }, () => {
    if (chrome.runtime.lastError) {
      console.error("⚠️ content.js 삽입 실패:", chrome.runtime.lastError.message);
      return;
    }

    chrome.tabs.sendMessage(tab.id, {
      action: "summarizeAndQuiz",
      text: info.selectionText,
      length: summaryLength
    });
  });
});
