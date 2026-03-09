'use client';
import { formTemplates } from '@/data/mock';

export default function FormsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="flex-1" />
        <button className="px-4 py-2 bg-brand-700 text-white text-sm font-medium rounded-lg hover:bg-brand-600">+ Create New Form</button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {formTemplates.map(form => (
          <div key={form.id} className="bg-white rounded-xl p-4 shadow-sm border border-ink-100 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-bold text-ink-800">{form.name}</h3>
              <span className={`px-2 py-0.5 text-[10px] font-bold rounded ${form.status === 'Active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>{form.status}</span>
            </div>
            <div className="space-y-1 text-xs text-ink-500 mb-3">
              <div>{form.fields} fields</div>
              <div>{form.submissions} submissions</div>
              {form.hasPayment && <div className="text-green-600 font-medium">💳 Payment: {form.price}</div>}
            </div>
            <div className="flex gap-2">
              <button className="flex-1 px-2 py-1.5 text-xs bg-brand-50 text-brand-700 rounded hover:bg-brand-100">Edit</button>
              <button className="flex-1 px-2 py-1.5 text-xs bg-ink-50 text-ink-600 rounded hover:bg-ink-100">View Submissions</button>
            </div>
          </div>
        ))}
      </div>

      {/* Form builder preview */}
      <div className="bg-white rounded-xl p-5 shadow-sm border border-ink-100">
        <h3 className="text-sm font-bold text-ink-800 mb-4">Form Builder (Drag & Drop)</h3>
        <div className="grid grid-cols-4 gap-4">
          <div className="bg-ink-50 rounded-lg p-3">
            <div className="text-xs font-bold text-ink-500 uppercase tracking-wider mb-2">Available Fields</div>
            <div className="space-y-1">
              {['Text Input', 'Text Area', 'Email', 'Phone', 'Date', 'Dropdown', 'File Upload', 'Checkbox', 'Payment (Stripe)'].map(f => (
                <div key={f} className="px-3 py-2 bg-white rounded border border-ink-200 text-xs text-ink-700 cursor-move hover:bg-brand-50 hover:border-brand-200">
                  {f}
                </div>
              ))}
            </div>
          </div>
          <div className="col-span-3 border-2 border-dashed border-ink-200 rounded-lg p-4 min-h-[300px] flex items-center justify-center text-sm text-ink-400">
            Drag fields here to build your form
          </div>
        </div>
      </div>
    </div>
  );
}
