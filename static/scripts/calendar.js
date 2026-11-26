
/* **************************************** */
// Global status  ////////////////////////////
/* **************************************** */

let calendar;
let selectedDate = new Date();
let tasks = {}; // { eventId: { title, description, start, end, color } }
let selectedColor = '#111827';

function parseLocalDate(dateStr) {
  if (!dateStr) return new Date();
  const match = String(dateStr).match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (match) {
    return new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
  }
  return new Date(dateStr);
}

function escapeHtml(str) {
  return String(str ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/* **************************************** */
// Months and days in English  ///////////////
/* **************************************** */

const monthNames = [
  'JANUARY', 'FEBRUARY', 'MARCH', 'APRIL', 'MAY', 'JUNE',
  'JULY', 'AUGUST', 'SEPTEMBER', 'OCTOBER', 'NOVEMBER', 'DECEMBER'
];

const dayNamesShort = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
const dayNamesFull = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

/* **************************************** */
// Initialize tasks from MongoDB  ////////////
/* **************************************** */

function initTasksFromServer() {
  // Check if window.INIT_TASKS is an array.
  if (!Array.isArray(window.INIT_TASKS)) return;

  // Loop through each element of the INIT_TASKS array
  window.INIT_TASKS.forEach(t => {
    if (!t || !t._id) return;

    const id = 'mongo_' + t._id;
    let startDate, endDate;
    

    if (t.endDate) {
      startDate = parseLocalDate(t.limitDate); // startDate is created from t.limitDate
      endDate = parseLocalDate(t.endDate);
    } else {
      startDate = t.limitDate ? parseLocalDate(t.limitDate) : new Date();
      const duration = t.duration || 1;
      endDate = new Date(startDate);
      endDate.setDate(endDate.getDate() + duration);
    }

    // Check if startDate is a valid data.
    if (isNaN(startDate.getTime())) startDate = new Date();
    // Check if endDate is a valid data.
    if (isNaN(endDate.getTime())) {
      endDate = new Date(startDate);
      endDate.setDate(endDate.getDate() + 1);
    }

    // This eliminates hours, minutes, 
    // and seconds to work with only days.
    startDate.setHours(0, 0, 0, 0);
    endDate.setHours(0, 0, 0, 0);

    const start = formatDate(startDate);
    const end = formatDate(endDate);

    // Add the task to the global tasks object 
    // using the id as the key.
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

/* **************************************** */
// Format date as "YYYY-MM-DD"  //////////////
/* **************************************** */

function formatDate(date) {
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/* **************************************** */
// Format date as "13 February 2026"  ////////
/* **************************************** */

function formatFullDate(date) {
  const d = new Date(date);
  const day = d.getDate();
  const month = monthNames[d.getMonth()];
  const year = d.getFullYear();
  return `${day} ${month.charAt(0) + month.slice(1).toLowerCase()} ${year}`;
}

/* ***************************************** */
// Convert tasks to FullCalendar event format /
/* ***************************************** */

function getCalendarEvents() {
  return Object.keys(tasks).map(id => ({
    id: id,
    title: tasks[id].title,
    start: tasks[id].start,
    end: tasks[id].end,
    backgroundColor: tasks[id].color,
    borderColor: tasks[id].color,
    textColor: '#ffffff',
    extendedProps: {
      description: tasks[id].description
    }
  }));
}

/* **************************************** */
// Update daily details panel  ///////////////
/* **************************************** */

function updateDetailsPanel(date) {

  // Converts the received date into a Date object and saves it
  selectedDate = new Date(date);

  // It obtains the number of the day of the month (ex: 19)
  const day = selectedDate.getDate();
  // Gets the full name of the day of the week and converts it to uppercase
  const dayName = dayNamesFull[selectedDate.getDay()].toUpperCase();

  // Update the selected day number in the DOM
  document.getElementById('selected-day-number').textContent = day;

  document.getElementById('selected-day-name').textContent = dayName;
  document.getElementById('selected-full-date').textContent = formatFullDate(selectedDate);

  updateCalendarSelection();

  renderTasksList();
}

/* **************************************** */
// Update the visual part of the calendar  ///
/* **************************************** */

function updateCalendarSelection() {
  
  // Remove the 'selected-day' class from all calendar days
  // Select all items with the .fc-daygrid-day class (FullCalendar days)
  document.querySelectorAll('.fc-daygrid-day').forEach(day => {
    day.classList.remove('selected-day');
  });

  // Convert the global selected date to a string with the same format
  // that uses the date-date attribute
  const selectedDateStr = formatDate(selectedDate);

  // Re-run all days of the calendar
  document.querySelectorAll('.fc-daygrid-day').forEach(day => {
    // Get the date of the day from the HTML date-date attribute
    const dayDate = day.getAttribute('data-date');
    if (dayDate === selectedDateStr) {
      // Add the 'selected-day' class to visually mark it
      day.classList.add('selected-day');
    }
  });
}

/* *********************************************** */
// Update the title of the month in the calendar  ///
/* *********************************************** */

function updateCalendarMonth() {
  const currentDate = calendar.getDate();
  const month = monthNames[currentDate.getMonth()];
  const year = currentDate.getFullYear();
  document.getElementById('calendar-month').textContent = `${month} ${year}`;
}

/* **************************************** */
// Navigate to a specific month and year  ////
/* **************************************** */

function goToMonthYear(monthIndex, year) {
  const date = new Date(year, monthIndex, 1);
  calendar.gotoDate(date);
  updateCalendarMonth();
  updateCalendarSelection();
}

/* ***************************************** */
// Render list of tasks for the selected day  /
/* ***************************************** */

function renderTasksList() {
  const container = document.getElementById('tasks-list');
  const selectedDateStr = formatDate(selectedDate);

  // Filter tasks that include the selected day
  const dayTasks = Object.keys(tasks).filter(id => {
    const task = tasks[id];
    return selectedDateStr >= task.start && selectedDateStr < task.end;
  });

  // If there is no event, it indicates it
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

  // Go through the tasks
  dayTasks.forEach(id => {
    const task = tasks[id];
    const card = document.createElement('div');
    card.className = 'task-card';
    card.id = `task-${id}`;

    // Calcular duración en días
    const start = parseLocalDate(task.start);
    const end = parseLocalDate(task.end);
    const durationDays = Math.ceil((end - start) / (1000 * 60 * 60 * 24));
    const safeTitle = escapeHtml(task.title);
    const safeDesc = escapeHtml(task.description || '');

      // Checks if the task's editing property is true
      if (task.editing) {
        // If the task's editing property is true, display it in editing mode
        card.classList.add('editing');
        card.innerHTML = `
          <input type="text" class="edit-input" id="edit-title-${id}" value="${safeTitle}" maxlength="100">
          <textarea class="edit-input edit-textarea" id="edit-desc-${id}" maxlength="300">${safeDesc}</textarea>
          <div class="task-actions">
            <button type="button" class="task-btn save" onclick="saveTaskEdit('${id}')">Save</button>
            <button type="button" class="task-btn" onclick="cancelTaskEdit('${id}')">Cancel</button>
          </div>
        `;
      // If not, display the events
      } else {
        card.innerHTML = `
          <div class="task-card-inner">
            <div class="task-main">
              <div class="flex-1">
                <div class="task-title">${safeTitle}</div>
                ${
                  task.description
                    ? `<div class="task-description" title="${safeDesc}">${safeDesc}</div>`
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
            <div class="task-actions">
              <button type="button" class="task-btn" onclick="editTask('${id}')">Edit</button>
              <button type="button" class="task-btn delete" onclick="deleteTask('${id}')">Delete</button>
            </div>
          </div>
        `;
      }


    container.appendChild(card);
  });
}

/* **************************************** */
// Add a new event  //////////////////////////
/* **************************************** */

function addTask() {
  const title = document.getElementById('task-title').value.trim();
  const description = document.getElementById('task-description').value.trim();
  const duration = parseInt(document.getElementById('task-duration').value) || 1;
  const color = selectedColor;

  // If the title is empty, exit the function
  if (!title) {
    return;
  }

  // Calculate end date
  const startDate = new Date(selectedDate);
  startDate.setHours(0, 0, 0, 0);

  const endDate = new Date(startDate);
  endDate.setDate(endDate.getDate() + duration);

  // Generate an identifier
  const id = 'task_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);

  // Create event in memory
  tasks[id] = {
    title: title,
    description: description,
    start: formatDate(startDate),
    end: formatDate(endDate),
    color: color,
    editing: false
  };

  // Add an event to the calendar
  calendar.addEvent({
    id: id,
    title: title,
    start: formatDate(startDate),
    end: formatDate(endDate),
    backgroundColor: color,
    borderColor: color,
    textColor: '#ffffff',
    extendedProps: {
      description: description
    }
  });

  // Send it to the backend without reloading the page
  const formData = new URLSearchParams();
  formData.append('type', 'task');
  formData.append('titol', title);
  formData.append('descripcio', description);
  formData.append('limitDate', formatDate(startDate));
  formData.append('endDate', formatDate(endDate));
  formData.append('duration', duration);
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

  // Clean the form
  document.getElementById('task-title').value = '';
  document.getElementById('task-description').value = '';
  document.getElementById('task-duration').value = '1';

  renderTasksList();
}

/* **************************************** */
// Edit an event  ////////////////////////////
/* **************************************** */

function editTask(id) {
  if (!tasks[id]) return;

  tasks[id].editing = true;
  renderTasksList();

  //Find the title text input within the DOM.
  setTimeout(() => {
    const input = document.getElementById(`edit-title-${id}`);
    if (input) {
      input.focus(); // So the user can write directly to it
      input.select(); // So you can easily overwrite it
    }
  }, 50);
}

/* **************************************** */
// Save the edited event  ////////////////////
/* **************************************** */

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
  
  // Update frontend
  tasks[id].title = newTitle;
  tasks[id].description = newDesc;
  tasks[id].editing = false;

  // Update event in FullCalendar
  const event = calendar.getEventById(id);
  if (event) {
    event.setProp('title', newTitle);
    event.setExtendedProp('description', newDesc);
  }

  // Send to backend if it has mongoId
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

/* **************************************** */
// Cancel the edited event  //////////////////
/* **************************************** */

function cancelTaskEdit(id) {
  if (!tasks[id]) return;
  tasks[id].editing = false;
  renderTasksList();
}

/* **************************************** */
// Eliminate event  //////////////////////////
/* **************************************** */

function deleteTask(id) {
  if (!tasks[id]) return;
  
  const mongoId = tasks[id].mongoId;
  
  if (!mongoId) {
    delete tasks[id];
    const event = calendar.getEventById(id);
    if (event) event.remove();
    renderTasksList();
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

/* **************************************** */
// Color selector  ///////////////////////////
/* **************************************** */

function setupColorPicker() {
  const colorOptions = document.querySelectorAll('.color-option');

  // Mark the first as active by default
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

/* **************************************** */
// Initialize FullCalendar  //////////////////
/* **************************************** */

function initCalendar() {
  const calendarEl = document.getElementById('calendar');

  calendar = new FullCalendar.Calendar(calendarEl, {
    initialView: 'dayGridMonth',   // Month in grid
    locale: 'en',
    firstDay: 1,                   // Week starts on Monday
    height: 'auto',
    headerToolbar: false,          // Don't show any upper toolbar
    editable: true,
    droppable: true,
    eventResizableFromStart: true, // Allow resizing from the start of the event
    expandRows: true,
    dayMaxEvents: 1,               // Maximum 1 visible event per cell

    // Get the calendar events
    events: getCalendarEvents(),

    // Display days of the week with initial
    dayHeaderFormat: { weekday: 'narrow' },

    eventClick: function(info) {
      const task = tasks[info.event.id]; // Get the clicked event
      if (!task) return;

      updateDetailsPanel(info.event.start);

      // softer drag
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

  // When an event is postponed to another date
  eventDrop: function(info) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const newStart = new Date(info.event.start);
    newStart.setHours(0, 0, 0, 0);

    // Do not allow moving to past days
    if (newStart < today) {
      info.revert(); // return to original position
      return;
    }
    
    const taskId = info.event.id;
    if (tasks[taskId]) {
      // Calculate the old duration
      const oldStart = new Date(tasks[taskId].start);
      const oldEnd = new Date(tasks[taskId].end);
      const duration = oldEnd - oldStart;

      // New end date keeping the duration
      const newStart = new Date(info.event.start);
      const newEnd = new Date(newStart.getTime() + duration);

      // Update the event dates
      tasks[taskId].start = formatDate(newStart);
      tasks[taskId].end = formatDate(newEnd);

      // Update the event in FullCalendar
      info.event.setEnd(newEnd);

      // Update in the backend
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

      // Refresh events list
      renderTasksList();
    }
  },

  // When an event is resized
  eventResize: function(info) {
  
  // Update the event dates
  const taskId = info.event.id;
  if (tasks[taskId]) {
    tasks[taskId].start = formatDate(info.event.start);
    tasks[taskId].end = formatDate(info.event.end);

    // Update in the backend
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

    // Add CSS classes to each day cell
    dayCellClassNames: function(arg) {
      const classes = [];
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const cellDate = new Date(arg.date);
      cellDate.setHours(0, 0, 0, 0);

      if (cellDate < today) {
        classes.push('fc-day-past-disabled'); // Days passed disabled
      }

      if (arg.date.toDateString() === today.toDateString()) {
        classes.push('fc-day-today'); // Durrent day
      }
      if (arg.date.toDateString() === selectedDate.toDateString()) {
        classes.push('selected-day'); // Delected day
      }
      return classes;
    },

    // When a calendar cell is clicked
    dateClick: function(info) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const clicked = new Date(info.date);
    clicked.setHours(0, 0, 0, 0);

    if (clicked < today) {
      return; // Do nothing if it's a past day
    }

    // Update the details pane
    updateDetailsPanel(info.date);
  },

    // When the calendar view changes
    datesSet: function() {
      updateCalendarMonth(); // update the month title
      updateCalendarSelection(); // update the selected day
    }
  });

  calendar.render();
  updateCalendarMonth();
}

/* **************************************** */
// Navigation between months  ////////////////
/* **************************************** */

function setupNavigation() {

  // "Previous Month" button
  document.getElementById('prev-month').addEventListener('click', () => {
    calendar.prev();
    updateCalendarMonth();
  });

  // "Next Month" button
  document.getElementById('next-month').addEventListener('click', () => {
    calendar.next();
    updateCalendarMonth();
  });

  // "Today" button
  document.getElementById('today-btn').addEventListener('click', () => {
    calendar.today();
    updateDetailsPanel(new Date());
  });

  // Click on the month/year to jump to a specific date
  const monthLabel = document.getElementById('calendar-month');
  monthLabel.addEventListener('click', () => {
    const current = calendar.getDate();         // Get the current date from the calendar
    const currentMonth = current.getMonth();    // Get the current month 0–11
    const currentYear = current.getFullYear();  // Get the current year

    // Displays a prompt asking for MM/YYYY, pre-filled with the current month/year
    const input = prompt('Go to (MM/YYYY):', String(currentMonth + 1).padStart(2, '0') + '/' + currentYear);
    if (!input) return; // If nothing is entered, exit

    // Check that the format is correct (MM/YYYY)
    const match = input.match(/^(\d{1,2})\/(\d{4})$/);
    if (!match) return;

    let month = parseInt(match[1], 10) - 1;
    let year = parseInt(match[2], 10);
    if (month < 0 || month > 11) return;

    goToMonthYear(month, year);
  });
}

/* **************************************** */
// Button "Add event"  ///////////////////////
/* **************************************** */

function setupAddTaskButton() {
  const form = document.getElementById('task-form');
  if (form) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      addTask();
    });
  }

  document.getElementById('add-task-btn').addEventListener('click', addTask);

  document.getElementById('task-title').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addTask();
    }
  });
}

/* **************************************** */
// Initialize  ///////////////////////////////
/* **************************************** */

document.addEventListener('DOMContentLoaded', function() {
  initTasksFromServer();   // Mongo → events
  setupColorPicker();
  initCalendar();
  setupNavigation();
  setupAddTaskButton();
  updateDetailsPanel(new Date());
});