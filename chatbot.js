
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


  async function searchPage(message) {
    const q = message.toLowerCase();
    const bubble = addMessage("Let me check our published listings for you…", "bot");

    try {
      if (!window.supabase || !window.SUPABASE_URL ||
          !window.SUPABASE_PUBLISHABLE_KEY) {
        throw new Error("Property search is not configured.");
      }

      const client = window.supabase.createClient(
        window.SUPABASE_URL,
        window.SUPABASE_PUBLISHABLE_KEY
      );

      let query = client
        .from("properties")
        .select("id,title,category,location,bedrooms,guests,price,price_period,amenities")
        .eq("published", true)
        .order("featured", { ascending: false })
        .order("id", { ascending: false })
        .limit(5);

      let type = "";
      if (q.includes("hotel")) type = "hotel";
      else if (/\b(sale|buy|purchase|buying)\b/.test(q)) type = "sale";
      else if (/\b(rent|rental|renting|lease)\b/.test(q) &&
               /\b(property|house|home|land|real estate)\b/.test(q)) type = "rent";
      else if (/\b(shortlet|apartment|accommodation)\b/.test(q)) type = "shortlet";

      if (type) query = query.eq("category", type);

      const match = message.match(
        /\b(?:in|at|around|near)\s+([a-z][a-z\s-]{1,35})/i
      );

      let location = "";
      if (match) {
        location = match[1]
          .split(/\b(for|under|below|with|from|budget)\b/i)[0]
          .trim();
      }

      if (location) {
        query = query.ilike("location", "%" + location + "%");
      }
      // Detect studio requests separately
const wantsStudio = /\bstudio\b/i.test(q);
// Extract an optional bedroom requirement
const bedroomMatch = q.match(/\b(\d+)\s*[- ]?\s*bed(?:room)?s?\b/i);
const requiredBedrooms = bedroomMatch ? Number(bedroomMatch[1]) : null;


    // Extract an optional maximum budget in naira
    const budgetMatch = q.match(
      /(?:under|below|within|max(?:imum)?|budget(?:\s+of)?)\s*₦?\s*([\d,]+(?:\.\d+)?)\s*(k|m|million|thousand)?\b/i
    );

    let maxBudget = null;

    if (budgetMatch) {
      maxBudget = Number(budgetMatch[1].replace(/,/g, ""));
      const unit = (budgetMatch[2] || "").toLowerCase();

      if (unit === "k" || unit === "thousand") maxBudget *= 1000;
      if (unit === "m" || unit === "million") maxBudget *= 1000000;
    }


// Apply the bedroom filter when requested
if (requiredBedrooms !== null) {
  query = query.eq("bedrooms", requiredBedrooms);
}
// Apply the studio filter when requested
if (wantsStudio) {
    query = query.eq("bedrooms", 0);
}
// Apply the budget filter when requested
if (maxBudget !== null) {
  query = query.lte("price", maxBudget);
}
      let { data, error } = await query;
if (error) throw error;
      
let usedFallback = false;

if (!data || data.length === 0) {
  usedFallback = true;

  let allQuery = client
    .from("properties")
    .select("id,title,category,location,bedrooms,guests,price,price_period,amenities")
    .eq("published", true)
    .order("price", { ascending: true })
    .limit(100);

  if (type) {
    allQuery = allQuery.eq("category", type);
  }

  const allResult = await allQuery;

  if (allResult.error) throw allResult.error;

  const allProperties = allResult.data || [];

  const matchesLocation = (p) =>
    !location ||
    String(p.location || "")
      .toLowerCase()
      .includes(location.toLowerCase());

  const withinBudget = (p) =>
    maxBudget === null ||
    (p.price != null && Number(p.price) <= maxBudget);

  const cheapest = (items) =>
    items.slice().sort(
      (a, b) => Number(a.price ?? Infinity) - Number(b.price ?? Infinity)
    );

  const sameBedroomCount = (p) =>
    requiredBedrooms !== null &&
    Number(p.bedrooms) === requiredBedrooms;

  const smallerApartment = (p) =>
    requiredBedrooms !== null &&
    p.bedrooms != null &&
    Number(p.bedrooms) < requiredBedrooms;

  data = [];

  // 1. Requested bedroom count in the requested location,
  // regardless of budget.
  if (location && requiredBedrooms !== null && !wantsStudio) {
    data = cheapest(
      allProperties.filter(
        (p) => matchesLocation(p) && sameBedroomCount(p)
      )
    );
  }

  // 2. Requested bedroom count elsewhere, within budget.
  if (data.length === 0 && requiredBedrooms !== null && !wantsStudio) {
    data = cheapest(
      allProperties.filter(
        (p) =>
          !matchesLocation(p) &&
          sameBedroomCount(p) &&
          withinBudget(p)
      )
    );
  }

  // 3. Requested bedroom count elsewhere, even above budget.
  if (data.length === 0 && requiredBedrooms !== null && !wantsStudio) {
    data = cheapest(
      allProperties.filter(
        (p) =>
          !matchesLocation(p) &&
          sameBedroomCount(p)
      )
    );
  }

  // 4. Smaller apartments in the requested location.
  if (data.length === 0 && requiredBedrooms !== null && !wantsStudio) {
    data = cheapest(
      allProperties.filter(
        (p) => matchesLocation(p) && smallerApartment(p)
      )
    );
  }

  // 5. Smaller apartments elsewhere, within budget first.
  if (data.length === 0 && requiredBedrooms !== null && !wantsStudio) {
    data = cheapest(
      allProperties.filter(
        (p) =>
          !matchesLocation(p) &&
          smallerApartment(p) &&
          withinBudget(p)
      )
    );
  }

  // 6. Smaller apartments elsewhere, regardless of budget.
  if (data.length === 0 && requiredBedrooms !== null && !wantsStudio) {
    data = cheapest(
      allProperties.filter(
        (p) =>
          !matchesLocation(p) &&
          smallerApartment(p)
      )
    );
  }

  // 7. Studio requests: show studios first, without changing
  // the user's explicit studio preference.
  if (data.length === 0 && wantsStudio) {
    data = cheapest(
      allProperties.filter((p) => Number(p.bedrooms) === 0)
    );
  }

  // 8. Final fallback: other available listings.
  if (data.length === 0) {
    data = cheapest(
      allProperties.filter((p) => p.price != null)
    );
  }

  // Remove duplicate listings and limit displayed alternatives.
  const seenIds = new Set();

  data = data.filter((p) => {
    if (seenIds.has(p.id)) return false;
    seenIds.add(p.id);
    return true;
  }).slice(0, 5);
}
bubble.textContent = data && data.length
  ? (!usedFallback
      ? "Good news! 😊 I found matching properties for your search. Here are the available options:"
      : (maxBudget !== null && data.some(
          property => property.price != null && Number(property.price) > maxBudget
        )
          ? "I couldn't find a suitable match within your budget. 😊 Here are some lower-priced alternatives I found, but some may exceed your budget. Please check each listing's price and location."
       : "I couldn't find an exact match for all your requirements. 😊 Here are some alternatives to consider. Please check each listing's bedroom count, location and price, as some options may differ from your original request."))
  : "Sorry, I couldn't find a suitable match. 😊 Try adjusting your budget, choosing a different apartment size, or exploring another location. You can also contact our team for personal assistance.";
      if (data && data.length) {
        data.forEach(function (property) {
          const card = document.createElement("div");
          card.style.cssText =
            "padding:10px;margin:8px 0;border:1px solid #e6e2d9;border-radius:10px;background:#fff";

          const title = document.createElement("strong");
          title.textContent = property.title || "Property listing";
          card.appendChild(title);

          const details = document.createElement("p");
          details.style.cssText = "margin:4px 0;font-size:13px;color:#66716c";
          details.textContent =
            (property.location || "Location not specified") +
            (property.bedrooms != null ? " · " + property.bedrooms + " bedroom(s)" : "");
          card.appendChild(details);

          const price = document.createElement("p");
          price.style.cssText = "margin:4px 0;font-weight:700;color:#123f32";
          price.textContent = property.price != null
            ? "₦" + Number(property.price).toLocaleString("en-NG") +
              (property.price_period ? " / " + property.price_period : "")
            : "Contact us for pricing";
          card.appendChild(price);

          const link = document.createElement("a");
          link.className = "ss-ai-link";
          link.href = "property.html?id=" + encodeURIComponent(property.id);
          link.textContent = "View property";
          card.appendChild(link);

          messages.appendChild(card);
        });
      }

      
      addActions([
        { label: "Search another location", message: "Find a shortlet in Lekki" },
        { label: "Talk to our team", message: "Talk to a human" }
      ]);

      messages.scrollTop = messages.scrollHeight;
    } catch (error) {
      console.error("Source Stays property search failed:", error);
      bubble.textContent =
        "I'm unable to retrieve listings right now. Please use the website search or contact our team on WhatsApp.";
      addLink(bubble, "Contact Source Stays", WHATSAPP);
    }
  }


  async function handleMessage(raw) {
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

   if (/\b(shortlet|apartment|hotel|accommodation|find a place|find accommodation|property for sale|property for rent|real estate enquiry|buy property|rent property|show me properties|bedroom|bedrooms|studio|under\s*₦?\s*[\d,]+|budget)\b/i.test(q)) {
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

       addMessage("Let me think about that for you…", "bot");
    const replyBubble = messages.lastElementChild;

    try {
      const response = await fetch(
        "https://mrvckkzwhuoylxlycaim.supabase.co/functions/v1/source-stays-chat",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "apikey": window.SUPABASE_PUBLISHABLE_KEY
          },
          body: JSON.stringify({ message: text })
        }
      );

      const data = await response.json();

      if (!response.ok || !data.reply) {
        throw new Error("AI response unavailable");
      }

      replyBubble.textContent = data.reply;
      addActions([
        { label: "Find a shortlet", message: "Find a shortlet" },
        { label: "Hotel options", message: "Show me hotels" },
        { label: "Talk on WhatsApp", message: "Talk to a human" }
      ]);
    } catch (error) {
      replyBubble.textContent =
        "Sorry, I'm having trouble answering right now. Please try again or contact our team on WhatsApp.";
      addActions([
        { label: "Talk on WhatsApp", message: "Talk to a human" }
      ]);
    }
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
