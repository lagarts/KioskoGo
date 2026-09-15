# AGENTS.md - Reglas para IA que trabajan en KioskoGo

## Contexto del Proyecto

KioskoGo es un sistema POS/PWA profesional para comercios minoristas (kioscos, almacenes, supermercados, etc.).

## Stack

- React 19 + TypeScript + Vite 8
- Tailwind CSS v4
- Supabase (Auth + DB + RLS)
- Lucide React (iconos)
- vite-plugin-pwa

## Reglas de Código

### Estructura
- Separar código en: components/, pages/, hooks/, services/, lib/, types/, utils/, features/
- Cada página en su propia carpeta dentro de pages/
- Componentes reutilizables en components/ui/
- Layouts en layouts/

### Estilo
- Usar Tailwind CSS para todo el estilo
- Colores principales: kiosko-500 (#FFCA28), kiosko-600 (#FFC107), kiosko-700 (#FFB300)
- Background: surface-950 (#121212), surface-900 (#1a1a1a)
- Texto: white, surface-300 (#E0E0E0), surface-400 (#BDBDBD)
- Estados: verde para éxito, rojo para errores, amarillo para advertencias

### Componentes
- Usar los componentes UI existentes: Button, Card, Badge, Input
- Button variants: primary (kiosko), secondary (surface), danger (red), ghost, success (green)
- Button sizes: sm, md, lg, xl
- Siempre usar iconos de Lucide React

### TypeScript
- Definir tipos en types/index.ts
- No usar `any`
- Usar interfaces para props de componentes

### Routing
- Todas las rutas protegidas deben usar ProtectedRoute
- Layout principal: MainLayout (sidebar + header)

### Hardware
- NO simular conexiones de hardware no implementadas
- Mostrar "Próximamente" para funcionalidades no disponibles
- La capa de hardware debe estar desacoplada

### Datos
- Usar datos mock/demo para desarrollo
- NO usar datos reales de clientes
- Preparar para conexión con Supabase

### PWA
- Manifest en public/manifest.webmanifest (generado por vite-plugin-pwa)
- Iconos en public/icons/
- Service worker generado automáticamente

### Build
- Verificar TypeScript: `npx tsc -b`
- Verificar build: `npm run build`
- NO commitear errores de compilación

## Flujo POS (prioridad máxima)

1. Abrir caja
2. Cargar venta
3. Escanear/buscar producto
4. Agregar al carrito
5. Calcular total
6. Cobrar (seleccionar método de pago)
7. Confirmar venta
8. Venta completada

## Convenciones de Nombres

- Archivos: PascalCase para componentes (Button.tsx), camelCase para utilidades (format.ts)
- Variables: camelCase
- Componentes React: PascalCase
- Rutas: kebab-case (/sales/new, /cash)

## Seguridad

- No exponer claves de Supabase en frontend
- Usar RLS en Supabase para aislamiento por comercio
- Validar permisos en cada ruta protegida
- No confiar solo en validaciones del frontend
