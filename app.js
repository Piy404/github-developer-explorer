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
    const profileCard = document.getElementById("profile-card");

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
            if (profileCard) {
                profileCard.innerHTML = "";
            }

            // Show loading spinner
            if (loadingSpinner) {
                loadingSpinner.style.display = "block";
            }

            try {
                const data = await fetchGitHubData(username);
                console.log("GitHub data loaded successfully:", data);
                
                renderProfile(data.user);
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

/**
 * Renders the user profile card dynamically inside #profile-card
 * @param {Object} userData - GitHub user profile object
 */
function renderProfile(userData) {
    const profileCard = document.getElementById("profile-card");
    if (!profileCard) return;

    profileCard.innerHTML = `
        <div class="profile-info" style="display: flex; flex-direction: column; align-items: center; text-align: center; gap: 16px;">
            <img src="${userData.avatar_url}" alt="${userData.name || userData.login}" class="profile-avatar" style="width: 120px; height: 120px; border-radius: 50%; border: 1px solid var(--border-color); object-fit: cover;">
            <div class="profile-names">
                <h2 class="profile-name" style="font-size: 1.3rem; font-weight: 700;">${userData.name || userData.login}</h2>
                <p class="profile-username" style="color: var(--text-muted); font-size: 0.95rem;">@${userData.login}</p>
            </div>
            <p class="profile-bio" style="font-size: 0.9rem; line-height: 1.4; color: var(--text-color);">${userData.bio || "No bio available"}</p>
            <div class="profile-stats" style="display: flex; justify-content: space-around; width: 100%; padding: 12px 0; border-top: 1px solid var(--border-color); border-bottom: 1px solid var(--border-color); font-size: 0.9rem;">
                <span class="stat-followers"><strong>${userData.followers}</strong> Followers</span>
                <span class="stat-following"><strong>${userData.following}</strong> Following</span>
            </div>
            <a href="${userData.html_url}" target="_blank" rel="noopener noreferrer" class="btn" style="width: 100%; text-align: center; text-decoration: none;">View GitHub Profile</a>
        </div>
    `;
}
