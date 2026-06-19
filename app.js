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
