# Financial Profile Components Showcase

## Component Previews and Usage Examples

This document provides visual descriptions and usage examples for all financial profile components.

---

## 1. PaymentMethodsSection

### Visual Description
A clean, card-based component with:
- **Blue accent color** for unconnected state
- **Emerald green** for connected state
- Credit card icon in rounded square
- Info icon with tooltip for security information
- Large action button at bottom

### States

#### Unconnected State
```
┌─────────────────────────────────────────┐
│ 💳 Métodos de Pago        ⓘ      🔵   │
│    Configura tus pagos                  │
│                                         │
│ ┌─────────────────────────────────────┐ │
│ │ Configura pagos rápidos para una   │ │
│ │ mejor experiencia                   │ │
│ │                                     │ │
│ │ Esto es OPCIONAL y tus datos       │ │
│ │ están protegidos por Mercado Pago  │ │
│ └─────────────────────────────────────┘ │
│                                         │
│ ┌───────────────────────────────────┐   │
│ │ 💳 Configurar pagos rápidos con  │   │
│ │    Mercado Pago                   │   │
│ └───────────────────────────────────┘   │
└─────────────────────────────────────────┘
```

#### Connected State
```
┌─────────────────────────────────────────┐
│ 💳 Métodos de Pago        ⓘ      ✓    │
│    Configurado                          │
│                                         │
│ ┌─────────────────────────────────────┐ │
│ │ ✓ Pagos rápidos activados          │ │
│ │   Tus datos están protegidos por   │ │
│ │   Mercado Pago                     │ │
│ └─────────────────────────────────────┘ │
└─────────────────────────────────────────┘
```

### Usage
```tsx
<PaymentMethodsSection 
  isMercadoPagoConnected={mpConnected}
  onConfigurePayments={() => handleMPSetup()}
/>
```

### Props
- `isMercadoPagoConnected: boolean` - Connection status
- `onConfigurePayments?: () => void` - Callback for setup

---

## 2. CollectionsCenterSection

### Visual Description
- **Amber warning colors** when not connected
- **Emerald success colors** when connected
- Briefcase icon for professional context
- Prominent warning message for unlinked accounts
- Integrates WalletBalance component when connected

### States

#### Unconnected State (Professional Warning)
```
┌─────────────────────────────────────────┐
│ 💼 Centro de Cobros       ⓘ            │
│    Vinculación pendiente                │
│                                         │
│ ┌─────────────────────────────────────┐ │
│ │ ⚠️  Vinculación Obligatoria        │ │
│ │                                     │ │
│ │ Vincular Mercado Pago es           │ │
│ │ obligatorio para recibir pagos     │ │
│ │ digitales. Sin esta configuración, │ │
│ │ solo podrás aceptar pagos en       │ │
│ │ efectivo.                           │ │
│ └─────────────────────────────────────┘ │
│                                         │
│ ┌───────────────────────────────────┐   │
│ │ 🔗 Vincular Mercado Pago         │   │
│ └───────────────────────────────────┘   │
└─────────────────────────────────────────┘
```

#### Connected State
```
┌─────────────────────────────────────────┐
│ 💼 Centro de Cobros       ⓘ            │
│    Sistema activo                       │
│                                         │
│ ┌─────────────────────────────────────┐ │
│ │ ✓ Mercado Pago Vinculado           │ │
│ │   Ya puedes recibir pagos          │ │
│ │   digitales de forma segura        │ │
│ └─────────────────────────────────────┘ │
└─────────────────────────────────────────┘

[WalletBalance Component Displayed Below]
```

### Usage
```tsx
<CollectionsCenterSection 
  isMercadoPagoConnected={mpConnected}
  availableBalance={12500}
  cashDebt={800}
  onConnectMercadoPago={() => handleMPLink()}
  onSettleDebt={() => handleDebtSettlement()}
/>
```

---

## 3. WalletBalance

### Visual Description
Beautiful gradient card (indigo to purple) with:
- White text for high contrast
- Wallet icon and title
- Large balance display (3xl font)
- Conditional debt section with amber accents
- Net balance calculation
- White "Liquidar Deuda" button

### With Debt
```
╔═══════════════════════════════════════════╗
║ 🌈 GRADIENT BACKGROUND (Indigo → Purple) ║
║                                           ║
║ 👛 Tu Wallet          ⚠️ Deuda pendiente ║
║                                           ║
║ Saldo Disponible                          ║
║ $12.500,00 ⭐️                            ║
║ Cobrado por servicios en la app           ║
║                                           ║
║ ─────────────────────────────────────────║
║                                           ║
║ 📈 Deuda por Efectivo        $800,00     ║
║ Comisiones pendientes de servicios en    ║
║ efectivo                                  ║
║                                           ║
║ ┌─────────────────────────────────────┐  ║
║ │    Liquidar Deuda              ↗    │  ║
║ └─────────────────────────────────────┘  ║
║                                           ║
║ ─────────────────────────────────────────║
║                                           ║
║ Balance Neto               $11.700,00    ║
║                           (en verde)      ║
╚═══════════════════════════════════════════╝
```

### Without Debt
```
╔═══════════════════════════════════════════╗
║ 🌈 GRADIENT BACKGROUND (Indigo → Purple) ║
║                                           ║
║ 👛 Tu Wallet                              ║
║                                           ║
║ Saldo Disponible                          ║
║ $12.500,00 ⭐️                            ║
║ Cobrado por servicios en la app           ║
╚═══════════════════════════════════════════╝
```

### Usage
```tsx
<WalletBalance 
  availableBalance={12500}
  cashDebt={800}
  currency="ARS"
  onSettleDebt={() => handleSettlement()}
/>
```

---

## 4. TransactionHistory

### Visual Description
Clean list of transaction cards with:
- Indigo accent color for header
- Light slate background for cards
- Calendar icon for dates
- Payment method badges (amber for cash, blue for digital)
- Amount and commission display
- Commission detail section

### With Transactions
```
┌─────────────────────────────────────────┐
│ 📄 Historial de Transacciones          │
│    3 movimientos                        │
├─────────────────────────────────────────┤
│                                         │
│ ┌─────────────────────────────────────┐ │
│ │ 📅 05 feb 2026                      │ │
│ │ Jardinería residencial              │ │
│ │ [💳 Mercado Pago]        $5.000,00 │ │
│ │                          ↓ -$250,00 │ │
│ │ ─────────────────────────────────── │ │
│ │ Comisión aplicada: $250,00          │ │
│ └─────────────────────────────────────┘ │
│                                         │
│ ┌─────────────────────────────────────┐ │
│ │ 📅 03 feb 2026                      │ │
│ │ Poda de árboles                     │ │
│ │ [💵 Efectivo]            $8.000,00 │ │
│ │                          ↓ -$800,00 │ │
│ │ ─────────────────────────────────── │ │
│ │ Comisión aplicada: $800,00          │ │
│ │ • Pago en efectivo                  │ │
│ └─────────────────────────────────────┘ │
│                                         │
│ ┌─────────────────────────────────────┐ │
│ │ 📅 01 feb 2026                      │ │
│ │ Limpieza de jardín                  │ │
│ │ [💳 Mercado Pago]        $3.500,00 │ │
│ │                          ↓ -$175,00 │ │
│ │ ─────────────────────────────────── │ │
│ │ Comisión aplicada: $175,00          │ │
│ └─────────────────────────────────────┘ │
└─────────────────────────────────────────┘
```

### Empty State
```
┌─────────────────────────────────────────┐
│ 📄 Historial de Transacciones          │
│    Tus movimientos financieros          │
├─────────────────────────────────────────┤
│                                         │
│           ┌───────────┐                 │
│           │    📄    │                 │
│           └───────────┘                 │
│                                         │
│    No hay transacciones registradas     │
│                                         │
└─────────────────────────────────────────┘
```

### Usage
```tsx
<TransactionHistory 
  transactions={mockTransactions}
  currency="ARS"
  emptyMessage="No hay transacciones"
/>
```

### Transaction Type
```typescript
interface Transaction {
  id: string;
  date: string;                 // ISO 8601
  serviceName: string;
  paymentMethod: 'CASH' | 'MERCADOPAGO' | 'DIGITAL';
  amount: number;
  commission: number;
  status?: 'COMPLETED' | 'PENDING' | 'FAILED';
}
```

---

## 5. CashPaymentConfirmationModal

### Visual Description
Large modal with:
- **Amber warning theme** throughout
- Large warning icon at top
- Detailed payment breakdown section
- Blue info box about digital payments
- Two-button action bar (Cancel + Confirm)

### Modal Layout
```
╔═══════════════════════════════════════════╗
║                    ✕                      ║
║                                           ║
║           ┌───────────┐                   ║
║           │    ⚠️     │                   ║
║           └───────────┘                   ║
║                                           ║
║      Confirmar Pago en Efectivo          ║
║                                           ║
║ Al marcar este servicio como pagado en   ║
║ efectivo, se generará una comisión en    ║
║ tu balance.                               ║
║                                           ║
║ ┌─────────────────────────────────────┐  ║
║ │ 💵 DESGLOSE DE PAGO                │  ║
║ │                                     │  ║
║ │ Servicio:    Servicio de jardinería│  ║
║ │ Monto total:            $8.000,00  │  ║
║ │ ─────────────────────────────────  │  ║
║ │ ↘ Comisión (10%):        -$800,00 │  ║
║ │ Esta comisión quedará registrada   │  ║
║ │ como deuda en tu balance           │  ║
║ │ ─────────────────────────────────  │  ║
║ │ Recibirás:              $7.200,00  │  ║
║ │                        (en verde)   │  ║
║ └─────────────────────────────────────┘  ║
║                                           ║
║ ┌─────────────────────────────────────┐  ║
║ │ ℹ️ Nota: Los pagos digitales a     │  ║
║ │ través de Mercado Pago tienen      │  ║
║ │ comisiones más bajas y se          │  ║
║ │ acreditan automáticamente.         │  ║
║ └─────────────────────────────────────┘  ║
║                                           ║
║ ┌──────────┐       ┌──────────────────┐  ║
║ │ Cancelar │       │    Confirmar     │  ║
║ └──────────┘       └──────────────────┘  ║
╚═══════════════════════════════════════════╝
```

### Usage
```tsx
<CashPaymentConfirmationModal 
  isOpen={showModal}
  onClose={() => setShowModal(false)}
  onConfirm={() => handleConfirm()}
  serviceName="Servicio de jardinería"
  amount={8000}
  commissionAmount={800}
  commissionPercentage={10}
  currency="ARS"
/>
```

---

## Color System Reference

### Primary Colors
- **Indigo**: `bg-indigo-600`, `text-indigo-600`
- **Purple**: `bg-purple-700` (gradients)
- **Blue**: `bg-blue-600`, `text-blue-700`

### Status Colors
- **Success/Connected**: `bg-emerald-50/600`, `text-emerald-700/800`
- **Warning/Unlinked**: `bg-amber-50/600`, `text-amber-700/800`
- **Error**: `bg-red-50/600`, `text-red-700`

### Neutral Colors
- **Background**: `bg-slate-50/100`
- **Text Primary**: `text-slate-900`
- **Text Secondary**: `text-slate-600`
- **Text Tertiary**: `text-slate-500`
- **Borders**: `border-slate-200`

### Special Effects
- **Gradient Wallet**: `from-indigo-600 to-purple-700`
- **Shadows**: `shadow-sm`, `shadow-lg`, `shadow-indigo-100`

---

## Icon Usage

### From Lucide React

| Component | Icons Used |
|-----------|-----------|
| PaymentMethodsSection | `CreditCard`, `ShieldCheck`, `Info`, `CheckCircle`, `AlertCircle` |
| CollectionsCenterSection | `Briefcase`, `LinkIcon`, `AlertCircle`, `ShieldCheck`, `Info` |
| WalletBalance | `Wallet`, `TrendingUp`, `AlertCircle`, `ArrowUpRight` |
| TransactionHistory | `Receipt`, `Calendar`, `Banknote`, `CreditCard`, `TrendingDown` |
| CashPaymentConfirmationModal | `AlertTriangle`, `Banknote`, `TrendingDown`, `X` |

---

## Responsive Behavior

All components are designed mobile-first with:

### Breakpoints
- Mobile: `max-w-md` (448px) - Primary target
- Tablet/Desktop: Centered with max-width constraint

### Touch Targets
- Buttons: Minimum 44x44px (iOS guideline)
- Icon buttons: Minimum 40x40px
- Tap zones: Generous padding around interactive elements

### Typography Scale
- Display: `text-3xl` (30px)
- Heading: `text-xl` (20px), `text-lg` (18px)
- Body: `text-sm` (14px)
- Small: `text-xs` (12px)

---

## Accessibility Features

### ARIA Labels
- Info buttons have descriptive labels
- Status indicators use proper semantic HTML
- Modals trap focus and support keyboard navigation

### Keyboard Support
- Tab navigation through all interactive elements
- Escape to close modals
- Enter to confirm actions

### Visual Indicators
- High contrast colors (WCAG AA compliant)
- Multiple indicators (icon + color + text)
- Clear focus states on all interactive elements

### Screen Reader Support
- Proper heading hierarchy
- Descriptive button text
- Status announcements for state changes

---

## Integration Example

### Complete Profile Page Integration
```tsx
export default function ProfilePage() {
  const { user } = useAuth();
  const isClient = user.activeRole === 'CLIENT';
  const isProvider = user.activeRole === 'PROVIDER';
  const mpConnected = !!user.mercadopagoCustomerId;

  return (
    <div className="max-w-md mx-auto p-6 flex flex-col gap-6">
      {/* User Info Section */}
      <UserProfileSection user={user} />

      {/* Financial Sections Based on Role */}
      {isClient && (
        <PaymentMethodsSection 
          isMercadoPagoConnected={mpConnected}
          onConfigurePayments={handleConfigurePayments}
        />
      )}

      {isProvider && (
        <>
          <CollectionsCenterSection 
            isMercadoPagoConnected={mpConnected}
            availableBalance={user.balance || 0}
            cashDebt={calculateCashDebt()}
            onConnectMercadoPago={handleConnectMP}
            onSettleDebt={handleSettleDebt}
          />

          <TransactionHistory 
            transactions={transactions}
            currency="ARS"
          />
        </>
      )}
    </div>
  );
}
```

---

## Performance Considerations

### Optimizations Implemented
- Conditional rendering based on role
- Lazy state initialization
- Efficient re-render prevention with proper component structure
- No unnecessary useEffect hooks

### Future Optimizations
- Virtualized transaction list for long histories
- Transaction pagination
- Optimistic UI updates
- Caching of transaction data

---

## Browser Support

Tested and compatible with:
- ✅ Chrome/Edge 90+
- ✅ Firefox 88+
- ✅ Safari 14+
- ✅ Mobile Safari (iOS 14+)
- ✅ Chrome Mobile (Android 10+)

---

## Summary

All financial profile components are:
- ✅ Fully responsive and mobile-optimized
- ✅ Accessible (WCAG AA compliant)
- ✅ Consistent with design system
- ✅ Type-safe with TypeScript
- ✅ Well-documented
- ✅ Production-ready

Ready for immediate use with minimal backend integration needed!
