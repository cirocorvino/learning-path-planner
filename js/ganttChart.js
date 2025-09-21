// ganttChart.js - Gestione del diagramma di Gantt

// Render del diagramma di Gantt
function renderGantt() {
    // Generate timeline months first
    generateTimelineMonths();
    
    const tbody = document.getElementById('ganttBody');
    tbody.innerHTML = '';
    
    courses.forEach(course => {
        const position = calculateBarPosition(course.startDate, course.endDate);
        const row = document.createElement('tr');
        
        if (editMode) {
            row.innerHTML = `
                <td>
                    <input class="course-input" value="${course.name}" 
                           onchange="updateCourse(${course.id}, 'name', this.value)">
                </td>
                <td>
                    <input class="course-input" type="number" value="${course.hours}" style="width: 60px;"
                           onchange="updateCourse(${course.id}, 'hours', this.value)">
                </td>
                <td>${course.weeks}</td>
                <td>
                    <input type="date" class="course-input" value="${course.startDate}" style="width: 120px;"
                           onchange="updateCourse(${course.id}, 'startDate', this.value)">
                </td>
                <td>
                    <div class="gantt-bar-container">
                        <div class="gantt-bar" 
                             style="left: ${position.left}%; width: ${position.width}%; background: ${course.color};"
                             onclick="showCourseDetail(${course.id})">
                            ${course.weeks} sett
                        </div>
                    </div>
                    <button class="delete-course-btn" onclick="deleteCourse(${course.id})">🗑️</button>
                </td>
            `;
        } else {
            row.innerHTML = `
                <td class="course-name">${course.name}</td>
                <td>${Math.round(course.hours)}h</td>
                <td>${course.weeks} sett</td>
                <td>${formatDate(course.startDate)}-${formatDate(course.endDate)}</td>
                <td>
                    <div class="gantt-bar-container">
                        <div class="gantt-bar" 
                             style="left: ${position.left}%; width: ${position.width}%; background: ${course.color};"
                             onclick="showCourseDetail(${course.id})">
                            ${course.weeks} sett
                        </div>
                    </div>
                </td>
            `;
        }
        tbody.appendChild(row);
    });
}

// Calcola posizione della barra nel Gantt
function calculateBarPosition(startDate, endDate) {
    if (courses.length === 0) return { left: 0, width: 10 };
    
    // IMPORTANTE: usa le stesse date per barre e mesi
    const firstCourseStart = new Date(courses[0].startDate);
    const lastCourseEnd = new Date(courses[courses.length - 1].endDate);
    
    // Calcola il periodo totale in giorni
    const totalDays = (lastCourseEnd - firstCourseStart) / (1000 * 60 * 60 * 24);
    
    if (totalDays === 0) return { left: 0, width: 10 };
    
    const courseStart = new Date(startDate);
    const courseEnd = new Date(endDate);
    
    // Calcola offset e durata in giorni
    const startOffset = (courseStart - firstCourseStart) / (1000 * 60 * 60 * 24);
    const duration = (courseEnd - courseStart) / (1000 * 60 * 60 * 24);
    
    // Converti in percentuali
    const left = (startOffset / totalDays) * 100;
    const width = (duration / totalDays) * 100;
    
    Logger.debug(`Course: left=${left.toFixed(1)}%, width=${width.toFixed(1)}%`);
    
    return { 
        left: Math.max(0, left), 
        width: Math.min(100, width) // Non superare il 100%
    };
}

// Genera la timeline dei mesi
function generateTimelineMonths() {
    const timelineDiv = document.getElementById('timelineMonths');
    if (!timelineDiv || courses.length === 0) return;
    
    timelineDiv.innerHTML = '';
    
    // Usa ESATTAMENTE le stesse date delle barre
    const firstCourseStart = new Date(courses[0].startDate);
    const lastCourseEnd = new Date(courses[courses.length - 1].endDate);
    
    // Calcola il periodo totale in giorni (stesso calcolo delle barre)
    const totalDays = (lastCourseEnd - firstCourseStart) / (1000 * 60 * 60 * 24);
    
    // Genera tutti i mesi nel periodo
    let currentMonth = new Date(firstCourseStart.getFullYear(), firstCourseStart.getMonth(), 1);
    const endMonth = new Date(lastCourseEnd.getFullYear(), lastCourseEnd.getMonth() + 1, 0);
    
    let monthsHtml = '';
    let previousYear = null;
    
    while (currentMonth <= endMonth) {
        const monthName = monthNamesFull[currentMonth.getMonth()];
        const year = currentMonth.getFullYear();
        
        // Calcola inizio e fine del mese
        const monthStart = new Date(Math.max(currentMonth, firstCourseStart));
        const nextMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1);
        const monthEnd = new Date(Math.min(nextMonth - 1, lastCourseEnd));
        
        // Calcola posizione e larghezza in giorni
        const offsetDays = (monthStart - firstCourseStart) / (1000 * 60 * 60 * 24);
        const monthDays = (monthEnd - monthStart) / (1000 * 60 * 60 * 24) + 1;
        
        // Converti in percentuali (stesso calcolo delle barre)
        const leftPercent = (offsetDays / totalDays) * 100;
        const widthPercent = (monthDays / totalDays) * 100;
        
        let yearLabel = '';
        if (year !== previousYear) {
            yearLabel = `<div style="font-size: 0.65em; opacity: 0.7;">${year}</div>`;
            previousYear = year;
        }
        
        monthsHtml += `
            <div class="month" style="position: absolute; left: ${leftPercent}%; width: ${widthPercent}%; overflow: hidden;">
                ${monthName}
                ${yearLabel}
            </div>
        `;
        
        currentMonth.setMonth(currentMonth.getMonth() + 1);
    }
    
    // Imposta il contenitore
    timelineDiv.style.position = 'relative';
    timelineDiv.style.height = '50px';
    timelineDiv.innerHTML = monthsHtml;
    
    // Aggiorna l'header
    const header = document.getElementById('timelineHeader');
    if (header) {
        const firstMonth = monthNamesFull[firstCourseStart.getMonth()];
        const lastMonth = monthNamesFull[lastCourseEnd.getMonth()];
        header.textContent = `Timeline ${firstMonth} ${firstCourseStart.getFullYear()} - ${lastMonth} ${lastCourseEnd.getFullYear()}`;
    }
}

// Aggiorna corso
function updateCourse(courseId, field, value) {
    const course = courses.find(c => c.id === courseId);
    if (course) {
        if (field === 'hours') {
            course[field] = parseFloat(value) || 0;
        } else {
            course[field] = value;
        }
        
        if (field === 'hours' || field === 'startDate') {
            recalculateDates();
        } else {
            
        }
    }
}

// Elimina corso
function deleteCourse(courseId) {
    if (confirm('Sei sicuro di voler eliminare questo corso?')) {
        courses = courses.filter(c => c.id !== courseId);
        recalculateDates();
    }
}

// Aggiungi nuovo corso
function addNewCourse() {
    const name = document.getElementById('newCourseName').value;
    const hours = parseFloat(document.getElementById('newCourseHours').value);
    const color = document.getElementById('newCourseColor').value;
    
    if (name && hours) {
        const newId = Math.max(...courses.map(c => c.id), 0) + 1;
        courses.push({
            id: newId,
            name: name,
            hours: hours,
            color: color
        });
        
        recalculateDates();
        closeAddCourseModal();
        
        document.getElementById('newCourseName').value = '';
        document.getElementById('newCourseHours').value = '';
        document.getElementById('newCourseColor').value = '#667eea';
    }
}