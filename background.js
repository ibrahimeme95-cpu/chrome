chrome.action.onClicked.addListener((tab) => {
  if (tab.url && tab.url.includes('ptc.eightfold.ai')) {
    chrome.tabs.sendMessage(tab.id, { action: 'startAutofill' }, (response) => {
      if (chrome.runtime.lastError) {
        console.log('Error:', chrome.runtime.lastError.message);
      } else {
        console.log('Autofill started:', response);
      }
    });
  } else {
    console.log('Not on a PTC Eightfold AI page');
  }
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'startAutofillFromPopup') {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]) {
        chrome.tabs.sendMessage(tabs[0].id, { action: 'startAutofill' }, (response) => {
          sendResponse(response);
        });
      }
    });
    return true;
  }
});
