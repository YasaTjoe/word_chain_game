// Game state
function resetGameState() {
    chain = [];
    currentStep = 1;
    guesses = [];
    guessCount = 0;
    pastGuesses = [];
    currentGuess = "";
    hintLetters = [];
    document.getElementById("message").textContent = "";
    document.getElementById("game-board").innerHTML = "";
    document.getElementById("past-guesses").innerHTML = "";
  }
  
window.startGrindAfterDaily = function () {
    document.getElementById("win-popup").style.display = "none";
    startGame("grind");
  };
  

  window.startNextGrindLevel = function () {
    grindLevel++;
    localStorage.setItem("grindLevel", grindLevel);
    document.getElementById("win-popup").style.display = "none";
    resetGameState();
    gameMode = "grind";
    initGame();
  };
  
document.addEventListener("DOMContentLoaded", () => {
    const playBtn = document.getElementById("play-btn");
    const grindBtn = document.getElementById("grind-btn");
  
    if (playBtn) {
        playBtn.addEventListener("click", () => {
            const today = new Date().toISOString().split("T")[0];
            const lastPlayed = localStorage.getItem("lastPlayedDate");
          
            if (lastPlayed === today) {
              alert("You've already played today's daily! Come back tomorrow.");
              return;
            }
          
            startGame("daily");
          });          
    } else {
      console.warn("Play button not found");
    }
  
    if (grindBtn) {
      grindBtn.addEventListener("click", () => startGame("grind"));
    } else {
      console.warn("Grind button not found");
    }
  });
  
function keyboardHandler(e) {
    if (e.key === "Enter") {
      submitGuess();
    } else if (e.key === "Backspace") {
      currentGuess = currentGuess.slice(0, -1);
    } else if (/^[a-zA-Z]$/.test(e.key) && currentGuess.length < chain[currentStep].length - hintLetters[currentStep]) {
      currentGuess += e.key.toLowerCase();
    }
    updateInput();
}
  
let chain = [];
let currentStep = 1;
let guesses = [];
let guessCount = 0;
let pastGuesses = [];
let currentGuess = "";
let hintLetters = [];
let gameMode = "daily";       // "daily" or "grind"
let grindLevel = parseInt(localStorage.getItem("grindLevel")) || 1;


function startGame(mode) {
    gameMode = mode;
    const subtitle = document.getElementById("subtitle-text");

    if (mode === "grind") {
    subtitle.textContent = `Grind Level: ${grindLevel}! Good Luck!`;
    } else {
    subtitle.textContent = "Guess the word chain! Each word connects to the previous one.";
    }

    document.getElementById("welcome-page").style.display = "none";
    document.getElementById("transition-popup").style.display = "flex";

    const countdownText = document.getElementById("countdown-text");
    const continueBtn = document.getElementById("continue-btn");

    let count = 3;
    countdownText.style.display = "block";
    continueBtn.style.display = "none";
    countdownText.textContent = count;

    const countdownInterval = setInterval(() => {
        count--;
        if (count > 0) {
            countdownText.textContent = count;
        } else {
            clearInterval(countdownInterval);
            countdownText.style.display = "none";
            continueBtn.style.display = "inline-block";
        }
    }, 1000);
}


document.getElementById("continue-btn").addEventListener("click", () => {
    const game = document.getElementById("game-container");
    document.getElementById("transition-popup").style.display = "none";
    game.style.display = "block";
    game.classList.add("fade-in");
    initGame();
});
  

async function initGame() {
    try {
        let fetchPath = gameMode === "daily" ? "./daily_chains.json" : "./grind_chains.json";
        console.log(`Fetching ${fetchPath}...`);

        const response = await fetch(fetchPath, { cache: "no-store" });
        if (!response.ok) throw new Error(`Failed to fetch ${fetchPath}`);

        const chains = await response.json();
        if (!Array.isArray(chains)) throw new Error("Invalid JSON format");

        if (gameMode === "daily") {
            const today = new Date().toISOString().split("T")[0];
            const todayChain = chains.find(c => c.date === today);
            if (!todayChain) throw new Error("No daily chain found for today");
            chain = todayChain.chain;
        } else {
            const levelChain = chains.find(c => c.level === grindLevel);
            console.log("Available chains:", chains.map(c => c.level));  // 👈 See what levels are loaded
            console.log("Trying to load level:", grindLevel);  
            if (!levelChain) throw new Error(`No grind chain found for level ${grindLevel}`);
            chain = levelChain.chain;
        }

        guesses = Array(chain.length).fill(null);
        hintLetters = Array(chain.length).fill(1);
        updateDisplay();
        setupKeyboard();

        // Mobile keyboard support
        const mobileInput = document.getElementById("mobile-input");
        if (window.innerWidth <= 768 && mobileInput) {
            console.log("Mobile device detected — enabling native keyboard");
            mobileInput.style.opacity = 0;
            mobileInput.focus();

            document.body.addEventListener("click", () => mobileInput.focus());

            mobileInput.addEventListener("input", (e) => {
                const value = e.target.value.toLowerCase();
                if (!value) return;
                const char = value[value.length - 1];
                if (/^[a-z]$/.test(char)) handleKeyPress(char);
                e.target.value = "";
            });

            mobileInput.addEventListener("keydown", (e) => {
                if (e.key === "Enter") handleKeyPress("enter");
                if (e.key === "Backspace") handleKeyPress("backspace");
            });

            const keyboard = document.getElementById("keyboard");
            if (keyboard) keyboard.style.display = "none";
        }
    } catch (error) {
        console.error('Error initializing game:', error.message);
        document.getElementById("message").textContent =
            `Error: ${error.message}. Make sure the JSON files are available and hosted correctly.`;
        document.getElementById("game-board").innerHTML = "<p>Game unavailable.</p>";
    }
}


function updateDisplay() {
    if (!chain.length) {
        document.getElementById("game-board").innerHTML = "<p>Game unavailable.</p>";
        return;
    }
    const board = document.getElementById("game-board");
    board.innerHTML = "";
    chain.forEach((word, index) => {
        const row = document.createElement("div");
        row.classList.add("row");
        const isGuessed = guesses[index] || index === 0;
        const lettersToShow = hintLetters[index] || 1;
        const displayText = isGuessed ? (guesses[index] || word) : (word.slice(0, lettersToShow) + "_".repeat(word.length - lettersToShow));
        for (let i = 0; i < Math.max(word.length, displayText.length); i++) {
            const tile = document.createElement("div");
            tile.classList.add("tile");
            tile.textContent = displayText[i] || "";
            if (index === 0) {
                tile.classList.add("initial");
            } else if (isGuessed) {
                tile.classList.add("revealed");
            } else {
                tile.classList.add("hint");
            }            
            row.appendChild(tile);
        }
        board.appendChild(row);
    });

    const pastContainer = document.getElementById("past-guesses");
    pastContainer.innerHTML = "";
    pastGuesses.forEach(guess => {
        const div = document.createElement("div");
        div.classList.add("past-guess");
        div.textContent = guess;
        pastContainer.appendChild(div);
    });
}

function setupKeyboard() {
    document.querySelectorAll("#keyboard button").forEach(button => {
        button.addEventListener("click", () => {
            const key = button.getAttribute("data-key");
            if (key === "enter") {
                submitGuess();
            } else if (key === "backspace") {
                currentGuess = currentGuess.slice(0, -1);
            } else {
                if (currentGuess.length < chain[currentStep].length - hintLetters[currentStep]) {
                    currentGuess += key;
                }
            }
            updateInput();
        });
    });
    document.removeEventListener("keydown", keyboardHandler); // Ensure it's not added twice
    document.addEventListener("keydown", keyboardHandler);    // Attach cleanly
}

function updateInput() {
    const row = document.querySelectorAll(".row")[currentStep];
    const tiles = row.querySelectorAll(".tile");
    const lettersToShow = hintLetters[currentStep];
    const firstLetters = chain[currentStep].slice(0, lettersToShow);
    for (let i = 0; i < lettersToShow; i++) {
        tiles[i].textContent = firstLetters[i];
    }
    for (let i = lettersToShow; i < tiles.length; i++) {
        tiles[i].textContent = currentGuess[i - lettersToShow] || "_";
    }
}

function submitGuess() {
    const expectedWord = chain[currentStep];
    const expectedLength = expectedWord.length;
    const fullGuess = expectedWord.slice(0, hintLetters[currentStep]) + currentGuess;

    if (fullGuess.length !== expectedLength) {
        return; // Don't accept partial guesses
    }

    guessCount++;
    const row = document.querySelectorAll(".row")[currentStep];

    if (fullGuess === expectedWord) {
        guesses[currentStep] = fullGuess;
        currentStep++;
        currentGuess = "";
        hintLetters[currentStep] = 1;
        row.querySelectorAll(".tile").forEach(tile => {
            tile.classList.add("correct");
        });        

        // Apply flip animation after a short delay to ensure it's seen
        setTimeout(() => {
            row.querySelectorAll(".tile").forEach(tile => {
                tile.classList.add("flip");
            });
        }, 10);

        // Wait for flip animation before updating display and checking for win
        setTimeout(() => {
            updateDisplay();
            if (currentStep === chain.length) {
                document.getElementById("final-count").textContent = guessCount;
              
                if (gameMode === "daily") {
                  const today = new Date().toISOString().split("T")[0];
                  localStorage.setItem("lastPlayedDate", today);
              
                  document.getElementById("win-popup").innerHTML = `
                    <div class="popup-content">
                      <h2>🎉 You Win!</h2>
                      <p>You completed today's daily in ${guessCount} guesses.</p>
                      <button onclick="startGrindAfterDaily()">Continue to Grind</button>
                    </div>
                  `;
                } else {
                    grindLevel++;
                    localStorage.setItem("grindLevel", grindLevel);
                
                    document.getElementById("win-popup").innerHTML = `
                      <div class="popup-content">
                        <h2>🎉 Level Complete!</h2>
                        <p>Nice! You solved Grind Level ${grindLevel - 1} in ${guessCount} guesses.</p>
                        <button onclick="startNextGrindLevel()">Continue to Next Level</button>
                      </div>
                    `;
                    setTimeout(() => {
                        const nextBtn = document.getElementById("next-level-btn");
                        if (nextBtn) {
                          nextBtn.addEventListener("click", startNextGrindLevel);
                        }
                      }, 10); // slight delay ensures the element is available
                      
                  }
                
                  document.getElementById("win-popup").style.display = "flex";
                }      
        }, 600); // match your flip duration (0.6s)

    } else {
        currentGuess = "";
        hintLetters[currentStep] = Math.min(hintLetters[currentStep] + 1, expectedWord.length);

        // Apply shake animation to the current row
        row.classList.add("shake");

        setTimeout(() => {
            row.classList.remove("shake");
            updateInput();
            updateDisplay();
        }, 500); // match shake animation duration
    }
}



function showHint() {
    const expectedWord = chain[currentStep];
    const hint = hints[expectedWord] || "Think of the next word in the chain!";
    document.getElementById("message").textContent = `Hint: ${hint}`;
}

function restartGame() {
    currentStep = 1;
    guesses = Array(chain.length).fill(null);
    guessCount = 0;
    pastGuesses = [];
    currentGuess = "";
    hintLetters = Array(chain.length).fill(1);
    document.getElementById("message").textContent = "";
    updateDisplay();
}


  