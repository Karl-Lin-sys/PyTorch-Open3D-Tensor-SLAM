/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useMemo, useState } from 'react';
import {
  computeSubModuleComplexity,
  MemorySafeguardConfig,
  OFFICIAL_PYTHON_SLAM_CODE,
  runDeterministicPgoSimulation,
  simulateMemoryProfile,
  SlamSubModuleId,
  SlamWorkloadParams,
} from './utils/slamPipelineEngine';
import { SubModuleInspector } from './components/SubModuleInspector';
import { LiveSlamSandbox } from './components/LiveSlamSandbox';
import { PythonCodeViewer } from './components/PythonCodeViewer';
import { TaiwanGithubPublisher } from './components/TaiwanGithubPublisher';

const DEFAULT_PARAMS: SlamWorkloadParams = {
  rawPointCount: 120000,
  downsampledVoxelCount: 12000,
  descriptorDim: 32,
  icpIterations: 15,
  keyframeNodes: 120,
  loopClosureEdges: 360,
  lmIterations: 20,
};

const DEFAULT_SAFEGUARDS: MemorySafeguardConfig = {
  dlpackZeroCopy: true,
  torchInferenceMode: true,
  boundedKeyframeRingBuffer: true,
  preallocatedKdTreeBuffer: true,
  sparseCholeskyPgo: true,
};

export default function App() {
  const [params, setParams] = useState<SlamWorkloadParams>(DEFAULT_PARAMS);
  const [activeModule, setActiveModule] = useState<SlamSubModuleId>('feature_extraction');
  const [safeguards, setSafeguards] = useState<MemorySafeguardConfig>(DEFAULT_SAFEGUARDS);
  const [driftNoiseStd, setDriftNoiseStd] = useState<number>(0.08);
  const [loopClosureStrength, setLoopClosureStrength] = useState<number>(0.88);

  const metricsMap = useMemo(() => computeSubModuleComplexity(params), [params]);
  const memoryStats = useMemo(
    () => simulateMemoryProfile(params, safeguards, 60),
    [params, safeguards]
  );
  const pgoResult = useMemo(
    () => runDeterministicPgoSimulation(24, driftNoiseStd, loopClosureStrength),
    [driftNoiseStd, loopClosureStrength]
  );

  const handleUpdateParam = (key: keyof SlamWorkloadParams, value: number) => {
    setParams((prev) => ({ ...prev, [key]: value }));
  };

  const handleResetParams = () => {
    setParams(DEFAULT_PARAMS);
  };

  const handleToggleSafeguard = (key: keyof MemorySafeguardConfig) => {
    setSafeguards((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleEnableAllSafeguards = () => {
    setSafeguards(DEFAULT_SAFEGUARDS);
  };

  const handleDownloadPythonFile = () => {
    const blob = new Blob([OFFICIAL_PYTHON_SLAM_CODE], { type: 'text/x-python;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'slam_pipeline_o3d_torch.py';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
      {/* Strict 3-Zone Top Bar Contract */}
      <header className="sticky top-0 z-30 flex items-center justify-between gap-8 px-6 py-4 bg-white/95 backdrop-blur-xs border-b border-slate-200">
        <a
          href="#top"
          className="text-lg font-bold text-slate-900 font-display whitespace-nowrap shrink-0"
        >
          PyTorch &amp; Open3D Tensor SLAM
        </a>

        <nav
          aria-label="Primary Navigation"
          className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-600"
        >
          <a
            href="#submodules"
            className="hover:text-slate-900 hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0"
          >
            Sub-Modules &amp; Big-O
          </a>
          <a
            href="#memory-profiler"
            className="hover:text-slate-900 hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0"
          >
            Memory Profiler
          </a>
          <a
            href="#pgo-sandbox"
            className="hover:text-slate-900 hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0"
          >
            Pose Graph Sandbox
          </a>
          <a
            href="#python-reference"
            className="hover:text-slate-900 hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0"
          >
            Python Reference
          </a>
          <a
            href="#taiwan-github-upload"
            className="hover:text-slate-900 hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0"
          >
            Taiwan GitHub Upload
          </a>
        </nav>

        <div className="flex items-center shrink-0">
          <button
            type="button"
            onClick={handleDownloadPythonFile}
            className="px-4 py-2 text-xs font-semibold text-white bg-slate-900 rounded-lg hover:bg-slate-800 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            Download .py Pipeline
          </button>
        </div>
      </header>

      {/* Main Content Container */}
      <main id="top" className="flex-1 max-w-7xl w-full mx-auto px-6 py-10 space-y-14">
        {/* Hero Overview Banner */}
        <section className="bg-white border border-slate-200 rounded-xl p-8 space-y-6">
          <div className="max-w-3xl space-y-3">
            <div className="flex items-center gap-2 text-xs font-medium text-slate-500">
              <span>Open3D 0.18+ Tensor API (open3d.t)</span>
              <span aria-hidden="true">·</span>
              <span>PyTorch 2.x DLPack Bridge</span>
              <span aria-hidden="true">·</span>
              <span>Taiwan (ROC) Law Compliant GitHub Package</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold text-slate-900">
              Memory-Safe LiDAR &amp; RGB-D SLAM Architecture with Asymptotic Big-O Proofs
            </h1>
            <p className="text-base text-slate-600 leading-relaxed">
              A production reference workbench implementing zero-copy GPU tensor sharing between{' '}
              <code className="text-xs bg-slate-100 px-1.5 py-0.5 rounded">
                o3d.t.geometry.PointCloud
              </code>{' '}
              and PyTorch via{' '}
              <code className="text-xs bg-slate-100 px-1.5 py-0.5 rounded">
                torch.utils.dlpack
              </code>
              , pre-indexed hybrid KD-Tree data association, sliding-window Sparse Cholesky Pose
              Graph Optimization, and a Taiwan (ROC) legally compliant GitHub repository bundler.
            </p>
          </div>

          {/* 4-Column Executive Summary Strip */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 pt-6 border-t border-slate-200">
            <div>
              <p className="text-xs text-slate-500">01. Feature Extraction Time</p>
              <p className="text-base font-bold font-mono tabular-nums text-slate-900 mt-1">
                {metricsMap.feature_extraction.timeBigO}
              </p>
              <p className="text-xs text-slate-500 mt-0.5">
                O(1) DLPack pointer transfer (0 host copies)
              </p>
            </div>
            <div>
              <p className="text-xs text-slate-500">02. Data Association Time</p>
              <p className="text-base font-bold font-mono tabular-nums text-slate-900 mt-1">
                {metricsMap.data_association.timeBigO}
              </p>
              <p className="text-xs text-slate-500 mt-0.5">
                Pre-built o3d.core.nns hybrid spatial index
              </p>
            </div>
            <div>
              <p className="text-xs text-slate-500">03. Pose Graph Optimization</p>
              <p className="text-base font-bold font-mono tabular-nums text-slate-900 mt-1">
                {metricsMap.pose_graph_optimization.timeBigO}
              </p>
              <p className="text-xs text-slate-500 mt-0.5">
                Levenberg-Marquardt with Line Process pruning
              </p>
            </div>
            <div>
              <p className="text-xs text-slate-500">Taiwan Legal GitHub Audit</p>
              <p className="text-base font-bold font-mono tabular-nums text-emerald-700 mt-1">
                4/4 Statutes Passed
              </p>
              <p className="text-xs text-slate-500 mt-0.5">
                營業秘密法 · 著作權法 · 個資法 · 國安法
              </p>
            </div>
          </div>
        </section>

        {/* Sub-Module Big-O Inspector */}
        <SubModuleInspector
          params={params}
          onUpdateParam={handleUpdateParam}
          onResetParams={handleResetParams}
          activeModule={activeModule}
          onSelectModule={setActiveModule}
          metricsMap={metricsMap}
        />

        {/* Memory Leak Profiler & Pose Graph Sandbox */}
        <LiveSlamSandbox
          safeguards={safeguards}
          onToggleSafeguard={handleToggleSafeguard}
          onEnableAllSafeguards={handleEnableAllSafeguards}
          memoryStats={memoryStats}
          pgoResult={pgoResult}
          driftNoiseStd={driftNoiseStd}
          loopClosureStrength={loopClosureStrength}
          onUpdatePgoParams={(drift, loop) => {
            setDriftNoiseStd(drift);
            setLoopClosureStrength(loop);
          }}
        />

        {/* Full Official Python Code Viewer */}
        <PythonCodeViewer onDownloadCode={handleDownloadPythonFile} />

        {/* Taiwan Legal Compliance & GitHub Repository Publisher */}
        <TaiwanGithubPublisher />
      </main>

      {/* Quiet Footer */}
      <footer className="border-t border-slate-200 bg-white px-6 py-5 mt-12">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <span>
            PyTorch 2.x &amp; Open3D 0.18+ Tensor SLAM Reference Workbench · Clean-Room Apache-2.0 · Taiwan (ROC) Compliant
          </span>
          <a
            href="#top"
            className="hover:text-slate-900 underline underline-offset-4 transition-colors"
          >
            Back to Top
          </a>
        </div>
      </footer>
    </div>
  );
}
