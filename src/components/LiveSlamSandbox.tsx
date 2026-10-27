import React from 'react';
import {
  MemoryProfileStep,
  MemorySafeguardConfig,
  PgoSimulationResult,
} from '../utils/slamPipelineEngine';

interface LiveSlamSandboxProps {
  safeguards: MemorySafeguardConfig;
  onToggleSafeguard: (key: keyof MemorySafeguardConfig) => void;
  onEnableAllSafeguards: () => void;
  memoryStats: {
    timeline: MemoryProfileStep[];
    leakRateMbPerMin: number;
    peakOptimizedMb: number;
    peakActualMb: number;
  };
  pgoResult: PgoSimulationResult;
  driftNoiseStd: number;
  loopClosureStrength: number;
  onUpdatePgoParams: (drift: number, loopStrength: number) => void;
}

const SAFEGUARD_ITEMS: {
  key: keyof MemorySafeguardConfig;
  title: string;
  apiCall: string;
  impact: string;
}[] = [
  {
    key: 'dlpackZeroCopy',
    title: 'DLPack Zero-Copy GPU Tensor Sharing',
    apiCall: 'th_dlpack.from_dlpack(pcd.point.positions.to_dlpack())',
    impact: 'Eliminates O(N) CPU↔GPU PCIe buffer duplication per frame',
  },
  {
    key: 'torchInferenceMode',
    title: 'PyTorch Autograd Graph Disabler',
    apiCall: '@torch.inference_mode() + desc.detach().contiguous()',
    impact: 'Prevents intermediate MLP activation graphs from leaking in VRAM',
  },
  {
    key: 'boundedKeyframeRingBuffer',
    title: 'Bounded Sliding-Window Keyframe Deque',
    apiCall: 'collections.deque(maxlen=16) + release_heavy_buffers()',
    impact: 'Bounds active point-cloud memory to O(W · V) instead of unbounded O(T · V)',
  },
  {
    key: 'preallocatedKdTreeBuffer',
    title: 'Persistent Target NNS Hybrid Index',
    apiCall: 'o3d.core.nns.NearestNeighborSearch(target_pos).hybrid_index()',
    impact: 'Builds spatial index once per keyframe instead of inside each ICP iteration',
  },
  {
    key: 'sparseCholeskyPgo',
    title: 'Sparse Block-Cholesky Levenberg-Marquardt PGO',
    apiCall: 'o3d.pipelines.registration.GlobalOptimizationLevenbergMarquardt()',
    impact: 'Avoids dense (6K × 6K) Hessian allocation during global loop closure',
  },
];

export const LiveSlamSandbox: React.FC<LiveSlamSandboxProps> = ({
  safeguards,
  onToggleSafeguard,
  onEnableAllSafeguards,
  memoryStats,
  pgoResult,
  driftNoiseStd,
  loopClosureStrength,
  onUpdatePgoParams,
}) => {
  const allSafeguardsEnabled = Object.values(safeguards).every(Boolean);
  const sampleFrames = memoryStats.timeline.filter(
    (_, idx) => idx === 0 || (idx + 1) % 10 === 0
  );

  // Transform trajectory coordinates (-14..14m, -10..10m) into SVG viewport (520x300)
  const toSvgCoord = (x: number, y: number): [number, number] => {
    const svgX = 260 + x * 16.5;
    const svgY = 150 - y * 14.5;
    return [Number(svgX.toFixed(1)), Number(svgY.toFixed(1))];
  };

  const buildPolyline = (poses: { x: number; y: number }[]) =>
    poses.map((p) => toSvgCoord(p.x, p.y).join(',')).join(' ');

  return (
    <div className="space-y-12">
      {/* SECTION 2: Interactive Memory Leak & DLPack Zero-Copy Profiler */}
      <section id="memory-profiler" className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-slate-200 pb-4">
          <div>
            <p className="text-xs font-medium text-slate-500">
              VRAM / Host Heap Allocation Audit · 60-Keyframe Continuous Stream
            </p>
            <h2 className="text-2xl font-bold text-slate-900 mt-1">
              02. Memory-Leak Prevention Controls &amp; DLPack Telemetry
            </h2>
          </div>

          <button
            type="button"
            onClick={onEnableAllSafeguards}
            disabled={allSafeguardsEnabled}
            className={`px-4 py-2 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap shrink-0 ${
              allSafeguardsEnabled
                ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                : 'bg-blue-600 text-white hover:bg-blue-700 cursor-pointer'
            }`}
          >
            Enable All 5 Memory Safeguards
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left 5 Columns: Safeguard Checkboxes */}
          <div className="lg:col-span-5 bg-white border border-slate-200 rounded-xl p-6 space-y-4">
            <h3 className="text-base font-semibold text-slate-900">
              Active Memory-Leak Safeguards
            </h3>
            <div className="divide-y divide-slate-100">
              {SAFEGUARD_ITEMS.map((item) => {
                const checked = safeguards[item.key];
                return (
                  <div key={item.key} className="py-3 first:pt-0 last:pb-0">
                    <label className="flex items-start gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => onToggleSafeguard(item.key)}
                        className="mt-1 h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                      />
                      <div className="space-y-1">
                        <span className="block text-sm font-semibold text-slate-900">
                          {item.title}
                        </span>
                        <code className="block text-xs font-mono text-blue-700 bg-blue-50/70 px-2 py-0.5 rounded">
                          {item.apiCall}
                        </code>
                        <span className="block text-xs text-slate-500">{item.impact}</span>
                      </div>
                    </label>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right 7 Columns: Memory Allocation Trajectory & Leak Rate */}
          <div className="lg:col-span-7 bg-white border border-slate-200 rounded-xl p-6 space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pb-4 border-b border-slate-100">
              <div>
                <p className="text-xs text-slate-500">Steady-State Leak Rate</p>
                <p
                  className={`text-xl font-bold font-mono tabular-nums mt-1 ${
                    memoryStats.leakRateMbPerMin === 0 ? 'text-emerald-700' : 'text-rose-600'
                  }`}
                >
                  {memoryStats.leakRateMbPerMin.toFixed(2)} MB/min
                </p>
                <p className="text-xs text-slate-500 mt-0.5">
                  {memoryStats.leakRateMbPerMin === 0
                    ? 'Status: Bounded O(1) Window'
                    : 'Warning: Unbounded Growth'}
                </p>
              </div>
              <div>
                <p className="text-xs text-slate-500">Zero-Copy Steady VRAM</p>
                <p className="text-xl font-bold font-mono tabular-nums text-slate-900 mt-1">
                  {memoryStats.peakOptimizedMb.toFixed(2)} MB
                </p>
                <p className="text-xs text-slate-500 mt-0.5">Capped at 15 active keyframes</p>
              </div>
              <div>
                <p className="text-xs text-slate-500">Current Config Frame #60</p>
                <p
                  className={`text-xl font-bold font-mono tabular-nums mt-1 ${
                    memoryStats.peakActualMb <= memoryStats.peakOptimizedMb * 1.05
                      ? 'text-slate-900'
                      : 'text-amber-700'
                  }`}
                >
                  {memoryStats.peakActualMb.toFixed(2)} MB
                </p>
                <p className="text-xs text-slate-500 mt-0.5">
                  DLPack saved:{' '}
                  {memoryStats.timeline[memoryStats.timeline.length - 1]?.dlpackCopySavedMb.toFixed(
                    0
                  )}{' '}
                  MB copies
                </p>
              </div>
            </div>

            {/* Tabular Frame-by-Frame Memory Audit */}
            <div>
              <h4 className="text-xs font-semibold text-slate-900 mb-3">
                VRAM Footprint Progression Across Keyframes (Tabular Audit)
              </h4>
              <div className="overflow-x-auto border border-slate-200 rounded-lg">
                <table className="w-full text-left border-collapse text-xs font-mono tabular-nums">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-sans">
                      <th className="py-2 px-3 font-semibold">Keyframe #</th>
                      <th className="py-2 px-3 font-semibold text-right">
                        Official Zero-Copy Bounded (MB)
                      </th>
                      <th className="py-2 px-3 font-semibold text-right">
                        Current Safeguard Config (MB)
                      </th>
                      <th className="py-2 px-3 font-semibold text-right">
                        Cumulative DLPack Saved (MB)
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {sampleFrames.map((step) => {
                      const delta = step.naiveLeakingVramMb - step.optimizedVramMb;
                      return (
                        <tr key={step.frameIndex} className="hover:bg-slate-50">
                          <td className="py-2 px-3 text-slate-900">Frame #{step.frameIndex}</td>
                          <td className="py-2 px-3 text-right text-emerald-700 font-medium">
                            {step.optimizedVramMb.toFixed(2)} MB
                          </td>
                          <td
                            className={`py-2 px-3 text-right font-semibold ${
                              delta > 1 ? 'text-rose-600' : 'text-slate-900'
                            }`}
                          >
                            {step.naiveLeakingVramMb.toFixed(2)} MB
                          </td>
                          <td className="py-2 px-3 text-right text-blue-600">
                            {step.dlpackCopySavedMb.toFixed(1)} MB
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 3: Interactive Pose Graph Optimization (PGO) & Loop Closure Sandbox */}
      <section id="pgo-sandbox" className="space-y-6">
        <div className="border-b border-slate-200 pb-4">
          <p className="text-xs font-medium text-slate-500">
            Sub-Module 03 Verification · Levenberg-Marquardt Sparse Pose Graph Optimization
          </p>
          <h2 className="text-2xl font-bold text-slate-900 mt-1">
            03. Interactive SE(3) Pose Graph Loop-Closure &amp; Residual Convergence
          </h2>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Trajectory Canvas + Controls */}
          <div className="lg:col-span-7 bg-white border border-slate-200 rounded-xl p-6 space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <h3 className="text-base font-semibold text-slate-900">
                  Warehouse Loop Trajectory (24 Keyframes)
                </h3>
                <p className="text-xs text-slate-500">
                  Compares drifted frame-to-frame ICP odometry against Global Pose Graph Optimization
                </p>
              </div>
              <div className="flex items-center gap-4 text-xs text-slate-600">
                <span>Solid Slate: Ground Truth</span>
                <span>·</span>
                <span className="text-rose-600 font-medium">Dashed Coral: Raw Odometry</span>
                <span>·</span>
                <span className="text-blue-600 font-semibold">Solid Blue: PGO Optimized</span>
              </div>
            </div>

            <div className="bg-slate-950 rounded-lg p-4 border border-slate-800">
              <svg
                viewBox="0 0 520 300"
                className="w-full h-64 overflow-visible"
                role="img"
                aria-label="SLAM Trajectory Pose Graph Optimization Plot"
              >
                {/* Subtle Coordinate Grid */}
                <line x1="20" y1="150" x2="500" y2="150" stroke="#1e293b" strokeWidth="1" />
                <line x1="260" y1="20" x2="260" y2="280" stroke="#1e293b" strokeWidth="1" />

                {/* Ground Truth Path */}
                <polyline
                  fill="none"
                  stroke="#64748b"
                  strokeWidth="2"
                  points={buildPolyline(pgoResult.groundTruth)}
                />

                {/* Noisy Raw Odometry Path */}
                <polyline
                  fill="none"
                  stroke="#f43f5e"
                  strokeWidth="2"
                  strokeDasharray="5,4"
                  points={buildPolyline(pgoResult.noisyOdometry)}
                />

                {/* Pose Graph Optimized Path */}
                <polyline
                  fill="none"
                  stroke="#38bdf8"
                  strokeWidth="2.5"
                  points={buildPolyline(pgoResult.optimizedPoses)}
                />

                {/* Keyframe Node Markers on Optimized Path */}
                {pgoResult.optimizedPoses.map((pose, idx) => {
                  const [cx, cy] = toSvgCoord(pose.x, pose.y);
                  return (
                    <circle
                      key={pose.id}
                      cx={cx}
                      cy={cy}
                      r={idx === 0 ? 4.5 : 2.5}
                      fill={idx === 0 ? '#10b981' : '#38bdf8'}
                    />
                  );
                })}

                {/* Loop Closure Constraint Edge between Drifted End Node and Start Node #0 */}
                {pgoResult.noisyOdometry.length > 1 && (
                  <line
                    x1={toSvgCoord(pgoResult.groundTruth[0].x, pgoResult.groundTruth[0].y)[0]}
                    y1={toSvgCoord(pgoResult.groundTruth[0].x, pgoResult.groundTruth[0].y)[1]}
                    x2={
                      toSvgCoord(
                        pgoResult.noisyOdometry[pgoResult.noisyOdometry.length - 1].x,
                        pgoResult.noisyOdometry[pgoResult.noisyOdometry.length - 1].y
                      )[0]
                    }
                    y2={
                      toSvgCoord(
                        pgoResult.noisyOdometry[pgoResult.noisyOdometry.length - 1].x,
                        pgoResult.noisyOdometry[pgoResult.noisyOdometry.length - 1].y
                      )[1]
                    }
                    stroke="#10b981"
                    strokeWidth="2"
                    strokeDasharray="3,3"
                  />
                )}
              </svg>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-2">
              <div>
                <div className="flex justify-between text-xs font-medium text-slate-700 mb-1">
                  <label htmlFor="pgo-drift-slider">Odometry Drift Noise (σ_odom)</label>
                  <span className="font-mono tabular-nums text-slate-900">
                    {driftNoiseStd.toFixed(2)} m/step
                  </span>
                </div>
                <input
                  id="pgo-drift-slider"
                  type="range"
                  min={0.02}
                  max={0.2}
                  step={0.02}
                  value={driftNoiseStd}
                  onChange={(e) => onUpdatePgoParams(Number(e.target.value), loopClosureStrength)}
                  className="w-full accent-blue-600 cursor-pointer"
                />
              </div>

              <div>
                <div className="flex justify-between text-xs font-medium text-slate-700 mb-1">
                  <label htmlFor="pgo-loop-slider">Loop-Closure Information Weight</label>
                  <span className="font-mono tabular-nums text-slate-900">
                    {(loopClosureStrength * 100).toFixed(0)}%
                  </span>
                </div>
                <input
                  id="pgo-loop-slider"
                  type="range"
                  min={0.4}
                  max={0.95}
                  step={0.05}
                  value={loopClosureStrength}
                  onChange={(e) => onUpdatePgoParams(driftNoiseStd, Number(e.target.value))}
                  className="w-full accent-blue-600 cursor-pointer"
                />
              </div>
            </div>
          </div>

          {/* Right 5 Columns: ATE RMSE & Gauss-Newton / LM Iteration Convergence Table */}
          <div className="lg:col-span-5 bg-white border border-slate-200 rounded-xl p-6 space-y-5">
            <h3 className="text-base font-semibold text-slate-900">
              Absolute Trajectory Error (ATE RMSE) &amp; LM Convergence
            </h3>

            <div className="grid grid-cols-3 gap-3 py-3 border-y border-slate-100">
              <div>
                <p className="text-xs text-slate-500">Unoptimized ATE</p>
                <p className="text-lg font-bold font-mono tabular-nums text-rose-600 mt-0.5">
                  {pgoResult.ateBeforeMeters.toFixed(3)} m
                </p>
              </div>
              <div>
                <p className="text-xs text-slate-500">Post-PGO ATE</p>
                <p className="text-lg font-bold font-mono tabular-nums text-emerald-700 mt-0.5">
                  {pgoResult.ateAfterMeters.toFixed(3)} m
                </p>
              </div>
              <div>
                <p className="text-xs text-slate-500">Drift Reduction</p>
                <p className="text-lg font-bold font-mono tabular-nums text-blue-600 mt-0.5">
                  -{pgoResult.errorReductionPct.toFixed(1)}%
                </p>
              </div>
            </div>

            <div>
              <h4 className="text-xs font-semibold text-slate-900 mb-2.5">
                Levenberg-Marquardt Sparse Cholesky Iteration Log
              </h4>
              <div className="overflow-x-auto border border-slate-200 rounded-lg">
                <table className="w-full text-left border-collapse text-xs font-mono tabular-nums">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-sans">
                      <th className="py-2 px-3 font-semibold">LM Step</th>
                      <th className="py-2 px-3 font-semibold text-right">Pose Graph Cost F(x)</th>
                      <th className="py-2 px-3 font-semibold text-right">||J^T · r||_∞</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {pgoResult.iterationResiduals.map((row) => (
                      <tr key={row.iteration} className="hover:bg-slate-50">
                        <td className="py-2 px-3 text-slate-900">Iter #{row.iteration}</td>
                        <td className="py-2 px-3 text-right text-slate-800">
                          {row.cost.toFixed(4)}
                        </td>
                        <td className="py-2 px-3 text-right text-emerald-700">
                          {row.maxGradNorm.toFixed(5)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
