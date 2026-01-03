'use client';

import { createContext, useContext, useReducer, ReactNode } from 'react';

export interface ProductColor {
  id: string;
  color_name: string;
  hex_code: string | null;
}

export interface Accessory {
  id: string;
  name: string;
  description: string | null;
  weekly_rate: string;
  monthly_rate: string;
  deposit_amount: string;
  image_url: string | null;
  colors?: Array<{
    id: string;
    color_name: string;
    hex_code: string | null;
  }>;
}

export interface ProductTemplate {
  id: string;
  category_id: string;
  name: string;
  subtitle: string | null;
  description: string | null;
  weekly_rate: string;
  monthly_rate: string;
  deposit_amount: string;
  image_url: string | null;
  is_popular: boolean;
  is_new: boolean;
  has_accessories: boolean;
  specs: Record<string, unknown> | null;
  colors?: ProductColor[];
  accessories?: Accessory[];
}

export interface SelectedAccessory {
  accessory_id: string;
  selected_color?: string;
  accessory: Accessory;
}

export interface PricingBreakdown {
  product_rate: number;
  accessories_rate: number;
  subtotal: number;
  deposit_total: number;
  student_discount?: number;
  new_equipment_fee?: number;
  final_total: number;
}

export interface WizardState {
  step: number;
  product: ProductTemplate | null;
  selectedColor: string | null;
  accessories: SelectedAccessory[];
  pricingPeriod: 'weekly' | 'monthly';
  startDate: Date | null;
  endDate: Date | null;
  notes: string;
  pricing: PricingBreakdown | null;
  isSubmitting: boolean;
  error: string | null;
}

type WizardAction =
  | { type: 'SET_PRODUCT'; product: ProductTemplate }
  | { type: 'SET_COLOR'; color: string }
  | { type: 'ADD_ACCESSORY'; accessory: Accessory; color?: string }
  | { type: 'REMOVE_ACCESSORY'; accessory_id: string }
  | { type: 'UPDATE_ACCESSORY_COLOR'; accessory_id: string; color: string }
  | { type: 'SET_PRICING_PERIOD'; period: 'weekly' | 'monthly' }
  | { type: 'SET_DATES'; startDate: Date; endDate: Date }
  | { type: 'SET_NOTES'; notes: string }
  | { type: 'SET_PRICING'; pricing: PricingBreakdown }
  | { type: 'NEXT_STEP' }
  | { type: 'PREV_STEP' }
  | { type: 'GO_TO_STEP'; step: number }
  | { type: 'SET_SUBMITTING'; isSubmitting: boolean }
  | { type: 'SET_ERROR'; error: string | null }
  | { type: 'RESET' };

const initialState: WizardState = {
  step: 1,
  product: null,
  selectedColor: null,
  accessories: [],
  pricingPeriod: 'monthly',
  startDate: null,
  endDate: null,
  notes: '',
  pricing: null,
  isSubmitting: false,
  error: null,
};

function wizardReducer(state: WizardState, action: WizardAction): WizardState {
  switch (action.type) {
    case 'SET_PRODUCT':
      return {
        ...state,
        product: action.product,
        selectedColor: action.product.colors?.[0]?.color_name || null,
        accessories: [],
        pricing: null,
      };

    case 'SET_COLOR':
      return {
        ...state,
        selectedColor: action.color,
      };

    case 'ADD_ACCESSORY':
      if (state.accessories.find((a) => a.accessory_id === action.accessory.id)) {
        return state;
      }
      return {
        ...state,
        accessories: [
          ...state.accessories,
          {
            accessory_id: action.accessory.id,
            selected_color: action.color,
            accessory: action.accessory,
          },
        ],
        pricing: null,
      };

    case 'REMOVE_ACCESSORY':
      return {
        ...state,
        accessories: state.accessories.filter((a) => a.accessory_id !== action.accessory_id),
        pricing: null,
      };

    case 'UPDATE_ACCESSORY_COLOR':
      return {
        ...state,
        accessories: state.accessories.map((a) =>
          a.accessory_id === action.accessory_id
            ? { ...a, selected_color: action.color }
            : a
        ),
      };

    case 'SET_PRICING_PERIOD':
      return {
        ...state,
        pricingPeriod: action.period,
        pricing: null,
      };

    case 'SET_DATES':
      return {
        ...state,
        startDate: action.startDate,
        endDate: action.endDate,
        pricing: null,
      };

    case 'SET_NOTES':
      return {
        ...state,
        notes: action.notes,
      };

    case 'SET_PRICING':
      return {
        ...state,
        pricing: action.pricing,
      };

    case 'NEXT_STEP':
      return {
        ...state,
        step: Math.min(state.step + 1, 5),
      };

    case 'PREV_STEP':
      return {
        ...state,
        step: Math.max(state.step - 1, 1),
      };

    case 'GO_TO_STEP':
      return {
        ...state,
        step: action.step,
      };

    case 'SET_SUBMITTING':
      return {
        ...state,
        isSubmitting: action.isSubmitting,
      };

    case 'SET_ERROR':
      return {
        ...state,
        error: action.error,
      };

    case 'RESET':
      return initialState;

    default:
      return state;
  }
}

interface WizardContextType {
  state: WizardState;
  dispatch: React.Dispatch<WizardAction>;
  canProceed: () => boolean;
}

const WizardContext = createContext<WizardContextType | null>(null);

export function WizardProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(wizardReducer, initialState);

  const canProceed = () => {
    switch (state.step) {
      case 1:
        return state.product !== null;
      case 2:
        return state.selectedColor !== null || (state.product?.colors?.length ?? 0) === 0;
      case 3:
        return true; // Accessories are optional
      case 4:
        return state.startDate !== null && state.endDate !== null;
      case 5:
        return state.pricing !== null;
      default:
        return false;
    }
  };

  return (
    <WizardContext.Provider value={{ state, dispatch, canProceed }}>
      {children}
    </WizardContext.Provider>
  );
}

export function useWizard() {
  const context = useContext(WizardContext);
  if (!context) {
    throw new Error('useWizard must be used within a WizardProvider');
  }
  return context;
}
