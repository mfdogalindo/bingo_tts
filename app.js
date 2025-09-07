document.addEventListener("DOMContentLoaded", () => {
	// Referencias a los elementos del DOM
	const tableroControl = document.getElementById("tablero-control");
	const numeroActualDisplay = document.getElementById("numero-actual");
	const llamarNumeroBtn = document.getElementById("llamar-numero-btn");
	const selectorVoz = document.getElementById("selector-voz");
	const reiniciarBtn = document.getElementById("reiniciar-btn");
	const restaurarBtn = document.getElementById("restaurar-btn");
	const contarBtn = document.getElementById("contar-btn");
	const chistesSwitch = document.getElementById("chistes-switch");
	const modoJuegoSelect = document.getElementById("modo-juego");
	const autoplayBtn = document.getElementById("autoplay-btn");

	let chistesHabilitados = true;
	let isAutoplaying = false;
	let autoplayTimeout;

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

	let numerosDisponibles = [];
	let numerosSalidos = [];
	let vocesDisponibles = [];
	let jokeTimeout; // Para controlar el chiste retardado
	let todosLosChistes = [];

	// --- INICIO DE MEJORAS ---

	// Cargar chistes desde el archivo JSON
	async function cargarChistes() {
		try {
			const response = await fetch("chistes.json");
			if (!response.ok) {
				throw new Error(`Error al cargar chistes.json: ${response.statusText}`);
			}
			todosLosChistes = await response.json();
			console.log(`${todosLosChistes.length} chistes cargados correctamente.`);
		} catch (error) {
			console.error("No se pudieron cargar los chistes:", error);
			// Usar una lista de respaldo por si falla la carga
			todosLosChistes = [
				"¿Por qué los pájaros no usan Facebook? Porque ya tienen Twitter.",
				"¿Qué le dice un pez a otro? ¡Nada!",
			];
		}
	}

	// MAPA 2: Chistes por terminación, con más sabor colombiano
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

	// MAPA 3: Dichos populares, frases genéricas y disculpas
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

	// Función MEJORADA que combina precisión y aleatoriedad
	function obtenerMensajeAleatorio(numero) {
		const probabilidadChiste = 0.7; // 70% de probabilidad de contar un chiste
		const probabilidadTerminacion = 0.5; // 50% de probabilidad para chiste de terminación

		if (Math.random() < probabilidadChiste && todosLosChistes.length > 0) {
			const indiceAleatorio = Math.floor(
				Math.random() * todosLosChistes.length
			);
			return todosLosChistes[indiceAleatorio];
		}

		const ultimoDigito = numero % 10;
		if (
			chistesPorTerminacion[ultimoDigito] &&
			Math.random() < probabilidadTerminacion
		) {
			return chistesPorTerminacion[ultimoDigito];
		}

		// Si no, un mensaje genérico de la lista.
		const indiceAleatorio = Math.floor(
			Math.random() * mensajesGraciosos.length
		);
		return mensajesGraciosos[indiceAleatorio];
	}

	// Función para cargar voces y guardar la preferencia
	function cargarVoces() {
		vocesDisponibles = window.speechSynthesis.getVoices();
		selectorVoz.innerHTML = "";

		const vocesEspañol = vocesDisponibles.filter((voz) =>
			voz.lang.startsWith("es")
		);

		vocesEspañol.forEach((voz) => {
			const opcion = document.createElement("option");
			opcion.textContent = `${voz.name} (${voz.lang})`;
			opcion.setAttribute("data-name", voz.name);
			selectorVoz.appendChild(opcion);
		});

		const vozGuardada = localStorage.getItem("vozBingoSeleccionada");
		if (vozGuardada) {
			const opcionGuardada = selectorVoz.querySelector(
				`[data-name="${vozGuardada}"]`
			);
			if (opcionGuardada) {
				opcionGuardada.selected = true;
			}
		}

		selectorVoz.addEventListener("change", () => {
			const nombreVozSeleccionada =
				selectorVoz.selectedOptions[0].getAttribute("data-name");
			localStorage.setItem("vozBingoSeleccionada", nombreVozSeleccionada);
		});
	}

	window.speechSynthesis.onvoiceschanged = cargarVoces;

	// --- Lógica de Voz Mejorada con Cola y Autoplay ---
	function hablar(texto, onEndCallback) {
		if (!("speechSynthesis" in window) || !texto) {
			if (onEndCallback) onEndCallback();
			return;
		}

		const utterance = new SpeechSynthesisUtterance(texto);
		const nombreVozSeleccionada = selectorVoz.selectedOptions[0]?.getAttribute("data-name");
		const vozSeleccionada = vocesDisponibles.find(voz => voz.name === nombreVozSeleccionada);

		if (vozSeleccionada) {
			utterance.voice = vozSeleccionada;
		}
		utterance.rate = 0.7;

		utterance.onend = () => {
			if (onEndCallback) {
				onEndCallback();
			}
		};

		utterance.onerror = (event) => {
			console.error("Error en la síntesis de voz:", event.error);
			if (onEndCallback) {
				onEndCallback(); // Asegurarse de continuar el ciclo incluso si hay un error
			}
		};

		window.speechSynthesis.speak(utterance);
	}

	function getLetra(numero) {
		for (const letra in BINGO_MAP) {
			if (numero >= BINGO_MAP[letra].min && numero <= BINGO_MAP[letra].max) {
				return letra;
			}
		}
	}

	function inicializarJuego(forzarReinicio = false) {
		if (!forzarReinicio && localStorage.getItem("estadoBingo")) {
			restaurarBtn.style.display = "inline-block";
			return;
		}

		localStorage.removeItem("estadoBingo");
		cargarVoces();
		tableroControl.innerHTML = "";
		numerosDisponibles = [];
		numerosSalidos = [];

		const modo = modoJuegoSelect.value;
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
				letrasActivas.add(modo); // Para B, I, N, G, O
		}

		const columnas = { B: [], I: [], N: [], G: [], O: [] };
		for (let i = 1; i <= 75; i++) {
			const letra = getLetra(i);
			if (letrasActivas.has(letra)) {
				numerosDisponibles.push(i);
			}
			const numeroDiv = document.createElement("div");
			numeroDiv.classList.add("numero-tablero");
			if (!letrasActivas.has(letra)) {
				numeroDiv.classList.add("inactivo");
			}
			numeroDiv.id = `numero-${i}`;
			numeroDiv.textContent = i;
			columnas[letra].push(numeroDiv);
		}

		for (let i = 0; i < 15; i++) {
			["B", "I", "N", "G", "O"].forEach((letra) =>
				tableroControl.appendChild(columnas[letra][i])
			);
		}

		numeroActualDisplay.textContent = "-";
		llamarNumeroBtn.disabled = false;
		restaurarBtn.style.display = "none";
	}

	function llamarNumero() {
		if (numerosDisponibles.length === 0) {
			const mensajeFinal = "¡Bingo! Han salido todos los números.";
			alert(mensajeFinal);
			hablar(mensajeFinal);
			llamarNumeroBtn.disabled = true;
			if (isAutoplaying) toggleAutoplay(); // Detener autoplay si se acaban los números
			return;
		}

		// Detener cualquier lectura anterior antes de empezar con la nueva
		window.speechSynthesis.cancel();
		clearTimeout(autoplayTimeout);


		const indiceAleatorio = Math.floor(Math.random() * numerosDisponibles.length);
		const numeroNuevo = numerosDisponibles.splice(indiceAleatorio, 1)[0];

		numerosSalidos.push(numeroNuevo);
		guardarEstado();
		actualizarUI(numeroNuevo);
	}

	function actualizarUI(numero) {
		const letra = getLetra(numero);
		const textoParaMostrar = `${letra}-${numero}`;

		// Actualizar UI visual
		const numeroEnTablero = document.getElementById(`numero-${numero}`);
		if (numeroEnTablero) numeroEnTablero.classList.add("salido");

		numeroActualDisplay.textContent = textoParaMostrar;
		numeroActualDisplay.classList.add("animar");
		setTimeout(() => numeroActualDisplay.classList.remove("animar"), 500);

		// Crear la secuencia de voz
		const letraParaLeer = phoneticMap[letra] || letra;
		const textoNumero = `${letraParaLeer}, ${numero}`;
		const textoChiste = chistesHabilitados ? obtenerMensajeAleatorio(numero) : null;

		const proximoPaso = () => {
			if (isAutoplaying) {
				const tiempoEspera = Math.random() * 2000 + 1000; // Entre 1 y 3 segundos
				autoplayTimeout = setTimeout(llamarNumero, tiempoEspera);
			}
		};

		// Iniciar la cadena de callbacks de voz
		hablar(textoNumero, () => {
			hablar(textoNumero, () => { // Repetición
				hablar(textoChiste, proximoPaso);
			});
		});
	}

	// --- Funciones de Estado y Botones Adicionales ---

	function guardarEstado() {
		const estado = {
			numerosDisponibles,
			numerosSalidos,
			ultimoNumero: numerosSalidos[numerosSalidos.length - 1] || "-",
			config: {
				voz: selectorVoz.selectedOptions[0]?.getAttribute("data-name"),
				chistes: chistesSwitch.checked,
				modo: modoJuegoSelect.value,
			},
		};
		localStorage.setItem("estadoBingo", JSON.stringify(estado));
	}

	function restaurarEstado() {
		const estadoGuardado = localStorage.getItem("estadoBingo");
		if (!estadoGuardado) return false;

		const estado = JSON.parse(estadoGuardado);

		// Restaurar configuración
		const config = estado.config || {};
		chistesSwitch.checked = config.chistes ?? true;
		chistesHabilitados = chistesSwitch.checked;
		if (config.modo) {
			modoJuegoSelect.value = config.modo;
		}
		// Esperar a que las voces carguen para seleccionar la guardada
		const interval = setInterval(() => {
			if (vocesDisponibles.length) {
				if (config.voz) {
					const opcionGuardada = selectorVoz.querySelector(`[data-name="${config.voz}"]`);
					if (opcionGuardada) opcionGuardada.selected = true;
				}
				clearInterval(interval);
			}
		}, 100);


		// Restaurar estado del juego
		numerosDisponibles = estado.numerosDisponibles;
		numerosSalidos = estado.numerosSalidos;

		// Actualizar UI
		inicializarJuego(true); // Forzar reinicio del tablero con el modo de juego correcto
		numerosSalidos.forEach((num) => {
			const numeroEnTablero = document.getElementById(`numero-${num}`);
			if (numeroEnTablero) numeroEnTablero.classList.add("salido");
		});

		const ultimoNumero = estado.ultimoNumero;
		if (ultimoNumero && ultimoNumero !== "-") {
			numeroActualDisplay.textContent = `${getLetra(ultimoNumero)}-${ultimoNumero}`;
		} else {
			numeroActualDisplay.textContent = "-";
		}

		llamarNumeroBtn.disabled = numerosDisponibles.length === 0;

		return true;
	}

	function reiniciarJuego() {
		if (isAutoplaying) toggleAutoplay(); // Detener si está en modo automático
		if (confirm("¿Estás seguro de que quieres reiniciar la partida? Se borrará el progreso guardado.")) {
			localStorage.removeItem("estadoBingo");
			numerosSalidos = [];
			numeroActualDisplay.textContent = "-";
			inicializarJuego(true);
			guardarEstado(); // Guardar el estado limpio
		}
	}

	function contarNumerosSalidos() {
		if (numerosSalidos.length === 0) {
			hablar("Aún no ha salido ningún número.");
			return;
		}

		const numerosPorLetra = { B: [], I: [], N: [], G: [], O: [] };
		numerosSalidos.forEach(num => {
			const letra = getLetra(num);
			numerosPorLetra[letra].push(num);
		});

		let textoRecuento = "Los números que han salido son: ";
		for (const letra in numerosPorLetra) {
			if (numerosPorLetra[letra].length > 0) {
				textoRecuento += ` Por la ${phoneticMap[letra] || letra}: ${numerosPorLetra[letra].join(", ")}. `;
			}
		}

		window.speechSynthesis.cancel();
		hablar(textoRecuento);
	}

	function toggleAutoplay() {
		isAutoplaying = !isAutoplaying;
		autoplayBtn.textContent = isAutoplaying ? "Detener" : "Juego Automático";
		autoplayBtn.classList.toggle("autoplaying", isAutoplaying);
		llamarNumeroBtn.disabled = isAutoplaying;

		if (isAutoplaying) {
			llamarNumero();
		} else {
			clearTimeout(autoplayTimeout);
			window.speechSynthesis.cancel();
		}
	}


	llamarNumeroBtn.addEventListener("click", llamarNumero);
	reiniciarBtn.addEventListener("click", reiniciarJuego);
	contarBtn.addEventListener("click", contarNumerosSalidos);
	autoplayBtn.addEventListener("click", toggleAutoplay);

	chistesSwitch.addEventListener("change", (e) => {
		chistesHabilitados = e.target.checked;
		guardarEstado(); // Guardar cambio de configuración
	});

	modoJuegoSelect.addEventListener("change", () => {
		if (confirm("Cambiar el modo de juego reiniciará la partida actual. ¿Continuar?")) {
			inicializarJuego(true);
			guardarEstado(); // Guardar el nuevo modo
		} else {
			// Revertir la selección visualmente si el usuario cancela
			const estadoGuardado = localStorage.getItem("estadoBingo");
			if (estadoGuardado) {
				const estado = JSON.parse(estadoGuardado);
				if (estado.config && estado.config.modo) {
					modoJuegoSelect.value = estado.config.modo;
				}
			}
		}
	});

	// --- INICIALIZACIÓN ---
	cargarChistes().then(() => {
		if (localStorage.getItem("estadoBingo")) {
			if (
				confirm("Se encontró una partida guardada. ¿Desea restaurarla?")
			) {
				restaurarEstado();
			} else {
				localStorage.removeItem("estadoBingo");
				inicializarJuego(true);
			}
		} else {
			inicializarJuego(true);
		}
	});

	document.addEventListener("keydown", (event) => {
		if (event.code === "Space") {
			event.preventDefault();
			if (!llamarNumeroBtn.disabled) {
				llamarNumeroBtn.click();
			}
		}
	});
});