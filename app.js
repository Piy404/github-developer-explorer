async function fetchGitHubData(username) {
    const userUrl = `https://api.github.com/users/${username}`;
    const reposUrl = `https://api.github.com/users/${username}/repos?per_page=100`;

    const [userRes, reposRes] = await Promise.all([
        fetch(userUrl),
        fetch(reposUrl)
    ]);

    const userData = await userRes.json();
    const reposData = await reposRes.json();

    return { user: userData, repos: reposData };
}
