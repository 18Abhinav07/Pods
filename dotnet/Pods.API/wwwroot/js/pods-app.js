// Interactive DOM Manipulation & Fetch API Client for Pods
document.addEventListener("DOMContentLoaded", function () {
    // 1. Pod Search Filter in Table (DOM manipulation)
    const searchInput = document.getElementById("podSearchInput");
    if (searchInput) {
        searchInput.addEventListener("input", function (e) {
            const query = e.target.value.toLowerCase();
            const rows = document.querySelectorAll("#podsTable tbody tr.pod-row");
            rows.forEach(row => {
                const nameCell = row.querySelector(".pod-name");
                if (nameCell) {
                    const text = nameCell.textContent.toLowerCase();
                    row.style.display = text.includes(query) ? "" : "none";
                }
            });
        });
    }

    // 2. AI Advisor Async Fetching
    const aiBtn = document.getElementById("btnRefreshAiAdvice");
    const aiText = document.getElementById("aiAdviceText");
    if (aiBtn && aiText) {
        aiBtn.addEventListener("click", async function () {
            aiText.textContent = "Querying Azure OpenAI model for behavioral feedback...";
            aiBtn.disabled = true;

            try {
                const demoUserId = "11111111-1111-1111-1111-111111111111";
                const response = await fetch(`/api/AiAdvisor/coaching/${demoUserId}`);
                if (response.ok) {
                    const data = await response.json();
                    aiText.innerHTML = `<strong>${data.summary}</strong><br/><span class="text-success">${data.motivationalMessage}</span><br/><small class="text-muted">Confidence: ${data.predictedSuccessScore}%</small>`;
                } else {
                    aiText.textContent = "Unable to fetch AI coaching advice at this moment.";
                }
            } catch (err) {
                aiText.textContent = "Error connecting to AI service.";
                console.error(err);
            } finally {
                aiBtn.disabled = false;
            }
        });
    }

    // 3. Check-In Submission AJAX Handlers
    const submitBtn = document.getElementById("btnSubmitCheckInAjax");
    const checkInNotes = document.getElementById("checkInNotes");
    const alertBox = document.getElementById("checkInAlert");

    if (submitBtn && checkInNotes && alertBox) {
        submitBtn.addEventListener("click", async function () {
            const notes = checkInNotes.value.trim();
            if (!notes) {
                alertBox.className = "alert alert-warning";
                alertBox.textContent = "Please provide notes describing your progress.";
                alertBox.classList.remove("d-none");
                return;
            }

            submitBtn.disabled = true;
            submitBtn.textContent = "Uploading to Azure...";

            try {
                const demoCommitmentId = "22222222-2222-2222-2222-222222222222";
                const demoUserId = "11111111-1111-1111-1111-111111111111";

                const payload = {
                    commitmentId: demoCommitmentId,
                    notes: notes,
                    evidenceFileBase64: null,
                    evidenceFileName: null,
                    evidenceContentType: null
                };

                const res = await fetch(`/api/CheckIns?userId=${demoUserId}`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(payload)
                });

                if (res.ok) {
                    alertBox.className = "alert alert-success";
                    alertBox.textContent = "Check-in verified! Streak incremented successfully.";
                    alertBox.classList.remove("d-none");
                    setTimeout(() => {
                        window.location.reload();
                    }, 1200);
                } else {
                    const err = await res.text();
                    alertBox.className = "alert alert-danger";
                    alertBox.textContent = "Failed: " + err;
                    alertBox.classList.remove("d-none");
                }
            } catch (e) {
                alertBox.className = "alert alert-danger";
                alertBox.textContent = "Submission error: " + e.message;
                alertBox.classList.remove("d-none");
            } finally {
                submitBtn.disabled = false;
                submitBtn.textContent = "Submit Check-In";
            }
        });
    }
});
