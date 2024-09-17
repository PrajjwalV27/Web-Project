let selectedPlayers = [];
let teamFiles = {};
let outPlayers = new Map();
let lastOutPlayer = null;

function showTeamsList() {
    document.getElementById('folder-container').style.display = 'none';
    document.getElementById('teams-list').style.display = 'flex';
}

function selectTeam(file, teamName) {
    if (!teamFiles[teamName]) {
        teamFiles[teamName] = file;

        if (Object.keys(teamFiles).length === 2) {
            document.getElementById('teams-list').style.display = 'none';
            document.getElementById('team-boxes').style.display = 'flex';
            loadTeams();
        }
    } else {
        alert('Team already selected');
    }
}

function loadTeams() {
    const teamNames = Object.keys(teamFiles);

    teamNames.forEach((teamName, index) => {
        loadTeam(teamFiles[teamName], index + 1);
        document.getElementById(`team${index + 1}-box`).querySelector('h2').textContent = teamName;
    });
}

function loadTeam(file, teamNumber) {
    fetch(file)
        .then(response => response.text())
        .then(data => {
            const players = data.split('\n').filter(name => name.trim() !== '');
            const playerList = document.getElementById(`team${teamNumber}-players`);
            playerList.innerHTML = '';

            players.forEach(player => {
                const listItem = document.createElement('li');
                listItem.textContent = player;
                listItem.setAttribute('data-team', teamNumber);
                listItem.onclick = () => selectPlayer(listItem);
                playerList.appendChild(listItem);
            });
        })
        .catch(error => console.error('Error loading team:', error));
}

function selectPlayer(element) {
    const team = element.getAttribute('data-team');
    const player = element.textContent;

    if (outPlayers.has(player)) {
        alert('Player has already been marked out');
        return;
    }

    if (selectedPlayers.length === 0) {
        selectedPlayers.push({ player, team, element });
        element.style.backgroundColor = '#add8e6'; // Highlight the selected player
    } else if (selectedPlayers.length === 1 && selectedPlayers[0].team !== team) {
        const [selectedPlayer] = selectedPlayers;
        const outByPlayer = player;

        // Ensure the selected player has not been out by anyone else
        if (outPlayers.has(selectedPlayer.player)) {
            alert(`${selectedPlayer.player} has already been out by someone else`);
            resetSelection();
            return;
        }

        const resultList = document.getElementById('result-list');
        const listItem = document.createElement('li');
        listItem.textContent = `${selectedPlayer.player} was out by ${outByPlayer}`;
        resultList.appendChild(listItem);

        outPlayers.set(selectedPlayer.player, outByPlayer);

        lastOutPlayer = selectedPlayer.player;

        drawLineBetweenPlayers(selectedPlayer.element, element);

        // Reset the selection
        resetSelection();
    } else {
        // Clicked on the same team again, reset the selection
        resetSelection();
    }

    // Display the result box if it's not already visible
    document.getElementById('result-box').style.display = 'block';
}

function resetSelection() {
    selectedPlayers = [];

    // Remove highlight from all players
    document.querySelectorAll('li').forEach(item => {
        item.style.backgroundColor = '';
    });

    // Clear the canvas
    const canvas = document.getElementById('line-canvas');
    const context = canvas.getContext('2d');
    context.clearRect(0, 0, canvas.width, canvas.height);
}


function undoLastOut() {
    if (lastOutPlayer) {
        // Find the player who marked the last out player
        const outBy = [...outPlayers.entries()].find(([player, outBy]) => player === lastOutPlayer)[1];

        if (outBy) {
            outPlayers.delete(lastOutPlayer);
            outPlayers.delete(outBy);

            // Remove the last out player's entry from the result list
            const resultList = document.getElementById('result-list');
            const items = resultList.querySelectorAll('li');
            items.forEach(item => {
                if (item.textContent.includes(lastOutPlayer) || item.textContent.includes(outBy)) {
                    resultList.removeChild(item);
                }
            });

            // Clear the canvas
            const canvas = document.getElementById('line-canvas');
            const context = canvas.getContext('2d');
            context.clearRect(0, 0, canvas.width, canvas.height);

            resetSelection();

            lastOutPlayer = null;
        } else {
            alert('No out player to undo');
        }
    } else {
        alert('No out player to undo');
    }
}