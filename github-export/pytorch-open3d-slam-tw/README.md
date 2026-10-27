# pytorch-open3d-slam-tw

Memory-Safe LiDAR & RGB-D Tensor SLAM Pipeline in PyTorch 2.x and Open3D 0.18+ with Big-O Complexity Proofs, NIST CSF 2.0 Security, and Taiwan (ROC) Legal Compliance.

## Overview
This repository provides a clean-room, production-grade LiDAR and RGB-D SLAM Pipeline built strictly on the official PyTorch 2.x and Open3D 0.18+ Tensor (open3d.t) APIs. It eliminates host-device memory copies, PyTorch autograd graph memory leaks, and unbounded point-cloud accumulation.

## Sub-Module Asymptotic Big-O Complexity Summary
- 01. Feature Extraction: Time O(N + V * k_nn + V * D^2), Space O(N + V * D) via zero-copy DLPack.
- 02. Data Association: Time O(V_t log V_t + I * V_s log V_t + V_s * k_c * D), Space O(V_t + V_s) via persistent NNS index.
- 03. Pose Graph Optimization: Time O(L * (E * 6^2 + K^1.5 * 6^3)), Space O(K + E + W * V * D) via Sparse Cholesky & bounded ring buffer.

## Taiwan (ROC) Legal Compliance Declaration
Audited under Taiwan Trade Secret Act (營業秘密法), Copyright Act (著作權法), Personal Data Protection Act (個人資料保護法), and National Security Act (國家安全法). See COMPLIANCE_TW.md and SECURITY.md.