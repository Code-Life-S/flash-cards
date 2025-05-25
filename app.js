document.addEventListener('DOMContentLoaded', () => {
    const LOCAL_STORAGE_KEY = 'flashcardAppData';

    const topicInput = document.getElementById('topic-input');
    const addTopicBtn = document.getElementById('add-topic-btn');
    const topicListContainer = document.getElementById('topic-list-container');

    // For now, topics will be stored in an in-memory array.
    // We can integrate localStorage later for persistence.
    // let topics = []; // This will be initialized by loadDataFromJSON
    let topics = []; 
    let currentTopicId = null; // Variable to store the ID of the currently selected topic

    // Initialize Showdown Converter
    let converter; // Declare here
    try {
        converter = new showdown.Converter({ simpleLineBreaks: true });
        // Configure options if needed, e.g., converter.setOption('tables', true);
        console.log("Showdown converter initialized successfully with simpleLineBreaks.");
    } catch (e) {
        console.error("Showdown library not loaded or failed to initialize. Markdown will not be rendered.", e);
        // Fallback to a dummy converter to prevent further errors if Showdown is critical
        converter = {
            makeHtml: function (text) {
                // Basic escaping to prevent HTML injection if Showdown is missing
                // Ensure text is a string before calling replace
                const strText = String(text || '');
                return strText.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
            }
        };
        alert("Markdown rendering is currently unavailable. Please check your internet connection or contact support.");
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
    
    // New elements for edit functionality
    const modalFlashcardView = document.getElementById('modal-flashcard-view');
    const modalEditFormView = document.getElementById('modal-edit-form-view');
    const modalEditBtn = document.getElementById('modal-edit-btn');
    const editQuestionInput = document.getElementById('edit-question-input');
    const editAnswerInput = document.getElementById('edit-answer-input');
    const saveEditBtn = document.getElementById('save-edit-btn'); 
    const cancelEditBtn = document.getElementById('cancel-edit-btn');
    const modalNavigation = document.querySelector('.modal-navigation');
    const modalDeleteBtn = document.getElementById('modal-delete-btn');

    let currentModalTopicId = null; // Will store the actual ID string of the topic in modal
    let currentModalCardIndex = -1; // Will store the index of the card within its topic's flashcards array
    let cardBeingEditedId = null; // To store the ID of the card being edited

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
                saveDataToLocalStorage(); // Call save function
                topicInput.value = ''; // Clear input field
                renderTopics();
            } else {
                alert('Topic already exists!'); // Simple feedback
            }
        } else {
            alert('Please enter a topic name.'); // Simple feedback
        }
    });

    // --- Persistence Functions (localStorage) ---
    function saveDataToLocalStorage() {
        try {
            localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(topics));
        } catch (e) {
            console.error('Error saving data to localStorage:', e);
            alert('Could not save data. Your browser storage might be full or access denied.');
        }
    }

    function loadDataFromLocalStorage() {
        const storedData = localStorage.getItem(LOCAL_STORAGE_KEY);
        if (storedData) {
            try {
                topics = JSON.parse(storedData);
                if (!Array.isArray(topics)) { 
                    console.warn('Stored data is not an array. Initializing with empty array.');
                    topics = [];
                }
            } catch (e) {
                console.error('Error parsing localStorage data:', e);
                topics = []; 
            }
        } else {
            topics = []; 
            // Optionally, add default sample data for first-time users
            // topics = [ { id: "default-topic-1", name: "Welcome!", flashcards: [{id: "default-fc-1", question:"How to use this app?", answer:"Create topics and add flashcards!"}]} ];
        }
    }
    // --- End Persistence Functions (localStorage) ---

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
            saveDataToLocalStorage(); // Call save function
            
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
    loadDataFromLocalStorage(); // Load initial data
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
        
        // Ensure correct views are shown when displaying a card
        if(modalFlashcardView) modalFlashcardView.style.display = 'block';
        if(modalEditFormView) modalEditFormView.style.display = 'none';
        if(modalNavigation) modalNavigation.style.display = 'flex';

        updateModalNavButtons();
    }

    function openModal(topicActualId, cardActualId) {
        // Ensure edit form is hidden and card view is shown by default when opening modal
        if(modalFlashcardView) modalFlashcardView.style.display = 'block';
        if(modalEditFormView) modalEditFormView.style.display = 'none';
        if(modalNavigation) modalNavigation.style.display = 'flex';

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
            // Reset views to default state for next open
            if(modalFlashcardView) modalFlashcardView.style.display = 'block';
            if(modalEditFormView) modalEditFormView.style.display = 'none';
            if(modalNavigation) modalNavigation.style.display = 'flex';
        }, 300); 
        document.body.style.overflow = ''; 
        currentModalTopicId = null; 
        currentModalCardIndex = -1;
        cardBeingEditedId = null; // Reset card being edited
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
    if(modalEditBtn) modalEditBtn.addEventListener('click', startEditFlashcard);
    if(cancelEditBtn) cancelEditBtn.addEventListener('click', cancelEditFlashcard);

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

    // --- Edit Mode Functions ---
    function startEditFlashcard() {
        if (currentModalTopicId === null || currentModalCardIndex === -1) {
            console.error("No card selected to edit.");
            return;
        }

        const topic = topics.find(t => t.id === currentModalTopicId);
        if (!topic || !topic.flashcards || !topic.flashcards[currentModalCardIndex]) {
            console.error("Card data not found for editing.");
            return;
        }

        const cardData = topic.flashcards[currentModalCardIndex];
        cardBeingEditedId = cardData.id; 

        if(editQuestionInput) editQuestionInput.value = cardData.question; 
        if(editAnswerInput) editAnswerInput.value = cardData.answer;   

        if(modalFlashcardView) modalFlashcardView.style.display = 'none';
        if(modalNavigation) modalNavigation.style.display = 'none'; 
        if(modalEditFormView) modalEditFormView.style.display = 'block';
    }

    function cancelEditFlashcard() {
        if(modalEditFormView) modalEditFormView.style.display = 'none';
        if(modalFlashcardView) modalFlashcardView.style.display = 'block';
        if(modalNavigation) modalNavigation.style.display = 'flex'; 
        cardBeingEditedId = null;
        // Optionally, re-display the card to ensure it's not showing stale (flipped) state if that's an issue
        // const topic = topics.find(t => t.id === currentModalTopicId);
        // if (topic && topic.flashcards && topic.flashcards[currentModalCardIndex]) {
        //    displayCardInModal(currentModalTopicId, topic.flashcards[currentModalCardIndex].id);
        // }
    }
    // --- End Edit Mode Functions ---

    // --- Save Edit Function ---
    function saveEditFlashcard() {
        if (!cardBeingEditedId || currentModalTopicId === null) {
            alert('Error: No card selected for editing or topic context lost.');
            // Optionally, reset view
            if(modalEditFormView) modalEditFormView.style.display = 'none';
            if(modalFlashcardView) modalFlashcardView.style.display = 'block';
            if(modalNavigation) modalNavigation.style.display = 'flex';
            return;
        }

        const newQuestion = editQuestionInput.value.trim();
        const newAnswer = editAnswerInput.value.trim();

        if (!newQuestion || !newAnswer) {
            alert('Please provide both a question and an answer.');
            return;
        }

        const topic = topics.find(t => t.id === currentModalTopicId);
        if (!topic) {
            alert('Error: Topic not found.');
            return;
        }

        const cardIndex = topic.flashcards.findIndex(fc => fc.id === cardBeingEditedId);
        if (cardIndex === -1) {
            alert('Error: Card not found for saving.');
            return;
        }

        // Update the card data
        topic.flashcards[cardIndex].question = newQuestion;
        topic.flashcards[cardIndex].answer = newAnswer;

        saveDataToLocalStorage(); // Persist changes

        // Reset editing state
        const savedCardId = cardBeingEditedId; // Store before resetting
        cardBeingEditedId = null; 
        
        // Hide edit form, show card view (displayCardInModal will handle this too)
        // modalEditFormView.style.display = 'none';
        // modalFlashcardView.style.display = 'block';
        // modalNavigation.style.display = 'flex';

        // Refresh the displayed card in the modal to show the saved changes
        displayCardInModal(currentModalTopicId, savedCardId); 
        
        // Re-render grid flashcards if a topic is selected in the main view
        // currentTopicId is the index of the selected topic in the main list
        // We need to ensure it's valid and corresponds to the currentModalTopicId
        const selectedGridTopicIndex = topics.findIndex(t => t.id === currentModalTopicId);
        if (selectedGridTopicIndex !== -1 && currentTopicId === selectedGridTopicIndex) {
             renderFlashcards(currentTopicId);
        }

        alert('Flashcard updated successfully!'); // Optional feedback
    }
    // --- End Save Edit Function ---

    // Add event listener for save edit button
    if(saveEditBtn) saveEditBtn.addEventListener('click', saveEditFlashcard);
    
    // --- Delete Flashcard Function ---
    function deleteFlashcard() {
        if (currentModalTopicId === null || currentModalCardIndex === -1) {
            alert('No card selected to delete.');
            return;
        }

        const topic = topics.find(t => t.id === currentModalTopicId);
        if (!topic) {
            alert('Error: Topic not found.');
            return;
        }
        
        const cardToDelete = topic.flashcards[currentModalCardIndex];

        if (!confirm(`Are you sure you want to delete the flashcard: "${cardToDelete.question.substring(0, 50)}..."?`)) {
            return; // User cancelled
        }

        // Remove the card from the array
        topic.flashcards.splice(currentModalCardIndex, 1);
    saveDataToLocalStorage(); // Persist changes

        alert('Flashcard deleted.');

        const topicIdxInTopicsArray = topics.findIndex(t => t.id === currentModalTopicId);

        closeModal(); // Close the modal first

        // Refresh the grid view for the current topic
        renderTopics(); // Re-render topics in case a topic becomes empty or for future topic deletion logic

        // Try to re-select the same topic in the grid, if it still exists
        if (topicIdxInTopicsArray !== -1 && topics[topicIdxInTopicsArray]) {
            // The 'currentTopicId' global variable holds the *index* of the topic selected in the main view.
            // We need to find the DOM element for the topic that was being viewed in the modal.
            const topicLiToReselect = document.querySelector(`#topic-list-container li[data-topic-id='${topicIdxInTopicsArray}']`);

            if (topicLiToReselect) {
                // If the currently selected topic in the grid (currentTopicId / index)
                // is the same as the one from which the card was deleted, click it to refresh its flashcards.
                // Otherwise, if a different topic is selected in the grid, its view is already correct.
                if (currentTopicId === topicIdxInTopicsArray) {
                     topicLiToReselect.click(); 
                } else {
                    // If the deleted card's topic is NOT the one selected in the grid,
                    // we still need to ensure the grid view of the deleted card's topic is updated
                    // if the user later clicks on it. renderFlashcards for the *currently selected*
                    // grid topic is implicitly handled if its LI element is clicked.
                    // If no topic is selected, or a different one, then the main grid view is fine.
                    // If the deleted card was from the currently selected topic in grid, its renderFlashcards will be triggered.
                    // This logic seems fine.
                }
            } else {
                // The topic LI element is no longer found (e.g., if topics could be deleted)
                // or if the topic list was drastically changed by renderTopics.
                // Reset the flashcard display.
                renderFlashcards(null);
            }
        } else {
            // Topic itself was deleted or index is now out of bounds.
            renderFlashcards(null);
        }
    }
    // --- End Delete Flashcard Function ---
    if(modalDeleteBtn) modalDeleteBtn.addEventListener('click', deleteFlashcard);
});
