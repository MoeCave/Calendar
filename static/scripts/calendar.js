// Estado global
let calendar;
let selectedDate = new Date();
let tasks = {}; // { eventId: { title, description, start, end, color } }
let selectedColor = '#9B9B9B';

// Nombres de meses y días en inglés (estilo minimalista como la imagen)
const monthNames = [
  'JANUARY', 'FEBRUARY', 'MARCH', 'APRIL', 'MAY', 'JUNE',
  'JULY', 'AUGUST', 'SEPTEMBER', 'OCTOBER', 'NOVEMBER', 'DECEMBER'
];

const dayNamesShort = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
const dayNamesFull = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

// Inicializar tareas desde MongoDB
// Inicializar tareas desde MongoDB
function initTasksFromServer() {
  if (!Array.isArray(window.INIT_TASKS)) return;

  window.INIT_TASKS.forEach(t => {
    if (!t || !t._id) return;

    const id = 'mongo_' + t._id;

    // Usar las fechas guardadas o calcular desde limitDate + duration
    let startDate, endDate;
    
    if (t.endDate) {
      // Si tenemos endDate guardado, usarlo directamente
      startDate = new Date(t.limitDate);
      endDate = new Date(t.endDate);
    } else {
      // Fallback: calcular desde limitDate + duration
      startDate = new Date(t.limitDate || new Date());
      const duration = t.duration || 1;
      endDate = new Date(startDate);
      endDate.setDate(endDate.getDate() + duration);
    }

    // Validar fechas
    if (isNaN(startDate.getTime())) startDate = new Date();
    if (isNaN(endDate.getTime())) {
      endDate = new Date(startDate);
      endDate.setDate(endDate.getDate() + 1);
    }

    startDate.setHours(0, 0, 0, 0);
    endDate.setHours(0, 0, 0, 0);

    const start = formatDate(startDate);
    const end = formatDate(endDate);

    tasks[id] = {
      mongoId: t._id,
      title: t.titol || '',
      description: t.descripcio || '',
      start,
      end,
      color: t.color || '#1f2937',
      editing: false
    };
  });
}

// Formatear fecha como "YYYY-MM-DD"
function formatDate(date) {
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// Formatear fecha completa como "13 February 2026"
function formatFullDate(date) {
  const d = new Date(date);
  const day = d.getDate();
  const month = monthNames[d.getMonth()];
  const year = d.getFullYear();
  return `${day} ${month.charAt(0) + month.slice(1).toLowerCase()} ${year}`;
}

// Convertir tareas a formato de eventos de FullCalendar
function getCalendarEvents() {
  return Object.keys(tasks).map(id => ({
    id: id,
    title: tasks[id].title,
    start: tasks[id].start,
    end: tasks[id].end,
    backgroundColor: tasks[id].color,
    borderColor: tasks[id].color,
    textColor: '#111827',
    extendedProps: {
      description: tasks[id].description
    }
  }));
}

// Actualizar panel de detalles del día
function updateDetailsPanel(date) {
  selectedDate = new Date(date);

  const day = selectedDate.getDate();
  const dayName = dayNamesFull[selectedDate.getDay()].toUpperCase();

  document.getElementById('selected-day-number').textContent = day;
  document.getElementById('selected-day-name').textContent = dayName;
  document.getElementById('selected-full-date').textContent = formatFullDate(selectedDate);

  // Actualizar selección visual en el calendario
  updateCalendarSelection();

  renderTasksList();
}

// Actualizar selección visual en el calendario
function updateCalendarSelection() {
  // Remover clase selected-day de todos los días
  document.querySelectorAll('.fc-daygrid-day').forEach(day => {
    day.classList.remove('selected-day');
  });

  // Agregar clase al día seleccionado
  const selectedDateStr = formatDate(selectedDate);
  document.querySelectorAll('.fc-daygrid-day').forEach(day => {
    const dayDate = day.getAttribute('data-date');
    if (dayDate === selectedDateStr) {
      day.classList.add('selected-day');
    }
  });
}

// Actualizar título del mes en el calendario
function updateCalendarMonth() {
  const currentDate = calendar.getDate();
  const month = monthNames[currentDate.getMonth()];
  const year = currentDate.getFullYear();
  document.getElementById('calendar-month').textContent = `${month} ${year}`;
}
function goToMonthYear(monthIndex, year) {
  const date = new Date(year, monthIndex, 1);
  calendar.gotoDate(date);
  updateCalendarMonth();
  updateCalendarSelection();
}

// Renderizar lista de tareas del día seleccionado
function renderTasksList() {
  const container = document.getElementById('tasks-list');
  const selectedDateStr = formatDate(selectedDate);

  // Filtrar tareas que incluyen el día seleccionado
  const dayTasks = Object.keys(tasks).filter(id => {
    const task = tasks[id];
    const taskStart = new Date(task.start);
    const taskEnd = new Date(task.end);
    const selected = new Date(selectedDateStr);

    return selected >= taskStart && selected < taskEnd;
  });

  if (dayTasks.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">—</div>
        <div class="empty-state-text">There are no events</div>
      </div>
    `;
    return;
  }

  container.innerHTML = '';

  dayTasks.forEach(id => {
    const task = tasks[id];
    const card = document.createElement('div');
    card.className = 'task-card';
    card.id = `task-${id}`;

    // Calcular duración en días
    const start = new Date(task.start);
    const end = new Date(task.end);
    const durationDays = Math.ceil((end - start) / (1000 * 60 * 60 * 24));

      if (task.editing) {
        card.classList.add('editing');
        card.innerHTML = `
          <input type="text" class="edit-input" id="edit-title-${id}" value="${task.title}" maxlength="100">
          <textarea class="edit-input edit-textarea" id="edit-desc-${id}" maxlength="300">${task.description || ''}</textarea>
          <div class="task-actions">
            <button class="task-btn save" onclick="saveTaskEdit('${id}')">Save</button>
            <button class="task-btn" onclick="cancelTaskEdit('${id}')">Cancel</button>
          </div>
        `;
        // Reemplaza la sección del card.innerHTML cuando NO está editando:
      } else {
        card.innerHTML = `
          <div class="task-card-inner">
            <div class="task-main">
              <div>
                <div class="task-title">${task.title}</div>
                ${
                  task.description
                    ? `<div class="task-description" title="${task.description}">${task.description}</div>`
                    : ''
                }
                ${
                  durationDays > 1
                    ? `<div class="task-duration-badge">${durationDays} days</div>`
                    : ''
                }
              </div>
              <div class="task-color-dot" style="background-color: ${task.color};"></div>
            </div>
            <div class="task-actions mt-2">
              <button class="task-btn" onclick="editTask('${id}')">Edit</button>
              <button class="task-btn delete" onclick="deleteTask('${id}')">Delete</button>
            </div>
          </div>
        `;
      }


    container.appendChild(card);
  });
}

// Agregar nueva tarea
// Agregar nueva tarea
function addTask() {
  const title = document.getElementById('task-title').value.trim();
  const description = document.getElementById('task-description').value.trim();
  const duration = parseInt(document.getElementById('task-duration').value) || 1;
  const color = selectedColor;

  if (!title) {
    return;
  }

  // Calcular fecha de fin
  const startDate = new Date(selectedDate);
  startDate.setHours(0, 0, 0, 0);

  const endDate = new Date(startDate);
  endDate.setDate(endDate.getDate() + duration);

  // Generar ID único
  const id = 'task_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);

  // Crear tarea en memoria
  tasks[id] = {
    title: title,
    description: description,
    start: formatDate(startDate),
    end: formatDate(endDate),
    color: color,
    editing: false
  };

  // Agregar evento al calendario
  calendar.addEvent({
    id: id,
    title: title,
    start: formatDate(startDate),
    end: formatDate(endDate),
    backgroundColor: color,
    borderColor: color,
    textColor: '#111827',
    extendedProps: {
      description: description
    }
  });

  // Enviar al backend sin recargar la página
  const formData = new URLSearchParams();
  formData.append('type', 'task');
  formData.append('titol', title);
  formData.append('descripcio', description);
  formData.append('limitDate', formatDate(startDate));
  formData.append('endDate', formatDate(endDate));  // ← NUEVO: fecha de fin
  formData.append('duration', duration);             // ← NUEVO: duración en días
  formData.append('color', color);

  fetch('/record', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8' },
    body: formData.toString()
  })
  .then(response => response.json())
  .then(data => {
    if (data.success && data.id) {
      tasks[id].mongoId = data.id;
    }
  })
  .catch(err => console.error('Error guardando en backend:', err));

  // Limpiar formulario
  document.getElementById('task-title').value = '';
  document.getElementById('task-description').value = '';
  document.getElementById('task-duration').value = '1';

  renderTasksList();
}

// Editar tarea
function editTask(id) {
  if (!tasks[id]) return;

  tasks[id].editing = true;
  renderTasksList();

  // Autofocus en el input de título
  setTimeout(() => {
    const input = document.getElementById(`edit-title-${id}`);
    if (input) {
      input.focus();
      input.select();
    }
  }, 50);
}

// Guardar edición de tarea (solo Frontend, Mongo no se actualiza aún)
// Guardar edición de tarea
function saveTaskEdit(id) {
  const titleInput = document.getElementById(`edit-title-${id}`);
  const descInput  = document.getElementById(`edit-desc-${id}`);
  if (!titleInput || !descInput) return;

  const newTitle = titleInput.value.trim();
  const newDesc  = descInput.value.trim();

  if (!newTitle) {
    return;
  }
  
  const mongoId = tasks[id].mongoId;
  
  // Actualizar en frontend
  tasks[id].title = newTitle;
  tasks[id].description = newDesc;
  tasks[id].editing = false;

  // Actualizar evento en FullCalendar
  const event = calendar.getEventById(id);
  if (event) {
    event.setProp('title', newTitle);
    event.setExtendedProp('description', newDesc);
  }

  // Enviar al backend si tiene mongoId
  if (mongoId) {
    const formData = new URLSearchParams();
    formData.append('titol', newTitle);
    formData.append('descripcio', newDesc);
    formData.append('endDate', tasks[id].end);  // ← NUEVO: mantener la fecha de fin

    fetch(`/task/${mongoId}/editar`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8' },
      body: formData.toString()
    }).catch(err => console.error('Error actualizando en backend:', err));
  }

  renderTasksList();
}

// Cancelar edición
function cancelTaskEdit(id) {
  if (!tasks[id]) return;
  tasks[id].editing = false;
  renderTasksList();
}
// Eliminar tarea (solo Frontend, Mongo no se actualiza aún)
function deleteTask(id) {
  if (!tasks[id]) return;
  
  const mongoId = tasks[id].mongoId;
  
  if (!mongoId) {
    console.error('No mongoId found for task:', id);
    return;
  }

  fetch(`/task/${mongoId}/eliminar`, {
    method: 'POST'
  })
  .then(response => {
    if (response.ok) {
      delete tasks[id];
      
      const event = calendar.getEventById(id);
      if (event) event.remove();
      
      renderTasksList();
    } else {
      console.error('Error al eliminar del servidor');
    }
  })
  .catch(err => console.error("Error eliminando:", err));
}


// Selector de color
function setupColorPicker() {
  const colorOptions = document.querySelectorAll('.color-option');

  // Marcar el primero como activo por defecto
  colorOptions[0].classList.add('active');

  colorOptions.forEach(option => {
    option.addEventListener('click', function() {
      colorOptions.forEach(opt => opt.classList.remove('active'));

      this.classList.add('active');
      selectedColor = this.getAttribute('data-color');
      document.getElementById('task-color').value = selectedColor;
    });
  });
}

// Inicializar FullCalendar
function initCalendar() {
  const calendarEl = document.getElementById('calendar');

  calendar = new FullCalendar.Calendar(calendarEl, {
    initialView: 'dayGridMonth',
    locale: 'es',
    firstDay: 1,
    headerToolbar: false,

    editable: true,
    droppable: true,
    eventResizableFromStart: true,
    height: '70%',
    expandRows: true,
    contentHeight: 'auto',
    expandRows: true,
    dayMaxEvents: 1,

    events: getCalendarEvents(),

    dayHeaderFormat: { weekday: 'narrow' },

    eventClick: function(info) {
      const task = tasks[info.event.id];
      if (!task) return;

      updateDetailsPanel(info.event.start);

      setTimeout(() => {
        const taskCard = document.getElementById(`task-${info.event.id}`);
        if (taskCard) {
          taskCard.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
          taskCard.style.backgroundColor = '#f3f4f6';
          setTimeout(() => {
            taskCard.style.backgroundColor = '';
          }, 1000);
        }
      }, 100);
    },

  eventDrop: function(info) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const newStart = new Date(info.event.start);
    newStart.setHours(0, 0, 0, 0);

    if (newStart < today) {
      info.revert();  // vuelve al sitio original
      return;
    }
    
    const taskId = info.event.id;
    if (tasks[taskId]) {
      const oldStart = new Date(tasks[taskId].start);
      const oldEnd = new Date(tasks[taskId].end);
      const duration = oldEnd - oldStart;

      const newStart = new Date(info.event.start);
      const newEnd = new Date(newStart.getTime() + duration);

      tasks[taskId].start = formatDate(newStart);
      tasks[taskId].end = formatDate(newEnd);

      info.event.setEnd(newEnd);

      // ← NUEVO: Actualizar en el backend
      const mongoId = tasks[taskId].mongoId;
      if (mongoId) {
        const formData = new URLSearchParams();
        formData.append('limitDate', formatDate(newStart));
        formData.append('endDate', formatDate(newEnd));

        fetch(`/task/${mongoId}/actualizar-fechas`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8' },
          body: formData.toString()
        }).catch(err => console.error('Error actualizando fechas en backend:', err));
      }

      renderTasksList();
    }
  },

  eventResize: function(info) {
  const taskId = info.event.id;
  if (tasks[taskId]) {
    tasks[taskId].start = formatDate(info.event.start);
    tasks[taskId].end = formatDate(info.event.end);

    // ← NUEVO: Actualizar en el backend
    const mongoId = tasks[taskId].mongoId;
    if (mongoId) {
      const formData = new URLSearchParams();
      formData.append('limitDate', formatDate(info.event.start));
      formData.append('endDate', formatDate(info.event.end));

      fetch(`/task/${mongoId}/actualizar-fechas`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8' },
        body: formData.toString()
      }).catch(err => console.error('Error actualizando fechas en backend:', err));
    }

    renderTasksList();
  }
},

    dayCellClassNames: function(arg) {
      const classes = [];
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const cellDate = new Date(arg.date);
      cellDate.setHours(0, 0, 0, 0);

      if (cellDate < today) {
        classes.push('fc-day-past-disabled');
      }

      if (arg.date.toDateString() === today.toDateString()) {
        classes.push('fc-day-today');
      }
      if (arg.date.toDateString() === selectedDate.toDateString()) {
        classes.push('selected-day');
      }
      return classes;
    },

    dateClick: function(info) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const clicked = new Date(info.date);
    clicked.setHours(0, 0, 0, 0);

    if (clicked < today) {
      return; // no hacer nada si es pasado
    }

    updateDetailsPanel(info.date);
  },

    datesSet: function() {
      updateCalendarMonth();
      updateCalendarSelection();
    },

    eventDidMount: function(info) {
      const description = info.event.extendedProps.description;
      if (description) {
        info.el.title = description;
      }
    }
  });

  calendar.render();
  updateCalendarMonth();
}

// Navegación entre meses
function setupNavigation() {
  document.getElementById('prev-month').addEventListener('click', () => {
    calendar.prev();
    updateCalendarMonth();
  });

  document.getElementById('next-month').addEventListener('click', () => {
    calendar.next();
    updateCalendarMonth();
  });

  document.getElementById('today-btn').addEventListener('click', () => {
    calendar.today();
    updateDetailsPanel(new Date());
  });

  // Nuevo: click sobre el mes/año
  const monthLabel = document.getElementById('calendar-month');
  monthLabel.addEventListener('click', () => {
    const current = calendar.getDate();
    const currentMonth = current.getMonth();      // 0–11
    const currentYear = current.getFullYear();

    const input = prompt('Ir a (MM/YYYY):', String(currentMonth + 1).padStart(2, '0') + '/' + currentYear);
    if (!input) return;

    const match = input.match(/^(\d{1,2})\/(\d{4})$/);
    if (!match) return;

    let month = parseInt(match[1], 10) - 1; // 0–11
    let year = parseInt(match[2], 10);
    if (month < 0 || month > 11) return;

    goToMonthYear(month, year);
  });
}


// Botón agregar tarea
function setupAddTaskButton() {
  document.getElementById('add-task-btn').addEventListener('click', addTask);

  document.getElementById('task-title').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addTask();
    }
  });
}

// Inicialización
document.addEventListener('DOMContentLoaded', function() {
  initTasksFromServer();   // Mongo → tasks
  setupColorPicker();
  initCalendar();
  setupNavigation();
  setupAddTaskButton();
  updateDetailsPanel(new Date());
});