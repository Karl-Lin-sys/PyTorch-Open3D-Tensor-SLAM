import React, { useState } from 'react';
import { OFFICIAL_PYTHON_SLAM_CODE } from '../utils/slamPipelineEngine';

interface PythonCodeViewerProps {
  onDownloadCode: () => void;
}

export const PythonCodeViewer: React.FC<PythonCodeViewerProps> = ({ onDownloadCode }) => {
  const [copied, setCopied] = useState(false);
  const [filterSection, setFilterSection] = useState<'all' | 's1' | 's2' | 's3'>('all');

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(OFFICIAL_PYTHON_SLAM_CODE);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const getFilteredCode = () => {
    if (filterSection === 'all') return OFFICIAL_PYTHON_SLAM_CODE;
    const markers = {
      s1: '# SUB-MODULE 1:',
      s2: '# SUB-MODULE 2:',
      s3: '# SUB-MODULE 3:',
    };
    const lines = OFFICIAL_PYTHON_SLAM_CODE.split('\n');
    const startIdx = lines.findIndex((l) => l.includes(markers[filterSection]));
    if (startIdx === -1) return OFFICIAL_PYTHON_SLAM_CODE;
    const sliceStart = Math.max(0, startIdx - 1);
    const nextMarker =
      filterSection === 's1'
        ? markers.s2
        : filterSection === 's2'
        ? markers.s3
        : 'END_OF_FILE_MARKER';
    const endIdx = lines.findIndex((l, idx) => idx > startIdx && l.includes(nextMarker));
    return lines.slice(sliceStart, endIdx === -1 ? undefined : endIdx - 1).join('\n');
  };

  return (
    <section id="python-reference" className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <p className="text-xs font-medium text-slate-500">
            Production Implementation · slam_pipeline_o3d_torch.py · Apache-2.0
          </p>
          <h2 className="text-2xl font-bold text-slate-900 mt-1">
            04. Official PyTorch 2.x &amp; Open3D 0.18+ Tensor SLAM Reference Code
          </h2>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 p-1 bg-slate-200/80 rounded-lg">
            {[
              { id: 'all', label: 'Full Pipeline' },
              { id: 's1', label: '01. Feature Extractor' },
              { id: 's2', label: '02. Data Association' },
              { id: 's3', label: '03. Pose Graph SLAM' },
            ].map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setFilterSection(item.id as 'all' | 's1' | 's2' | 's3')}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  filterSection === item.id
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={handleCopy}
            className="px-3.5 py-2 text-xs font-semibold text-slate-800 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            {copied ? 'Copied to Clipboard' : 'Copy Code'}
          </button>

          <button
            type="button"
            onClick={onDownloadCode}
            className="px-3.5 py-2 text-xs font-semibold text-white bg-slate-900 rounded-lg hover:bg-slate-800 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            Download .py
          </button>
        </div>
      </div>

      <div className="bg-slate-950 border border-slate-800 rounded-xl overflow-hidden">
        <div className="flex items-center justify-between px-4 py-2.5 bg-slate-900 border-b border-slate-800 text-xs text-slate-400 font-mono">
          <span>slam_pipeline_o3d_torch.py</span>
          <span>open3d.t.geometry · open3d.core.nns · torch.utils.dlpack</span>
        </div>
        <pre className="p-5 text-xs font-mono text-slate-200 overflow-x-auto leading-relaxed max-h-[540px]">
          <code>{getFilteredCode()}</code>
        </pre>
      </div>
    </section>
  );
};
