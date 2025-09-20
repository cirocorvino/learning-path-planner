# 💾 SISTEMA SALVATAGGIO E BACKUP - Guida Completa

## 🏗️ **ARCHITETTURA SISTEMA SALVATAGGIO**

### **1. Storage Locale (Browser)**
```javascript
localStorage.setItem('saved-study-plans', JSON.stringify(allPlans));
localStorage.setItem('last-used-plan', planId);
```

**Vantaggi:**
- ✅ Persistenza automatica tra sessioni
- ✅ Nessun server richiesto
- ✅ Accesso immediato offline

**Limitazioni:**
- ⚠️ Limitato al browser specifico
- ⚠️ Massimo ~5-10MB di dati
- ⚠️ Può essere cancellato dall'utente

### **2. Export/Import File JSON**
```javascript
// Export
const blob = new Blob([JSON.stringify(planData, null, 2)], { type: 'application/json' });

// Import
const reader = new FileReader();
reader.onload = function(e) {
    const data = JSON.parse(e.target.result);
}
```

## 📊 **STRUTTURA DATI COMPLETA**

### **Formato Piano Salvato**
```json
{
  "courses": [
    {
      "id": 1,
      "name": "AI Applicata",
      "hours": 106.85,
      "color": "#FF6B6B",
      "startDate": "2025-09-08",
      "endDate": "2025-09-28",
      "weeks": 3
    }
  ],
  "weeklySchedules": {
    "1-0": {
      "Lunedì": [
        {
          "time": "21:00-23:00",
          "content": "📚 Studio AI - Introduzione ML",
          "type": "study",
          "modules": [...]
        }
      ]
    }
  },
  "courseTopics": {
    "1-0_customModules": [...],
    "1-0_distributed": [...],
    "1-0_paramsVersion": "1.5-1.2-3-5"
  },
  "weeklyHours": 15,
  "globalStartDate": "2025-09-08",
  "metadata": {
    "id": "plan_1726912345678_abc123def",
    "name": "Piano AI Development",
    "description": "Piano personalizzato",
    "createdAt": "2025-09-21T10:30:00.000Z",
    "modifiedAt": "2025-09-21T14:15:30.000Z"
  }
}
```

## ⚡ **FUNZIONALITÀ DISPONIBILI**

### **1. Salvataggio Locale**
```javascript
function savePlan() {
    // Genera ID univoco se nuovo piano
    const planId = currentPlanId || generatePlanId();
    
    // Raccoglie tutti i dati correnti
    const planData = getCurrentPlanData();
    
    // Salva nel localStorage
    savePlanToStorage(planId, planData);
}
```

**Cosa viene salvato:**
- 📚 Lista corsi con ore calcolate
- 📅 Schedulazioni settimanali personalizzate
- ⚙️ Configurazioni (ore/settimana, data inizio)
- 📝 Argomenti personalizzati per settimana
- 📋 Metadati (nome, descrizione, date)

### **2. Gestione Multi-Piano**
```javascript
// Struttura localStorage
'saved-study-plans': {
  'plan_123_abc': { ...pianoDati },
  'plan_456_def': { ...pianoDati },
  'plan_789_ghi': { ...pianoDati }
}
'last-used-plan': 'plan_123_abc'
```

**Operazioni disponibili:**
- ➕ **Salva nuovo piano**
- 📁 **Carica piano esistente**
- 🗑️ **Elimina piano**
- 📋 **Duplica piano**
- 📤 **Esporta piano specifico**

### **3. Auto-Ripristino**
```javascript
function loadLastPlan() {
    const lastPlanId = localStorage.getItem('last-used-plan');
    // Carica automaticamente l'ultimo piano usato
}
```

### **4. Import/Export Avanzato**
```javascript
function loadData(event) {
    // Gestisce sia formati vecchi che nuovi
    const isNewPlan = !data.metadata || !data.metadata.id;
    
    if (isNewPlan) {
        // Formato legacy o dati semplici
    } else {
        // Piano completo con metadati
    }
}
```

## 🎯 **SCENARI D'USO IMPLEMENTABILI**

### **📚 SCENARIO 1: Studente Universitario**

**Caso d'uso:**
```
"Sto seguendo un master in AI. Ho bisogno di:
- Piano per semestre autunnale
- Piano per semestre primaverile  
- Piano intensivo estivo
- Backup condivisi con compagni di studio"
```

**Implementazione:**
```javascript
// Crea piani specializzati
savePlan("Master AI - Semestre Autunno 2025");
savePlan("Master AI - Semestre Primavera 2026");
savePlan("Bootcamp Estivo - Deep Learning");

// Export per condivisione
exportPlan(); // Genera file JSON condivisibile
```

### **🏢 SCENARIO 2: Formazione Aziendale**

**Caso d'uso:**
```
"L'azienda deve formare 20 sviluppatori:
- Piano base per junior (6 mesi)
- Piano avanzato per senior (3 mesi)
- Piano specializzazione LLM (2 mesi)
- Tracking progresso individuale"
```

**Implementazione:**
```javascript
// Template aziendali
const templateJunior = exportPlan("Template-Junior-6mesi");
const templateSenior = exportPlan("Template-Senior-3mesi");
const templateLLM = exportPlan("Template-LLM-Specializzazione");

// Personalizzazione per dipendente
loadData(templateJunior);
planData.metadata.name = "Mario Rossi - Piano Junior";
planData.globalStartDate = "2025-10-01";
savePlan();
```

### **🎓 SCENARIO 3: Bootcamp/Scuola**

**Caso d'uso:**
```
"Gestisco un bootcamp AI:
- Curriculum standard per tutti
- Personalizzazioni per studenti
- Backup periodici
- Export per portfolio studenti"
```

**Implementazione:**
```javascript
// Master template
savePlan("Bootcamp-AI-Master-Template");

// Versioni studente personalizzate
students.forEach(student => {
    loadPlan("master-template");
    customizeForStudent(student.level, student.goals);
    savePlan(`${student.name}-Piano-Personalizzato`);
});
```

### **🔄 SCENARIO 4: Versioning e Backup**

**Caso d'uso:**
```
"Voglio tenere traccia dell'evoluzione del mio piano:
- Versioni settimanali automatiche
- Backup cloud periodici
- Rollback a versioni precedenti
- Comparazione tra versioni"
```

**Implementazione:**
```javascript
// Sistema versioning
function createWeeklyBackup() {
    const currentPlan = getCurrentPlanData();
    const versionName = `${currentPlanName}-Backup-${new Date().toISOString().split('T')[0]}`;
    
    currentPlan.metadata.name = versionName;
    currentPlan.metadata.isBackup = true;
    
    savePlanToStorage(generatePlanId(), currentPlan);
}

// Auto-backup settimanale
setInterval(createWeeklyBackup, 7 * 24 * 60 * 60 * 1000); // 7 giorni
```

## 🚀 **IMPLEMENTAZIONI AVANZATE POSSIBILI**

### **1. Sincronizzazione Cloud**
```javascript
// Integrazione con servizi cloud
function syncToCloud() {
    const allPlans = getSavedPlans();
    
    // Google Drive API
    gapi.client.drive.files.create({
        name: 'study-plans-backup.json',
        parents: ['study-plans-folder'],
        uploadType: 'media',
        body: JSON.stringify(allPlans)
    });
}

// Dropbox API
function syncToDropbox() {
    const allPlans = getSavedPlans();
    
    fetch('https://content.dropboxapi.com/2/files/upload', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${dropboxToken}`,
            'Dropbox-API-Arg': JSON.stringify({
                path: '/study-plans-backup.json',
                mode: 'overwrite'
            }),
            'Content-Type': 'application/octet-stream'
        },
        body: JSON.stringify(allPlans)
    });
}
```

### **2. Collaborazione Multi-Utente**
```javascript
// Sistema di condivisione
function shareWithUser(planId, userEmail) {
    const planData = getSavedPlans()[planId];
    planData.metadata.sharedWith = planData.metadata.sharedWith || [];
    planData.metadata.sharedWith.push({
        email: userEmail,
        permissions: 'read', // read, write, admin
        sharedAt: new Date().toISOString()
    });
    
    // Invia via email o piattaforma di condivisione
    sendPlanByEmail(userEmail, planData);
}
```

### **3. Analytics e Tracking**
```javascript
// Sistema di tracking progresso
function trackProgress() {
    const progressData = {
        planId: currentPlanId,
        completedHours: getCompletedHours(),
        currentWeek: getCurrentWeek(),
        progressPercentage: (completedHours / totalHours) * 100,
        timestamp: new Date().toISOString()
    };
    
    // Salva storico progresso
    const progressHistory = JSON.parse(localStorage.getItem('progress-history') || '[]');
    progressHistory.push(progressData);
    localStorage.setItem('progress-history', JSON.stringify(progressHistory));
}
```

### **4. Template Marketplace**
```javascript
// Sistema template condivisi
const templateMarketplace = {
    templates: [
        {
            id: 'ai-beginner',
            name: 'AI per Principianti',
            author: 'AI Academy',
            downloads: 1547,
            rating: 4.8,
            tags: ['ai', 'beginner', 'python'],
            planData: { ...templateData }
        }
    ]
};

function downloadTemplate(templateId) {
    const template = templateMarketplace.templates.find(t => t.id === templateId);
    loadPlanFromData(template.planData);
    currentPlanName = `${template.name} - Importato`;
    renderGantt();
}
```

### **5. Export Avanzato**
```javascript
// Export in formati multipli
function exportToPDF() {
    // Usa jsPDF per creare PDF del piano
    const doc = new jsPDF();
    doc.text(currentPlanName, 10, 10);
    // ... aggiungi contenuto piano
    doc.save(`${currentPlanName}.pdf`);
}

function exportToCalendar() {
    // Crea file ICS per Google Calendar/Outlook
    let icsContent = 'BEGIN:VCALENDAR\nVERSION:2.0\n';
    
    courses.forEach(course => {
        icsContent += `BEGIN:VEVENT\n`;
        icsContent += `DTSTART:${course.startDate.replace(/-/g, '')}\n`;
        icsContent += `DTEND:${course.endDate.replace(/-/g, '')}\n`;
        icsContent += `SUMMARY:${course.name}\n`;
        icsContent += `END:VEVENT\n`;
    });
    
    icsContent += 'END:VCALENDAR';
    
    const blob = new Blob([icsContent], { type: 'text/calendar' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${currentPlanName}.ics`;
    a.click();
}
```

## 🛡️ **BEST PRACTICES SICUREZZA**

### **1. Validazione Dati Import**
```javascript
function validateImportedPlan(data) {
    if (!data.courses || !Array.isArray(data.courses)) {
        throw new Error('Formato piano non valido');
    }
    
    // Sanitizza dati
    data.courses.forEach(course => {
        course.name = sanitizeString(course.name);
        course.hours = Math.max(0, parseFloat(course.hours) || 0);
    });
    
    return data;
}
```

### **2. Backup Automatici**
```javascript
function createEmergencyBackup() {
    const allData = {
        plans: getSavedPlans(),
        lastPlan: localStorage.getItem('last-used-plan'),
        timestamp: new Date().toISOString()
    };
    
    localStorage.setItem('emergency-backup', JSON.stringify(allData));
}
```

### **3. Gestione Quota Storage**
```javascript
function checkStorageQuota() {
    const totalSize = JSON.stringify(getSavedPlans()).length;
    const maxSize = 5 * 1024 * 1024; // 5MB
    
    if (totalSize > maxSize * 0.8) {
        alert('Attenzione: spazio localStorage quasi esaurito. Considera di esportare e eliminare piani vecchi.');
    }
}
```

## 📋 **CHECKLIST IMPLEMENTAZIONE**

### **Funzionalità Base** ✅
- [x] Salvataggio localStorage
- [x] Caricamento automatico ultimo piano
- [x] Export/Import JSON
- [x] Gestione multi-piano
- [x] Duplicazione piani

### **Funzionalità Avanzate** 🔄
- [ ] Sincronizzazione cloud (Google Drive, Dropbox)
- [ ] Export PDF/Calendar
- [ ] Sistema versioning
- [ ] Condivisione collaborative
- [ ] Template marketplace
- [ ] Analytics progresso
- [ ] Backup automatici programmati

Questo sistema offre una base solida per gestire piani di studio complessi con possibilità di estensioni avanzate secondo le necessità specifiche del caso d'uso.