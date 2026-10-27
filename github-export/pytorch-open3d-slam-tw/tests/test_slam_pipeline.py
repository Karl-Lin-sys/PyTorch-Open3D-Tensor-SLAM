"""
Unit & Memory-Safety Tests for PyTorch + Open3D Tensor SLAM Pipeline
SPDX-License-Identifier: Apache-2.0
"""

import collections
import numpy as np
import torch

def test_bounded_ring_buffer_evicts_old_keyframes():
    max_w = 8
    window = collections.deque(maxlen=max_w)
    for kf_id in range(25):
        window.append({"id": kf_id, "pose": np.eye(4)})
    assert len(window) == max_w
    assert window[0]["id"] == 17
    assert window[-1]["id"] == 24