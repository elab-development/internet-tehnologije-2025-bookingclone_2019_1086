from fastapi import FastAPI

# Create a FastAPI instance. The 'app' variable is the main point of interaction to create your API.
app = FastAPI()

# Define a path operation decorator. 
# This tells FastAPI that the function below handles GET requests for the "/" path.
@app.get("/")
def read_root():
    """
    Handles GET requests to the root path and returns a JSON response.
    """
    return {"message": "Hello World"}