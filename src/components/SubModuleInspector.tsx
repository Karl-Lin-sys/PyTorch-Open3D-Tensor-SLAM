import React from 'react';
import {
  ComplexityMetrics,
  SlamSubModuleId,
  SlamWorkloadParams,
} from '../utils/slamPipelineEngine';

interface SubModuleInspectorProps {
  params: SlamWorkloadParams;
  onUpdateParam: (key: keyof SlamWorkloadParams, value: number) => void;
  onResetParams: () => void;
  activeModule: SlamSubModuleId;
  onSelectModule: (id: SlamSubModuleId) => void;
  metricsMap: Record<SlamSubModuleId, ComplexityMetrics>;
}

const MODULE_ORDER: { id: SlamSubModuleId; label: string; shortApi: string }[] = [
  {
    id: 'feature_extraction',
    label: '01. Feature Extraction',
    shortApi: 'o3d.t.geometry.PointCloud · torch.utils.dlpack',
  },
  {
    id: 'data_association',
    label: '02. Data Association',
    shortApi: 'o3d.core.nns.NearestNeighborSearch · PointToPlane ICP',
  },
  {
    id: 'pose_graph_optimization',
    label: '03. Pose Graph Optimization',
    shortApi: 'GlobalOptimizationLevenbergMarquardt · Sparse Cholesky',
  },
];

export const SubModuleInspector: React.FC<SubModuleInspectorProps> = ({
  params,
  onUpdateParam,
  onResetParams,
  activeModule,
  onSelectModule,
  metricsMap,
}) => {
  const activeMetrics = metricsMap[activeModule];

  return (
    <section id="submodules" className="space-y-8">
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <p className="text-xs font-medium text-slate-500">
            Sub-Module Complexity &amp; Official API Architecture · Open3D 0.18+ Tensor &amp; PyTorch 2.x
          </p>
          <h2 className="text-2xl font-bold text-slate-900 mt-1">
            01. Asymptotic Big-O Complexity &amp; Zero-Copy Sub-Module Analysis
          </h2>
        </div>

        <div
          role="tablist"
          aria-label="SLAM Sub-Modules"
          className="flex items-center gap-1 p-1 bg-slate-200/80 rounded-lg self-start"
        >
          {MODULE_ORDER.map((tab) => {
            const isSelected = activeModule === tab.id;
            return (
              <button
                key={tab.id}
                role="tab"
                aria-selected={isSelected}
                onClick={() => onSelectModule(tab.id)}
                className={`px-3.5 py-2 text-xs font-semibold rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  isSelected
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        <div className="lg:col-span-4 bg-white border border-slate-200 rounded-xl p-6 space-y-5">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-base font-semibold text-slate-900">
                Sensor &amp; Graph Scale Parameters
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Adjust variables to evaluate asymptotic scaling
              </p>
            </div>
            <button
              type="button"
              onClick={onResetParams}
              className="px-2.5 py-1 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              Reset Defaults
            </button>
          </div>

          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-xs font-medium text-slate-700 mb-1">
                <label htmlFor="param-raw-points">Raw LiDAR + RGB-D Points (N)</label>
                <span className="font-mono tabular-nums text-slate-900">
                  {params.rawPointCount.toLocaleString()} pts
                </span>
              </div>
              <input
                id="param-raw-points"
                type="range"
                min={20000}
                max={300000}
                step={10000}
                value={params.rawPointCount}
                onChange={(e) => onUpdateParam('rawPointCount', Number(e.target.value))}
                className="w-full accent-blue-600 cursor-pointer"
              />
            </div>

            <div>
              <div className="flex justify-between text-xs font-medium text-slate-700 mb-1">
                <label htmlFor="param-voxels">Spatial-Hash Downsampled Voxels (V)</label>
                <span className="font-mono tabular-nums text-slate-900">
                  {params.downsampledVoxelCount.toLocaleString()} voxels
                </span>
              </div>
              <input
                id="param-voxels"
                type="range"
                min={2000}
                max={50000}
                step={1000}
                value={params.downsampledVoxelCount}
                onChange={(e) => onUpdateParam('downsampledVoxelCount', Number(e.target.value))}
                className="w-full accent-blue-600 cursor-pointer"
              />
            </div>

            <div>
              <div className="flex justify-between text-xs font-medium text-slate-700 mb-1">
                <label htmlFor="param-desc-dim">PyTorch Feature Descriptor Dim (D)</label>
                <span className="font-mono tabular-nums text-slate-900">
                  {params.descriptorDim} dims
                </span>
              </div>
              <input
                id="param-desc-dim"
                type="range"
                min={16}
                max={128}
                step={16}
                value={params.descriptorDim}
                onChange={(e) => onUpdateParam('descriptorDim', Number(e.target.value))}
                className="w-full accent-blue-600 cursor-pointer"
              />
            </div>

            <div>
              <div className="flex justify-between text-xs font-medium text-slate-700 mb-1">
                <label htmlFor="param-icp-iter">Point-to-Plane ICP Iterations (I)</label>
                <span className="font-mono tabular-nums text-slate-900">
                  {params.icpIterations} iters
                </span>
              </div>
              <input
                id="param-icp-iter"
                type="range"
                min={5}
                max={40}
                step={5}
                value={params.icpIterations}
                onChange={(e) => onUpdateParam('icpIterations', Number(e.target.value))}
                className="w-full accent-blue-600 cursor-pointer"
              />
            </div>

            <div>
              <div className="flex justify-between text-xs font-medium text-slate-700 mb-1">
                <label htmlFor="param-kf-nodes">Pose Graph Keyframe Nodes (K)</label>
                <span className="font-mono tabular-nums text-slate-900">
                  {params.keyframeNodes} nodes
                </span>
              </div>
              <input
                id="param-kf-nodes"
                type="range"
                min={30}
                max={400}
                step={10}
                value={params.keyframeNodes}
                onChange={(e) => onUpdateParam('keyframeNodes', Number(e.target.value))}
                className="w-full accent-blue-600 cursor-pointer"
              />
            </div>

            <div>
              <div className="flex justify-between text-xs font-medium text-slate-700 mb-1">
                <label htmlFor="param-edges">Odometry + Loop Closure Edges (E)</label>
                <span className="font-mono tabular-nums text-slate-900">
                  {params.loopClosureEdges} edges
                </span>
              </div>
              <input
                id="param-edges"
                type="range"
                min={60}
                max={1200}
                step={30}
                value={params.loopClosureEdges}
                onChange={(e) => onUpdateParam('loopClosureEdges', Number(e.target.value))}
                className="w-full accent-blue-600 cursor-pointer"
              />
            </div>
          </div>
        </div>

        <div className="lg:col-span-8 bg-white border border-slate-200 rounded-xl p-6 space-y-6">
          <div className="border-b border-slate-100 pb-4">
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <span>Selected Module</span>
              <span aria-hidden="true">·</span>
              <span className="font-mono">
                {MODULE_ORDER.find((m) => m.id === activeModule)?.shortApi}
              </span>
            </div>
            <h3 className="text-xl font-bold text-slate-900 mt-1">{activeMetrics.title}</h3>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 py-3 border-b border-slate-100">
            <div>
              <p className="text-xs text-slate-500">Official Time Big-O</p>
              <p className="text-sm font-semibold font-mono tabular-nums text-slate-900 mt-1">
                {activeMetrics.timeBigO}
              </p>
            </div>
            <div>
              <p className="text-xs text-slate-500">Official Space Big-O</p>
              <p className="text-sm font-semibold font-mono tabular-nums text-emerald-700 mt-1">
                {activeMetrics.spaceBigO}
              </p>
            </div>
            <div>
              <p className="text-xs text-slate-500">Algorithmic Speedup</p>
              <p className="text-lg font-bold font-mono tabular-nums text-blue-600 mt-0.5">
                {activeMetrics.speedupFactor.toFixed(2)}x faster
              </p>
            </div>
            <div>
              <p className="text-xs text-slate-500">Peak Frame Buffer</p>
              <p className="text-sm font-semibold font-mono tabular-nums text-slate-900 mt-1">
                {activeMetrics.peakMemoryMbOptimized} MB{' '}
                <span className="text-xs font-normal text-slate-500">
                  (vs {activeMetrics.peakMemoryMbNaive} MB)
                </span>
              </p>
            </div>
          </div>

          <div className="space-y-4 text-sm leading-relaxed text-slate-700">
            <div>
              <h4 className="text-xs font-semibold text-slate-900">
                Asymptotic Complexity Derivation
              </h4>
              <p className="mt-1 text-slate-600">{activeMetrics.theoreticalDerivation}</p>
            </div>

            <div className="pt-3 border-t border-slate-100">
              <h4 className="text-xs font-semibold text-rose-700">
                Common Memory Leak &amp; Bottleneck Root Cause (Eliminated)
              </h4>
              <p className="mt-1 text-slate-600">{activeMetrics.memoryLeakRootCause}</p>
            </div>

            <div className="pt-3 border-t border-slate-100">
              <h4 className="text-xs font-semibold text-emerald-700">
                Official Open3D Tensor (`o3d.t`) &amp; PyTorch 2.x Solution
              </h4>
              <p className="mt-1 text-slate-600 font-mono text-xs bg-slate-50 p-3 rounded-lg border border-slate-200/80">
                {activeMetrics.officialApiSolution}
              </p>
            </div>
          </div>

          <div className="pt-2">
            <h4 className="text-xs font-semibold text-slate-900 mb-3">
              Complete SLAM Pipeline Sub-Module Complexity Matrix
            </h4>
            <div className="overflow-x-auto border border-slate-200 rounded-lg">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-600">
                    <th className="py-2.5 px-3 font-semibold">Sub-Module</th>
                    <th className="py-2.5 px-3 font-semibold">Optimized Time Big-O</th>
                    <th className="py-2.5 px-3 font-semibold">Optimized Space Big-O</th>
                    <th className="py-2.5 px-3 font-semibold text-right">Est. FLOPs / Ops</th>
                    <th className="py-2.5 px-3 font-semibold text-right">Speedup</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {MODULE_ORDER.map(({ id, label }) => {
                    const m = metricsMap[id];
                    const isRowActive = id === activeModule;
                    return (
                      <tr
                        key={id}
                        onClick={() => onSelectModule(id)}
                        className={`cursor-pointer transition-colors ${
                          isRowActive ? 'bg-blue-50/60 font-medium' : 'hover:bg-slate-50'
                        }`}
                      >
                        <td className="py-2.5 px-3 text-slate-900">{label}</td>
                        <td className="py-2.5 px-3 font-mono tabular-nums text-slate-800">
                          {m.timeBigO}
                        </td>
                        <td className="py-2.5 px-3 font-mono tabular-nums text-emerald-700">
                          {m.spaceBigO}
                        </td>
                        <td className="py-2.5 px-3 font-mono tabular-nums text-right text-slate-700">
                          {m.estimatedOpsOptimized.toLocaleString()}
                        </td>
                        <td className="py-2.5 px-3 font-mono tabular-nums text-right font-semibold text-blue-600">
                          {m.speedupFactor.toFixed(1)}x
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
  );
};
