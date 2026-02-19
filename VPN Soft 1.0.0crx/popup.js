// Function to send a message to the background script to set the proxy for a country
function setProxy(countryCode) {
  chrome.runtime.sendMessage({ action: "setProxy", countryCode: countryCode }, (response) => {
    if (response && response.status) {
      console.log(response.status);
    } else {
      console.error('Invalid response from background script');
    }
  });
}

// Function to reset the proxy settings
function resetProxy() {
  chrome.runtime.sendMessage({ action: "resetProxy" }, (response) => {
    if (response && response.status) {
      console.log(response.status);
    } else {
      console.error('Invalid response from background script');
    }
  });
}

// Function to highlight the selected button
function highlightSelectedButton(buttonId) {
  // Remove selected class from all buttons
  const buttons = document.querySelectorAll('#proxy-list button');
  buttons.forEach(button => button.classList.remove('selected'));

  // Add selected class to the clicked button
  const selectedButton = document.getElementById(buttonId);
  if (selectedButton) {
    selectedButton.classList.add('selected');
  }
}

// Event listener for button clicks to save the selected button ID
document.querySelectorAll('#proxy-list button').forEach(button => {
  button.addEventListener('click', (event) => {
    const selectedButtonId = event.currentTarget.id;

    // Save the selected button ID to local storage
    chrome.storage.local.set({ selectedButtonId: selectedButtonId });

    // Highlight the selected button
    highlightSelectedButton(selectedButtonId);
  });
});

// On page load, check if there's a saved selected button and highlight it
document.addEventListener('DOMContentLoaded', () => {
  chrome.storage.local.get('selectedButtonId', (result) => {
    if (result.selectedButtonId) {
      highlightSelectedButton(result.selectedButtonId);
    }
  });

  // Fetch the feedback text data from the server
  fetch('https://softnour.com/Product/vpn/data2c.php')
    .then(response => response.json())
    .then(data => {
      // Get the <p> element and the <a> element inside it
      var feedbackElement = document.getElementById('p_feedback');
      var feedbackLink = feedbackElement.querySelector('a');

      // Create text nodes for the content
      var prefixText = document.createTextNode(data.text + " ");
      var suffixText = document.createTextNode(" " + data.suffix);

      // Update the <a> element's href and text content
      feedbackLink.href = data.link;
      feedbackLink.target = "_blank";  // Add _blank to open the link in a new tab
      feedbackLink.textContent = data.link_text;
      if(data.link_text === "none") document.getElementById('p_feedback').style.display = 'none' ; 
      // Style the <a> element
      feedbackLink.style.backgroundColor = '#f0c14b';
      feedbackLink.style.padding = '5px';
      feedbackLink.style.borderRadius = '3px';
      feedbackLink.style.textDecoration = 'none';

      // Insert the prefix text before the <a> and suffix text after the <a>
      feedbackElement.insertBefore(prefixText, feedbackLink);
      feedbackElement.appendChild(suffixText);
    })
    .catch(error => {
      console.error('Error fetching feedback text:', error);
    });

  // Fetch available countries from the server
fetch('https://softnour.com/Product/vpn/datac.php', {
  method: 'GET', // or 'POST', depending on your request
  credentials: 'include' // This will include cookies in the request
})
    .then(response => response.json())
    .then(data => {
      let shouldExit = false;

      Object.keys(data).forEach(countryCode => {
        if (shouldExit) return;

        if (countryCode === 'GetBanner') {
         // alert(countryCode) ;
          const BannerData = data[countryCode];
          console.log('Title:', BannerData.Title);
          console.log('Pragraphe:', BannerData.Pragraphe);
          console.log('Button Text:', BannerData.Button_Text);
          console.log('Button URL:', BannerData.Button_URL);

          document.getElementById("Title").innerText = BannerData.Title;
          document.getElementById("Pragraphe").innerText = BannerData.Pragraphe;
          document.getElementById("button").innerText = BannerData.Button_Text;
          document.getElementById("button").href = BannerData.Button_URL;
          document.getElementById("button").target = "_blank";  // Add _blank to open the link in a new tab

          document.getElementsByTagName('div')[1].style.display = 'block';
          resetProxy();

          shouldExit = true;
        } else {
          const button = document.getElementById(countryCode);
          if (button) {
            button.disabled = false;
            button.classList.remove('blurred');
            button.addEventListener('click', () => setProxy(countryCode));
            console.log(countryCode);
          }
        }
      });
    })
    .catch(error => {
      console.error('Error fetching proxy settings:', error);
      resetProxy();
    });

  // Event listener for the reset button
  document.getElementById('reset').addEventListener('click', () => resetProxy());

  // Event listener for proxy list buttons
  const proxyList = document.getElementById('proxy-list');
  proxyList.addEventListener('click', function (event) {
    const button = event.target.closest('button');
    if (button && !button.disabled) {
      const countryCode = button.id;
      // Implement your proxy switch logic here
      console.log(`Switching proxy to: ${countryCode}`);
    }
  });
});
