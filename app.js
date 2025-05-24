document.addEventListener('DOMContentLoaded', () => {
    // Simulating content that would be in db.json
    let mockJsonData = {
        topics: [
            {
                id: "topic-1678886400000", // Example using timestamp for unique ID
                name: "Sample Topic: JavaScript Basics",
                flashcards: [
                    { id: "fc-1678886400001", question: "What is a closure?", answer: "A function that remembers its outer variables and can access them." },
                    { id: "fc-1678886400002", question: "What are the primitive types in JavaScript?", answer: "string, number, bigint, boolean, undefined, symbol, and null." }
                ]
            },
            {
                id: "topic-1678886500000",
                name: "Sample Topic: CSS Fundamentals",
                flashcards: [
                    { id: "fc-1678886500001", question: "What does CSS stand for?", answer: "Cascading Style Sheets." }
                ]
            }
        ]
    };

    const topicInput = document.getElementById('topic-input');
    const addTopicBtn = document.getElementById('add-topic-btn');
    const topicListContainer = document.getElementById('topic-list-container');

    // For now, topics will be stored in an in-memory array.
    // We can integrate localStorage later for persistence.
    // let topics = []; // This will be initialized by loadDataFromJSON
    let topics = []; 
    let currentTopicId = null; // Variable to store the ID of the currently selected topic

    // Initialize Showdown Converter
    let converter;
    try {
        converter = new showdown.Converter();
        // Configure options if needed, e.g., converter.setOption('tables', true);
        console.log("Showdown converter initialized successfully.");
    } catch (e) {
        console.error("Failed to initialize Showdown converter:", e);
        // Fallback or error handling if Showdown is not available
        converter = { makeHtml: (text) => text }; // Simple fallback to prevent errors
    }

    // Flashcard creation elements
    const questionInput = document.getElementById('question-input');
    const answerInput = document.getElementById('answer-input');
    const saveCardBtn = document.getElementById('save-card-btn');
    const flashcardCreationForm = document.getElementById('flashcard-creation-form'); 
    const flashcardDisplayContainer = document.getElementById('flashcard-display-container');

    // Modal elements and state
    const flashcardModal = document.getElementById('flashcard-modal');
    const modalCloseBtn = document.getElementById('modal-close-btn');
    const modalFlashcardContainer = document.getElementById('modal-flashcard-container');
    const modalPrevBtn = document.getElementById('modal-prev-btn');
    const modalNextBtn = document.getElementById('modal-next-btn');
    
    let currentModalTopicId = null; // Will store the actual ID string of the topic in modal
    let currentModalCardIndex = -1; // Will store the index of the card within its topic's flashcards array

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
            // cardFront.textContent = cardData.question; // Old way
            cardFront.innerHTML = converter.makeHtml(cardData.question || ''); // Use Showdown, handle undefined

            const cardBack = document.createElement('div');
            cardBack.className = 'flashcard-back';
            // cardBack.textContent = cardData.answer; // Old way
            cardBack.innerHTML = converter.makeHtml(cardData.answer || ''); // Use Showdown, handle undefined

            cardInner.appendChild(cardFront);
            cardInner.appendChild(cardBack);
            cardDiv.appendChild(cardInner);

            // cardDiv.addEventListener('click', () => { // Old: flip grid card
            //     cardDiv.classList.toggle('flipped');
            // });
            cardDiv.addEventListener('click', (e) => {
                e.stopPropagation(); 
                // topicId is the index of the topic, cardData.id is the actual ID of the card
                openModal(topics[topicId].id, cardData.id); 
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
                const newTopic = { 
                    id: `topic-${Date.now()}`, // Add ID
                    name: topicName, 
                    flashcards: [] 
                };
                topics.push(newTopic);
                saveDataToJSON(); // Call save function
                topicInput.value = ''; // Clear input field
                renderTopics();
            } else {
                alert('Topic already exists!'); // Simple feedback
            }
        } else {
            alert('Please enter a topic name.'); // Simple feedback
        }
    });

    // --- Persistence Functions ---
    function loadDataFromJSON() {
        // Simulate loading: In a real app, this might fetch from a server or read a local file.
        // For localStorage, it would be:
        // const storedData = localStorage.getItem('flashcardAppData');
        // topics = storedData ? JSON.parse(storedData).topics : [];
        
        // For our simulation with mockJsonData:
        // Make a deep copy to avoid direct mutation of mockJsonData if it's intended to be a pristine source
        topics = JSON.parse(JSON.stringify(mockJsonData.topics)); 
        console.log('Data loaded from mock JSON:', topics);
    }

    function saveDataToJSON() {
        // Simulate saving: In a real app, this might send data to a server or write to a file.
        // For localStorage:
        // localStorage.setItem('flashcardAppData', JSON.stringify({ topics: topics }));
        
        // For simulation, we can update mockJsonData if we want the "source" to reflect changes
        // mockJsonData.topics = JSON.parse(JSON.stringify(topics)); // Optional: update the mock source
        console.log('Simulating save to JSON. Current data:', JSON.stringify({ topics: topics }, null, 2));
    }
    // --- End Persistence Functions ---

    // --- End Persistence Functions ---

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
            const newCard = { 
                id: `fc-${Date.now()}`, // Add ID
                question, 
                answer 
            };
            topics[currentTopicId].flashcards.push(newCard);
            saveDataToJSON(); // Call save function
            
            questionInput.value = '';
            answerInput.value = '';
            
            alert('Flashcard saved!'); // Simple feedback
            renderFlashcards(currentTopicId); // Re-render flashcards for the current topic
            console.log(`Flashcards for topic ${topics[currentTopicId].name}:`, topics[currentTopicId].flashcards);
        } else {
            alert('Please fill in both the question and answer for the flashcard.');
        }
    });

    // --- Initial Load and Render ---
    loadDataFromJSON(); // Load initial data
    renderTopics();     // Render topics, which will now use the loaded data
    
    // Initial visibility for flashcard form and display area
    // currentTopicId will be null initially since no topic is selected by default after load
    if (currentTopicId === null && flashcardCreationForm) {
        flashcardCreationForm.style.display = 'none';
    }
    renderFlashcards(currentTopicId); // Render flashcards for initially selected topic (null in this case)
    // --- End Initial Load and Render ---

    // --- Modal Functions ---
    function updateModalNavButtons() {
        if (!currentModalTopicId) {
            if(modalPrevBtn) modalPrevBtn.disabled = true;
            if(modalNextBtn) modalNextBtn.disabled = true;
            return;
        }

        const topic = topics.find(t => t.id === currentModalTopicId);
        if (!topic || !topic.flashcards) {
            if(modalPrevBtn) modalPrevBtn.disabled = true;
            if(modalNextBtn) modalNextBtn.disabled = true;
            return;
        }

        if(modalPrevBtn) modalPrevBtn.disabled = (currentModalCardIndex <= 0);
        if(modalNextBtn) modalNextBtn.disabled = (currentModalCardIndex >= topic.flashcards.length - 1);
    }

    function displayCardInModal(topicActualId, cardActualId) {
        const topic = topics.find(t => t.id === topicActualId);
        if (!topic || !topic.flashcards) {
            console.error('Topic or flashcards not found for modal display. Topic ID:', topicActualId);
            closeModal(); // Close modal if data is inconsistent
            return;
        }
        
        const cardData = topic.flashcards.find(fc => fc.id === cardActualId);
        if (!cardData) {
            console.error('Card not found for modal display. Card ID:', cardActualId, 'in Topic:', topic.name);
            closeModal(); // Close modal if card not found
            return;
        }

        currentModalTopicId = topicActualId; // Update global state
        currentModalCardIndex = topic.flashcards.findIndex(fc => fc.id === cardActualId);

        modalFlashcardContainer.innerHTML = ''; // Clear previous card

        const cardDiv = document.createElement('div');
        cardDiv.className = 'flashcard'; 
        cardDiv.id = 'modal-flashcard'; 

        const cardInner = document.createElement('div');
        cardInner.className = 'flashcard-inner';

        const cardFront = document.createElement('div');
        cardFront.className = 'flashcard-front';
        cardFront.innerHTML = converter.makeHtml(cardData.question || ''); 

        const cardBack = document.createElement('div');
        cardBack.className = 'flashcard-back';
        cardBack.innerHTML = converter.makeHtml(cardData.answer || '');

        cardInner.appendChild(cardFront);
        cardInner.appendChild(cardBack);
        cardDiv.appendChild(cardInner);

        cardDiv.addEventListener('click', () => {
            cardDiv.classList.toggle('flipped');
        });

        modalFlashcardContainer.appendChild(cardDiv);
        updateModalNavButtons();
    }

    function openModal(topicActualId, cardActualId) {
        displayCardInModal(topicActualId, cardActualId); // Populate content first
        if (currentModalTopicId) { // Only show modal if card display was successful
            flashcardModal.classList.add('visible');
            document.body.style.overflow = 'hidden'; 
        }
    }

    function closeModal() {
        flashcardModal.classList.remove('visible');
        setTimeout(() => {
            modalFlashcardContainer.innerHTML = ''; 
        }, 300); 
        document.body.style.overflow = ''; 
        currentModalTopicId = null; 
        currentModalCardIndex = -1;
        updateModalNavButtons(); // Reset/disable nav buttons
    }

    function navigateToNextCard() {
        if (!currentModalTopicId) return;
        const topic = topics.find(t => t.id === currentModalTopicId);
        if (topic && topic.flashcards && currentModalCardIndex < topic.flashcards.length - 1) {
            currentModalCardIndex++;
            const nextCardId = topic.flashcards[currentModalCardIndex].id;
            displayCardInModal(currentModalTopicId, nextCardId);
        }
    }

    function navigateToPrevCard() {
        if (!currentModalTopicId) return;
        const topic = topics.find(t => t.id === currentModalTopicId);
        if (topic && topic.flashcards && currentModalCardIndex > 0) {
            currentModalCardIndex--;
            const prevCardId = topic.flashcards[currentModalCardIndex].id;
            displayCardInModal(currentModalTopicId, prevCardId);
        }
    }

    // Modal Event Listeners
    if(modalCloseBtn) modalCloseBtn.addEventListener('click', closeModal);
    if(modalPrevBtn) modalPrevBtn.addEventListener('click', navigateToPrevCard);
    if(modalNextBtn) modalNextBtn.addEventListener('click', navigateToNextCard);

    if(flashcardModal) {
        flashcardModal.addEventListener('click', (event) => {
            if (event.target === flashcardModal) {
                closeModal();
            }
        });
    }

    window.addEventListener('keydown', (event) => {
        if (flashcardModal && flashcardModal.classList.contains('visible')) { 
            if (event.key === 'ArrowRight') {
                navigateToNextCard();
            } else if (event.key === 'ArrowLeft') {
                navigateToPrevCard();
            } else if (event.key === 'Escape') {
                closeModal();
            }
        }
    });
    // --- End Modal Functions ---
});
