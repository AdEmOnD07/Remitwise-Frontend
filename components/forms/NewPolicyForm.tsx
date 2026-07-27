import React from 'react';
import { Loader2, Info } from 'lucide-react';

/**
 * New Policy form for creating an insurance policy.
 * Currently all fields are disabled — the form is in "pre-integration" state.
 * Once the USDC smart contract backend is connected, remove the `disabled`
 * attributes and wire to the actual contract methods.
 *
 * Coverage types: Health, Emergency, Life
 * Inputs: Monthly Premium, Coverage Amount, Next Payment Date
 */
export default function NewPolicyForm({ pending, state, formAction }: {
  pending: boolean;
  state: any;
  formAction: any;
}) {
  return (
    <div className="space-y-6">
      {/* Disabled-state notice */}
      <div className="flex items-start gap-3 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20">
        <Info className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
        <div className="text-sm text-amber-200">
          <p className="font-medium">Pre-integration preview</p>
          <p className="mt-1 text-amber-300/80">
            Policy creation will be available once the on-chain contract integration is live.
            All fields are disabled and displayed for layout reference only.
          </p>
        </div>
      </div>

      <form className="space-y-6" action={formAction}>
        <div className="grid gap-1">
          <label className="block text-sm font-medium text-gray-400">Policy Name</label>
          <input
            type="text"
            name="policyName"
            defaultValue={state?.policyName}
            placeholder="e.g., Health Insurance"
            className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-600 focus:ring-2 focus:ring-brand.red focus:border-transparent disabled:opacity-40 disabled:cursor-not-allowed"
            disabled
          />
        </div>

        <div className="grid gap-1">
          <label className="block text-sm font-medium text-gray-400">Coverage Type</label>
          <select
            name="coverageType"
            defaultValue={state?.coverageType ?? ''}
            className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:ring-2 focus:ring-brand.red focus:border-transparent disabled:opacity-40 disabled:cursor-not-allowed"
            disabled
          >
            <option value="" disabled>Select coverage type</option>
            <option value="Health">Health</option>
            <option value="Emergency">Emergency</option>
            <option value="Life">Life</option>
          </select>
        </div>

        <div className="grid gap-1">
          <label className="block text-sm font-medium text-gray-400">Monthly Premium (USD)</label>
          <div className="relative">
            <span className="absolute left-4 top-3 text-gray-500">$</span>
            <input
              type="number"
              name="monthlyPremium"
              defaultValue={state?.monthlyPremium}
              placeholder="20.00"
              step="0.01"
              min="0"
              className="w-full pl-8 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-600 focus:ring-2 focus:ring-brand.red focus:border-transparent disabled:opacity-40 disabled:cursor-not-allowed"
              disabled
            />
          </div>
        </div>

        <div className="grid gap-1">
          <label className="block text-sm font-medium text-gray-400">Coverage Amount (USD)</label>
          <div className="relative">
            <span className="absolute left-4 top-3 text-gray-500">$</span>
            <input
              type="number"
              name="coverageAmount"
              defaultValue={state?.coverageAmount}
              placeholder="1000.00"
              step="0.01"
              min="0"
              className="w-full pl-8 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-600 focus:ring-2 focus:ring-brand.red focus:border-transparent disabled:opacity-40 disabled:cursor-not-allowed"
              disabled
            />
          </div>
        </div>

        <div className="grid gap-1">
          <label className="block text-sm font-medium text-gray-400">Next Payment Date</label>
          <input
            type="date"
            name="nextPayment"
            defaultValue={state?.nextPayment}
            className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:ring-2 focus:ring-brand.red focus:border-transparent disabled:opacity-40 disabled:cursor-not-allowed"
            disabled
          />
        </div>

        {state?.error && <div className="text-red-400 text-sm">{state.error}</div>}
        {state?.success && <div className="text-green-400 text-sm">{state.success}</div>}

        <button
          type="submit"
          className="w-full bg-brand.red text-white px-6 py-3 rounded-xl font-semibold hover:bg-brand.redHover transition disabled:opacity-50 disabled:cursor-not-allowed"
          disabled
          aria-disabled="true"
        >
          {pending ? (
            <div className="flex items-center justify-center gap-2">
              <Loader2 className="animate-spin w-5 h-5" />
              Adding...
            </div>
          ) : (
            'Create Policy'
          )}
        </button>
      </form>
    </div>
  );
}
