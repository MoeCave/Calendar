from pymongo import MongoClient

def connectBD():
    MONGO_URI = "mongodb+srv://admin:admin123@moisesdb.fv5g2ls.mongodb.net/"
    client = MongoClient(MONGO_URI)

    db = client["calendar"]
    return db