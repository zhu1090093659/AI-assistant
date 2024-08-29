chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "getSettings") {
    chrome.storage.sync.get(['apiKey', 'model', 'beforeTime', 'afterTime', 'frameCaptureInterval', 'apiEndpoint'], (items) => {
      sendResponse(items);
    });
    return true; // 保持消息通道开放
  }
});