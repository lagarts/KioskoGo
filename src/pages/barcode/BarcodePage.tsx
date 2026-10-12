import { useEffect, useMemo, useState } from 'react';
import JsBarcode from 'jsbarcode';
import { Barcode, Printer, Plus, Trash2, Search } from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { listSellableProducts, type SellableProduct } from '../../services/products.service';

interface SizePreset {
  id: string;
  label: string;
  w: number;
  h: number;
}

const SIZE_PRESETS: SizePreset[] = [
  { id: '38x25', label: '38 × 25 mm (mini)', w: 38, h: 25 },
  { id: '50x25', label: '50 × 25 mm', w: 50, h: 25 },
  { id: '50x30', label: '50 × 30 mm', w: 50, h: 30 },
  { id: '58x40', label: '58 × 40 mm', w: 58, h: 40 },
  { id: '70x50', label: '70 × 50 mm', w: 70, h: 50 },
  { id: '100x50', label: '100 × 50 mm', w: 100, h: 50 },
  { id: 'custom', label: 'Personalizado', w: 0, h: 0 },
];

const TEXT_SIZES = {
  small: { name: 2.0, code: 2.2 },
  medium: { name: 2.6, code: 2.8 },
  large: { name: 3.2, code: 3.4 },
} as const;

type TextSizeKey = keyof typeof TEXT_SIZES;

interface PrintConfig {
  presetId: string;
  customW: number;
  customH: number;
  marginMm: number;
  barcodeHeightMm: number;
  font: 'sans' | 'mono';
  textSize: TextSizeKey;
  showName: boolean;
  showPrice: boolean;
}

const DEFAULT_CONFIG: PrintConfig = {
  presetId: '50x30',
  customW: 50,
  customH: 30,
  marginMm: 2,
  barcodeHeightMm: 12,
  font: 'sans',
  textSize: 'medium',
  showName: true,
  showPrice: false,
};

const STORAGE_KEY = 'kioskogo.barcode.print';

interface ManualCode {
  id: string;
  code: string;
  copies: number;
}

interface LabelSpec {
  code: string;
  name?: string;
  price?: number;
  copies: number;
}

function esc(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function renderBarcodeSvg(code: string): string {
  try {
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    JsBarcode(svg, code, {
      format: 'CODE128',
      displayValue: false,
      margin: 0,
      height: 40,
      width: 2,
      background: 'transparent',
      lineColor: '#000000',
    });
    const w = svg.getAttribute('width') ?? '100';
    const h = svg.getAttribute('height') ?? '40';
    svg.setAttribute('viewBox', `0 0 ${w} ${h}`);
    svg.removeAttribute('width');
    svg.removeAttribute('height');
    svg.setAttribute('preserveAspectRatio', 'xMidYMid meet');
    return svg.outerHTML;
  } catch {
    return '';
  }
}

function loadConfig(): PrintConfig {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_CONFIG;
    return { ...DEFAULT_CONFIG, ...(JSON.parse(raw) as Partial<PrintConfig>) };
  } catch {
    return DEFAULT_CONFIG;
  }
}

export function BarcodePage() {
  const [products, setProducts] = useState<SellableProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [search, setSearch] = useState('');
  const [selection, setSelection] = useState<Record<string, number>>({});
  const [manualCodes, setManualCodes] = useState<ManualCode[]>([]);
  const [manualInput, setManualInput] = useState('');
  const [config, setConfig] = useState<PrintConfig>(loadConfig);

  useEffect(() => {
    (async () => {
      try {
        setProducts(await listSellableProducts());
      } catch (err) {
        setLoadError(err instanceof Error ? err.message : 'Error cargando productos');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
  }, [config]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const list = products.filter((p) => p.barcode);
    if (!q) return list.slice(0, 80);
    return list
      .filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          (p.barcode ?? '').toLowerCase().includes(q)
      )
      .slice(0, 80);
  }, [products, search]);

  const preset = SIZE_PRESETS.find((p) => p.id === config.presetId) ?? SIZE_PRESETS[1];
  const w = preset.id === 'custom' ? Math.max(10, config.customW) : preset.w;
  const h = preset.id === 'custom' ? Math.max(10, config.customH) : preset.h;
  const fontFamily =
    config.font === 'mono' ? '"Courier New", Courier, monospace' : 'Arial, Helvetica, sans-serif';
  const textSizes = TEXT_SIZES[config.textSize];

  const labels: LabelSpec[] = useMemo(() => {
    const fromProducts: LabelSpec[] = [];
    for (const [id, copies] of Object.entries(selection)) {
      if (copies <= 0) continue;
      const p = products.find((prod) => prod.id === id);
      if (!p || !p.barcode) continue;
      fromProducts.push({ code: p.barcode, name: p.name, price: Number(p.price), copies });
    }
    const fromManual: LabelSpec[] = manualCodes.map((m) => ({
      code: m.code,
      copies: m.copies,
    }));
    return [...fromProducts, ...fromManual];
  }, [selection, manualCodes, products]);

  const totalLabels = labels.reduce((sum, l) => sum + l.copies, 0);

  const previewLabels = useMemo(() => {
    const flat: LabelSpec[] = [];
    for (const l of labels) {
      for (let i = 0; i < l.copies; i++) flat.push({ ...l, copies: 1 });
      if (flat.length >= 4) break;
    }
    return flat.slice(0, 4).map((l) => ({ ...l, svg: renderBarcodeSvg(l.code) }));
  }, [labels]);

  const updatePreset = (presetId: string) => {
    setConfig((c) => ({ ...c, presetId }));
  };

  const toggleProduct = (id: string) => {
    setSelection((prev) => {
      const next = { ...prev };
      if (id in next) delete next[id];
      else next[id] = 1;
      return next;
    });
  };

  const setCopies = (id: string, copies: number) => {
    setSelection((prev) => ({ ...prev, [id]: Math.max(1, Math.min(99, copies || 1)) }));
  };

  const addManual = () => {
    const code = manualInput.trim();
    if (!code) return;
    setManualCodes((prev) => [
      ...prev,
      { id: crypto.randomUUID(), code, copies: 1 },
    ]);
    setManualInput('');
  };

  const handlePrint = () => {
    if (totalLabels === 0) return;
    const win = window.open('', '_blank', 'width=700,height=500');
    if (!win) {
      alert('Permití las ventanas emergentes para poder imprimir.');
      return;
    }

    const css = `
      @page { size: ${w}mm ${h}mm; margin: 0; }
      * { box-sizing: border-box; }
      html, body { margin: 0; padding: 0; }
      body { font-family: ${fontFamily}; }
      .label {
        width: ${w}mm;
        height: ${h}mm;
        padding: ${Math.min(config.marginMm, w / 3)}mm;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: 0.6mm;
        overflow: hidden;
        text-align: center;
        page-break-after: always;
      }
      .label:last-child { page-break-after: auto; }
      .name {
        font-size: ${textSizes.name}mm;
        font-weight: 600;
        max-width: 100%;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        line-height: 1.1;
      }
      .bars { width: 100%; display: flex; justify-content: center; }
      .bars svg { width: 100%; height: ${config.barcodeHeightMm}mm; }
      .code {
        font-size: ${textSizes.code}mm;
        letter-spacing: 0.4mm;
        line-height: 1;
        white-space: nowrap;
      }
      .price { font-size: ${textSizes.name}mm; font-weight: 700; line-height: 1.1; }
    `;

    const parts: string[] = [];
    for (const label of labels) {
      const svg = renderBarcodeSvg(label.code);
      for (let i = 0; i < label.copies; i++) {
        parts.push(`
          <div class="label">
            ${config.showName && label.name ? `<div class="name">${esc(label.name)}</div>` : ''}
            <div class="bars">${svg}</div>
            <div class="code">${esc(label.code)}</div>
            ${config.showPrice && label.price != null ? `<div class="price">$${label.price.toFixed(2)}</div>` : ''}
          </div>
        `);
      }
    }

    win.document.write(
      `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Etiquetas KioskoGo</title><style>${css}</style></head><body>${parts.join('')}</body></html>`
    );
    win.document.close();
    setTimeout(() => {
      win.focus();
      win.print();
    }, 400);
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-kiosko-600/15 flex items-center justify-center">
            <Barcode size={20} className="text-kiosko-500" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Códigos de Barras</h1>
            <p className="text-sm text-surface-400">
              Seleccioná productos o cargá códigos, configurá la etiqueta e imprimí
            </p>
          </div>
        </div>
        <Button onClick={handlePrint} disabled={totalLabels === 0} size="lg">
          <Printer size={18} />
          Imprimir {totalLabels > 0 ? `${totalLabels} etiqueta${totalLabels === 1 ? '' : 's'}` : ''}
        </Button>
      </div>

      {loadError && (
        <div className="bg-red-900/30 border border-red-800 text-red-400 text-sm px-4 py-3 rounded-lg">
          {loadError}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-4">
          <Card>
            <h2 className="text-sm font-semibold text-white mb-3">Productos con código de barras</h2>
            <div className="relative mb-3">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-surface-500" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar por nombre o código..."
                className="w-full bg-surface-800 border border-surface-700 rounded-lg pl-9 pr-4 py-2.5 text-sm text-white placeholder-surface-500 focus:outline-none focus:ring-2 focus:ring-kiosko-500/50"
              />
            </div>
            {loading ? (
              <p className="text-sm text-surface-400 py-6 text-center">Cargando productos...</p>
            ) : filtered.length === 0 ? (
              <p className="text-sm text-surface-500 py-6 text-center">
                {products.every((p) => !p.barcode)
                  ? 'Ningún producto tiene código de barras cargado. Usá el código suelto de abajo o cargá códigos en Productos.'
                  : 'Sin resultados'}
              </p>
            ) : (
              <div className="space-y-1 max-h-[420px] overflow-y-auto pr-1">
                {filtered.map((p) => {
                  const checked = p.id in selection;
                  return (
                    <div
                      key={p.id}
                      className={`flex items-center gap-3 px-3 py-2 rounded-lg border transition-colors ${
                        checked
                          ? 'border-kiosko-600/60 bg-kiosko-600/10'
                          : 'border-surface-800 hover:border-surface-700'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggleProduct(p.id)}
                        className="accent-kiosko-500 w-4 h-4 shrink-0"
                      />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm text-white truncate">{p.name}</p>
                        <p className="text-xs text-surface-500 font-mono">{p.barcode}</p>
                      </div>
                      {checked && (
                        <label className="flex items-center gap-1.5 shrink-0">
                          <span className="text-xs text-surface-400">Copias</span>
                          <input
                            type="number"
                            min={1}
                            max={99}
                            value={selection[p.id]}
                            onChange={(e) => setCopies(p.id, parseInt(e.target.value, 10))}
                            className="w-16 bg-surface-800 border border-surface-700 rounded-lg px-2 py-1 text-sm text-white text-center focus:outline-none focus:ring-2 focus:ring-kiosko-500/50"
                          />
                        </label>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </Card>

          <Card>
            <h2 className="text-sm font-semibold text-white mb-3">Códigos sueltos</h2>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                addManual();
              }}
              className="flex gap-2"
            >
              <div className="flex-1">
                <Input
                  placeholder="Escribí un código y presioná Agregar"
                  value={manualInput}
                  onChange={(e) => setManualInput(e.target.value)}
                  maxLength={40}
                  autoComplete="off"
                />
              </div>
              <Button type="submit" disabled={!manualInput.trim()}>
                <Plus size={16} />
                Agregar
              </Button>
            </form>
            {manualCodes.length > 0 && (
              <div className="mt-3 space-y-2">
                {manualCodes.map((m) => (
                  <div
                    key={m.id}
                    className="flex items-center gap-3 bg-surface-800/60 border border-surface-700 rounded-lg px-3 py-2"
                  >
                    <p className="flex-1 text-sm font-mono text-white truncate">{m.code}</p>
                    <label className="flex items-center gap-1.5">
                      <span className="text-xs text-surface-400">Copias</span>
                      <input
                        type="number"
                        min={1}
                        max={99}
                        value={m.copies}
                        onChange={(e) =>
                          setManualCodes((prev) =>
                            prev.map((x) =>
                              x.id === m.id
                                ? { ...x, copies: Math.max(1, Math.min(99, parseInt(e.target.value, 10) || 1)) }
                                : x
                            )
                          )
                        }
                        className="w-16 bg-surface-800 border border-surface-700 rounded-lg px-2 py-1 text-sm text-white text-center focus:outline-none"
                      />
                    </label>
                    <button
                      onClick={() => setManualCodes((prev) => prev.filter((x) => x.id !== m.id))}
                      className="p-1.5 rounded-lg text-surface-400 hover:text-red-400 hover:bg-red-900/20"
                      title="Quitar"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>

        <div className="space-y-4">
          <Card>
            <h2 className="text-sm font-semibold text-white mb-4">Configuración de impresión</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-surface-300 mb-1.5">
                  Tamaño de impresión
                </label>
                <select
                  value={config.presetId}
                  onChange={(e) => updatePreset(e.target.value)}
                  className="w-full bg-surface-800 border border-surface-700 rounded-lg px-4 py-2.5 text-sm text-white outline-none focus:ring-2 focus:ring-kiosko-500/50"
                >
                  {SIZE_PRESETS.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.label}
                    </option>
                  ))}
                </select>
              </div>

              {preset.id === 'custom' && (
                <div className="grid grid-cols-2 gap-3">
                  <Input
                    label="Ancho (mm)"
                    type="number"
                    min={10}
                    max={200}
                    value={config.customW}
                    onChange={(e) =>
                      setConfig((c) => ({ ...c, customW: parseInt(e.target.value, 10) || 50 }))
                    }
                  />
                  <Input
                    label="Alto (mm)"
                    type="number"
                    min={10}
                    max={200}
                    value={config.customH}
                    onChange={(e) =>
                      setConfig((c) => ({ ...c, customH: parseInt(e.target.value, 10) || 30 }))
                    }
                  />
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <Input
                  label="Margen (mm)"
                  type="number"
                  min={0}
                  max={10}
                  value={config.marginMm}
                  onChange={(e) =>
                    setConfig((c) => ({ ...c, marginMm: parseInt(e.target.value, 10) || 0 }))
                  }
                />
                <Input
                  label="Altura del código (mm)"
                  type="number"
                  min={5}
                  max={40}
                  value={config.barcodeHeightMm}
                  onChange={(e) =>
                    setConfig((c) => ({ ...c, barcodeHeightMm: parseInt(e.target.value, 10) || 12 }))
                  }
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-surface-300 mb-1.5">Fuente</label>
                  <select
                    value={config.font}
                    onChange={(e) =>
                      setConfig((c) => ({ ...c, font: e.target.value as PrintConfig['font'] }))
                    }
                    className="w-full bg-surface-800 border border-surface-700 rounded-lg px-4 py-2.5 text-sm text-white outline-none focus:ring-2 focus:ring-kiosko-500/50"
                  >
                    <option value="sans">Sans (Arial)</option>
                    <option value="mono">Monoespaciada (Courier)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-surface-300 mb-1.5">
                    Tamaño de texto
                  </label>
                  <select
                    value={config.textSize}
                    onChange={(e) =>
                      setConfig((c) => ({ ...c, textSize: e.target.value as TextSizeKey }))
                    }
                    className="w-full bg-surface-800 border border-surface-700 rounded-lg px-4 py-2.5 text-sm text-white outline-none focus:ring-2 focus:ring-kiosko-500/50"
                  >
                    <option value="small">Pequeño</option>
                    <option value="medium">Mediano</option>
                    <option value="large">Grande</option>
                  </select>
                </div>
              </div>

              <div className="flex flex-wrap gap-4">
                <label className="flex items-center gap-2 text-sm text-surface-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={config.showName}
                    onChange={(e) => setConfig((c) => ({ ...c, showName: e.target.checked }))}
                    className="accent-kiosko-500 w-4 h-4"
                  />
                  Mostrar nombre
                </label>
                <label className="flex items-center gap-2 text-sm text-surface-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={config.showPrice}
                    onChange={(e) => setConfig((c) => ({ ...c, showPrice: e.target.checked }))}
                    className="accent-kiosko-500 w-4 h-4"
                  />
                  Mostrar precio
                </label>
              </div>

              <p className="text-xs text-surface-500">
                La configuración se guarda en este dispositivo. El formato del código es CODE128.
              </p>
            </div>
          </Card>

          <Card>
            <h2 className="text-sm font-semibold text-white mb-3">
              Vista previa <span className="text-surface-500 font-normal">({w} × {h} mm)</span>
            </h2>
            {previewLabels.length === 0 ? (
              <p className="text-sm text-surface-500 py-8 text-center">
                Seleccioná productos o agregá códigos para ver la etiqueta
              </p>
            ) : (
              <div className="flex flex-wrap items-start gap-4">
                {previewLabels.map((l, i) => (
                  <div
                    key={i}
                    style={{
                      width: `${w}mm`,
                      height: `${h}mm`,
                      padding: `${Math.min(config.marginMm, w / 3)}mm`,
                      fontFamily,
                    }}
                    className="border border-dashed border-surface-600 rounded bg-white flex flex-col items-center justify-center overflow-hidden text-black shrink-0"
                  >
                    {config.showName && l.name && (
                      <p
                        style={{ fontSize: `${textSizes.name}mm` }}
                        className="font-semibold max-w-full truncate leading-none"
                      >
                        {l.name}
                      </p>
                    )}
                    <div
                      style={{ height: `${config.barcodeHeightMm}mm` }}
                      className="w-full flex items-center justify-center my-[0.4mm]"
                      dangerouslySetInnerHTML={{ __html: l.svg }}
                    />
                    <p style={{ fontSize: `${textSizes.code}mm` }} className="leading-none tracking-wider">
                      {l.code}
                    </p>
                    {config.showPrice && l.price != null && (
                      <p style={{ fontSize: `${textSizes.name}mm` }} className="font-bold leading-none mt-[0.4mm]">
                        ${l.price.toFixed(2)}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
