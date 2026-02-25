import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Play, Pause, RefreshCw, Volume2, Mic, Settings, RotateCcw, Save, X, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const BINGO_MAP = {
    B: { min: 1, max: 15 },
    I: { min: 16, max: 30 },
    N: { min: 31, max: 45 },
    G: { min: 46, max: 60 },
    O: { min: 61, max: 75 },
};

const phoneticMap = {
    B: "Bé",
};

const chistesPorTerminacion = {
    1: "Termina en UNO... ¡Hágale UNO, pues! ¡Que el que piensa pierde!",
    2: "Termina en DOS... ¡No se me duerma que le cantan el adiós!",
    3: "Termina en TRES... ¡Revíselo otra vez, no me vaya a dar estrés!",
    4: "Termina en CUATRO... ¡Márquelo rápido o le da un calambre en el zapato!",
    5: "Termina en CINCO... ¡El que no lo marque, que pague el sancocho del domingo!",
    6: "Termina en SEIS... ¡Como lo veis, la suerte está a tus pies!",
    7: "Termina en SIETE... ¡Siete vidas tiene el gato y a usted le queda esta para ganar!",
    8: "Termina en OCHO... ¡Ojo con el bizcocho, que no se le queme por estar mirando!",
    9: "Termina en NUEVE... ¡Que la fortuna se le mueva y la platica le llueva!",
    0: "Termina en CERO... ¡Póngale un CERO a la mala suerte, que llegó el aguacero de la fortuna!",
};

const mensajesGraciosos = [
    "¡Póngale fe, que esto es como subir a Monserrate, cansa pero vale la pena!",
    "¡No dé papaya con ese cartón, que se lo miran!",
    "¡Anótelo rápido o se le va el bus!",
    "¡Esto está más emocionante que final de novela de RCN!",
    "¡Hágale, que no estamos en misa!",
    "¿Será que con este sí completan pa' la bandeja paisa?",
    "¡Pilas, que el que no marca, no gana!",
    "¡Más concentrado que si estuviera haciendo un ajiaco!",
    "¡Qué chimba de número, parce!",
    "Ok, a veces los chistes son más malos que un dolor de muela. ¡Perdón!",
    "Prometo que el próximo número viene con un chiste bueno... o al menos con suerte.",
];

export default function BingoGame() {
    const [numerosDisponibles, setNumerosDisponibles] = useState([]);
    const [numerosSalidos, setNumerosSalidos] = useState([]);
    const [ultimoNumero, setUltimoNumero] = useState(null);
    const [modoJuego, setModoJuego] = useState('completo');
    const [chistesHabilitados, setChistesHabilitados] = useState(true);
    const [isAutoplaying, setIsAutoplaying] = useState(false);
    const [vocesDisponibles, setVocesDisponibles] = useState([]);
    const [vozSeleccionada, setVozSeleccionada] = useState('');
    const [todosLosChistes, setTodosLosChistes] = useState([]);
    const [showSettings, setShowSettings] = useState(false);

    // Refs for accessing latest state in callbacks/timeouts
    const autoplayTimeoutRef = useRef(null);
    const isAutoplayingRef = useRef(isAutoplaying);
    const numerosDisponiblesRef = useRef(numerosDisponibles);
    const chistesHabilitadosRef = useRef(chistesHabilitados);
    const vozSeleccionadaRef = useRef(vozSeleccionada);
    const vocesDisponiblesRef = useRef(vocesDisponibles);
    const todosLosChistesRef = useRef(todosLosChistes);

    // Sync refs
    useEffect(() => { isAutoplayingRef.current = isAutoplaying; }, [isAutoplaying]);
    useEffect(() => { numerosDisponiblesRef.current = numerosDisponibles; }, [numerosDisponibles]);
    useEffect(() => { chistesHabilitadosRef.current = chistesHabilitados; }, [chistesHabilitados]);
    useEffect(() => { vozSeleccionadaRef.current = vozSeleccionada; }, [vozSeleccionada]);
    useEffect(() => { vocesDisponiblesRef.current = vocesDisponibles; }, [vocesDisponibles]);
    useEffect(() => { todosLosChistesRef.current = todosLosChistes; }, [todosLosChistes]);


    // Cargar chistes
    useEffect(() => {
        async function cargarChistes() {
            try {
                const response = await fetch('/chistes.json');
                if (!response.ok) throw new Error('Error cargando chistes');
                const data = await response.json();
                setTodosLosChistes(data);
            } catch (error) {
                console.error("Error cargando chistes, usando respaldo", error);
                setTodosLosChistes([
                    "¿Por qué los pájaros no usan Facebook? Porque ya tienen Twitter.",
                    "¿Qué le dice un pez a otro? ¡Nada!",
                ]);
            }
        }
        cargarChistes();
    }, []);

    // Cargar voces
    useEffect(() => {
        const cargarVoces = () => {
            const voces = window.speechSynthesis.getVoices();
            const vocesEspañol = voces.filter(voz => voz.lang.startsWith('es'));
            setVocesDisponibles(vocesEspañol);

            const vozGuardada = localStorage.getItem('vozBingoSeleccionada');
            if (vozGuardada && vocesEspañol.find(v => v.name === vozGuardada)) {
                setVozSeleccionada(vozGuardada);
            } else if (vocesEspañol.length > 0) {
                setVozSeleccionada(vocesEspañol[0].name);
            }
        };

        cargarVoces();
        window.speechSynthesis.onvoiceschanged = cargarVoces;

        return () => {
            window.speechSynthesis.onvoiceschanged = null;
        }
    }, []);

    // Guardar estado
    useEffect(() => {
        const estado = {
            numerosDisponibles,
            numerosSalidos,
            modoJuego,
            chistesHabilitados,
            vozSeleccionada,
            ultimoNumero
        };
        localStorage.setItem('estadoBingo', JSON.stringify(estado));
    }, [numerosDisponibles, numerosSalidos, modoJuego, chistesHabilitados, vozSeleccionada, ultimoNumero]);

    const getLetra = useCallback((numero) => {
        for (const letra in BINGO_MAP) {
            if (numero >= BINGO_MAP[letra].min && numero <= BINGO_MAP[letra].max) {
                return letra;
            }
        }
        return '';
    }, []);

    const iniciarJuegoNuevo = useCallback((modo = modoJuego, forzar = false) => {
         if (!forzar && localStorage.getItem('estadoBingo')) {
             try {
                const estado = JSON.parse(localStorage.getItem('estadoBingo'));
                if(estado.numerosDisponibles && estado.numerosSalidos) {
                    // Ignorar estado vacío (recién inicializado)
                    if (estado.numerosDisponibles.length === 0 && estado.numerosSalidos.length === 0) {
                        // Continuar con inicialización normal
                    } else {
                        setNumerosDisponibles(estado.numerosDisponibles);
                        setNumerosSalidos(estado.numerosSalidos);
                        setModoJuego(estado.modoJuego || 'completo');
                        setChistesHabilitados(estado.chistesHabilitados ?? true);
                        if (estado.vozSeleccionada) setVozSeleccionada(estado.vozSeleccionada);
                        setUltimoNumero(estado.ultimoNumero || null);
                        return;
                    }
                }
             } catch(e) { console.error(e); }
        }

        const letrasActivas = new Set();
        switch (modo) {
            case "completo":
                Object.keys(BINGO_MAP).forEach(l => letrasActivas.add(l));
                break;
            case "esquinas":
                letrasActivas.add("B").add("O");
                break;
            case "X":
                letrasActivas.add("B").add("I").add("G").add("O");
                break;
            default:
                letrasActivas.add(modo);
        }

        const nuevosNumeros = [];
        for (let i = 1; i <= 75; i++) {
            const letra = getLetra(i);
            if (letrasActivas.has(letra)) {
                nuevosNumeros.push(i);
            }
        }

        setNumerosDisponibles(nuevosNumeros);
        setNumerosSalidos([]);
        setUltimoNumero(null);
        setIsAutoplaying(false);
        window.speechSynthesis.cancel();
    }, [modoJuego, getLetra]);

    // Initial load
    useEffect(() => {
        iniciarJuegoNuevo(modoJuego, false);
    }, []);


    const hablar = useCallback((texto, callback) => {
        if (!("speechSynthesis" in window) || !texto) {
            if (callback) callback();
            return;
        }

        const utterance = new SpeechSynthesisUtterance(texto);
        const voz = vocesDisponiblesRef.current.find(v => v.name === vozSeleccionadaRef.current);
        if (voz) utterance.voice = voz;
        utterance.rate = 0.9;

        utterance.onend = () => {
            if (callback) callback();
        };

        utterance.onerror = (e) => {
            console.error("Error speech synthesis", e);
            if (callback) callback();
        };

        window.speechSynthesis.speak(utterance);
    }, []);


    const obtenerMensajeAleatorio = useCallback((numero) => {
        const probabilidadChiste = 0.7;
        const probabilidadTerminacion = 0.5;

        if (Math.random() < probabilidadChiste && todosLosChistesRef.current.length > 0) {
            const indice = Math.floor(Math.random() * todosLosChistesRef.current.length);
            return todosLosChistesRef.current[indice];
        }

        const ultimoDigito = numero % 10;
        if (chistesPorTerminacion[ultimoDigito] && Math.random() < probabilidadTerminacion) {
            return chistesPorTerminacion[ultimoDigito];
        }

        const indice = Math.floor(Math.random() * mensajesGraciosos.length);
        return mensajesGraciosos[indice];
    }, []);


    const llamarNumero = useCallback(() => {
        const disponibles = numerosDisponiblesRef.current;

        if (disponibles.length === 0) {
            hablar("¡Bingo! Han salido todos los números.");
            setIsAutoplaying(false);
            return;
        }

        window.speechSynthesis.cancel();
        if (autoplayTimeoutRef.current) clearTimeout(autoplayTimeoutRef.current);

        const indiceAleatorio = Math.floor(Math.random() * disponibles.length);
        const numeroNuevo = disponibles[indiceAleatorio];

        const nuevosDisponibles = [...disponibles];
        nuevosDisponibles.splice(indiceAleatorio, 1);

        setNumerosDisponibles(nuevosDisponibles);
        setNumerosSalidos(prev => [...prev, numeroNuevo]);
        setUltimoNumero(numeroNuevo);

        const letra = getLetra(numeroNuevo);
        const letraParaLeer = phoneticMap[letra] || letra;
        const textoNumero = `${letraParaLeer}, ${numeroNuevo}`;
        const textoChiste = chistesHabilitadosRef.current ? obtenerMensajeAleatorio(numeroNuevo) : null;

        const proximoPaso = () => {
             if (isAutoplayingRef.current) {
                 const tiempoEspera = Math.random() * 2000 + 2000;
                 autoplayTimeoutRef.current = setTimeout(() => {
                     if (isAutoplayingRef.current) {
                         llamarNumero();
                     }
                 }, tiempoEspera);
             }
        };

        hablar(textoNumero, () => {
            hablar(textoNumero, () => {
                hablar(textoChiste, proximoPaso);
            });
        });

    }, [getLetra, hablar, obtenerMensajeAleatorio]);

    const toggleAutoplay = () => {
        setIsAutoplaying(prev => {
            const nuevoEstado = !prev;
            if (nuevoEstado) {
                llamarNumero();
            } else {
                if (autoplayTimeoutRef.current) clearTimeout(autoplayTimeoutRef.current);
                window.speechSynthesis.cancel();
            }
            return nuevoEstado;
        });
    };

    const reiniciar = () => {
        if (window.confirm("¿Reiniciar partida?")) {
            iniciarJuegoNuevo(modoJuego, true);
        }
    };

    const contar = () => {
        const salidos = numerosSalidos;
        if (salidos.length === 0) {
            hablar("Aún no ha salido ningún número.");
            return;
        }

        let texto = "Resumen. ";
        const porLetra = { B: [], I: [], N: [], G: [], O: [] };
        salidos.forEach(n => porLetra[getLetra(n)].push(n));

        Object.keys(porLetra).forEach(l => {
             if (porLetra[l].length > 0) {
                 texto += `Letra ${phoneticMap[l] || l}: ${porLetra[l].join(", ")}. `;
             }
        });

        window.speechSynthesis.cancel();
        hablar(texto);
    };

    return (
        <div className="flex w-full h-full bg-black text-white font-sans overflow-hidden">
             {/* Left Panel */}
            <div className="w-full md:w-1/3 border-r border-gray-800 p-6 flex flex-col justify-between relative z-10 bg-black">
                <header className="flex justify-between items-start">
                     <div>
                        <h1 className="text-5xl font-bold uppercase tracking-tighter mb-1">Bingo</h1>
                        <p className="text-gray-500 text-sm uppercase tracking-widest">Moderno Panorámico</p>
                     </div>
                     <button
                        onClick={() => setShowSettings(!showSettings)}
                        className="p-2 border border-gray-800 hover:bg-white hover:text-black transition-colors"
                     >
                        <Settings size={20} />
                     </button>
                </header>

                <AnimatePresence>
                {showSettings && (
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="absolute top-20 left-6 right-6 bg-black border border-gray-700 p-4 shadow-2xl z-20 space-y-4"
                    >
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="font-bold uppercase tracking-wider">Configuración</h3>
                            <button onClick={() => setShowSettings(false)}><X size={18} /></button>
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs text-gray-400 uppercase">Voz</label>
                            <select
                                value={vozSeleccionada}
                                onChange={(e) => setVozSeleccionada(e.target.value)}
                                className="w-full bg-gray-900 border border-gray-700 p-2 text-sm text-white rounded-none focus:outline-none focus:border-white"
                            >
                                {vocesDisponibles.map(v => (
                                    <option key={v.name} value={v.name}>{v.name}</option>
                                ))}
                            </select>
                        </div>

                        <div className="space-y-2">
                             <label className="text-xs text-gray-400 uppercase">Modo de Juego</label>
                             <select
                                value={modoJuego}
                                onChange={(e) => {
                                    if(confirm("Cambiar modo reiniciará el juego. ¿Seguir?")) {
                                        setModoJuego(e.target.value);
                                        iniciarJuegoNuevo(e.target.value, true);
                                    }
                                }}
                                className="w-full bg-gray-900 border border-gray-700 p-2 text-sm text-white rounded-none focus:outline-none focus:border-white"
                             >
                                <option value="completo">Tabla Completa</option>
                                <option value="esquinas">Cuatro Esquinas</option>
                                <option value="X">En X</option>
                                <option value="B">Solo B</option>
                                <option value="I">Solo I</option>
                                <option value="N">Solo N</option>
                                <option value="G">Solo G</option>
                                <option value="O">Solo O</option>
                             </select>
                        </div>

                        <div className="flex items-center justify-between">
                            <label className="text-sm uppercase">Chistes</label>
                            <button
                                onClick={() => setChistesHabilitados(!chistesHabilitados)}
                                className={`w-12 h-6 border flex items-center p-1 transition-colors ${chistesHabilitados ? 'bg-white border-white justify-end' : 'bg-black border-gray-600 justify-start'}`}
                            >
                                <motion.div layout className={`w-4 h-4 ${chistesHabilitados ? 'bg-black' : 'bg-gray-400'}`} />
                            </button>
                        </div>
                    </motion.div>
                )}
                </AnimatePresence>

                <div className="flex flex-col items-center justify-center flex-grow py-8">
                    <div className="text-xs uppercase text-gray-500 tracking-[0.2em] mb-4">Último Número</div>
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={ultimoNumero || 'empty'}
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.8, opacity: 0 }}
                            transition={{ type: "spring", stiffness: 300, damping: 20 }}
                            className="w-64 h-64 border-4 border-white flex flex-col items-center justify-center bg-black relative"
                        >
                            {ultimoNumero ? (
                                <>
                                    <div className="absolute top-2 left-4 text-4xl font-bold text-gray-500">{getLetra(ultimoNumero)}</div>
                                    <div className="text-[10rem] font-bold leading-none tracking-tighter">{ultimoNumero}</div>
                                </>
                            ) : (
                                <div className="text-8xl text-gray-800">-</div>
                            )}
                        </motion.div>
                    </AnimatePresence>
                </div>

                <div className="grid grid-cols-2 gap-4">
                     <button
                        onClick={llamarNumero}
                        disabled={isAutoplaying || numerosDisponibles.length === 0}
                        className="col-span-2 bg-white text-black font-bold py-5 px-6 uppercase tracking-wider hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 text-lg"
                    >
                        <Play size={24} strokeWidth={2} /> Llamar Número
                     </button>

                     <button
                        onClick={toggleAutoplay}
                        className={`border py-4 px-4 uppercase font-bold tracking-wider transition-all flex items-center justify-center gap-2 ${isAutoplaying ? 'bg-gray-800 border-gray-800 text-white animate-pulse' : 'border-gray-600 hover:border-white text-gray-300 hover:text-white'}`}
                    >
                        {isAutoplaying ? <Pause size={20} /> : <RotateCcw size={20} className="rotate-180" />}
                        {isAutoplaying ? 'Detener' : 'Auto'}
                     </button>

                     <button
                        onClick={contar}
                        className="border border-gray-600 hover:border-white text-gray-300 hover:text-white py-4 px-4 uppercase font-bold tracking-wider transition-colors flex items-center justify-center gap-2"
                     >
                        <Mic size={20} /> Resumen
                     </button>

                     <button
                        onClick={reiniciar}
                        className="col-span-2 border border-red-900 text-red-500 hover:bg-red-900 hover:text-white py-4 px-6 uppercase font-bold tracking-wider transition-colors flex items-center justify-center gap-2 text-sm mt-2"
                     >
                        <RotateCcw size={18} /> Reiniciar Partida
                     </button>
                </div>
            </div>

            {/* Right Panel - Board */}
            <div className="w-full md:w-2/3 p-8 bg-black flex items-center justify-center overflow-hidden relative">
                {/* Background Grid Lines for decoration */}
                <div className="absolute inset-0 z-0 opacity-10 pointer-events-none"
                     style={{
                         backgroundImage: 'linear-gradient(#333 1px, transparent 1px), linear-gradient(90deg, #333 1px, transparent 1px)',
                         backgroundSize: '40px 40px'
                     }}
                />

                 <div className="grid grid-cols-5 gap-3 w-full max-w-5xl h-full max-h-[90vh] z-10">
                    {/* Headers */}
                    {['B', 'I', 'N', 'G', 'O'].map((letra, i) => (
                        <motion.div
                            initial={{ opacity: 0, y: -20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.1 }}
                            key={letra}
                            className="text-6xl font-bold text-center border-b-2 border-white pb-4 text-white flex items-center justify-center"
                        >
                            {letra}
                        </motion.div>
                    ))}

                     {/* Grid Rendering */}
                     {Array.from({ length: 15 }).map((_, rowIdx) => (
                        ['B', 'I', 'N', 'G', 'O'].map((letra, colIdx) => {
                            const range = BINGO_MAP[letra];
                            const num = range.min + rowIdx;
                            const salido = numerosSalidos.includes(num);
                            return (
                                <div key={num} className="w-full h-full relative group">
                                    <motion.div
                                        initial={{ opacity: 0 }}
                                        animate={{
                                            opacity: 1,
                                            backgroundColor: salido ? '#FFFFFF' : '#000000',
                                            color: salido ? '#000000' : '#333333',
                                            borderColor: salido ? '#FFFFFF' : '#333333'
                                        }}
                                        transition={{ duration: 0.3 }}
                                        className={`w-full h-full border flex items-center justify-center text-2xl font-bold cursor-default transition-colors duration-300 ${!salido && 'hover:border-gray-500 hover:text-gray-500'}`}
                                    >
                                        {num}
                                    </motion.div>
                                    {/* Small indicator for latest number */}
                                    {ultimoNumero === num && (
                                        <motion.div
                                            layoutId="latest-indicator"
                                            className="absolute inset-0 border-4 border-white pointer-events-none"
                                            initial={{ opacity: 0, scale: 1.2 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                        />
                                    )}
                                </div>
                            );
                        })
                     ))}
                 </div>
            </div>
        </div>
    );
}
