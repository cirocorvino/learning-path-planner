// ganttChart.js - Gestione del diagramma di Gantt

function renderGantt() {
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

function calculateBarPosition(startDate, endDate) {
    if (courses.length === 0) return { left: 0, width: 10 };

    const firstCourseStart = new Date(courses[0].startDate);
    const lastCourseEnd = new Date(courses[courses.length - 1].endDate);
    const totalDays = (lastCourseEnd - firstCourseStart) / (1000 * 60 * 60 * 24);

    if (totalDays === 0) return { left: 0, width: 10 };

    const courseStart = new Date(startDate);
    const courseEnd = new Date(endDate);
    const startOffset = (courseStart - firstCourseStart) / (1000 * 60 * 60 * 24);
    const duration = (courseEnd - courseStart) / (1000 * 60 * 60 * 24);
    const left = (startOffset / totalDays) * 100;
    const width = (duration / totalDays) * 100;

    Logger.debug(`Course: left=${left.toFixed(1)}%, width=${width.toFixed(1)}%`);

    return {
        left: Math.max(0, left),
        width: Math.min(100, width)
    };
}

function generateTimelineMonths() {
    const timelineDiv = document.getElementById('timelineMonths');
    if (!timelineDiv) return;

    timelineDiv.innerHTML = '';
    if (courses.length === 0) {
        const header = document.getElementById('timelineHeader');
        if (header) header.textContent = 'Timeline';
        return;
    }

    const firstCourseStart = new Date(courses[0].startDate);
    const lastCourseEnd = new Date(courses[courses.length - 1].endDate);
    const totalDays = (lastCourseEnd - firstCourseStart) / (1000 * 60 * 60 * 24);

    let currentMonth = new Date(firstCourseStart.getFullYear(), firstCourseStart.getMonth(), 1);
    const endMonth = new Date(lastCourseEnd.getFullYear(), lastCourseEnd.getMonth() + 1, 0);
    let monthsHtml = '';
    let previousYear = null;

    while (currentMonth <= endMonth) {
        const monthName = monthNamesFull[currentMonth.getMonth()];
        const year = currentMonth.getFullYear();
        const monthStart = new Date(Math.max(currentMonth, firstCourseStart));
        const nextMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1);
        const monthEnd = new Date(Math.min(nextMonth - 1, lastCourseEnd));
        const offsetDays = (monthStart - firstCourseStart) / (1000 * 60 * 60 * 24);
        const monthDays = (monthEnd - monthStart) / (1000 * 60 * 60 * 24) + 1;
        const denominator = totalDays || 1;
        const leftPercent = (offsetDays / denominator) * 100;
        const widthPercent = (monthDays / denominator) * 100;

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

    timelineDiv.style.position = 'relative';
    timelineDiv.style.height = '50px';
    timelineDiv.innerHTML = monthsHtml;

    const header = document.getElementById('timelineHeader');
    if (header) {
        const firstMonth = monthNamesFull[firstCourseStart.getMonth()];
        const lastMonth = monthNamesFull[lastCourseEnd.getMonth()];
        header.textContent = `Timeline ${firstMonth} ${firstCourseStart.getFullYear()} - ${lastMonth} ${lastCourseEnd.getFullYear()}`;
    }
}

function updateCourse(courseId, field, value) {
    const course = courses.find(item => item.id === courseId);
    if (!course) return;

    if (field === 'name') {
        const oldName = course.name;
        const newName = String(value || '').trim();
        if (!newName || newName === oldName) return;

        course.name = newName;
        curriculum[newName] = curriculum[oldName] || { modules: [] };
        delete curriculum[oldName];
    } else if (field === 'hours') {
        const hours = parseFloat(value) || 0;
        course.hours = hours;

        const modules = curriculum[course.name]?.modules || [];
        if (modules.length === 0) {
            curriculum[course.name] = {
                modules: [{ name: `${course.name} - Attività`, time: hours }]
            };
        } else if (modules.length === 1 && modules[0].name === `${course.name} - Attività`) {
            modules[0].time = hours;
        }
    } else {
        course[field] = value;
    }

    if (field === 'hours' || field === 'startDate') {
        recalculateDates();
    } else {
        renderGantt();
    }

    window.FileStore?.markDirty('Modulo modificato');
}

function deleteCourse(courseId) {
    const course = courses.find(item => item.id === courseId);
    if (!course || !confirm(`Eliminare il modulo “${course.name}”?`)) return;

    courses = courses.filter(item => item.id !== courseId);
    delete curriculum[course.name];

    Object.keys(weeklySchedules).forEach(key => {
        if (key.startsWith(`${courseId}-`)) delete weeklySchedules[key];
    });
    Object.keys(courseTopics).forEach(key => {
        if (key.startsWith(`${courseId}-`)) delete courseTopics[key];
    });

    selectedCourse = null;
    recalculateDates();
    window.FileStore?.markDirty('Modulo eliminato');
}

function addNewCourse() {
    const name = document.getElementById('newCourseName').value.trim();
    const hours = parseFloat(document.getElementById('newCourseHours').value);
    const color = document.getElementById('newCourseColor').value;

    if (!name || !Number.isFinite(hours) || hours <= 0) {
        alert('Inserire nome e numero di ore validi.');
        return;
    }

    const newId = Math.max(...courses.map(course => course.id), 0) + 1;
    courses.push({
        id: newId,
        name,
        hours,
        color
    });
    curriculum[name] = {
        modules: [{ name: `${name} - Attività`, time: hours }]
    };

    recalculateDates();
    closeAddCourseModal();

    document.getElementById('newCourseName').value = '';
    document.getElementById('newCourseHours').value = '';
    document.getElementById('newCourseColor').value = '#667eea';
    window.FileStore?.markDirty('Modulo aggiunto');
}
