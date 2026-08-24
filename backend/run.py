import os

import uvicorn
from dotenv import load_dotenv


load_dotenv()

host = os.getenv("BACKEND_HOST", "127.0.0.1")
port = int(os.getenv("BACKEND_PORT", "8000"))


if __name__ == "__main__":
    uvicorn.run(
        "app.main:app",
        host=host,
        port=port,
        reload=True
    )