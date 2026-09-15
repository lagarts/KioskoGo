# KioskoGo

Sistema de gestión y punto de venta (POS) para pequeños y medianos comercios.

## Descripción

KioskoGo es una WEB APP/PWA profesional diseñada para kioscos, almacenes, minimercados, supermercados, carnicerías, panaderías, dietéticas, despensas, fiambrerías, verdulerías y comercios de barrio.

## Stack Tecnológico

- **Frontend:** React + TypeScript + Vite
- **Estilos:** Tailwind CSS v4
- **Backend:** Supabase (Auth + Base de datos + RLS)
- **PWA:** vite-plugin-pwa + Workbox
- **Iconos:** Lucide React
- **Deploy:** Vercel + GitHub

## Características

- Mobile First, Responsive (Desktop, Tablet, Celular)
- PWA instalable en Android, iPhone y Escritorio
- Sistema de caja (apertura/cierre)
- POS optimizado para ventas rápidas
- Lector de código de barras (HID)
- Productos por peso (kg, g, l, ml)
- Gestión de stock multi-depósito
- Reportes y gráficos
- Roles y permisos
- Suscripciones (trial 3 meses + pago)
- Identidad visual amarilla/dorada

## Instalación

```bash
# Clonar
git clone https://github.com/sergiocovacevich1991-prog/KiosKoGo.git
cd KiosKoGo

# Instalar dependencias
npm install

# Configurar variables de entorno
cp .env.example .env
# Editar .env con tus credenciales de Supabase

# Ejecutar en desarrollo
npm run dev

# Build para producción
npm run build

# Preview del build
npm run preview
```

## Variables de Entorno

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

## Estructura del Proyecto

```
src/
├── components/         # Componentes reutilizables
│   ├── layout/         # Sidebar, Header
│   └── ui/             # Button, Card, Badge, Input
├── contexts/           # React Context (Auth)
├── features/           # Lógica de negocio por módulo
├── hooks/              # Custom hooks
├── layouts/            # Layouts principales
├── lib/                # Configuración (Supabase)
├── pages/              # Páginas/rutas
│   ├── auth/           # Login, Registro
│   ├── cash/           # Caja
│   ├── sales/          # POS, Historial
│   ├── products/       # CRUD Productos
│   ├── categories/     # CRUD Categorías
│   ├── customers/      # CRUD Clientes
│   ├── suppliers/      # CRUD Proveedores
│   ├── reports/        # Reportes
│   ├── expenses/       # Gastos
│   └── settings/       # Configuración
├── services/           # Servicios API
├── types/              # Definiciones TypeScript
└── utils/              # Utilidades (format, etc.)
```

## Módulos Implementados

- [x] Dashboard principal
- [x] Sistema de autenticación
- [x] Layout responsive (sidebar + header)
- [x] POS (Cargar Ventas)
- [x] Sistema de caja (apertura/cierre)
- [x] Productos CRUD
- [x] Categorías CRUD
- [x] Clientes CRUD
- [x] Proveedores CRUD
- [x] Reportes
- [x] Gastos
- [x] Configuración (Mi comercio, Hardware, Suscripción, Usuarios)
- [x] PWA (manifest, service worker, iconos)

## Módulos Pendientes

- [ ] Historial de ventas
- [ ] Compras
- [ ] Stock / Inventario
- [ ] Transferencias entre depósitos
- [ ] Códigos de barras (generación)
- [ ] Etiquetas
- [ ] Cuentas corrientes
- [ ] Métodos de pago (configuración)
- [ ] Panel Admin
- [ ] Soporte
- [ ] Integración Supabase (conexión real)
- [ ] Integración Mercado Pago / PayPal

## Deployment

### Vercel

1. Conectar repositorio GitHub a Vercel
2. Configurar variables de entorno
3. Deploy automático

### Supabase

1. Crear proyecto en Supabase
2. Ejecutar migraciones de base de datos
3. Configurar RLS policies
4. Copiar URL y anon key a .env

## Licencia

MIT
