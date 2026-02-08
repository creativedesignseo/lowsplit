---
name: guardar-cambios-git
description: Automatiza el flujo de gestión de código: staging, commit semántico, push y changelog.
---

# Automatización de Git y GitHub

## Cuándo usar este skill
- Cuando el usuario quiera guardar su trabajo ("guardar cambios", "hacer commit", "subir a github").
- Cuando se termine una tarea o hito importante.
- Cuando se necesite asegurar un historial de commits limpio (Conventional Commits).

## Inputs necesarios
- **Mensaje del commit**: Descripción breve y clara de los cambios.
- **Tipo de cambio**: feat, fix, style, refactor, docs, chore, etc.
- **Rama destino**: Generalmente `main`.

## Workflow
1.  **Staging**: Agregar todos los cambios (`git add .`).
2.  **Estado**: Mostrar qué se va a guardar (`git status`).
3.  **Commit**: Generar el commit con formato Conventional Commits.
4.  **Push**: Subir cambios al remoto.
5.  **Changelog**: Actualizar o verificar el `CHANGELOG.md`.

## Instrucciones

### 1. Ejecutar Staging
- Corre `git add .` en la raíz del proyecto.
- Corre `git status` para que el usuario vea qué archivos se incluyen.

### 2. Preparar Commit
- Pide al usuario (o infiere del contexto) el tipo de cambio (`feat`, `fix`, etc.) y la descripción.
- Formato: `<tipo>: <descripción>`
- Ejecuta: `git commit -m "<mensaje>"`

### 3. Subir Cambios
- Ejecuta: `git push origin main` (o la rama actual).
- *Nota*: Si falla por conflictos, **detente** y avisa al usuario.

### 4. Actualizar Changelog
- Verifica si existe `CHANGELOG.md`.
- Si existe, añade una entrada con la fecha de hoy y el cambio realizado.
- Si no lo puedes editar automáticamente con seguridad, pide al usuario que lo revise.

## Output (formato exacto)
Muestra un resumen final:
- ✅ **Commit**: `[hash] <mensaje>`
- ✅ **Push**: `Exitosa a origin/main`
- 📝 **Changelog**: `Actualizado` (o `Pendiente`)
