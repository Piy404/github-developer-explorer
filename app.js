let currentRepos = [];

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
    const sortSelect = document.getElementById("sort-select");
    const welcomeContainer = document.getElementById("welcome-container");
    const logo = document.querySelector(".logo");

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
            
            // Also clear repository list
            const repoList = document.getElementById("repo-list");
            if (repoList) {
                repoList.innerHTML = "";
            }

            // Hide welcome container when search starts
            if (welcomeContainer) {
                welcomeContainer.classList.add("hidden");
            }

            // Hide grid layout during loading
            const gridLayout = document.querySelector(".grid-layout");
            if (gridLayout) {
                gridLayout.classList.remove("active");
            }

            // Show loading spinner
            if (loadingSpinner) {
                loadingSpinner.style.display = "block";
            }

            try {
                const data = await fetchGitHubData(username);
                console.log("GitHub data loaded successfully:", data);
                
                if (gridLayout) {
                    gridLayout.classList.add("active");
                }
                
                renderProfile(data.user);
                currentRepos = data.repos;
                sortAndRenderRepos();
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

    // Set up click events for suggested developers
    const developerCards = document.querySelectorAll(".developer-card");
    developerCards.forEach(card => {
        card.addEventListener("click", () => {
            const username = card.getAttribute("data-username");
            if (username && usernameInput) {
                usernameInput.value = username;
                if (searchForm) {
                    const event = new Event("submit", { cancelable: true });
                    searchForm.dispatchEvent(event);
                }
            }
        });
    });

    // Reset view to landing page when logo is clicked
    if (logo) {
        logo.addEventListener("click", () => {
            if (usernameInput) {
                usernameInput.value = "";
            }
            if (errorDisplay) {
                errorDisplay.style.display = "none";
                errorDisplay.textContent = "";
            }
            if (loadingSpinner) {
                loadingSpinner.style.display = "none";
            }
            
            const gridLayout = document.querySelector(".grid-layout");
            if (gridLayout) {
                gridLayout.classList.remove("active");
            }

            if (welcomeContainer) {
                welcomeContainer.classList.remove("hidden");
            }
            
            currentRepos = [];
        });
    }

    if (sortSelect) {
        sortSelect.addEventListener("change", () => {
            sortAndRenderRepos();
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

/**
 * Renders the repositories list dynamically inside #repo-list
 * @param {Array} reposArray - Array of GitHub repository objects
 */
function renderRepos(reposArray) {
    const repoList = document.getElementById("repo-list");
    if (!repoList) return;

    repoList.innerHTML = "";

    if (!reposArray || reposArray.length === 0) {
        repoList.innerHTML = `
            <div class="no-repos" style="text-align: center; padding: 40px; color: var(--text-muted);">
                No public repositories found.
            </div>
        `;
        return;
    }

    const container = document.createElement("div");
    container.style.display = "flex";
    container.style.flexDirection = "column";
    container.style.gap = "16px";

    reposArray.forEach(repo => {
        const repoCard = document.createElement("div");
        repoCard.className = "card repo-card";
        repoCard.style.display = "flex";
        repoCard.style.flexDirection = "column";
        repoCard.style.gap = "10px";
        repoCard.style.padding = "20px";
        repoCard.style.borderRadius = "var(--border-radius)";
        repoCard.style.border = "1px solid var(--border-color)";
        repoCard.style.boxShadow = "var(--box-shadow)";
        repoCard.style.backgroundColor = "var(--card-bg)";

        const nameHTML = `<a href="${repo.html_url}" target="_blank" rel="noopener noreferrer" style="font-weight: 700; color: var(--primary-color); font-size: 1.1rem; text-decoration: none; width: fit-content;">${repo.name}</a>`;
        const descHTML = `<p style="font-size: 0.9rem; color: var(--text-muted); line-height: 1.4; margin: 4px 0;">${repo.description || "No description available."}</p>`;
        
        const stars = repo.stargazers_count || 0;
        const forks = repo.forks_count || 0;
        const language = repo.language || "Unknown";

        const statsHTML = `
            <div style="display: flex; gap: 16px; font-size: 0.85rem; color: var(--text-muted); font-weight: 500;">
                <span style="display: flex; align-items: center; gap: 4px;">⭐ ${stars}</span>
                <span style="display: flex; align-items: center; gap: 4px;">🍴 ${forks}</span>
                <span style="display: flex; align-items: center; gap: 4px;">💻 ${language}</span>
            </div>
        `;

        repoCard.innerHTML = `
            ${nameHTML}
            ${descHTML}
            ${statsHTML}
        `;
        container.appendChild(repoCard);
    });

    repoList.appendChild(container);
}

/**
 * Sorts currentRepos array based on dropdown value and re-renders them
 */
function sortAndRenderRepos() {
    const sortSelect = document.getElementById("sort-select");
    if (!sortSelect || !currentRepos) return;

    const sortBy = sortSelect.value;

    if (sortBy === "stars") {
        currentRepos.sort((a, b) => b.stargazers_count - a.stargazers_count);
    } else if (sortBy === "forks") {
        currentRepos.sort((a, b) => b.forks_count - a.forks_count);
    } else if (sortBy === "recent") {
        currentRepos.sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at));
    }

    renderRepos(currentRepos);
}
