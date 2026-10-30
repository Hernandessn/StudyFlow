(() => {
    "use strict";

    const STORAGE_KEY = "studyflow-tasks";
    const form = document.getElementById("taskForm");
    const taskNameInput = document.getElementById("taskName");
    const subjectInput = document.getElementById("subject");
    const dueDateInput = document.getElementById("dueDate");
    const taskList = document.getElementById("taskList");
    let tasks = loadTasks();

    document.getElementById("todayLabel").innerHTML =
        `Hoje<strong>${new Intl.DateTimeFormat("pt-BR", { dateStyle: "long" }).format(new Date())}</strong>`;
    renderTasks();

    form.addEventListener("submit", (event) => {
        event.preventDefault();
        if (!form.reportValidity()) return;

        const name = taskNameInput.value.trim();
        const subject = subjectInput.value.trim();
        const dueDate = dueDateInput.value;
        if (!name || !subject || !dueDate) {
            form.reportValidity();
            return;
        }

        tasks.unshift({
            id: makeId(),
            name,
            subject,
            dueDate,
            completed: false,
        });
        saveTasks();
        renderTasks();
        form.reset();
        taskNameInput.focus();
    });

    taskList.addEventListener("click", (event) => {
        const button = event.target.closest("button[data-action]");
        if (!button) return;
        const task = tasks.find((item) => item.id === button.dataset.id);
        if (!task) return;

        if (button.dataset.action === "toggle") {
            task.completed = !task.completed;
            saveTasks();
            renderTasks();
        } else if (button.dataset.action === "delete") {
            if (!window.confirm(`Excluir a tarefa “${task.name}”?`)) return;
            tasks = tasks.filter((item) => item.id !== task.id);
            saveTasks();
            renderTasks();
        }
    });

    function loadTasks() {
        try {
            const stored = JSON.parse(
                localStorage.getItem(STORAGE_KEY) || "[]",
            );
            if (!Array.isArray(stored)) return [];
            return stored
                .filter(
                    (task) =>
                        task &&
                        typeof task.id === "string" &&
                        typeof task.name === "string" &&
                        typeof task.subject === "string" &&
                        typeof task.dueDate === "string",
                )
                .map((task) => ({
                    id: task.id,
                    name: task.name,
                    subject: task.subject,
                    dueDate: task.dueDate,
                    completed: task.completed === true,
                }));
        } catch (error) {
            return [];
        }
    }

    function saveTasks() {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
        } catch (error) {
            window.alert("Não foi possível salvar as tarefas neste navegador.");
        }
    }

    function renderTasks() {
        const completed = tasks.filter((task) => task.completed).length;
        document.getElementById("totalCount").textContent = tasks.length;
        document.getElementById("pendingCount").textContent =
            tasks.length - completed;
        document.getElementById("completedCount").textContent = completed;
        document.getElementById("listCount").textContent =
            `${tasks.length} ${tasks.length === 1 ? "tarefa" : "tarefas"}`;

        taskList.replaceChildren();
        if (tasks.length === 0) {
            const empty = document.createElement("div");
            empty.className = "empty-state";
            const icon = document.createElement("div");
            icon.className = "empty-icon";
            icon.setAttribute("aria-hidden", "true");
            icon.textContent = "✦";
            const message = document.createElement("strong");
            message.textContent = "Tudo pronto para começar?";
            const hint = document.createElement("p");
            hint.textContent =
                "Adicione sua primeira tarefa e organize seus estudos.";
            empty.append(icon, message, hint);
            taskList.append(empty);
            return;
        }

        tasks.forEach((task) => taskList.append(createTaskElement(task)));
    }

    function createTaskElement(task) {
        const article = document.createElement("article");
        article.className = `task${task.completed ? " is-completed" : ""}`;

        const main = document.createElement("div");
        main.className = "task-main";
        const title = document.createElement("div");
        title.className = "task-title";
        title.textContent = task.name;
        const meta = document.createElement("div");
        meta.className = "task-meta";
        const subject = document.createElement("span");
        subject.textContent = task.subject;
        const date = document.createElement("span");
        date.textContent = `Entrega: ${formatDate(task.dueDate)}`;
        const status = document.createElement("span");
        status.className = "task-status";
        status.textContent = task.completed ? "✓ Concluída" : "● Pendente";
        meta.append(subject, date, status);
        main.append(title, meta);

        const actions = document.createElement("div");
        actions.className = "task-actions";
        const toggleButton = document.createElement("button");
        toggleButton.type = "button";
        toggleButton.className = "icon-button";
        toggleButton.dataset.action = "toggle";
        toggleButton.dataset.id = task.id;
        toggleButton.setAttribute(
            "aria-label",
            task.completed
                ? `Reabrir tarefa: ${task.name}`
                : `Marcar como concluída: ${task.name}`,
        );
        toggleButton.title = task.completed
            ? "Marcar como pendente"
            : "Marcar como concluída";
        toggleButton.textContent = task.completed ? "↶" : "✓";

        const deleteButton = document.createElement("button");
        deleteButton.type = "button";
        deleteButton.className = "icon-button delete";
        deleteButton.dataset.action = "delete";
        deleteButton.dataset.id = task.id;
        deleteButton.setAttribute(
            "aria-label",
            `Excluir tarefa: ${task.name}`,
        );
        deleteButton.title = "Excluir tarefa";
        deleteButton.textContent = "×";

        actions.append(toggleButton, deleteButton);
        article.append(main, actions);
        return article;
    }

    function formatDate(value) {
        const [year, month, day] = value.split("-").map(Number);
        if (!year || !month || !day) return value;
        return new Intl.DateTimeFormat("pt-BR").format(
            new Date(year, month - 1, day),
        );
    }

    function makeId() {
        return globalThis.crypto &&
            typeof globalThis.crypto.randomUUID === "function"
            ? globalThis.crypto.randomUUID()
            : `${Date.now()}-${Math.random().toString(16).slice(2)}`;
    }
})();