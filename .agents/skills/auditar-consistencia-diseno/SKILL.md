---
name: auditar-consistencia-diseno
description: Audita y CORRIGE la interfaz para asegurar consistencia en colores, tipografía y componentes según el sistema de diseño.
---

# Auditoría y Corrección de Diseño

## Cuándo usar este skill
- Cuando el usuario pida "revisar el diseño", "auditar estilos" o "ver si está consistente".
- Cuando se agreguen nuevas páginas o componentes complejos.
- Cuando se detecte un "carnaval" de fuentes o colores mezclados.
- **NUEVO**: Cuando el usuario pida "estandarizar" o "arreglar el diseño".

## Inputs necesarios
- **Archivos a revisar**: Ruta de los archivos o componentes específicos (o "toda la app").
- **Modo**: 
    1. **Auditoría** (Solo reportar).
    2. **Corrección** (Aplicar cambios automáticamente).

## Workflow

### 1. Cargar Reglas (Siempre)
- Lee `recursos/reglas-estilo.md` para tener presentes los colores (`#EF534F`), fuentes (`Inter`) y formas permitidas.

### 2. Detección (Auditoría)
- Busca valores *hardcoded* que rompan las reglas.
- Busca `rounded-md`, `rounded-lg`, `rounded-sm`, `rounded-none`, `rounded-[10px]` en botones y elementos principales.
- Busca colores rojos incorrectos (ej. `#F44336`, `#EA4C46`).

### 3. Protocolo de Corrección (Auto-Fix) 🛠️
Si el usuario autoriza o pide corregir, aplica estas reglas **sin piedad**:

| Hallazgo | Acción Automática | Excepción |
| :--- | :--- | :--- |
| `rounded-lg`, `rounded-md`, `rounded-[10px]` | Cambiar a **`rounded-xl`** | Inputs muy pequeños o elementos internos de tablas. |
| `#F05F57`, `#EA4C46`, `#F44336` | Cambiar a **`#EF534F`** (Primary) | Si es un color semántico de error/borrar. |
| `bg-black`, `bg-gray-900` en CTAs | Cambiar a **`bg-[#EF534F]`** | Si es un botón secundario o "ghost". |
| `w-[48px]` (valores mágicos) | Cambiar al token más cercano (ej. `w-12`) | Si es un SVG o gráfico específico. |

### 4. Reporte Final
Genera una tabla o lista con los cambios realizados:
- ✅ *Fixed*: `LoginPage.jsx` (rounded-lg -> rounded-xl)
- ✅ *Fixed*: `ServiceDetail.jsx` (Black Button -> Red Button)
