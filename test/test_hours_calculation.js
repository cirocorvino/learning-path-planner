// Script di verifica calcolo ore effettive

// Parametri di calcolo (dal file config.js)
const calculationParams = {
    theoryMultiplier: 1.5,
    practiceMultiplier: 1.2,
    exerciseHours: 3,      // Ore fisse per esercitazioni
    projectHours: 5        // Ore fisse per progetti
};

// Calcolo ore effettive per singolo modulo
function calculateModuleEffectiveTime(module) {
    const originalTime = module.time;
    
    if (module.name.startsWith('Progetto:')) {
        return calculationParams.projectHours;
    } else if (module.name.includes('Esercitazione') || module.name.includes('Esercitazioni')) {
        return calculationParams.exerciseHours;
    } else if (module.name.includes('Teoria')) {
        return originalTime * calculationParams.theoryMultiplier;
    } else if (module.name.includes('Pratica')) {
        return originalTime * calculationParams.practiceMultiplier;
    } else {
        return originalTime * calculationParams.practiceMultiplier;
    }
}

// Test AI Applicata
const aiApplicataModules = [
    { name: 'Introduzione ML - Teoria', time: 0.5 },
    { name: 'Dataset - Teoria', time: 0.5 },
    { name: 'Dataset CSV/JSON/XML - Pratica', time: 1 },
    { name: 'Data Preprocessing Encoding - Pratica', time: 1.5 },
    { name: 'Data Preprocessing Missing Data - Pratica', time: 1.5 },
    { name: 'Data Preprocessing Normalizzazione - Pratica', time: 1 },
    { name: 'Data Preprocessing - Esercitazione', time: 1.5 },
    { name: 'Regressione Lineare - Teoria', time: 1.5 },
    { name: 'Regressione Minimi Quadrati - Teoria', time: 1 },
    { name: 'Regressione scikit-learn - Pratica', time: 2 },
    { name: 'Regressione Multipla/Polinomiale - Pratica', time: 2 },
    { name: 'Regressione Abitazioni - Esercitazione', time: 2 },
    { name: 'Overfitting - Teoria', time: 1 },
    { name: 'Cross-validation - Pratica', time: 1.5 },
    { name: 'Regolarizzazione L1/L2 - Pratica', time: 2 },
    { name: 'Overfitting - Esercitazione', time: 1.5 },
    { name: 'Classificazione Logistica - Teoria', time: 1.5 },
    { name: 'Metriche Classificazione - Pratica', time: 2 },
    { name: 'ROC e Multiclasse - Pratica', time: 1.5 },
    { name: 'Classificazione Tumori - Esercitazione', time: 2 },
    { name: 'Clustering K-Means - Pratica', time: 1.5 },
    { name: 'Elbow Method - Pratica', time: 1 },
    { name: 'Clustering Clienti - Esercitazione', time: 2 },
    { name: 'Naive Bayes - Teoria', time: 1.5 },
    { name: 'Naive Bayes Gaussian/Bernoulli - Pratica', time: 3 },
    { name: 'Naive Bayes Multinomial - Pratica', time: 2 },
    { name: 'Spam Detection - Esercitazione', time: 1.5 },
    { name: 'SVM - Teoria', time: 2 },
    { name: 'SVM Kernel Trick - Teoria', time: 2 },
    { name: 'SVM - Pratica', time: 2 },
    { name: 'Neural Networks - Teoria', time: 2 },
    { name: 'MLP e Attivazioni - Teoria', time: 2 },
    { name: 'Neural Networks MNIST - Pratica', time: 3 },
    { name: 'K-NN - Teoria e Pratica', time: 2 },
    { name: 'Decision Trees - Pratica', time: 1.5 },
    { name: 'Random Forest - Pratica', time: 1.5 },
    { name: 'Ottimizzazione Iperparametri - Pratica', time: 3 },
    { name: 'AutoML FLAML - Pratica', time: 2 },
    { name: 'NLP Data Cleaning - Pratica', time: 2 },
    { name: 'NLP Stemming/Lemmatization - Pratica', time: 2 },
    { name: 'Bag of Words - Teoria', time: 2 },
    { name: 'Text Classification - Pratica', time: 2 },
    { name: 'Language Identification - Pratica', time: 2 },
    { name: 'Sentiment Analysis - Pratica', time: 2 },
    { name: 'Topic Modelling LDA - Pratica', time: 2 },
    { name: 'NER con SpaCy - Pratica', time: 2 },
    { name: 'Progetto: Identificazione lingua museo', time: 10 }
];

console.log("=== VERIFICA CALCOLO ORE AI APPLICATA ===");
let totalHours = 0;
let details = [];

aiApplicataModules.forEach(module => {
    const effectiveTime = calculateModuleEffectiveTime(module);
    totalHours += effectiveTime;
    details.push({
        name: module.name,
        original: module.time,
        effective: effectiveTime,
        type: module.name.includes('Teoria') ? 'Teoria' : 
              module.name.includes('Pratica') ? 'Pratica' :
              module.name.includes('Esercitazione') ? 'Esercitazione' :
              module.name.startsWith('Progetto:') ? 'Progetto' : 'Altro'
    });
});

console.log("Dettagli calcolo:");
details.forEach(d => {
    console.log(`${d.name}: ${d.original}h → ${d.effective}h (${d.type})`);
});

console.log(`\nTOTALE ORE CALCOLATE: ${totalHours}h`);
console.log(`ORE MOSTRATE NELL'APP: 76h (da verificare)`);

// Test REST API per ML
const restApiModules = [
    { name: 'Introduzione REST - Teoria', time: 1 },
    { name: 'Flask Basics - Pratica', time: 2 },
    { name: 'FastAPI Setup - Pratica', time: 2 },
    { name: 'Serializzazione Modelli - Pratica', time: 2 },
    { name: 'Deploy con Docker - Pratica', time: 3 },
    { name: 'API Authentication - Teoria', time: 2 },
    { name: 'Testing e Monitoring - Pratica', time: 2 },
    { name: 'Cloud Deployment - Pratica', time: 3 },
    { name: 'Progetto: Deploy sistema museo', time: 4 }
];

console.log("\n=== VERIFICA CALCOLO ORE REST API PER ML ===");
let restApiTotal = 0;

restApiModules.forEach(module => {
    const effectiveTime = calculateModuleEffectiveTime(module);
    restApiTotal += effectiveTime;
    console.log(`${module.name}: ${module.time}h → ${effectiveTime}h`);
});

console.log(`TOTALE ORE CALCOLATE: ${restApiTotal}h`);