(() => {
  'use strict';

  const STORAGE_KEY = 'sgt_tarefas';

  const getTasks = () => {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
    } catch {
      return [];
    }
  };

  const saveTasks = (tasks) => localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));

  const notify = (message, type = 'success') => {
    let box = document.getElementById('notification');
    if (!box) {
      box = document.createElement('div');
      box.id = 'notification';
      box.setAttribute('role', 'status');
      box.setAttribute('aria-live', 'polite');
      document.body.appendChild(box);
    }
    box.className = 'notification ' + (type === 'error' ? 'notification-error' : 'notification-success');
    box.textContent = message;
    box.hidden = false;
    clearTimeout(box._timer);
    box._timer = setTimeout(() => { box.hidden = true; }, 3000);
  };

  const redirectAfter = (url, delay = 700) => setTimeout(() => { window.location.href = url; }, delay);

  const validEmail = (email) => /^[^\s@]+@[^\s@]+\.com(?:\.br)?$/i.test(email);

  const initLogin = () => {
    const form = document.getElementById('login-form');
    if (!form) return;

    form.addEventListener('submit', (event) => {
      event.preventDefault();
      const email = form.email.value.trim();
      const senha = form.senha.value.trim();

      if (!email || !senha) {
        notify('Preencha o email e a senha.', 'error');
        return;
      }

      notify('Login realizado com sucesso!');
      redirectAfter('pages/dashboard.html');
    });
  };

  const initCadastro = () => {
    const form = document.getElementById('cadastro-form');
    if (!form) return;

    form.addEventListener('submit', (event) => {
      event.preventDefault();
      const nome = form.nome.value.trim();
      const email = form.email.value.trim();
      const senha = form.senha.value;

      if (nome.length < 5 || !/\s/.test(nome)) {
        notify('Informe nome e sobrenome, com pelo menos 5 caracteres.', 'error');
        return;
      }

      if (!validEmail(email)) {
        notify('Informe um email válido terminado em .com ou .com.br.', 'error');
        return;
      }

      if (senha.length < 8) {
        notify('A senha deve ter pelo menos 8 caracteres.', 'error');
        return;
      }

      notify('Cadastro realizado com sucesso!');
      redirectAfter('../index.html');
    });
  };

  const seedTasks = () => {
    const current = getTasks();
    if (current.length) return current;

    const sample = [
      {
        id: crypto.randomUUID(),
        titulo: 'Revisar proposta do cliente',
        descricao: 'Verificar os valores e o escopo do projeto antes de enviar para o cliente.',
        concluida: false,
        criadaEm: new Date().toLocaleDateString('pt-BR')
      },
      {
        id: crypto.randomUUID(),
        titulo: 'Organizar arquivos do projeto',
        descricao: 'Separar os documentos e conferir se todos os materiais estão atualizados.',
        concluida: false,
        criadaEm: new Date().toLocaleDateString('pt-BR')
      }
    ];

    saveTasks(sample);
    return sample;
  };

  const initDashboard = () => {
    const list = document.getElementById('task-list');
    if (!list) return;

    const render = () => {
      const tasks = seedTasks();
      list.innerHTML = '';

      if (!tasks.length) {
        list.innerHTML = '<p class="empty-state">Nenhuma tarefa cadastrada.</p>';
        return;
      }

      tasks.forEach((task) => {
        const article = document.createElement('article');
        article.className = 'task-card';
        article.innerHTML = `
          <header class="task-title-row">
            <h3>${task.titulo}</h3>
            <a href="detalhes.html?id=${task.id}" class="view-link" aria-label="Ver detalhes de ${task.titulo}">◉</a>
          </header>
          <p>${task.descricao || 'Sem descrição.'}</p>
          <p class="task-status">Status: <strong>${task.concluida ? 'Concluída' : 'Pendente'}</strong></p>
          <div class="task-actions">
            <a href="editar-tarefa.html?id=${task.id}" class="btn btn-primary">Editar</a>
            <button type="button" class="btn btn-success" data-action="toggle" data-id="${task.id}">
              ${task.concluida ? 'Reabrir' : 'Concluir'}
            </button>
            <button type="button" class="btn btn-danger" data-action="delete" data-id="${task.id}">Excluir</button>
          </div>
        `;
        list.appendChild(article);
      });
    };

    list.addEventListener('click', (event) => {
      const button = event.target.closest('button[data-action]');
      if (!button) return;

      const id = button.dataset.id;
      const action = button.dataset.action;
      let tasks = getTasks();
      const index = tasks.findIndex((task) => task.id === id);

      if (index < 0) {
        notify('Tarefa não encontrada.', 'error');
        return;
      }

      if (action === 'toggle') {
        tasks[index].concluida = !tasks[index].concluida;
        saveTasks(tasks);
        notify('Tarefa atualizada com sucesso!');
        render();
      }

      if (action === 'delete') {
        tasks = tasks.filter((task) => task.id !== id);
        saveTasks(tasks);
        notify('Tarefa excluída com sucesso!');
        render();
      }
    });

    render();
  };

  const initTaskForm = () => {
    const form = document.getElementById('tarefa-form');
    if (!form) return;

    const params = new URLSearchParams(window.location.search);
    const id = params.get('id');
    const isEdit = form.dataset.mode === 'edit';

    if (isEdit) {
      const task = getTasks().find((item) => item.id === id);
      if (!task) {
        notify('Tarefa não encontrada.', 'error');
        redirectAfter('dashboard.html', 900);
        return;
      }
      form.titulo.value = task.titulo;
      form.descricao.value = task.descricao || '';
    }

    form.addEventListener('submit', (event) => {
      event.preventDefault();
      const titulo = form.titulo.value.trim();
      const descricao = form.descricao.value.trim();

      if (titulo.length < 5) {
        notify('O título deve ter pelo menos 5 caracteres.', 'error');
        return;
      }

      if (descricao && descricao.length < 3) {
        notify('A descrição deve ter pelo menos 3 caracteres.', 'error');
        return;
      }

      let tasks = getTasks();

      if (isEdit) {
        const index = tasks.findIndex((item) => item.id === id);
        if (index < 0) {
          notify('Tarefa não encontrada.', 'error');
          return;
        }

        tasks[index] = { ...tasks[index], titulo, descricao };
        saveTasks(tasks);
        notify('Tarefa editada com sucesso!');
      } else {
        tasks.push({
          id: crypto.randomUUID(),
          titulo,
          descricao,
          concluida: false,
          criadaEm: new Date().toLocaleDateString('pt-BR')
        });
        saveTasks(tasks);
        notify('Tarefa criada com sucesso!');
      }

      redirectAfter('dashboard.html');
    });
  };

  const initDetails = () => {
    const card = document.getElementById('task-detail');
    if (!card) return;

    const params = new URLSearchParams(window.location.search);
    const id = params.get('id');
    const task = getTasks().find((item) => item.id === id);

    if (!task) {
      card.innerHTML = '<p>Tarefa não encontrada.</p>';
      return;
    }

    card.querySelector('[data-field="title"]').textContent = task.titulo;
    card.querySelector('[data-field="status"]').textContent = task.concluida ? 'Concluída' : 'Pendente';
    card.querySelector('[data-field="created"]').textContent = task.criadaEm || '-';
    card.querySelector('[data-field="description"]').textContent = task.descricao || 'Sem descrição.';

    const edit = card.querySelector('[data-action="edit"]');
    edit.href = 'editar-tarefa.html?id=' + task.id;

    card.querySelector('[data-action="delete"]').addEventListener('click', () => {
      saveTasks(getTasks().filter((item) => item.id !== task.id));
      notify('Tarefa excluída com sucesso!');
      redirectAfter('dashboard.html');
    });
  };

  document.addEventListener('DOMContentLoaded', () => {
    initLogin();
    initCadastro();
    initDashboard();
    initTaskForm();
    initDetails();
  });
})();
