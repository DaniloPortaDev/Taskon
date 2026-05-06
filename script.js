"use strict";

const STORAGE_KEY = "apple-task-manager.tasks";
const THEME_KEY = "apple-task-manager.theme";

const columns = [
  { id: "todo", label: "To Do" },
  { id: "doing", label: "Doing" },
  { id: "done", label: "Done" }
];

const priorityLabels = {
  low: "Baixa",
  medium: "Média",
  high: "Alta"
};

// A single state object keeps rendering predictable and localStorage easy to sync.
const state = {
  tasks: [],
  filters: {
    search: "",
    status: "all",
    priority: "all"
  },
  draggedTaskId: null,
  enteringTaskId: null,
  highlightedTaskId: null,
  renderFrameId: null,
  typingFeedbackId: null
};

// DOM references are cached once because the app re-renders task cards often.
const elements = {
  root: document.documentElement,
  board: document.querySelector("#board"),
  dialog: document.querySelector("#taskDialog"),
  form: document.querySelector("#taskForm"),
  taskId: document.querySelector("#taskId"),
  taskTitle: document.querySelector("#taskTitle"),
  taskDescription: document.querySelector("#taskDescription"),
  taskStatus: document.querySelector("#taskStatus"),
  taskPriority: document.querySelector("#taskPriority"),
  taskCompleted: document.querySelector("#taskCompleted"),
  dialogTitle: document.querySelector("#dialogTitle"),
  closeDialogButton: document.querySelector("#closeDialogButton"),
  cancelButton: document.querySelector("#cancelButton"),
  newTaskButton: document.querySelector("#newTaskButton"),
  themeToggle: document.querySelector("#themeToggle"),
  searchInput: document.querySelector("#searchInput"),
  statusFilter: document.querySelector("#statusFilter"),
  priorityFilter: document.querySelector("#priorityFilter"),
  toast: document.querySelector("#toast")
};

function init() {
  state.tasks = loadTasks();
  applySavedTheme();
  bindEvents();
  render();
}

function bindEvents() {
  elements.newTaskButton.addEventListener("click", () => openTaskDialog());
  elements.closeDialogButton.addEventListener("click", closeTaskDialog);
  elements.cancelButton.addEventListener("click", closeTaskDialog);
  elements.form.addEventListener("submit", handleFormSubmit);
  elements.themeToggle.addEventListener("click", toggleTheme);
  elements.taskStatus.addEventListener("change", syncCompletionFromStatus);
  elements.taskCompleted.addEventListener("change", syncStatusFromCompletion);

  elements.searchInput.addEventListener("input", (event) => {
    state.filters.search = event.target.value.trim().toLowerCase();
    showSearchTypingFeedback();
    scheduleRender();
  });

  elements.statusFilter.addEventListener("change", (event) => {
    state.filters.status = event.target.value;
    scheduleRender();
  });

  elements.priorityFilter.addEventListener("change", (event) => {
    state.filters.priority = event.target.value;
    scheduleRender();
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && elements.dialog.open) {
      closeTaskDialog();
    }
  });

  document.querySelectorAll("[data-dropzone]").forEach((dropzone) => {
    dropzone.addEventListener("dragover", handleDragOver);
    dropzone.addEventListener("dragleave", handleDragLeave);
    dropzone.addEventListener("drop", handleDrop);
  });
}

function loadTasks() {
  const savedTasks = localStorage.getItem(STORAGE_KEY);

  if (!savedTasks) {
    // Seed data makes the board useful on first open without requiring setup.
    return [
      createTask({
        title: "Definir prioridades da semana",
        description: "Organizar as entregas principais antes de iniciar novos itens.",
        priority: "high",
        status: "todo"
      }),
      createTask({
        title: "Revisar fluxo visual",
        description: "Ajustar detalhes de espaçamento, contraste e leitura.",
        priority: "medium",
        status: "doing"
      }),
      createTask({
        title: "Publicar primeira versão",
        description: "Validar persistência local e estados da interface.",
        priority: "low",
        status: "done",
        completed: true
      })
    ];
  }

  try {
    const parsedTasks = JSON.parse(savedTasks);
    return Array.isArray(parsedTasks) ? parsedTasks : [];
  } catch {
    return [];
  }
}

function saveTasks() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state.tasks));
}

function createTask(overrides = {}) {
  const timestamp = new Date().toISOString();

  return {
    id: createId(),
    title: "",
    description: "",
    priority: "medium",
    status: "todo",
    completed: false,
    createdAt: timestamp,
    updatedAt: timestamp,
    ...overrides
  };
}

function createId() {
  if (globalThis.crypto?.randomUUID) {
    return globalThis.crypto.randomUUID();
  }

  return `task-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function render() {
  columns.forEach((column) => {
    const dropzone = document.querySelector(`[data-dropzone="${column.id}"]`);
    const tasks = getVisibleTasks().filter((task) => task.status === column.id);

    dropzone.innerHTML = "";
    updateCounter(column.id, tasks.length);

    if (tasks.length === 0) {
      dropzone.append(createEmptyState(column.id));
      return;
    }

    tasks.forEach((task) => {
      const card = createTaskCard(task);

      if (task.id === state.enteringTaskId) {
        card.classList.add("is-new");
      } else if (task.id === state.highlightedTaskId) {
        card.classList.add("is-highlighted");
      }

      dropzone.append(card);
    });
  });
}

function scheduleRender() {
  // Search/filter renders are grouped into the next frame to keep typing fluid.
  if (state.renderFrameId) {
    return;
  }

  state.renderFrameId = window.requestAnimationFrame(() => {
    state.renderFrameId = null;
    render();
  });
}

function updateCounter(columnId, nextValue) {
  // Counters only animate when their visible number actually changes.
  const counter = document.querySelector(`#count-${columnId}`);
  const nextText = String(nextValue);

  if (counter.textContent === nextText) {
    return;
  }

  counter.textContent = nextText;
  playTransientClass(counter, "is-updating", 280);
}

function getVisibleTasks() {
  return state.tasks.filter((task) => {
    const matchesSearch = [task.title, task.description]
      .join(" ")
      .toLowerCase()
      .includes(state.filters.search);
    const matchesStatus =
      state.filters.status === "all" ||
      task.status === state.filters.status ||
      (state.filters.status === "completed" && task.completed);
    const matchesPriority = state.filters.priority === "all" || task.priority === state.filters.priority;

    return matchesSearch && matchesStatus && matchesPriority;
  });
}

function createTaskCard(task) {
  const card = document.createElement("article");
  card.className = `task-card${task.completed ? " is-completed" : ""}`;
  card.draggable = true;
  card.dataset.taskId = task.id;
  card.setAttribute("aria-label", task.title);

  card.innerHTML = `
    <div class="task-card__top">
      <div class="task-card__content">
        <h3 class="task-card__title"></h3>
        <p class="task-card__description"></p>
      </div>
      <div class="task-card__actions">
        <button class="task-card__button" type="button" data-action="toggle" aria-label="Alternar concluída" title="Alternar concluída">&#10003;</button>
        <button class="task-card__button" type="button" data-action="edit" aria-label="Editar tarefa" title="Editar tarefa">&#9998;</button>
        <button class="task-card__button task-card__button--danger" type="button" data-action="delete" aria-label="Excluir tarefa" title="Excluir tarefa">&times;</button>
      </div>
    </div>
    <div class="task-card__meta">
      <span class="priority priority--${task.priority}">${priorityLabels[task.priority]}</span>
    </div>
  `;

  card.querySelector(".task-card__title").textContent = task.title;
  card.querySelector(".task-card__description").textContent = task.description || "Sem descrição";

  card.addEventListener("dragstart", handleDragStart);
  card.addEventListener("dragend", handleDragEnd);
  card.addEventListener("click", (event) => handleTaskAction(event, task.id));

  return card;
}

function createEmptyState(columnId) {
  const emptyState = document.createElement("div");
  emptyState.className = "empty-state";
  emptyState.textContent = state.tasks.some((task) => task.status === columnId)
    ? "Nenhuma tarefa corresponde aos filtros."
    : "Arraste tarefas para esta coluna.";

  return emptyState;
}

function handleTaskAction(event, taskId) {
  const button = event.target.closest("[data-action]");

  if (!button) {
    return;
  }

  const action = button.dataset.action;

  if (action === "edit") {
    const task = findTask(taskId);
    openTaskDialog(task);
  }

  if (action === "delete") {
    deleteTask(taskId);
  }

  if (action === "toggle") {
    toggleTaskCompletion(taskId);
  }
}

// The dialog is reused for create and edit, avoiding duplicated form logic.
function openTaskDialog(task = null) {
  const isEditing = Boolean(task);

  elements.dialogTitle.textContent = isEditing ? "Editar tarefa" : "Nova tarefa";
  elements.taskId.value = task?.id || "";
  elements.taskTitle.value = task?.title || "";
  elements.taskDescription.value = task?.description || "";
  elements.taskStatus.value = task?.status || "todo";
  elements.taskPriority.value = task?.priority || "medium";
  elements.taskCompleted.checked = task?.completed || false;

  elements.dialog.showModal();
  requestAnimationFrame(() => elements.taskTitle.focus());
}

function syncCompletionFromStatus() {
  if (elements.taskStatus.value === "done") {
    elements.taskCompleted.checked = true;
  }
}

function syncStatusFromCompletion() {
  if (elements.taskCompleted.checked) {
    elements.taskStatus.value = "done";
    return;
  }

  if (elements.taskStatus.value === "done") {
    elements.taskStatus.value = "todo";
  }
}

function closeTaskDialog() {
  elements.form.reset();
  elements.taskId.value = "";
  elements.dialog.close();
}

function handleFormSubmit(event) {
  event.preventDefault();

  const id = elements.taskId.value;
  const status = elements.taskCompleted.checked ? "done" : elements.taskStatus.value;
  const taskPayload = {
    title: elements.taskTitle.value.trim(),
    description: elements.taskDescription.value.trim(),
    priority: elements.taskPriority.value,
    status,
    completed: status === "done" || elements.taskCompleted.checked,
    updatedAt: new Date().toISOString()
  };

  if (!taskPayload.title) {
    elements.taskTitle.focus();
    return;
  }

  if (id) {
    updateTask(id, taskPayload, { feedback: true });
    showToast("Tarefa atualizada.");
  } else {
    const task = createTask(taskPayload);

    state.tasks.unshift(task);
    saveTasks();
    markTaskForFeedback(task.id, { enter: true });
    render();
    showToast("Tarefa criada.");
  }

  closeTaskDialog();
}

function updateTask(taskId, payload, options = {}) {
  state.tasks = state.tasks.map((task) => (task.id === taskId ? { ...task, ...payload } : task));

  if (options.feedback) {
    markTaskForFeedback(taskId);
  }

  saveTasks();
  render();
}

function deleteTask(taskId) {
  const task = findTask(taskId);

  if (!task) {
    return;
  }

  const card = findTaskCard(taskId);

  if (card) {
    let hasRemoved = false;

    // The task stays in state until the CSS exit transition has finished.
    card.classList.add("is-removing");

    const finishDelete = () => {
      if (hasRemoved) {
        return;
      }

      hasRemoved = true;
      removeTaskFromState(taskId);
    };

    card.addEventListener("transitionend", finishDelete, { once: true });
    window.setTimeout(finishDelete, 320);
    return;
  }

  removeTaskFromState(taskId);
}

function removeTaskFromState(taskId) {
  state.tasks = state.tasks.filter((item) => item.id !== taskId);
  saveTasks();
  render();
  showToast("Tarefa excluída.");
}

function toggleTaskCompletion(taskId) {
  const task = findTask(taskId);

  if (!task) {
    return;
  }

  updateTask(
    taskId,
    {
      completed: !task.completed,
      status: task.completed ? "todo" : "done",
      updatedAt: new Date().toISOString()
    },
    { feedback: true }
  );

  showToast(task.completed ? "Tarefa reaberta." : "Tarefa concluída.");
}

// HTML5 drag and drop updates only the task status, then lets render rebuild the board.
function handleDragStart(event) {
  const card = event.currentTarget;
  state.draggedTaskId = card.dataset.taskId;
  card.classList.add("is-dragging");
  event.dataTransfer.effectAllowed = "move";
  event.dataTransfer.setData("text/plain", state.draggedTaskId);
}

function handleDragEnd(event) {
  event.currentTarget.classList.remove("is-dragging");
  state.draggedTaskId = null;
  clearDropHighlights();
}

function handleDragOver(event) {
  event.preventDefault();
  event.currentTarget.classList.add("is-over");
  event.currentTarget.closest(".board-column")?.classList.add("is-over");
  event.dataTransfer.dropEffect = "move";
}

function handleDragLeave(event) {
  if (!event.currentTarget.contains(event.relatedTarget)) {
    event.currentTarget.classList.remove("is-over");
    event.currentTarget.closest(".board-column")?.classList.remove("is-over");
  }
}

function handleDrop(event) {
  event.preventDefault();

  const nextStatus = event.currentTarget.dataset.dropzone;
  const taskId = event.dataTransfer.getData("text/plain") || state.draggedTaskId;
  const task = findTask(taskId);

  event.currentTarget.classList.remove("is-over");
  event.currentTarget.closest(".board-column")?.classList.remove("is-over");

  if (!task || task.status === nextStatus) {
    return;
  }

  updateTask(
    taskId,
    {
      status: nextStatus,
      completed: nextStatus === "done",
      updatedAt: new Date().toISOString()
    },
    { feedback: true }
  );

  showToast(`Movida para ${columns.find((column) => column.id === nextStatus).label}.`);
}

function clearDropHighlights() {
  document.querySelectorAll(".board-column__dropzone, .board-column").forEach((element) => {
    element.classList.remove("is-over");
  });
}

function findTask(taskId) {
  return state.tasks.find((task) => task.id === taskId);
}

function findTaskCard(taskId) {
  return Array.from(document.querySelectorAll(".task-card")).find((card) => card.dataset.taskId === taskId);
}

// Theme selection is independent from tasks so each preference can persist cleanly.
function applySavedTheme() {
  const savedTheme = localStorage.getItem(THEME_KEY);
  const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
  const theme = savedTheme || (prefersDark ? "dark" : "light");

  elements.root.dataset.theme = theme;
}

function toggleTheme() {
  const nextTheme = elements.root.dataset.theme === "dark" ? "light" : "dark";
  elements.root.dataset.theme = nextTheme;
  localStorage.setItem(THEME_KEY, nextTheme);
}

function markTaskForFeedback(taskId, options = {}) {
  // Temporary ids let render add animation classes without storing UI flags on tasks.
  state.highlightedTaskId = taskId;
  state.enteringTaskId = options.enter ? taskId : null;

  window.clearTimeout(markTaskForFeedback.timeoutId);
  markTaskForFeedback.timeoutId = window.setTimeout(() => {
    if (state.highlightedTaskId === taskId) {
      state.highlightedTaskId = null;
    }

    if (state.enteringTaskId === taskId) {
      state.enteringTaskId = null;
    }
  }, 1000);
}

function playTransientClass(element, className, duration) {
  // Removing/re-adding the class restarts short CSS animations such as counter pop.
  element.classList.remove(className);
  void element.offsetWidth;
  element.classList.add(className);
  window.setTimeout(() => element.classList.remove(className), duration);
}

function showSearchTypingFeedback() {
  // Typing feedback is class-based and self-clearing, so it does not affect data state.
  const searchField = elements.searchInput.closest(".field--search");

  searchField.classList.add("is-typing");
  window.clearTimeout(state.typingFeedbackId);
  state.typingFeedbackId = window.setTimeout(() => {
    searchField.classList.remove("is-typing");
  }, 180);
}

function showToast(message) {
  window.clearTimeout(showToast.timeoutId);
  elements.toast.textContent = message;
  elements.toast.classList.add("is-visible");

  showToast.timeoutId = window.setTimeout(() => {
    elements.toast.classList.remove("is-visible");
  }, 2200);
}

init();
