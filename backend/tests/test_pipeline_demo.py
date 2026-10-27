import os

import pytest


@pytest.mark.skipif(
    os.getenv("SMARTCHAIN_DEMO_FAIL") != "1",
    reason="Enable the Jenkins failure demonstration parameter to run this test.",
)
def test_pipeline_failure_demonstration():
    pytest.fail("Intentional Jenkins demo failure; disable the demo parameter to recover.")
