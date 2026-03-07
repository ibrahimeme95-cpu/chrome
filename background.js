chrome.action.onClicked.addListener((tab) => {
  if (!tab.url) {
    console.log('[PTC Autofill] No URL available');
    return;
  }

  if (tab.url.includes('ptc.eightfold.ai')) {
    console.log('[PTC Autofill] Starting autofill on PTC page...');
    chrome.tabs.sendMessage(tab.id, { action: 'startAutofill' }, (response) => {
      if (chrome.runtime.lastError) {
        console.error('[PTC Autofill] Error:', chrome.runtime.lastError.message);
      } else {
        console.log('[PTC Autofill] Message sent, response:', response);
      }
    });
  } else {
    console.log('[PTC Autofill] Not on a PTC Eightfold AI page. Current URL:', tab.url);
  }
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'startAutofillFromPopup') {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs && tabs.length > 0) {
        const activeTab = tabs[0];
        if (activeTab.url && activeTab.url.includes('ptc.eightfold.ai')) {
          chrome.tabs.sendMessage(activeTab.id, { action: 'startAutofill' }, (response) => {
            sendResponse(response || { status: 'started' });
          });
        } else {
          sendResponse({ status: 'error', message: 'Not on a PTC Eightfold AI page' });
        }
      } else {
        sendResponse({ status: 'error', message: 'No active tab found' });
      }
    });
    return true;
  }
});
