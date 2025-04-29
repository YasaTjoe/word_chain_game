// Game state
let chain = [];
let currentStep = 1;
let guesses = [];
let guessCount = 0;
let pastGuesses = [];
let currentGuess = "";
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
    "cover": "Think of a blanket",
    "story": "Think of a tale",
    "mark": "Think of a sign",
    "down": "Think of a direction",
    "load": "Think of a burden"
};

async function initGame() {
    try {
        const response = await fetch('./chains.json', { cache: 'no-store' });
        if (!response.ok) {
            throw new Error(`Failed to fetch ./chains.json: ${response.status} ${response.statusText}`);
        }
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
        guesses = Array(chain.length).fill(null);
        updateDisplay();
        setupKeyboard();
    } catch (error) {
        console.error('Error initializing game:', error.message);
        document.getElementById("message").textContent = `Error: ${error.message}. Please ensure chains.json is accessible and try again.`;
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
        const displayText = isGuessed ? (guesses[index] || word) : (word[0] + "_".repeat(word.length - 1));
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
                if (currentGuess.length < chain[currentStep].length - 1) {
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
        } else if (/^[a-zA-Z]$/.test(e.key) && currentGuess.length < chain[currentStep].length - 1) {
            currentGuess += e.key.toLowerCase();
        }
        updateInput();
    });
}

function updateInput() {
    const row = document.querySelectorAll(".row")[currentStep];
    const tiles = row.querySelectorAll(".tile");
    const firstLetter = chain[currentStep][0];
    tiles[0].textContent = firstLetter;
    for (let i = 1; i < tiles.length; i++) {
        tiles[i].textContent = currentGuess[i - 1] || "_";
    }
}

function submitGuess() {
    const expectedWord = chain[currentStep];
    const expectedLength = expectedWord.length;
    const fullGuess = expectedWord[0] + currentGuess;

    if (fullGuess.length !== expectedLength) {
        document.getElementById("message").textContent = `Guess must be ${expectedLength} letters!`;
        return;
    }

    guessCount++;
    pastGuesses.push(fullGuess);
    const row = document.querySelectorAll(".row")[currentStep];
    if (fullGuess === expectedWord) {
        guesses[currentStep] = fullGuess;
        currentStep++;
        currentGuess = "";
        document.getElementById("message").textContent = `Correct! Guesses: ${guessCount}`;
        if (currentStep === chain.length) {
            document.getElementById("message").textContent = `You won in ${guessCount} guesses! Chain: ${chain.join(" -> ")}`;
        }
        row.querySelectorAll(".tile").forEach(tile => tile.classList.add("flip"));
        updateDisplay();
    } else {
        document.getElementById("message").textContent = `Wrong, try again! Guesses: ${guessCount}`;
        currentGuess = "";
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
    document.getElementById("message").textContent = "";
    updateDisplay();
}

initGame();