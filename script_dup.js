// Game state
let chain = ["sun", "flower", "power", "line", "dance", "floor", "plan"];
let currentStep = 1;
let guesses = Array(chain.length).fill(null);
let guessCount = 0;
let pastGuesses = [];
let currentGuess = "";
const hints = {
    "flower": "Think of a plant",
    "power": "Think of energy",
    "line": "Think of a connection",
    "dance": "Think of a movement",
    "floor": "Think of a surface",
    "plan": "Think of a strategy"
};

async function initGame() {
    try {
        const response = await fetch('chains.json');
        const chains = await response.json();
        const today = new Date().toISOString().split('T')[0];
        const todayChain = chains.find(c => c.date === today);
        if (todayChain) {
            chain = todayChain.chain;
            guesses = Array(chain.length).fill(null);
        }
    } catch (error) {
        console.error("Error loading chains:", error);
    }
    updateDisplay();
    setupKeyboard();
}

function updateDisplay() {
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
        currentGuess = ""; // Clear input for next word
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
        }, 300); // Reset hint after flip animation
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