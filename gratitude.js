document.addEventListener("DOMContentLoaded", () => {
  const mood = localStorage.getItem("latestMood");

  const greetingEl = document.getElementById("greeting");
  const summaryEl = document.getElementById("reflection-summary");
  const messageEl = document.getElementById("gratitude-message");
  const container = document.querySelector(".gratitude-container");

  if (!mood) {
    greetingEl.textContent = "Hey there 🌻";
    summaryEl.textContent = "Looks like you haven’t selected a mood yet!";
    messageEl.textContent = "Go back, choose your mood, and let your heart speak. You're good enough just as you are.";
    return;
  }

  greetingEl.textContent = "Hello, beautiful soul 🌼";
  summaryEl.textContent = `Your mood today: ${mood}`;

  let gratitudeMsg = "";
  let animationClass = "";

  // Messages based only on mood, with animation classes
  switch (mood) {
    case "Happy":
      gratitudeMsg = "Wonderful that you're feeling happy! Your joy is contagious and lights up the world. You're good enough, and this happiness is yours to cherish.";
      animationClass = "happy-animation";
      break;
    case "Grateful":
      gratitudeMsg = "Gratitude is a beautiful state of mind. You're good enough, and your thankful heart makes a real difference every day.";
      animationClass = "grateful-animation";
      break;
    case "Calm":
      gratitudeMsg = "Embrace this calm—it's your quiet strength shining through. You're good enough, and you've earned this peace.";
      animationClass = "calm-animation";
      break;
    case "Tired":
      gratitudeMsg = "Rest is how your light recharges. You're good enough, and taking it slow shows your wisdom—be kind to yourself.";
      animationClass = "tired-animation";
      break;
    case "Anxious":
      gratitudeMsg = "Anxiety is tough, but you're brave for feeling it. You're good enough, and you're taking steps forward—one breath at a time.";
      animationClass = "anxious-animation";
      break;
    default:
      gratitudeMsg = "Every feeling is valid. You're good enough just as you are, and you're doing beautifully.";
      animationClass = "default-animation";
      break;
  }

  messageEl.textContent = gratitudeMsg;
  container.classList.add(animationClass);  // Apply mood-based animation
});