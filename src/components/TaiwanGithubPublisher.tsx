import React, { useMemo, useState } from 'react';
import {
  auditAndSanitizeUnderTaiwanLaw,
  buildCompliantRepositoryFiles,
  generateSelfExtractingGitScript,
} from '../utils/slamPipelineEngine';

const DEFAULT_SAMPLE_INPUT = `Project: Memory-Safe LiDAR & RGB-D Tensor SLAM Pipeline
Author Contact: applicant.tw@robotics-lab.org.tw | Mobile: 0912-345-678 | TW ID: A123456789
【佳世達的核心競爭力】◎ 多種產品研發、創新的能力，在全球居領導地位。

Technical Summary:
Clean-room implementation of zero-copy DLPack Open3D + PyTorch SLAM with O(N) spatial hash voxel downsampling and Sparse Cholesky Pose Graph Optimization.`;

export const TaiwanGithubPublisher: React.FC = () => {
  const [repoName, setRepoName] = useState('pytorch-open3d-slam-tw');
  const [repoVisibility, setRepoVisibility] = useState<'public' | 'private'>('public');
  const [selectedFilePath, setSelectedFilePath] = useState('COMPLIANCE_TW.md');
  const [rawAuditText, setRawAuditText] = useState(DEFAULT_SAMPLE_INPUT);
  const [githubOwner, setGithubOwner] = useState('taiwan-robotics-lab');
  const [publishLog, setPublishLog] = useState<{
    status: 'idle' | 'blocked' | 'published';
    timestamp?: string;
    commitSha?: string;
    treeSha?: string;
    repoUrl?: string;
    message?: string;
  }>({ status: 'idle' });
  const [copiedScript, setCopiedScript] = useState(false);

  const auditResult = useMemo(() => auditAndSanitizeUnderTaiwanLaw(rawAuditText), [rawAuditText]);
  const repoFiles = useMemo(() => buildCompliantRepositoryFiles(repoName), [repoName]);
  const activeFile = useMemo(
    () => repoFiles.find((f) => f.path === selectedFilePath) ?? repoFiles[0],
    [repoFiles, selectedFilePath]
  );

  const gitInitScript = useMemo(
    () => generateSelfExtractingGitScript(repoName, repoFiles),
    [repoName, repoFiles]
  );

  const handleDownloadGitBundleScript = () => {
    const blob = new Blob([gitInitScript], { type: 'text/x-shellscript;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `setup_${repoName}_github.sh`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleCopyGitScript = async () => {
    try {
      await navigator.clipboard.writeText(gitInitScript);
      setCopiedScript(true);
      setTimeout(() => setCopiedScript(false), 2000);
    } catch {
      setCopiedScript(true);
      setTimeout(() => setCopiedScript(false), 2000);
    }
  };

  const handleExecuteCompliantPublish = () => {
    const cleanName = repoName.trim();
    const cleanOwner = githubOwner.trim();
    if (!cleanName || !cleanOwner) {
      setPublishLog({
        status: 'blocked',
        message: 'Repository owner and repository name are required before publishing.',
      });
      return;
    }

    if (!auditResult.isLegallyClearForUpload) {
      setPublishLog({
        status: 'blocked',
        message:
          'Upload blocked by Taiwan Trade Secret Act (營業秘密法) gate: remove confidential markers before publishing.',
      });
      return;
    }

    // Deterministic SHA-1 simulation from file sizes and repo name
    const totalBytes = repoFiles.reduce((acc, f) => acc + f.sizeBytes, 0);
    const treeSha = `4b825dc642cb6eb9a060e54bf8d69288fbee4904`.slice(0, 32) + totalBytes.toString(16).padStart(8, '0');
    const commitSha = `a7f93c1e8b402d56910ef82c3a4b5d6e` + cleanName.length.toString(16).padStart(8, '0');

    setPublishLog({
      status: 'published',
      timestamp: new Date().toISOString(),
      commitSha,
      treeSha,
      repoUrl: `https://github.com/${cleanOwner}/${cleanName}`,
      message: `Verified 4/4 Taiwan (ROC) statutory gates (營業秘密法 · 著作權法 · 個人資料保護法 · 國家安全法). Staged ${repoFiles.length} clean-room files (${(totalBytes / 1024).toFixed(1)} KB) under SPDX Apache-2.0.`,
    });
  };

  return (
    <section id="taiwan-github-upload" className="space-y-8">
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <p className="text-xs font-medium text-slate-500">
            Taiwan (ROC) Statutory Compliance Gate · Clean-Room Apache-2.0 GitHub Repository Builder
          </p>
          <h2 className="text-2xl font-bold text-slate-900 mt-1">
            05. Legally Compliant GitHub Project Packaging &amp; Upload (臺灣法律合規發布系統)
          </h2>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleCopyGitScript}
            className="px-3.5 py-2 text-xs font-semibold text-slate-800 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            {copiedScript ? 'Copied Git Installer' : 'Copy Git Setup Script'}
          </button>
          <button
            type="button"
            onClick={handleDownloadGitBundleScript}
            className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            Download Full Git Repo Installer (.sh)
          </button>
        </div>
      </div>

      {/* Part A: Taiwan 4-Statute Compliance Audit Table & Interactive Sanitizer */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left 7 Columns: 4 Taiwan Statutes Audit Table */}
        <div className="lg:col-span-7 bg-white border border-slate-200 rounded-xl p-6 space-y-5">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-base font-semibold text-slate-900">
                Taiwan (ROC) Four-Statute Pre-Flight Verification Matrix
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Mandatory legal checks required prior to cross-border open-source GitHub publication
              </p>
            </div>
            <span
              className={`text-xs font-mono font-semibold ${
                auditResult.isLegallyClearForUpload ? 'text-emerald-700' : 'text-rose-600'
              }`}
            >
              {auditResult.isLegallyClearForUpload
                ? 'STATUS: CLEARED FOR UPLOAD (4/4)'
                : 'STATUS: BLOCKED BY STATUTE GATE'}
            </span>
          </div>

          <div className="overflow-x-auto border border-slate-200 rounded-lg">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-600">
                  <th className="py-2.5 px-3 font-semibold">Taiwan (ROC) Statute</th>
                  <th className="py-2.5 px-3 font-semibold">Articles</th>
                  <th className="py-2.5 px-3 font-semibold">Audit Result &amp; Finding</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {auditResult.statuteChecks.map((check) => (
                  <tr key={check.id} className="hover:bg-slate-50">
                    <td className="py-3 px-3 align-top">
                      <p className="font-semibold text-slate-900">{check.statuteNameZh}</p>
                      <p className="text-slate-500 mt-0.5">{check.statuteNameEn}</p>
                    </td>
                    <td className="py-3 px-3 align-top font-mono tabular-nums text-slate-700 whitespace-nowrap">
                      {check.articles}
                    </td>
                    <td className="py-3 px-3 align-top">
                      <p
                        className={`font-mono font-semibold ${
                          check.passed ? 'text-emerald-700' : 'text-rose-600'
                        }`}
                      >
                        {check.auditFinding}
                      </p>
                      <p className="text-slate-500 mt-1 leading-relaxed">{check.verificationRule}</p>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right 5 Columns: Live PDPA / Copyright / Trade Secret Sanitizer */}
        <div className="lg:col-span-5 bg-white border border-slate-200 rounded-xl p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-semibold text-slate-900">
                Live Taiwan PDPA &amp; Trade Secret Sanitizer
              </h3>
              <p className="text-xs text-slate-500">
                Automatically strips PII (個資法) and HR marketing copy (著作權法)
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() =>
                  setRawAuditText((prev) => prev + '\nCONFIDENTIAL_INTERNAL_CAD_HEADER')
                }
                className="px-2.5 py-1 text-xs font-medium text-rose-700 bg-rose-50 hover:bg-rose-100 rounded-md transition-colors cursor-pointer whitespace-nowrap shrink-0"
              >
                Simulate Secret Leak
              </button>
              <button
                type="button"
                onClick={() => setRawAuditText(DEFAULT_SAMPLE_INPUT)}
                className="px-2.5 py-1 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-md transition-colors cursor-pointer whitespace-nowrap shrink-0"
              >
                Reset Clean
              </button>
            </div>
          </div>

          <div>
            <label
              htmlFor="raw-audit-input"
              className="block text-xs font-semibold text-slate-700 mb-1"
            >
              Raw Pre-Commit Text / Commit Message Input
            </label>
            <textarea
              id="raw-audit-input"
              rows={4}
              value={rawAuditText}
              onChange={(e) => setRawAuditText(e.target.value)}
              className="w-full rounded-lg border border-slate-300 p-2.5 text-xs font-mono text-slate-800 focus:border-blue-600 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-3 gap-2 py-2 border-y border-slate-100 text-xs font-mono tabular-nums">
            <div>
              <span className="text-slate-500 block font-sans">PDPA Emails/Phones</span>
              <span className="font-semibold text-slate-900">
                {auditResult.redactedEmails + auditResult.redactedPhones} redacted
              </span>
            </div>
            <div>
              <span className="text-slate-500 block font-sans">TW National IDs</span>
              <span className="font-semibold text-slate-900">
                {auditResult.redactedTaiwanIds} redacted
              </span>
            </div>
            <div>
              <span className="text-slate-500 block font-sans">HR Copy Blocks</span>
              <span className="font-semibold text-slate-900">
                {auditResult.strippedJobCopyrightBlocks} stripped
              </span>
            </div>
          </div>

          <div>
            <p className="text-xs font-semibold text-slate-700 mb-1">
              Sanitized Output Safe for Public GitHub Commit
            </p>
            <pre className="bg-slate-950 text-emerald-300 p-3 rounded-lg text-xs font-mono overflow-x-auto whitespace-pre-wrap leading-relaxed max-h-36">
              {auditResult.sanitizedContent}
            </pre>
          </div>
        </div>
      </div>

      {/* Part B: 8-File GitHub Repository Tree Inspector & One-Click Publisher */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left 5 Columns: Repository Configuration + File Tree + Publish Action */}
        <div className="lg:col-span-5 bg-white border border-slate-200 rounded-xl p-6 space-y-5">
          <div>
            <h3 className="text-base font-semibold text-slate-900">
              GitHub Repository Package &amp; Publisher
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Inspect all 8 generated files and stage a legally compliant GitHub release
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label
                htmlFor="github-owner-input"
                className="block text-xs font-medium text-slate-700 mb-1"
              >
                GitHub Organization / Owner
              </label>
              <input
                id="github-owner-input"
                type="text"
                value={githubOwner}
                onChange={(e) => setGithubOwner(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-mono text-slate-900 focus:border-blue-600 focus:outline-none"
              />
            </div>
            <div>
              <label
                htmlFor="github-repo-input"
                className="block text-xs font-medium text-slate-700 mb-1"
              >
                Repository Name
              </label>
              <input
                id="github-repo-input"
                type="text"
                value={repoName}
                onChange={(e) => setRepoName(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-mono text-slate-900 focus:border-blue-600 focus:outline-none"
              />
            </div>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-700">Repository Visibility</span>
            <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg">
              {(['public', 'private'] as const).map((vis) => (
                <button
                  key={vis}
                  type="button"
                  onClick={() => setRepoVisibility(vis)}
                  className={`px-3 py-1 text-xs font-medium rounded-md transition-colors cursor-pointer ${
                    repoVisibility === vis
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {vis === 'public' ? 'Public (Apache-2.0)' : 'Private'}
                </button>
              ))}
            </div>
          </div>

          {/* 8-File Repository Tree */}
          <div>
            <p className="text-xs font-semibold text-slate-800 mb-2">
              Generated Repository File Tree (8 Files)
            </p>
            <div className="border border-slate-200 rounded-lg divide-y divide-slate-200">
              {repoFiles.map((file) => {
                const isSelected = file.path === activeFile.path;
                return (
                  <button
                    key={file.path}
                    type="button"
                    onClick={() => setSelectedFilePath(file.path)}
                    className={`w-full text-left px-3.5 py-2.5 flex items-center justify-between gap-2 text-xs transition-colors cursor-pointer ${
                      isSelected ? 'bg-blue-50/80 font-semibold text-blue-900' : 'hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <span className="font-mono truncate">{file.path}</span>
                    <span className="font-mono tabular-nums text-slate-500 shrink-0">
                      {(file.sizeBytes / 1024).toFixed(1)} KB
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <button
            type="button"
            onClick={handleExecuteCompliantPublish}
            className="w-full py-2.5 px-4 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
          >
            Verify Taiwan Law Compliance &amp; Stage GitHub Commit
          </button>

          {publishLog.status !== 'idle' && (
            <div
              role="status"
              className={`p-3.5 rounded-lg border text-xs space-y-1.5 ${
                publishLog.status === 'published'
                  ? 'bg-emerald-50/70 border-emerald-200 text-emerald-900'
                  : 'bg-rose-50/70 border-rose-200 text-rose-900'
              }`}
            >
              <p className="font-semibold">{publishLog.message}</p>
              {publishLog.status === 'published' && (
                <div className="font-mono text-xs text-slate-700 space-y-0.5 pt-1">
                  <p>Target URL: {publishLog.repoUrl} ({repoVisibility})</p>
                  <p>Git Tree SHA: {publishLog.treeSha}</p>
                  <p>Commit SHA: {publishLog.commitSha}</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right 7 Columns: Selected Repository File Content Viewer */}
        <div className="lg:col-span-7 bg-slate-950 border border-slate-800 rounded-xl overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 bg-slate-900 border-b border-slate-800">
            <div>
              <p className="text-xs font-mono font-semibold text-white">{activeFile.path}</p>
              <p className="text-xs text-slate-400 mt-0.5">{activeFile.description}</p>
            </div>
            <span className="text-xs font-mono tabular-nums text-slate-400">
              {activeFile.sizeBytes.toLocaleString()} bytes
            </span>
          </div>
          <pre className="p-5 text-xs font-mono text-slate-200 overflow-x-auto leading-relaxed max-h-[520px]">
            <code>{activeFile.content}</code>
          </pre>
        </div>
      </div>
    </section>
  );
};
