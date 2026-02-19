from pymongo import MongoClient

def connectBD():
    MONGO_URI = "mongodb+srv://<user>:<pass>@abrildb.wrvdbre.mongodb.net/?retryWrites=true&w=majority&appName=abrildb"
    client = MongoClient(MONGO_URI)

    db = client["calendar"]
    return db