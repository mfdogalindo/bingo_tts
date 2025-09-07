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

	let chistesHabilitados = true;

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

	// --- INICIO DE MEJORAS ---

	// MAPA 1: Chistes específicos y culturales para cada número
	const chistesPorNumero = {
        1: "¡El 1! El primero, como el primer tinto del día.",
        2: "¡El 2! La parejita. ¡Más juntos que el arroz y la tajada!",
        3: "¡El 3! Perfecto para un ajiaco con sus tres carnes.",
        4: "¡El 4! La silla al revés. ¡No se vaya a sentar!",
        5: "¡El 5! ¡Cinco para las doce! ¡Faltan cinco pa' las doce!",
        6: "¡El 6! Como un 'seis' de cerveza... ¡para empezar la fiesta!",
        7: "¡El 7! El día de las velitas... ¡pida un deseo!",
        8: "¡El 8! ¡Más bueno que un sancocho de gallina hecho en leña!",
        9: "¡El 9! ¡La novena de aguinaldos! ¡A comer buñuelo y natilla!",
        10: "¡El 10! El de James, el de Valderrama... ¡el del crack!",
        11: "¡El 11! ¡Más repetido que comercial de Dólex!",
        12: "¡El 12! La docena de arepas para el desayuno.",
        13: "¡El 13! ¡Martes 13, no se case ni se embarque... ni deje de marcar!",
        14: "¡El 14! El que grita: '¡Catorce, qué hice!'",
        15: "¡La niña bonita! ¡La quinceañera con su fiesta!",
        16: "¡El 16 de julio! ¡El día de la Virgen del Carmen!",
        17: "¡El 17! ¡Más perdido que la mamá del Chavo!",
        18: "¡El 18! Ya puede sacar la cédula... ¡y jugar bingo legalmente!",
        19: "¡El 19! ¡Casi 20! ¡Como cuando el bus se va y uno casi lo alcanza!",
        20: "¡El 20 de julio! ¡El grito de independencia!",
        21: "¡El 21! ¡Para hacer una vaca y comprar la gaseosa!",
        22: "¡Los dos patitos! ¡Más tiernos que un saludo de abuela!",
        23: "¡El 23! ¡La hora en que se acaba la novela!",
        24: "¡El 24! ¡Nochebuena! ¡Aliste el estreno!",
        25: "¡El 25! ¡Navidad! ¡Trajo el Niño Dios este número!",
        26: "¡El 26! La edad en que uno empieza a decir 'Ush, qué caro todo'.",
        27: "¡El 27! ¡La feria de Cali se prende con este!",
        28: "¡El 28! ¡Pásela por inocentes! ¡Pero anótela!",
        29: "¡El 29! ¡El que llega diciendo 'casi me ahogo'!",
        30: "¡El 30! ¡Treinta mil de multa por no marcar!",
        31: "¡El 31! ¡Se va el año viejo, dejando cosas muy buenas!",
        32: "¡El 32! ¡El número de la suerte... del vecino!",
        33: "¡La edad de Cristo! ¡Y la de mi tía que no cumple más!",
        34: "¡El 34! ¡Más ordinario que un tamal en un plato de cartón!",
        35: "¡El 35! ¡El que llega a la fiesta cuando ya se acabó el trago!",
        36: "¡El 36! ¡El número de la tía solterona!",
        37: "¡El 37! ¡La temperatura perfecta para no hacer nada!",
        38: "¡El 38! ¡La edad en que uno dice 'en mis tiempos...'",
        39: "¡El 39! ¡Casi cuarenta! ¡Ya casi pide rebaja!",
        40: "¡El 40! ¡Los 40 principales! ¡Pura música!",
        41: "¡El 41! ¡El que se cree de 20 pero con dolor de rodilla!",
        42: "¡El 42! ¡El que pregunta '¿y esto pa' qué es?'",
        43: "¡El 43! ¡Más perdido que Adán en el día de la madre!",
        44: "¡El 44! ¡La parejita de cuatros! ¡Como los ojos de mi suegra!",
        45: "¡El 45! ¡Se acabó el primer tiempo! ¡A tomar alguito!",
        46: "¡El 46! ¡El que se levanta a las 6 a trabajar!",
        47: "¡El 47! ¡El número del 'yo no fui'!",
        48: "¡El 48! ¡El que parece, pero no es!",
        49: "¡El 49! ¡El que dice 'casi, pero no'!",
        50: "¡El 50! ¡Medio siglo! ¡Más viejo que la panela!",
        51: "¡El 51! ¡El aguardiente de los valientes!",
        52: "¡El 52! ¡El de la baraja! ¡Hagan sus apuestas!",
        53: "¡El 53! ¡El que se aparece cuando nadie lo llama!",
        54: "¡El 54! ¡El que dice '¿y yo por qué?'",
        55: "¡Los dos cincos! ¡Aplaudan, que esto se está poniendo bueno!",
        56: "¡El 56! ¡El que se cree de 60 pero con alma de 20!",
        57: "¡El 57! ¡El que se fue de paseo y no volvió!",
        58: "¡El 58! ¡El que le falta poquito para la pensión!",
        59: "¡El 59! ¡Un minuto para las mil! ¡Casi!",
        60: "¡El 60! ¡La hora del tinto y el pan!",
        61: "¡El 61! ¡El que se voltea y sigue siendo igual de feo!",
        62: "¡El 62! ¡La edad para contar las historias de la cédula en blanco y negro!",
        63: "¡El 63! ¡El que se cree de 30 pero con 60!",
        64: "¡El 64! ¡El de la consola de Nintendo!",
        65: "¡El 65! ¡La edad de la sabiduría... y de los descuentos!",
        66: "¡El 66! ¡El diablo anda suelto!",
        67: "¡El 67! ¡El que se peina con la mano!",
        68: "¡El 68! ¡El que se acuesta temprano porque ya no aguanta!",
        69: "¡El 69! ¡El que se mira al espejo y dice 'estoy como quiero'!",
        70: "¡El 70! ¡El que se queja de todo!",
        71: "¡El 71! ¡El que se cree de 17 al revés!",
        72: "¡El 72! ¡Los años que duró 'Padres e Hijos' al aire!",
        73: "¡El 73! ¡El que se ríe solo!",
        74: "¡El 74! ¡El que ya casi llega a la meta!",
        75: "¡El 75! ¡El último! ¡El que apaga la luz y cierra la puerta!",
    };


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
		// Prioridad 1: ¿Hay un chiste específico para este NÚMERO?
		// Para no ser repetitivo, solo lo diremos el 70% de las veces que salga.
		if (chistesPorNumero[numero] && Math.random() < 0.7) {
			return chistesPorNumero[numero];
		}

		// Prioridad 2: ¿Hay un chiste para la TERMINACIÓN?
		// Lo intentamos el 50% de las veces para dar variedad.
		const ultimoDigito = numero % 10;
		if (chistesPorTerminacion[ultimoDigito] && Math.random() < 0.5) {
			return chistesPorTerminacion[ultimoDigito];
		}

		// Prioridad 3: Si no, un mensaje genérico de la lista.
		const indiceAleatorio = Math.floor(Math.random() * mensajesGraciosos.length);
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

	// Función para leer en voz alta con interrupción y tiempo aleatorio
	function leerEnVozAlta(texto) {
		if ("speechSynthesis" in window) {
			const utterance = new SpeechSynthesisUtterance(texto);
			const nombreVozSeleccionada =
				selectorVoz.selectedOptions[0]?.getAttribute("data-name");
			const vozSeleccionada = vocesDisponibles.find(
				(voz) => voz.name === nombreVozSeleccionada
			);

			if (vozSeleccionada) {
				utterance.voice = vozSeleccionada;
			}
			utterance.rate = 0.9;
			window.speechSynthesis.speak(utterance);
		}
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
		// --- INICIO DE LA SOLUCIÓN DEL BUG ---
		window.speechSynthesis.cancel();
		clearTimeout(jokeTimeout);
		// --- FIN DE LA SOLUCIÓN DEL BUG ---

		if (numerosDisponibles.length === 0) {
			const mensajeFinal = "¡Bingo! Han salido todos los números. ¡Gracias por jugar!";
			alert(mensajeFinal);
			leerEnVozAlta(mensajeFinal);
			llamarNumeroBtn.disabled = true;
			return;
		}

		const indiceAleatorio = Math.floor(
			Math.random() * numerosDisponibles.length
		);
		const numeroNuevo = numerosDisponibles.splice(indiceAleatorio, 1)[0];

		numerosSalidos.push(numeroNuevo);
		guardarEstado(); // Guardar estado después de cada número

		actualizarUI(numeroNuevo);
	}

	function actualizarUI(numero, restaurando = false) {
		const letra = getLetra(numero);
		const textoParaMostrar = `${letra}-${numero}`;

		// Marcar el número en el tablero
		const numeroEnTablero = document.getElementById(`numero-${numero}`);
		if (numeroEnTablero) {
			numeroEnTablero.classList.add("salido");
		}

		// Solo realizar acciones de UI y voz si no se está restaurando en silencio
		if (!restaurando) {
			const letraParaLeer = phoneticMap[letra] || letra;
			const textoParaLeer = `${letraParaLeer}, ${numero}`;
			const mensajeDivertido = obtenerMensajeAleatorio(numero);

			numeroActualDisplay.textContent = textoParaMostrar;
			numeroActualDisplay.classList.add("animar");

			// Leer el número principal
			leerEnVozAlta(textoParaLeer);

			// Repetir el número principal después de un momento
			setTimeout(() => leerEnVozAlta(textoParaLeer), 2500);

			// Programar el chiste y guardar su ID si están habilitados
			if (chistesHabilitados) {
				jokeTimeout = setTimeout(() => {
					leerEnVozAlta(mensajeDivertido);
				}, 5000);
			}

			setTimeout(() => {
				numeroActualDisplay.classList.remove("animar");
			}, 500);
		}
	}

	// --- Funciones de Estado y Botones Adicionales ---

	function guardarEstado() {
		const estado = {
			numerosDisponibles,
			numerosSalidos,
			ultimoNumero: numerosSalidos[numerosSalidos.length - 1] || "-",
		};
		localStorage.setItem("estadoBingo", JSON.stringify(estado));
	}

	function restaurarEstado() {
		const estadoGuardado = localStorage.getItem("estadoBingo");
		if (estadoGuardado) {
			const estado = JSON.parse(estadoGuardado);
			numerosDisponibles = estado.numerosDisponibles;
			numerosSalidos = estado.numerosSalidos;

			// Actualizar el tablero visualmente sin leer en voz alta
			numerosSalidos.forEach((num) => actualizarUI(num, true));

			// Actualizar el último número mostrado
			const ultimoNumero = estado.ultimoNumero;
			if (ultimoNumero !== "-") {
				numeroActualDisplay.textContent = `${getLetra(ultimoNumero)}-${ultimoNumero}`;
			} else {
				numeroActualDisplay.textContent = "-";
			}

			alert("¡Estado anterior restaurado!");
			return true; // Indica que se restauró un estado
		}
		return false; // No había estado que restaurar
	}

	function reiniciarJuego() {
		if (confirm("¿Estás seguro de que quieres reiniciar la partida? Se borrará el progreso guardado.")) {
			localStorage.removeItem("estadoBingo");
			numerosSalidos = [];
			numeroActualDisplay.textContent = "-";
			// Reinicializa el juego desde cero
			inicializarJuego(true);
		}
	}

	function contarNumerosSalidos() {
		if (numerosSalidos.length === 0) {
			leerEnVozAlta("Aún no ha salido ningún número.");
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
		leerEnVozAlta(textoRecuento);
	}


	llamarNumeroBtn.addEventListener("click", llamarNumero);
	reiniciarBtn.addEventListener("click", reiniciarJuego);
	restaurarBtn.addEventListener("click", () => {
		inicializarJuego(); // Prepara el tablero
		restaurarEstado();  // Aplica el estado guardado
	});
	contarBtn.addEventListener("click", contarNumerosSalidos);

	chistesSwitch.addEventListener("change", () => {
		chistesHabilitados = chistesSwitch.checked;
	});

	modoJuegoSelect.addEventListener("change", () => {
		if (confirm("Cambiar el modo de juego reiniciará la partida actual. ¿Continuar?")) {
			inicializarJuego(true);
		} else {
			// TODO: Revertir la selección visualmente si el usuario cancela
		}
	});


	// Inicializar el juego al cargar la página
	inicializarJuego();


	document.addEventListener("keydown", (event) => {
		if (event.code === "Space") {
			event.preventDefault();
			if (!llamarNumeroBtn.disabled) {
				llamarNumeroBtn.click();
			}
		}
	});
});