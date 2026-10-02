import { useEffect, useState } from 'react';
import { X, Delete } from 'lucide-react';

interface CalculatorModalProps {
  open: boolean;
  onClose: () => void;
  onUse?: (value: string) => void;
}

const OPERATOR_LABELS: Record<string, string> = { '+': '+', '-': '−', '*': '×', '/': '÷' };

interface KeyDef {
  label: string;
  action: () => void;
  variant?: 'op' | 'action' | 'equals';
  span?: boolean;
}

export function CalculatorModal({ open, onClose, onUse }: CalculatorModalProps) {
  const [display, setDisplay] = useState('0');
  const [accumulator, setAccumulator] = useState<number | null>(null);
  const [operator, setOperator] = useState<string | null>(null);
  const [waiting, setWaiting] = useState(false);

  const compute = (a: number, b: number, op: string): number => {
    switch (op) {
      case '+':
        return a + b;
      case '-':
        return a - b;
      case '*':
        return a * b;
      case '/':
        return b === 0 ? NaN : a / b;
      default:
        return b;
    }
  };

  const format = (n: number): string => {
    if (Number.isNaN(n) || !Number.isFinite(n)) return 'Error';
    return String(Math.round(n * 1e10) / 1e10);
  };

  const pressDigit = (d: string) => {
    if (display === 'Error') {
      setDisplay(d);
      setWaiting(false);
      return;
    }
    if (waiting) {
      setDisplay(d);
      setWaiting(false);
      return;
    }
    if (display.replace(/[-.]/g, '').length >= 12) return;
    setDisplay(display === '0' ? d : display + d);
  };

  const pressDot = () => {
    if (waiting || display === 'Error') {
      setDisplay('0.');
      setWaiting(false);
      return;
    }
    if (!display.includes('.')) setDisplay(display + '.');
  };

  const pressBackspace = () => {
    if (waiting || display === 'Error') return;
    setDisplay(display.length > 1 ? display.slice(0, -1) : '0');
  };

  const pressClear = () => {
    setDisplay('0');
    setAccumulator(null);
    setOperator(null);
    setWaiting(false);
  };

  const pressSign = () => {
    if (display === 'Error' || display === '0') return;
    setDisplay(display.startsWith('-') ? display.slice(1) : `-${display}`);
  };

  const pressPercent = () => {
    setDisplay(format(parseFloat(display) / 100));
    setWaiting(false);
  };

  const pressOperator = (op: string) => {
    const current = parseFloat(display);
    if (accumulator !== null && operator && !waiting) {
      const result = compute(accumulator, current, operator);
      setDisplay(format(result));
      setAccumulator(Number.isNaN(result) ? null : result);
    } else {
      setAccumulator(current);
    }
    setOperator(op);
    setWaiting(true);
  };

  const pressEquals = () => {
    if (operator === null || accumulator === null) return;
    const result = compute(accumulator, parseFloat(display), operator);
    setDisplay(format(result));
    setAccumulator(null);
    setOperator(null);
    setWaiting(true);
  };

  useEffect(() => {
    if (!open) return;
    const handleKey = (e: KeyboardEvent) => {
      if (/^[0-9]$/.test(e.key)) {
        pressDigit(e.key);
      } else if (e.key === '.' || e.key === ',') {
        pressDot();
      } else if (e.key === '+' || e.key === '-' || e.key === '*' || e.key === '/') {
        if (e.key === '/') e.preventDefault();
        pressOperator(e.key);
      } else if (e.key === 'Enter' || e.key === '=') {
        e.preventDefault();
        pressEquals();
      } else if (e.key === 'Backspace') {
        pressBackspace();
      } else if (e.key === 'Delete' || e.key.toLowerCase() === 'c') {
        pressClear();
      } else if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  });

  if (!open) return null;

  const keys: KeyDef[] = [
    { label: 'C', action: pressClear, variant: 'action' },
    { label: '±', action: pressSign, variant: 'action' },
    { label: '%', action: pressPercent, variant: 'action' },
    { label: '÷', action: () => pressOperator('/'), variant: 'op' },
    { label: '7', action: () => pressDigit('7') },
    { label: '8', action: () => pressDigit('8') },
    { label: '9', action: () => pressDigit('9') },
    { label: '×', action: () => pressOperator('*'), variant: 'op' },
    { label: '4', action: () => pressDigit('4') },
    { label: '5', action: () => pressDigit('5') },
    { label: '6', action: () => pressDigit('6') },
    { label: '−', action: () => pressOperator('-'), variant: 'op' },
    { label: '1', action: () => pressDigit('1') },
    { label: '2', action: () => pressDigit('2') },
    { label: '3', action: () => pressDigit('3') },
    { label: '+', action: () => pressOperator('+'), variant: 'op' },
    { label: '0', action: () => pressDigit('0'), span: true },
    { label: ',', action: pressDot },
    { label: '=', action: pressEquals, variant: 'equals' },
  ];

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70" onClick={onClose} />
      <div className="relative bg-surface-900 border border-surface-700 rounded-2xl w-full max-w-xs p-4 space-y-3 shadow-2xl">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-white flex items-center gap-2">
            Calculadora
          </h2>
          <button onClick={onClose} className="text-surface-400 hover:text-white">
            <X size={18} />
          </button>
        </div>

        <div className="bg-surface-800 border border-surface-700 rounded-lg px-3 py-3 text-right">
          <p className="text-xs text-surface-500 h-4">
            {accumulator !== null && operator
              ? `${accumulator} ${OPERATOR_LABELS[operator]}`
              : ''}
          </p>
          <p
            className={`text-3xl font-bold truncate ${
              display === 'Error' ? 'text-red-400' : 'text-white'
            }`}
          >
            {display}
          </p>
        </div>

        <div className="grid grid-cols-4 gap-2">
          {keys.map((key) => (
            <button
              key={key.label}
              onClick={key.action}
              className={`${
                key.span ? 'col-span-2' : ''
              } h-12 rounded-lg text-lg font-semibold transition-colors flex items-center justify-center ${
                key.variant === 'op'
                  ? 'bg-surface-700 text-kiosko-500 hover:bg-surface-600'
                  : key.variant === 'action'
                    ? 'bg-surface-800 text-red-400 hover:bg-surface-700'
                    : key.variant === 'equals'
                      ? 'bg-kiosko-600 text-black hover:bg-kiosko-500'
                      : 'bg-surface-800 text-white hover:bg-surface-700'
              }`}
            >
              {key.label}
            </button>
          ))}
        </div>

        <button
          onClick={() => pressBackspace()}
          className="w-full h-10 rounded-lg bg-surface-800 border border-surface-700 text-surface-300 hover:text-white hover:bg-surface-700 flex items-center justify-center text-sm transition-colors"
        >
          <Delete size={16} />
          <span className="ml-2 text-xs">Borrar último</span>
        </button>

        {onUse && (
          <button
            onClick={() => {
              if (!Number.isNaN(parseFloat(display))) onUse(display);
              onClose();
            }}
            className="w-full h-11 rounded-lg bg-green-600 hover:bg-green-500 text-white font-semibold text-sm flex items-center justify-center gap-2 transition-colors"
          >
            Usar resultado
          </button>
        )}
      </div>
    </div>
  );
}
