const chips = [...document.querySelectorAll(".chip")];
const note = document.querySelector("#note");
const generate = document.querySelector("#generate");
const status = document.querySelector("#status");
const result = document.querySelector("#result");
const review = document.querySelector("#review");
const copy = document.querySelector("#copy");
const google = document.querySelector("#google");

chips.forEach(chip => {
  chip.addEventListener("click", () => chip.classList.toggle("selected"));
});

function showStatus(message, isError = false) {
  status.hidden = false;
  status.textContent = message;
  status.className = `status ${isError ? "error" : ""}`;
}

generate.addEventListener("click", async () => {
  const selections = chips.filter(c => c.classList.contains("selected")).map(c => c.dataset.value);
  const words = note.value.trim();

  if (!selections.length && !words) {
    showStatus("Please tap at least one thing that genuinely describes your experience.", true);
    return;
  }

  generate.disabled = true;
  generate.textContent = "Creating your review…";
  result.hidden = true;
  showStatus("AI is writing a short review from your feedback…");

  try {
    const response = await fetch("/api/generate-review", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ selections, note: words })
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data.error || "Something went wrong.");

    review.value = data.review;
    result.hidden = false;
    status.hidden = true;

    const url = window.AL_TANDOOR_CONFIG?.googleReviewUrl || "";
    google.href = url || "#";
    google.onclick = url ? null : (e) => {
      e.preventDefault();
      alert("The Google review URL has not been configured yet.");
    };

    result.scrollIntoView({ behavior: "smooth", block: "center" });
  } catch (err) {
    showStatus(err.message, true);
  } finally {
    generate.disabled = false;
    generate.textContent = "✨ Create My Review";
  }
});

copy.addEventListener("click", async () => {
  try {
    await navigator.clipboard.writeText(review.value);
    copy.textContent = "✓ Copied";
    setTimeout(() => copy.textContent = "📋 Copy Review", 1800);
  } catch {
    review.select();
    document.execCommand("copy");
    copy.textContent = "✓ Copied";
    setTimeout(() => copy.textContent = "📋 Copy Review", 1800);
  }
});
