let proxySettings = {};
let currentProxy = null;

// Fetch proxy settings from external PHP file
fetch('https://softnour.com/Product/vpn/datac.php', {
  method: 'GET', // or 'POST', depending on your request
  credentials: 'include' // This will include cookies in the request
})
  .then(response => response.json())
  .then(data => {
    proxySettings = data;
    console.log('Proxy settings loaded:', proxySettings);
    // Restore proxy settings from storage
    return chrome.storage.local.get('currentProxy');
  })
  .then(result => {
    if (result.currentProxy) {
      currentProxy = result.currentProxy;
      console.log(`Restored proxy settings: ${currentProxy.host}:${currentProxy.port}`);
    }
  })
  .catch(error => {
    console.error('Error fetching proxy settings:', error);
    // Reset proxy if fetching data fails
    resetProxy();
  });

// Set the proxy for a specific country code
function setProxy(countryCode) {
  if (proxySettings[countryCode]) {
    currentProxy = proxySettings[countryCode];

    // Set the proxy configuration using chrome.proxy.settings.set
    const proxyConfig = {
      mode: "fixed_servers",
      rules: {
        singleProxy: {
          scheme: "socks5", // Use SOCKS5 for the proxy
          host: currentProxy.host,
          port: currentProxy.port
        },
        bypassList: ["<local>"]
      }
    };

    chrome.proxy.settings.set({ value: proxyConfig, scope: "regular" }, () => {
      console.log(`Proxy set for ${countryCode}: ${currentProxy.host}:${currentProxy.port}`);
    });

    chrome.storage.local.set({ currentProxy: currentProxy });
  } else {
    console.error('Unknown country code:', countryCode);
  }
}

// Reset the proxy (direct connection)
function resetProxy() {
  const proxyConfig = {
    mode: "direct" // Reset to direct connection (no proxy)
  };

  chrome.proxy.settings.set({ value: proxyConfig, scope: "regular" }, () => {
    console.log('Proxy reset to direct connection');
  });

  currentProxy = null;
  chrome.storage.local.remove('currentProxy');
}

// Add listener for messages from other parts of the extension
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "setProxy") {
    setProxy(request.countryCode); // Set proxy based on the country code received
    sendResponse({ status: "Proxy set for " + request.countryCode });
  } else if (request.action === "resetProxy") {
    resetProxy(); // Reset proxy to direct connection
    sendResponse({ status: "Proxy reset" });
  }
  
  return true; // Return true to indicate we are handling the async response
});

// Initialize proxy settings on startup (when the extension is installed or updated)
chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.local.get('currentProxy', (result) => {
    if (result.currentProxy) {
      currentProxy = result.currentProxy;
      console.log(`Restored proxy settings: ${currentProxy.host}:${currentProxy.port}`);
    }
  });
});
