async function fetchGitHubData(username) {
    const userUrl = `https://api.github.com/users/${username}`;
    const reposUrl = `https://api.github.com/users/${username}/repos?per_page=100`;

    try {
        const [userRes, reposRes] = await Promise.all([
            fetch(userUrl),
            fetch(reposUrl)
        ]);

        if (userRes.status === 403 || userRes.status === 429 || reposRes.status === 403 || reposRes.status === 429) {
            throw new Error("GitHub API Rate Limit Exceeded. Please try again later.");
        }

        if (!userRes.ok) {
            throw new Error(`User profile fetch failed with status: ${userRes.status}`);
        }
        if (!reposRes.ok) {
            throw new Error(`Repositories fetch failed with status: ${reposRes.status}`);
        }

        const userData = await userRes.json();
        const reposData = await reposRes.json();

        return { user: userData, repos: reposData };
    } catch (error) {
        throw error;
    }
}

document.addEventListener("DOMContentLoaded", () => {
    const searchForm = document.getElementById("search-form");
    const usernameInput = document.getElementById("username-input");
    const loadingSpinner = document.getElementById("loading-spinner");
    const errorDisplay = document.getElementById("error-display");
    const profileContainer = document.getElementById("profile-container");

    if (searchForm) {
        searchForm.addEventListener("submit", async (e) => {
            e.preventDefault();

            const username = usernameInput.value.trim();
            if (username === "") return;

            // Clear previous UI states
            if (errorDisplay) {
                errorDisplay.style.display = "none";
                errorDisplay.textContent = "";
            }
            if (profileContainer) {
                profileContainer.innerHTML = "";
            }

            // Show loading spinner
            if (loadingSpinner) {
                loadingSpinner.style.display = "block";
            }

            try {
                const data = await fetchGitHubData(username);
                console.log("GitHub data loaded successfully:", data);
                
                // Show simple success message
                if (profileContainer) {
                    profileContainer.innerHTML = `
                        <div class="success-message" style="text-align: center; padding: 20px; font-weight: 500; color: #1a7f37;">
                            Successfully fetched developer details for @${data.user.login} (${data.repos.length} repositories)!
                        </div>
                    `;
                }
            } catch (error) {
                console.error("Fetch failed:", error);
                if (errorDisplay) {
                    errorDisplay.textContent = error.message || "An unexpected error occurred.";
                    errorDisplay.style.display = "block";
                }
            } finally {
                // Hide loading spinner
                if (loadingSpinner) {
                    loadingSpinner.style.display = "none";
                }
            }
        });
    }
});
