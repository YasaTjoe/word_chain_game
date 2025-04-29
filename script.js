// Game state
let chain = [];
let currentStep = 1;
let guesses = [];
let guessCount = 0;
let pastGuesses = [];
let currentGuess = "";
let hintLetters = [];
const hints = {
    "flower": "Think of a plant",
    "power": "Think of energy",
    "line": "Think of a connection",
    "dance": "Think of a movement",
    "floor": "Think of a surface",
    "plan": "Think of a strategy",
    "light": "Think of brightness",
    "house": "Think of a home",
    "boat": "Think of a vessel",
    "yard": "Think of a garden",
    "stick": "Think of a branch",
    "figure": "Think of a shape",
    "fish": "Think of a swimmer",
    "bowl": "Think of a dish",
    "game": "Think of a contest",
    "book": "Think of a read",
    "shelf": "Think of storage",
    "guest": "Think of a visitor",
    "room": "Think of a space",
    "mate": "Think of a friend",
    "ship": "Think of a vessel"
};

function startGame() {
    document.getElementById("welcome-page").style.display = "none";
    document.getElementById("game-container").style.display = "block";
    initGame();
}

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
            if (isGuessed) {
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
        return; // No message anymore if wrong length
    }

    guessCount++;
    pastGuesses.push(fullGuess);
    const row = document.querySelectorAll(".row")[currentStep];
    if (fullGuess === expectedWord) {
        guesses[currentStep] = fullGuess;
        currentStep++;
        currentGuess = "";
        hintLetters[currentStep] = 1;
        if (currentStep === chain.length) {
            // No final win message either
        }
        row.querySelectorAll(".tile").forEach(tile => tile.classList.add("flip"));
        updateDisplay();
    } else {
        currentGuess = "";
        hintLetters[currentStep] = Math.min(hintLetters[currentStep] + 1, expectedWord.length);
        row.querySelectorAll(".tile").forEach(tile => tile.classList.add("flip"));
        setTimeout(() => {
            updateInput();
            updateDisplay();
        }, 300);
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