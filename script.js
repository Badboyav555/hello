/* =====================================
   AUTHENTICATION (Login & Signup)
===================================== */

// Check if user is logged in (Call this on protected pages)
async function checkAuth() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        window.location.href = "index.html"; // Redirect to login if not authenticated
        return null;
    }
    return user;
}

function openLogin() { document.getElementById("loginOverlay").style.display = "flex"; }
function closeLogin() { document.getElementById("loginOverlay").style.display = "none"; }

async function login(event) {
    event.preventDefault();
    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;

    if (email && password) {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        
        if (error) {
            // If user doesn't exist, sign them up
            const { data: signUpData, error: signUpError } = await supabase.auth.signUp({ email, password });
            if (signUpError) {
                alert("Error: " + signUpError.message);
                return;
            }
            alert("Account created! Welcome to LearnLoop 🚀");
        } else {
            alert("Login successful! Welcome back 🚀");
        }
        window.location.href = "onboarding.html";
    }
}

// Logout Function (Add a logout button in HTML if needed)
async function logout() {
    await supabase.auth.signOut();
    window.location.href = "index.html";
}

/* =====================================
   ONBOARDING
===================================== */

function selectSubject(button) { button.classList.toggle("selected"); }

function selectTime(button) {
    document.querySelectorAll(".time-btn").forEach(btn => btn.classList.remove("selected"));
    button.classList.add("selected");
}

async function saveOnboarding() {
    const user = await checkAuth();
    if (!user) return;

    const year = document.getElementById("year").value;
    const branch = document.getElementById("branch").value;
    const goal = document.getElementById("goal").value;
    const selectedSubjects = document.querySelectorAll(".selection-btn.selected");
    const selectedTime = document.querySelector(".time-btn.selected");

    if (year === "" || branch === "" || goal === "" || selectedSubjects.length === 0 || !selectedTime) {
        alert("Please complete all sections before continuing.");
        return;
    }

    // 1. Update User Profile
    const { error: profileError } = await supabase
        .from("profiles")
        .update({ 
            year: parseInt(year), 
            branch: branch, 
            main_goal: goal, 
            daily_study_time: selectedTime.innerText 
        })
        .eq("id", user.id);

    if (profileError) { console.error(profileError); alert("Error saving profile."); return; }

    // 2. Save Selected Subjects (Fetch subject IDs first)
    for (const btn of selectedSubjects) {
        const subjectName = btn.innerText.split(" ").slice(1).join(" "); // Removes emoji
        const { data: subjectData } = await supabase.from("subjects").select("id").eq("name", subjectName).single();
        
        if (subjectData) {
            await supabase.from("user_subjects").insert({
                user_id: user.id,
                subject_id: subjectData.id
            });
        }
    }

    // Log Activity
    await supabase.from("activity_logs").insert({
        user_id: user.id,
        activity_type: "onboarding_completed",
        description: "Completed onboarding"
    });

    alert("Great! Your learning journey is personalized 🎯");
    window.location.href = "dashboard.html";
}

/* =====================================
   DASHBOARD
===================================== */

async function loadDashboard() {
    const user = await checkAuth();
    if (!user) return;

    // Fetch User Data
    const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single();
    
    if (profile) {
        document.getElementById("studentName").innerText = profile.email.split("@")[0] || "Student";
        document.getElementById("streakCount").innerText = profile.streak_count || 0;
        // Update other stats here (Lessons, Accuracy, Time) based on DB data
    }
}

function goToLearn() { window.location.href = "learn.html"; }
function startChallenge() { window.location.href = "challenge.html"; }
function askAI() { window.location.href = "ai.html"; }
function examMode() { window.location.href = "exam.html"; }

/* =====================================================
   LEARN PAGE
===================================================== */

async function loadLearnPage() {
    // Fetch subjects from DB and render dynamically if needed
    // For now, hardcoded in HTML, but we can fetch topics
}

function showTopics(subject) {
    const topicTitle = document.getElementById("topicTitle");
    if (subject === "mathematics") topicTitle.innerText = "Engineering Mathematics";
    else if (subject === "physics") topicTitle.innerText = "Engineering Physics";
    else if (subject === "programming") topicTitle.innerText = "Programming";

    document.getElementById("topicsSection").scrollIntoView({ behavior: "smooth" });
}

function openLearning(topic) {
    document.getElementById("popupIcon").innerText = "📖";
    document.getElementById("popupTitle").innerText = "Learning: " + topic;
    document.getElementById("popupMessage").innerText = "Loading lesson for " + topic + "...";
    document.getElementById("learnPopup").style.display = "flex";
    // Here you can fetch topic content from DB: supabase.from("topics").select("*").eq("name", topic).single()
}

function openNotes(topic) {
    document.getElementById("popupIcon").innerText = "📝";
    document.getElementById("popupTitle").innerText = "Handwritten Notes";
    document.getElementById("popupMessage").innerText = "Fetching notes for " + topic + "...";
    document.getElementById("learnPopup").style.display = "flex";
    // Fetch notes from DB
}

function showResourceMessage() {
    document.getElementById("popupIcon").innerText = "🎥";
    document.getElementById("popupTitle").innerText = "Learning Resources";
    document.getElementById("popupMessage").innerText = "Loading videos...";
    document.getElementById("learnPopup").style.display = "flex";
}

function goToPractice() { alert("Practice section will be connected soon! 🧠"); }
function closeLearnPopup() { document.getElementById("learnPopup").style.display = "none"; }

/* =====================================================
   AI STUDY ASSISTANT
===================================================== */

function quickQuestion(question) { document.getElementById("aiQuestion").value = question; }

async function askLearnLoopAI() {
    const user = await checkAuth();
    if (!user) return;

    const question = document.getElementById("aiQuestion").value.trim();
    const subjectName = document.getElementById("aiSubject").value;

    if (subjectName === "") { alert("Please select a subject first."); return; }
    if (question === "") { alert("Please enter your question."); return; }

    let answer = "";

    // Mock AI Logic (Later replace with OpenAI API)
    if (question.toLowerCase().includes("matrix")) {
        answer = "A matrix is a rectangular arrangement of numbers...";
    } else if (question.toLowerCase().includes("eigenvalue")) {
        answer = "An eigenvalue is a special value associated with a square matrix...";
    } else {
        answer = "Great question! LearnLoop AI will provide detailed explanations soon.";
    }

    document.getElementById("responseText").innerText = answer;
    document.getElementById("aiResponse").style.display = "block";

    // Save to Database
    const { data: subjectData } = await supabase.from("subjects").select("id").eq("name", subjectName).single();
    
    if (subjectData) {
        await supabase.from("ai_chat_history").insert({
            user_id: user.id,
            subject_id: subjectData.id,
            question: question,
            answer: answer
        });

        // Log Activity
        await supabase.from("activity_logs").insert({
            user_id: user.id,
            activity_type: "ai_asked",
            description: "Asked AI: " + question
        });
    }
}

function explainSimply() { document.getElementById("responseText").innerText = "Breaking it down step-by-step..."; }
function giveExample() { document.getElementById("responseText").innerText = "Here is a real-world example..."; }
function givePractice() { document.getElementById("responseText").innerText = "Practice Question: Try solving..."; }

/* =====================================================
   DAILY CHALLENGE
===================================================== */

let challengeQuestions = []; // Will fetch from DB
let currentQuestion = 0, score = 0, selectedAnswer = null, timeLeft = 300, timerInterval;

async function startQuiz() {
    const user = await checkAuth();
    if (!user) return;

    // Fetch 5 random questions from Database
    const { data, error } = await supabase.from("questions").select("*").limit(5);
    
    if (error || !data || data.length === 0) {
        alert("No questions found in the database. Please add questions first!");
        return;
    }

    challengeQuestions = data.map(q => ({
        subject: "General", // You can fetch subject name via join if needed
        question: q.question_text,
        options: q.options,
        answer: q.correct_answer_index
    }));

    currentQuestion = 0; score = 0; selectedAnswer = null; timeLeft = 300;
    document.getElementById("quizCard").style.display = "block";
    document.getElementById("resultCard").style.display = "none";
    
    loadQuestion();
    startTimer();
}

function loadQuestion() {
    const question = challengeQuestions[currentQuestion];
    document.getElementById("questionNumber").innerText = "Question " + (currentQuestion + 1) + " of " + challengeQuestions.length;
    document.getElementById("questionSubject").innerText = question.subject;
    document.getElementById("questionText").innerText = question.question;

    const optionsContainer = document.getElementById("optionsContainer");
    optionsContainer.innerHTML = "";

    question.options.forEach(function(option, index) {
        const button = document.createElement("button");
        button.className = "option-btn";
        button.innerText = String.fromCharCode(65 + index) + ". " + option;
        button.onclick = function() { selectAnswer(index, button); };
        optionsContainer.appendChild(button);
    });

    document.getElementById("answerFeedback").innerText = "";
    selectedAnswer = null;
    const progress = ((currentQuestion + 1) / challengeQuestions.length) * 100;
    document.getElementById("quizProgress").style.width = progress + "%";
}

function selectAnswer(index, button) {
    if (selectedAnswer !== null) return;
    selectedAnswer = index;
    const question = challengeQuestions[currentQuestion];
    const allOptions = document.querySelectorAll(".option-btn");

    allOptions.forEach(function(optionButton) { optionButton.disabled = true; });

    if (index === question.answer) {
        button.classList.add("correct");
        score++;
        document.getElementById("answerFeedback").innerText = "✅ Correct! Great job!";
        document.getElementById("answerFeedback").style.color = "#16a34a";
    } else {
        button.classList.add("wrong");
        allOptions[question.answer].classList.add("correct");
        document.getElementById("answerFeedback").innerText = "❌ Not quite. Correct is " + question.options[question.answer] + ".";
        document.getElementById("answerFeedback").style.color = "#dc2626";
    }
}

function nextQuestion() {
    if (selectedAnswer === null) { alert("Please select an answer first."); return; }
    if (currentQuestion < challengeQuestions.length - 1) { currentQuestion++; loadQuestion(); } 
    else { finishQuiz(); }
}

async function finishQuiz() {
    clearInterval(timerInterval);
    document.getElementById("quizCard").style.display = "none";
    document.getElementById("resultCard").style.display = "block";

    const total = challengeQuestions.length;
    const wrong = total - score;
    const accuracy = Math.round((score / total) * 100);

    document.getElementById("finalScore").innerText = score + "/" + total;
    document.getElementById("correctAnswers").innerText = score;
    document.getElementById("wrongAnswers").innerText = wrong;
    document.getElementById("accuracy").innerText = accuracy + "%";

    // Save Attempt to Database
    const user = await checkAuth();
    if (user) {
        await supabase.from("quiz_attempts").insert({
            user_id: user.id,
            total_questions: total,
            correct_answers: score,
            wrong_answers: wrong,
            accuracy: accuracy,
            attempt_type: "daily_challenge"
        });

        await supabase.from("activity_logs").insert({
            user_id: user.id,
            activity_type: "challenge_completed",
            description: "Completed Daily Challenge: " + score + "/" + total
        });

        // Update User Profile Accuracy (Simple average logic)
        await supabase.rpc('update_user_accuracy', { user_id: user.id }); 
        // Note: You'll need to create this RPC function in Supabase, or fetch all attempts, calc average, and update profile here.
    }
}

function startTimer() {
    clearInterval(timerInterval);
    timerInterval = setInterval(function() {
        if (timeLeft <= 0) { clearInterval(timerInterval); finishQuiz(); return; }
        timeLeft--;
        const minutes = Math.floor(timeLeft / 60);
        const seconds = timeLeft % 60;
        document.getElementById("timer").innerText = "⏱️ " + String(minutes).padStart(2, "0") + ":" + String(seconds).padStart(2, "0");
    }, 1000);
}

function restartQuiz() { startQuiz(); }

/* =========================================
   EXAM MODE
========================================= */

function selectExamSubject(button, subject) {
    document.querySelectorAll(".exam-subject").forEach(btn => btn.classList.remove("active"));
    button.classList.add("active");
}

function showRevision(type) {
    const overlay = document.getElementById("revisionOverlay");
    const title = document.getElementById("revisionTitle");
    const text = document.getElementById("revisionText");

    if (type === "formulas") { title.innerText = "📐 Important Formulas"; text.innerText = "Formula revision..."; }
    else if (type === "concepts") { title.innerText = "💡 Key Concepts"; text.innerText = "Important concepts..."; }
    else if (type === "mistakes") { title.innerText = "⚠️ Common Mistakes"; text.innerText = "Common mistakes..."; }

    overlay.style.display = "flex";
}

function closeRevision() { document.getElementById("revisionOverlay").style.display = "none"; }
function startExamPractice() { window.location.href = "challenge.html"; }

/* =========================================
   PROFILE & PROGRESS
========================================= */

function showProfileMessage() { document.getElementById("profileOverlay").style.display = "flex"; }
function closeProfileMessage() { document.getElementById("profileOverlay").style.display = "none"; }

// Run on page load
if (document.getElementById("quizCard")) { startQuiz(); }
if (document.getElementById("studentName")) { loadDashboard(); }
