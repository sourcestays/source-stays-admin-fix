
(function () {
  if (document.getElementById("ss-ai-launcher")) return;

  const AVATAR = "source-stays-ai-avatar.png";
  const WHATSAPP = "https://wa.me/2347085404814";

  const style = document.createElement("style");
  style.textContent = `
    #ss-ai-launcher {
      position: fixed; right: 22px; bottom: 22px; z-index: 9998;
      width: 72px; height: 72px; padding: 4px; border-radius: 50%;
      border: 3px solid #c9a45c; background: #123f32; cursor: pointer;
      box-shadow: 0 6px 24px #0003; animation: ss-float 3s ease-in-out infinite;
    }
    #ss-ai-launcher img {
      width: 100%; height: 100%; object-fit: cover; border-radius: 50%;
    }
    #ss-ai-launcher:focus-visible, #ss-ai-send:focus-visible,
    #ss-ai-input:focus-visible { outline: 3px solid #c9a45c; outline-offset: 3px; }
    #ss-ai-window {
      position: fixed; right: 22px; bottom: 106px; z-index: 9999;
      width: min(380px, calc(100vw - 24px)); height: min(570px, calc(100dvh - 130px));
      display: none; flex-direction: column; overflow: hidden;
      background: #fff; border: 1px solid #e6e2d9; border-radius: 18px;
      box-shadow: 0 12px 45px #0003; font: 15px/1.5 system-ui, sans-serif;
      color: #17201d;
    }
    #ss-ai-window.ss-open { display: flex; }
    .ss-ai-head {
      display: flex; align-items: center; gap: 11px; padding: 13px;
      color: #fff; background: #123f32;
    }
    .ss-ai-head img {
      width: 48px; height: 48px; object-fit: cover; border-radius: 50%;
      background: #fff; border: 2px solid #c9a45c;
    }
    .ss-ai-title { flex: 1; font-weight: 750; }
    .ss-ai-status { font-size: 12px; color: #e5e9e6; }
    .ss-ai-close {
      border: 0; background: transparent; color: #fff; font-size: 25px;
      cursor: pointer; padding: 4px 8px;
    }
    #ss-ai-messages {
      flex: 1; overflow-y: auto; padding: 14px; background: #fbfaf7;
    }
    .ss-ai-msg {
      max-width: 91%; padding: 10px 12px; border-radius: 13px;
      margin: 0 0 10px; white-space: pre-wrap; overflow-wrap: anywhere;
    }
    .ss-ai-bot { background: #fff; border: 1px solid #e6e2d9; }
    .ss-ai-user { margin-left: auto; background: #e6f0eb; }
    .ss-ai-actions { display: flex; flex-wrap: wrap; gap: 7px; margin: 8px 0 12px; }
    .ss-ai-action {
      border: 1px solid #c9a45c; border-radius: 18px; padding: 8px 11px;
      color: #123f32; background: #fff; cursor: pointer; font-size: 13px;
    }
    .ss-ai-action:hover { background: #f7f3ea; }
    .ss-ai-form {
      display: flex; gap: 8px; padding: 11px; border-top: 1px solid #e6e2d9;
      background: #fff;
    }
    #ss-ai-input {
      min-width: 0; flex: 1; border: 1px solid #d6d8d4; border-radius: 22px;
      padding: 11px 13px; color: #17201d; background: #fff;
    }
    #ss-ai-send {
      border: 0; border-radius: 50%; width: 43px; height: 43px;
      background: #123f32; color: #fff; cursor: pointer; font-size: 18px;
    }
    .ss-ai-foot { text-align: center; font-size: 11px; color: #66716c; padding: 0 8px 8px; }
    .ss-ai-link { color: #123f32; font-weight: 700; text-decoration: underline; }
    @keyframes ss-float {
      0%, 100% { transform: translateY(0); }
      50% { transform: translateY(-5px); }
    }
    @media (max-width: 480px) {
      #ss-ai-launcher { width: 62px; height: 62px; right: 14px; bottom: 14px; }
      #ss-ai-window {
        right: 8px; bottom: 84px; width: calc(100vw - 16px);
        height: min(72dvh, 600px); border-radius: 15px;
      }
    }
    @media (prefers-reduced-motion: reduce) {
      #ss-ai-launcher { animation: none; }
    }
  `;
  document.head.appendChild(style);

  const launcher = document.createElement("button");
  launcher.id = "ss-ai-launcher";
  launcher.type = "button";
  launcher.setAttribute("aria-label", "Open Source Stays AI Assistant");
  launcher.setAttribute("aria-expanded", "false");
  launcher.innerHTML = '<img src="' + AVATAR + '" alt="">';

  const panel = document.createElement("section");
  panel.id = "ss-ai-window";
  panel.setAttribute("aria-label", "Source Stays AI Assistant");
  panel.setAttribute("aria-hidden", "true");
  panel.innerHTML = `
    <div class="ss-ai-head">
      <img src="${AVATAR}" alt="Source Stays AI Assistant">
      <div class="ss-ai-title">Source Stays AI Assistant
        <div class="ss-ai-status">● Here to help</div>
      </div>
      <button class="ss-ai-close" type="button" aria-label="Close chat">×</button>
    </div>
    <div id="ss-ai-messages" aria-live="polite" aria-label="Chat messages"></div>
    <form class="ss-ai-form">
      <input id="ss-ai-input" maxlength="500" autocomplete="off"
        placeholder="Ask about stays or properties..." aria-label="Your message">
      <button id="ss-ai-send" type="submit" aria-label="Send message">➤</button>
    </form>
    <div class="ss-ai-foot">Source Stays · Shortlets · Hotels · Real Estate</div>
  `;

  document.body.append(launcher, panel);

  const teaser = document.createElement("button");
  teaser.type = "button";
  teaser.setAttribute("aria-label", "Chat with Source Stays AI Assistant");

  Object.assign(teaser.style, {
    position: "fixed",
    right: "108px",
    bottom: "32px",
    zIndex: "9998",
    maxWidth: "240px",
    padding: "13px 16px",
    border: "1px solid #c9a45c",
    borderRadius: "15px",
    background: "#ffffff",
    color: "#123f32",
    boxShadow: "0 5px 22px #0002",
    textAlign: "left",
    font: "14px/1.5 system-ui, sans-serif",
    cursor: "pointer",
    display: "none"
  });

  teaser.textContent =
    "Hello! 👋 Welcome to Source Stays. How can I assist you today?";

  document.body.appendChild(teaser);

  function openSourceStaysChat() {
    panel.classList.add("ss-open");
    launcher.setAttribute("aria-expanded", "true");
    panel.setAttribute("aria-hidden", "false");
    teaser.style.display = "none";

    if (!messages.children.length) showWelcome();

    input.focus();
  }

  teaser.addEventListener("click", openSourceStaysChat);
  launcher.addEventListener("click", function () {
    teaser.style.display = "none";
  });

  if (window.innerWidth > 480) {
    setTimeout(function () {
      if (!panel.classList.contains("ss-open")) {
        teaser.style.display = "block";
      }
    }, 1500);
  }

  const messages = panel.querySelector("#ss-ai-messages");
  const input = panel.querySelector("#ss-ai-input");

  function addMessage(text, who) {
    const bubble = document.createElement("div");
    bubble.className = "ss-ai-msg " + (who === "user" ? "ss-ai-user" : "ss-ai-bot");
    bubble.textContent = text;
    messages.appendChild(bubble);
    messages.scrollTop = messages.scrollHeight;
    return bubble;
  }

  function addLink(parent, label, url) {
    const link = document.createElement("a");
    link.className = "ss-ai-link";
    link.href = url;
    link.textContent = label;
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    parent.appendChild(link);
  }

  function addActions(items) {
    const row = document.createElement("div");
    row.className = "ss-ai-actions";
    items.forEach(function (item) {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "ss-ai-action";
      button.textContent = item.label;
      button.addEventListener("click", function () {
        handleMessage(item.message);
      });
      row.appendChild(button);
    });
    messages.appendChild(row);
    messages.scrollTop = messages.scrollHeight;
  }

  function showWelcome() {
    addMessage(
      "Hello! 👋 Welcome to Source Stays. I can help you explore shortlets, hotels and real estate, and guide you through making an enquiry. What are you looking for?",
      "bot"
    );
    addActions([
      { label: "Find a shortlet", message: "Find a shortlet" },
      { label: "Hotel options", message: "Show me hotels" },
      { label: "Buy or rent property", message: "Real estate enquiry" },
      { label: "Booking help", message: "How do bookings work?" },
      { label: "Caution fee & policies", message: "Caution fee and policies" },
      { label: "Talk on WhatsApp", message: "Talk to a human" }
    ]);
  }

  function searchPage(message) {
    const params = new URLSearchParams();
    const text = message.toLowerCase();

    if (text.includes("hotel")) params.set("type", "hotel");
    else if (text.includes("sale") || text.includes("buy") || text.includes("purchase"))
      params.set("type", "sale");
    else if (text.includes("rent property") || text.includes("property for rent"))
      params.set("type", "rent");
    else params.set("type", "shortlet");

    const match = message.match(/\b(?:in|at|around|near)\s+([a-z][a-z\s-]{1,35})/i);
    if (match) {
      const location = match[1].split(/\b(for|under|below|with|from)\b/i)[0].trim();
      if (location) params.set("location", location);
    }

    const url = "index.html?" + params.toString() + "#stays";
    const bubble = addMessage(
      "I'll help you explore matching listings. Open the property search to view published options and their displayed prices. Please confirm availability with our team before making payment.",
      "bot"
    );
    addLink(bubble, "View property listings", url);
  }

  function handleMessage(raw) {
    const text = String(raw || "").trim();
    if (!text) return;

    addMessage(text, "user");
    const q = text.toLowerCase();

    if (/talk to a human|human agent|whatsapp|speak to someone|contact (you|us|team)/.test(q)) {
      const bubble = addMessage(
        "Of course. Tap below to continue with the Source Stays team on WhatsApp.",
        "bot"
      );
      addLink(bubble, "Chat with Source Stays on WhatsApp", WHATSAPP);
      return;
    }

    if (/shortlet|apartment|hotel|find a place|find accommodation|property for sale|property for rent|real estate enquiry|buy property|rent property|show me properties|listing/.test(q)) {
      searchPage(text);
      return;
    }

    if (/book|booking|reservation|check.?in|check.?out|availability/.test(q)) {
      addMessage(
        "To enquire about a booking, open a property listing and review its details. Our team must confirm availability and the final terms before payment. I cannot confirm a reservation from this chat.",
        "bot"
      );
      addActions([
        { label: "Find a shortlet", message: "Find a shortlet" },
        { label: "Hotel options", message: "Show me hotels" },
        { label: "Contact the team", message: "Talk to a human" }
      ]);
      return;
    }

    if (/caution|deposit|refund|policy|fee/.test(q)) {
      addMessage(
        "Caution fees and policies can vary by property. Please check the specific listing or confirm the current terms with our team before booking.",
        "bot"
      );
      addActions([{ label: "Ask the team", message: "Talk to a human" }]);
      return;
    }

    if (/hello|hi\b|good morning|good afternoon|good evening/.test(q)) {
      addMessage(
        "Hello! 👋 Welcome to Source Stays. Are you looking for a shortlet, a hotel, or a property to buy or rent?",
        "bot"
      );
      addActions([
        { label: "Shortlets", message: "Find a shortlet" },
        { label: "Hotels", message: "Show me hotels" },
        { label: "Real estate", message: "Real estate enquiry" }
      ]);
      return;
    }

    addMessage(
      "I’m still learning how to answer that. I can help you explore shortlets, hotels, real estate and booking guidance, or connect you with our team.",
      "bot"
    );
    addActions([
      { label: "Find a shortlet", message: "Find a shortlet" },
      { label: "Hotel options", message: "Show me hotels" },
      { label: "Talk on WhatsApp", message: "Talk to a human" }
    ]);
  }

  launcher.addEventListener("click", function () {
    const open = panel.classList.toggle("ss-open");
    launcher.setAttribute("aria-expanded", String(open));
    panel.setAttribute("aria-hidden", String(!open));
    if (open && !messages.children.length) showWelcome();
    if (open) input.focus();
  });

  panel.querySelector(".ss-ai-close").addEventListener("click", function () {
    panel.classList.remove("ss-open");
    launcher.setAttribute("aria-expanded", "false");
    panel.setAttribute("aria-hidden", "true");
    launcher.focus();
  });

  panel.querySelector(".ss-ai-form").addEventListener("submit", function (event) {
    event.preventDefault();
    const value = input.value.trim();
    if (!value) return;
    input.value = "";
    handleMessage(value);
  });
})();
