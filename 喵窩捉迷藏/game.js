
let currentLevel = 1;
let score = 0;
let timeLimit;
let remainingTime;
let targetImage;
let allImages = [];
let isSameTarget;
let timerInterval;
let isClickable = true;
let penaltyTime = 0;

const timerDisplay = document.getElementById("timer");
const scoreDisplay = document.getElementById("score");
const gridContainer = document.getElementById("gridContainer");
const targetImageEl = document.getElementById("targetImage");
const gridWrapper = document.querySelector(".grid-wrapper");

const params = new URLSearchParams(window.location.search);
const selectedTime = parseInt(params.get("time")) || 30;
const selectedSame = params.get("same") === "true";
const selectedCategory = params.get("category") || "default";

isSameTarget = selectedSame;
timeLimit = selectedTime;

function playSound(id) {
  const sound = document.getElementById(id);
  if (sound) {
    sound.currentTime = 0;
    sound.play();
  }
}

startLevel();

function getHudHeight() {
  const timer = document.querySelector(".timer");
  const score = document.querySelector(".score");
  const target = document.querySelector(".target-display");
  const heights = [timer, score, target].map(el => el?.offsetHeight || 0);
  return Math.max(...heights) + 20;
}

function getBestFitGrid(totalItems) {
  const screenRatio = window.innerWidth / (window.innerHeight - getHudHeight());
  let bestCols = 1;
  let bestRows = totalItems;
  let minDiff = Infinity;

  for (let rows = 1; rows <= totalItems; rows++) {
    if (totalItems % rows === 0) {
      const cols = totalItems / rows;
      const ratio = cols / rows;
      const diff = Math.abs(ratio - screenRatio);
      if (diff < minDiff) {
        minDiff = diff;
        bestCols = cols;
        bestRows = rows;
      }
    }
  }

  return { columns: bestCols, rows: bestRows };
}

function getNextRectangularNumber(startingFrom) {
  for (let total = startingFrom; total < startingFrom + 100; total++) {
    for (let rows = 1; rows <= total; rows++) {
      if (total % rows === 0) {
        return total;
      }
    }
  }
  return startingFrom;
}

function getTotalImagesForLevel(level) {
  if (level === 1) return 6;
  const increaseSteps = Math.floor((level - 1) / 5);
  return getNextRectangularNumber(6 + increaseSteps * 6);
}

function startLevel() {
  const music = document.getElementById("bgMusicGame");
  if (music && music.paused) music.play(); 
  
  isClickable = true;
  penaltyTime = 0;
  gridContainer.innerHTML = "";
  remainingTime = timeLimit;
  timerDisplay.textContent = remainingTime.toFixed(1);
  scoreDisplay.textContent = score;
  
  const images = getImagesFromCategory(selectedCategory);
  allImages = shuffle([...images]);

  if (!(isSameTarget && targetImage)) {
    targetImage = allImages[Math.floor(Math.random() * allImages.length)];
  }
  targetImageEl.src = `assets/images/${selectedCategory}/${targetImage}`;

  const totalItems = getTotalImagesForLevel(currentLevel);
  const { columns, rows } = getBestFitGrid(totalItems);
  let gridImages = [];
  const correctIndex = Math.floor(Math.random() * totalItems);

  for (let i = 0; i < totalItems; i++) {
    if (i === correctIndex) {
      gridImages.push(targetImage);
    } else {
      const nonTargetOptions = allImages.filter(img => img !== targetImage);
      const randomIndex = Math.floor(Math.random() * nonTargetOptions.length);
      const randomNonTarget = nonTargetOptions[randomIndex] || targetImage;
      gridImages.push(randomNonTarget);
    }
  }

  gridContainer.style.gridTemplateColumns = `repeat(${columns}, 1fr)`;
  gridContainer.style.gridTemplateRows = `repeat(${rows}, 1fr)`;

  const wrapperHeight = gridWrapper.clientHeight;
  const rowHeight = wrapperHeight / rows;

  gridImages.forEach((img, idx) => {
    const imgEl = document.createElement("img");
    imgEl.src = `assets/images/${selectedCategory}/${img}`;
    imgEl.dataset.index = idx;
    imgEl.style.maxHeight = `${rowHeight}px`; // 精準壓縮
    imgEl.style.maxWidth = "100%";
    imgEl.addEventListener("click", () => handleClick(img));
    gridContainer.appendChild(imgEl);
  });

  startTimer();
}

function handleClick(selected) {
  if (!isClickable) return;
  playSound("clickSound");

  if (selected === targetImage) {
    isClickable = false;
    playSound("correctSound");
    cancelAnimationFrame(timerInterval);
    const timeBonus = Math.round((remainingTime / timeLimit) * 100);
    score += 100 + timeBonus;

    currentLevel++;
    setTimeout(startLevel, 300);
  } else {
    playSound("wrongSound");
    penaltyTime += 5;
  }
}

function startTimer() {
  cancelAnimationFrame(timerInterval);
  const start = performance.now();

  function update() {
    const elapsed = (performance.now() - start) / 1000;
    remainingTime = Math.max(timeLimit - elapsed - penaltyTime, 0);
    timerDisplay.textContent = remainingTime.toFixed(1);
    if (remainingTime > 0) {
      timerInterval = requestAnimationFrame(update);
    } else {
      cancelAnimationFrame(timerInterval);
      endGame();
    }
  }

  update();
}

function endGame() {
  document.querySelector(".game-container").style.display = "none";
  const result = document.getElementById("resultScreen");
  result.style.display = "flex";
  
  const musicGame = document.getElementById("bgMusicGame");
  const musicEnd = document.getElementById("bgMusicEnd");
  if (musicGame) musicGame.pause();
  if (musicEnd) musicEnd.play();

  document.getElementById("resultMode").textContent = timeLimit + " 秒";
  document.getElementById("resultSame").textContent = selectedSame ? "相同" : "不同";
  document.getElementById("resultCategory").textContent = selectedCategory === "official" ? "官方喵" : "所有喵";
  document.getElementById("resultLevel").textContent = currentLevel - 1;
  document.getElementById("resultScore").textContent = score;
}

function getImagesFromCategory(category) {
  return IMAGE_LIBRARY[category] || ["sample1.png", "sample2.png"];
}

function shuffle(arr) {
  return arr.sort(() => Math.random() - 0.5);
}
