# Reglas de Estilo Oficiales (LowSplit)

Estas son las verdades absolutas del diseño. Cualquier desviación debe ser justificada o corregida.

## 🎨 Colores (Figma & Tailwind)

### Primarios (Rojo Premium)
- **Principal**: `#EF534F` (`bg-primary-500`)
- **Hover**: `#dc2626` (`bg-primary-600`) o `#e0403c`
- *Uso*: Botones de acción principal (CTA), acentos, bordes activos.

### Fondos
- **Global Light**: `#FAFAFA` (`bg-background-light`)
- **Soft Cluster**: `#FEEDEC` (`bg-background-soft`) - Para secciones destacadas suaves.
- **Dark (Footer/Night)**: `#1D2A36` (`bg-dark-700`), `#091924` (`bg-dark-800`).

## 🔡 Tipografía
- **Familia**: `Inter`, `system-ui`, `sans-serif`.
- **Clase Tailwind**: `font-sans`.
- **Pesos**:
    - Títulos: `font-bold` o `font-extrabold`.
    - Cuerpo: `font-normal`.
    - Botones: `font-bold`.

## 🧩 Componentes

### Botones (Estilo Principal - ESTRICTO)
🚨 **TODOS** los botones visibles deben seguir estas reglas:
- **Forma OBLIGATORIA**: `rounded-xl` (o `rounded-2xl` si son muy grandes).
- **PROHIBIDO**: `rounded-sm`, `rounded-md`, `rounded-lg` (reservado para inputs pequeños), `rounded-none`.
- **Sombra**: `shadow-lg` (a menudo con color: `shadow-red-200`) para CTAs.
- **Interacción**: `transition-all`, `transform`, `active:scale-95` (efecto click).
- **Texto**: Blanco sobre rojo primario (CTA) o Gris oscuro sobre blanco (Secundario).

### Tarjetas (Cards)
- **Fondo**: Blanco (`bg-white`) o Glass (`glass`).
- **Borde**: Sutil o nulo.
- **Sombra**: `shadow-xl` o `shadow-md`.
- **Radio**: `rounded-xl` o `rounded-2xl`.

## 🚫 "El Carnaval" (Infracciones Comunes)
- Botones con `rounded-lg` mezclados con `rounded-xl`.
- Botones de compra que no parecen botones (falta de sombra o padding incorrecto).
- Colores "parecidos" pero no iguales (ej. `#F44336`).
- Íconos dentro de botones con fondos cuadrados.
