import os
import sys

# IMPORTANT: Set Mirror URL *BEFORE* importing huggingface_hub
# This ensures libraries use the mirror immediately upon loading
os.environ["HF_ENDPOINT"] = "https://hf-mirror.com"

try:
    from huggingface_hub import snapshot_download
except ImportError:
    print("Please install huggingface_hub first:")
    print("pip install huggingface_hub")
    sys.exit(1)

# Define the local cache directory
# IMPORTANT: Must include 'hub' to match Docker's HF_HOME structure
local_cache_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), "models", "cache", "huggingface", "hub")

print(f"🚀 Starting manual download to: {local_cache_dir}")
print(f"Using Mirror: {os.environ['HF_ENDPOINT']} (Should be much faster!)")
print("This will show a progress bar. Please wait...")

# Download the main Docling models repo
try:
    snapshot_download(
        repo_id="ds4sd/docling-models",
        cache_dir=local_cache_dir,
        resume_download=True
    )
    print("\n✅ Download Complete! You can now restart the Docker container.")
except Exception as e:
    print(f"\n❌ Download Failed: {e}")
