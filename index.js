// DOM Elements
var input = document.querySelector('.search-input');
var btn = document.querySelector('.btn');
var message = document.querySelector('.message');
var cardLeft = document.querySelector('.cardLeft');
var cardRight = document.querySelector('.cardRight');
var themeToggle = document.querySelector('.theme-toggle');
var searchHistory = document.querySelector('.search-history');
var lastSearched = document.querySelector('.last-searched');
var tabsContainer = document.querySelector('.tabs-container');
var repoList = document.querySelector('.repo-list');
var pinnedList = document.querySelector('.pinned-list');
var gistsList = document.querySelector('.gists-list');
var prevBtn = document.querySelector('.prev-btn');
var nextBtn = document.querySelector('.next-btn');
var pageInfo = document.querySelector('.page-info');
var toastContainer = document.querySelector('.toast-container');
var welcomeBanner = document.querySelector('.welcome-banner');
var closeBanner = document.querySelector('.close-banner');

// Global Variables
var currentUser = '';
var currentPage = 1;
var totalRepos = 0;
var perPage = 30;

// Initialize App
function initApp() {
  loadTheme();
  loadSearchHistory();
  showWelcomeBanner();
}

// Theme Toggle
function loadTheme() {
  var theme = localStorage.getItem('theme') || 'light';
  document.documentElement.setAttribute('data-theme', theme);
}

function toggleTheme() {
  var currentTheme = document.documentElement.getAttribute('data-theme');
  var newTheme = currentTheme === 'light' ? 'dark' : 'light';
  document.documentElement.setAttribute('data-theme', newTheme);
  localStorage.setItem('theme', newTheme);
  showToast('Theme changed to ' + newTheme + ' mode', 'success');
}

// Search History
function loadSearchHistory() {
  var history = JSON.parse(localStorage.getItem('searchHistory') || '[]');
  searchHistory.innerHTML = '<option value="">-- Select from history --</option>';

  history.forEach(function (username) {
    var option = document.createElement('option');
    option.value = username;
    option.textContent = username;
    searchHistory.appendChild(option);
  });
}

function addToSearchHistory(username) {
  var history = JSON.parse(localStorage.getItem('searchHistory') || '[]');

  // Remove if already exists
  history = history.filter(function (user) {
    return user !== username;
  });

  // Add to beginning
  history.unshift(username);

  // Keep only last 5
  if (history.length > 5) {
    history = history.slice(0, 5);
  }

  localStorage.setItem('searchHistory', JSON.stringify(history));
  loadSearchHistory();
}

// Welcome Banner
function showWelcomeBanner() {
  var bannerShown = sessionStorage.getItem('welcomeBannerShown');

  if (!bannerShown) {
    welcomeBanner.classList.remove('hidden');
    sessionStorage.setItem('welcomeBannerShown', 'true');
  }
}

function closeWelcomeBanner() {
  welcomeBanner.classList.add('hidden');
}

// Toast Notifications
function showToast(messageText, type) {
  var toast = document.createElement('div');
  toast.className = 'toast ' + (type || 'success');
  toast.textContent = messageText;

  toastContainer.appendChild(toast);

  setTimeout(function () {
    toast.classList.add('hiding');
    setTimeout(function () {
      toastContainer.removeChild(toast);
    }, 300);
  }, 3000);
}

// Clear Previous Results
function clearResults() {
  cardLeft.innerHTML = '';
  cardRight.innerHTML = '';
  tabsContainer.classList.add('hidden');
}

// Create Profile Card
function createCard(data) {
  console.log(data);

  // Left Card
  var left = document.createElement('div');

  var img = document.createElement('img');
  img.setAttribute('src', data.avatar_url);
  img.setAttribute('alt', data.login + ' avatar');

  var name = document.createElement('p');
  name.textContent = data.name ? data.name : data.login;
  name.style.fontSize = '1.2rem';
  name.style.fontWeight = '600';

  var p1 = document.createElement('p');
  p1.textContent = '@' + data.login;

  var p2 = document.createElement('p');
  p2.textContent = 'Location: ' + (data.location ? data.location : 'Not available');

  var p3 = document.createElement('p');
  var datePart = data.created_at.split('T')[0];
  var parts = datePart.split('-');
  p3.textContent = 'Joined: ' + parts[2] + '-' + parts[1] + '-' + parts[0];

  var profileLink = document.createElement('a');
  profileLink.href = data.html_url;
  profileLink.target = '_blank';
  profileLink.className = 'profile-link-btn';
  profileLink.textContent = 'Profile on GitHub';

  left.appendChild(img);
  left.appendChild(name);
  left.appendChild(p1);
  left.appendChild(p2);
  left.appendChild(p3);
  left.appendChild(profileLink);

  cardLeft.appendChild(left);

  // Right Card - Stats
  var right = document.createElement('div');

  var statsContainer = document.createElement('div');
  statsContainer.className = 'stats-container';

  var followerCard = createStatCard('Followers', data.followers);
  var followingCard = createStatCard('Following', data.following);
  var repoCard = createStatCard('Repositories', data.public_repos);

  statsContainer.appendChild(followerCard);
  statsContainer.appendChild(followingCard);
  statsContainer.appendChild(repoCard);

  right.appendChild(statsContainer);

  // Bio Section
  var bioSection = document.createElement('div');
  bioSection.className = 'bio-section';

  var bioTitle = document.createElement('h3');
  bioTitle.textContent = 'Bio';

  var bioText = document.createElement('p');
  bioText.className = 'bio-text';
  bioText.textContent = data.bio ? data.bio : 'No bio available';

  bioSection.appendChild(bioTitle);
  bioSection.appendChild(bioText);

  // Add Read More if bio is long
  if (data.bio && data.bio.length > 150) {
    bioText.classList.add('truncated');

    var readMoreBtn = document.createElement('button');
    readMoreBtn.className = 'read-more-btn';
    readMoreBtn.textContent = 'Read more';

    readMoreBtn.addEventListener('click', function () {
      if (bioText.classList.contains('truncated')) {
        bioText.classList.remove('truncated');
        readMoreBtn.textContent = 'Read less';
      } else {
        bioText.classList.add('truncated');
        readMoreBtn.textContent = 'Read more';
      }
    });

    bioSection.appendChild(readMoreBtn);
  }

  right.appendChild(bioSection);
  cardRight.appendChild(right);

  // Update last searched
  lastSearched.textContent = 'Last searched: ' + data.login;

  // Store total repos
  totalRepos = data.public_repos;
}

// Create Stat Card
function createStatCard(label, value) {
  var card = document.createElement('div');
  card.className = 'stat-card';

  var labelP = document.createElement('p');
  labelP.textContent = label;

  var valueP = document.createElement('p');
  valueP.textContent = value;

  card.appendChild(labelP);
  card.appendChild(valueP);

  return card;
}

// Fetch User Data
function fetchUser(username) {
  if (!username) {
    showToast('Please enter a username', 'error');
    return;
  }

  clearResults();
  message.textContent = 'Loading...';
  message.style.color = 'blue';

  setTimeout(function () {
    fetch('https://api.github.com/users/' + username)
      .then(function (response) {
        if (response.status === 404) {
          throw new Error('User not found');
        }
        if (response.status === 403) {
          throw new Error('Rate limit exceeded. Please try again later.');
        }
        return response.json();
      })
      .then(function (data) {
        createCard(data);
        message.textContent = '';
        currentUser = username;
        addToSearchHistory(username);
        showToast('User loaded successfully', 'success');

        // Show tabs and load repositories
        tabsContainer.classList.remove('hidden');
        currentPage = 1;
        loadRepositories();
      })
      .catch(function (error) {
        message.textContent = error.message || 'Error loading user';
        message.style.color = 'red';
        showToast(error.message || 'Error loading user', 'error');
      });
  }, 1000);
}

// Load Repositories
function loadRepositories() {
  repoList.innerHTML = '<div class="skeleton skeleton-text"></div><div class="skeleton skeleton-text"></div><div class="skeleton skeleton-text"></div>';

  fetch('https://api.github.com/users/' + currentUser + '/repos?page=' + currentPage + '&per_page=' + perPage + '&sort=updated')
    .then(function (response) {
      return response.json();
    })
    .then(function (data) {
      repoList.innerHTML = '';

      if (data.length === 0) {
        var noRepos = document.createElement('p');
        noRepos.textContent = 'No repositories found';
        noRepos.style.textAlign = 'center';
        noRepos.style.color = 'var(--text-secondary)';
        repoList.appendChild(noRepos);
      } else {
        data.forEach(function (repo) {
          var repoItem = createRepoItem(repo);
          repoList.appendChild(repoItem);
        });
      }

      updatePagination();
    })
    .catch(function (error) {
      repoList.innerHTML = '<p style="color: red; text-align: center;">Error loading repositories</p>';
      console.error(error);
    });
}

// Create Repo Item
function createRepoItem(repo) {
  var item = document.createElement('div');
  item.className = 'repo-item';

  var name = document.createElement('a');
  name.href = repo.html_url;
  name.target = '_blank';
  name.className = 'repo-name';
  name.textContent = repo.name;

  var description = document.createElement('p');
  description.className = 'repo-description';
  description.textContent = repo.description || 'No description available';

  var stats = document.createElement('div');
  stats.className = 'repo-stats';

  var stars = document.createElement('span');
  stars.textContent = '⭐ ' + repo.stargazers_count;

  var forks = document.createElement('span');
  forks.textContent = '🍴 ' + repo.forks_count;

  var language = document.createElement('span');
  language.textContent = '💻 ' + (repo.language || 'N/A');

  stats.appendChild(stars);
  stats.appendChild(forks);
  stats.appendChild(language);

  item.appendChild(name);
  item.appendChild(description);
  item.appendChild(stats);

  return item;
}

// Update Pagination
function updatePagination() {
  var totalPages = Math.ceil(totalRepos / perPage);
  pageInfo.textContent = 'Page ' + currentPage + ' of ' + totalPages;

  prevBtn.disabled = currentPage === 1;
  nextBtn.disabled = currentPage >= totalPages;
}

// Load Pinned Repos
function loadPinnedRepos() {
  pinnedList.innerHTML = '<p style="text-align: center; color: var(--text-secondary);">Pinned repositories are not available via GitHub API. Please visit the user\'s profile to see pinned repos.</p>';
}

// Load Gists
function loadGists() {
  gistsList.innerHTML = '<div class="skeleton skeleton-text"></div><div class="skeleton skeleton-text"></div>';

  fetch('https://api.github.com/users/' + currentUser + '/gists')
    .then(function (response) {
      return response.json();
    })
    .then(function (data) {
      gistsList.innerHTML = '';

      if (data.length === 0) {
        var noGists = document.createElement('p');
        noGists.textContent = 'No gists found';
        noGists.style.textAlign = 'center';
        noGists.style.color = 'var(--text-secondary)';
        gistsList.appendChild(noGists);
      } else {
        data.forEach(function (gist) {
          var gistItem = createGistItem(gist);
          gistsList.appendChild(gistItem);
        });
      }
    })
    .catch(function (error) {
      gistsList.innerHTML = '<p style="color: red; text-align: center;">Error loading gists</p>';
      console.error(error);
    });
}

// Create Gist Item
function createGistItem(gist) {
  var item = document.createElement('div');
  item.className = 'repo-item';

  var name = document.createElement('a');
  name.href = gist.html_url;
  name.target = '_blank';
  name.className = 'repo-name';
  name.textContent = gist.description || 'Untitled Gist';

  var files = document.createElement('p');
  files.className = 'repo-description';
  var fileNames = Object.keys(gist.files).join(', ');
  files.textContent = 'Files: ' + fileNames;

  var created = document.createElement('p');
  created.className = 'repo-description';
  var date = new Date(gist.created_at);
  created.textContent = 'Created: ' + date.toLocaleDateString();

  item.appendChild(name);
  item.appendChild(files);
  item.appendChild(created);

  return item;
}

// Tab Switching
function switchTab(tabName) {
  // Update tab buttons
  var tabs = document.querySelectorAll('.tab');
  tabs.forEach(function (tab) {
    tab.classList.remove('active');
  });

  var activeTab = document.querySelector('[data-tab="' + tabName + '"]');
  activeTab.classList.add('active');

  // Update tab content
  var contents = document.querySelectorAll('.tab-content');
  contents.forEach(function (content) {
    content.classList.remove('active');
  });

  var activeContent = document.getElementById(tabName);
  activeContent.classList.add('active');

  // Load data based on tab
  if (tabName === 'repositories') {
    loadRepositories();
  } else if (tabName === 'pinned') {
    loadPinnedRepos();
  } else if (tabName === 'gists') {
    loadGists();
  }
}

// Event Listeners
btn.addEventListener('click', function () {
  fetchUser(input.value.trim());
});

input.addEventListener('keypress', function (e) {
  if (e.key === 'Enter') {
    fetchUser(input.value.trim());
  }
});

themeToggle.addEventListener('click', toggleTheme);

searchHistory.addEventListener('change', function () {
  if (searchHistory.value) {
    input.value = searchHistory.value;
    fetchUser(searchHistory.value);
  }
});

closeBanner.addEventListener('click', closeWelcomeBanner);

// Tab event listeners
var tabButtons = document.querySelectorAll('.tab');
tabButtons.forEach(function (tab) {
  tab.addEventListener('click', function () {
    var tabName = tab.getAttribute('data-tab');
    switchTab(tabName);
  });
});

// Pagination event listeners
prevBtn.addEventListener('click', function () {
  if (currentPage > 1) {
    currentPage--;
    loadRepositories();
  }
});

nextBtn.addEventListener('click', function () {
  var totalPages = Math.ceil(totalRepos / perPage);
  if (currentPage < totalPages) {
    currentPage++;
    loadRepositories();
  }
});

// Initialize on page load
initApp();


