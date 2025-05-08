import subprocess
import sys
import os

# Print banner
print("=" * 50)
print("Starting FastAPI Backend Server")
print("=" * 50)

# Change to the backend directory
os.chdir("backend")

# Run uvicorn directly using the Python interpreter
try:
    result = subprocess.run(
        [sys.executable, "-m", "uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000", "--reload"],
        check=True,
    )
    print(f"Server exited with code {result.returncode}")
except KeyboardInterrupt:
    print("Server stopped by user")
except Exception as e:
    print(f"Error starting server: {e}")