// Game state
let chain = [];
let currentStep = 1;
let guesses = [];
let guessCount = 0;
let pastGuesses = [];
let currentGuess = "";
let hintLetters = [];

function startGame() {
    document.getElementById("welcome-page").style.display = "none";
    document.getElementById("transition-popup").style.display = "flex";

    const countdownText = document.getElementById("countdown-text");
    const continueBtn = document.getElementById("continue-btn");

    let count = 3;
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
    }, 1000); // countdown every second
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
        console.log('Fetching chains.json...');
        const fetchPaths = ['./chains.json', '/wordchain/chains.json', '/chains.json'];
        let response;
        for (const path of fetchPaths) {
            console.log(`Attempting to fetch: ${path}`);
            response = await fetch(path, { cache: 'no-store' });
            if (response.ok) {
                console.log(`Successfully fetched: ${path}`);
                break;
            }
            console.log(`Failed to fetch ${path}: ${response.status} ${response.statusText}`);
        }
        if (!response.ok) {
            console.warn('All fetch attempts failed. Using fallback chain.');
            chain = ["tree", "house", "guest", "room", "mate", "ship", "yard"];
            document.getElementById("message").textContent = "Warning: Could not load chains.json. Using default chain for today.";
        } else {
            const chains = await response.json();
            if (!Array.isArray(chains)) {
                throw new Error('chains.json is not a valid array');
            }
            const today = new Date().toISOString().split('T')[0];
            console.log('Today\'s date:', today);
            console.log('Chains loaded:', chains);
            const todayChain = chains.find(c => c.date === today);
            if (!todayChain) {
                console.warn('No chain found for today:', today);
                document.getElementById("message").textContent = "No chain available for today. Please check back tomorrow.";
                document.getElementById("game-board").innerHTML = "<p>Game unavailable.</p>";
                return;
            }
            console.log('Selected chain:', todayChain.chain);
            chain = todayChain.chain;
            if (!Array.isArray(chain) || chain.length === 0) {
                throw new Error('Invalid chain data in chains.json');
            }
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

            // Re-focus input if user taps anywhere
            document.body.addEventListener("click", () => mobileInput.focus());

            // Handle typing from mobile input
            mobileInput.addEventListener("input", (e) => {
                const value = e.target.value.toLowerCase();
                if (!value) return;

                const char = value[value.length - 1];
                if (/^[a-z]$/.test(char)) {
                    handleKeyPress(char);
                }
                e.target.value = "";
            });
            mobileInput.addEventListener("keydown", (e) => {
                if (e.key === "Enter") {
                  handleKeyPress("enter");
                }
              });
              
            mobileInput.addEventListener("keydown", (e) => {
                if (e.key === "Backspace") handleKeyPress("backspace");
                else if (e.key === "Enter") handleKeyPress("enter");
            });

            // Hide the custom on-screen keyboard on small screens
            const keyboard = document.getElementById("keyboard");
            if (keyboard) {
                keyboard.style.display = "none";
            }
        }

    } catch (error) {
        console.error('Error initializing game:', error.message);
        document.getElementById("message").textContent = `Error: ${error.message}. Run a local server (e.g., Live Server) if testing locally, or ensure chains.json is in the correct server folder (/wordchain or root) with 644 permissions.`;
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
    document.addEventListener("keydown", (e) => {
        if (e.key === "Enter") {
            submitGuess();
        } else if (e.key === "Backspace") {
            currentGuess = currentGuess.slice(0, -1);
        } else if (/^[a-zA-Z]$/.test(e.key) && currentGuess.length < chain[currentStep].length - hintLetters[currentStep]) {
            currentGuess += e.key.toLowerCase();
        }
        updateInput();
    });
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