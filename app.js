document.addEventListener('DOMContentLoaded', () => {
    const topicInput = document.getElementById('topic-input');
    const addTopicBtn = document.getElementById('add-topic-btn');
    const topicListContainer = document.getElementById('topic-list-container');

    // For now, topics will be stored in an in-memory array.
    // We can integrate localStorage later for persistence.
    let topics = [];
    let currentTopicId = null; // Variable to store the ID of the currently selected topic

    // Flashcard creation elements
    const questionInput = document.getElementById('question-input');
    const answerInput = document.getElementById('answer-input');
    const saveCardBtn = document.getElementById('save-card-btn');
    const flashcardCreationForm = document.getElementById('flashcard-creation-form'); 
    const flashcardDisplayContainer = document.getElementById('flashcard-display-container');

    // Function to render topics to the UI
    function renderTopics() {
        topicListContainer.innerHTML = ''; // Clear existing topics

        if (topics.length === 0) {
            topicListContainer.innerHTML = '<p>No topics created yet. Add one above!</p>';
            return;
        }

        const ul = document.createElement('ul');
        ul.className = 'topic-list';
        topics.forEach((topic, index) => {
            const li = document.createElement('li');
            li.textContent = topic.name;
            li.dataset.topicId = index; // Store index as an ID for now
            li.classList.add('topic-list-item'); // Use CSS class for styling

            // Basic styling for list items (can be moved to CSS)
            // li.style.backgroundColor = '#2a2a2a'; // Removed
            // li.style.padding = '10px'; // Removed (adjust to 10px 15px in CSS if that's the final decision)
            // li.style.margin = '5px 0'; // Removed
            // li.style.borderRadius = '4px'; // Removed
            // li.style.cursor = 'pointer'; // Removed
            // li.style.border = '1px solid #333'; // Removed

            li.addEventListener('click', () => {
                console.log(`Topic selected: ${topic.name}, ID: ${index}`);
                currentTopicId = index; // Update currentTopicId when a topic is clicked
                document.querySelectorAll('#topic-list-container li').forEach(item => {
                    // item.style.fontWeight = 'normal'; // Removed
                    // item.style.borderColor = '#333'; // Removed
                    item.classList.remove('selected'); // Use CSS classes
                });
                // li.style.fontWeight = 'bold'; // Removed
                // li.style.borderColor = '#bb86fc'; // Removed
                li.classList.add('selected'); // Use CSS classes
                
                // Show flashcard creation form and load cards for this topic
                if (flashcardCreationForm) { // Show the form
                    flashcardCreationForm.style.display = 'block';
                }
                renderFlashcards(currentTopicId); // Call to render flashcards
                // Original console logging kept for now, can be removed if renderFlashcards works
                if (topics[currentTopicId] && topics[currentTopicId].flashcards) {
                    console.log("Current topic flashcards: ", topics[currentTopicId].flashcards);
                } else {
                    console.log("No flashcards for this topic or topic not found.");
                }
            });

            ul.appendChild(li);
        });
        topicListContainer.appendChild(ul);
    }

    function renderFlashcards(topicId) {
        flashcardDisplayContainer.innerHTML = ''; // Clear previous flashcards

        if (topicId === null || typeof topics[topicId] === 'undefined' || !topics[topicId].flashcards || topics[topicId].flashcards.length === 0) {
            const noCardsMsg = document.createElement('p');
            noCardsMsg.className = 'no-flashcards-message';
            noCardsMsg.textContent = 'No flashcards for this topic yet. Create some above!';
            flashcardDisplayContainer.appendChild(noCardsMsg);
            return;
        }

        const currentCards = topics[topicId].flashcards;
        currentCards.forEach(cardData => {
            const cardDiv = document.createElement('div');
            cardDiv.className = 'flashcard';

            const cardInner = document.createElement('div');
            cardInner.className = 'flashcard-inner';

            const cardFront = document.createElement('div');
            cardFront.className = 'flashcard-front';
            cardFront.textContent = cardData.question;

            const cardBack = document.createElement('div');
            cardBack.className = 'flashcard-back';
            cardBack.textContent = cardData.answer;

            cardInner.appendChild(cardFront);
            cardInner.appendChild(cardBack);
            cardDiv.appendChild(cardInner);

            cardDiv.addEventListener('click', () => {
                cardDiv.classList.toggle('flipped');
            });

            flashcardDisplayContainer.appendChild(cardDiv);
        });
    }

    // Event listener for adding a new topic
    addTopicBtn.addEventListener('click', () => {
        const topicName = topicInput.value.trim();
        if (topicName) {
            // Check if topic already exists (case-insensitive)
            if (!topics.some(topic => topic.name.toLowerCase() === topicName.toLowerCase())) {
                topics.push({ name: topicName, flashcards: [] });
                topicInput.value = ''; // Clear input field
                renderTopics();
            } else {
                alert('Topic already exists!'); // Simple feedback
            }
        } else {
            alert('Please enter a topic name.'); // Simple feedback
        }
    });

    // Initial render of topics (which will be empty at first)
    renderTopics();

    // Event listener for saving a new flashcard
    saveCardBtn.addEventListener('click', () => {
        const question = questionInput.value.trim();
        const answer = answerInput.value.trim();

        if (currentTopicId === null || typeof topics[currentTopicId] === 'undefined') {
            alert('Please select a topic first before saving a flashcard.');
            return;
        }

        if (question && answer) {
            if (!topics[currentTopicId].flashcards) {
                topics[currentTopicId].flashcards = []; // Initialize if it doesn't exist
            }
            topics[currentTopicId].flashcards.push({ question, answer });
            
            questionInput.value = '';
            answerInput.value = '';
            
            alert('Flashcard saved!'); // Simple feedback
            renderFlashcards(currentTopicId); // Re-render flashcards for the current topic
            console.log(`Flashcards for topic ${topics[currentTopicId].name}:`, topics[currentTopicId].flashcards);
        } else {
            alert('Please fill in both the question and answer for the flashcard.');
        }
    });

    // Initially hide flashcard creation form and clear flashcard display
    if (flashcardCreationForm) {
        flashcardCreationForm.style.display = 'none'; // Hide until a topic is selected
    }
    renderFlashcards(null); // Render empty state for flashcards initially
});
