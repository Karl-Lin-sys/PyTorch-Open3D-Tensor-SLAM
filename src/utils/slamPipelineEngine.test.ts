import test from 'node:test';
import assert from 'node:assert/strict';
import {
  computeSubModuleComplexity,
  simulateMemoryProfile,
  runDeterministicPgoSimulation,
  SlamWorkloadParams,
  MemorySafeguardConfig,
  auditAndSanitizeUnderTaiwanLaw,
  buildCompliantRepositoryFiles,
  generateSelfExtractingGitScript,
} from './slamPipelineEngine';

const defaultParams: SlamWorkloadParams = {
  rawPointCount: 120000,
  downsampledVoxelCount: 12000,
  descriptorDim: 32,
  icpIterations: 15,
  keyframeNodes: 120,
  loopClosureEdges: 360,
  lmIterations: 20,
};

test('computeSubModuleComplexity calculates valid Big-O metrics and speedup > 1 for all 3 sub-modules', () => {
  const result = computeSubModuleComplexity(defaultParams);

  assert.equal(result.feature_extraction.moduleId, 'feature_extraction');
  assert.equal(result.data_association.moduleId, 'data_association');
  assert.equal(result.pose_graph_optimization.moduleId, 'pose_graph_optimization');

  assert.ok(result.feature_extraction.speedupFactor > 1.0, 'Feature extraction speedup should exceed 1x');
  assert.ok(result.data_association.speedupFactor > 10.0, 'KD-Tree data association should significantly beat brute-force');
  assert.ok(result.pose_graph_optimization.speedupFactor > 5.0, 'Sparse Cholesky PGO should beat dense Hessian inversion');

  assert.ok(
    result.feature_extraction.peakMemoryMbOptimized < result.feature_extraction.peakMemoryMbNaive,
    'Zero-copy DLPack feature extraction must use less memory than naive copies'
  );
});

test('simulateMemoryProfile produces 0.00 MB/min leak rate when all safeguards are enabled', () => {
  const allSafe: MemorySafeguardConfig = {
    dlpackZeroCopy: true,
    torchInferenceMode: true,
    boundedKeyframeRingBuffer: true,
    preallocatedKdTreeBuffer: true,
    sparseCholeskyPgo: true,
  };

  const safeProfile = simulateMemoryProfile(defaultParams, allSafe, 60);
  assert.equal(safeProfile.leakRateMbPerMin, 0);
  assert.equal(safeProfile.timeline.length, 60);

  const frame20 = safeProfile.timeline[19].optimizedVramMb;
  const frame60 = safeProfile.timeline[59].optimizedVramMb;
  assert.equal(frame20, frame60);
});

test('simulateMemoryProfile detects positive leak rate when safeguards are disabled', () => {
  const leakyConfig: MemorySafeguardConfig = {
    dlpackZeroCopy: false,
    torchInferenceMode: false,
    boundedKeyframeRingBuffer: false,
    preallocatedKdTreeBuffer: false,
    sparseCholeskyPgo: false,
  };

  const leakyProfile = simulateMemoryProfile(defaultParams, leakyConfig, 60);
  assert.ok(leakyProfile.leakRateMbPerMin > 100, 'Disabled safeguards must report high VRAM leak rate');
  assert.ok(
    leakyProfile.timeline[59].naiveLeakingVramMb > leakyProfile.timeline[0].naiveLeakingVramMb * 5,
    'Unbounded SLAM should accumulate memory monotonically across frames'
  );
});

test('runDeterministicPgoSimulation reduces ATE RMSE after Levenberg-Marquardt pose graph optimization', () => {
  const pgo = runDeterministicPgoSimulation(24, 0.09, 0.9);
  assert.equal(pgo.groundTruth.length, 24);
  assert.equal(pgo.noisyOdometry.length, 24);
  assert.equal(pgo.optimizedPoses.length, 24);
  assert.ok(pgo.ateAfterMeters < pgo.ateBeforeMeters, 'Optimized trajectory ATE must be lower than raw odometry ATE');
  assert.ok(pgo.errorReductionPct > 50, 'Loop closure optimization should reduce drift error by > 50%');
});

test('auditAndSanitizeUnderTaiwanLaw redacts Taiwan PDPA PII and strips HR marketing blocks', () => {
  const sampleRaw = [
    'Contact applicant at engineer@example.com or 0912-345-678 (ID: A123456789).',
    '【佳世達的核心競爭力】◎ 多種產品研發、創新的能力',
    '',
    'Clean-room SLAM implementation in PyTorch and Open3D.',
  ].join('\n');

  const audit = auditAndSanitizeUnderTaiwanLaw(sampleRaw);
  assert.equal(audit.isLegallyClearForUpload, true);
  assert.equal(audit.redactedEmails, 1);
  assert.equal(audit.redactedPhones, 1);
  assert.equal(audit.redactedTaiwanIds, 1);
  assert.equal(audit.strippedJobCopyrightBlocks, 1);
  assert.ok(!audit.sanitizedContent.includes('engineer@example.com'));
  assert.ok(!audit.sanitizedContent.includes('A123456789'));
});

test('buildCompliantRepositoryFiles generates all 8 GitHub project files and valid self-extracting git script', () => {
  const files = buildCompliantRepositoryFiles('pytorch-open3d-slam-tw');
  assert.equal(files.length, 8);
  const paths = files.map((f) => f.path);
  assert.ok(paths.includes('README.md'));
  assert.ok(paths.includes('COMPLIANCE_TW.md'));
  assert.ok(paths.includes('SECURITY.md'));
  assert.ok(paths.includes('LICENSE'));
  assert.ok(paths.includes('src/slam_pipeline_o3d_torch.py'));
  assert.ok(paths.includes('tests/test_slam_pipeline.py'));

  const script = generateSelfExtractingGitScript('pytorch-open3d-slam-tw', files);
  assert.ok(script.includes('git init -b main'));
  assert.ok(script.includes('COMPLIANCE_TW.md'));
});
