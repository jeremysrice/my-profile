// Shared JavaScript for every page of the site.
// Each feature checks that its elements exist first, so a page
// only runs the features it actually contains.

// ----- Greeting (homepage) -----
function setupGreeting() {
  const greetingElement = document.getElementById("greeting");

  if (!greetingElement) {
    return;
  }

  const hour = new Date().getHours();

  if (hour < 12) {
    greetingElement.textContent = "Good morning";
  } else if (hour < 17) {
    greetingElement.textContent = "Good afternoon";
  } else {
    greetingElement.textContent = "Good evening";
  }
}

// ----- Live clock (homepage) -----
function setupClock() {
  const clockElement = document.querySelector("#clock time");

  if (!clockElement) {
    return;
  }

  function updateClock() {
    const now = new Date();
    clockElement.textContent = now.toLocaleTimeString();
    clockElement.dateTime = now.toISOString();
  }

  updateClock();
  setInterval(updateClock, 1000);
}

// ----- Show/hide section titles (any page) -----
function setupSectionToggles() {
  const sectionToggles = document.querySelectorAll(".section-toggle");

  sectionToggles.forEach(function (toggle) {
    const content = document.getElementById(toggle.getAttribute("aria-controls"));

    toggle.addEventListener("click", function () {
      const isExpanded = toggle.getAttribute("aria-expanded") === "true";
      toggle.setAttribute("aria-expanded", String(!isExpanded));
      content.hidden = isExpanded;
    });
  });
}

// ----- Contact form character counter (homepage) -----
function setupMessageCounter() {
  const messageBox = document.getElementById("message");
  const messageCount = document.getElementById("message-count");

  if (!messageBox || !messageCount) {
    return;
  }

  const maxChars = messageBox.maxLength;

  function updateMessageCount() {
    const length = messageBox.value.length;
    messageCount.textContent = length + " / " + maxChars + " characters";
    messageCount.classList.toggle("at-limit", length >= maxChars);
  }

  updateMessageCount();
  messageBox.addEventListener("input", updateMessageCount);
}

// ----- Skills (about page) -----
function setupSkills() {
  const skillForm = document.getElementById("skill-form");
  const skillNameInput = document.getElementById("skill-name");
  const skillLevelSelect = document.getElementById("skill-level");
  const skillList = document.getElementById("skill-list");
  const skillCount = document.getElementById("skill-count");
  const skillFilterButtons = document.querySelectorAll(".skill-filter");

  if (!skillForm || !skillList) {
    return;
  }

  // Starting list, used when nothing has been saved in localStorage yet
  const defaultSkills = [
    { name: "Network monitoring and troubleshooting", level: "confident" },
    { name: "Network security", level: "confident" },
    { name: "Desktop, hardware, and end-user IT support", level: "confident" },
    { name: "Facebook, Instagram, and Google ad campaigns", level: "confident" },
    { name: "CRM management and landing page creation", level: "confident" },
    { name: "Local SEO", level: "confident" },
    { name: "HTML", level: "practicing" },
    { name: "CSS", level: "practicing" },
    { name: "JavaScript", level: "learning" }
  ];

  const SKILLS_STORAGE_KEY = "skills";
  const SKILL_LEVELS = ["learning", "practicing", "confident"];

  // Load saved skills, or fall back to the defaults if there are none
  // (or if the saved data is missing, broken, or the wrong shape)
  function loadSkills() {
    try {
      const saved = JSON.parse(localStorage.getItem(SKILLS_STORAGE_KEY));

      if (Array.isArray(saved)) {
        return saved.filter(function (skill) {
          return skill && typeof skill.name === "string" && SKILL_LEVELS.includes(skill.level);
        });
      }
    } catch (error) {
      // Unreadable data or storage blocked: use the defaults below
    }

    return defaultSkills.slice();
  }

  function saveSkills() {
    try {
      localStorage.setItem(SKILLS_STORAGE_KEY, JSON.stringify(skills));
    } catch (error) {
      // Storage full or blocked: changes still work until the page reloads
    }
  }

  const skills = loadSkills();

  let activeFilter = "all"; // "all", "learning", "practicing", or "confident"

  function renderSkills() {
    skillList.innerHTML = "";

    // Filtering only changes what's shown; the skills array itself keeps everything
    const visibleSkills = skills.filter(function (skill) {
      return activeFilter === "all" || skill.level === activeFilter;
    });

    skillCount.textContent =
      "Showing " + visibleSkills.length + " of " + skills.length +
      (skills.length === 1 ? " skill" : " skills");

    visibleSkills.forEach(function (skill) {
      // Position in the full skills array, used by Remove and name editing
      const index = skills.indexOf(skill);

      const item = document.createElement("li");
      item.className = "skill";
      item.dataset.index = index;

      // The name is a button so it can be clicked (or focused with Tab) to edit it
      const name = document.createElement("button");
      name.type = "button";
      name.className = "skill-name";
      name.textContent = skill.name;
      name.title = "Click to edit";
      name.setAttribute("aria-label", "Edit skill name: " + skill.name);
      name.addEventListener("click", function () {
        startEditingSkillName(name, index);
      });

      const level = document.createElement("span");
      level.className = "skill-level skill-level--" + skill.level;
      level.textContent = skill.level;

      const removeButton = document.createElement("button");
      removeButton.type = "button";
      removeButton.className = "skill-remove";
      removeButton.textContent = "Remove";
      removeButton.setAttribute("aria-label", "Remove " + skill.name);
      // Keep focus where it is on mouse press, so a name being edited doesn't
      // blur and redraw the list before the click lands (which ate the click)
      removeButton.addEventListener("mousedown", function (e) {
        e.preventDefault();
      });
      removeButton.addEventListener("click", function () {
        // Save any name edit in progress before the list is redrawn
        if (document.activeElement && document.activeElement.classList.contains("skill-name-input")) {
          document.activeElement.blur();
        }

        skills.splice(index, 1);
        saveSkills();
        renderSkills();
        skillNameInput.focus();
      });

      item.append(name, level, removeButton);
      skillList.append(item);
    });
  }

  // Swaps a skill's name for a text box in place.
  // Enter or clicking away saves; Escape cancels.
  function startEditingSkillName(nameButton, index) {
    // Hold on to the skill object itself: if it's removed mid-edit, positions
    // in the array shift and skills[index] would point at a different skill
    const skill = skills[index];

    const input = document.createElement("input");
    input.type = "text";
    input.className = "skill-name-input";
    input.value = skill.name;
    input.setAttribute("aria-label", "Skill name");

    let finished = false;

    function finishEditing(shouldSave, returnFocus) {
      if (finished) {
        return; // blur can fire again while the list re-renders
      }
      finished = true;

      // The skill was removed while being edited: nothing to save
      if (!skills.includes(skill)) {
        return;
      }

      const newName = input.value.trim();

      // A blank name is ignored, so the old name stays
      if (shouldSave && newName !== "" && newName !== skill.name) {
        skill.name = newName;
        saveSkills();
      }

      renderSkills();

      if (returnFocus) {
        skillList.querySelector('[data-index="' + skills.indexOf(skill) + '"] .skill-name').focus();
      }
    }

    input.addEventListener("keydown", function (e) {
      if (e.key === "Enter") {
        e.preventDefault();
        finishEditing(true, true);
      } else if (e.key === "Escape") {
        finishEditing(false, true);
      }
    });

    // Clicking or tabbing away saves, without pulling focus back
    input.addEventListener("blur", function () {
      finishEditing(true, false);
    });

    nameButton.replaceWith(input);
    input.focus();
    input.select();
  }

  skillFilterButtons.forEach(function (button) {
    button.addEventListener("click", function () {
      activeFilter = button.dataset.filter;

      // Mark only the clicked button as active
      skillFilterButtons.forEach(function (otherButton) {
        otherButton.setAttribute("aria-pressed", String(otherButton === button));
      });

      renderSkills();
    });
  });

  skillForm.addEventListener("submit", function (e) {
    e.preventDefault();

    const name = skillNameInput.value.trim();

    if (name === "") {
      return;
    }

    skills.push({ name: name, level: skillLevelSelect.value });
    saveSkills();
    renderSkills();
    skillForm.reset();
    skillNameInput.focus();
  });

  renderSkills();
}

// ----- Projects (projects page) -----
function setupProjects() {
  const projectForm = document.getElementById("project-form");
  const projectNameInput = document.getElementById("project-name");
  const projectDescriptionInput = document.getElementById("project-description");
  const projectList = document.getElementById("project-list");
  const projectEmpty = document.getElementById("project-empty");

  if (!projectForm || !projectList) {
    return;
  }

  // Starting list, used when nothing has been saved in localStorage yet
  const defaultProjects = [
    {
      name: "Personal Profile Page",
      description: "A responsive profile page built with HTML, CSS, and vanilla JavaScript."
    },
    {
      name: "Tree Care Landing Page",
      description: "A lead-generation landing page for a local tree care company."
    }
  ];

  const PROJECTS_STORAGE_KEY = "projects";

  // Load saved projects, or fall back to the defaults if there are none
  // (or if the saved data is missing, broken, or the wrong shape)
  function loadProjects() {
    try {
      const saved = JSON.parse(localStorage.getItem(PROJECTS_STORAGE_KEY));

      if (Array.isArray(saved)) {
        return saved.filter(function (project) {
          return project && typeof project.name === "string" && typeof project.description === "string";
        });
      }
    } catch (error) {
      // Unreadable data or storage blocked: use the defaults below
    }

    return defaultProjects.slice();
  }

  function saveProjects() {
    try {
      localStorage.setItem(PROJECTS_STORAGE_KEY, JSON.stringify(projects));
    } catch (error) {
      // Storage full or blocked: changes still work until the page reloads
    }
  }

  const projects = loadProjects();

  function renderProjects() {
    projectList.innerHTML = "";

    projects.forEach(function (project, index) {
      const card = document.createElement("li");
      card.className = "project-card";

      const title = document.createElement("h3");
      title.textContent = project.name;

      const description = document.createElement("p");
      description.textContent = project.description;

      const deleteButton = document.createElement("button");
      deleteButton.type = "button";
      deleteButton.className = "project-delete";
      deleteButton.textContent = "×";
      deleteButton.setAttribute("aria-label", "Delete " + project.name);
      deleteButton.addEventListener("click", function () {
        projects.splice(index, 1);
        saveProjects();
        renderProjects();
        projectNameInput.focus();
      });

      card.append(title, description, deleteButton);
      projectList.append(card);
    });

    projectEmpty.hidden = projects.length > 0;
  }

  projectForm.addEventListener("submit", function (e) {
    e.preventDefault();

    const name = projectNameInput.value.trim();
    const description = projectDescriptionInput.value.trim();

    if (name === "" || description === "") {
      return;
    }

    projects.push({ name: name, description: description });
    saveProjects();
    renderProjects();
    projectForm.reset();
    projectNameInput.focus();
  });

  renderProjects();
}

// ----- Run everything -----
setupGreeting();
setupClock();
setupSectionToggles();
setupMessageCounter();
setupSkills();
setupProjects();
