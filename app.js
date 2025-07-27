document.addEventListener("DOMContentLoaded", () => {
   // Referencias a los elementos del DOM
   const tableroControl = document.getElementById("tablero-control");
   const numeroActualDisplay = document.getElementById("numero-actual");
   const llamarNumeroBtn = document.getElementById("llamar-numero-btn");
   const selectorVoz = document.getElementById("selector-voz"); // NUEVO

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
   let vocesDisponibles = []; // NUEVO: Array para guardar las voces

   // --- INICIO DE CAMBIOS ---

   // MODIFICADO: Función para cargar las voces en el selector
   function cargarVoces() {
      vocesDisponibles = window.speechSynthesis.getVoices();
      selectorVoz.innerHTML = ""; // Limpia opciones anteriores

      // Filtra para mostrar solo las voces en español
      const vocesEspañol = vocesDisponibles.filter((voz) => voz.lang.startsWith("es"));

      vocesEspañol.forEach((voz, index) => {
         const opcion = document.createElement("option");
         opcion.textContent = `${voz.name} (${voz.lang})`;

         // Usamos el nombre de la voz como valor para encontrarla después
         opcion.setAttribute("data-name", voz.name);
         selectorVoz.appendChild(opcion);
      });
   }

   window.speechSynthesis.onvoiceschanged = cargarVoces;

   // MODIFICADO: La función ahora usa la voz seleccionada
   function leerNumeroEnVozAlta(texto) {
      if ("speechSynthesis" in window) {
         const utterance = new SpeechSynthesisUtterance(texto);

         // Obtener el nombre de la voz seleccionada del <select>
         const nombreVozSeleccionada = selectorVoz.selectedOptions[0].getAttribute("data-name");

         // Encontrar el objeto de la voz correspondiente
         const vozSeleccionada = vocesDisponibles.find((voz) => voz.name === nombreVozSeleccionada);

         if (vozSeleccionada) {
            utterance.voice = vozSeleccionada;
         }

         utterance.rate = 0.9;

         window.speechSynthesis.speak(utterance);
         setTimeout(() => {
            window.speechSynthesis.speak(utterance);
         }, 3000);
      }
   }

   // --- FIN DE CAMBIOS ---

   function getLetra(numero) {
      /* ... sin cambios ... */
   }
   function inicializarJuego() {
      /* ... sin cambios, excepto la llamada a cargarVoces ... */
   }
   function llamarNumero() {
      /* ... sin cambios ... */
   }
   function actualizarUI(numero) {
      /* ... sin cambios ... */
   }

   // --- Bloques de funciones sin cambios (copiar y pegar) ---
   function getLetra(numero) {
      for (const letra in BINGO_MAP) {
         if (numero >= BINGO_MAP[letra].min && numero <= BINGO_MAP[letra].max) {
            return letra;
         }
      }
   }
   function inicializarJuego() {
      cargarVoces(); // Llama para intentar cargar las voces al inicio
      tableroControl.innerHTML = "";
      numerosDisponibles = [];

      const columnas = { B: [], I: [], N: [], G: [], O: [] };
      for (let i = 1; i <= 75; i++) {
         numerosDisponibles.push(i);
         const letra = getLetra(i);
         const numeroDiv = document.createElement("div");
         numeroDiv.classList.add("numero-tablero");
         numeroDiv.id = `numero-${i}`;
         numeroDiv.textContent = i;
         columnas[letra].push(numeroDiv);
      }
      for (let i = 0; i < 15; i++) {
         ["B", "I", "N", "G", "O"].forEach((letra) => tableroControl.appendChild(columnas[letra][i]));
      }
      numeroActualDisplay.textContent = "-";
      llamarNumeroBtn.disabled = false;
   }
   function llamarNumero() {
      if (numerosDisponibles.length === 0) {
         const mensajeFinal = "¡Bingo! Han salido todos los números.";
         alert(mensajeFinal);
         leerNumeroEnVozAlta(mensajeFinal);
         llamarNumeroBtn.disabled = true;
         return;
      }
      const indiceAleatorio = Math.floor(Math.random() * numerosDisponibles.length);
      const numeroNuevo = numerosDisponibles.splice(indiceAleatorio, 1)[0];
      actualizarUI(numeroNuevo);
   }

   function actualizarUI(numero) {
      const letra = getLetra(numero);
      const textoParaMostrar = `${letra}-${numero}`;

      // NUEVO: Revisa el mapa fonético. Si la letra existe, usa su valor; si no, usa la letra original.
      const letraParaLeer = phoneticMap[letra] || letra;

      // MODIFICADO: Usa la nueva variable para construir el texto a leer.
      const textoParaLeer = `${letraParaLeer}, ${numero}`;

      numeroActualDisplay.textContent = textoParaMostrar;
      numeroActualDisplay.classList.add("animar");

      leerNumeroEnVozAlta(textoParaLeer);

      setTimeout(() => {
         numeroActualDisplay.classList.remove("animar");
      }, 500);

      const numeroEnTablero = document.getElementById(`numero-${numero}`);
      if (numeroEnTablero) {
         numeroEnTablero.classList.add("salido");
      }
   }

   llamarNumeroBtn.addEventListener("click", llamarNumero);
   inicializarJuego();

   document.addEventListener("keydown", (event) => {
      // Comprueba si la tecla presionada es la barra espaciadora
      if (event.code === "Space") {
         // Previene la acción por defecto (como hacer scroll en la página)
         event.preventDefault();

         // Simula un clic en el botón para llamar al número
         // Nos aseguramos de no hacerlo si el botón está desactivado
         if (!llamarNumeroBtn.disabled) {
            llamarNumeroBtn.click();
         }
      }
   });
});
