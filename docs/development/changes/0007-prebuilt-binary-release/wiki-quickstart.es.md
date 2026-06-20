<!--
  Contenido LISTO PARA PEGAR en la wiki del repo (GitHub Wiki es un repo aparte: *.wiki.git).
  Sustituye la sección de "Instalación rápida" del quickstart por lo siguiente. Idioma: español
  (audiencia concreta de la wiki). Mantén el resto de tu explicación de filosofía.
-->

## ⚡ Instalación rápida

> Requisito único: **Node.js ≥ 20**. Si aún no lo tienes, salta a [Sin Node todavía](#sin-node-todavía).

### Opción A — Fácil (recomendada): binario precompilado

Descarga e instala el **tarball precompilado** de la última release. Sin clonar, sin compilar:

```bash
npm i -g https://github.com/grojof/ai-workspace-generator/releases/latest/download/ai-workspace-generator.tgz
ai-workspace --version
```

Ya puedes usarlo en cualquier repo:

```bash
cd /ruta/a/tu-repo
ai-workspace init      # asistente: detecta el stack, escribe workspace.config.yaml y genera todo
```

> Para la configuración más rica, dentro del editor (Claude Code) usa la skill guiada **`/configure`** y deja
> que la IA te proponga la configuración explicándote cada opción.

### Opción B — Experta: desde el código fuente

```bash
git clone https://github.com/grojof/ai-workspace-generator.git
cd ai-workspace-generator
npm install && npm run build && npm link
```

### 🔄 Actualizar

- **Fácil:** vuelve a ejecutar la instalación de la Opción A (siempre apunta a la última release).
- **Desde código:** `git pull && npm run build`.

### Sin Node todavía

No hace falta que prepares nada a mano: dile a tu asistente de IA

> *"instala ai-workspace desde https://github.com/grojof/ai-workspace-generator"*

y te guiará la instalación según tu sistema operativo (comprueba git/Node/npm y **pregunta antes de instalar
nada**). Un binario autónomo **sin Node** está planificado como mejora aparte.
