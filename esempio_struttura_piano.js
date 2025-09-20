// Esempio struttura dati piano di studio
const examplePlanData = {
    // Dati principali del piano
    courses: [
        {
            id: 1,
            name: 'AI Applicata',
            hours: 106.85,
            color: '#FF6B6B',
            startDate: '2025-09-08',
            endDate: '2025-09-28',
            weeks: 3
        },
        {
            id: 2,
            name: 'REST API per ML',
            hours: 26.3,
            color: '#4ECDC4',
            startDate: '2025-09-29',
            endDate: '2025-10-12',
            weeks: 2
        }
        // ... altri corsi
    ],
    
    // Schedulazioni settimanali personalizzate (se modificate dall'utente)
    weeklySchedules: {
        "1-0": {  // Corso ID 1, settimana 0
            "Lunedì": [
                {
                    time: "06:30-07:45",
                    content: "🙏 Lodi + Letture",
                    type: "prayer"
                },
                {
                    time: "21:00-23:00",
                    content: "📚 Studio AI - Introduzione ML",
                    type: "study",
                    modules: [
                        {
                            name: "Introduzione ML - Teoria",
                            time: 0.5,
                            effectiveTime: 0.75
                        }
                    ]
                }
            ],
            "Martedì": [
                // ... altre sessioni
            ]
        }
    },
    
    // Argomenti personalizzati per settimana (se modificati dall'utente)
    courseTopics: {
        "1-0_customModules": [  // Corso ID 1, settimana 0, moduli personalizzati
            {
                name: "Introduzione ML - Teoria",
                time: 0.5,
                effectiveTime: 0.75
            },
            {
                name: "Dataset - Teoria",
                time: 0.5,
                effectiveTime: 0.75
            },
            {
                name: "Argomento Personalizzato Aggiunto",  // NUOVO ARGOMENTO
                time: 2,
                effectiveTime: 2
            }
        ],
        "1-0_distributed": [  // Argomenti effettivamente schedulati
            // Lista degli argomenti che sono stati distribuiti nelle sessioni
        ],
        "1-0_paramsVersion": "1.5-1.2-3-5"  // Versione parametri calcolo usati
    },
    
    // Configurazioni globali
    weeklyHours: 15,
    globalStartDate: '2025-09-08',
    
    // Metadati del piano
    metadata: {
        id: 'plan_1726912345678_abc123def',
        name: 'Piano AI Development - Settembre 2025',
        description: 'Piano completo con specializzazione LLM e personalizzazioni',
        createdAt: '2025-09-21T10:30:00.000Z',
        modifiedAt: '2025-09-21T14:15:30.000Z',
        exportDate: '2025-09-21T14:15:30.000Z'  // Solo nei file esportati
    }
};

console.log("Struttura completa piano:", JSON.stringify(examplePlanData, null, 2));